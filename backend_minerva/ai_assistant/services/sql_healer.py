"""
Auto-healing de SQL gerado com erros.
Usa Gemini para corrigir consultas SQL falhas em um loop iterativo.
"""
import logging
import re
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)


_ERROR_PATTERNS = [
    (re.compile(r'column ["\']?(\S+)["\']? does not exist', re.IGNORECASE), 'column_not_found'),
    (re.compile(r'relation ["\']?(\S+)["\']? does not exist', re.IGNORECASE), 'table_not_found'),
    (re.compile(r'syntax error at or near', re.IGNORECASE), 'syntax_error'),
    (re.compile(r'invalid input syntax for type', re.IGNORECASE), 'type_mismatch'),
    (re.compile(r'operator does not exist', re.IGNORECASE), 'type_mismatch'),
    (re.compile(r'ambiguous column', re.IGNORECASE), 'ambiguous_column'),
    (re.compile(r'permission denied', re.IGNORECASE), 'permission_denied'),
    (re.compile(r'division by zero', re.IGNORECASE), 'division_by_zero'),
]

_HEALING_PROMPT_TEMPLATE = """
Você é um especialista em PostgreSQL encarregado de corrigir uma consulta SQL com erros.

PERGUNTA ORIGINAL DO USUÁRIO:
{user_question}

SCHEMA DO BANCO DE DADOS:
{schema_info}

{few_shot_section}

SQL COM ERRO (tentativa {attempt}/{max_attempts}):
{failed_sql}

TIPO DE ERRO DETECTADO: {error_type}
MENSAGEM DE ERRO COMPLETA:
{error_message}

HISTÓRICO DE TENTATIVAS ANTERIORES:
{history_text}

INSTRUÇÕES DE CORREÇÃO:
1. Analise o erro detalhadamente
2. Verifique se as tabelas e colunas existem no schema fornecido
3. Corrija SOMENTE o problema identificado, mantendo a intenção da query
4. Gere APENAS uma consulta SELECT válida para PostgreSQL
5. Não use tabelas ou colunas que não estejam no schema

Responda APENAS com o SQL corrigido, sem explicações, sem markdown, sem aspas extras.
O SQL deve começar com SELECT.
"""


@dataclass
class HealResult:
    success: bool
    healed_sql: Optional[str]
    attempts_used: int
    final_error: Optional[str]
    healing_history: List[Dict[str, Any]] = field(default_factory=list)


