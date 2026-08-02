"""
Testes para o sistema de notificações de vencimento de contratos.
"""
from datetime import date, timedelta
from unittest.mock import patch, MagicMock

from django.test import TestCase
from django.utils import timezone

from accounts.models import User
from employee.models import Employee
from sector.models import Direction, Management, Coordination
from budget.models import Budget
from budgetline.models import BudgetLine
from center.models import ManagementCenter
from contract.models import Contract


def _make_user(email='test@minerva.local'):
    return User.objects.create_superuser(
        email=email, password='testpass123', first_name='Test', last_name='User'
    )


def _make_employee(user, email='fiscal@minerva.local', name='Fiscal Teste'):
    direction = Direction.objects.create(name='Dir Teste')
    management = Management.objects.create(name='Ger Teste', direction=direction)
    coordination = Coordination.objects.create(name='Coord Teste', management=management)
    return Employee.objects.create(
        full_name=name,
        email=email,
        cpf='00000000000',
        direction=direction,
        management=management,
        coordination=coordination,
    )


def _make_contract(user, employee, days_until_expiration=30):
    mc = ManagementCenter.objects.create(name='MC Teste')
    from decimal import Decimal
    budget = Budget.objects.create(
        year=2026,
        category='CAPEX',
        management_center=mc,
        total_amount=100000,
        available_amount=100000,
        created_by=user,
        updated_by=user,
    )
    bl = BudgetLine.objects.create(
        budget=budget,
        expense_type='Base Principal',
        probable_procurement_type='FUNDO FIXO',
        budgeted_amount=10000,
    )
    expiration = date.today() + timedelta(days=days_until_expiration)
    contract = Contract(
        budget_line=bl,
        main_inspector=employee,
        substitute_inspector=employee,
        payment_nature='MENSAL',
        description=f'Contrato de Teste {days_until_expiration}d',
        original_value=1000,
        start_date=date.today(),
        expiration_date=expiration,
        created_by=user,
        updated_by=user,
    )
    contract.save()
    return contract


class ContractNotificationModelTest(TestCase):
    def setUp(self):
        self.user = _make_user()
        self.employee = _make_employee(self.user)
        self.contract = _make_contract(self.user, self.employee, days_until_expiration=30)

    def test_create_notification(self):
        from notifications.models import ContractNotification
        today = date.today()
        cycle = date(today.year, today.month, 1)
        n = ContractNotification.objects.create(
            contract=self.contract,
            notification_type='EXPIRATION_30_DAYS',
            cycle_month=cycle,
        )
        self.assertFalse(n.is_read)
        self.assertIsNone(n.email_sent_at)

    def test_unique_per_cycle(self):
        from notifications.models import ContractNotification
        from django.db import IntegrityError
        today = date.today()
        cycle = date(today.year, today.month, 1)
        ContractNotification.objects.create(
            contract=self.contract,
            notification_type='EXPIRATION_30_DAYS',
            cycle_month=cycle,
        )
        with self.assertRaises(IntegrityError):
            ContractNotification.objects.create(
                contract=self.contract,
                notification_type='EXPIRATION_30_DAYS',
                cycle_month=cycle,
            )

    def test_mark_read(self):
        from notifications.models import ContractNotification
        today = date.today()
        cycle = date(today.year, today.month, 1)
        n = ContractNotification.objects.create(
            contract=self.contract,
            notification_type='EXPIRATION_30_DAYS',
            cycle_month=cycle,
        )
        n.mark_read()
        n.refresh_from_db()
        self.assertTrue(n.is_read)
        self.assertIsNotNone(n.read_at)


class CheckExpiringContractsTaskTest(TestCase):
    def setUp(self):
        self.user = _make_user(email='task_test@minerva.local')
        self.employee = _make_employee(self.user, email='fiscal2@minerva.local', name='Fiscal 2')

    def test_task_creates_notification_for_expiring_contract(self):
        from notifications.tasks import check_expiring_contracts
        from notifications.models import ContractNotification

        _make_contract(self.user, self.employee, days_until_expiration=30)
        result = check_expiring_contracts()

        self.assertEqual(result['created'], 1)
        self.assertEqual(ContractNotification.objects.count(), 1)

    def test_task_no_duplicate_in_same_cycle(self):
        from notifications.tasks import check_expiring_contracts
        from notifications.models import ContractNotification

        _make_contract(self.user, self.employee, days_until_expiration=30)
        check_expiring_contracts()
        result = check_expiring_contracts()


        self.assertEqual(result['created'], 0)
        self.assertEqual(ContractNotification.objects.count(), 1)

    def test_task_ignores_non_expiring(self):
        from notifications.tasks import check_expiring_contracts
        from notifications.models import ContractNotification


        _make_contract(self.user, self.employee, days_until_expiration=60)
        result = check_expiring_contracts()

        self.assertEqual(result['created'], 0)
        self.assertEqual(ContractNotification.objects.count(), 0)


class EmailServiceTest(TestCase):
    def setUp(self):
        self.user = _make_user(email='email_test@minerva.local')
        self.employee = _make_employee(self.user, email='fiscal3@minerva.local', name='Fiscal 3')
        self.contract = _make_contract(self.user, self.employee, days_until_expiration=30)

    @patch('notifications.services.send_mail')
    def test_send_expiration_email_success(self, mock_send):
        from notifications.models import ContractNotification
        from notifications.services import send_expiration_email
        from datetime import date

        today = date.today()
        cycle = date(today.year, today.month, 1)
        n = ContractNotification.objects.create(
            contract=self.contract,
            notification_type='EXPIRATION_30_DAYS',
            cycle_month=cycle,
        )

        sent_to = send_expiration_email(n)

        self.assertIn('fiscal3@minerva.local', sent_to)
        mock_send.assert_called()

    @patch('notifications.services.send_mail', side_effect=Exception('SMTP error'))
    def test_send_expiration_email_error_does_not_raise(self, mock_send):
        from notifications.models import ContractNotification
        from notifications.services import send_expiration_email
        from datetime import date

        today = date.today()
        cycle = date(today.year, today.month, 1)
        n = ContractNotification.objects.create(
            contract=self.contract,
            notification_type='EXPIRATION_30_DAYS',
            cycle_month=cycle,
        )


        sent_to = send_expiration_email(n)
        self.assertEqual(sent_to, [])
        n.refresh_from_db()
        self.assertIn('SMTP error', n.email_error)
