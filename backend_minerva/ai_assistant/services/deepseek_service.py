"""
DeepSeekService — wrapper LangChain para o modelo DeepSeek.

DeepSeek expõe API OpenAI-compatible, portanto usamos langchain-openai
com base_url apontando para https://api.deepseek.com.

Responsabilidades:
- Chat com histórico conversacional
- Geração de respostas humanizadas
- Interpretação de linguagem natural para SQL
- Reranking de documentos
- Resolução de anáforas

Embeddings continuam usando Google text-embedding-004 (já armazenados
com 768 dims no pgvector — trocar exigiria reindexar toda a base).
"""
import json
import logging
from typing import Any, Dict, List, Optional

from django.conf import settings
from django.core.exceptions import ImproperlyConfigured

logger = logging.getLogger(__name__)


def _get_llm(temperature: float = 0.3, streaming: bool = False):
    """Factory: retorna ChatOpenAI apontando para DeepSeek."""
    try:
        from langchain_openai import ChatOpenAI
    except ImportError:
        raise ImproperlyConfigured(
            "langchain-openai não instalado. Execute: pip install langchain-openai"
        )

    api_key = getattr(settings, 'DEEPSEEK_API_KEY', None)
    if not api_key:
        raise ImproperlyConfigured("DEEPSEEK_API_KEY não configurada nas settings.")

    return ChatOpenAI(
        model=getattr(settings, 'DEEPSEEK_MODEL', 'deepseek-chat'),
        api_key=api_key,
        base_url=getattr(settings, 'DEEPSEEK_API_BASE', 'https://api.deepseek.com'),
        temperature=temperature,
        streaming=streaming,
        max_retries=3,
    )


GABY_PERSONALITY = """
Você é Gaby, a assistente virtual do Sistema Minerva.
Seu papel é ajudar usuários de forma clara, educada, natural e profissional.

REGRAS OBRIGATÓRIAS:
1. NUNCA mencione termos técnicos como SQL, banco de dados, consultas, query, exceção ou processamento
2. NUNCA exponha falhas técnicas ao usuário
3. Sempre responda como uma assistente humana experiente
4. Use linguagem natural, educada, profissional e acolhedora
5. Use emojis com moderação para tornar a conversa mais amigável 😊

FORMATO DE VALORES:
- Valores monetários: R$ X.XXX,XX (formato brasileiro)
- Datas: DD/MM/YYYY (formato brasileiro)
- Percentuais: X,XX%

QUANDO NÃO HOUVER RESULTADOS:
Responda de forma empática:
"Não encontrei informações sobre isso. Pode me dar mais detalhes para que eu possa ajudar melhor?"

SAUDAÇÕES (oi, olá, bom dia, etc):
"Olá! 😊 Eu sou a Gaby, sua assistente virtual do Sistema Minerva.
Posso ajudar você a encontrar informações sobre contratos, orçamentos, funcionários e muito mais.
É só me dizer o que você precisa!"
"""


