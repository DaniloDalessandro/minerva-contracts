import time
import logging
from typing import Dict, Any, List, Optional
from django.db import connection
from django.conf import settings
from .gemini_service import GeminiService, ALICE_FRIENDLY_ERROR
from .embedding_service import EmbeddingService
from .sql_validator import SQLValidator
from .hybrid_search import HybridSearchService
from .reranker import RerankerService
from .few_shot_manager import FewShotManager
from .sql_healer import SQLHealer
from .context_resolver import ContextResolver
from ..models import DatabaseSchema, QueryLog, ConversationSession, ConversationMessage

logger = logging.getLogger(__name__)


FRIENDLY_MESSAGES = {
    'interpretation_error': "Desculpe, não consegui entender sua solicitação dessa vez. Pode reformular a pergunta ou me dar mais detalhes? 😊",
    'validation_error': "Não consegui processar essa informação no momento. Pode tentar de outra forma?",
    'execution_error': "Tive dificuldade em encontrar essas informações agora. Que tal tentar de outra forma?",
    'internal_error': "Desculpe, algo não saiu como esperado. Pode tentar novamente em alguns instantes?",
    'no_results': "Não encontrei informações sobre isso. Pode me dar mais detalhes para que eu possa ajudar melhor?",
}



def get_error_details(exception):
    """
    Returns exception details only if DEBUG is enabled.
    In production, returns a generic message to avoid information leakage.
    """
    if settings.DEBUG:
        return str(exception)
    return "Entre em contato com o suporte para mais informações"


