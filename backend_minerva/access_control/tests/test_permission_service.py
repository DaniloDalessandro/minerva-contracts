from django.test import TestCase

from access_control.services import PermissionService
from .factories import make_grant, make_membership, make_role, make_unit, make_user


class SuperuserAndPresidentTests(TestCase):
    def test_superuser_has_full_access(self):
        user = make_user(is_superuser=True)
        resource = make_unit("Recurso")

        self.assertTrue(PermissionService.has_access_to(user, resource))

    def test_president_role_has_full_access_without_being_django_superuser(self):
        user = make_user()
        president_role = make_role(name="Presidente", code="PRESIDENTE")
        root = make_unit("Presidencia")
        make_membership(user, root, president_role)

        other_branch = make_unit("Outra Diretoria")
        self.assertTrue(PermissionService.has_access_to(user, other_branch, resource_unit_id=other_branch.pk))

    def test_accessible_unit_ids_for_president_is_everything(self):
        user = make_user()
        president_role = make_role(name="Presidente", code="PRESIDENTE")
        root = make_unit("Presidencia")
        make_membership(user, root, president_role)
        unrelated = make_unit("Outra")

        ids = PermissionService.accessible_unit_ids(user)

        self.assertIn(unrelated.pk, ids)


class HierarchyInheritanceTests(TestCase):
    def test_director_sees_management_and_coordination_below(self):
        user = make_user()
        director_role = make_role(name="Diretor", code="DIRETOR")
        diretoria = make_unit("Diretoria", "DIRETORIA")
        gerencia = make_unit("Gerencia", "GERENCIA", parent=diretoria)
        coordenacao = make_unit("Coordenacao", "COORDENACAO", parent=gerencia)
        make_membership(user, diretoria, director_role)

        self.assertTrue(PermissionService.has_access_to(user, coordenacao, resource_unit_id=coordenacao.pk))

    def test_coordinator_does_not_see_sibling_branch(self):
        user = make_user()
        role = make_role(name="Coordenador", code="COORDENADOR")
        diretoria = make_unit("Diretoria", "DIRETORIA")
        gerencia_a = make_unit("Gerencia A", "GERENCIA", parent=diretoria)
        gerencia_b = make_unit("Gerencia B", "GERENCIA", parent=diretoria)
        coordenacao_a = make_unit("Coordenacao A", "COORDENACAO", parent=gerencia_a)
        coordenacao_b = make_unit("Coordenacao B", "COORDENACAO", parent=gerencia_b)
        make_membership(user, coordenacao_a, role)

        self.assertTrue(PermissionService.has_access_to(user, coordenacao_a, resource_unit_id=coordenacao_a.pk))
        self.assertFalse(PermissionService.has_access_to(user, coordenacao_b, resource_unit_id=coordenacao_b.pk))


class AccessGrantPrecedenceTests(TestCase):
    def test_grant_by_user_grants_access_outside_hierarchy(self):
        user = make_user()
        resource = make_unit("Processo Compartilhado")

        self.assertFalse(PermissionService.has_access_to(user, resource))

        make_grant(resource, target_user=user)

        self.assertTrue(PermissionService.has_access_to(user, resource))

    def test_grant_by_role_grants_access_to_every_member_of_that_role(self):
        user = make_user()
        auditor_role = make_role(name="Auditor", code="AUDITOR")
        unit = make_unit("Unidade qualquer")
        make_membership(user, unit, auditor_role)
        resource = make_unit("Contrato Compartilhado")

        make_grant(resource, target_role=auditor_role)

        self.assertTrue(PermissionService.has_access_to(user, resource))

    def test_grant_by_organizational_unit_grants_access_to_every_member(self):
        user = make_user()
        role = make_role()
        member_unit = make_unit("Gerencia Juridica")
        make_membership(user, member_unit, role)
        resource = make_unit("Diretoria Financeira")

        make_grant(resource, target_unit=member_unit)

        self.assertTrue(PermissionService.has_access_to(user, resource))

    def test_expired_grant_does_not_grant_access(self):
        user = make_user()
        resource = make_unit("Recurso vencido")

        make_grant(resource, target_user=user, days_valid=-5)

        self.assertFalse(PermissionService.has_access_to(user, resource))

    def test_revoked_grant_does_not_grant_access(self):
        user = make_user()
        resource = make_unit("Recurso revogado")
        grant = make_grant(resource, target_user=user)
        grant.revoke()

        self.assertFalse(PermissionService.has_access_to(user, resource))

    def test_deny_by_default_with_no_hierarchy_or_grant(self):
        user = make_user()
        resource = make_unit("Recurso isolado")

        self.assertFalse(PermissionService.has_access_to(user, resource))

    def test_unauthenticated_user_is_always_denied(self):
        from django.contrib.auth.models import AnonymousUser

        resource = make_unit("Recurso")
        self.assertFalse(PermissionService.has_access_to(AnonymousUser(), resource))


class CanActionTests(TestCase):
    def test_can_requires_both_access_and_role_action(self):
        user = make_user()
        role = make_role(name="Analista", code="ANALISTA_2", action_codes=["EDIT"])
        unit = make_unit("Unidade")
        make_membership(user, unit, role)

        self.assertTrue(PermissionService.can(user, "EDIT", unit, resource_unit_id=unit.pk))
        self.assertFalse(PermissionService.can(user, "DELETE", unit, resource_unit_id=unit.pk))

    def test_can_denies_when_no_access_to_resource(self):
        user = make_user()
        role = make_role(name="Analista", code="ANALISTA_3", action_codes=["EDIT"])
        make_membership(user, make_unit("Minha unidade"), role)
        other_resource = make_unit("Outra unidade")

        self.assertFalse(PermissionService.can(user, "EDIT", other_resource, resource_unit_id=other_resource.pk))


class QuerysetScopingTests(TestCase):
    def test_filter_queryset_restricts_to_accessible_units(self):
        from access_control.models import OrganizationalUnit

        user = make_user()
        role = make_role()
        diretoria = make_unit("Diretoria", "DIRETORIA")
        gerencia = make_unit("Gerencia", "GERENCIA", parent=diretoria)
        outra_diretoria = make_unit("Outra Diretoria", "DIRETORIA")
        make_membership(user, diretoria, role)

        visible_ids = set(
            PermissionService.filter_queryset(
                user, OrganizationalUnit.objects.all(), "pk"
            ).values_list("pk", flat=True)
        )

        self.assertIn(diretoria.pk, visible_ids)
        self.assertIn(gerencia.pk, visible_ids)
        self.assertNotIn(outra_diretoria.pk, visible_ids)

    def test_filter_queryset_returns_everything_for_president(self):
        from access_control.models import OrganizationalUnit

        user = make_user()
        president_role = make_role(name="Presidente", code="PRESIDENTE")
        make_membership(user, make_unit("Presidencia"), president_role)
        make_unit("Qualquer outra")

        visible = PermissionService.filter_queryset(user, OrganizationalUnit.objects.all(), "pk")

        self.assertEqual(visible.count(), OrganizationalUnit.objects.count())
