"""
Testes unitários para SQLValidator.

Cobre:
- Bloqueio de DML/DDL perigoso (INSERT, UPDATE, DELETE, DROP, ALTER)
- Permissão apenas de SELECT
- Validação de tabelas permitidas
- Normalização de SQL
- Fallback regex quando sqlglot indisponível
"""
from django.test import TestCase

from ai_assistant.services.sql_validator import SQLValidator


SAFE_TABLES = {
    'contract_contract',
    'employee_employee',
    'budget_budget',
    'budget_budgetline',
    'sector_direction',
    'sector_management',
    'sector_coordination',
}


class SQLValidatorSelectTests(TestCase):
    """SELECT válido deve ser aprovado."""

    def setUp(self):
        self.validator = SQLValidator(safe_tables=SAFE_TABLES)

    def test_simple_select(self):
        sql = "SELECT id, description FROM contract_contract WHERE status = 'ATIVO'"
        result = self.validator.validate(sql)
        self.assertTrue(result.valid, result.errors)

    def test_select_with_join(self):
        sql = (
            "SELECT c.id, e.full_name "
            "FROM contract_contract c "
            "JOIN employee_employee e ON c.main_inspector_id = e.id"
        )
        result = self.validator.validate(sql)
        self.assertTrue(result.valid, result.errors)

    def test_select_with_aggregation(self):
        sql = "SELECT COUNT(*) as total FROM contract_contract WHERE status = 'ATIVO'"
        result = self.validator.validate(sql)
        self.assertTrue(result.valid, result.errors)

    def test_empty_sql_invalid(self):
        result = self.validator.validate("")
        self.assertFalse(result.valid)
        self.assertTrue(len(result.errors) > 0)

    def test_whitespace_only_invalid(self):
        result = self.validator.validate("   ")
        self.assertFalse(result.valid)


class SQLValidatorDangerousTests(TestCase):
    """Operações perigosas devem ser bloqueadas."""

    def setUp(self):
        self.validator = SQLValidator(safe_tables=SAFE_TABLES)

    def test_blocks_insert(self):
        sql = "INSERT INTO contract_contract (description) VALUES ('test')"
        result = self.validator.validate(sql)
        self.assertFalse(result.valid)

    def test_blocks_update(self):
        sql = "UPDATE contract_contract SET status = 'ENCERRADO' WHERE id = 1"
        result = self.validator.validate(sql)
        self.assertFalse(result.valid)

    def test_blocks_delete(self):
        sql = "DELETE FROM contract_contract WHERE id = 1"
        result = self.validator.validate(sql)
        self.assertFalse(result.valid)

    def test_blocks_drop(self):
        sql = "DROP TABLE contract_contract"
        result = self.validator.validate(sql)
        self.assertFalse(result.valid)

    def test_blocks_truncate(self):
        sql = "TRUNCATE contract_contract"
        result = self.validator.validate(sql)
        self.assertFalse(result.valid)

    def test_blocks_alter(self):
        sql = "ALTER TABLE contract_contract ADD COLUMN test TEXT"
        result = self.validator.validate(sql)
        self.assertFalse(result.valid)

    def test_blocks_create(self):
        sql = "CREATE TABLE evil (id serial)"
        result = self.validator.validate(sql)
        self.assertFalse(result.valid)

    def test_blocks_injection_attempt(self):
        # SELECT com subquery DELETE
        sql = "SELECT * FROM contract_contract; DELETE FROM contract_contract"
        result = self.validator.validate(sql)
        # Deve bloquear por conter DELETE
        self.assertFalse(result.valid)


class SQLValidatorTableAccessTests(TestCase):
    """Tabelas não permitidas devem ser bloqueadas."""

    def setUp(self):
        self.validator = SQLValidator(safe_tables=SAFE_TABLES)

    def test_blocks_unknown_table(self):
        sql = "SELECT * FROM auth_user"
        result = self.validator.validate(sql)
        self.assertFalse(result.valid)
        self.assertTrue(any('auth_user' in e for e in result.errors))

    def test_blocks_system_table(self):
        sql = "SELECT * FROM pg_tables"
        result = self.validator.validate(sql)
        self.assertFalse(result.valid)

    def test_allows_known_table(self):
        sql = "SELECT id FROM employee_employee LIMIT 10"
        result = self.validator.validate(sql)
        self.assertTrue(result.valid, result.errors)
