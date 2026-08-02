from django.conf import settings
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.core.exceptions import ValidationError
from django.db import models
from django.utils import timezone


PATH_STEP_WIDTH = 6  # zero-padded segment width, supports up to 999,999 siblings per level


class OrganizationalUnit(models.Model):
    """Nó de uma árvore organizacional de N níveis (Presidência -> Diretoria -> Gerência -> ...).

    `path` é um materialized path (ex: "000001/000004/000017/") mantido em save(),
    permitindo consultar toda a subárvore de uma unidade com um único filtro
    `path__startswith`, sem recursão em Python nem depender de bibliotecas externas
    (django-mptt/treebeard), na mesma linha do restante do repositório.
    """

    name = models.CharField("Nome", max_length=150)
    code = models.CharField("Código", max_length=50, unique=True)
    unit_type = models.CharField("Tipo", max_length=50)
    parent = models.ForeignKey(
        "self",
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="children",
        verbose_name="Unidade pai",
    )
    path = models.CharField(max_length=255, db_index=True, editable=False, blank=True)
    is_active = models.BooleanField("Ativo", default=True)

    # Rastreio transitório da migração de dados (Fase 1) — removido no corte definitivo (Fase 4).
    legacy_direction_id = models.IntegerField(null=True, blank=True, unique=True)
    legacy_management_id = models.IntegerField(null=True, blank=True, unique=True)
    legacy_coordination_id = models.IntegerField(null=True, blank=True, unique=True)

    created_at = models.DateTimeField("Criado em", auto_now_add=True)
    updated_at = models.DateTimeField("Atualizado em", auto_now=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
        related_name="organizational_units_created", verbose_name="Criado por",
    )
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
        related_name="organizational_units_updated", verbose_name="Atualizado por",
    )

    class Meta:
        verbose_name = "Unidade Organizacional"
        verbose_name_plural = "Unidades Organizacionais"
        ordering = ["path"]
        indexes = [
            models.Index(fields=["parent"], name="orgunit_parent_idx"),
            models.Index(fields=["is_active"], name="orgunit_active_idx"),
        ]

    def __str__(self):
        return f"{self.name} ({self.unit_type})"

    def _build_path(self) -> str:
        segment = f"{self.pk:0{PATH_STEP_WIDTH}d}/"
        if self.parent_id:
            parent_path = (
                self.parent.path
                if self.parent.pk == self.parent_id and self.parent.path
                else OrganizationalUnit.objects.only("path").get(pk=self.parent_id).path
            )
            return parent_path + segment
        return segment

    def save(self, *args, **kwargs):
        is_new = self._state.adding
        super().save(*args, **kwargs)
        new_path = self._build_path()
        if new_path != self.path:
            old_path = self.path
            self.path = new_path
            super().save(update_fields=["path"])
            if not is_new and old_path:
                # Unidade movida na árvore: repropaga o path para toda a subárvore existente.
                for descendant in OrganizationalUnit.objects.filter(path__startswith=old_path).exclude(pk=self.pk):
                    descendant.path = new_path + descendant.path[len(old_path):]
                    descendant.save(update_fields=["path"])

    def get_descendant_ids(self, include_self: bool = True) -> list[int]:
        if not self.path:
            return [self.pk] if include_self else []
        qs = OrganizationalUnit.objects.filter(path__startswith=self.path).values_list("id", flat=True)
        ids = list(qs)
        if not include_self and self.pk in ids:
            ids.remove(self.pk)
        return ids


class Action(models.Model):
    """Catálogo de ações que um Cargo pode autorizar (Criar, Editar, Aprovar, ...)."""

    code = models.CharField("Código", max_length=30, unique=True)
    label = models.CharField("Rótulo", max_length=100)

    class Meta:
        verbose_name = "Ação"
        verbose_name_plural = "Ações"
        ordering = ["label"]

    def __str__(self):
        return self.label


