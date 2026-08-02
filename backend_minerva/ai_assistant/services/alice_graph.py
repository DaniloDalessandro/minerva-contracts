"""
Alice LangGraph Enterprise — supervisor multi-agente para o Sistema Minerva.

Arquitetura:
    Pergunta
       ↓
    [classify]  ←  classifica a intenção
       ↓
    Router → database_agent | document_agent | rules_agent | system_agent
                            | reports_agent  | general_agent
       ↓
    [validate]  ←  atribui confiança e fonte
       ↓
    Resposta Final

Cada agente especializado responde com:
    - agent_response: str
    - confidence: float (0.0-1.0)
    - source: str ("Banco de Dados", "Documentos", "Regras de Negócio", ...)
    - tools_used: List[str]
"""
import logging
import time
from typing import Any, Dict, List, Optional, TypedDict

from django.conf import settings
from langchain_core.messages import HumanMessage, SystemMessage

logger = logging.getLogger(__name__)


# ─────────────────────────────────────────────────────────────────────────────
# State
# ─────────────────────────────────────────────────────────────────────────────

class AgentState(TypedDict, total=False):
    question: str
    resolved_question: str
    session_id: str
    user: Optional[Any]      # Django user — para controle de permissões
    chat_history: List[Dict[str, str]]
    agent_type: str          # database | document | rules | system | reports | general
    agent_response: str
    confidence: float
    source: str
    tools_used: List[str]
    final_response: str
    error: Optional[str]
    start_time: float


# ─────────────────────────────────────────────────────────────────────────────
# LLM factory
# ─────────────────────────────────────────────────────────────────────────────

def _get_llm(temperature: float = 0.3):
    try:
        from langchain_openai import ChatOpenAI
    except ImportError:
        from langchain_google_genai import ChatGoogleGenerativeAI
        return ChatGoogleGenerativeAI(
            model="gemini-2.5-flash",
            google_api_key=settings.GEMINI_API_KEY,
            temperature=temperature,
        )

    api_key = getattr(settings, 'DEEPSEEK_API_KEY', None)
    if api_key:
        return ChatOpenAI(
            model=getattr(settings, 'DEEPSEEK_MODEL', 'deepseek-chat'),
            api_key=api_key,
            base_url=getattr(settings, 'DEEPSEEK_API_BASE', 'https://api.deepseek.com'),
            temperature=temperature,
            max_retries=3,
        )

    # Fallback: Gemini
    from langchain_google_genai import ChatGoogleGenerativeAI
    return ChatGoogleGenerativeAI(
        model="gemini-2.5-flash",
        google_api_key=settings.GEMINI_API_KEY,
        temperature=temperature,
    )


# ─────────────────────────────────────────────────────────────────────────────
# Node: Classify
# ─────────────────────────────────────────────────────────────────────────────

_CLASSIFY_PROMPT = """Você é um roteador de perguntas. Classifique a pergunta em UMA das categorias:

- database    → perguntas sobre dados do sistema (contratos, orçamentos, funcionários, etc.)
- document    → perguntas sobre documentos, editais, PDFs, manuais, FAQs
- rules       → perguntas sobre regras de negócio, políticas, regulamentos
- system      → perguntas sobre como usar o sistema (funcionalidades, telas, navegação)
- reports     → pedido de relatório ou resumo combinando múltiplas fontes
- general     → saudações, perguntas genéricas, agradecimentos

Responda APENAS com uma dessas palavras exatas, sem explicação:
database | document | rules | system | reports | general

Pergunta: {question}"""


def classify_node(state: AgentState) -> AgentState:
    """Classifica a pergunta e define qual agente usar."""
    question = state.get('resolved_question') or state.get('question', '')
    try:
        llm = _get_llm(temperature=0.0)
        response = llm.invoke([HumanMessage(content=_CLASSIFY_PROMPT.format(question=question))])
        raw = response.content.strip().lower()
        valid = {'database', 'document', 'rules', 'system', 'reports', 'general'}
        agent_type = raw if raw in valid else 'general'
        logger.debug("AliceGraph: '%s' → agent_type=%s", question[:60], agent_type)
    except Exception as exc:
        logger.warning("AliceGraph classify_node error: %s — fallback=database", exc)
        agent_type = 'database'

    return {**state, 'agent_type': agent_type, 'start_time': time.time()}


# ─────────────────────────────────────────────────────────────────────────────
# Node: Database Agent
# ─────────────────────────────────────────────────────────────────────────────

