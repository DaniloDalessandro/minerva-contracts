import logging
from django.db.models import Q
from django.utils import timezone
from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import ResourceShare, ShareNotification
from .serializers import ResourceShareCreateSerializer, ResourceShareListSerializer, ShareNotificationSerializer
from .services import get_resource_name, resolve_invited_user, send_share_email, create_share_notification

logger = logging.getLogger(__name__)


@extend_schema(tags=['Compartilhamentos'])
class ShareListCreateView(APIView):
    """Lista compartilhamentos do usuário e cria novos."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        resource_type = request.query_params.get('resource_type')
        direction = request.query_params.get('direction', 'all')  # given | received | all
        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 20))

        user = request.user
        qs = ResourceShare.objects.select_related('owner', 'invited_user').exclude(status='REVOKED')

        if direction == 'given':
            qs = qs.filter(owner=user)
        elif direction == 'received':
            qs = qs.filter(Q(invited_user=user) | Q(invited_email=user.email))
        else:
            qs = qs.filter(Q(owner=user) | Q(invited_user=user) | Q(invited_email=user.email))

        if resource_type:
            qs = qs.filter(resource_type=resource_type)

        total = qs.count()
        offset = (page - 1) * page_size
        results = qs[offset:offset + page_size]

        serializer = ResourceShareListSerializer(results, many=True)
        return Response({'count': total, 'results': serializer.data})

    def post(self, request):
        serializer = ResourceShareCreateSerializer(data=request.data, context={'request': request})
        if not serializer.is_valid():
            return Response({'error': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        resource_type = data['resource_type']
        resource_id = data['resource_id']
        invited_email = data['invited_email']

        # Valida que o recurso existe
        resource_name = get_resource_name(resource_type, resource_id)
        if not resource_name or resource_name == f"{resource_type} #{resource_id}":
            # Tenta verificar se o recurso existe mesmo assim
            pass

        # Verifica se já existe compartilhamento ativo para esse e-mail/recurso
        existing = ResourceShare.objects.filter(
            resource_type=resource_type,
            resource_id=resource_id,
            invited_email=invited_email,
            status__in=['PENDING', 'ACCEPTED'],
        ).first()
        if existing:
            return Response(
                {'error': 'Já existe um compartilhamento ativo para este recurso e e-mail.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        invited_user = resolve_invited_user(invited_email)

        share = ResourceShare.objects.create(
            resource_type=resource_type,
            resource_id=resource_id,
            resource_name=resource_name,
            owner=request.user,
            invited_user=invited_user,
            invited_email=invited_email,
            permission_type=data['permission_type'],
            status='ACCEPTED' if invited_user else 'PENDING',
            message=data.get('message', ''),
            accepted_at=timezone.now() if invited_user else None,
            created_by=request.user,
        )

        # Envia e-mail
        send_share_email(share)

        # Cria notificação interna
        if invited_user:
            create_share_notification(share, 'SHARE_RECEIVED')

        return Response(ResourceShareListSerializer(share).data, status=status.HTTP_201_CREATED)


@extend_schema(tags=['Compartilhamentos'])
class ShareDetailView(APIView):
    """Detalhe e revogação de compartilhamento."""
    permission_classes = [IsAuthenticated]

    def _get_share(self, pk, user):
        try:
            return ResourceShare.objects.get(pk=pk, owner=user)
        except ResourceShare.DoesNotExist:
            return None

    def get(self, request, pk):
        share = self._get_share(pk, request.user)
        if not share:
            return Response({'error': 'Compartilhamento não encontrado.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(ResourceShareListSerializer(share).data)

    def delete(self, request, pk):
        share = self._get_share(pk, request.user)
        if not share:
            return Response({'error': 'Compartilhamento não encontrado.'}, status=status.HTTP_404_NOT_FOUND)
        if share.status == 'REVOKED':
            return Response({'error': 'Compartilhamento já foi revogado.'}, status=status.HTTP_400_BAD_REQUEST)

        share.revoke(updated_by=request.user)

        # Notifica usuário convidado
        if share.invited_user:
            create_share_notification(share, 'SHARE_REVOKED')

        return Response({'message': 'Compartilhamento revogado com sucesso.'})


@extend_schema(tags=['Compartilhamentos'])
class ShareNotificationListView(APIView):
    """Lista notificações de compartilhamento do usuário."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = ShareNotification.objects.filter(user=request.user).select_related('share')
        unread_count = qs.filter(is_read=False).count()
        serializer = ShareNotificationSerializer(qs[:50], many=True)
        return Response({
            'count': qs.count(),
            'unread_count': unread_count,
            'results': serializer.data,
        })


