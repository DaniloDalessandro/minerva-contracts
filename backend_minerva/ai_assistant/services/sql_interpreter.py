import time
import logging
from typing import Dict, Any, List, Optional
from django.db import connection
from django.conf import settings
from .gemini_service import GeminiService, ALICE_FRIENDLY_ERROR
from .embedding_service import EmbeddingService
from ..models import DatabaseSchema, QueryLog, ConversationSession

logger = logging.getLogger(__name__)

# Mensagens amigáveis para o usuário (sem termos técnicos)
FRIENDLY_MESSAGES = {
    'interpretation_error': "Desculpe, não consegui entender sua solicitação dessa vez. Pode reformular a pergunta ou me dar mais detalhes? 😊",
    'validation_error': "Não consegui processar essa informação no momento. Pode tentar de outra forma?",
    'execution_error': "Tive dificuldade em encontrar essas informações agora. Que tal tentar de outra forma?",
    'internal_error': "Desculpe, algo não saiu como esperado. Pode tentar novamente em alguns instantes?",
    'no_results': "Não encontrei informações sobre isso. Pode me dar mais detalhes para que eu possa ajudar melhor?",
}


# Helper function for secure error responses
def get_error_details(exception):
    """
    Returns exception details only if DEBUG is enabled.
    In production, returns a generic message to avoid information leakage.
    """
    if settings.DEBUG:
        return str(exception)
    return "Contact support for more information"


class SQLInterpreterService:
    """
    Serviço para interpretar perguntas em linguagem natural e executar consultas SQL.
    Suporta RAG com pgvector para enriquecer respostas.
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

    def _check_database_type(self) -> bool:
        """Verifica se o banco é PostgreSQL"""
        return 'postgresql' in settings.DATABASES['default']['ENGINE']
        
    def get_database_schema(self) -> str:
        """
        Obtém informações sobre o schema do banco de dados
        """
        try:
            # Busca informações do schema cache ou gera novo
            schema_info = self._get_cached_schema()
            if not schema_info:
                schema_info = self._generate_schema_info()
                self._cache_schema_info(schema_info)
            
            return schema_info
            
        except Exception as e:
            logger.error(f"Erro ao obter schema do banco: {str(e)}")
            return self._get_basic_schema_fallback()
    
    def _get_cached_schema(self) -> Optional[str]:
        """
        Busca informações de schema em cache
        """
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
        """
        Gera informações detalhadas do schema do banco.
        Suporta SQLite e PostgreSQL.
        """
        with connection.cursor() as cursor:
            schema_info = "ESQUEMA DO BANCO DE DADOS MINERVA:\n\n"

            if self._is_postgresql:
                # PostgreSQL - usa information_schema
                cursor.execute("""
                    SELECT table_name FROM information_schema.tables
                    WHERE table_schema = 'public'
                    AND table_type = 'BASE TABLE'
                    AND table_name NOT LIKE 'django_%'
                    AND table_name NOT LIKE 'auth_%'
                    ORDER BY table_name
                """)
            else:
                # SQLite
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

                # Obtém informações das colunas
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

                        # Adiciona exemplos de valores
                        try:
                            cursor.execute(f'SELECT DISTINCT "{col_name}" FROM "{table_name}" WHERE "{col_name}" IS NOT NULL LIMIT 3')
                            samples = cursor.fetchall()
                            if samples:
                                sample_values = [str(s[0]) for s in samples]
                                schema_info += f" - Exemplos: {', '.join(sample_values)}"
                        except:
                            pass

                        schema_info += "\n"
                else:
                    # SQLite
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
                            cursor.execute(f"SELECT DISTINCT {col_name} FROM {table_name} WHERE {col_name} IS NOT NULL LIMIT 3")
                            samples = cursor.fetchall()
                            if samples:
                                sample_values = [str(s[0]) for s in samples]
                                schema_info += f" - Exemplos: {', '.join(sample_values)}"
                        except:
                            pass

                        schema_info += "\n"

            return schema_info
    
    def _get_table_descriptions(self) -> Dict[str, str]:
        """
        Retorna descrições das principais tabelas do sistema
        """
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
        """
        Schema básico em caso de falha
        """
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
        """
        Salva informações do schema em cache para uso futuro
        """
        # Este método poderia implementar cache mais sofisticado
        # Por enquanto, apenas registra que foi chamado
        logger.info("Schema info cached")
    
    # Consultas predefinidas para palavras-chave simples (economiza API e é mais confiável)
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

        # Palavras que indicam consulta de dados (não são saudações)
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

        # Se contém palavra de dados, NÃO é saudação
        if any(keyword in text_lower for keyword in data_keywords):
            return False

        # Verifica se é saudação
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

        # Saudação padrão
        return """Olá! 😊 Eu sou a Alice, sua assistente virtual do Sistema Minerva.

Posso ajudar você a encontrar informações sobre contratos, orçamentos, funcionários e muito mais.