def database_agent_node(state: AgentState) -> AgentState:
    """
    Usa as ferramentas ORM (alice_agent.py) para responder perguntas sobre
    dados do sistema. Respeita PermissionScope — retorna só dados autorizados.
    Fallback para SQLInterpreterService se a ferramenta ReAct não resolver.
    """
    question = state.get('resolved_question') or state.get('question', '')
    user = state.get('user')
    try:
        from .alice_agent import AliceAgentService
        agent = AliceAgentService(user=user)
        result = agent.run(question)
        if result['success'] and result['response']:
            return {
                **state,
                'agent_response': result['response'],
                'confidence': 0.92,
                'source': 'Banco de Dados',
                'tools_used': result.get('tools_used', ['database_tools']),
            }
    except Exception as exc:
        logger.warning("database_agent_node AliceAgentService error: %s", exc)

    # Fallback: SQLInterpreter
    try:
        from ..models import ConversationSession
        from .sql_interpreter import SQLInterpreterService
        session = _get_or_create_temp_session(state.get('session_id'))
        svc = SQLInterpreterService()
        result = svc.interpret_and_execute(question, session)
        if result['success']:
            return {
                **state,
                'agent_response': result['humanized_response'],
                'confidence': 0.85,
                'source': 'Banco de Dados',
                'tools_used': ['sql_interpreter'],
            }
    except Exception as exc:
        logger.error("database_agent_node SQLInterpreter fallback error: %s", exc)

    return {
        **state,
        'agent_response': "Não consegui encontrar essa informação no banco de dados agora. Pode reformular a pergunta?",
        'confidence': 0.30,
        'source': 'Banco de Dados',
        'tools_used': [],
    }


# ─────────────────────────────────────────────────────────────────────────────
# Node: Document Agent (RAG)
# ─────────────────────────────────────────────────────────────────────────────

def document_agent_node(state: AgentState) -> AgentState:
    """Busca em documentos indexados usando RAG híbrido (pgvector + full-text)."""
    question = state.get('resolved_question') or state.get('question', '')
    try:
        from .gemini_service import GeminiService
        from .hybrid_search import HybridSearchService
        from .reranker import RerankerService

        gemini = GeminiService()
        hybrid = HybridSearchService(gemini)
        reranker = RerankerService(gemini)

        query_embedding = gemini.get_embedding(question)
        candidates = hybrid.search(question, query_embedding=query_embedding, limit=20, top_k=10)
        top_docs = reranker.rerank(question, candidates, top_k=5)

        if not top_docs:
            return {
                **state,
                'agent_response': "Não encontrei documentos relevantes para sua pergunta. Pode dar mais detalhes?",
                'confidence': 0.25,
                'source': 'Documentos',
                'tools_used': ['hybrid_search'],
            }

        # Confidence baseada no score médio dos top docs
        avg_score = sum(d.get('rrf_score', 0) or d.get('vector_score', 0) for d in top_docs) / len(top_docs)
        confidence = min(0.95, 0.50 + avg_score * 10)

        context_texts = [f"[{d['document_type']}] {d['title']}:\n{d['content']}" for d in top_docs]
        context_str = "\n\n---\n\n".join(context_texts)

        llm = _get_llm(temperature=0.2)
        system_msg = (
            "Você é Gaby, assistente do Sistema Minerva. Responda em português de forma natural e profissional.\n"
            "Use APENAS as informações do contexto abaixo. Se não souber, diga que não encontrou.\n\n"
            f"CONTEXTO:\n{context_str}"
        )
        response = llm.invoke([
            SystemMessage(content=system_msg),
            HumanMessage(content=question),
        ])

        return {
            **state,
            'agent_response': response.content,
            'confidence': round(confidence, 2),
            'source': 'Documentos',
            'tools_used': ['hybrid_search', 'reranker'],
        }
    except Exception as exc:
        logger.error("document_agent_node error: %s", exc)
        return {
            **state,
            'agent_response': "Não consegui acessar os documentos agora. Tente novamente em instantes.",
            'confidence': 0.20,
            'source': 'Documentos',
            'tools_used': [],
        }


# ─────────────────────────────────────────────────────────────────────────────
# Node: Business Rules Agent
# ─────────────────────────────────────────────────────────────────────────────

