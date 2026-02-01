from django.core.management.base import BaseCommand
from django.db import connection
from ai_assistant.models import DatabaseSchema
import logging

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Popula o modelo DatabaseSchema com informações sobre o banco de dados'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--force',
            action='store_true',
            help='Força a recriação dos dados, removendo os existentes',
        )
    
    def handle(self, *args, **options):
        force = options['force']
        
        if force:
            self.stdout.write('Removendo dados existentes do schema...')
            DatabaseSchema.objects.all().delete()
        
        # Tabelas do sistema que devem ser incluídas no schema
        safe_tables = {
            'contract_contract': 'Contratos do sistema',
            'budget_budget': 'Orçamentos anuais',
            'budget_budgetmovement': 'Movimentações orçamentárias',
            'budgetline_budgetline': 'Linhas orçamentárias',
            'budgetline_budgetlineversion': 'Versões das linhas orçamentárias',
            'employee_employee': 'Funcionários',
            'accounts_user': 'Usuários do sistema',
            'contract_contractinstallment': 'Parcelas dos contratos',
            'contract_contractamendment': 'Aditivos contratuais',
            'center_management_center': 'Centros gestores',
            'center_requesting_center': 'Centros solicitantes',
            'aid_assistance': 'Auxílios concedidos',
            'sector_direction': 'Direções',
            'sector_coordination': 'Coordenações',
            'sector_management': 'Gerências'
        }
        
        # Significados de negócio para colunas específicas
        business_meanings = {
            'contract_contract': {
                'protocol_number': 'Número único do protocolo do contrato',
                'signing_date': 'Data em que o contrato foi assinado',
                'expiration_date': 'Data de vencimento/expiração do contrato',
                'original_value': 'Valor original do contrato em reais',
                'current_value': 'Valor atual do contrato (pode diferir do original devido a aditivos)',
                'start_date': 'Data de início da vigência do contrato',
                'end_date': 'Data de término da vigência do contrato',
                'status': 'Status atual do contrato (ATIVO, ENCERRADO)',
                'payment_nature': 'Tipo de pagamento (MENSAL, ÚNICO, etc.)',
                'description': 'Descrição do objeto do contrato'
            },
            'budget_budget': {
                'year': 'Ano de referência do orçamento',
                'category': 'Categoria do orçamento (CAPEX - investimentos, OPEX - operacional)',
                'total_amount': 'Valor total do orçamento em reais',
                'available_amount': 'Valor ainda disponível para uso em reais',
                'status': 'Status do orçamento (ATIVO, INATIVO)'
            },
            'employee_employee': {
                'name': 'Nome completo do funcionário',
                'cpf': 'CPF do funcionário',
                'admission_date': 'Data de admissão do funcionário',
                'status': 'Situação atual do funcionário na empresa'
            },
            'aid_assistance': {
                'status': 'Status do auxílio (ATIVO, INATIVO, SUSPENSO)',
                'value': 'Valor mensal do auxílio em reais',
                'start_date': 'Data de início do benefício',
                'end_date': 'Data de término do benefício (se aplicável)'
            }
        }
        
        created_count = 0
        
        with connection.cursor() as cursor:
            # Lista todas as tabelas do banco
            cursor.execute("""
                SELECT name FROM sqlite_master 
                WHERE type='table' AND name NOT LIKE 'sqlite_%' 
                AND name NOT LIKE 'django_%' 
                AND name NOT LIKE 'auth_%'
                ORDER BY name
            """)
            
            all_tables = cursor.fetchall()
            
            for table_row in all_tables:
                table_name = table_row[0]
                
                if table_name not in safe_tables:
                    continue
                
                self.stdout.write(f'Processando tabela: {table_name}')
                
                # Obtém informações das colunas
                cursor.execute(f"PRAGMA table_info({table_name})")
                columns = cursor.fetchall()
                
                for col in columns:
                    col_name = col[1]
                    col_type = col[2]
                    not_null = bool(col[3])
                    default_value = col[4]
                    
                    # Busca exemplos de valores
                    sample_values = []
                    try:
                        cursor.execute(f"""
                            SELECT DISTINCT {col_name} 
                            FROM {table_name} 
                            WHERE {col_name} IS NOT NULL 
                            LIMIT 3
                        """)
                        samples = cursor.fetchall()
                        sample_values = [str(s[0]) for s in samples if s[0] is not None]
                    except Exception as e:
                        logger.warning(f"Erro ao buscar amostras para {table_name}.{col_name}: {e}")
                    
                    # Obtém significado de negócio se disponível
                    business_meaning = ''
                    if table_name in business_meanings and col_name in business_meanings[table_name]:
                        business_meaning = business_meanings[table_name][col_name]
                    
                    # Cria ou atualiza o registro do schema
                    schema_obj, created = DatabaseSchema.objects.get_or_create(
                        table_name=table_name,
                        column_name=col_name,
                        defaults={
                            'data_type': col_type,
                            'is_nullable': not not_null,
                            'column_default': default_value,
                            'column_description': f'Coluna {col_name} da tabela {table_name}',
                            'business_meaning': business_meaning,
                            'sample_values': sample_values
                        }
                    )
                    
                    if not created:
                        # Atualiza com novos dados se necessário
                        schema_obj.data_type = col_type
                        schema_obj.is_nullable = not not_null
                        schema_obj.column_default = default_value
                        schema_obj.sample_values = sample_values
                        if business_meaning:
                            schema_obj.business_meaning = business_meaning
                        schema_obj.save()
                    
                    created_count += 1
        
        # Cria algumas configurações padrão para o Alice
        from ai_assistant.models import AliceConfiguration
        
        default_configs = [
            {
                'key': 'max_query_results',
                'value': '100',
                'description': 'Número máximo de resultados retornados por consulta'
            },
            {
                'key': 'default_date_format',
                'value': 'DD/MM/YYYY',
                'description': 'Formato padrão para exibição de datas'
            },
            {
                'key': 'currency_format',
                'value': 'R$ X.XXX,XX',
                'description': 'Formato padrão para valores monetários'
            },
            {
                'key': 'context_window_size',
                'value': '5',
                'description': 'Número de mensagens anteriores consideradas no contexto'
            }
        ]
        
        config_count = 0
        for config_data in default_configs:
            config, created = AliceConfiguration.objects.get_or_create(
                key=config_data['key'],
                defaults={
                    'value': config_data['value'],
                    'description': config_data['description'],
                    'is_active': True
                }
            )
            if created:
                config_count += 1
        
        self.stdout.write(
            self.style.SUCCESS(
                f'Schema populado com sucesso! '
                f'{created_count} registros de schema criados/atualizados. '
                f'{config_count} configurações padrão criadas.'
            )
        )