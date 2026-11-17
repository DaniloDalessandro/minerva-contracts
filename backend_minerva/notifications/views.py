import logging
from django.db.models import Q, Exists, OuterRef, Subquery
from django.utils import timezone
from drf_spectacular.utils import extend_schema
from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response

from employee.utils.access_control import get_employee_queryset
from employee.models import Employee
from contract.models import Contract
from .models import ContractNotification, ContractNotificationRead
from .serializers import ContractNotificationSerializer

logger = logging.getLogger(__name__)


def notifications_for_user(user):
    employees = get_employee_queryset(user, Employee.objects.all())
    if user.employee_id:
        employees = employees | Employee.objects.filter(pk=user.employee_id)
    contracts = Contract.objects.filter(
        Q(main_inspector__in=employees) | Q(substitute_inspector__in=employees)
    ).values('id')
    reads = ContractNotificationRead.objects.filter(notification_id=OuterRef('pk'), user=user)
    return ContractNotification.objects.filter(contract_id__in=contracts).select_related('contract').annotate(
        user_is_read=Exists(reads),
        user_read_at=Subquery(reads.values('read_at')[:1]),
    ).order_by('-created_at')


@extend_schema(tags=['Notificações'])
class ContractNotificationListView(generics.ListAPIView):
    """
    Lista notificações de vencimento de contratos do usuário atual.
    Filtra automaticamente pelos contratos do escopo hierárquico do usuário.
    """
    serializer_class = ContractNotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = notifications_for_user(self.request.user)
        if self.request.query_params.get('unread') == 'true':
            qs = qs.filter(user_is_read=False)
        return qs

    def list(self, request, *args, **kwargs):
        qs = self.get_queryset()
        serializer = self.get_serializer(qs, many=True)
        unread_count = qs.filter(user_is_read=False).count()
        return Response({
            'count': qs.count(),
            'unread_count': unread_count,
            'results': serializer.data,
        })


@extend_schema(tags=['Notificações'])
@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def mark_notification_read(request, pk):
    """Marca uma notificação como lida."""
    try:
        notification = notifications_for_user(request.user).get(pk=pk)
    except ContractNotification.DoesNotExist:
        return Response({'error': 'Notificação não encontrada'}, status=status.HTTP_404_NOT_FOUND)

    ContractNotificationRead.objects.get_or_create(
        notification=notification, user=request.user,
        defaults={'criado_por': request.user, 'atualizado_por': request.user},
    )
    return Response({'success': True, 'message': 'Notificação marcada como lida.'})


@extend_schema(tags=['Notificações'])
@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def mark_all_read(request):
    """Marca todas as notificações do usuário como lidas."""
    user = request.user
    unread_ids = list(notifications_for_user(user).filter(user_is_read=False).values_list('id', flat=True))
    ContractNotificationRead.objects.bulk_create([
        ContractNotificationRead(notification_id=pk, user=user, criado_por=user, atualizado_por=user)
        for pk in unread_ids
    ], ignore_conflicts=True)
    updated = len(unread_ids)

    return Response({'success': True, 'updated': updated})


@extend_schema(tags=['Notificações'])
@api_view(['POST'])
@permission_classes([IsAdminUser])
def trigger_expiration_check(request):
    """
    Dispara manualmente a verificação de contratos vencendo (admin only).
    Útil para testes sem aguardar o agendamento Celery.
    """
    from .tasks import check_expiring_contracts
    result = check_expiring_contracts.delay()
    return Response({
        'success': True,
        'task_id': result.id,
        'message': 'Verificação de vencimentos disparada.',
    })