class Role(models.Model):
    """Cargo (RBAC) — define apenas quais ações são permitidas, nunca visibilidade."""

    name = models.CharField("Nome", max_length=100)
    code = models.CharField("Código", max_length=50, unique=True)
    actions = models.ManyToManyField(Action, related_name="roles", blank=True, verbose_name="Ações permitidas")
    is_active = models.BooleanField("Ativo", default=True)

    created_at = models.DateTimeField("Criado em", auto_now_add=True)
    updated_at = models.DateTimeField("Atualizado em", auto_now=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
        related_name="roles_created", verbose_name="Criado por",
    )
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
        related_name="roles_updated", verbose_name="Atualizado por",
    )

    class Meta:
        verbose_name = "Cargo"
        verbose_name_plural = "Cargos"
        ordering = ["name"]

    def __str__(self):
        return self.name

    def has_action(self, action_code: str) -> bool:
        return self.actions.filter(code=action_code).exists()


class Membership(models.Model):
    """Vínculo de um usuário a uma unidade organizacional, com um cargo.

    Nunca é apagado (hard delete) — encerrar um vínculo seta `end_date`/`is_active=False`.
    A própria tabela é o histórico de movimentações: um usuário pode ter várias linhas
    ativas simultaneamente (participação em múltiplas unidades) e várias linhas encerradas
    no passado (histórico de mudanças de cargo/unidade).
    """

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="memberships", verbose_name="Usuário",
    )
    organizational_unit = models.ForeignKey(
        OrganizationalUnit, on_delete=models.CASCADE, related_name="memberships", verbose_name="Unidade",
    )
    role = models.ForeignKey(
        Role, on_delete=models.PROTECT, related_name="memberships", verbose_name="Cargo",
    )
    function_title = models.CharField("Função", max_length=100, blank=True)
    start_date = models.DateField("Início", default=timezone.now)
    end_date = models.DateField("Fim", null=True, blank=True)
    is_active = models.BooleanField("Ativo", default=True)

    created_at = models.DateTimeField("Criado em", auto_now_add=True)
    updated_at = models.DateTimeField("Atualizado em", auto_now=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
        related_name="memberships_created", verbose_name="Criado por",
    )
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
        related_name="memberships_updated", verbose_name="Atualizado por",
    )

    class Meta:
        verbose_name = "Vínculo"
        verbose_name_plural = "Vínculos (Equipe)"
        ordering = ["-start_date"]
        indexes = [
            models.Index(fields=["user", "organizational_unit", "is_active"], name="membership_user_unit_idx"),
            models.Index(fields=["organizational_unit", "is_active"], name="membership_unit_active_idx"),
        ]

    def __str__(self):
        return f"{self.user} @ {self.organizational_unit} ({self.role})"

    def close(self, *, end_date=None, updated_by=None):
        self.end_date = end_date or timezone.now().date()
        self.is_active = False
        if updated_by is not None:
            self.updated_by = updated_by
        self.save(update_fields=["end_date", "is_active", "updated_by", "updated_at"])


