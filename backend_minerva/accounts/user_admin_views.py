"""
Views de gestão de usuários e convites — acesso exclusivo para superusuários.
"""
import logging
from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.core.mail import send_mail
from django.utils import timezone
from drf_spectacular.utils import extend_schema
from rest_framework import serializers, status
from rest_framework.response import Response
from rest_framework.views import APIView

from django.contrib.auth.models import Group, Permission
from django.contrib.contenttypes.models import ContentType
from .models import UserInvitation
from .permissions import IsSuperUser


# ---------------------------------------------------------------------------
# Configuração de permissões relevantes por módulo
# ---------------------------------------------------------------------------
RELEVANT_MODULES = {
    'employee': {
        'employee': 'Colaboradores',
    },
    'aid': {
        'assistance': 'Auxílios',
    },
    'contract': {
        'contract': 'Contratos',
        'contractamendment': 'Aditivos de Contrato',
        'contractinstallment': 'Parcelas de Contrato',
    },
    'budget': {
        'budget': 'Orçamento',
        'budgetmovement': 'Movimentos de Orçamento',
    },
    'budgetline': {
        'budgetline': 'Linhas Orçamentárias',
        'budgetlinemovement': 'Movimentos de Linha Orçamentária',
        'budgetlineversion': 'Versões de Linha Orçamentária',
    },
    'sector': {
        'direction': 'Diretorias',
        'management': 'Gerências',
        'coordination': 'Coordenações',
    },
    'center': {
        'managementcenter': 'Centros de Gerência',
        'requestingcenter': 'Centros Solicitantes',
    },
    'accounts': {
        'user': 'Usuários',
        'userinvitation': 'Convites de Usuário',
    },
}

GROUP_LABELS = {
    'PRESIDENTE': 'Presidente',
    'DIRETOR': 'Diretor',
    'GERENTE': 'Gerente',
    'COORDENADOR': 'Coordenador',
    'ANALISTA': 'Analista',
    'FUNCIONARIO': 'Funcionário',
}

ACTION_LABELS = {
    'view': 'Visualizar',
    'add': 'Criar',
    'change': 'Editar',
    'delete': 'Excluir',
}

logger = logging.getLogger(__name__)
User = get_user_model()






class AdminUserListSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()
    groups = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'email', 'name', 'groups', 'is_active', 'is_superuser',
            'date_joined', 'last_login', 'avatar',
        ]

    def get_name(self, obj):
        if obj.employee:
            return obj.employee.full_name
        return obj.first_name or obj.email

    def get_groups(self, obj):
        return [g.name for g in obj.groups.all()]


class AdminUserCreateSerializer(serializers.Serializer):
    email = serializers.EmailField()
    first_name = serializers.CharField(max_length=150)
    last_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    password = serializers.CharField(write_only=True)
    group = serializers.CharField(required=False, allow_blank=True)
    is_active = serializers.BooleanField(default=True)
    avatar = serializers.CharField(max_length=50, required=False, allow_blank=True)

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Já existe um usuário com esse e-mail.")
        return value

    def validate_password(self, value):
        try:
            validate_password(value)
        except ValidationError as e:
            raise serializers.ValidationError(list(e.messages))
        return value

    def validate_group(self, value):
        valid = {'PRESIDENTE', 'DIRETOR', 'GERENTE', 'COORDENADOR', 'ANALISTA', 'FUNCIONARIO', ''}
        if value and value not in valid:
            raise serializers.ValidationError(f"Perfil inválido. Escolha entre: {', '.join(valid - {''})}.")
        return value


class AdminUserUpdateSerializer(serializers.Serializer):
    first_name = serializers.CharField(max_length=150, required=False)
    last_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    group = serializers.CharField(required=False, allow_blank=True)
    is_active = serializers.BooleanField(required=False)
    avatar = serializers.CharField(max_length=50, required=False, allow_blank=True)

    def validate_group(self, value):
        valid = {'PRESIDENTE', 'DIRETOR', 'GERENTE', 'COORDENADOR', 'ANALISTA', 'FUNCIONARIO', ''}
        if value and value not in valid:
            raise serializers.ValidationError(f"Perfil inválido.")
        return value


class InviteCreateSerializer(serializers.Serializer):
    email = serializers.EmailField()
    group = serializers.ChoiceField(
        choices=['PRESIDENTE', 'DIRETOR', 'GERENTE', 'COORDENADOR', 'ANALISTA', 'FUNCIONARIO'],
        default='FUNCIONARIO',
    )

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Já existe um usuário com esse e-mail.")
        return value


