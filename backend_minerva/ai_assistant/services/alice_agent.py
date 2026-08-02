"""
Alice Agent — LangChain ReAct agent com ferramentas reais do sistema Minerva.

O agente decide quais ferramentas usar com base na pergunta do usuário.
Cada ferramenta usa PermissionScope para garantir que somente dados
autorizados para o usuário autenticado sejam retornados.
"""
import logging
from typing import Optional

from langchain_core.tools import tool
from django.conf import settings
from django.utils import timezone
from datetime import timedelta

logger = logging.getLogger(__name__)


# ─────────────────────────────────────────────────────────────────────────────
# LLM factory
# ─────────────────────────────────────────────────────────────────────────────

def _build_llm():
    """Retorna DeepSeek se configurado, senão Gemini como fallback."""
    deepseek_key = getattr(settings, 'DEEPSEEK_API_KEY', None)
    if deepseek_key:
        try:
            from langchain_openai import ChatOpenAI
            return ChatOpenAI(
                model=getattr(settings, 'DEEPSEEK_MODEL', 'deepseek-chat'),
                api_key=deepseek_key,
                base_url=getattr(settings, 'DEEPSEEK_API_BASE', 'https://api.deepseek.com'),
                temperature=0.2,
                max_retries=3,
            )
        except ImportError:
            logger.warning("langchain-openai não disponível, usando Gemini como fallback")

    gemini_key = getattr(settings, 'GEMINI_API_KEY', None)
    if gemini_key:
        from langchain_google_genai import ChatGoogleGenerativeAI
        return ChatGoogleGenerativeAI(
            model="gemini-2.5-flash",
            google_api_key=gemini_key,
            temperature=0.2,
        )
    raise RuntimeError("Nenhuma LLM configurada: defina DEEPSEEK_API_KEY ou GEMINI_API_KEY.")


# ─────────────────────────────────────────────────────────────────────────────
# Scoped tools factory
# Tools criadas por closure para capturar PermissionScope do usuário.
# ─────────────────────────────────────────────────────────────────────────────

def build_scoped_tools(user=None):
    """
    Constrói ferramentas LangChain com o escopo de permissão do usuário embutido.
    Retorna lista de tools já restritas ao que o usuário pode ver.
    """
    from .permission_scope import PermissionScope
    scope = PermissionScope(user)
    scope_desc = scope.describe()
    logger.debug("AliceAgent: construindo ferramentas com escopo: %s", scope_desc)

    @tool
    def get_expiring_contracts(days: int = 30) -> str:
        """
        Retorna contratos ATIVOS que vencem nos próximos N dias (padrão: 30).
        Use esta ferramenta para perguntas como 'quais contratos vencem em 30 dias'.
        """
        today = timezone.now().date()
        deadline = today + timedelta(days=days)

        contracts = scope.contracts().filter(
            status='ATIVO',
            expiration_date__gte=today,
            expiration_date__lte=deadline,
        ).select_related('main_inspector', 'substitute_inspector').order_by('expiration_date')

        if not contracts.exists():
            return f"Nenhum contrato ativo vence nos próximos {days} dias."

        lines = [f"Contratos vencendo nos próximos {days} dias ({contracts.count()} encontrado(s)):"]
        for c in contracts:
            delta = (c.expiration_date - today).days
            inspector_name = c.main_inspector.full_name if c.main_inspector else "Sem fiscal"
            lines.append(
                f"- {c.protocol_number}: {c.description[:60]} | "
                f"Vence em {delta} dia(s) ({c.expiration_date.strftime('%d/%m/%Y')}) | "
                f"Fiscal: {inspector_name} | Valor: R$ {c.current_value:,.2f}"
            )
        return "\n".join(lines)

    @tool
    def get_contracts_without_inspector() -> str:
        """
        Retorna contratos sem fiscal principal ou cujo fiscal não tem e-mail.
        Use para perguntas como 'quais contratos estão sem fiscal'.
        """
        contracts = scope.contracts().filter(
            status='ATIVO',
        ).select_related('main_inspector', 'substitute_inspector')

        problems = []
        for c in contracts:
            if not c.main_inspector:
                problems.append(f"- {c.protocol_number}: sem fiscal principal")
            elif not c.main_inspector.email:
                problems.append(
                    f"- {c.protocol_number}: fiscal '{c.main_inspector.full_name}' sem e-mail"
                )

        if not problems:
            return "Todos os contratos ativos possuem fiscal principal com e-mail cadastrado."
        return "Contratos com problema de fiscal:\n" + "\n".join(problems)

    @tool
    def get_pending_email_notifications() -> str:
        """
        Retorna notificações de vencimento cujo e-mail ainda não foi enviado.
        Use para perguntas como 'quais contratos não receberam e-mail de aviso'.
        """
        pending = scope.notifications().filter(
            email_sent_at__isnull=True,
        ).select_related('contract', 'contract__main_inspector')

        if not pending.exists():
            return "Todos os avisos de vencimento já tiveram e-mail enviado."

        lines = [f"Notificações pendentes de e-mail ({pending.count()}):"]
        for n in pending:
            c = n.contract
            inspector = c.main_inspector.full_name if c.main_inspector else "sem fiscal"
            lines.append(
                f"- {c.protocol_number}: {c.description[:50]} | "
                f"Criada em {n.created_at.strftime('%d/%m/%Y')} | "
                f"Fiscal: {inspector}"
            )
        return "\n".join(lines)

    @tool
    def get_contract_inspector(protocol_number: str) -> str:
        """
        Retorna informações do fiscal de um contrato específico.
        Use quando perguntar 'quem é o fiscal do contrato XXXX'.
        O argumento deve ser o número do protocolo (ex: '0001/26').
        """
        try:
            contract = scope.contracts().select_related(
                'main_inspector', 'substitute_inspector'
            ).get(protocol_number=protocol_number)
        except Exception:
            return f"Contrato '{protocol_number}' não encontrado ou sem acesso."

        result = [f"Contrato {contract.protocol_number} — {contract.description}"]
        if contract.main_inspector:
            result.append(
                f"Fiscal Principal: {contract.main_inspector.full_name} "
                f"({contract.main_inspector.email or 'sem e-mail'})"
            )
        else:
            result.append("Fiscal Principal: não cadastrado")

        if contract.substitute_inspector:
            result.append(
                f"Fiscal Substituto: {contract.substitute_inspector.full_name} "
                f"({contract.substitute_inspector.email or 'sem e-mail'})"
            )
        else:
            result.append("Fiscal Substituto: não cadastrado")
        return "\n".join(result)

    @tool
    def count_active_contracts() -> str:
        """
        Retorna o total de contratos ativos (dentro do seu escopo de acesso).
        Use para perguntas como 'quantos contratos ativos existem'.
        """
        contracts_qs = scope.contracts()
        total = contracts_qs.filter(status='ATIVO').count()
        encerrado = contracts_qs.filter(status='ENCERRADO').count()
        return (
            f"Contratos ativos: {total} | "
            f"Contratos encerrados: {encerrado} | "
            f"Total geral: {total + encerrado}"
        )

    @tool
    def count_employees() -> str:
        """
        Retorna o total de colaboradores (dentro do seu escopo de acesso).
        Use para perguntas como 'quantos colaboradores existem'.
        """
        employees_qs = scope.employees()
        ativos = employees_qs.filter(status='ATIVO').count()
        inativos = employees_qs.filter(status='INATIVO').count()
        return f"Colaboradores ativos: {ativos} | Inativos: {inativos} | Total: {ativos + inativos}"

    @tool
    def get_budget_summary() -> str:
        """
        Retorna resumo dos orçamentos (dentro do seu escopo de acesso).
        Use para perguntas sobre orçamento total, valor disponível, etc.
        """
        budgets = scope.budgets()
        if not budgets.exists():
            return "Nenhum orçamento encontrado para o seu acesso."
        total_budgeted = sum(b.total_amount for b in budgets)
        return (
            f"Total de orçamentos: {budgets.count()} | "
            f"Valor total orçado: R$ {total_budgeted:,.2f}"
        )

    return [
        get_expiring_contracts,
        get_contracts_without_inspector,
        get_pending_email_notifications,
        get_contract_inspector,
        count_active_contracts,
        count_employees,
        get_budget_summary,
    ]




