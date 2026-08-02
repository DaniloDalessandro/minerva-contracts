import uuid
import logging
from drf_spectacular.utils import extend_schema
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
    AliceConfiguration,
    FeedbackLog,
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


def get_error_details(exception):
    """
    Retorna detalhes da exceção apenas em modo DEBUG.
    Em produção, retorna mensagem genérica para evitar exposição de informações.
    """
    if settings.DEBUG:
        return str(exception)
    return "Entre em contato com o suporte para mais informações"


@extend_schema(tags=['IA'])
class ConversationSessionViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gerenciar sessões de conversa
    """
    serializer_class = ConversationSessionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = ConversationSession.objects.filter(user=self.request.user)
        if self.action == 'retrieve':
            return qs.prefetch_related('messages').annotate(message_count=Count('messages'))
        return qs.annotate(message_count=Count('messages')).order_by('-updated_at')

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return ConversationDetailSerializer
        return ConversationSessionSerializer

    def perform_create(self, serializer):
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

            user_message = ConversationMessage.objects.create(
                session=session,
                message_type='USER',
                content=message_content
            )

            try:
                interpreter = SQLInterpreterService()
                result = interpreter.interpret_and_execute(message_content, session)

                if result['success']:
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
                        'sql_query': result.get('sql_query', ''),
                        'data': result.get('data', []),
                        'execution_time_ms': result.get('execution_time_ms', 0),
                        'result_count': result.get('result_count', 0),
                        'needs_clarification': result.get('needs_clarification', False),
                        'metadata': {
                            'user_message_id': user_message.id,
                            'assistant_message_id': assistant_message.id,
                            'query_log_id': result.get('query_log_id')
                        }
                    }
                else:
                    friendly_response = result.get('humanized_response', FRIENDLY_MESSAGES['internal_error'])

                    error_message = ConversationMessage.objects.create(
                        session=session,
                        message_type='ASSISTANT',
                        content=friendly_response,
                        metadata={
                            'error_details': result.get('details', ''),
                            'was_error': True
                        }
                    )

                    response_data = {
                        'success': True,
                        'session_id': session.session_id,
                        'response': friendly_response,
                        'metadata': {
                            'user_message_id': user_message.id,
                            'assistant_message_id': error_message.id
                        }
                    }

                session.updated_at = timezone.now()
                session.save(update_fields=['updated_at'])

                return Response(response_data, status=status.HTTP_200_OK)

            except Exception as e:
                logger.error(f"Erro ao processar mensagem: {str(e)}")

                friendly_response = FRIENDLY_MESSAGES['internal_error']

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


@extend_schema(tags=['IA'])
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
            if create_new_session or not session_id:
                session = ConversationSession.objects.create(
                    user=request.user,
                    session_id=str(uuid.uuid4()),
                    title=message[:50] + '...' if len(message) > 50 else message
                )
            else:
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

            user_message = ConversationMessage.objects.create(
                session=session,
                message_type='USER',
                content=message
            )

            interpreter = SQLInterpreterService()
            result = interpreter.interpret_and_execute(message, session)

            if result['success']:
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
                    'sql_query': result.get('sql_query', ''),
                    'data': result.get('data', []),
                    'execution_time_ms': result.get('execution_time_ms', 0),
                    'result_count': result.get('result_count', 0),
                    'needs_clarification': result.get('needs_clarification', False),
                    'metadata': {
                        'user_message_id': user_message.id,
                        'assistant_message_id': assistant_message.id,
                        'query_log_id': result.get('query_log_id')
                    }
                })
            else:
                friendly_response = result.get('humanized_response', FRIENDLY_MESSAGES['internal_error'])

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


@extend_schema(tags=['IA'])
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


@extend_schema(tags=['IA'])
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


@extend_schema(tags=['IA'])
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

    popular = user_queries.values('user_question').annotate(
        count=Count('id')
    ).order_by('-count')[:5]

    stats['popular_questions'] = list(popular)

    serializer = SessionStatsSerializer(data=stats)
    if serializer.is_valid():
        return Response(serializer.data)
    else:
        return Response(stats)


@extend_schema(tags=['IA'])
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
        temp_session = ConversationSession(
            user=request.user,
            session_id=str(uuid.uuid4()),
            title='Pergunta Rápida',
            is_active=False
        )
        temp_session.save()

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


@extend_schema(tags=['IA'])
@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def alice_agent_chat(request):
    """
    Endpoint do agente Alice (LangGraph multi-agente Enterprise).
    Usa DeepSeek como LLM principal com fallback para Gemini.

    Body:
        message: str       (pergunta do usuário)
        session_id: str    (opcional — vincula ao histórico da sessão)
    """
    message = request.data.get('message', '').strip()
    session_id = request.data.get('session_id', '').strip() or None

    if not message:
        return Response({'error': 'message é obrigatório'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        from .services.alice_graph import AliceGraphService
        agent = AliceGraphService()
        result = agent.run(message, session_id=session_id, user=request.user)

        return Response({
            'success': result['success'],
            'response': result['response'],
            'confidence': result.get('confidence', 0.0),
            'source': result.get('source', ''),
            'agent_type': result.get('agent_type', ''),
            'tools_used': result.get('tools_used', []),
        })
    except Exception as exc:
        logger.error("Erro no alice_agent_chat (LangGraph): %s", exc)
        return Response({
            'success': True,
            'response': "Desculpe, não consegui processar sua pergunta agora. Pode tentar novamente? 😊",
            'confidence': 0.0,
            'source': '',
        })


@extend_schema(tags=['IA'])
@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def submit_feedback(request):
    """
    Registra feedback do usuário (👍/👎) sobre uma resposta da Alice.

    Body:
        session_id: str (UUID da sessão)
        query_log_id: int (opcional)
        rating: "POSITIVE" | "NEGATIVE"
        correction: str (opcional - texto correto quando rating=NEGATIVE)
        user_question: str
    """
    session_id = request.data.get('session_id')
    query_log_id = request.data.get('query_log_id')
    rating = request.data.get('rating')
    correction = request.data.get('correction', '')
    user_question = request.data.get('user_question', '')

    if not session_id or not rating:
        return Response(
            {'error': 'session_id e rating são obrigatórios'},
            status=status.HTTP_400_BAD_REQUEST
        )

    if rating not in ('POSITIVE', 'NEGATIVE'):
        return Response(
            {'error': 'rating deve ser POSITIVE ou NEGATIVE'},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        session = ConversationSession.objects.get(
            session_id=session_id,
            user=request.user
        )
    except ConversationSession.DoesNotExist:
        return Response({'error': 'Sessão não encontrada'}, status=status.HTTP_404_NOT_FOUND)

    query_log = None
    if query_log_id:
        try:
            query_log = QueryLog.objects.get(id=query_log_id, session=session)
        except QueryLog.DoesNotExist:
            pass

    FeedbackLog.objects.create(
        session=session,
        query_log=query_log,
        rating=rating,
        correction=correction,
        user_question=user_question,
    )

    try:
        from .services.few_shot_manager import FewShotManager
        from .services.gemini_service import GeminiService

        gemini = GeminiService()
        fsm = FewShotManager(gemini)

        if rating == 'NEGATIVE':
            fsm.record_failure(user_question)
            if query_log:
                query_log.success_score = 0.0
                query_log.save(update_fields=['success_score'])

            if correction and query_log:
                fsm.record_success(
                    user_question=user_question,
                    canonical_sql=correction,
                    intent=query_log.interpreted_intent or 'user_correction',
                    tables_used=[],
                    result_count=1,
                    execution_ms=0.0,
                )

        elif rating == 'POSITIVE':
            if query_log and query_log.generated_sql:
                fsm.record_success(
                    user_question=user_question,
                    canonical_sql=query_log.generated_sql,
                    intent=query_log.interpreted_intent or '',
                    tables_used=[],
                    result_count=query_log.result_count or 1,
                    execution_ms=float(query_log.execution_time_ms or 0),
                )
    except Exception as exc:
        logger.warning(f"FewShotManager feedback learning falhou: {exc}")

    return Response({'success': True, 'message': 'Feedback registrado com sucesso!'})