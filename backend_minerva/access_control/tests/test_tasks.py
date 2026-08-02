from django.test import TestCase

from access_control.models import AuditLog
from access_control.tasks import expire_access_grants
from .factories import make_grant, make_user, make_unit


class ExpireAccessGrantsTaskTests(TestCase):
    def test_expires_overdue_grants_and_logs_audit_entry(self):
        user = make_user()
        resource = make_unit("Recurso")
        expired_grant = make_grant(resource, target_user=user, days_valid=-1)

        result = expire_access_grants()

        expired_grant.refresh_from_db()
        self.assertFalse(expired_grant.is_active)
        self.assertEqual(result["expired"], 1)
        self.assertTrue(
            AuditLog.objects.filter(action=AuditLog.GRANT_EXPIRED, object_id=expired_grant.object_id).exists()
        )

    def test_does_not_touch_grants_still_in_effect(self):
        user = make_user()
        resource = make_unit("Recurso valido")
        active_grant = make_grant(resource, target_user=user, days_valid=30)

        result = expire_access_grants()

        active_grant.refresh_from_db()
        self.assertTrue(active_grant.is_active)
        self.assertEqual(result["expired"], 0)

    def test_is_a_noop_when_nothing_is_expired(self):
        result = expire_access_grants()
        self.assertEqual(result["expired"], 0)
        self.assertEqual(AuditLog.objects.count(), 0)
