"""Teste de fumaça da migração de dados: roda a lógica de sync contra um dataset
legado semeado (Direction/Management/Coordination/Employee/Group) e confere a
árvore/memberships resultantes no lado novo. Não depende do grafo de migrations
do Django porque a lógica vive em access_control.services.legacy_sync (ver ali
o motivo dessa separação).
"""
from django.contrib.auth.models import Group
from django.test import TestCase

from accounts.models import User
from access_control.models import Action, AccessGrant, Membership, OrganizationalUnit, Role
from access_control.services.legacy_sync import run_full_sync
from employee.models import Employee
from sector.models import Coordination, Direction, Management


class LegacySyncTests(TestCase):
    def setUp(self):
        self.direction = Direction.objects.create(name="DIRECAO ADMINISTRATIVA")
        self.management = Management.objects.create(name="GERENCIA DE TI", direction=self.direction)
        self.coordination = Coordination.objects.create(name="COORDENACAO DE SISTEMAS", management=self.management)

        self.group = Group.objects.create(name="GERENTE")
        self.user = User.objects.create_user(email="gerente@minerva.local", password="testpass123")
        self.user.groups.add(self.group)

        self.employee = Employee.objects.create(
            full_name="Gerente Teste",
            email="gerente@minerva.local",
            cpf="00000000000",
            direction=self.direction,
            management=self.management,
            coordination=self.coordination,
            status="ATIVO",
        )
        self.user.employee = self.employee
        self.user.save()

    def _run(self):
        return run_full_sync(
            direction_model=Direction,
            management_model=Management,
            coordination_model=Coordination,
            employee_model=Employee,
            organizational_unit_model=OrganizationalUnit,
            action_model=Action,
            role_model=Role,
            membership_model=Membership,
        )

    def test_mirrors_full_direction_management_coordination_chain(self):
        self._run()

        direction_unit = OrganizationalUnit.objects.get(legacy_direction_id=self.direction.pk)
        management_unit = OrganizationalUnit.objects.get(legacy_management_id=self.management.pk)
        coordination_unit = OrganizationalUnit.objects.get(legacy_coordination_id=self.coordination.pk)

        self.assertIsNone(direction_unit.parent)
        self.assertEqual(management_unit.parent_id, direction_unit.pk)
        self.assertEqual(coordination_unit.parent_id, management_unit.pk)
        self.assertTrue(coordination_unit.path.startswith(direction_unit.path))

    def test_creates_membership_at_most_specific_unit_with_resolved_role(self):
        self._run()

        coordination_unit = OrganizationalUnit.objects.get(legacy_coordination_id=self.coordination.pk)
        membership = Membership.objects.get(user=self.user)

        self.assertEqual(membership.organizational_unit_id, coordination_unit.pk)
        self.assertEqual(membership.role.code, "GERENTE")
        self.assertTrue(membership.is_active)

    def test_is_idempotent(self):
        self._run()
        result = self._run()

        self.assertEqual(Membership.objects.filter(user=self.user).count(), 1)
        self.assertEqual(OrganizationalUnit.objects.count(), 3)
        self.assertEqual(result["memberships"], 0)  # segunda rodada não recria nada

    def test_does_not_touch_legacy_tables(self):
        self._run()

        self.assertEqual(Direction.objects.count(), 1)
        self.assertEqual(Management.objects.count(), 1)
        self.assertEqual(Coordination.objects.count(), 1)
        self.assertEqual(Employee.objects.count(), 1)
        self.assertEqual(self.direction.name, "DIRECAO ADMINISTRATIVA")

    def test_inactive_employee_creates_inactive_membership(self):
        self.employee.status = "INATIVO"
        self.employee.save()

        self._run()

        membership = Membership.objects.get(user=self.user)
        self.assertFalse(membership.is_active)

    def test_employee_without_linked_user_is_skipped(self):
        orphan = Employee.objects.create(
            full_name="Sem usuario",
            email="sem.usuario@minerva.local",
            cpf="11111111111",
            direction=self.direction,
        )
        self._run()

        self.assertFalse(Membership.objects.filter(organizational_unit__legacy_direction_id=self.direction.pk,
                                                     user__employee=orphan).exists())
