from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.contrib.postgres.indexes import GinIndex

try:
    from pgvector.django import VectorField, HnswIndex
    PGVECTOR_AVAILABLE = True
except ImportError:
    PGVECTOR_AVAILABLE = False

User = get_user_model()


class ConversationSession(models.Model):
    """
    Armazena sessões de conversa com o agente Alice
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='alice_sessions')
    session_id = models.CharField(max_length=100, unique=True, verbose_name='ID da Sessão')
    title = models.CharField(max_length=200, blank=True, verbose_name='Título da Conversa')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Criado em')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Atualizado em')
    is_active = models.BooleanField(default=True, verbose_name='Ativa')

    def __str__(self):
        return f"Sessão {self.session_id} - {self.user.username}"

    class Meta:
        verbose_name = 'Sessão de Conversa'
        verbose_name_plural = 'Sessões de Conversa'
        ordering = ['-updated_at']
        indexes = [
            models.Index(fields=['user', 'is_active']),
            models.Index(fields=['user', '-updated_at']),
        ]


class ConversationMessage(models.Model):
    """
    Armazena mensagens individuais da conversa com Alice
    """
    MESSAGE_TYPES = [
        ('USER', 'Usuário'),
        ('ASSISTANT', 'Alice'),
        ('SYSTEM', 'Sistema'),
        ('ERROR', 'Erro'),
    ]

    session = models.ForeignKey(
        ConversationSession,
        on_delete=models.CASCADE,
        related_name='messages'
    )
    message_type = models.CharField(max_length=10, choices=MESSAGE_TYPES)
    content = models.TextField(verbose_name='Conteúdo')
    metadata = models.JSONField(default=dict, blank=True, verbose_name='Metadados')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Criado em')

    def __str__(self):
        return f"{self.get_message_type_display()}: {self.content[:50]}..."

    class Meta:
        verbose_name = 'Mensagem'
        verbose_name_plural = 'Mensagens'
        ordering = ['created_at']
        indexes = [
            models.Index(fields=['session']),
            models.Index(fields=['session', 'message_type']),
        ]


class QueryLog(models.Model):
    """
    Log das consultas SQL geradas e executadas pelo agente Alice
    """
    STATUS_CHOICES = [
        ('SUCCESS', 'Sucesso'),
        ('ERROR', 'Erro'),
        ('PENDING', 'Pendente'),
    ]

    session = models.ForeignKey(
        ConversationSession,
        on_delete=models.CASCADE,
        related_name='queries'
    )
    user_question = models.TextField(verbose_name='Pergunta do Usuário')
    interpreted_intent = models.TextField(verbose_name='Intenção Interpretada')
    generated_sql = models.TextField(verbose_name='SQL Gerado')
    execution_status = models.CharField(max_length=10, choices=STATUS_CHOICES)
    execution_time_ms = models.IntegerField(null=True, blank=True, verbose_name='Tempo de Execução (ms)')
    result_count = models.IntegerField(null=True, blank=True, verbose_name='Quantidade de Resultados')
    error_message = models.TextField(blank=True, verbose_name='Mensagem de Erro')
    gemini_response = models.JSONField(default=dict, blank=True, verbose_name='Resposta do Gemini')
    success_score = models.FloatField(null=True, blank=True, verbose_name='Score de Sucesso')
    healing_attempts = models.IntegerField(default=0, verbose_name='Tentativas de Healing')
    context_used = models.JSONField(default=dict, blank=True, verbose_name='Contexto Utilizado')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Criado em')

    def __str__(self):
        return f"Query: {self.user_question[:50]}... - {self.execution_status}"

    class Meta:
        verbose_name = 'Log de Consulta'
        verbose_name_plural = 'Logs de Consultas'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['session']),
            models.Index(fields=['execution_status']),
            models.Index(fields=['session', 'execution_status']),
        ]


class DatabaseSchema(models.Model):
    """
    Armazena informações sobre o esquema do banco de dados para ajudar o Alice
    """
    table_name = models.CharField(max_length=100, verbose_name='Nome da Tabela')
    column_name = models.CharField(max_length=100, verbose_name='Nome da Coluna')
    data_type = models.CharField(max_length=50, verbose_name='Tipo de Dados')
    is_nullable = models.BooleanField(default=True, verbose_name='Permite Null')
    column_default = models.TextField(blank=True, null=True, verbose_name='Valor Padrão')
    column_description = models.TextField(blank=True, verbose_name='Descrição da Coluna')
    business_meaning = models.TextField(blank=True, verbose_name='Significado de Negócio')
    sample_values = models.JSONField(default=list, blank=True, verbose_name='Valores de Exemplo')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.table_name}.{self.column_name}"

    class Meta:
        verbose_name = 'Esquema do Banco'
        verbose_name_plural = 'Esquemas do Banco'
        unique_together = ['table_name', 'column_name']
        ordering = ['table_name', 'column_name']


class AliceConfiguration(models.Model):
    """
    Configurações do agente Alice
    """
    key = models.CharField(max_length=100, unique=True, verbose_name='Chave')
    value = models.TextField(verbose_name='Valor')
    description = models.TextField(blank=True, verbose_name='Descrição')
    is_active = models.BooleanField(default=True, verbose_name='Ativo')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.key}: {self.value[:50]}..."

    class Meta:
        verbose_name = 'Configuração do Alice'
        verbose_name_plural = 'Configurações do Alice'
        ordering = ['key']


class DocumentEmbedding(models.Model):
    """
    Armazena documentos com seus embeddings vetoriais para busca semântica.
    Usa pgvector para busca por similaridade em produção.
    """
    DOCUMENT_TYPES = [
        ('SCHEMA', 'Schema do Banco'),
        ('BUSINESS_RULE', 'Regra de Negócio'),
        ('FAQ', 'Perguntas Frequentes'),
        ('CONTEXT', 'Contexto do Sistema'),
        ('QUERY_EXAMPLE', 'Exemplo de Consulta'),
    ]

    document_type = models.CharField(
        max_length=20,
        choices=DOCUMENT_TYPES,
        verbose_name='Tipo de Documento'
    )
    title = models.CharField(max_length=255, verbose_name='Título')
    content = models.TextField(verbose_name='Conteúdo')
    metadata = models.JSONField(default=dict, blank=True, verbose_name='Metadados')


    if PGVECTOR_AVAILABLE:
        embedding = VectorField(dimensions=768, null=True, blank=True, verbose_name='Embedding')
    else:
        embedding = models.JSONField(null=True, blank=True, verbose_name='Embedding (JSON fallback)')

    is_active = models.BooleanField(default=True, verbose_name='Ativo')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"[{self.get_document_type_display()}] {self.title}"

    class Meta:
        verbose_name = 'Embedding de Documento'
        verbose_name_plural = 'Embeddings de Documentos'
        ordering = ['-created_at']
        if PGVECTOR_AVAILABLE:
            indexes = [
                HnswIndex(
                    name='embedding_hnsw_idx',
                    fields=['embedding'],
                    m=16,
                    ef_construction=64,
                    opclasses=['vector_cosine_ops'],
                )
            ]


class FewShotExample(models.Model):
    """
    Exemplos few-shot para RAG de geração SQL.
    Armazena pares pergunta/SQL bem-sucedidos para enriquecer prompts futuros.
    """
    user_question = models.TextField(verbose_name='Pergunta do Usuário')
    canonical_sql = models.TextField(verbose_name='SQL Canônico')
    intent = models.TextField(verbose_name='Intenção')
    tables_used = models.JSONField(default=list, blank=True, verbose_name='Tabelas Utilizadas')
    success_count = models.IntegerField(default=1, verbose_name='Contagem de Sucesso')
    failure_count = models.IntegerField(default=0, verbose_name='Contagem de Falha')
    avg_result_count = models.FloatField(default=0.0, verbose_name='Média de Resultados')
    avg_execution_ms = models.FloatField(default=0.0, verbose_name='Média de Execução (ms)')
    is_active = models.BooleanField(default=True, verbose_name='Ativo')

    if PGVECTOR_AVAILABLE:
        embedding = VectorField(dimensions=768, null=True, blank=True, verbose_name='Embedding')
    else:
        embedding = models.JSONField(null=True, blank=True, verbose_name='Embedding (JSON fallback)')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"FewShot: {self.user_question[:80]}"

    class Meta:
        verbose_name = 'Exemplo Few-Shot'
        verbose_name_plural = 'Exemplos Few-Shot'
        ordering = ['-success_count', '-created_at']
        if PGVECTOR_AVAILABLE:
            indexes = [
                HnswIndex(
                    name='fewshot_embedding_hnsw_idx',
                    fields=['embedding'],
                    m=16,
                    ef_construction=64,
                    opclasses=['vector_cosine_ops'],
                )
            ]


class FeedbackLog(models.Model):
    """
    Registra feedback explícito do usuário sobre respostas da Alice.
    """
    RATING_CHOICES = [
        ('POSITIVE', 'Positivo 👍'),
        ('NEGATIVE', 'Negativo 👎'),
    ]

    session = models.ForeignKey(
        ConversationSession,
        on_delete=models.CASCADE,
        related_name='feedbacks'
    )
    query_log = models.ForeignKey(
        QueryLog,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='feedbacks'
    )
    rating = models.CharField(max_length=10, choices=RATING_CHOICES)
    correction = models.TextField(
        blank=True,
        verbose_name='Correção do usuário',
        help_text='SQL ou resposta correta sugerida pelo usuário'
    )
    user_question = models.TextField(verbose_name='Pergunta original')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Feedback'
        verbose_name_plural = 'Feedbacks'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['session']),
            models.Index(fields=['rating']),
        ]

    def __str__(self):
        return f"{self.get_rating_display()} - {self.user_question[:50]}"


class ConversationEmbedding(models.Model):
    """
    Armazena embeddings de conversas anteriores para melhorar contexto.
    Permite recuperar conversas relevantes para o contexto atual.
    """
    session = models.ForeignKey(
        ConversationSession,
        on_delete=models.CASCADE,
        related_name='embeddings'
    )
    message = models.ForeignKey(
        ConversationMessage,
        on_delete=models.CASCADE,
        related_name='embeddings',
        null=True,
        blank=True
    )
    content_summary = models.TextField(verbose_name='Resumo do Conteúdo')


    if PGVECTOR_AVAILABLE:
        embedding = VectorField(dimensions=768, null=True, blank=True, verbose_name='Embedding')
    else:
        embedding = models.JSONField(null=True, blank=True, verbose_name='Embedding (JSON fallback)')

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Embedding - Sessão {self.session.session_id}"

    class Meta:
        verbose_name = 'Embedding de Conversa'
        verbose_name_plural = 'Embeddings de Conversas'
        ordering = ['-created_at']
        if PGVECTOR_AVAILABLE:
            indexes = [
                HnswIndex(
                    name='conv_embedding_hnsw_idx',
                    fields=['embedding'],
                    m=16,
                    ef_construction=64,
                    opclasses=['vector_cosine_ops'],
                )
            ]