@extend_schema(tags=['Compartilhamentos'])
class ShareNotificationMarkReadView(APIView):
    """Marca notificação de compartilhamento como lida."""
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        try:
            notif = ShareNotification.objects.get(pk=pk, user=request.user)
        except ShareNotification.DoesNotExist:
            return Response({'error': 'Notificação não encontrada.'}, status=status.HTTP_404_NOT_FOUND)
        notif.mark_read()
        return Response({'success': True})


@extend_schema(tags=['Compartilhamentos'])
class ShareNotificationMarkAllReadView(APIView):
    """Marca todas as notificações de compartilhamento como lidas."""
    permission_classes = [IsAuthenticated]

    def patch(self, request):
        updated = ShareNotification.objects.filter(
            user=request.user, is_read=False
        ).update(is_read=True, read_at=timezone.now())
        return Response({'success': True, 'updated': updated})


@extend_schema(tags=['Compartilhamentos'])
class UserSearchView(APIView):
    """Busca usuários por e-mail ou matr��cula para autocompletar no modal de compartilhamento."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        q = request.query_params.get('q', '').strip() or request.query_params.get('email', '').strip()
        if len(q) < 2:
            return Response({'results': []})

        from django.contrib.auth import get_user_model
        UserModel = get_user_model()
        users = UserModel.objects.filter(
            Q(email__icontains=q) | Q(employee__employee_id__icontains=q),
            is_active=True,
        ).exclude(pk=request.user.pk).select_related('employee').distinct()[:10]

        results = []
        for u in users:
            name = ''
            matricula = ''
            if u.employee_id:
                try:
                    name = u.employee.full_name
                    matricula = u.employee.employee_id or ''
                except Exception:
                    pass
            results.append({'email': u.email, 'name': name or u.email, 'matricula': matricula})

        return Response({'results': results})


@extend_schema(tags=['Compartilhamentos'])
class ResourceSearchView(APIView):
    """Busca recursos (orçamentos, linhas, contratos) para seleção no modal de convite."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        resource_type = request.query_params.get('resource_type', '').upper()
        q = request.query_params.get('q', '').strip()
        if not resource_type or len(q) < 2:
            return Response({'results': []})

        results = []
        if resource_type == 'BUDGET':
            from budget.models import Budget
            qs = Budget.objects.filter(
                Q(category__icontains=q) | Q(year__icontains=q) |
                Q(management_center__name__icontains=q)
            )[:10]
            results = [{'id': b.id, 'name': str(b)} for b in qs]

        elif resource_type == 'BUDGET_LINE':
            from budgetline.models import BudgetLine
            qs = BudgetLine.objects.filter(
                Q(summary_description__icontains=q) | Q(budget__category__icontains=q)
            ).select_related('budget')[:10]
            results = [{'id': bl.id, 'name': bl.summary_description or str(bl)} for bl in qs]

        elif resource_type == 'CONTRACT':
            from contract.models import Contract
            qs = Contract.objects.filter(
                Q(protocol_number__icontains=q) | Q(description__icontains=q)
            )[:10]
            results = [{'id': c.id, 'name': f"{c.protocol_number} — {c.description[:60]}"} for c in qs]

        return Response({'results': results})
