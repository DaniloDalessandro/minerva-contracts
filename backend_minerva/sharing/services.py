import logging
from django.conf import settings
from django.core.mail import send_mail
from django.contrib.auth import get_user_model

logger = logging.getLogger(__name__)
User = get_user_model()

RESOURCE_TYPE_LABELS = {
    'BUDGET': 'orçamento',
    'BUDGET_LINE': 'linha orçamentária',
    'CONTRACT': 'contrato',
}

PERMISSION_LABELS = {
    'VIEW': 'Somente Visualização',
    'CREATE_BUDGET_LINES': 'Pode Criar Linhas Orçamentárias',
    'CREATE_CONTRACTS': 'Pode Criar Contratos',
}


def get_resource_name(resource_type: str, resource_id: int) -> str:
    try:
        if resource_type == 'BUDGET':
            from budget.models import Budget
            obj = Budget.objects.select_related('management_center').get(pk=resource_id)
            return str(obj)
        elif resource_type == 'BUDGET_LINE':
            from budgetline.models import BudgetLine
            obj = BudgetLine.objects.get(pk=resource_id)
            return obj.summary_description or obj.object or f"Linha #{resource_id}"
        elif resource_type == 'CONTRACT':
            from contract.models import Contract
            obj = Contract.objects.get(pk=resource_id)
            return f"{obj.protocol_number} — {obj.description}"
    except Exception:
        pass
    return f"{resource_type} #{resource_id}"


def resolve_invited_user(email: str):
    """Retorna o User se existir no sistema, None caso contrário."""
    try:
        return User.objects.get(email=email)
    except User.DoesNotExist:
        return None


def send_share_email(share):
    """Envia e-mail de compartilhamento para o destinatário."""
    frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')
    resource_label = RESOURCE_TYPE_LABELS.get(share.resource_type, share.resource_type)
    permission_label = PERMISSION_LABELS.get(share.permission_type, share.permission_type)

    owner_name = (
        share.owner.employee.full_name
        if share.owner.employee_id and hasattr(share.owner, 'employee')
        else share.owner.email
    )

    resource_url = {
        'BUDGET': f"{frontend_url}/orcamento",
        'BUDGET_LINE': f"{frontend_url}/linhas-orcamentarias",
        'CONTRACT': f"{frontend_url}/contratos",
    }.get(share.resource_type, frontend_url)

    subject = f"[Minerva] {owner_name} compartilhou um {resource_label} com você"
    body = (
        f"Olá!\n\n"
        f"{owner_name} compartilhou o {resource_label} \"{share.resource_name}\" com você.\n\n"
        f"Permissão concedida: {permission_label}\n\n"
        + (f"Mensagem: {share.message}\n\n" if share.message else "")
        + f"Acesse o sistema para visualizar: {resource_url}\n\n"
        f"Você pode gerenciar seus compartilhamentos em: {frontend_url}/convites\n\n"
        f"Sistema Minerva"
    )

    try:
        send_mail(subject, body, settings.DEFAULT_FROM_EMAIL, [share.invited_email], fail_silently=False)
        logger.info("E-mail de compartilhamento enviado para %s", share.invited_email)
    except Exception as exc:
        logger.error("Falha ao enviar e-mail de compartilhamento para %s: %s", share.invited_email, exc)


def create_share_notification(share, notification_type='SHARE_RECEIVED'):
    """Cria notificação interna para o usuário convidado."""
    from .models import ShareNotification

    if not share.invited_user:
        return None

    resource_label = RESOURCE_TYPE_LABELS.get(share.resource_type, share.resource_type)
    owner_name = (
        share.owner.employee.full_name
        if share.owner.employee_id and hasattr(share.owner, 'employee')
        else share.owner.email
    )

    if notification_type == 'SHARE_RECEIVED':
        title = f"{owner_name} compartilhou um {resource_label} com você"
        message = f'"{share.resource_name}" foi compartilhado com permissão: {PERMISSION_LABELS.get(share.permission_type, share.permission_type)}.'
    else:
        title = f"Acesso revogado: {resource_label}"
        message = f'Seu acesso ao {resource_label} "{share.resource_name}" foi revogado por {owner_name}.'

    return ShareNotification.objects.create(
        user=share.invited_user,
        share=share,
        notification_type=notification_type,
        title=title,
        message=message,
    )