def rules_agent_node(state: AgentState) -> AgentState:
    """Responde com base nas regras de negócio definidas no sistema."""
    question = state.get('resolved_question') or state.get('question', '')
    try:
        from .business_rules import BUSINESS_ONTOLOGY, get_relevant_business_rules

        # Busca regras relevantes
        hints = get_relevant_business_rules(question)

        # Busca também documentos BUSINESS_RULE no RAG
        rag_context = []
        try:
            from .gemini_service import GeminiService
            from .embedding_service import EmbeddingService
            svc = EmbeddingService()
            docs = svc.search_similar_documents(question, document_type='BUSINESS_RULE', limit=4, threshold=0.5)
            rag_context = [d['content'] for d in docs]
        except Exception:
            pass

        context = hints
        if rag_context:
            context += "\n\nRegras indexadas:\n" + "\n---\n".join(rag_context)

        if not context.strip():
            return {
                **state,
                'agent_response': "Não encontrei regras específicas sobre isso. Consulte o manual do sistema ou o suporte.",
                'confidence': 0.35,
                'source': 'Regras de Negócio',
                'tools_used': ['business_rules'],
            }

        llm = _get_llm(temperature=0.1)
        system_msg = (
            "Você é Gaby, especialista em regras de negócio do Sistema Minerva. "
            "Responda em português de forma clara e objetiva.\n\n"
            f"REGRAS DE NEGÓCIO RELEVANTES:\n{context}"
        )
        response = llm.invoke([
            SystemMessage(content=system_msg),
            HumanMessage(content=question),
        ])

        return {
            **state,
            'agent_response': response.content,
            'confidence': 0.88,
            'source': 'Regras de Negócio',
            'tools_used': ['business_rules', 'rag_business_rules'],
        }
    except Exception as exc:
        logger.error("rules_agent_node error: %s", exc)
        return {
            **state,
            'agent_response': "Não consegui acessar as regras de negócio. Tente novamente.",
            'confidence': 0.20,
            'source': 'Regras de Negócio',
            'tools_used': [],
        }


# ─────────────────────────────────────────────────────────────────────────────
# Node: System Agent
# ─────────────────────────────────────────────────────────────────────────────

_SYSTEM_KNOWLEDGE = """
O Sistema Minerva é uma plataforma de gestão corporativa com os módulos:

MÓDULOS PRINCIPAIS:
- Colaboradores: cadastro e gestão de funcionários (nome, CPF, cargo, setor, status)
- Setor: estrutura organizacional (Direção → Gerência → Coordenação)
- Centro: centros gestores e solicitantes
- Orçamento: criação e gestão de orçamentos financeiros
- Linhas Orçamentárias: linhas dentro de um orçamento, com valores e saldos
- Contratos: contratos com fornecedores, fiscais, parcelas e aditivos
- Auxílios: auxílios educacionais e assistenciais para colaboradores
- Gaby (Alice): assistente de IA para consultas e análises

FUNCIONALIDADES:
- Dashboard com resumo financeiro
- Geração de relatórios em PDF
- Notificações de vencimento de contratos
- Controle de acesso por nível (Presidente > Diretor > Gerente > Coordenador > Funcionário)
- Compartilhamento de orçamentos e contratos entre usuários
- Sistema de convites para novos usuários
"""


def system_agent_node(state: AgentState) -> AgentState:
    """Responde perguntas sobre funcionalidades e uso do sistema."""
    question = state.get('resolved_question') or state.get('question', '')
    try:
        llm = _get_llm(temperature=0.3)
        system_msg = (
            "Você é Gaby, assistente do Sistema Minerva. "
            "Responda perguntas sobre como usar o sistema de forma clara e amigável.\n\n"
            f"DOCUMENTAÇÃO DO SISTEMA:\n{_SYSTEM_KNOWLEDGE}"
        )
        response = llm.invoke([
            SystemMessage(content=system_msg),
            HumanMessage(content=question),
        ])
        return {
            **state,
            'agent_response': response.content,
            'confidence': 0.82,
            'source': 'Sistema',
            'tools_used': ['system_knowledge'],
        }
    except Exception as exc:
        logger.error("system_agent_node error: %s", exc)
        return {
            **state,
            'agent_response': "Não consegui processar sua pergunta sobre o sistema.",
            'confidence': 0.20,
            'source': 'Sistema',
            'tools_used': [],
        }


# ─────────────────────────────────────────────────────────────────────────────
# Node: Reports Agent
# ─────────────────────────────────────────────────────────────────────────────

