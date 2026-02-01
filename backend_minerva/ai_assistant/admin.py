from django.contrib import admin
from .models import (
    ConversationSession,
    ConversationMessage,
    QueryLog,
    DatabaseSchema,
    AliceConfiguration,
    DocumentEmbedding,
    ConversationEmbedding
)


@admin.register(ConversationSession)
class ConversationSessionAdmin(admin.ModelAdmin):
    list_display = ['session_id', 'user', 'title', 'is_active', 'created_at', 'updated_at']
    list_filter = ['is_active', 'created_at', 'updated_at']
    search_fields = ['session_id', 'title', 'user__username']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(ConversationMessage)
class ConversationMessageAdmin(admin.ModelAdmin):
    list_display = ['session', 'message_type', 'content_preview', 'created_at']
    list_filter = ['message_type', 'created_at']
    search_fields = ['content']
    readonly_fields = ['created_at']
    
    def content_preview(self, obj):
        return obj.content[:100] + '...' if len(obj.content) > 100 else obj.content
    content_preview.short_description = 'Conteúdo'


@admin.register(QueryLog)
class QueryLogAdmin(admin.ModelAdmin):
    list_display = ['session', 'question_preview', 'execution_status', 'execution_time_ms', 'result_count', 'created_at']
    list_filter = ['execution_status', 'created_at']
    search_fields = ['user_question', 'generated_sql']
    readonly_fields = ['created_at']
    
    def question_preview(self, obj):
        return obj.user_question[:50] + '...' if len(obj.user_question) > 50 else obj.user_question
    question_preview.short_description = 'Pergunta'


@admin.register(DatabaseSchema)
class DatabaseSchemaAdmin(admin.ModelAdmin):
    list_display = ['table_name', 'column_name', 'data_type', 'is_nullable', 'created_at']
    list_filter = ['table_name', 'data_type', 'is_nullable']
    search_fields = ['table_name', 'column_name', 'business_meaning']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(AliceConfiguration)
class AliceConfigurationAdmin(admin.ModelAdmin):
    list_display = ['key', 'value_preview', 'is_active', 'created_at', 'updated_at']
    list_filter = ['is_active', 'created_at']
    search_fields = ['key', 'value', 'description']
    readonly_fields = ['created_at', 'updated_at']

    def value_preview(self, obj):
        return obj.value[:50] + '...' if len(obj.value) > 50 else obj.value
    value_preview.short_description = 'Valor'


@admin.register(DocumentEmbedding)
class DocumentEmbeddingAdmin(admin.ModelAdmin):
    list_display = ['title', 'document_type', 'is_active', 'has_embedding', 'created_at']
    list_filter = ['document_type', 'is_active', 'created_at']
    search_fields = ['title', 'content']
    readonly_fields = ['created_at', 'updated_at']

    def has_embedding(self, obj):
        return bool(obj.embedding)
    has_embedding.boolean = True
    has_embedding.short_description = 'Embedding'


@admin.register(ConversationEmbedding)
class ConversationEmbeddingAdmin(admin.ModelAdmin):
    list_display = ['session', 'content_preview', 'has_embedding', 'created_at']
    list_filter = ['created_at']
    search_fields = ['content_summary']
    readonly_fields = ['created_at']

    def content_preview(self, obj):
        return obj.content_summary[:100] + '...' if len(obj.content_summary) > 100 else obj.content_summary
    content_preview.short_description = 'Resumo'

    def has_embedding(self, obj):
        return bool(obj.embedding)
    has_embedding.boolean = True
    has_embedding.short_description = 'Embedding'