class SQLInterpreterService:
    """
    Serviço para interpretar perguntas em linguagem natural e executar consultas SQL.
    Alice v2: integra busca híbrida, reranking, few-shot RAG, auto-healing e resolução de contexto.
    """

    def __init__(self):
        self.gemini_service = GeminiService()
        self.embedding_service = EmbeddingService()
        self.safe_tables = {
            'accounts_user', 'budget_budget', 'budget_budgetmovement',
            'budgetline_budgetline', 'budgetline_budgetlineversion',
            'contract_contract', 'contract_contractinstallment',
            'contract_contractamendment', 'employee_employee',
            'sector_direction', 'sector_coordination', 'sector_management',
            'center_management_center', 'center_requesting_center',
            'aid_assistance', 'aid_assistanceemployee'
        }
        self._is_postgresql = self._check_database_type()


        self.sql_validator = SQLValidator(safe_tables=self.safe_tables)
        self.hybrid_search = self._init_service(
            HybridSearchService, self.gemini_service,
            label="HybridSearchService"
        )
        self.reranker = self._init_service(
            RerankerService, self.gemini_service,
            label="RerankerService"
        )
        self.few_shot_manager = self._init_service(
            FewShotManager, self.gemini_service,
            label="FewShotManager"
        )
        self.sql_healer = self._init_healer()
        self.context_resolver = self._init_service(
            ContextResolver, self.gemini_service,
            label="ContextResolver"
        )





    @staticmethod
    def _init_service(cls, *args, label: str = ""):
        try:
            return cls(*args)
        except Exception as exc:
            logger.warning(f"Não foi possível inicializar {label or cls.__name__}: {exc}")
            return None

    def _init_healer(self):
        try:
            return SQLHealer(
                gemini_service=self.gemini_service,
                sql_validator=self.sql_validator,
                few_shot_manager=self.few_shot_manager,
            )
        except Exception as exc:
            logger.warning(f"Não foi possível inicializar SQLHealer: {exc}")
            return None

    def _check_database_type(self) -> bool:
        """Verifica se o banco é PostgreSQL"""
        return 'postgresql' in settings.DATABASES['default']['ENGINE']

    def get_database_schema(self) -> str:
        """
        Obtém informações sobre o schema do banco de dados, incluindo FK relationships.
        """
        try:
            schema_info = self._get_cached_schema()
            if not schema_info:
                schema_info = self._generate_schema_info()
                self._cache_schema_info(schema_info)

            fk_section = self._get_fk_relationships()
            if fk_section:
                schema_info += fk_section
            return schema_info
        except Exception as e:
            logger.error(f"Erro ao obter schema do banco: {str(e)}")
            return self._get_basic_schema_fallback()

    def _get_cached_schema(self) -> Optional[str]:
        try:
            schemas = DatabaseSchema.objects.all()
            if not schemas.exists():
                return None

            schema_info = "ESQUEMA DO BANCO DE DADOS MINERVA:\n\n"
            current_table = ""

            for schema in schemas.order_by('table_name', 'column_name'):
                if schema.table_name != current_table:
                    current_table = schema.table_name
                    schema_info += f"\nTABELA: {schema.table_name}\n"
                    if schema.table_name in self._get_table_descriptions():
                        schema_info += f"Descrição: {self._get_table_descriptions()[schema.table_name]}\n"

                schema_info += f"  - {schema.column_name} ({schema.data_type})"
                if not schema.is_nullable:
                    schema_info += " NOT NULL"
                if schema.business_meaning:
                    schema_info += f" - {schema.business_meaning}"
                schema_info += "\n"

                if schema.sample_values:
                    schema_info += f"    Exemplos: {', '.join(map(str, schema.sample_values[:3]))}\n"

            return schema_info
        except Exception as e:
            logger.error(f"Erro ao buscar schema em cache: {str(e)}")
            return None

    def _generate_schema_info(self) -> str:
        with connection.cursor() as cursor:
            schema_info = "ESQUEMA DO BANCO DE DADOS MINERVA:\n\n"

            if self._is_postgresql:
                cursor.execute("""
                    SELECT table_name FROM information_schema.tables
                    WHERE table_schema = 'public'
                    AND table_type = 'BASE TABLE'
                    AND table_name NOT LIKE 'django_%'
                    AND table_name NOT LIKE 'auth_%'
                    ORDER BY table_name
                """)
            else:
                cursor.execute("""
                    SELECT name FROM sqlite_master
                    WHERE type='table' AND name NOT LIKE 'sqlite_%'
                    AND name NOT LIKE 'django_%'
                    AND name NOT LIKE 'auth_%'
                    ORDER BY name
                """)

            tables = cursor.fetchall()
            table_descriptions = self._get_table_descriptions()

            for table_row in tables:
                table_name = table_row[0]
                if table_name not in self.safe_tables:
                    continue

                schema_info += f"\nTABELA: {table_name}\n"
                if table_name in table_descriptions:
                    schema_info += f"Descrição: {table_descriptions[table_name]}\n"

                if self._is_postgresql:
                    cursor.execute("""
                        SELECT column_name, data_type, is_nullable, column_default
                        FROM information_schema.columns
                        WHERE table_name = %s AND table_schema = 'public'
                        ORDER BY ordinal_position
                    """, [table_name])
                    columns = cursor.fetchall()

                    for col in columns:
                        col_name, col_type, is_nullable, default_value = col
                        schema_info += f"  - {col_name} ({col_type})"
                        if is_nullable == 'NO':
                            schema_info += " NOT NULL"
                        if default_value:
                            schema_info += f" DEFAULT {default_value}"

                        try:
                            cursor.execute(
                                f'SELECT DISTINCT "{col_name}" FROM "{table_name}" '
                                f'WHERE "{col_name}" IS NOT NULL LIMIT 3'
                            )
                            samples = cursor.fetchall()
                            if samples:
                                sample_values = [str(s[0]) for s in samples]
                                schema_info += f" - Exemplos: {', '.join(sample_values)}"
                        except Exception:
                            pass

                        schema_info += "\n"
                else:
                    cursor.execute(f"PRAGMA table_info({table_name})")
                    columns = cursor.fetchall()

                    for col in columns:
                        col_name, col_type, not_null, default_value = col[1], col[2], col[3], col[4]
                        schema_info += f"  - {col_name} ({col_type})"
                        if not_null:
                            schema_info += " NOT NULL"
                        if default_value:
                            schema_info += f" DEFAULT {default_value}"

                        try:
                            cursor.execute(
                                f"SELECT DISTINCT {col_name} FROM {table_name} "
                                f"WHERE {col_name} IS NOT NULL LIMIT 3"
                            )
                            samples = cursor.fetchall()
                            if samples:
                                sample_values = [str(s[0]) for s in samples]
                                schema_info += f" - Exemplos: {', '.join(sample_values)}"
                        except Exception:
                            pass

                        schema_info += "\n"

            return schema_info

    def _get_table_descriptions(self) -> Dict[str, str]:
        return {
            'contract_contract': 'Contratos do sistema - contém informações sobre contratos, valores, datas, fiscais',
            'budget_budget': 'Orçamentos - contém informações sobre orçamentos anuais por centro gestor',
            'budget_budgetmovement': 'Movimentações orçamentárias - transferências entre orçamentos',
            'budgetline_budgetline': 'Linhas orçamentárias - detalhamento dos orçamentos',
            'employee_employee': 'Funcionários - informações dos colaboradores e fiscais',
            'accounts_user': 'Usuários do sistema',
            'contract_contractinstallment': 'Parcelas de contratos - pagamentos dos contratos',
            'contract_contractamendment': 'Aditivos contratuais - alterações nos contratos',
            'center_management_center': 'Centros gestores - unidades administrativas',
            'aid_assistance': 'Auxílios - benefícios concedidos aos funcionários'
        }

    def _get_basic_schema_fallback(self) -> str:
        return """
        ESQUEMA BÁSICO DO SISTEMA MINERVA:

        TABELA: contract_contract
        - protocol_number (VARCHAR) - Número do protocolo do contrato
        - signing_date (DATE) - Data de assinatura
        - expiration_date (DATE) - Data de expiração
        - original_value (DECIMAL) - Valor original
        - current_value (DECIMAL) - Valor atual
        - start_date (DATE) - Data de início
        - end_date (DATE) - Data de término
        - status (VARCHAR) - Status: ATIVO, ENCERRADO

        TABELA: budget_budget
        - year (INTEGER) - Ano do orçamento
        - category (VARCHAR) - CAPEX ou OPEX
        - total_amount (DECIMAL) - Valor total
        - available_amount (DECIMAL) - Valor disponível
        - status (VARCHAR) - ATIVO, INATIVO

        TABELA: employee_employee
        - name (VARCHAR) - Nome do funcionário
        - cpf (VARCHAR) - CPF
        - admission_date (DATE) - Data de admissão
        - status (VARCHAR) - Status do funcionário
        """

    def _cache_schema_info(self, schema_info: str) -> None:
        logger.info("Schema info cached")

    def _get_fk_relationships(self) -> str:
        """
        Consulta information_schema para extrair FK relationships entre as tabelas seguras.
        Retorna string formatada para inclusão no schema prompt.
        """
        if not self._is_postgresql:
            return ""
        try:
            with connection.cursor() as cursor:
                cursor.execute("""
                    SELECT
                        kcu.table_name AS from_table,
                        kcu.column_name AS from_column,
                        ccu.table_name AS to_table,
                        ccu.column_name AS to_column
                    FROM information_schema.table_constraints AS tc
                    JOIN information_schema.key_column_usage AS kcu
                        ON tc.constraint_name = kcu.constraint_name
                        AND tc.table_schema = kcu.table_schema
                    JOIN information_schema.constraint_column_usage AS ccu
                        ON ccu.constraint_name = tc.constraint_name
                        AND ccu.table_schema = tc.table_schema
                    WHERE tc.constraint_type = 'FOREIGN KEY'
                        AND tc.table_schema = 'public'
                    ORDER BY kcu.table_name, kcu.column_name
                """)
                rows = cursor.fetchall()

            if not rows:
                return ""

            safe = self.safe_tables
            lines = ["\nRELACIONAMENTOS (FOREIGN KEYS):"]
            for from_table, from_col, to_table, to_col in rows:
                if from_table in safe or to_table in safe:
                    lines.append(
                        f"  {from_table}.{from_col} → {to_table}.{to_col}"
                    )

            return "\n".join(lines) + "\n" if len(lines) > 1 else ""
        except Exception as exc:
            logger.warning(f"_get_fk_relationships falhou: {exc}")
            return ""

    def _get_chat_history(self, session: ConversationSession, limit: int = 8) -> List[Dict[str, str]]:
        """
        Retorna as últimas `limit` mensagens da sessão como lista de dicts {role, content}.
        """
        try:
            messages = (
                ConversationMessage.objects
                .filter(session=session, message_type__in=['USER', 'ASSISTANT'])
                .order_by('-created_at')[:limit]
            )
            history = []
            for msg in reversed(list(messages)):
                role = 'user' if msg.message_type == 'USER' else 'assistant'
                history.append({'role': role, 'content': msg.content})
            return history
        except Exception as exc:
            logger.warning(f"_get_chat_history falhou: {exc}")
            return []


    PREDEFINED_QUERIES = {
        'auxilios': {
            'sql': 'SELECT a.id, e.full_name as funcionario, a.type as tipo, a.total_amount as valor, a.status, a.start_date as inicio FROM aid_assistance a JOIN employee_employee e ON a.employee_id = e.id ORDER BY a.start_date DESC LIMIT 20',
            'intent': 'Listar auxílios cadastrados'
        },
        'auxílios': {
            'sql': 'SELECT a.id, e.full_name as funcionario, a.type as tipo, a.total_amount as valor, a.status, a.start_date as inicio FROM aid_assistance a JOIN employee_employee e ON a.employee_id = e.id ORDER BY a.start_date DESC LIMIT 20',
            'intent': 'Listar auxílios cadastrados'
        },
        'contratos': {
            'sql': 'SELECT id, protocol_number as protocolo, description as descricao, current_value as valor, status, start_date as inicio, end_date as fim FROM contract_contract ORDER BY created_at DESC LIMIT 20',
            'intent': 'Listar contratos cadastrados'
        },
        'funcionarios': {
            'sql': 'SELECT id, full_name as nome, email, position as cargo, department as departamento, status FROM employee_employee ORDER BY full_name LIMIT 30',
            'intent': 'Listar funcionários cadastrados'
        },
        'funcionários': {
            'sql': 'SELECT id, full_name as nome, email, position as cargo, department as departamento, status FROM employee_employee ORDER BY full_name LIMIT 30',
            'intent': 'Listar funcionários cadastrados'
        },
        'colaboradores': {
            'sql': 'SELECT id, full_name as nome, email, position as cargo, department as departamento, status FROM employee_employee ORDER BY full_name LIMIT 30',
            'intent': 'Listar colaboradores cadastrados'
        },
        'orcamentos': {
            'sql': 'SELECT id, year as ano, category as categoria, total_amount as valor_total, available_amount as disponivel, status FROM budget_budget ORDER BY year DESC LIMIT 20',
            'intent': 'Listar orçamentos cadastrados'
        },
        'orçamentos': {
            'sql': 'SELECT id, year as ano, category as categoria, total_amount as valor_total, available_amount as disponivel, status FROM budget_budget ORDER BY year DESC LIMIT 20',
            'intent': 'Listar orçamentos cadastrados'
        },
        'setores': {
            'sql': 'SELECT id, name as nome, is_active as ativo FROM sector_direction ORDER BY name LIMIT 30',
            'intent': 'Listar setores/direções cadastrados'
        },
        'centros': {
            'sql': 'SELECT id, name as nome, code as codigo, is_active as ativo FROM center_management_center ORDER BY name LIMIT 30',
            'intent': 'Listar centros gestores cadastrados'
        },
    }

    def _get_predefined_query(self, text: str) -> Optional[Dict[str, str]]:
        """Retorna consulta predefinida se a palavra-chave for reconhecida."""
        text_lower = text.lower().strip()
        return self.PREDEFINED_QUERIES.get(text_lower)

    def _is_greeting_or_casual(self, text: str) -> bool:
        """Verifica se a mensagem é uma saudação ou conversa casual."""
        greetings = [
            'oi', 'olá', 'ola', 'hi', 'hello', 'hey', 'e ai', 'eai',
            'bom dia', 'boa tarde', 'boa noite', 'tudo bem', 'como vai',
            'obrigado', 'obrigada', 'valeu', 'tchau', 'até mais', 'ate mais',
            'ajuda', 'help', 'o que voce faz', 'o que você faz', 'quem é você',
            'quem e voce', 'quem é voce'
        ]

        data_keywords = [
            'contrato', 'contratos', 'auxilio', 'auxilios', 'auxílio', 'auxílios',
            'funcionario', 'funcionarios', 'funcionário', 'funcionários',
            'colaborador', 'colaboradores', 'orcamento', 'orçamento', 'orcamentos', 'orçamentos',
            'budget', 'valor', 'valores', 'total', 'lista', 'listar', 'mostrar', 'mostra',
            'buscar', 'busca', 'encontrar', 'pesquisar', 'quantos', 'quantas', 'quanto',
            'quais', 'qual', 'todos', 'todas', 'ativos', 'ativo', 'vencidos', 'vencido',
            'setor', 'setores', 'direção', 'direcao', 'gerencia', 'gerência', 'coordenacao',
            'centro', 'centros', 'gestor', 'gestores', 'solicitante'
        ]

        text_lower = text.lower().strip()

        if any(keyword in text_lower for keyword in data_keywords):
            return False

        return any(greeting in text_lower for greeting in greetings) or len(text_lower) < 4

    def _get_greeting_response(self, text: str) -> str:
        """Retorna uma resposta apropriada para saudações."""
        text_lower = text.lower().strip()

        if any(g in text_lower for g in ['obrigado', 'obrigada', 'valeu']):
            return "De nada! 😊 Fico feliz em ajudar. Se precisar de mais alguma coisa, é só perguntar!"

        if any(g in text_lower for g in ['tchau', 'até mais', 'ate mais']):
            return "Até mais! 😊 Foi um prazer ajudar. Volte sempre que precisar!"

        if any(g in text_lower for g in ['ajuda', 'help', 'o que voce faz', 'o que você faz']):
            return """Posso ajudar você com várias informações do Sistema Minerva! 😊

Por exemplo, você pode me perguntar:
• Quantos contratos temos ativos?
• Qual o valor total dos orçamentos deste ano?
• Quais funcionários estão cadastrados?
• Mostre os contratos que vencem este mês

É só perguntar de forma natural que eu busco a informação para você!"""

        return """Olá! 😊 Eu sou a Gaby, sua assistente virtual do Sistema Minerva.

Posso ajudar você a encontrar informações sobre contratos, orçamentos, funcionários e muito mais.

É só me dizer o que você precisa!"""





    def interpret_and_execute(self, user_question: str, session: ConversationSession) -> Dict[str, Any]:
        """
        Interpreta pergunta e executa consulta SQL — Alice v2.

        Flow:
        1.  greeting check
        2.  predefined query check
        3.  ContextResolver.resolve()
        4.  get_database_schema()
        5.  HybridSearchService.search()
        6.  RerankerService.rerank()
        7.  FewShotManager.get_relevant_examples()
        8.  gemini_service.interpret_natural_language_query()
        9.  SQLValidator.validate()
        10. SQLHealer.heal() se validation falhou
        11. _execute_sql_query()
        12. SQLHealer.heal() se execução falhou
        13. FewShotManager.record_success() / record_failure()
        14. QueryLog com success_score, healing_attempts, context_used
        15. generate_humanized_response()

        Args:
            user_question: Pergunta do usuário
            session: Sessão da conversa

        Returns:
            Dict com resultados e metadados (mesmo formato da v1)
        """
        start_time = time.time()

        try:

            if self._is_greeting_or_casual(user_question):
                greeting_response = self._get_greeting_response(user_question)
                return {
                    'success': True,
                    'data': [],
                    'sql_query': '',
                    'humanized_response': greeting_response,
                    'execution_time_ms': int((time.time() - start_time) * 1000),
                    'result_count': 0,
                    'is_greeting': True
                }


            predefined = self._get_predefined_query(user_question)
            if predefined:
                logger.info(f"Usando consulta predefinida para: {user_question}")
                sql_query = predefined['sql']
                interpretation = {'intent': predefined['intent'], 'sql': sql_query}

                execution_result = self._execute_sql_query(sql_query)
                execution_time = int((time.time() - start_time) * 1000)

                if execution_result['success']:
                    data = execution_result['data']
                    count = len(data)

                    try:
                        humanized_response = self.gemini_service.generate_humanized_response(
                            query_result=data,
                            original_question=user_question,
                            sql_query=sql_query,
                            context_documents=[]
                        )
                        response_text = humanized_response.get('content', '')
                    except Exception as e:
                        logger.warning(f"Fallback para resposta simples: {str(e)}")
                        response_text = ''

                    if not response_text:
                        keyword = user_question.lower().strip()
                        if count == 0:
                            response_text = f"Não encontrei nenhum registro de {keyword} no momento."
                        else:
                            response_text = f"Encontrei {count} registro(s) de {keyword}. 😊"

                    return {
                        'success': True,
                        'data': data,
                        'sql_query': sql_query,
                        'interpretation': interpretation,
                        'humanized_response': response_text,
                        'execution_time_ms': execution_time,
                        'result_count': count,
                        'is_predefined': True
                    }
                else:
                    return {
                        'success': False,
                        'error': FRIENDLY_MESSAGES['execution_error'],
                        'humanized_response': FRIENDLY_MESSAGES['execution_error'],
                        'details': execution_result.get('error', '')
                    }


            recent_history = self._get_chat_history(session, limit=4)
            clarification_q = self._check_needs_clarification(user_question, recent_history)
            if clarification_q:
                return {
                    'success': True,
                    'data': [],
                    'sql_query': '',
                    'humanized_response': f"{clarification_q} 😊",
                    'execution_time_ms': int((time.time() - start_time) * 1000),
                    'result_count': 0,
                    'needs_clarification': True,
                }


            resolved_question = user_question
            context_meta: Dict[str, Any] = {}
            if self.context_resolver is not None:
                try:
                    resolved_ctx = self.context_resolver.resolve(user_question, session)
                    resolved_question = resolved_ctx.resolved_question
                    context_meta = {
                        'had_anaphora': resolved_ctx.had_anaphora,
                        'active_entities': resolved_ctx.active_entities,
                        'history_summary': resolved_ctx.history_summary,
                    }
                    if resolved_ctx.had_anaphora:
                        logger.info(
                            f"ContextResolver: anáfora detectada. "
                            f"Original={user_question!r} -> Resolvida={resolved_question!r}"
                        )
                except Exception as exc:
                    logger.warning(f"ContextResolver falhou (continuando): {exc}")


            schema_info = self.get_database_schema()


            query_embedding = None
            top_docs: List[Dict[str, Any]] = []
            if self.hybrid_search is not None:
                try:
                    query_embedding = self.gemini_service.get_embedding(resolved_question)
                    hybrid_docs = self.hybrid_search.search(
                        query_text=resolved_question,
                        query_embedding=query_embedding,
                        limit=20,
                        top_k=10,
                    )


                    if self.reranker is not None and hybrid_docs:
                        top_docs = self.reranker.rerank(
                            query=resolved_question,
                            candidates=hybrid_docs,
                            top_k=5,
                        )
                    else:
                        top_docs = hybrid_docs[:5]
                except Exception as exc:
                    logger.warning(f"HybridSearch/Reranker falhou (continuando): {exc}")

                    top_docs = []


            if not top_docs:
                try:
                    legacy_docs = self.embedding_service.get_context_for_query(
                        query=resolved_question,
                        include_schema=True,
                        include_business_rules=True,
                        include_faqs=True,
                        limit_per_type=3,
                    )

                    top_docs = [
                        {'id': i, 'content': d, 'document_type': '', 'title': '',
                         'rrf_score': 0.0, 'vector_score': 0.0, 'fulltext_score': 0.0}
                        for i, d in enumerate(legacy_docs)
                    ]
                except Exception as exc:
                    logger.warning(f"EmbeddingService fallback falhou: {exc}")


            few_shot_str = ""
            if self.few_shot_manager is not None:
                try:
                    few_shot_examples = self.few_shot_manager.get_relevant_examples(
                        resolved_question, top_k=5
                    )
                    few_shot_str = self.few_shot_manager.format_for_prompt(few_shot_examples)
                except Exception as exc:
                    logger.warning(f"FewShotManager.get_relevant_examples falhou: {exc}")


            chat_history = self._get_chat_history(session, limit=8)
            interpretation_result = self.gemini_service.interpret_natural_language_query(
                resolved_question,
                schema_info,
                few_shot_examples=few_shot_str,
                context_documents=top_docs if top_docs else None,
                chat_history=chat_history if chat_history else None,
            )

            if not interpretation_result['success']:
                logger.warning(
                    f"Falha na interpretação: {interpretation_result.get('error', 'Erro desconhecido')}"
                )
                return {
                    'success': False,
                    'error': FRIENDLY_MESSAGES['interpretation_error'],
                    'humanized_response': FRIENDLY_MESSAGES['interpretation_error'],
                    'details': interpretation_result.get('error', '')
                }

            interpretation = interpretation_result['interpretation']
            sql_query = interpretation.get('sql', '')
            healing_attempts = 0


            confidence = float(interpretation.get('confidence', 1.0))
            if confidence < 0.6:
                clarification_response = self._build_clarification_response(
                    interpretation, resolved_question
                )
                if clarification_response:
                    return clarification_response


            validation_result = self.sql_validator.validate(sql_query)

            if validation_result.warnings:
                logger.debug(
                    f"SQLValidator warnings: {validation_result.warnings}"
                )


            if not validation_result.valid:
                logger.warning(
                    f"SQL inválido ({validation_result.errors}), iniciando healing..."
                )
                if self.sql_healer is not None:
                    heal_result = self.sql_healer.heal(
                        original_question=resolved_question,
                        failed_sql=sql_query,
                        error_message="; ".join(validation_result.errors),
                        schema_info=schema_info,
                        few_shot_examples=few_shot_str,
                    )
                    healing_attempts += heal_result.attempts_used
                    if heal_result.success:
                        sql_query = heal_result.healed_sql
                        logger.info("SQLHealer curou o SQL de validação com sucesso")
                    else:
                        logger.warning(
                            f"SQLHealer não conseguiu curar o SQL: {heal_result.final_error}"
                        )
                        return {
                            'success': False,
                            'error': FRIENDLY_MESSAGES['validation_error'],
                            'humanized_response': FRIENDLY_MESSAGES['validation_error'],
                            'details': heal_result.final_error
                        }
                else:

                    return {
                        'success': False,
                        'error': FRIENDLY_MESSAGES['validation_error'],
                        'humanized_response': FRIENDLY_MESSAGES['validation_error'],
                        'details': "; ".join(validation_result.errors)
                    }


            if validation_result.normalized_sql:
                sql_query = validation_result.normalized_sql


            execution_result = self._execute_sql_query(sql_query)
            execution_time = int((time.time() - start_time) * 1000)


            if not execution_result['success'] and self.sql_healer is not None:
                exec_error = execution_result.get('error', 'Erro desconhecido na execução')
                logger.warning(
                    f"Execução SQL falhou ({exec_error}), iniciando healing de execução..."
                )
                heal_result = self.sql_healer.heal(
                    original_question=resolved_question,
                    failed_sql=sql_query,
                    error_message=exec_error,
                    schema_info=schema_info,
                    few_shot_examples=few_shot_str,
                )
                healing_attempts += heal_result.attempts_used
                if heal_result.success:
                    sql_query = heal_result.healed_sql
                    execution_result = self._execute_sql_query(sql_query)
                    execution_time = int((time.time() - start_time) * 1000)
                    logger.info("SQLHealer curou o SQL de execução com sucesso")


            success_score = self._compute_success_score(
                execution_result=execution_result,
                healing_attempts=healing_attempts,
                interpretation=interpretation,
            )


            context_used_log = {
                **context_meta,
                'top_docs_count': len(top_docs),
                'few_shot_examples_count': len(few_shot_str.split('\n')) if few_shot_str else 0,
                'hybrid_search_used': self.hybrid_search is not None,
                'reranker_used': self.reranker is not None,
            }


            query_log = QueryLog.objects.create(
                session=session,
                user_question=user_question,
                interpreted_intent=interpretation.get('intent', ''),
                generated_sql=sql_query,
                execution_status='SUCCESS' if execution_result['success'] else 'ERROR',
                execution_time_ms=execution_time,
                result_count=len(execution_result.get('data', [])) if execution_result['success'] else None,
                error_message=execution_result.get('error', ''),
                gemini_response=interpretation_result,
                success_score=success_score,
                healing_attempts=healing_attempts,
                context_used=context_used_log,
            )

            if execution_result['success']:
                data = execution_result['data']


                if self.few_shot_manager is not None:
                    try:
                        if len(data) == 0:

                            self.few_shot_manager.record_failure(resolved_question)

                            query_log.success_score = min(
                                success_score if success_score is not None else 0.5,
                                0.5
                            )
                            query_log.save(update_fields=['success_score'])
                        else:
                            self.few_shot_manager.record_success(
                                user_question=resolved_question,
                                canonical_sql=sql_query,
                                intent=interpretation.get('intent', ''),
                                tables_used=interpretation.get('tables_used', []),
                                result_count=len(data),
                                execution_ms=float(execution_time),
                            )
                    except Exception as exc:
                        logger.warning(f"FewShotManager record falhou: {exc}")


                humanized_response = self.gemini_service.generate_humanized_response(
                    query_result=data,
                    original_question=user_question,
                    sql_query=sql_query,
                    context_documents=[d.get('content', '') for d in top_docs if d.get('content')]
                )

                return {
                    'success': True,
                    'data': data,
                    'sql_query': sql_query,
                    'interpretation': interpretation,
                    'humanized_response': humanized_response.get('content', ''),
                    'execution_time_ms': execution_time,
                    'result_count': len(data),
                    'query_log_id': query_log.id,
                    'context_used': len(top_docs),
                }
            else:
                logger.warning(f"Erro na execução final: {execution_result['error']}")


                if self.few_shot_manager is not None:
                    try:
                        self.few_shot_manager.record_failure(resolved_question)
                    except Exception as exc:
                        logger.warning(f"FewShotManager.record_failure falhou: {exc}")

                return {
                    'success': False,
                    'error': FRIENDLY_MESSAGES['execution_error'],
                    'humanized_response': FRIENDLY_MESSAGES['execution_error'],
                    'details': execution_result['error'],
                    'sql_query': sql_query,
                    'interpretation': interpretation,
                    'query_log_id': query_log.id
                }

        except Exception as e:
            logger.error(f"Erro na interpretação/execução: {str(e)}")
            return {
                'success': False,
                'error': FRIENDLY_MESSAGES['internal_error'],
                'humanized_response': FRIENDLY_MESSAGES['internal_error'],
                'details': get_error_details(e)
            }






    def _validate_sql_query(self, sql_query: str) -> Dict[str, Any]:
        """Delegado ao SQLValidator. Mantido para backward compatibility."""
        result = self.sql_validator.validate(sql_query)
        if result.valid:
            return {'valid': True}
        return {'valid': False, 'error': "; ".join(result.errors)}

    def _extract_table_names(self, sql_query: str) -> List[str]:
        """Extrai nomes de tabelas via SQLValidator."""
        from .sql_validator import SQLValidator as _V
        return _V._extract_tables_regex(sql_query)





    def _execute_sql_query(self, sql_query: str) -> Dict[str, Any]:
        try:
            with connection.cursor() as cursor:
                sql_query = sql_query.strip()
                if sql_query.endswith(';'):
                    sql_query = sql_query[:-1]

                if 'LIMIT' not in sql_query.upper():
                    sql_query += ' LIMIT 100'

                cursor.execute(sql_query)

                columns = [desc[0] for desc in cursor.description] if cursor.description else []
                rows = cursor.fetchall()

                data = []
                for row in rows:
                    row_dict = {}
                    for i, value in enumerate(row):
                        if i < len(columns):
                            row_dict[columns[i]] = value
                    data.append(row_dict)

                return {
                    'success': True,
                    'data': data,
                    'columns': columns,
                    'row_count': len(data)
                }

        except Exception as e:
            logger.error(f"Erro na execução SQL: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }





    def _check_needs_clarification(
        self, question: str, chat_history: List[Dict]
    ) -> Optional[str]:
        """
        Verifica se a pergunta é ambígua e precisa de esclarecimento ANTES de gerar SQL.
        Retorna a pergunta de clarificação específica, ou None se a pergunta é clara.
        """
        try:
            import json as _json
            from langchain_core.messages import SystemMessage, HumanMessage

            history_context = ""
            if chat_history:
                last = chat_history[-4:]
                history_context = "\nHistórico recente:\n" + "\n".join(
                    f"{'Usuário' if m['role'] == 'user' else 'Gaby'}: {m['content'][:120]}"
                    for m in last
                )

            prompt = f"""Analise a pergunta do usuário e determine se ela é ambígua a ponto de precisar de esclarecimento.

Sistema Minerva: gerencia contratos, orçamentos, funcionários, auxílios, centros gestores e setores.
{history_context}

Pergunta: "{question}"

Responda APENAS com JSON:
{{
    "needs_clarification": true ou false,
    "clarification_question": "pergunta curta e específica (só se needs_clarification=true)"
}}

REGRAS ESTRITAS:
- needs_clarification = true SOMENTE se a pergunta não pode ser respondida sem info adicional obrigatória
- Perguntas que PRECISAM de clarificação: "contratos do funcionário" (qual?), "valor desse contrato" (qual?)
- Perguntas que NÃO precisam: "quantos contratos ativos?", "listar auxílios", "orçamentos de 2024"
- Se a pergunta for razoavelmente específica, NÃO peça clarificação
- A pergunta de clarificação deve ser direta, amigável e em português"""

            msgs = [
                SystemMessage(content="Avalie ambiguidade de perguntas. Responda apenas JSON válido."),
                HumanMessage(content=prompt),
            ]
            response = self.gemini_service.chat_model.invoke(msgs)
            content = response.content.strip()
            if content.startswith("```"):
                content = content.replace("```json", "").replace("```", "").strip()
            parsed = _json.loads(content)
            if parsed.get("needs_clarification") and parsed.get("clarification_question"):
                return str(parsed["clarification_question"])
            return None
        except Exception as exc:
            logger.warning(f"_check_needs_clarification falhou (continuando): {exc}")
            return None

    def _build_clarification_response(
        self,
        interpretation: Dict[str, Any],
        question: str,
        clarification_question: Optional[str] = None,
    ) -> Optional[Dict[str, Any]]:
        """
        Retorna resposta pedindo esclarecimento ao usuário.
        Usa clarification_question gerada pelo Gemini se disponível,
        ou cai back para perguntas estáticas baseadas na intenção.
        """
        try:
            if clarification_question:
                response_text = f"{clarification_question} 😊"
            else:
                from .business_rules import get_clarification_questions
                intent = interpretation.get("intent", "")
                questions = get_clarification_questions(intent)
                questions_text = "\n".join(f"• {q}" for q in questions[:3])
                response_text = (
                    "Para te ajudar melhor, preciso de mais alguns detalhes! 😊\n\n"
                    + questions_text
                )
            return {
                "success": True,
                "data": [],
                "sql_query": "",
                "humanized_response": response_text,
                "execution_time_ms": 0,
                "result_count": 0,
                "needs_clarification": True,
            }
        except Exception:
            return None

    @staticmethod
    def _compute_success_score(
        execution_result: Dict[str, Any],
        healing_attempts: int,
        interpretation: Dict[str, Any],
    ) -> Optional[float]:
        """
        Calcula um score simples de sucesso [0..1] baseado em:
        - resultado da execução (0.6 de peso)
        - ausência de healing (penaliza 0.1 por tentativa)
        - confiança reportada pelo Gemini (0.2 de peso)
        """
        try:
            base = 1.0 if execution_result.get('success') else 0.0
            healing_penalty = min(healing_attempts * 0.1, 0.3)
            confidence = float(interpretation.get('confidence', 0.8))
            score = (base * 0.8) + (confidence * 0.2) - healing_penalty
            return max(0.0, min(1.0, round(score, 4)))
        except Exception:
            return None
