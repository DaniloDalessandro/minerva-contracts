"""Lógica da migração de dados aditiva (Direction/Management/Coordination/Employee/Group -> access_control).

Vive fora do arquivo de migration para poder ser testada diretamente (via TestCase
normal, sem precisar simular o grafo de migrations), e para ser chamada pela
migration de dados usando os modelos históricos (`apps.get_model(...)`).

Não apaga nem altera nada do lado legado — só cria/atualiza registros no lado novo.
"""

DEFAULT_ACTIONS = [
    ("CREATE", "Criar"),
    ("EDIT", "Editar"),
    ("APPROVE", "Aprovar"),
    ("DELETE", "Excluir"),
    ("CANCEL", "Cancelar"),
    ("EXPORT", "Exportar"),
    ("SIGN", "Assinar"),
]

# Normaliza os três esquemas de grupo encontrados no diagnóstico (uppercase de
# user_admin_views.py, title-case de setup_hierarchy.py, e o terceiro conjunto de
# accounts/permissions.py::create_default_groups) em um único vocabulário de Role.
GROUP_NAME_TO_ROLE_CODE = {
    "PRESIDENTE": "PRESIDENTE",
    "DIRETOR": "DIRETOR",
    "GERENTE": "GERENTE",
    "COORDENADOR": "COORDENADOR",
    "FUNCIONARIO": "FUNCIONARIO",
}

DEFAULT_ROLES = [
    ("PRESIDENTE", "Presidente", ["CREATE", "EDIT", "APPROVE", "DELETE", "CANCEL", "EXPORT", "SIGN"]),
    ("DIRETOR", "Diretor", ["CREATE", "EDIT", "APPROVE", "DELETE", "CANCEL", "EXPORT", "SIGN"]),
    ("GERENTE", "Gerente", ["CREATE", "EDIT", "APPROVE", "EXPORT"]),
    ("COORDENADOR", "Coordenador", ["CREATE", "EDIT", "EXPORT"]),
    ("FUNCIONARIO", "Funcionário", ["EXPORT"]),
    ("ANALISTA", "Analista", ["CREATE", "EDIT", "EXPORT"]),
    ("ASSISTENTE", "Assistente", ["EDIT", "EXPORT"]),
    ("AUDITOR", "Auditor", ["EXPORT"]),
    ("ESTAGIARIO", "Estagiário", []),
]


def _resolve_role_code_for_user(user):
    """Melhor esforço: acha o grupo do usuário compatível com um dos 3 esquemas conhecidos."""
    group_names = list(user.groups.values_list("name", flat=True))
    for group_name in group_names:
        normalized = group_name.strip().upper()
        if normalized in GROUP_NAME_TO_ROLE_CODE:
            return GROUP_NAME_TO_ROLE_CODE[normalized]
        for prefix, code in (("DIRETOR", "DIRETOR"), ("GERENTE", "GERENTE"),
                              ("COORDENA", "COORDENADOR"), ("PRESIDENTE", "PRESIDENTE")):
            if normalized.startswith(prefix):
                return code
    return "FUNCIONARIO"


def sync_actions(action_model):
    codes_to_action = {}
    for code, label in DEFAULT_ACTIONS:
        action, _ = action_model.objects.get_or_create(code=code, defaults={"label": label})
        codes_to_action[code] = action
    return codes_to_action


def sync_roles(role_model, actions_by_code):
    codes_to_role = {}
    for code, name, action_codes in DEFAULT_ROLES:
        role, _ = role_model.objects.get_or_create(code=code, defaults={"name": name})
        role.actions.set([actions_by_code[c] for c in action_codes if c in actions_by_code])
        codes_to_role[code] = role
    return codes_to_role


def _ensure_path(unit, parent_unit):
    """Calcula/persiste `path` explicitamente, sem depender do save() customizado do
    modelo real — dentro de uma migration, `apps.get_model(...)` retorna uma versão
    histórica do modelo que NÃO carrega métodos customizados (só os campos), então
    o `OrganizationalUnit.save()` que mantém `path` nunca roda nesse contexto.
    """
    expected_path = f"{parent_unit.path}{unit.pk:06d}/" if parent_unit else f"{unit.pk:06d}/"
    if unit.path != expected_path:
        unit.path = expected_path
        unit.save(update_fields=["path"])


def sync_organizational_units(direction_model, management_model, coordination_model, organizational_unit_model):
    direction_to_unit = {}
    management_to_unit = {}
    coordination_to_unit = {}

    for direction in direction_model.objects.all():
        unit, _ = organizational_unit_model.objects.get_or_create(
            legacy_direction_id=direction.pk,
            defaults={
                "name": direction.name,
                "code": f"DIRECTION-{direction.pk}",
                "unit_type": "DIRETORIA",
                "is_active": direction.is_active,
            },
        )
        _ensure_path(unit, None)
        direction_to_unit[direction.pk] = unit

    for management in management_model.objects.all():
        parent_unit = direction_to_unit.get(management.direction_id)
        unit, _ = organizational_unit_model.objects.get_or_create(
            legacy_management_id=management.pk,
            defaults={
                "name": management.name,
                "code": f"MANAGEMENT-{management.pk}",
                "unit_type": "GERENCIA",
                "parent": parent_unit,
                "is_active": management.is_active,
            },
        )
        _ensure_path(unit, parent_unit)
        management_to_unit[management.pk] = unit

    for coordination in coordination_model.objects.all():
        parent_unit = management_to_unit.get(coordination.management_id)
        unit, _ = organizational_unit_model.objects.get_or_create(
            legacy_coordination_id=coordination.pk,
            defaults={
                "name": coordination.name,
                "code": f"COORDINATION-{coordination.pk}",
                "unit_type": "COORDENACAO",
                "parent": parent_unit,
                "is_active": coordination.is_active,
            },
        )
        _ensure_path(unit, parent_unit)
        coordination_to_unit[coordination.pk] = unit

    return direction_to_unit, management_to_unit, coordination_to_unit


def sync_memberships(employee_model, membership_model, roles_by_code,
                      direction_to_unit, management_to_unit, coordination_to_unit):
    created = 0
    for employee in employee_model.objects.select_related("user").all():
        user = getattr(employee, "user", None)
        if user is None:
            continue

        unit = (
            coordination_to_unit.get(employee.coordination_id)
            or management_to_unit.get(employee.management_id)
            or direction_to_unit.get(employee.direction_id)
        )
        if unit is None:
            continue

        role_code = _resolve_role_code_for_user(user)
        role = roles_by_code.get(role_code) or roles_by_code["FUNCIONARIO"]

        _, was_created = membership_model.objects.get_or_create(
            user=user,
            organizational_unit=unit,
            role=role,
            defaults={
                "start_date": employee.created_at.date() if employee.created_at else None,
                "is_active": employee.status == "ATIVO",
            },
        )
        if was_created:
            created += 1
    return created


def run_full_sync(*, direction_model, management_model, coordination_model, employee_model,
                   organizational_unit_model, action_model, role_model, membership_model):
    actions_by_code = sync_actions(action_model)
    roles_by_code = sync_roles(role_model, actions_by_code)
    direction_to_unit, management_to_unit, coordination_to_unit = sync_organizational_units(
        direction_model, management_model, coordination_model, organizational_unit_model
    )
    memberships_created = sync_memberships(
        employee_model, membership_model, roles_by_code,
        direction_to_unit, management_to_unit, coordination_to_unit,
    )
    return {
        "actions": len(actions_by_code),
        "roles": len(roles_by_code),
        "units": len(direction_to_unit) + len(management_to_unit) + len(coordination_to_unit),
        "memberships": memberships_created,
    }