def reports_agent_node(state: AgentState) -> AgentState:
    """Combina dados do banco + documentos para gerar relatórios."""
    question = state.get('resolved_question') or state.get('question', '')
    try:
        # Executa tanto o agente de banco quanto o de documentos
        db_state = database_agent_node({**state})
        doc_state = document_agent_node({**state})

        combined = []
        if db_state.get('agent_response'):
            combined.append(f"Dados do sistema:\n{db_state['agent_response']}")
        if doc_state.get('agent_response'):
            combined.append(f"Informações documentais:\n{doc_state['agent_response']}")

        if not combined:
            return {
                **state,
                'agent_response': "Não consegui gerar o relatório. Dados insuficientes.",
                'confidence': 0.30,
                'source': 'Relatórios',
                'tools_used': [],
            }

        llm = _get_llm(temperature=0.2)
        context = "\n\n".join(combined)
        prompt = (
            f"Crie um relatório consolidado respondendo à pergunta do usuário.\n\n"
            f"Pergunta: {question}\n\n"
            f"Dados coletados:\n{context}\n\n"
            "Apresente de forma organizada, clara e em português."
        )
        response = llm.invoke([HumanMessage(content=prompt)])

        avg_confidence = (db_state.get('confidence', 0.5) + doc_state.get('confidence', 0.5)) / 2
        tools = db_state.get('tools_used', []) + doc_state.get('tools_used', [])

        return {
            **state,
            'agent_response': response.content,
            'confidence': round(avg_confidence, 2),
            'source': 'Relatórios',
            'tools_used': list(set(tools)),
        }
    except Exception as exc:
        logger.error("reports_agent_node error: %s", exc)
        return {
            **state,
            'agent_response': "Não consegui gerar o relatório agora. Tente novamente.",
            'confidence': 0.20,
            'source': 'Relatórios',
            'tools_used': [],
        }


# ─────────────────────────────────────────────────────────────────────────────
# Node: General Agent
# ─────────────────────────────────────────────────────────────────────────────

def general_agent_node(state: AgentState) -> AgentState:
    """Fallback para saudações e perguntas gerais."""
    question = state.get('resolved_question') or state.get('question', '')
    try:
        llm = _get_llm(temperature=0.5)
        system_msg = (
            "Você é Gaby, assistente virtual do Sistema Minerva. "
            "Responda de forma amigável e profissional em português. "
            "Se não souber algo específico do sistema, ofereça ajuda geral.\n\n"
            "Capacidades: contratos, orçamentos, funcionários, documentos, regras de negócio."
        )
        chat_history = state.get('chat_history', [])
        from langchain_core.messages import AIMessage
        history_msgs = []
        for msg in chat_history[-6:]:
            if msg['role'] == 'user':
                history_msgs.append(HumanMessage(content=msg['content']))
            else:
                history_msgs.append(AIMessage(content=msg['content']))

        all_msgs = [SystemMessage(content=system_msg)] + history_msgs + [HumanMessage(content=question)]
        response = llm.invoke(all_msgs)

        return {
            **state,
            'agent_response': response.content,
            'confidence': 0.75,
            'source': 'Conhecimento Geral',
            'tools_used': ['general_llm'],
        }
    except Exception as exc:
        logger.error("general_agent_node error: %s", exc)
        return {
            **state,
            'agent_response': "Olá! 😊 Sou a Gaby, assistente do Sistema Minerva. Como posso ajudar?",
            'confidence': 0.60,
            'source': 'Conhecimento Geral',
            'tools_used': [],
        }


# ─────────────────────────────────────────────────────────────────────────────
# Node: Validate & Score
# ─────────────────────────────────────────────────────────────────────────────

def validate_node(state: AgentState) -> AgentState:
    """
    Valida a resposta, aplica disclaimer de incerteza se confidence < limiar,
    e monta a resposta final com metadados.
    """
    confidence = state.get('confidence', 0.5)
    response = state.get('agent_response', '')
    threshold = getattr(settings, 'ALICE_CONFIDENCE_THRESHOLD', 0.70)

    if confidence < threshold and response:
        disclaimer = (
            f"\n\n⚠️ *Nota: Esta resposta tem confiança de {int(confidence * 100)}%. "
            "Pode haver imprecisões — recomendo verificar com o suporte.*"
        )
        response = response + disclaimer

    elapsed = time.time() - state.get('start_time', time.time())
    logger.info(
        "AliceGraph: agent=%s source=%s confidence=%.2f elapsed=%.2fs",
        state.get('agent_type'), state.get('source'), confidence, elapsed,
    )

    return {**state, 'final_response': response}


# ─────────────────────────────────────────────────────────────────────────────
# Router
# ─────────────────────────────────────────────────────────────────────────────

def route_to_agent(state: AgentState) -> str:
    return state.get('agent_type', 'general')


