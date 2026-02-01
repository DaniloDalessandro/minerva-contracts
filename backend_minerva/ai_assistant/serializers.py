from rest_framework import serializers
from .models import (
    ConversationSession, 
    ConversationMessage, 
    QueryLog, 
    DatabaseSchema, 
    AliceConfiguration
)


class ConversationSessionSerializer(serializers.ModelSerializer):
    """
    Serializer para sessões de conversa
    """
    message_count = serializers.IntegerField(read_only=True)
    last_message_at = serializers.DateTimeField(read_only=True)
    
    class Meta:
        model = ConversationSession
        fields = [
            'id', 'session_id', 'title', 'created_at', 
            'updated_at', 'is_active', 'message_count', 'last_message_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class ConversationMessageSerializer(serializers.ModelSerializer):
    """
    Serializer para mensagens da conversa
    """
    message_type_display = serializers.CharField(source='get_message_type_display', read_only=True)
    
    class Meta:
        model = ConversationMessage
        fields = [
            'id', 'message_type', 'message_type_display', 
            'content', 'metadata', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class ConversationDetailSerializer(ConversationSessionSerializer):
    """
    Serializer detalhado para sessão com mensagens
    """
    messages = ConversationMessageSerializer(many=True, read_only=True)
    
    class Meta(ConversationSessionSerializer.Meta):
        fields = ConversationSessionSerializer.Meta.fields + ['messages']


class QueryLogSerializer(serializers.ModelSerializer):
    """
    Serializer para logs de consultas
    """
    execution_status_display = serializers.CharField(source='get_execution_status_display', read_only=True)
    
    class Meta:
        model = QueryLog
        fields = [
            'id', 'user_question', 'interpreted_intent', 'generated_sql',
            'execution_status', 'execution_status_display', 'execution_time_ms',
            'result_count', 'error_message', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class ChatRequestSerializer(serializers.Serializer):
    """
    Serializer para requisições de chat com Alice
    """
    session_id = serializers.CharField(max_length=100, required=False, allow_blank=True)
    message = serializers.CharField(max_length=2000)
    create_new_session = serializers.BooleanField(default=False)
    
    def validate_message(self, value):
        """
        Valida a mensagem do usuário
        """
        if not value or not value.strip():
            raise serializers.ValidationError("A mensagem não pode estar vazia")
        
        # Remove caracteres perigosos
        dangerous_chars = ['<script>', '</script>', '<', '>', 'DROP TABLE', 'DELETE FROM']
        message_upper = value.upper()
        
        for char in dangerous_chars:
            if char in message_upper:
                raise serializers.ValidationError("Mensagem contém conteúdo não permitido")
        
        return value.strip()


class ChatResponseSerializer(serializers.Serializer):
    """
    Serializer para respostas do chat
    """
    success = serializers.BooleanField()
    session_id = serializers.CharField()
    response = serializers.CharField()
    sql_query = serializers.CharField(required=False, allow_blank=True)
    data = serializers.JSONField(required=False, allow_null=True)
    execution_time_ms = serializers.IntegerField(required=False, allow_null=True)
    result_count = serializers.IntegerField(required=False, allow_null=True)
    error = serializers.CharField(required=False, allow_blank=True)
    metadata = serializers.JSONField(required=False, default=dict)


class DatabaseSchemaSerializer(serializers.ModelSerializer):
    """
    Serializer para esquema do banco
    """
    class Meta:
        model = DatabaseSchema
        fields = [
            'id', 'table_name', 'column_name', 'data_type',
            'is_nullable', 'column_default', 'column_description',
            'business_meaning', 'sample_values', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class AliceConfigurationSerializer(serializers.ModelSerializer):
    """
    Serializer para configurações do Alice
    """
    class Meta:
        model = AliceConfiguration
        fields = [
            'id', 'key', 'value', 'description', 
            'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class SessionStatsSerializer(serializers.Serializer):
    """
    Serializer para estatísticas de sessão
    """
    total_sessions = serializers.IntegerField()
    active_sessions = serializers.IntegerField()
    total_messages = serializers.IntegerField()
    total_queries = serializers.IntegerField()
    successful_queries = serializers.IntegerField()
    average_response_time = serializers.FloatField()
    most_active_user = serializers.CharField()
    popular_questions = serializers.ListField(child=serializers.DictField())


class QuickQuestionSerializer(serializers.Serializer):
    """
    Serializer para perguntas rápidas (sem sessão)
    """
    question = serializers.CharField(max_length=1000)
    
    def validate_question(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("A pergunta não pode estar vazia")
        return value.strip()