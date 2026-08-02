import logging
from django.db.models import Q
from django.utils import timezone
from drf_spectacular.utils import extend_schema
from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response

from employee.utils.access_control import get_employee_queryset
from employee.models import Employee
from contract.models import Contract
from .models import ContractNotification
from .serializers import ContractNotificationSerializer

logger = logging.getLogger(__name__)


@extend_schema(tags=['Notificações'])
class ContractNotificationListView(generics.ListAPIView):
    """
    Lista notificações de vencimento de contratos do usuário atual.
    Filtra automaticamente pelos contratos do escopo hierárquico do usuário.
    """
    serializer_class = ContractNotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        employee_qs = get_employee_queryset(user, Employee.objects.all())

        contracts_qs = Contract.objects.filter(
            Q(main_inspector__in=employee_qs) | Q(substitute_inspector__in=employee_qs)
        ).values_list('id', flat=True)

        qs = ContractNotification.objects.filter(
            contract_id__in=contracts_qs
        ).select_related('contract').order_by('-created_at')


        unread_only = self.request.query_params.get('unread', None)
        if unread_only == 'true':
            qs = qs.filter(is_read=False)

        return qs

    def list(self, request, *args, **kwargs):
        qs = self.get_queryset()
        serializer = self.get_serializer(qs, many=True)
        unread_count = qs.filter(is_read=False).count()
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
        notification = ContractNotification.objects.get(pk=pk)
    except ContractNotification.DoesNotExist:
        return Response({'error': 'Notificação não encontrada'}, status=status.HTTP_404_NOT_FOUND)

    notification.mark_read()
    return Response({'success': True, 'message': 'Notificação marcada como lida.'})


@extend_schema(tags=['Notificações'])
@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def mark_all_read(request):
    """Marca todas as notificações do usuário como lidas."""
    user = request.user
    employee_qs = get_employee_queryset(user, Employee.objects.all())
    contracts_qs = Contract.objects.filter(
        Q(main_inspector__in=employee_qs) | Q(substitute_inspector__in=employee_qs)
    ).values_list('id', flat=True)
    updated = ContractNotification.objects.filter(
        contract_id__in=contracts_qs,
        is_read=False,
    ).update(is_read=True, read_at=timezone.now())

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
