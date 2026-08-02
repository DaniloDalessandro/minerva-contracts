"""
Resolução de contexto anafórico para perguntas que referenciam entidades mencionadas
em turnos anteriores da conversa.
"""
import logging
import re
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)

_RESOLVE_PROMPT_TEMPLATE = """
Você é um sistema de resolução de referências anafóricas em perguntas sobre dados.

HISTÓRICO DA CONVERSA (mais recente por último):
{history_text}

PERGUNTA ATUAL DO USUÁRIO:
{current_question}

TAREFA:
A pergunta atual contém termos que provavelmente se referem a algo mencionado anteriormente
no histórico (ex: "esse", "ele", "o mesmo", "anterior", etc.).

Reescreva a pergunta atual substituindo os termos anafóricos pelas entidades concretas
mencionadas no histórico. Mantenha o sentido original da pergunta.

Se não houver referências claras, retorne a pergunta original sem modificações.

Responda APENAS com a pergunta reescrita, sem explicações adicionais.
"""


@dataclass
class ResolvedContext:
    resolved_question: str
    active_entities: Dict[str, Any] = field(default_factory=dict)
    history_summary: str = ""
    had_anaphora: bool = False


class ContextResolver:
    """
    Resolve referências anafóricas em perguntas usando o histórico da sessão.
    A detecção de anáfora é feita localmente (sem API); a resolução usa Gemini.
    """

    ANAPHORA_TOKENS = [
        'esse', 'esse mesmo', 'ele', 'ela', 'eles', 'elas',
        'dele', 'dela', 'deles', 'delas', 'o mesmo', 'a mesma',
        'aquele', 'aquela', 'anterior', 'último', 'última',
        'citado', 'mencionado', 'mesmo', 'igual',
    ]

    HISTORY_WINDOW = 8

    def __init__(self, gemini_service):
        self.gemini = gemini_service
        self._anaphora_pattern = self._build_anaphora_pattern()

    def _build_anaphora_pattern(self) -> re.Pattern:

        tokens = sorted(self.ANAPHORA_TOKENS, key=len, reverse=True)
        escaped = [re.escape(t) for t in tokens]
        return re.compile(r'\b(' + '|'.join(escaped) + r')\b', re.IGNORECASE)

    def resolve(self, current_question: str, session) -> ResolvedContext:
        """
        Resolve referências anafóricas na pergunta atual usando o histórico da sessão.

        Args:
            current_question: Pergunta do usuário neste turno
            session: ConversationSession Django ORM object

        Returns:
            ResolvedContext com a pergunta possivelmente enriquecida
        """
        has_anaphora = self._detect_anaphora(current_question)

        if not has_anaphora:
            return ResolvedContext(
                resolved_question=current_question,
                had_anaphora=False,
            )

        history = self._load_history(session)

        if not history:
            return ResolvedContext(
                resolved_question=current_question,
                had_anaphora=True,
                history_summary="Sem histórico disponível para resolução",
            )

        active_entities = self._extract_active_entities(history)
        resolved_question = self._resolve_via_gemini(current_question, history)

        history_summary = self._build_history_summary(history)

        return ResolvedContext(
            resolved_question=resolved_question,
            active_entities=active_entities,
            history_summary=history_summary,
            had_anaphora=True,
        )

    def _detect_anaphora(self, text: str) -> bool:
        """Detecta tokens anafóricos sem chamada à API (rápido)."""
        return bool(self._anaphora_pattern.search(text))

    def _load_history(self, session) -> List[Dict[str, str]]:
        """
        Carrega as últimas HISTORY_WINDOW mensagens da sessão.
        Retorna lista de {'role': ..., 'content': ...}.
        """
        try:
            from ..models import ConversationMessage
            messages = (
                ConversationMessage.objects
                .filter(session=session)
                .order_by('-created_at')[:self.HISTORY_WINDOW]
            )
            result = []
            for msg in reversed(list(messages)):
                role = 'user' if msg.message_type == 'USER' else 'assistant'
                result.append({'role': role, 'content': msg.content})
            return result
        except Exception as exc:
            logger.warning(f"Erro ao carregar histórico da sessão: {exc}")
            return []

    def _resolve_via_gemini(
        self, current_question: str, history: List[Dict[str, str]]
    ) -> str:
        """Usa DeepSeek (ou Gemini fallback) para reescrever a pergunta resolvendo anáforas."""
        try:
            history_text = self._format_history_for_prompt(history)
            prompt = _RESOLVE_PROMPT_TEMPLATE.format(
                history_text=history_text,
                current_question=current_question,
            )

            # Tenta DeepSeek primeiro
            response = None
            try:
                from django.conf import settings
                if getattr(settings, 'DEEPSEEK_API_KEY', None):
                    from .deepseek_service import DeepSeekService
                    response = DeepSeekService().generate_response(prompt)
            except Exception:
                pass

            if not response or not response.get('success'):
                response = self.gemini.generate_response(prompt)

            if response.get('success') and response.get('content'):
                resolved = response['content'].strip()
                if len(resolved) >= 5:
                    return resolved

        except Exception as exc:
            logger.warning(f"ContextResolver._resolve_via_gemini erro: {exc}")

        return current_question

    @staticmethod
    def _format_history_for_prompt(history: List[Dict[str, str]]) -> str:
        lines = []
        for msg in history:
            role_label = "Usuário" if msg['role'] == 'user' else "Gaby"
            content_preview = msg['content'][:300]
            lines.append(f"{role_label}: {content_preview}")
        return "\n".join(lines)

    @staticmethod
    def _extract_active_entities(history: List[Dict[str, str]]) -> Dict[str, Any]:
        """
        Extrai heuristicamente as entidades ativas das mensagens recentes do usuário,
        mapeando palavras-chave para nomes de tabelas do banco.
        """
        entities: Dict[str, Any] = {}

        entity_keywords = {
            'contrato': 'contracts',
            'contratos': 'contracts',
            'orçamento': 'budgets',
            'orçamentos': 'budgets',
            'orcamento': 'budgets',
            'funcionário': 'employees',
            'funcionários': 'employees',
            'funcionario': 'employees',
            'funcionarios': 'employees',
            'colaborador': 'employees',
            'colaboradores': 'employees',
            'auxílio': 'aids',
            'auxílios': 'aids',
            'auxilio': 'aids',
            'auxilios': 'aids',
            'setor': 'sectors',
            'setores': 'sectors',
            'centro': 'centers',
            'centros': 'centers',
        }

        user_messages = [m['content'] for m in history if m['role'] == 'user'][-4:]

        for msg in reversed(user_messages):
            msg_lower = msg.lower()
            for kw, entity in entity_keywords.items():
                if kw in msg_lower:
                    entities['last_entity'] = entity
                    entities['last_keyword'] = kw
                    break
            if 'last_entity' in entities:
                break

        return entities

    @staticmethod
    def _build_history_summary(history: List[Dict[str, str]]) -> str:
        if not history:
            return ""
        lines = []
        for msg in history[-4:]:
            role = "U" if msg['role'] == 'user' else "A"
            lines.append(f"[{role}] {msg['content'][:80]}")
        return " | ".join(lines)
