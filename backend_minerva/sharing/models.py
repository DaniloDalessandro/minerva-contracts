from django.db import models
from django.utils import timezone
from django.contrib.auth import get_user_model

User = get_user_model()


class ResourceShare(models.Model):
    RESOURCE_TYPE_CHOICES = [
        ('BUDGET', 'Orçamento'),
        ('BUDGET_LINE', 'Linha Orçamentária'),
        ('CONTRACT', 'Contrato'),
    ]

    PERMISSION_TYPE_CHOICES = [
        ('VIEW', 'Somente Visualização'),
        ('CREATE_BUDGET_LINES', 'Pode Criar Linhas Orçamentárias'),
        ('CREATE_CONTRACTS', 'Pode Criar Contratos'),
    ]

    STATUS_CHOICES = [
        ('PENDING', 'Pendente'),
        ('ACCEPTED', 'Aceito'),
        ('REVOKED', 'Revogado'),
        ('EXPIRED', 'Expirado'),
    ]

    resource_type = models.CharField(
        max_length=20, choices=RESOURCE_TYPE_CHOICES, verbose_name='Tipo de Recurso'
    )
    resource_id = models.PositiveIntegerField(verbose_name='ID do Recurso')
    resource_name = models.CharField(max_length=255, blank=True, verbose_name='Nome do Recurso')

    owner = models.ForeignKey(
        User, on_delete=models.CASCADE,
        related_name='shares_given', verbose_name='Proprietário'
    )
    invited_user = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='shares_received', verbose_name='Usuário Convidado'
    )
    invited_email = models.EmailField(verbose_name='E-mail do Convidado')

    permission_type = models.CharField(
        max_length=25, choices=PERMISSION_TYPE_CHOICES, default='VIEW',
        verbose_name='Tipo de Permissão'
    )
    status = models.CharField(
        max_length=10, choices=STATUS_CHOICES, default='PENDING', verbose_name='Status'
    )
    message = models.TextField(blank=True, verbose_name='Mensagem')

    accepted_at = models.DateTimeField(null=True, blank=True, verbose_name='Aceito em')
    expires_at = models.DateTimeField(null=True, blank=True, verbose_name='Expira em')

    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Criado em')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Atualizado em')
    created_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='shares_created_by', verbose_name='Criado por'
    )
    updated_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='shares_updated_by', verbose_name='Atualizado por'
    )

    class Meta:
        verbose_name = 'Compartilhamento'
        verbose_name_plural = 'Compartilhamentos'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['resource_type', 'resource_id', 'status'], name='share_resource_status_idx'),
            models.Index(fields=['invited_email', 'status'], name='share_email_status_idx'),
            models.Index(fields=['owner', 'status'], name='share_owner_status_idx'),
            models.Index(fields=['invited_user', 'status'], name='share_invited_user_idx'),
        ]

    def __str__(self):
        return f"Share {self.resource_type}#{self.resource_id} → {self.invited_email} ({self.status})"

    @property
    def is_active(self):
        return self.status == 'ACCEPTED'

    def revoke(self, updated_by=None):
        self.status = 'REVOKED'
        self.updated_by = updated_by
        self.save(update_fields=['status', 'updated_by', 'updated_at'])


class ShareNotification(models.Model):
    """Notificação interna de compartilhamento."""

    NOTIFICATION_TYPE_CHOICES = [
        ('SHARE_RECEIVED', 'Compartilhamento recebido'),
        ('SHARE_REVOKED', 'Compartilhamento revogado'),
    ]

    user = models.ForeignKey(
        User, on_delete=models.CASCADE,
        related_name='share_notifications', verbose_name='Usuário'
    )
    share = models.ForeignKey(
        ResourceShare, on_delete=models.CASCADE,
        related_name='share_notifications', verbose_name='Compartilhamento'
    )
    notification_type = models.CharField(
        max_length=20, choices=NOTIFICATION_TYPE_CHOICES, verbose_name='Tipo'
    )
    title = models.CharField(max_length=255, verbose_name='Título')
    message = models.TextField(verbose_name='Mensagem')
    is_read = models.BooleanField(default=False, verbose_name='Lida')
    read_at = models.DateTimeField(null=True, blank=True, verbose_name='Lida em')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Criado em')

    class Meta:
        verbose_name = 'Notificação de Compartilhamento'
        verbose_name_plural = 'Notificações de Compartilhamento'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'is_read', 'created_at'], name='share_notif_user_read_idx'),
        ]

    def mark_read(self):
        if not self.is_read:
            self.is_read = True
            self.read_at = timezone.now()
            self.save(update_fields=['is_read', 'read_at'])

    def __str__(self):
        return f"{self.get_notification_type_display()} → {self.user.email}"
