from datetime import date, timedelta
from unittest.mock import patch

from django.core.cache import cache
from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import AccessToken

from accounts.models import User
from employee.models import Employee
from notifications.models import ContractNotification
from notifications.tasks import check_expiring_contracts
from notifications.tests import _make_user, _make_employee, _make_contract

BASE = '/api/v1/notifications/contract-expiration/'


class NotificationAccessTests(TestCase):
    def setUp(self):
        cache.clear()
        self.user = _make_user()
        self.employee = _make_employee(self.user)
        self.user.employee = self.employee
        self.user.save()
        self.contract = _make_contract(self.user, self.employee)
        today = date.today()
        self.notification = ContractNotification.objects.create(contract=self.contract, cycle_month=today.replace(day=1))
        self.other = _make_user(email='second@minerva.local')
        self.outsider = User.objects.create_user(email='outside@minerva.local', password='Test!Pass123')
        self.client = APIClient()

    def test_inspector_can_see_own_notification(self):
        self.user.is_superuser = False
        self.user.is_staff = False
        self.user.save()
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {AccessToken.for_user(self.user)}')
        response = self.client.get(BASE)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['unread_count'], 1)

    def test_outside_scope_cannot_mark_read(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {AccessToken.for_user(self.outsider)}')
        self.assertEqual(self.client.patch(f'{BASE}{self.notification.pk}/mark-read/').status_code, 404)
        self.assertEqual(self.client.get(BASE).data['count'], 0)

    def test_read_state_is_per_user_and_idempotent(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {AccessToken.for_user(self.user)}')
        for _ in range(2):
            self.assertEqual(self.client.patch(f'{BASE}{self.notification.pk}/mark-read/').status_code, 200)
        self.assertEqual(self.client.get(BASE).data['unread_count'], 0)
        self.assertIsNotNone(self.client.get(BASE).data['results'][0]['read_at'])
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {AccessToken.for_user(self.other)}')
        self.assertEqual(self.client.get(BASE).data['unread_count'], 1)

    def test_mark_all_is_scoped_and_per_user(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {AccessToken.for_user(self.outsider)}')
        self.assertEqual(self.client.patch(f'{BASE}mark-all-read/').data['updated'], 0)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {AccessToken.for_user(self.user)}')
        self.assertEqual(self.client.patch(f'{BASE}mark-all-read/').data['updated'], 1)
        self.assertEqual(self.client.patch(f'{BASE}mark-all-read/').data['updated'], 0)
        self.assertEqual(self.client.get(BASE + '?unread=true').data['count'], 0)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {AccessToken.for_user(self.other)}')
        self.assertEqual(self.client.get(BASE).data['unread_count'], 1)

    def test_anonymous_cannot_list_or_mark(self):
        self.assertIn(self.client.get(BASE).status_code, [401, 403])
        self.assertIn(self.client.patch(f'{BASE}{self.notification.pk}/mark-read/').status_code, [401, 403])


class NotificationDeliveryTests(TestCase):
    def setUp(self):
        self.user = _make_user()
        self.employee = _make_employee(self.user)
        self.contract = _make_contract(self.user, self.employee)
        self.substitute = Employee.objects.create(
            full_name='Substituto', email='substitute@minerva.local', cpf='11111111111',
            direction=self.employee.direction, management=self.employee.management,
            coordination=self.employee.coordination,
        )
        self.contract.substitute_inspector = self.substitute
        self.contract.save()

    @patch('notifications.services.send_mail', side_effect=[RuntimeError('SMTP temporarily unavailable'), 1, 1])
    def test_partial_failure_retries_only_missing_recipient(self, send):
        self.assertEqual(check_expiring_contracts()['created'], 1)
        notification = ContractNotification.objects.get()
        self.assertIsNone(notification.email_sent_at)
        self.assertEqual(notification.email_recipients, [self.substitute.email])
        self.assertTrue(notification.email_error)
        self.assertEqual(check_expiring_contracts()['created'], 0)
        notification.refresh_from_db()
        self.assertIsNotNone(notification.email_sent_at)
        self.assertEqual(set(notification.email_recipients), {self.employee.email, self.substitute.email})
        self.assertEqual(notification.email_error, '')
        check_expiring_contracts()
        self.assertEqual(send.call_count, 3)

    @patch('notifications.services.send_mail', return_value=0)
    def test_zero_emails_sent_is_not_reported_as_success(self, send):
        result = check_expiring_contracts()
        self.assertEqual(result['emails_sent'], 0)
        notification = ContractNotification.objects.get()
        self.assertIsNone(notification.email_sent_at)
        self.assertTrue(notification.email_error)
