from django.db import migrations


def sync_forward(apps, schema_editor):
    from access_control.services.legacy_sync import run_full_sync

    run_full_sync(
        direction_model=apps.get_model("sector", "Direction"),
        management_model=apps.get_model("sector", "Management"),
        coordination_model=apps.get_model("sector", "Coordination"),
        employee_model=apps.get_model("employee", "Employee"),
        organizational_unit_model=apps.get_model("access_control", "OrganizationalUnit"),
        action_model=apps.get_model("access_control", "Action"),
        role_model=apps.get_model("access_control", "Role"),
        membership_model=apps.get_model("access_control", "Membership"),
    )


def sync_reverse(apps, schema_editor):
    # Puramente aditivo: reverter só limpa o que esta migration criou, nunca toca
    # em Direction/Management/Coordination/Employee/Group (dados legados intactos).
    organizational_unit_model = apps.get_model("access_control", "OrganizationalUnit")

    apps.get_model("access_control", "Membership").objects.all().delete()

    # `parent` usa on_delete=PROTECT, então uma unidade com filhos não pode ser
    # apagada antes deles — remove a árvore de baixo para cima (folhas primeiro)
    # em vez de um `.all().delete()` ingênuo.
    remaining = organizational_unit_model.objects.all()
    while remaining.exists():
        leaf_ids = list(
            remaining.exclude(children__isnull=False).values_list("pk", flat=True)
        )
        if not leaf_ids:
            break
        organizational_unit_model.objects.filter(pk__in=leaf_ids).delete()
        remaining = organizational_unit_model.objects.all()

    apps.get_model("access_control", "Role").objects.all().delete()
    apps.get_model("access_control", "Action").objects.all().delete()


class Migration(migrations.Migration):

    dependencies = [
        ("access_control", "0001_initial"),
        ("sector", "0002_alter_coordination_created_by_and_more"),
        ("employee", "0002_alter_employee_created_by_alter_employee_updated_by"),
        ("accounts", "0003_userinvitation"),
    ]

    operations = [
        migrations.RunPython(sync_forward, sync_reverse),
    ]
