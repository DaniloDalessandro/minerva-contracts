import re
from datetime import datetime, timedelta
from unittest.mock import patch

from django.core import mail
from django.core.cache import cache
from django.contrib.auth.tokens import default_token_generator
from django.test import TestCase, override_settings
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode
from rest_framework.test import APIClient

from accounts.models import User

BASE = '/api/v1/accounts/'


@override_settings(EMAIL_BACKEND='django.core.mail.backends.locmem.EmailBackend')
class PasswordRecoveryTests(TestCase):
    def setUp(self):
        cache.clear()
        self.user = User.objects.create_user(email='qa-recovery@example.invalid', password='Old!Recovery938')
        self.client = APIClient()

    def token_payload(self, password='New!Recovery834'):
        return {'uidb64': urlsafe_base64_encode(force_bytes(self.user.pk)),
                'token': default_token_generator.make_token(self.user), 'password': password}

    def test_email_case_insensitive_and_real_reset_login(self):
        response = self.client.post(BASE + 'password-reset/', {'email': self.user.email.upper()})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].to, [self.user.email])
        match = re.search(r'/reset-password/([^/]+)/([^/]+)/', mail.outbox[0].body)
        self.assertIsNotNone(match)
        uid, token = match.groups()
        payload = {'uidb64': uid, 'token': token, 'password': 'New!Recovery834'}
        self.assertEqual(self.client.post(BASE + 'password-reset-confirm/', payload).status_code, 200)
        self.assertEqual(self.client.post(BASE + 'password-reset-confirm/', payload).status_code, 400)
        self.assertIn(self.client.post(BASE + 'login/', {'email': self.user.email, 'password': 'Old!Recovery938'}).status_code, [400, 401])
        self.assertEqual(self.client.post(BASE + 'login/', {'email': self.user.email, 'password': 'New!Recovery834'}).status_code, 200)

    def test_unknown_and_inactive_email_have_generic_response(self):
        self.user.is_active = False
        self.user.save()
        a = self.client.post(BASE + 'password-reset/', {'email': self.user.email})
        b = self.client.post(BASE + 'password-reset/', {'email': 'unknown@example.invalid'})
        self.assertEqual(a.status_code, 200)
        self.assertEqual(a.data, b.data)
        self.assertEqual(len(mail.outbox), 0)

    def test_weak_password_and_invalid_token_rejected(self):
        self.assertEqual(self.client.post(BASE + 'password-reset-confirm/', self.token_payload('12345678')).status_code, 400)
        payload = self.token_payload()
        payload['token'] = 'invalid'
        self.assertEqual(self.client.post(BASE + 'password-reset-confirm/', payload).status_code, 400)

    def test_token_expires_after_24_hours(self):
        with patch('django.contrib.auth.tokens.PasswordResetTokenGenerator._now', return_value=datetime.now() - timedelta(hours=24, seconds=1)):
            payload = self.token_payload()
        self.assertEqual(self.client.post(BASE + 'password-reset-confirm/', payload).status_code, 400)

    def test_inactive_user_cannot_reset(self):
        payload = self.token_payload()
        self.user.is_active = False
        self.user.save()
        self.assertEqual(self.client.post(BASE + 'password-reset-confirm/', payload).status_code, 400)

    @patch('accounts.views.send_mail', side_effect=RuntimeError('SMTP unavailable'))
    def test_email_failure_is_visible(self, send):
        self.assertEqual(self.client.post(BASE + 'password-reset/', {'email': self.user.email}).status_code, 503)

    @patch('accounts.views.send_mail', return_value=0)
    def test_zero_delivery_is_failure(self, send):
        self.assertEqual(self.client.post(BASE + 'password-reset/', {'email': self.user.email}).status_code, 503)

    def test_request_limit_does_not_block_valid_confirmation(self):
        for _ in range(3):
            self.assertEqual(self.client.post(BASE + 'password-reset/', {'email': self.user.email}).status_code, 200)
        self.assertEqual(self.client.post(BASE + 'password-reset/', {'email': self.user.email}).status_code, 429)
        self.assertEqual(self.client.post(BASE + 'password-reset-confirm/', self.token_payload()).status_code, 200)
