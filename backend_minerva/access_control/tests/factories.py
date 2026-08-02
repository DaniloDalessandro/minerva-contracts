"""Pequenos helpers de criação de dados para os testes do app access_control.

Segue a mesma linha do resto do repositório (sem factory_boy/Faker instalados):
funções simples que criam o mínimo necessário para cada teste.
"""
from datetime import timedelta

from django.utils import timezone

from accounts.models import User
from access_control.models import Action, AccessGrant, Membership, OrganizationalUnit, Role

ALL_ACTION_CODES = ["CREATE", "EDIT", "APPROVE", "DELETE", "CANCEL", "EXPORT", "SIGN"]


def make_user(email="user@minerva.local", is_superuser=False):
    if is_superuser:
        return User.objects.create_superuser(email=email, password="testpass123")
    return User.objects.create_user(email=email, password="testpass123")


def make_unit(name, unit_type="DIRETORIA", parent=None, code=None):
    return OrganizationalUnit.objects.create(
        name=name,
        code=code or name.upper().replace(" ", "_"),
        unit_type=unit_type,
        parent=parent,
    )


def make_action(code="EDIT", label=None):
    action, _ = Action.objects.get_or_create(code=code, defaults={"label": label or code.title()})
    return action


def make_role(name="Analista", code="ANALISTA", action_codes=None):
    role, _ = Role.objects.get_or_create(name=name, code=code)
    for action_code in (action_codes or []):
        role.actions.add(make_action(action_code))
    return role


def make_membership(user, unit, role, is_active=True, end_date=None):
    return Membership.objects.create(
        user=user,
        organizational_unit=unit,
        role=role,
        is_active=is_active,
        end_date=end_date,
    )


def make_grant(resource, *, target_user=None, target_role=None, target_unit=None,
                permission_level=None, days_valid=30, granted_by=None, reason="Teste"):
    today = timezone.now().date()
    return AccessGrant.objects.create(
        resource=resource,
        target_user=target_user,
        target_role=target_role,
        target_organizational_unit=target_unit,
        permission_level=permission_level or make_action("EDIT"),
        start_date=today,
        end_date=today + timedelta(days=days_valid),
        reason=reason,
        granted_by=granted_by,
    )
