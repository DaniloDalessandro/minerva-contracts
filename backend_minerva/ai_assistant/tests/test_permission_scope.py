"""
Testes unitários para PermissionScope.

Cobre:
- Superusuário → acesso total independentemente de perfil
- Presidente/Diretor → acesso total
- Gerente → escopo da gerência
- Coordenador/Funcionário → escopo da coordenação
- Usuário None → acesso total (modo sem autenticação)
"""
from unittest.mock import MagicMock, patch
from django.test import TestCase


def _make_user(group: str, coordination=None, management=None, direction=None, is_superuser=False):
    """Cria mock de usuário com os atributos necessários."""
    user = MagicMock()
    user.is_superuser = is_superuser
    user.username = f"user_{group.lower()}"

    # Simula user.groups.values_list('name', flat=True).first()
    groups_mock = MagicMock()
    groups_mock.values_list.return_value.first.return_value = group
    user.groups = groups_mock

    employee = MagicMock()
    employee.coordination = coordination
    employee.management = management
    employee.direction = direction
    user.employee = employee
    return user


class PermissionScopeFullAccessTests(TestCase):

    def test_superuser_has_full_access(self):
        """Superusuário tem acesso total independentemente de perfil."""
        from ai_assistant.services.permission_scope import PermissionScope
        user = _make_user('FUNCIONARIO', is_superuser=True)
        scope = PermissionScope(user)
        self.assertTrue(scope.is_full_access)

    def test_superuser_no_group_has_full_access(self):
        """Superusuário sem grupo algum ainda tem acesso total."""
        from ai_assistant.services.permission_scope import PermissionScope
        user = MagicMock()
        user.is_superuser = True
        user.username = "admin"
        groups_mock = MagicMock()
        groups_mock.values_list.return_value.first.return_value = None
        user.groups = groups_mock
        user.employee = None
        scope = PermissionScope(user)
        self.assertTrue(scope.is_full_access)

    def test_presidente_has_full_access(self):
        from ai_assistant.services.permission_scope import PermissionScope
        user = _make_user('PRESIDENTE')
        scope = PermissionScope(user)
        self.assertTrue(scope.is_full_access)

    def test_diretor_has_full_access(self):
        from ai_assistant.services.permission_scope import PermissionScope
        user = _make_user('DIRETOR')
        scope = PermissionScope(user)
        self.assertTrue(scope.is_full_access)

    def test_none_user_has_full_access(self):
        from ai_assistant.services.permission_scope import PermissionScope
        scope = PermissionScope(user=None)
        self.assertTrue(scope.is_full_access)

    def test_gerente_not_full_access(self):
        from ai_assistant.services.permission_scope import PermissionScope
        user = _make_user('GERENTE')
        scope = PermissionScope(user)
        self.assertFalse(scope.is_full_access)

    def test_funcionario_not_full_access(self):
        from ai_assistant.services.permission_scope import PermissionScope
        user = _make_user('FUNCIONARIO')
        scope = PermissionScope(user)
        self.assertFalse(scope.is_full_access)


class PermissionScopeDescribeTests(TestCase):

    def test_describe_full_access(self):
        from ai_assistant.services.permission_scope import PermissionScope
        user = _make_user('PRESIDENTE')
        scope = PermissionScope(user)
        desc = scope.describe()
        self.assertIn('acesso total', desc)

    def test_describe_superuser_full_access(self):
        from ai_assistant.services.permission_scope import PermissionScope
        user = _make_user('FUNCIONARIO', is_superuser=True)
        scope = PermissionScope(user)
        desc = scope.describe()
        self.assertIn('acesso total', desc)

    def test_describe_no_user(self):
        from ai_assistant.services.permission_scope import PermissionScope
        scope = PermissionScope(user=None)
        desc = scope.describe()
        self.assertIn('sem autenticação', desc)

    def test_describe_coordination_scope(self):
        from ai_assistant.services.permission_scope import PermissionScope
        coord = MagicMock()
        coord.__str__ = lambda self: 'Coord TI'
        user = _make_user('FUNCIONARIO', coordination=coord)
        scope = PermissionScope(user)
        desc = scope.describe()
        self.assertIn('coordenação', desc)
