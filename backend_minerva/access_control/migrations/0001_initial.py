import django.db.models.deletion
import django.utils.timezone
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("contenttypes", "0002_remove_content_type_name"),
    ]

    operations = [
        migrations.CreateModel(
            name="Action",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("code", models.CharField(max_length=30, unique=True, verbose_name="Código")),
                ("label", models.CharField(max_length=100, verbose_name="Rótulo")),
            ],
            options={
                "verbose_name": "Ação",
                "verbose_name_plural": "Ações",
                "ordering": ["label"],
            },
        ),
        migrations.CreateModel(
            name="OrganizationalUnit",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=150, verbose_name="Nome")),
                ("code", models.CharField(max_length=50, unique=True, verbose_name="Código")),
                ("unit_type", models.CharField(max_length=50, verbose_name="Tipo")),
                ("path", models.CharField(blank=True, db_index=True, editable=False, max_length=255)),
                ("is_active", models.BooleanField(default=True, verbose_name="Ativo")),
                ("legacy_direction_id", models.IntegerField(blank=True, null=True, unique=True)),
                ("legacy_management_id", models.IntegerField(blank=True, null=True, unique=True)),
                ("legacy_coordination_id", models.IntegerField(blank=True, null=True, unique=True)),
                ("created_at", models.DateTimeField(auto_now_add=True, verbose_name="Criado em")),
                ("updated_at", models.DateTimeField(auto_now=True, verbose_name="Atualizado em")),
                ("created_by", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL,
                    related_name="organizational_units_created", to=settings.AUTH_USER_MODEL, verbose_name="Criado por")),
                ("parent", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT,
                    related_name="children", to="access_control.organizationalunit", verbose_name="Unidade pai")),
                ("updated_by", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL,
                    related_name="organizational_units_updated", to=settings.AUTH_USER_MODEL, verbose_name="Atualizado por")),
            ],
            options={
                "verbose_name": "Unidade Organizacional",
                "verbose_name_plural": "Unidades Organizacionais",
                "ordering": ["path"],
            },
        ),
        migrations.CreateModel(
            name="Role",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=100, verbose_name="Nome")),
                ("code", models.CharField(max_length=50, unique=True, verbose_name="Código")),
                ("is_active", models.BooleanField(default=True, verbose_name="Ativo")),
                ("created_at", models.DateTimeField(auto_now_add=True, verbose_name="Criado em")),
                ("updated_at", models.DateTimeField(auto_now=True, verbose_name="Atualizado em")),
                ("actions", models.ManyToManyField(blank=True, related_name="roles", to="access_control.action", verbose_name="Ações permitidas")),
                ("created_by", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL,
                    related_name="roles_created", to=settings.AUTH_USER_MODEL, verbose_name="Criado por")),
                ("updated_by", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL,
                    related_name="roles_updated", to=settings.AUTH_USER_MODEL, verbose_name="Atualizado por")),
            ],
            options={
                "verbose_name": "Cargo",
                "verbose_name_plural": "Cargos",
                "ordering": ["name"],
            },
        ),
        migrations.CreateModel(
            name="Membership",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("function_title", models.CharField(blank=True, max_length=100, verbose_name="Função")),
                ("start_date", models.DateField(default=django.utils.timezone.now, verbose_name="Início")),
                ("end_date", models.DateField(blank=True, null=True, verbose_name="Fim")),
                ("is_active", models.BooleanField(default=True, verbose_name="Ativo")),
                ("created_at", models.DateTimeField(auto_now_add=True, verbose_name="Criado em")),
                ("updated_at", models.DateTimeField(auto_now=True, verbose_name="Atualizado em")),
                ("created_by", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL,
                    related_name="memberships_created", to=settings.AUTH_USER_MODEL, verbose_name="Criado por")),
                ("organizational_unit", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE,
                    related_name="memberships", to="access_control.organizationalunit", verbose_name="Unidade")),
                ("role", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT,
                    related_name="memberships", to="access_control.role", verbose_name="Cargo")),
                ("updated_by", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL,
                    related_name="memberships_updated", to=settings.AUTH_USER_MODEL, verbose_name="Atualizado por")),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE,
                    related_name="memberships", to=settings.AUTH_USER_MODEL, verbose_name="Usuário")),
            ],
            options={
                "verbose_name": "Vínculo",
                "verbose_name_plural": "Vínculos (Equipe)",
                "ordering": ["-start_date"],
            },
        ),
        migrations.CreateModel(
            name="AccessGrant",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("object_id", models.PositiveBigIntegerField()),
                ("start_date", models.DateField(default=django.utils.timezone.now, verbose_name="Início")),
                ("end_date", models.DateField(verbose_name="Fim")),
                ("reason", models.TextField(verbose_name="Motivo")),
                ("revoked_at", models.DateTimeField(blank=True, null=True, verbose_name="Revogado em")),
                ("is_active", models.BooleanField(default=True, verbose_name="Ativo")),
                ("created_at", models.DateTimeField(auto_now_add=True, verbose_name="Criado em")),
                ("updated_at", models.DateTimeField(auto_now=True, verbose_name="Atualizado em")),
                ("content_type", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE,
                    related_name="+", to="contenttypes.contenttype")),
                ("granted_by", models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL,
                    related_name="access_grants_given", to=settings.AUTH_USER_MODEL, verbose_name="Concedido por")),
                ("permission_level", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT,
                    related_name="access_grants", to="access_control.action", verbose_name="Permissão")),
                ("revoked_by", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL,
                    related_name="access_grants_revoked", to=settings.AUTH_USER_MODEL, verbose_name="Revogado por")),
                ("target_organizational_unit", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE,
                    related_name="access_grants", to="access_control.organizationalunit", verbose_name="Unidade")),
                ("target_role", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE,
                    related_name="access_grants", to="access_control.role", verbose_name="Cargo")),
                ("target_user", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE,
                    related_name="access_grants_received", to=settings.AUTH_USER_MODEL, verbose_name="Usuário")),
            ],
            options={
                "verbose_name": "Compartilhamento de Acesso",
                "verbose_name_plural": "Compartilhamentos de Acesso",
                "ordering": ["-created_at"],
            },
        ),
        migrations.CreateModel(
            name="AuditLog",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("action", models.CharField(choices=[
                    ("GRANT_CREATED", "Compartilhamento criado"),
                    ("GRANT_REVOKED", "Compartilhamento revogado"),
                    ("GRANT_EXPIRED", "Compartilhamento expirado"),
                    ("ROLE_CHANGED", "Cargo alterado"),
                    ("MEMBERSHIP_CREATED", "Vínculo criado"),
                    ("MEMBERSHIP_ENDED", "Vínculo encerrado"),
                    ("UNIT_MOVED", "Unidade reorganizada"),
                ], max_length=30, verbose_name="Ação")),
                ("object_id", models.PositiveBigIntegerField(blank=True, null=True)),
                ("before", models.JSONField(blank=True, null=True, verbose_name="Antes")),
                ("after", models.JSONField(blank=True, null=True, verbose_name="Depois")),
                ("reason", models.TextField(blank=True, verbose_name="Motivo")),
                ("created_at", models.DateTimeField(auto_now_add=True, verbose_name="Criado em")),
                ("actor", models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL,
                    related_name="audit_logs", to=settings.AUTH_USER_MODEL, verbose_name="Autor")),
                ("content_type", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE,
                    related_name="+", to="contenttypes.contenttype")),
            ],
            options={
                "verbose_name": "Log de Auditoria",
                "verbose_name_plural": "Logs de Auditoria",
                "ordering": ["-created_at"],
            },
        ),
        migrations.AddIndex(
            model_name="organizationalunit",
            index=models.Index(fields=["parent"], name="orgunit_parent_idx"),
        ),
        migrations.AddIndex(
            model_name="organizationalunit",
            index=models.Index(fields=["is_active"], name="orgunit_active_idx"),
        ),
        migrations.AddIndex(
            model_name="membership",
            index=models.Index(fields=["user", "organizational_unit", "is_active"], name="membership_user_unit_idx"),
        ),
        migrations.AddIndex(
            model_name="membership",
            index=models.Index(fields=["organizational_unit", "is_active"], name="membership_unit_active_idx"),
        ),
        migrations.AddIndex(
            model_name="accessgrant",
            index=models.Index(fields=["content_type", "object_id", "is_active", "end_date"], name="grant_resource_idx"),
        ),
        migrations.AddIndex(
            model_name="accessgrant",
            index=models.Index(fields=["target_user", "is_active"], name="grant_target_user_idx"),
        ),
        migrations.AddIndex(
            model_name="accessgrant",
            index=models.Index(fields=["target_role", "is_active"], name="grant_target_role_idx"),
        ),
        migrations.AddIndex(
            model_name="accessgrant",
            index=models.Index(fields=["target_organizational_unit", "is_active"], name="grant_target_unit_idx"),
        ),
        migrations.AddIndex(
            model_name="auditlog",
            index=models.Index(fields=["content_type", "object_id", "created_at"], name="audit_target_idx"),
        ),
        migrations.AddIndex(
            model_name="auditlog",
            index=models.Index(fields=["actor", "created_at"], name="audit_actor_idx"),
        ),
    ]