class InviteListSerializer(serializers.ModelSerializer):
    invited_by_name = serializers.SerializerMethodField()
    is_valid = serializers.BooleanField(read_only=True)
    is_expired = serializers.BooleanField(read_only=True)

    class Meta:
        model = UserInvitation
        fields = [
            'id', 'token', 'email', 'group', 'status',
            'expires_at', 'accepted_at', 'is_valid', 'is_expired',
            'created_at', 'updated_at', 'invited_by_name',
        ]

    def get_invited_by_name(self, obj):
        if obj.created_by:
            if obj.created_by.employee:
                return obj.created_by.employee.full_name
            return obj.created_by.email
        return None


class AcceptInviteSerializer(serializers.Serializer):
    token = serializers.UUIDField()
    first_name = serializers.CharField(max_length=150)
    last_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    password = serializers.CharField(write_only=True)
    password2 = serializers.CharField(write_only=True)

    def validate(self, data):
        if data['password'] != data['password2']:
            raise serializers.ValidationError({'password': 'As senhas não coincidem.'})
        try:
            validate_password(data['password'])
        except ValidationError as e:
            raise serializers.ValidationError({'password': list(e.messages)})
        return data






def _assign_group(user, group_name: str):
    """Remove grupos anteriores e atribui um novo grupo ao usuário."""
    user.groups.clear()
    if group_name:
        group, _ = Group.objects.get_or_create(name=group_name)
        user.groups.add(group)


def _send_invite_email(invitation: UserInvitation):
    frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')
    invite_url = f"{frontend_url}/convite/{invitation.token}"
    inviter_name = (
        invitation.created_by.employee.full_name
        if invitation.created_by and invitation.created_by.employee
        else (invitation.created_by.email if invitation.created_by else 'Administrador')
    )
    group_display = dict(UserInvitation.GROUP_CHOICES).get(invitation.group, invitation.group)

    subject = 'Convite de acesso — Sistema Minerva'
    body = (
        f"Olá!\n\n"
        f"Você foi convidado por {inviter_name} para acessar o Sistema Minerva "
        f"com o perfil de {group_display}.\n\n"
        f"Para criar sua conta, acesse o link abaixo:\n"
        f"{invite_url}\n\n"
        f"Este link expira em 48 horas.\n\n"
        f"Se você não esperava este convite, pode ignorar este e-mail com segurança.\n\n"
        f"Sistema Minerva"
    )
    send_mail(subject, body, settings.DEFAULT_FROM_EMAIL, [invitation.email], fail_silently=False)






@extend_schema(tags=['Admin — Usuários'])
class AdminUserListView(APIView):
    permission_classes = [IsSuperUser]

    def get(self, request):
        search = request.query_params.get('search', '').strip()
        is_active = request.query_params.get('is_active')
        group_filter = request.query_params.get('group', '').strip()
        ordering = request.query_params.get('ordering', 'email').strip()

        allowed_orderings = {
            'email', '-email', 'date_joined', '-date_joined',
            'last_login', '-last_login',
        }
        if ordering not in allowed_orderings:
            ordering = 'email'

        qs = User.objects.select_related('employee').prefetch_related('groups').order_by(ordering)

        if search:
            from django.db.models import Q
            qs = qs.filter(
                Q(email__icontains=search)
                | Q(first_name__icontains=search)
                | Q(last_name__icontains=search)
                | Q(employee__full_name__icontains=search)
            )
        if is_active is not None:
            qs = qs.filter(is_active=(is_active.lower() == 'true'))
        if group_filter:
            qs = qs.filter(groups__name=group_filter)

        serializer = AdminUserListSerializer(qs, many=True)
        return Response({'count': qs.count(), 'results': serializer.data})


