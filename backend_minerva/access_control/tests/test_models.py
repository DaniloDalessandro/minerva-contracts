from datetime import timedelta

from django.core.exceptions import ValidationError
from django.test import TestCase
from django.utils import timezone

from access_control.models import AccessGrant, Membership, OrganizationalUnit
from .factories import make_action, make_grant, make_membership, make_role, make_unit, make_user


class OrganizationalUnitTreeTests(TestCase):
    def test_path_is_built_on_create(self):
        root = make_unit("Presidencia", "PRESIDENCIA")
        self.assertEqual(root.path, f"{root.pk:06d}/")

    def test_path_includes_parent_chain(self):
        root = make_unit("Presidencia", "PRESIDENCIA")
        diretoria = make_unit("Diretoria Financeira", "DIRETORIA", parent=root)
        gerencia = make_unit("Gerencia Financeira", "GERENCIA", parent=diretoria)

        self.assertEqual(gerencia.path, f"{root.pk:06d}/{diretoria.pk:06d}/{gerencia.pk:06d}/")

    def test_get_descendant_ids_returns_whole_subtree(self):
        root = make_unit("Presidencia", "PRESIDENCIA")
        diretoria = make_unit("Diretoria", "DIRETORIA", parent=root)
        gerencia = make_unit("Gerencia", "GERENCIA", parent=diretoria)
        coordenacao = make_unit("Coordenacao", "COORDENACAO", parent=gerencia)
        other_root = make_unit("Outra Diretoria", "DIRETORIA")

        ids = set(diretoria.get_descendant_ids())

        self.assertEqual(ids, {diretoria.pk, gerencia.pk, coordenacao.pk})
        self.assertNotIn(other_root.pk, ids)

    def test_get_descendant_ids_without_self(self):
        root = make_unit("Presidencia", "PRESIDENCIA")
        child = make_unit("Diretoria", "DIRETORIA", parent=root)

        ids = set(root.get_descendant_ids(include_self=False))

        self.assertEqual(ids, {child.pk})

    def test_moving_a_unit_repropagates_descendant_paths(self):
        root_a = make_unit("Diretoria A", "DIRETORIA")
        root_b = make_unit("Diretoria B", "DIRETORIA")
        gerencia = make_unit("Gerencia", "GERENCIA", parent=root_a)
        coordenacao = make_unit("Coordenacao", "COORDENACAO", parent=gerencia)

        gerencia.parent = root_b
        gerencia.save()
        coordenacao.refresh_from_db()

        self.assertTrue(coordenacao.path.startswith(gerencia.path))
        self.assertIn(coordenacao.pk, root_b.get_descendant_ids())


class MembershipTests(TestCase):
    def test_user_can_hold_multiple_simultaneous_active_memberships(self):
        user = make_user()
        unit_a = make_unit("Unidade A")
        unit_b = make_unit("Unidade B")
        role = make_role()

        make_membership(user, unit_a, role)
        make_membership(user, unit_b, role)

        self.assertEqual(Membership.objects.filter(user=user, is_active=True).count(), 2)

    def test_close_ends_membership_without_deleting_it(self):
        user = make_user()
        unit = make_unit("Unidade")
        role = make_role()
        membership = make_membership(user, unit, role)

        membership.close()

        membership.refresh_from_db()
        self.assertFalse(membership.is_active)
        self.assertIsNotNone(membership.end_date)
        self.assertTrue(Membership.objects.filter(pk=membership.pk).exists())


class AccessGrantValidationTests(TestCase):
    def test_requires_exactly_one_target(self):
        resource = make_unit("Recurso")
        grant = AccessGrant(
            resource=resource,
            permission_level=make_action(),
            start_date=timezone.now().date(),
            end_date=timezone.now().date() + timedelta(days=1),
            reason="Teste",
        )
        with self.assertRaises(ValidationError):
            grant.clean()

    def test_rejects_more_than_one_target(self):
        resource = make_unit("Recurso")
        user = make_user()
        role = make_role()
        grant = AccessGrant(
            resource=resource,
            target_user=user,
            target_role=role,
            permission_level=make_action(),
            start_date=timezone.now().date(),
            end_date=timezone.now().date() + timedelta(days=1),
            reason="Teste",
        )
        with self.assertRaises(ValidationError):
            grant.clean()

    def test_rejects_end_date_before_start_date(self):
        resource = make_unit("Recurso")
        user = make_user()
        grant = AccessGrant(
            resource=resource,
            target_user=user,
            permission_level=make_action(),
            start_date=timezone.now().date(),
            end_date=timezone.now().date() - timedelta(days=1),
            reason="Teste",
        )
        with self.assertRaises(ValidationError):
            grant.clean()

    def test_is_in_effect_true_within_validity_window(self):
        resource = make_unit("Recurso")
        user = make_user()
        grant = make_grant(resource, target_user=user)
        self.assertTrue(grant.is_in_effect)

    def test_is_in_effect_false_when_expired(self):
        resource = make_unit("Recurso")
        user = make_user()
        grant = make_grant(resource, target_user=user, days_valid=-1)
        self.assertFalse(grant.is_in_effect)

    def test_revoke_marks_inactive_and_stamps_revoker(self):
        resource = make_unit("Recurso")
        user = make_user()
        revoker = make_user(email="admin@minerva.local")
        grant = make_grant(resource, target_user=user)

        grant.revoke(revoked_by=revoker)

        grant.refresh_from_db()
        self.assertFalse(grant.is_active)
        self.assertEqual(grant.revoked_by, revoker)
        self.assertIsNotNone(grant.revoked_at)
