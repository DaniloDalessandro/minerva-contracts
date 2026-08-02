import logging

from celery import shared_task
from django.utils import timezone

logger = logging.getLogger(__name__)


@shared_task(name='access_control.expire_access_grants')
def expire_access_grants():
    """Encerra AccessGrants vencidos e registra o evento em auditoria (Etapa 8).

    `PermissionService` já filtra por `end_date` em tempo de consulta, então o
    acesso deixa de valer imediatamente independente desta tarefa — ela só torna
    a expiração um evento observável/auditável (`is_active=False` + AuditLog),
    em vez de um filtro silencioso. Deve rodar periodicamente (ex: a cada hora).
    """
    from .models import AccessGrant, AuditLog

    today = timezone.now().date()
    expired = AccessGrant.objects.filter(is_active=True, end_date__lt=today)

    expired_count = 0
    for grant in expired.select_related("content_type"):
        AuditLog.objects.create(
            actor=None,
            action=AuditLog.GRANT_EXPIRED,
            content_type=grant.content_type,
            object_id=grant.object_id,
            before={"is_active": True, "end_date": str(grant.end_date)},
            after={"is_active": False},
            reason="Vigência do compartilhamento encerrada automaticamente.",
        )
        expired_count += 1

    updated = expired.update(is_active=False)
    logger.info("expire_access_grants: %d compartilhamentos expirados.", updated)
    return {"expired": expired_count}