@extend_schema(tags=['Admin — Usuários'])
class AdminUserCreateView(APIView):
    permission_classes = [IsSuperUser]

    def post(self, request):
        serializer = AdminUserCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({'error': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        user = User.objects.create_user(
            email=data['email'],
            password=data['password'],
            first_name=data['first_name'],
            last_name=data.get('last_name', ''),
            is_active=data.get('is_active', True),
            avatar=data.get('avatar', ''),
        )
        if data.get('group'):
            _assign_group(user, data['group'])

        out = AdminUserListSerializer(user)
        return Response(out.data, status=status.HTTP_201_CREATED)


@extend_schema(tags=['Admin — Usuários'])
class AdminUserDetailView(APIView):
    permission_classes = [IsSuperUser]

    def _get_user(self, user_id):
        try:
            return User.objects.select_related('employee').prefetch_related('groups').get(pk=user_id)
        except User.DoesNotExist:
            return None

    def get(self, request, user_id):
        user = self._get_user(user_id)
        if not user:
            return Response({'error': 'Usuário não encontrado.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(AdminUserListSerializer(user).data)

    def patch(self, request, user_id):
        user = self._get_user(user_id)
        if not user:
            return Response({'error': 'Usuário não encontrado.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = AdminUserUpdateSerializer(data=request.data, partial=True)
        if not serializer.is_valid():
            return Response({'error': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        if 'first_name' in data:
            user.first_name = data['first_name']
        if 'last_name' in data:
            user.last_name = data['last_name']
        if 'is_active' in data:
            user.is_active = data['is_active']
        if 'avatar' in data:
            user.avatar = data['avatar']
        user.save()

        if 'group' in data:
            _assign_group(user, data['group'])

        return Response(AdminUserListSerializer(user).data)


@extend_schema(tags=['Admin — Usuários'])
class AdminUserToggleStatusView(APIView):
    permission_classes = [IsSuperUser]

    def patch(self, request, user_id):
        try:
            user = User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return Response({'error': 'Usuário não encontrado.'}, status=status.HTTP_404_NOT_FOUND)

        if user == request.user:
            return Response(
                {'error': 'Você não pode desativar sua própria conta.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.is_active = not user.is_active
        user.save(update_fields=['is_active'])
        action = 'ativado' if user.is_active else 'desativado'
        return Response({'message': f'Usuário {action} com sucesso.', 'is_active': user.is_active})






@extend_schema(tags=['Admin — Convites'])
class InviteListCreateView(APIView):
    permission_classes = [IsSuperUser]

    def get(self, request):
        qs = UserInvitation.objects.select_related('created_by', 'created_by__employee').all()
        status_filter = request.query_params.get('status')
        if status_filter:
            qs = qs.filter(status=status_filter.upper())
        return Response({'count': qs.count(), 'results': InviteListSerializer(qs, many=True).data})

    def post(self, request):
        serializer = InviteCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({'error': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data


        UserInvitation.objects.filter(email=data['email'], status='PENDING').update(status='CANCELLED')

        invitation = UserInvitation.objects.create(
            email=data['email'],
            group=data['group'],
            created_by=request.user,
        )

        try:
            _send_invite_email(invitation)
        except Exception as exc:
            logger.error("Erro ao enviar e-mail de convite para %s: %s", data['email'], exc)
            invitation.delete()
            return Response(
                {'error': 'Não foi possível enviar o e-mail de convite. Verifique as configurações de e-mail.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        return Response(InviteListSerializer(invitation).data, status=status.HTTP_201_CREATED)


@extend_schema(tags=['Admin — Convites'])
class InviteResendView(APIView):
    permission_classes = [IsSuperUser]

    def post(self, request, invite_id):
        try:
            invitation = UserInvitation.objects.get(pk=invite_id)
        except UserInvitation.DoesNotExist:
            return Response({'error': 'Convite não encontrado.'}, status=status.HTTP_404_NOT_FOUND)

        if invitation.status == 'ACCEPTED':
            return Response({'error': 'Este convite já foi aceito.'}, status=status.HTTP_400_BAD_REQUEST)


        from datetime import timedelta
        invitation.status = 'PENDING'
        invitation.expires_at = timezone.now() + timedelta(hours=48)
        invitation.updated_by = request.user
        invitation.save(update_fields=['status', 'expires_at', 'updated_by', 'updated_at'])

        try:
            _send_invite_email(invitation)
        except Exception as exc:
            logger.error("Erro ao reenviar convite %s: %s", invite_id, exc)
            return Response(
                {'error': 'Não foi possível reenviar o e-mail.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        return Response({'message': 'Convite reenviado com sucesso.'})


@extend_schema(tags=['Admin — Convites'])
class InviteCancelView(APIView):
    permission_classes = [IsSuperUser]

    def post(self, request, invite_id):
        try:
            invitation = UserInvitation.objects.get(pk=invite_id)
        except UserInvitation.DoesNotExist:
            return Response({'error': 'Convite não encontrado.'}, status=status.HTTP_404_NOT_FOUND)

        if invitation.status == 'ACCEPTED':
            return Response({'error': 'Não é possível cancelar um convite já aceito.'}, status=status.HTTP_400_BAD_REQUEST)

        invitation.status = 'CANCELLED'
        invitation.updated_by = request.user
        invitation.save(update_fields=['status', 'updated_by', 'updated_at'])
        return Response({'message': 'Convite cancelado.'})






@extend_schema(tags=['Admin — Permissões'])
class AdminPermissionListView(APIView):
    """Lista todas as permissões relevantes agrupadas por módulo."""
    permission_classes = [IsSuperUser]

    def get(self, request):
        modules = []
        for app_label, models in RELEVANT_MODULES.items():
            for model_name, module_label in models.items():
                try:
                    ct = ContentType.objects.get(app_label=app_label, model=model_name)
                except ContentType.DoesNotExist:
                    continue
                perms = Permission.objects.filter(content_type=ct).order_by('codename')
                perm_list = []
                for perm in perms:
                    # codename: add_X, change_X, delete_X, view_X
                    action = perm.codename.split('_')[0]
                    if action not in ACTION_LABELS:
                        continue
                    perm_list.append({
                        'id': perm.id,
                        'codename': perm.codename,
                        'action': action,
                        'action_label': ACTION_LABELS[action],
                    })
                if perm_list:
                    modules.append({
                        'app_label': app_label,
                        'model': model_name,
                        'label': module_label,
                        'permissions': perm_list,
                    })
        return Response({'modules': modules})


@extend_schema(tags=['Admin — Permissões'])
class AdminGroupListView(APIView):
    """Lista os grupos do sistema com suas permissões atuais."""
    permission_classes = [IsSuperUser]

    def get(self, request):
        groups = Group.objects.prefetch_related('permissions').filter(
            name__in=GROUP_LABELS.keys()
        ).order_by('name')
        data = []
        for group in groups:
            data.append({
                'id': group.id,
                'name': group.name,
                'label': GROUP_LABELS.get(group.name, group.name),
                'permission_ids': list(group.permissions.values_list('id', flat=True)),
            })
        return Response(data)


@extend_schema(tags=['Admin — Permissões'])
class AdminGroupPermissionsUpdateView(APIView):
    """Atualiza as permissões de um grupo específico."""
    permission_classes = [IsSuperUser]

    def put(self, request, group_id):
        try:
            group = Group.objects.get(pk=group_id)
        except Group.DoesNotExist:
            return Response({'error': 'Grupo não encontrado.'}, status=status.HTTP_404_NOT_FOUND)

        permission_ids = request.data.get('permission_ids', [])
        if not isinstance(permission_ids, list):
            return Response({'error': 'permission_ids deve ser uma lista.'}, status=status.HTTP_400_BAD_REQUEST)

        # Valida que todas as permissões são das apps relevantes
        allowed_app_labels = set(RELEVANT_MODULES.keys())
        valid_permissions = Permission.objects.filter(
            id__in=permission_ids,
            content_type__app_label__in=allowed_app_labels,
        )
        group.permissions.set(valid_permissions)

        return Response({
            'id': group.id,
            'name': group.name,
            'label': GROUP_LABELS.get(group.name, group.name),
            'permission_ids': list(group.permissions.values_list('id', flat=True)),
        })


@extend_schema(tags=['Convites — Público'])
class InviteValidateView(APIView):
    """Valida se um token de convite é válido (GET público)."""

    def get(self, request, token):
        try:
            invitation = UserInvitation.objects.get(token=token)
        except UserInvitation.DoesNotExist:
            return Response({'valid': False, 'error': 'Convite não encontrado.'}, status=status.HTTP_404_NOT_FOUND)

        if not invitation.is_valid:
            if invitation.status == 'ACCEPTED':
                return Response({'valid': False, 'error': 'Este convite já foi utilizado.'}, status=status.HTTP_400_BAD_REQUEST)
            return Response({'valid': False, 'error': 'Este link expirou ou foi cancelado.'}, status=status.HTTP_400_BAD_REQUEST)

        group_display = dict(UserInvitation.GROUP_CHOICES).get(invitation.group, invitation.group)
        return Response({
            'valid': True,
            'email': invitation.email,
            'group': invitation.group,
            'group_display': group_display,
            'expires_at': invitation.expires_at,
        })


@extend_schema(tags=['Convites — Público'])
class InviteAcceptView(APIView):
    """Aceita um convite e cria o usuário (POST público)."""

    def post(self, request):
        serializer = AcceptInviteSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({'error': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data

        try:
            invitation = UserInvitation.objects.get(token=data['token'])
        except UserInvitation.DoesNotExist:
            return Response({'error': 'Convite não encontrado.'}, status=status.HTTP_404_NOT_FOUND)

        if not invitation.is_valid:
            if invitation.status == 'ACCEPTED':
                return Response({'error': 'Este convite já foi utilizado.'}, status=status.HTTP_400_BAD_REQUEST)
            return Response({'error': 'Este link expirou ou foi cancelado.'}, status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(email=invitation.email).exists():
            return Response({'error': 'Já existe um usuário com esse e-mail.'}, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.create_user(
            email=invitation.email,
            password=data['password'],
            first_name=data['first_name'],
            last_name=data.get('last_name', ''),
            is_active=True,
        )
        if invitation.group:
            _assign_group(user, invitation.group)

        invitation.mark_accepted()

        return Response({'message': 'Conta criada com sucesso! Faça login para continuar.'}, status=status.HTTP_201_CREATED)