class AccessGrant(models.Model):
    """Compartilhamento de acesso a um recurso (Processo, Contrato, Coordenação, Gerência, Diretoria, ...).

    O recurso é referenciado via GenericForeignKey para não exigir migration nova a
    cada novo tipo de recurso compartilhável. O alvo do compartilhamento é exatamente
    um entre usuário, cargo ou unidade organizacional — nunca mais de um, nunca nenhum.
    """

    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE, related_name="+")
    object_id = models.PositiveBigIntegerField()
    resource = GenericForeignKey("content_type", "object_id")

    target_user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, null=True, blank=True,
        related_name="access_grants_received", verbose_name="Usuário",
    )
    target_role = models.ForeignKey(
        Role, on_delete=models.CASCADE, null=True, blank=True,
        related_name="access_grants", verbose_name="Cargo",
    )
    target_organizational_unit = models.ForeignKey(
        OrganizationalUnit, on_delete=models.CASCADE, null=True, blank=True,
        related_name="access_grants", verbose_name="Unidade",
    )

    permission_level = models.ForeignKey(
        Action, on_delete=models.PROTECT, related_name="access_grants", verbose_name="Permissão",
    )
    start_date = models.DateField("Início", default=timezone.now)
    end_date = models.DateField("Fim")
    reason = models.TextField("Motivo")

    granted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True,
        related_name="access_grants_given", verbose_name="Concedido por",
    )
    revoked_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
        related_name="access_grants_revoked", verbose_name="Revogado por",
    )
    revoked_at = models.DateTimeField("Revogado em", null=True, blank=True)
    is_active = models.BooleanField("Ativo", default=True)

    created_at = models.DateTimeField("Criado em", auto_now_add=True)
    updated_at = models.DateTimeField("Atualizado em", auto_now=True)

    class Meta:
        verbose_name = "Compartilhamento de Acesso"
        verbose_name_plural = "Compartilhamentos de Acesso"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["content_type", "object_id", "is_active", "end_date"], name="grant_resource_idx"),
            models.Index(fields=["target_user", "is_active"], name="grant_target_user_idx"),
            models.Index(fields=["target_role", "is_active"], name="grant_target_role_idx"),
            models.Index(fields=["target_organizational_unit", "is_active"], name="grant_target_unit_idx"),
        ]

    def __str__(self):
        return f"Grant #{self.pk} -> {self.resource!r}"

    def clean(self):
        targets = [self.target_user_id, self.target_role_id, self.target_organizational_unit_id]
        set_count = sum(1 for t in targets if t is not None)
        if set_count != 1:
            raise ValidationError(
                "Um AccessGrant deve ter exatamente um alvo: usuário, cargo ou unidade organizacional."
            )
        if self.end_date and self.start_date and self.end_date < self.start_date:
            raise ValidationError("Data fim não pode ser anterior à data início.")

    @property
    def is_in_effect(self) -> bool:
        today = timezone.now().date()
        return bool(self.is_active and self.start_date <= today <= self.end_date)

    def revoke(self, *, revoked_by=None):
        self.is_active = False
        self.revoked_by = revoked_by
        self.revoked_at = timezone.now()
        self.save(update_fields=["is_active", "revoked_by", "revoked_at", "updated_at"])


class AuditLog(models.Model):
    """Registro de auditoria append-only: quem fez o quê, quando, e por quê."""

    GRANT_CREATED = "GRANT_CREATED"
    GRANT_REVOKED = "GRANT_REVOKED"
    GRANT_EXPIRED = "GRANT_EXPIRED"
    ROLE_CHANGED = "ROLE_CHANGED"
    MEMBERSHIP_CREATED = "MEMBERSHIP_CREATED"
    MEMBERSHIP_ENDED = "MEMBERSHIP_ENDED"
    UNIT_MOVED = "UNIT_MOVED"
    ACTION_CHOICES = [
        (GRANT_CREATED, "Compartilhamento criado"),
        (GRANT_REVOKED, "Compartilhamento revogado"),
        (GRANT_EXPIRED, "Compartilhamento expirado"),
        (ROLE_CHANGED, "Cargo alterado"),
        (MEMBERSHIP_CREATED, "Vínculo criado"),
        (MEMBERSHIP_ENDED, "Vínculo encerrado"),
        (UNIT_MOVED, "Unidade reorganizada"),
    ]

    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name="audit_logs", verbose_name="Autor",
    )
    action = models.CharField("Ação", max_length=30, choices=ACTION_CHOICES)

    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE, null=True, blank=True, related_name="+")
    object_id = models.PositiveBigIntegerField(null=True, blank=True)
    target = GenericForeignKey("content_type", "object_id")

    before = models.JSONField("Antes", null=True, blank=True)
    after = models.JSONField("Depois", null=True, blank=True)
    reason = models.TextField("Motivo", blank=True)
    created_at = models.DateTimeField("Criado em", auto_now_add=True)

    class Meta:
        verbose_name = "Log de Auditoria"
        verbose_name_plural = "Logs de Auditoria"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["content_type", "object_id", "created_at"], name="audit_target_idx"),
            models.Index(fields=["actor", "created_at"], name="audit_actor_idx"),
        ]

    def __str__(self):
        return f"[{self.created_at}] {self.actor} {self.action}"