# ─────────────────────────────────────────────────────────────────────────────
# Build LangGraph
# ─────────────────────────────────────────────────────────────────────────────

def _build_graph():
    from langgraph.graph import StateGraph, END

    graph = StateGraph(AgentState)

    # Nodes
    graph.add_node("classify", classify_node)
    graph.add_node("database", database_agent_node)
    graph.add_node("document", document_agent_node)
    graph.add_node("rules", rules_agent_node)
    graph.add_node("system", system_agent_node)
    graph.add_node("reports", reports_agent_node)
    graph.add_node("general", general_agent_node)
    graph.add_node("validate", validate_node)

    # Entry
    graph.set_entry_point("classify")

    # Routing: classify → agent
    graph.add_conditional_edges(
        "classify",
        route_to_agent,
        {
            "database": "database",
            "document": "document",
            "rules": "rules",
            "system": "system",
            "reports": "reports",
            "general": "general",
        },
    )

    # All agents → validate → END
    for node in ["database", "document", "rules", "system", "reports", "general"]:
        graph.add_edge(node, "validate")
    graph.add_edge("validate", END)

    return graph.compile()


# Lazy singleton
_compiled_graph = None


def get_graph():
    global _compiled_graph
    if _compiled_graph is None:
        _compiled_graph = _build_graph()
    return _compiled_graph


# ─────────────────────────────────────────────────────────────────────────────
# Public API
# ─────────────────────────────────────────────────────────────────────────────

class AliceGraphService:
    """
    Serviço principal do agente Alice usando LangGraph.
    Interface pública usada pelas views.
    """

    def __init__(self):
        self._graph = get_graph()
        from .memory_service import MemoryService
        self._memory = MemoryService()

    def run(self, question: str, session_id: str = None, user=None) -> Dict[str, Any]:
        """
        Executa o grafo completo e retorna resposta com metadados.

        Args:
            question: Pergunta do usuário
            session_id: ID da sessão (opcional)
            user: Usuário Django autenticado (para controle de permissões)

        Returns:
            {
              'success': bool,
              'response': str,
              'confidence': float,
              'source': str,
              'agent_type': str,
              'tools_used': List[str],
            }
        """
        try:
            # Resolve anáforas com histórico
            resolved_question = self._resolve_anaphora(question, session_id)

            # Carrega histórico
            chat_history = []
            if session_id:
                chat_history = self._memory.get_history(session_id, limit=10)

            initial_state: AgentState = {
                'question': question,
                'resolved_question': resolved_question,
                'session_id': session_id or '',
                'user': user,
                'chat_history': chat_history,
                'start_time': time.time(),
            }

            final_state = self._graph.invoke(initial_state)

            # Salva no Redis
            if session_id:
                self._memory.save_message(session_id, 'user', question)
                self._memory.save_message(session_id, 'assistant', final_state.get('final_response', ''))

            return {
                'success': True,
                'response': final_state.get('final_response', ''),
                'confidence': final_state.get('confidence', 0.5),
                'source': final_state.get('source', 'Desconhecido'),
                'agent_type': final_state.get('agent_type', 'general'),
                'tools_used': final_state.get('tools_used', []),
            }

        except Exception as exc:
            logger.error("AliceGraphService.run error: %s", exc, exc_info=True)
            try:
                import sentry_sdk
                sentry_sdk.capture_exception(exc)
            except Exception:
                pass
            return {
                'success': False,
                'response': "Desculpe, não consegui processar sua pergunta agora. Pode tentar novamente? 😊",
                'confidence': 0.0,
                'source': 'Erro',
                'agent_type': 'error',
                'tools_used': [],
            }

    def _resolve_anaphora(self, question: str, session_id: Optional[str]) -> str:
        """Tenta resolver referências anafóricas usando histórico."""
        if not session_id:
            return question
        try:
            from ..models import ConversationSession
            from .context_resolver import ContextResolver
            from .gemini_service import GeminiService
            session = ConversationSession.objects.get(session_id=session_id)
            resolver = ContextResolver(GeminiService())
            result = resolver.resolve(question, session)
            return result.resolved_question
        except Exception:
            return question


# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────

def _get_or_create_temp_session(session_id: Optional[str] = None):
    """Retorna sessão existente ou cria sessão temporária para agentes que precisam."""
    try:
        from ..models import ConversationSession
        from django.contrib.auth import get_user_model
        if session_id:
            return ConversationSession.objects.get(session_id=session_id)
    except Exception:
        pass
    return None