class SQLHealer:
    """
    Loop de healing para consultas SQL com erros.
    Classifica o tipo de erro e usa Gemini para corrigir iterativamente.
    """

    MAX_ATTEMPTS = 3

    def __init__(self, gemini_service, sql_validator, few_shot_manager=None):
        self.gemini = gemini_service
        self.validator = sql_validator
        self.few_shot_manager = few_shot_manager

    def heal(
        self,
        original_question: str,
        failed_sql: str,
        error_message: str,
        schema_info: str,
        few_shot_examples: str = "",
    ) -> HealResult:
        """
        Loop de healing:
        1. Classifica o tipo de erro
        2. Constrói prompt com contexto do erro + SQL errado + schema + few-shots
        3. Chama Gemini para corrigir
        4. Valida o SQL corrigido
        5. Se válido, retorna. Se não, tenta novamente (até MAX_ATTEMPTS)

        Args:
            original_question: Pergunta do usuário original
            failed_sql: SQL que falhou
            error_message: Mensagem de erro do banco ou do validator
            schema_info: Schema do banco para contextualizar o Gemini
            few_shot_examples: Exemplos few-shot já formatados (opcional)

        Returns:
            HealResult com resultado do processo
        """
        history: List[Dict[str, Any]] = []
        current_sql = failed_sql
        current_error = error_message

        for attempt in range(1, self.MAX_ATTEMPTS + 1):
            error_type = self._classify_error(current_error)
            logger.info(
                f"SQLHealer: tentativa {attempt}/{self.MAX_ATTEMPTS} | "
                f"tipo={error_type} | erro={current_error[:120]}"
            )

            history_text = self._format_history(history)
            few_shot_section = (
                f"EXEMPLOS RELEVANTES:\n{few_shot_examples}\n"
                if few_shot_examples else ""
            )

            prompt = _HEALING_PROMPT_TEMPLATE.format(
                user_question=original_question,
                schema_info=schema_info,
                few_shot_section=few_shot_section,
                attempt=attempt,
                max_attempts=self.MAX_ATTEMPTS,
                failed_sql=current_sql,
                error_type=error_type,
                error_message=current_error,
                history_text=history_text or "Nenhuma tentativa anterior.",
            )

            gemini_response = self.gemini.generate_response(
                prompt,
                system_instruction=(
                    "Você é um especialista em PostgreSQL. Corrija o SQL fornecido. "
                    "Responda APENAS com o SQL corrigido — sem markdown, sem explicações."
                ),
            )

            if not gemini_response.get('success'):
                error_msg = gemini_response.get('error', 'Erro desconhecido no Gemini')
                history.append({
                    'attempt': attempt,
                    'sql': current_sql,
                    'error': current_error,
                    'error_type': error_type,
                    'gemini_error': error_msg,
                    'healed_sql': None,
                })
                logger.warning(f"SQLHealer: Gemini falhou na tentativa {attempt}: {error_msg}")
                continue

            healed_candidate = self._clean_sql_response(gemini_response.get('content', ''))

            if not healed_candidate:
                history.append({
                    'attempt': attempt,
                    'sql': current_sql,
                    'error': current_error,
                    'error_type': error_type,
                    'healed_sql': None,
                    'validation_error': 'Resposta vazia do Gemini',
                })
                continue


            validation = self.validator.validate(healed_candidate)

            history.append({
                'attempt': attempt,
                'sql': current_sql,
                'error': current_error,
                'error_type': error_type,
                'healed_sql': healed_candidate,
                'validation_valid': validation.valid,
                'validation_errors': validation.errors,
            })

            if validation.valid:
                logger.info(
                    f"SQLHealer: SQL curado com sucesso na tentativa {attempt}"
                )
                return HealResult(
                    success=True,
                    healed_sql=validation.normalized_sql or healed_candidate,
                    attempts_used=attempt,
                    final_error=None,
                    healing_history=history,
                )


            current_sql = healed_candidate
            current_error = "; ".join(validation.errors)


        logger.warning(
            f"SQLHealer: esgotou {self.MAX_ATTEMPTS} tentativas sem sucesso. "
            f"Último erro: {current_error}"
        )
        return HealResult(
            success=False,
            healed_sql=None,
            attempts_used=self.MAX_ATTEMPTS,
            final_error=current_error,
            healing_history=history,
        )





    @staticmethod
    def _classify_error(error_message: str) -> str:
        """Classifica o tipo de erro PostgreSQL para orientar o prompt de healing."""
        if not error_message:
            return 'other'

        for pattern, label in _ERROR_PATTERNS:
            if pattern.search(error_message):
                return label

        return 'other'

    @staticmethod
    def _clean_sql_response(raw: str) -> str:
        """Remove markdown e texto extra da resposta do Gemini, retornando o SQL puro."""
        if not raw:
            return ''

        text = raw.strip()


        if text.startswith('```'):
            lines = text.split('\n')
            cleaned_lines = []
            for line in lines:
                stripped = line.strip()
                if stripped.startswith('```'):
                    continue
                cleaned_lines.append(line)
            text = '\n'.join(cleaned_lines).strip()


        upper = text.upper()
        select_pos = upper.find('SELECT')
        if select_pos == -1:
            return ''

        sql = text[select_pos:].strip()


        if sql.endswith(';'):
            sql = sql[:-1].strip()

        return sql

    @staticmethod
    def _format_history(history: List[Dict[str, Any]]) -> str:
        if not history:
            return ""
        lines = []
        for entry in history:
            attempt = entry.get('attempt', '?')
            healed = entry.get('healed_sql', '(nenhum)')
            error = entry.get('error', '')
            val_errors = entry.get('validation_errors', [])
            lines.append(
                f"Tentativa {attempt}: SQL proposto={healed!r} | "
                f"erro original={error[:80]} | "
                f"erros de validação={val_errors}"
            )
        return "\n".join(lines)