class DeepSeekService:
    """
    Serviço de chat usando DeepSeek via API OpenAI-compatible.
    Substitui GeminiService para geração de texto/chat.
    Embeddings ainda são gerados pelo GeminiService (Google text-embedding-004).
    """

    def __init__(self, temperature: float = 0.3):
        self.llm = _get_llm(temperature=temperature)
        self.llm_low_temp = _get_llm(temperature=0.1)   # para SQL / consultas críticas

    # ------------------------------------------------------------------
    # Resposta simples
    # ------------------------------------------------------------------
    def generate_response(self, prompt: str, system_instruction: str = None) -> Dict[str, Any]:
        from langchain_core.messages import HumanMessage, SystemMessage
        try:
            messages = []
            if system_instruction:
                messages.append(SystemMessage(content=system_instruction))
            messages.append(HumanMessage(content=prompt))

            response = self.llm.invoke(messages)
            return {
                'success': True,
                'content': response.content,
                'model': getattr(settings, 'DEEPSEEK_MODEL', 'deepseek-chat'),
            }
        except Exception as exc:
            logger.error("DeepSeekService.generate_response error: %s", exc)
            return {'success': False, 'error': str(exc), 'content': None}

    # ------------------------------------------------------------------
    # Resposta com RAG context
    # ------------------------------------------------------------------
    def generate_response_with_context(
        self,
        prompt: str,
        context_documents: List[str],
        system_instruction: str = None,
        chat_history: List[Dict] = None,
    ) -> Dict[str, Any]:
        from langchain_core.messages import HumanMessage, SystemMessage, AIMessage
        from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder

        try:
            context_str = "\n\n---\n\n".join(context_documents) if context_documents else ""

            rag_template = ChatPromptTemplate.from_messages([
                ("system", """{system_instruction}

CONTEXTO RELEVANTE DO SISTEMA:
{context}

Use o contexto acima para responder quando relevante. Cite a fonte quando usar o contexto."""),
                MessagesPlaceholder(variable_name="chat_history", optional=True),
                ("human", "{question}"),
            ])

            history_messages = []
            if chat_history:
                for msg in chat_history[-10:]:
                    if msg.get('role') == 'user':
                        history_messages.append(HumanMessage(content=msg['content']))
                    elif msg.get('role') == 'assistant':
                        history_messages.append(AIMessage(content=msg['content']))

            chain = rag_template | self.llm
            response = chain.invoke({
                "system_instruction": system_instruction or GABY_PERSONALITY,
                "context": context_str,
                "chat_history": history_messages,
                "question": prompt,
            })

            return {
                'success': True,
                'content': response.content,
                'context_used': len(context_documents),
                'model': getattr(settings, 'DEEPSEEK_MODEL', 'deepseek-chat'),
            }
        except Exception as exc:
            logger.error("DeepSeekService.generate_response_with_context error: %s", exc)
            return {'success': False, 'error': str(exc), 'content': None}

    # ------------------------------------------------------------------
    # Interpretação de linguagem natural → SQL
    # ------------------------------------------------------------------
    def interpret_natural_language_query(
        self,
        user_question: str,
        schema_info: str,
        few_shot_examples: str = "",
        context_documents: Optional[List[Dict]] = None,
        chat_history: List[Dict] = None,
    ) -> Dict[str, Any]:
        from langchain_core.messages import HumanMessage, AIMessage
        from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder

        context_section = ""
        if context_documents:
            context_lines = []
            for doc in context_documents:
                title = doc.get('title', '')
                content = (doc.get('content', '') or '')[:500]
                doc_type = doc.get('document_type', '')
                context_lines.append(f"[{doc_type}] {title}:\n{content}")
            if context_lines:
                context_section = (
                    "\nDOCUMENTOS DE CONTEXTO RELEVANTES:\n"
                    + "\n---\n".join(context_lines) + "\n"
                )

        few_shot_section = f"\n{few_shot_examples}\n" if few_shot_examples and few_shot_examples.strip() else ""

        from .business_rules import CHAIN_OF_THOUGHT_INSTRUCTION, get_relevant_business_rules
        business_rules_hints = get_relevant_business_rules(user_question)

        system_content = f"""Você é um especialista em interpretar perguntas sobre dados financeiros e gerar SQL.

CONTEXTO DO SISTEMA MINERVA:
- Sistema de gestão de contratos, orçamentos e funcionários
- Banco de dados PostgreSQL
- Tabelas principais: contracts, budgets, employees, budget_lines, etc.

REGRAS:
1. Gere SQL válido para PostgreSQL
2. Use APENAS tabelas e colunas do schema fornecido
3. Somente SELECT é permitido — NUNCA gere INSERT, UPDATE, DELETE, DROP, ALTER
4. Para valores monetários, use formatação brasileira (R$)
5. Para datas, considere formato brasileiro (DD/MM/YYYY)
6. Use LIMIT quando apropriado
7. Use o histórico para resolver referências contextuais

ESQUEMA DO BANCO DE DADOS:
{schema_info}
{context_section}
{few_shot_section}
{CHAIN_OF_THOUGHT_INSTRUCTION}
{business_rules_hints}
FORMATO DE RESPOSTA — JSON válido:
{{
    "intent": "descrição da intenção interpretada",
    "sql": "consulta SQL gerada",
    "explanation": "explicação em português",
    "confidence": 0.0-1.0,
    "tables_used": ["tabelas", "utilizadas"],
    "potential_issues": ["possíveis problemas"]
}}"""

        try:
            prompt_template = ChatPromptTemplate.from_messages([
                ("system", "{system_content}"),
                MessagesPlaceholder(variable_name="chat_history", optional=True),
                ("human", "{question}"),
            ])

            history_messages = []
            if chat_history:
                for msg in chat_history[-8:]:
                    role = msg.get('role', '')
                    content = msg.get('content', '')
                    if role == 'user':
                        history_messages.append(HumanMessage(content=content))
                    elif role == 'assistant':
                        history_messages.append(AIMessage(content=content))

            chain = prompt_template | self.llm_low_temp
            response = chain.invoke({
                "system_content": system_content,
                "chat_history": history_messages,
                "question": f"Interprete e gere SQL:\n{user_question}",
            })

            content = response.content
            if content.startswith('```json'):
                content = content.replace('```json', '').replace('```', '').strip()
            elif content.startswith('```'):
                content = content.replace('```', '').strip()

            parsed = json.loads(content)
            return {
                'success': True,
                'interpretation': parsed,
                'raw_response': response.content,
                'metadata': {'history_messages_used': len(history_messages)},
            }
        except json.JSONDecodeError as exc:
            logger.error("DeepSeekService SQL JSON parse error: %s", exc)
            return {'success': False, 'error': f"JSON inválido: {exc}", 'raw_response': ''}
        except Exception as exc:
            logger.error("DeepSeekService.interpret_natural_language_query error: %s", exc)
            return {'success': False, 'error': str(exc), 'content': None}

    # ------------------------------------------------------------------
    # Humanização de resultado SQL
    # ------------------------------------------------------------------
    def generate_humanized_response(
        self,
        query_result: Any,
        original_question: str,
        sql_query: str,
        context_documents: List[str] = None,
    ) -> Dict[str, Any]:
        system_instruction = GABY_PERSONALITY + """

TAREFA ATUAL:
Transforme os dados fornecidos em uma resposta natural e amigável.
NUNCA mencione que os dados vieram de uma consulta ou banco de dados.
Responda como se você simplesmente soubesse a informação.
"""
        try:
            result_str = json.dumps(list(query_result), default=str, ensure_ascii=False, indent=2)
        except Exception:
            result_str = str(query_result)

        prompt = (
            f"O usuário perguntou: {original_question}\n\n"
            f"Informações disponíveis:\n{result_str}\n\n"
            "Responda de forma natural e amigável, sem mencionar aspectos técnicos."
        )

        if context_documents:
            return self.generate_response_with_context(
                prompt=prompt,
                context_documents=context_documents,
                system_instruction=system_instruction,
            )
        return self.generate_response(prompt, system_instruction)
