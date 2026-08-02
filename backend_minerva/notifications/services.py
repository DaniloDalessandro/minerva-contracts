import logging
from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone

logger = logging.getLogger(__name__)


def send_expiration_email(notification) -> list[str]:
    """
    Envia e-mail de aviso de vencimento para o fiscal principal
    e fiscal substituto do contrato.

    Retorna lista de e-mails para os quais o envio foi tentado com sucesso.
    Registra erros no log sem propagar exceção para não quebrar o fluxo.
    """
    contract = notification.contract
    recipients = []

    for inspector_field in ('main_inspector', 'substitute_inspector'):
        inspector = getattr(contract, inspector_field, None)
        if inspector and inspector.email:
            recipients.append(inspector.email)


    seen = set()
    unique_recipients = []
    for email in recipients:
        if email not in seen:
            seen.add(email)
            unique_recipients.append(email)

    if not unique_recipients:
        logger.warning(
            "Contrato %s não tem fiscais com e-mail configurado — e-mail não enviado.",
            contract.protocol_number,
        )
        return []

    days_remaining = None
    if contract.expiration_date:
        delta = contract.expiration_date - timezone.now().date()
        days_remaining = delta.days

    subject = f"[Minerva] Contrato {contract.protocol_number} vence em {days_remaining} dias"
    body = (
        f"Olá,\n\n"
        f"Este é um aviso automático do Sistema Minerva.\n\n"
        f"O contrato {contract.protocol_number} — {contract.description} "
        f"vencerá em {days_remaining} dia(s) "
        f"({contract.expiration_date.strftime('%d/%m/%Y')}).\n\n"
        f"Valor atual: R$ {contract.current_value:,.2f}\n"
        f"Status: {contract.status}\n\n"
        f"Acesse o sistema para tomar as providências necessárias.\n\n"
        f"— Sistema Minerva"
    )

    sent_to = []
    errors = []
    for email in unique_recipients:
        try:
            send_mail(
                subject=subject,
                message=body,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[email],
                fail_silently=False,
            )
            sent_to.append(email)
            logger.info(
                "E-mail de vencimento enviado para %s (contrato %s).",
                email, contract.protocol_number,
            )
        except Exception as exc:
            errors.append(f"{email}: {exc}")
            logger.error(
                "Falha ao enviar e-mail para %s (contrato %s): %s",
                email, contract.protocol_number, exc,
            )

    if errors:
        notification.email_error = "; ".join(errors)
        notification.save(update_fields=['email_error'])

    return sent_to
