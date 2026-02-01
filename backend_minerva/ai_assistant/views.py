import uuid
import logging
from django.conf import settings
from django.db.models import Count, Avg, Q
from django.utils import timezone
from rest_framework import status, viewsets, permissions
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import (
    ConversationSession, 
    ConversationMessage, 
    QueryLog, 
    DatabaseSchema, 
    AliceConfiguration
)
from .serializers import (
    ConversationSessionSerializer,
    ConversationDetailSerializer,
    ConversationMessageSerializer,
    QueryLogSerializer,
    ChatRequestSerializer,
    ChatResponseSerializer,
    DatabaseSchemaSerializer,
    AliceConfigurationSerializer,
    SessionStatsSerializer,
    QuickQuestionSerializer
)
from .services.sql_interpreter import SQLInterpreterService, FRIENDLY_MESSAGES

logger = logging.getLogger(__name__)


# Helper function for secure error responses
def get_error_details(exception):
    """
    Returns exception details only if DEBUG is enabled.
    In production, returns a generic message to avoid information leakage.
    """
    if settings.DEBUG:
        return str(exception)
    return "Contact support for more information"


class ConversationSessionViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gerenciar sessões de conversa
    """
    serializer_class = ConversationSessionSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return ConversationSession.objects.filter(
            user=self.request.user
        ).annotate(
            message_count=Count('messages')
        ).order_by('-updated_at')
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return ConversationDetailSerializer
        return ConversationSessionSerializer
    
    def perform_create(self, serializer):
        # Gera um session_id único se não fornecido
        if not serializer.validated_data.get('session_id'):
            serializer.validated_data['session_id'] = str(uuid.uuid4())
        
        serializer.save(user=self.request.user)
    
    @action(detail=True, methods=['post'])
    def send_message(self, request, pk=None):
        """
        Envia uma mensagem para a sessão
        """
        session = self.get_object()
        serializer = ChatRequestSerializer(data=request.data)
        
        if serializer.is_valid():
            message_content = serializer.validated_data['message']
            
            # Salva a mensagem do usuário
            user_message = ConversationMessage.objects.create(
                session=session,
                message_type='USER',
                content=message_content
            )
            
            try:
                # Processa a mensagem com Alice
                interpreter = SQLInterpreterService()
                result = interpreter.interpret_and_execute(message_content, session)
                
                if result['success']:
                    # Salva resposta de sucesso
                    assistant_message = ConversationMessage.objects.create(
                        session=session,
                        message_type='ASSISTANT',
                        content=result['humanized_response'],
                        metadata={
                            'sql_query': result['sql_query'],
                            'result_count': result['result_count'],
                            'execution_time_ms': result['execution_time_ms']
                        }
                    )
                    
                    response_data = {
                        'success': True,
                        'session_id': session.session_id,
                        'response': result['humanized_response'],
                        'sql_query': result['sql_query'],
                        'data': result['data'],
                        'execution_time_ms': result['execution_time_ms'],
                        'result_count': result['result_count'],
                        'metadata': {
                            'user_message_id': user_message.id,
                            'assistant_message_id': assistant_message.id,
                            'query_log_id': result.get('query_log_id')
                        }
                    }
                else:
                    # Usa mensagem amigável do resultado ou mensagem padrão
                    friendly_response = result.get('humanized_response', FRIENDLY_MESSAGES['internal_error'])

                    # Salva resposta de erro
                    error_message = ConversationMessage.objects.create(
                        session=session,
                        message_type='ASSISTANT',  # Mostra como mensagem normal, não erro
                        content=friendly_response,
                        metadata={
                            'error_details': result.get('details', ''),
                            'was_error': True
                        }
                    )

                    response_data = {
                        'success': True,  # Retorna success para o frontend exibir a mensagem normalmente
                        'session_id': session.session_id,
                        'response': friendly_response,
                        'metadata': {
                            'user_message_id': user_message.id,
                            'assistant_message_id': error_message.id
                        }
                    }

                # Atualiza timestamp da sessão
                session.updated_at = timezone.now()
                session.save(update_fields=['updated_at'])

                return Response(response_data, status=status.HTTP_200_OK)

            except Exception as e:
                logger.error(f"Erro ao processar mensagem: {str(e)}")

                friendly_response = FRIENDLY_MESSAGES['internal_error']

                # Salva mensagem de erro do sistema como mensagem normal
                ConversationMessage.objects.create(
                    session=session,
                    message_type='ASSISTANT',
                    content=friendly_response,
                    metadata={'was_error': True}
                )

                return Response({
                    'success': True,
                    'session_id': session.session_id,
                    'response': friendly_response
                }, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def clear_session(self, request, pk=None):
        """
        Limpa todas as mensagens da sessão
        """
        session = self.get_object()
        deleted_count = session.messages.count()
        session.messages.all().delete()
        session.updated_at = timezone.now()
        session.save(update_fields=['updated_at'])
        
        return Response({
            'success': True,
            'message': f'{deleted_count} mensagens foram removidas da sessão'
        })


class AliceChatView(APIView):
    """
    View principal para chat com Alice
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        """
        Processa mensagem de chat
        """
        serializer = ChatRequestSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        data = serializer.validated_data
        message = data['message']
        session_id = data.get('session_id')
        create_new_session = data.get('create_new_session', False)
        
        try:
            # Gerencia sessão
            if create_new_session or not session_id:
                # Cria nova sessão
                session = ConversationSession.objects.create(
                    user=request.user,
                    session_id=str(uuid.uuid4()),
                    title=message[:50] + '...' if len(message) > 50 else message
                )
            else:
                # Busca sessão existente
                try:
                    session = ConversationSession.objects.get(
                        session_id=session_id,
                        user=request.user,
                        is_active=True
                    )
                except ConversationSession.DoesNotExist:
                    return Response({
                        'success': False,
                        'error': 'Sessão não encontrada ou inativa'
                    }, status=status.HTTP_404_NOT_FOUND)
            
            # Salva mensagem do usuário
            user_message = ConversationMessage.objects.create(
                session=session,
                message_type='USER',
                content=message
            )
            
            # Processa com Alice
            interpreter = SQLInterpreterService()
            result = interpreter.interpret_and_execute(message, session)
            
            if result['success']:
                # Salva resposta de sucesso
                assistant_message = ConversationMessage.objects.create(
                    session=session,
                    message_type='ASSISTANT',
                    content=result['humanized_response'],
                    metadata={
                        'sql_query': result['sql_query'],
                        'result_count': result['result_count'],
                        'execution_time_ms': result['execution_time_ms']
                    }
                )
                
                response_serializer = ChatResponseSerializer(data={
                    'success': True,
                    'session_id': session.session_id,
                    'response': result['humanized_response'],
                    'sql_query': result['sql_query'],
                    'data': result['data'],
                    'execution_time_ms': result['execution_time_ms'],
                    'result_count': result['result_count'],
                    'metadata': {
                        'user_message_id': user_message.id,
                        'assistant_message_id': assistant_message.id,
                        'query_log_id': result.get('query_log_id')
                    }
                })
            else:
                # Usa mensagem amigável do resultado ou mensagem padrão
                friendly_response = result.get('humanized_response', FRIENDLY_MESSAGES['internal_error'])

                # Salva resposta como mensagem normal (não erro)
                assistant_message = ConversationMessage.objects.create(
                    session=session,
                    message_type='ASSISTANT',
                    content=friendly_response,
                    metadata={'was_error': True}
                )

                response_serializer = ChatResponseSerializer(data={
                    'success': True,
                    'session_id': session.session_id,
                    'response': friendly_response,
                    'metadata': {
                        'user_message_id': user_message.id,
                        'assistant_message_id': assistant_message.id
                    }
                })

            # Atualiza sessão
            session.updated_at = timezone.now()
            session.save(update_fields=['updated_at'])

            if response_serializer.is_valid():
                return Response(response_serializer.data, status=status.HTTP_200_OK)
            else:
                return Response(response_serializer.errors, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        except Exception as e:
            logger.error(f"Erro no chat com Alice: {str(e)}")
            friendly_response = FRIENDLY_MESSAGES['internal_error']
            return Response({
                'success': True,
                'response': friendly_response
            }, status=status.HTTP_200_OK)


class QueryLogViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet para visualizar logs de consultas
    """
    serializer_class = QueryLogSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return QueryLog.objects.filter(
            session__user=self.request.user
        ).order_by('-created_at')


class DatabaseSchemaViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet para visualizar esquema do banco
    """
    queryset = DatabaseSchema.objects.all().order_by('table_name', 'column_name')
    serializer_class = DatabaseSchemaSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    @action(detail=False, methods=['get'])
    def tables(self, request):
        """
        Retorna lista de tabelas disponíveis
        """
        tables = DatabaseSchema.objects.values('table_name').distinct().order_by('table_name')
        return Response([table['table_name'] for table in tables])


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def alice_stats(request):
    """
    Retorna estatísticas do uso do Alice
    """
    user_sessions = ConversationSession.objects.filter(user=request.user)
    user_queries = QueryLog.objects.filter(session__user=request.user)
    
    stats = {
        'total_sessions': user_sessions.count(),
        'active_sessions': user_sessions.filter(is_active=True).count(),
        'total_messages': ConversationMessage.objects.filter(session__user=request.user).count(),
        'total_queries': user_queries.count(),
        'successful_queries': user_queries.filter(execution_status='SUCCESS').count(),
        'average_response_time': user_queries.aggregate(
            avg_time=Avg('execution_time_ms')
        )['avg_time'] or 0,
        'most_active_user': request.user.username,
        'popular_questions': []
    }
    
    # Perguntas mais populares (simplificado)
    popular = user_queries.values('user_question').annotate(
        count=Count('id')
    ).order_by('-count')[:5]
    
    stats['popular_questions'] = list(popular)
    
    serializer = SessionStatsSerializer(data=stats)
    if serializer.is_valid():
        return Response(serializer.data)
    else:
        return Response(stats)  # Fallback


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def quick_question(request):
    """
    Endpoint para perguntas rápidas sem criar sessão persistente
    """
    serializer = QuickQuestionSerializer(data=request.data)
    
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    question = serializer.validated_data['question']
    
    try:
        # Cria sessão temporária
        temp_session = ConversationSession(
            user=request.user,
            session_id=str(uuid.uuid4()),
            title='Pergunta Rápida',
            is_active=False
        )
        temp_session.save()
        
        # Processa pergunta
        interpreter = SQLInterpreterService()
        result = interpreter.interpret_and_execute(question, temp_session)
        
        if result['success']:
            return Response({
                'success': True,
                'response': result['humanized_response'],
                'sql_query': result['sql_query'],
                'result_count': result['result_count'],
                'execution_time_ms': result['execution_time_ms']
            })
        else:
            return Response({
                'success': False,
                'response': f"Não consegui processar sua pergunta: {result['error']}",
                'error': result['error']
            })
            
    except Exception as e:
        logger.error(f"Erro na pergunta rápida: {str(e)}")
        return Response({
            'success': False,
            'error': 'Erro interno do servidor'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)