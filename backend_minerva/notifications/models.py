from django.db import models
from django.utils import timezone


class ContractNotification(models.Model):
    NOTIFICATION_TYPES = [
        ('EXPIRATION_30_DAYS', 'Vencimento em 30 dias'),
    ]

    contract = models.ForeignKey(
        'contract.Contract',
        on_delete=models.CASCADE,
        related_name='notifications',
        verbose_name='Contrato',
    )
    notification_type = models.CharField(
        max_length=30,
        choices=NOTIFICATION_TYPES,
        default='EXPIRATION_30_DAYS',
        verbose_name='Tipo',
    )

    cycle_month = models.DateField(verbose_name='Ciclo (mês)')

    is_read = models.BooleanField(default=False, verbose_name='Lida')
    read_at = models.DateTimeField(null=True, blank=True, verbose_name='Lida em')

    email_sent_at = models.DateTimeField(null=True, blank=True, verbose_name='E-mail enviado em')
    email_recipients = models.JSONField(default=list, blank=True, verbose_name='Destinatários do e-mail')
    email_error = models.TextField(blank=True, verbose_name='Erro de e-mail')

    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Criado em')

    class Meta:
        verbose_name = 'Notificação de Contrato'
        verbose_name_plural = 'Notificações de Contrato'
        ordering = ['-created_at']

        unique_together = [('contract', 'notification_type', 'cycle_month')]
        indexes = [
            models.Index(fields=['cycle_month']),
            models.Index(fields=['is_read', 'created_at']),
        ]

    def mark_read(self):
        if not self.is_read:
            self.is_read = True
            self.read_at = timezone.now()
            self.save(update_fields=['is_read', 'read_at'])

    def __str__(self):
        return f"{self.contract.protocol_number} — {self.get_notification_type_display()} ({self.cycle_month})"
