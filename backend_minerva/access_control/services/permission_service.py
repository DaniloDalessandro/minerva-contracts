from django.contrib.contenttypes.models import ContentType
from django.db.models import Q, QuerySet
from django.utils import timezone

from ..models import AccessGrant, Membership, OrganizationalUnit, Role


PRESIDENT_ROLE_CODE = "PRESIDENTE"


class PermissionService:
    """Ponto único de autorização do sistema (Etapa 9).

    Nenhuma tela/view deve implementar regra própria de permissão — tudo passa por
    aqui: 1) superuser/Presidente -> acesso total; 2) hierarquia organizacional;
    3) compartilhamento por unidade; 4) compartilhamento por cargo;
    5) compartilhamento por usuário; 6) negar.
    """

    @staticmethod
    def is_president(user) -> bool:
        if getattr(user, "is_superuser", False):
            return True
        return Membership.objects.filter(
            user=user, is_active=True, role__code=PRESIDENT_ROLE_CODE,
        ).exists()

    @staticmethod
    def accessible_unit_ids(user) -> set[int]:
        """Unidades que o usuário enxerga via hierarquia: as suas + toda a subárvore delas."""
        if not getattr(user, "is_authenticated", False):
            return set()

        if PermissionService.is_president(user):
            return set(OrganizationalUnit.objects.values_list("id", flat=True))

        unit_ids: set[int] = set()
        memberships = Membership.objects.filter(user=user, is_active=True).select_related(
            "organizational_unit"
        )
        for membership in memberships:
            unit_ids.update(membership.organizational_unit.get_descendant_ids(include_self=True))
        return unit_ids

    @staticmethod
    def _active_grants_for_resource(resource) -> QuerySet:
        today = timezone.now().date()
        content_type = ContentType.objects.get_for_model(resource.__class__)
        return AccessGrant.objects.filter(
            content_type=content_type,
            object_id=resource.pk,
            is_active=True,
            start_date__lte=today,
            end_date__gte=today,
        )

    @staticmethod
    def has_access_to(user, resource, resource_unit_id: int | None = None) -> bool:
        """Resolve acesso a um recurso específico seguindo o fluxo da Etapa 9."""
        if not getattr(user, "is_authenticated", False):
            return False

        # 1. Presidente / superuser sempre tem acesso total.
        if PermissionService.is_president(user):
            return True

        # 2. Hierarquia: a unidade dona do recurso está entre as unidades acessíveis?
        if resource_unit_id is not None and resource_unit_id in PermissionService.accessible_unit_ids(user):
            return True

        # 3, 4, 5. Compartilhamento vigente por unidade, por cargo ou por usuário.
        grants = PermissionService._active_grants_for_resource(resource)
        user_unit_ids = set(
            Membership.objects.filter(user=user, is_active=True).values_list("organizational_unit_id", flat=True)
        )
        user_role_ids = set(
            Membership.objects.filter(user=user, is_active=True).values_list("role_id", flat=True)
        )
        has_grant = grants.filter(
            Q(target_user=user)
            | Q(target_role_id__in=user_role_ids)
            | Q(target_organizational_unit_id__in=user_unit_ids)
        ).exists()
        if has_grant:
            return True

        # 6. Negar por padrão.
        return False

    @staticmethod
    def can(user, action: str, resource, resource_unit_id: int | None = None) -> bool:
        """Além do acesso ao recurso, confirma que o cargo do usuário permite a ação."""
        if not PermissionService.has_access_to(user, resource, resource_unit_id=resource_unit_id):
            return False
        if PermissionService.is_president(user):
            return True
        return Membership.objects.filter(
            user=user, is_active=True, role__actions__code=action,
        ).exists()

    @staticmethod
    def filter_queryset(user, queryset: QuerySet, unit_field: str) -> QuerySet:
        """Restringe uma listagem às unidades organizacionais acessíveis pelo usuário.

        `unit_field` é o nome do campo FK (ou lookup, ex: "management__organizational_unit")
        que liga cada linha do queryset a uma OrganizationalUnit.
        """
        if PermissionService.is_president(user):
            return queryset
        unit_ids = PermissionService.accessible_unit_ids(user)
        if not unit_ids:
            return queryset.none()
        return queryset.filter(**{f"{unit_field}__in": unit_ids})