GABY_SYSTEM_PROMPT = (
    "Você é Gaby, assistente virtual do Sistema Minerva. "
    "Responda de forma natural, amigável e profissional em português. "
    "Nunca mencione termos técnicos como SQL, banco de dados, query ou exceção. "
    "Nunca revele dados de outros usuários ou setores não autorizados. "
    "Use as ferramentas disponíveis para responder perguntas sobre contratos, "
    "funcionários, orçamentos e notificações."
)


class AliceAgentService:
    """
    Agente ReAct da Alice usando LangGraph prebuilt create_react_agent.
    Usa DeepSeek como LLM principal; Gemini como fallback.
    Respeita PermissionScope — retorna apenas dados que o usuário pode ver.
    """

    def __init__(self, user=None):
        self._user = user
        tools = build_scoped_tools(user)
        llm = _build_llm()

        from langgraph.prebuilt import create_react_agent
        from langchain_core.messages import SystemMessage
        self._graph = create_react_agent(
            llm,
            tools,
            prompt=GABY_SYSTEM_PROMPT,
        )

    def run(self, question: str) -> dict:
        """
        Executa o agente e retorna a resposta final.

        Returns:
            {'success': bool, 'response': str, 'tools_used': List[str]}
        """
        try:
            from langchain_core.messages import HumanMessage
            result = self._graph.invoke({"messages": [HumanMessage(content=question)]})

            # Extrai resposta final
            messages = result.get('messages', [])
            response = ''
            tools_used = []
            for msg in messages:
                msg_type = getattr(msg, 'type', '') or type(msg).__name__.lower()
                if msg_type in ('ai', 'assistant', 'aimessage') and hasattr(msg, 'content'):
                    if msg.content:
                        response = msg.content
                if msg_type in ('tool', 'toolmessage', 'functionmessage'):
                    tool_name = getattr(msg, 'name', '') or getattr(msg, 'tool_call_id', '')
                    if tool_name:
                        tools_used.append(tool_name)

            return {
                'success': True,
                'response': response,
                'tools_used': list(set(tools_used)),
            }
        except Exception as exc:
            logger.error("AliceAgentService error: %s", exc)
            return {
                'success': False,
                'response': "Desculpe, não consegui processar sua pergunta. Pode reformulá-la? 😊",
                'tools_used': [],
            }
