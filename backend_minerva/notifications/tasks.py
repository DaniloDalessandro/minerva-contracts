import logging
from celery import shared_task
from django.utils import timezone
from datetime import timedelta, date

logger = logging.getLogger(__name__)


@shared_task(name='notifications.check_expiring_contracts')
def check_expiring_contracts():
    """
    Tarefa Celery que verifica contratos vencendo em 30 dias.
    Cria notificação e envia e-mail se ainda não foi feito neste ciclo mensal.

    Deve ser agendada para rodar diariamente (ex: todo dia às 08:00).
    """
    from contract.models import Contract
    from .models import ContractNotification
    from .services import send_expiration_email

    today = timezone.now().date()
    target_date = today + timedelta(days=30)

    cycle_month = date(today.year, today.month, 1)

    contracts = Contract.objects.filter(
        expiration_date=target_date,
        status='ATIVO',
    ).select_related('main_inspector', 'substitute_inspector')

    created_count = 0
    email_count = 0

    for contract in contracts:
        notification, created = ContractNotification.objects.get_or_create(
            contract=contract,
            notification_type='EXPIRATION_30_DAYS',
            cycle_month=cycle_month,
        )

        if created:
            created_count += 1
            logger.info(
                "Notificação criada para contrato %s (vence em %s).",
                contract.protocol_number, contract.expiration_date,
            )


        if not notification.email_sent_at:
            sent_to = send_expiration_email(notification)
            if sent_to:
                notification.email_sent_at = timezone.now()
                notification.email_recipients = sent_to
                notification.save(update_fields=['email_sent_at', 'email_recipients'])
                email_count += 1

    logger.info(
        "check_expiring_contracts: %d notificações criadas, %d e-mails enviados.",
        created_count, email_count,
    )
    return {'created': created_count, 'emails_sent': email_count}
