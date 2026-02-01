"""
Comando Django para indexar documentos com embeddings para RAG.
Uso: python manage.py index_embeddings
"""
from django.core.management.base import BaseCommand
from ai_assistant.services import EmbeddingService, SQLInterpreterService


class Command(BaseCommand):
    help = 'Indexa documentos do sistema com embeddings para busca semântica (RAG)'

    def add_arguments(self, parser):
        parser.add_argument(
            '--schema-only',
            action='store_true',
            help='Indexar apenas o schema do banco de dados',
        )
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Limpar embeddings existentes antes de indexar',
        )

    def handle(self, *args, **options):
        embedding_service = EmbeddingService()
        sql_interpreter = SQLInterpreterService()

        self.stdout.write('Iniciando indexação de embeddings...')

        if options['clear']:
            from ai_assistant.models import DocumentEmbedding
            count = DocumentEmbedding.objects.all().delete()[0]
            self.stdout.write(f'  Removidos {count} embeddings existentes')

        # Indexa schema do banco
        self.stdout.write('Indexando schema do banco de dados...')
        schema_info = sql_interpreter.get_database_schema()
        schema_count = embedding_service.index_database_schema(schema_info)
        self.stdout.write(self.style.SUCCESS(f'  {schema_count} documentos de schema indexados'))

        if not options['schema_only']:
            # Indexa regras de negócio padrão
            self.stdout.write('Indexando regras de negócio...')
            business_rules = self._get_default_business_rules()
            rules_count = 0
            for rule in business_rules:
                doc = embedding_service.add_business_rule(
                    title=rule['title'],
                    content=rule['content'],
                    metadata=rule.get('metadata', {})
                )
                if doc:
                    rules_count += 1
            self.stdout.write(self.style.SUCCESS(f'  {rules_count} regras de negócio indexadas'))

            # Indexa FAQs padrão
            self.stdout.write('Indexando FAQs...')
            faqs = self._get_default_faqs()
            faq_count = 0
            for faq in faqs:
                doc = embedding_service.add_faq(
                    question=faq['question'],
                    answer=faq['answer'],
                    metadata=faq.get('metadata', {})
                )
                if doc:
                    faq_count += 1
            self.stdout.write(self.style.SUCCESS(f'  {faq_count} FAQs indexadas'))

            # Indexa exemplos de consultas
            self.stdout.write('Indexando exemplos de consultas...')
            examples = self._get_query_examples()
            examples_count = 0
            for example in examples:
                doc = embedding_service.add_query_example(
                    natural_language=example['question'],
                    sql_query=example['sql'],
                    explanation=example.get('explanation', '')
                )
                if doc:
                    examples_count += 1
            self.stdout.write(self.style.SUCCESS(f'  {examples_count} exemplos de consultas indexados'))

        self.stdout.write(self.style.SUCCESS('Indexação concluída!'))

    def _get_default_business_rules(self):
        """Retorna regras de negócio padrão do sistema Minerva"""
        return [
            {
                'title': 'Tipos de Orçamento',
                'content': 'O sistema Minerva trabalha com dois tipos de orçamento: CAPEX (despesas de capital/investimentos) e OPEX (despesas operacionais). Cada orçamento é vinculado a um centro gestor e a um ano específico.',
                'metadata': {'module': 'budget'}
            },
            {
                'title': 'Status de Contratos',
                'content': 'Contratos podem ter os seguintes status: ATIVO (em vigência), ENCERRADO (finalizado), SUSPENSO (temporariamente pausado). O status é determinado automaticamente com base nas datas de vigência.',
                'metadata': {'module': 'contract'}
            },
            {
                'title': 'Hierarquia Organizacional',
                'content': 'A hierarquia do sistema segue a estrutura: Presidência > Direção > Gerência > Coordenação > Funcionário. Cada nível tem acesso apenas aos dados de sua área e subordinados.',
                'metadata': {'module': 'organization'}
            },
            {
                'title': 'Cálculo de Valor Disponível',
                'content': 'O valor disponível de um orçamento é calculado como: valor_total - valor_empenhado - valor_comprometido. Movimentações entre orçamentos afetam esses valores.',
                'metadata': {'module': 'budget'}
            },
            {
                'title': 'Parcelas de Contrato',
                'content': 'Contratos podem ter múltiplas parcelas com datas de vencimento específicas. O valor total das parcelas deve ser igual ao valor do contrato.',
                'metadata': {'module': 'contract'}
            }
        ]

    def _get_default_faqs(self):
        """Retorna FAQs padrão do sistema"""
        return [
            {
                'question': 'Como consultar contratos próximos do vencimento?',
                'answer': 'Para ver contratos próximos do vencimento, consulte a tabela contract_contract filtrando pela coluna expiration_date. Contratos com status ATIVO e data de expiração nos próximos 30 dias são considerados próximos do vencimento.'
            },
            {
                'question': 'Como verificar o saldo disponível de um orçamento?',
                'answer': 'O saldo disponível está na coluna available_amount da tabela budget_budget. Este valor é atualizado automaticamente quando há movimentações ou novos empenhos.'
            },
            {
                'question': 'Como listar funcionários de uma coordenação?',
                'answer': 'Consulte a tabela employee_employee filtrando pelo campo coordination_id. Os funcionários estão vinculados a coordenações específicas na estrutura organizacional.'
            },
            {
                'question': 'Qual a diferença entre valor original e valor atual do contrato?',
                'answer': 'O valor original (original_value) é o valor inicial do contrato quando assinado. O valor atual (current_value) inclui aditivos e reajustes aplicados ao longo do tempo.'
            }
        ]

    def _get_query_examples(self):
        """Retorna exemplos de consultas SQL"""
        return [
            {
                'question': 'Quantos contratos ativos existem?',
                'sql': "SELECT COUNT(*) as total FROM contract_contract WHERE status = 'ATIVO'",
                'explanation': 'Conta todos os contratos com status ativo'
            },
            {
                'question': 'Qual o valor total dos orçamentos de 2024?',
                'sql': "SELECT SUM(total_amount) as total FROM budget_budget WHERE year = 2024",
                'explanation': 'Soma o valor total de todos os orçamentos do ano 2024'
            },
            {
                'question': 'Liste os 10 maiores contratos por valor',
                'sql': "SELECT protocol_number, current_value FROM contract_contract ORDER BY current_value DESC LIMIT 10",
                'explanation': 'Retorna os 10 contratos com maior valor atual'
            },
            {
                'question': 'Quais contratos vencem este mês?',
                'sql': "SELECT protocol_number, expiration_date FROM contract_contract WHERE expiration_date >= DATE_TRUNC('month', CURRENT_DATE) AND expiration_date < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' AND status = 'ATIVO'",
                'explanation': 'Lista contratos ativos que vencem no mês atual (PostgreSQL)'
            },
            {
                'question': 'Qual o orçamento disponível por categoria?',
                'sql': "SELECT category, SUM(available_amount) as disponivel FROM budget_budget WHERE status = 'ATIVO' GROUP BY category",
                'explanation': 'Agrupa orçamentos ativos por categoria (CAPEX/OPEX) e soma os valores disponíveis'
            }
        ]