É só me dizer o que você precisa!"""

    def interpret_and_execute(self, user_question: str, session: ConversationSession) -> Dict[str, Any]:
        """
        Interpreta pergunta e executa consulta SQL.
        Usa RAG com pgvector para enriquecer o contexto.

        Args:
            user_question: Pergunta do usuário
            session: Sessão da conversa

        Returns:
            Dict com resultados e metadados
        """
        start_time = time.time()

        try:
            # Verifica se é uma saudação ou conversa casual
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

            # Verifica se há consulta predefinida para a palavra-chave
            predefined = self._get_predefined_query(user_question)
            if predefined:
                logger.info(f"Usando consulta predefinida para: {user_question}")
                sql_query = predefined['sql']
                interpretation = {'intent': predefined['intent'], 'sql': sql_query}

                # Executa a consulta predefinida
                execution_result = self._execute_sql_query(sql_query)
                execution_time = int((time.time() - start_time) * 1000)

                if execution_result['success']:
                    data = execution_result['data']
                    count = len(data)

                    # Tenta gerar resposta humanizada, com fallback se falhar
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

                    # Fallback se a humanização falhar
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

            # Obtém schema do banco
            schema_info = self.get_database_schema()

            # Busca contexto relevante via RAG (embeddings)
            context_documents = self.embedding_service.get_context_for_query(
                query=user_question,
                include_schema=True,
                include_business_rules=True,
                include_faqs=True,
                limit_per_type=3
            )

            # Interpreta a pergunta usando Gemini
            interpretation_result = self.gemini_service.interpret_natural_language_query(
                user_question, schema_info
            )

            if not interpretation_result['success']:
                logger.warning(f"Falha na interpretação: {interpretation_result.get('error', 'Erro desconhecido')}")
                return {
                    'success': False,
                    'error': FRIENDLY_MESSAGES['interpretation_error'],
                    'humanized_response': FRIENDLY_MESSAGES['interpretation_error'],
                    'details': interpretation_result.get('error', '')
                }

            interpretation = interpretation_result['interpretation']
            sql_query = interpretation.get('sql', '')

            # Valida a consulta SQL
            validation_result = self._validate_sql_query(sql_query)
            if not validation_result['valid']:
                logger.warning(f"SQL inválido: {validation_result['error']}")
                return {
                    'success': False,
                    'error': FRIENDLY_MESSAGES['validation_error'],
                    'humanized_response': FRIENDLY_MESSAGES['validation_error'],
                    'details': validation_result['error']
                }

            # Executa a consulta
            execution_result = self._execute_sql_query(sql_query)
            execution_time = int((time.time() - start_time) * 1000)

            # Log da consulta
            query_log = QueryLog.objects.create(
                session=session,
                user_question=user_question,
                interpreted_intent=interpretation.get('intent', ''),
                generated_sql=sql_query,
                execution_status='SUCCESS' if execution_result['success'] else 'ERROR',
                execution_time_ms=execution_time,
                result_count=len(execution_result.get('data', [])) if execution_result['success'] else None,
                error_message=execution_result.get('error', ''),
                gemini_response=interpretation_result
            )

            if execution_result['success']:
                # Gera resposta humanizada usando RAG
                humanized_response = self.gemini_service.generate_humanized_response(
                    query_result=execution_result['data'],
                    original_question=user_question,
                    sql_query=sql_query,
                    context_documents=context_documents
                )

                return {
                    'success': True,
                    'data': execution_result['data'],
                    'sql_query': sql_query,
                    'interpretation': interpretation,
                    'humanized_response': humanized_response.get('content', ''),
                    'execution_time_ms': execution_time,
                    'result_count': len(execution_result['data']),
                    'query_log_id': query_log.id,
                    'context_used': len(context_documents)
                }
            else:
                logger.warning(f"Erro na execução: {execution_result['error']}")
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
        """
        Valida se a consulta SQL é segura para execução
        """
        if not sql_query or not sql_query.strip():
            return {'valid': False, 'error': 'Consulta SQL vazia'}
        
        sql_upper = sql_query.upper().strip()
        
        # Permite apenas SELECT
        if not sql_upper.startswith('SELECT'):
            return {'valid': False, 'error': 'Apenas consultas SELECT são permitidas'}
        
        # Verifica comandos perigosos
        dangerous_keywords = ['DELETE', 'DROP', 'INSERT', 'UPDATE', 'ALTER', 'CREATE', 'TRUNCATE']
        for keyword in dangerous_keywords:
            if keyword in sql_upper:
                return {'valid': False, 'error': f'Comando {keyword} não é permitido'}
        
        # Verifica se usa apenas tabelas seguras
        used_tables = self._extract_table_names(sql_query)
        for table in used_tables:
            if table not in self.safe_tables:
                return {'valid': False, 'error': f'Acesso à tabela {table} não é permitido'}
        
        return {'valid': True}
    
    def _extract_table_names(self, sql_query: str) -> List[str]:
        """
        Extrai nomes de tabelas da consulta SQL (implementação básica)
        """
        # Implementação simplificada - poderia ser mais sofisticada
        import re
        
        # Remove comentários e strings
        sql_clean = re.sub(r'--.*?\n', '', sql_query)
        sql_clean = re.sub(r'/\*.*?\*/', '', sql_clean, flags=re.DOTALL)
        sql_clean = re.sub(r"'[^']*'", "''", sql_clean)
        sql_clean = re.sub(r'"[^"]*"', '""', sql_clean)
        
        # Busca por padrões FROM e JOIN
        table_pattern = r'\b(?:FROM|JOIN)\s+([a-zA-Z_][a-zA-Z0-9_]*)'
        matches = re.findall(table_pattern, sql_clean, re.IGNORECASE)
        
        return [match.lower() for match in matches]
    
    def _execute_sql_query(self, sql_query: str) -> Dict[str, Any]:
        """
        Executa consulta SQL de forma segura
        """
        try:
            with connection.cursor() as cursor:
                # Remove ponto e vírgula final se existir
                sql_query = sql_query.strip()
                if sql_query.endswith(';'):
                    sql_query = sql_query[:-1]
                
                # Adiciona LIMIT se não existir
                if 'LIMIT' not in sql_query.upper():
                    sql_query += ' LIMIT 100'
                
                cursor.execute(sql_query)
                
                # Obtém nomes das colunas
                columns = [desc[0] for desc in cursor.description] if cursor.description else []
                
                # Obtém dados
                rows = cursor.fetchall()
                
                # Converte para lista de dicionários
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