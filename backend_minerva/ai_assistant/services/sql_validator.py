"""
Validação robusta de SQL usando sqlglot para parsing AST.
Substitui a validação por regex do SQLInterpreterService quando sqlglot está disponível.
"""
import logging
import re
from dataclasses import dataclass, field
from typing import Dict, List, Optional

logger = logging.getLogger(__name__)

try:
    import sqlglot
    import sqlglot.expressions as exp
    SQLGLOT_AVAILABLE = True
except ImportError:
    SQLGLOT_AVAILABLE = False
    logger.warning("sqlglot não instalado — usando validação SQL por regex como fallback")


@dataclass
class ValidationResult:
    valid: bool
    errors: List[str] = field(default_factory=list)
    warnings: List[str] = field(default_factory=list)
    normalized_sql: str = ""
    tables_found: List[str] = field(default_factory=list)


class SQLValidator:
    """
    Valida consultas SQL de forma robusta.
    Usa sqlglot para parsing AST quando disponível; caso contrário faz fallback
    para a validação por regex equivalente ao comportamento original.
    """

    DANGEROUS_KEYWORDS = {
        'DROP', 'DELETE', 'INSERT', 'UPDATE', 'CREATE', 'ALTER', 'TRUNCATE',
        'GRANT', 'REVOKE', 'EXECUTE', 'EXEC', 'pg_read_file', 'lo_export', 'COPY',
    }

    def __init__(self, safe_tables: set, known_columns: Dict[str, List[str]] = None):
        self.safe_tables = {t.lower() for t in safe_tables}
        self.known_columns: Dict[str, List[str]] = {
            t.lower(): [c.lower() for c in cols]
            for t, cols in (known_columns or {}).items()
        }

    def validate(self, sql: str) -> ValidationResult:
        """
        Valida a consulta SQL e devolve um ValidationResult detalhado.
        Quando sqlglot estiver disponível usa parsing AST; caso contrário usa regex.
        """
        if not sql or not sql.strip():
            return ValidationResult(valid=False, errors=["Consulta SQL vazia"])

        if SQLGLOT_AVAILABLE:
            return self._validate_with_sqlglot(sql)
        return self._validate_with_regex(sql)



    def _validate_with_sqlglot(self, sql: str) -> ValidationResult:
        result = ValidationResult(valid=True, normalized_sql=sql)


        try:
            statements = sqlglot.parse(sql, dialect="postgres", error_level=sqlglot.ErrorLevel.WARN)
        except Exception as exc:
            result.valid = False
            result.errors.append(f"Erro de parsing SQL: {exc}")
            return result

        if not statements or statements[0] is None:
            result.valid = False
            result.errors.append("Nenhuma instrução SQL reconhecida")
            return result

        # Bloqueia múltiplas instruções (tentativa de injeção)
        valid_statements = [s for s in statements if s is not None]
        if len(valid_statements) > 1:
            result.valid = False
            result.errors.append("Múltiplas instruções SQL não são permitidas")
            return result

        statement = statements[0]

        if not isinstance(statement, exp.Select):
            stmt_type = type(statement).__name__.upper()
            result.valid = False
            result.errors.append(
                f"Instrução '{stmt_type}' não é permitida. Apenas SELECT é aceito."
            )
            return result


        dangerous_found = self._find_dangerous_nodes(statement)
        if dangerous_found:
            result.valid = False
            for item in dangerous_found:
                result.errors.append(f"Operação não permitida detectada: {item}")
            return result


        tables_found = self._extract_tables_from_ast(statement)
        result.tables_found = tables_found


        for table in tables_found:
            if table not in self.safe_tables:
                result.valid = False
                result.errors.append(
                    f"Acesso à tabela '{table}' não é permitido"
                )

        if not result.valid:
            return result


        if self.known_columns:
            self._check_columns_warnings(statement, result)


        try:
            result.normalized_sql = statement.sql(dialect="postgres", pretty=False)
        except Exception:
            result.normalized_sql = sql

        return result

    def _find_dangerous_nodes(self, statement) -> List[str]:
        """Percorre o AST buscando nós de operações perigosas."""
        found = []


        sql_upper = statement.sql(dialect="postgres").upper()
        for kw in self.DANGEROUS_KEYWORDS:

            pattern = r'\b' + re.escape(kw) + r'\b'
            if re.search(pattern, sql_upper):
                found.append(kw)


        # Note: sqlglot class names vary by version — use getattr to be safe
        dml_ddl_types = tuple(filter(None, [
            exp.Insert, exp.Update, exp.Delete, exp.Drop, exp.Create,
            getattr(exp, 'AlterTable', None) or getattr(exp, 'Alter', None),
            getattr(exp, 'TruncateTable', None),
            getattr(exp, 'Grant', None),
            getattr(exp, 'Revoke', None),
        ]))
        for node in statement.walk():
            if isinstance(node, dml_ddl_types):
                found.append(type(node).__name__.upper())

        return list(set(found))

    def _extract_tables_from_ast(self, statement) -> List[str]:
        """Extrai todos os nomes de tabela do AST incluindo CTEs e subqueries."""
        tables = set()

        for node in statement.walk():
            if isinstance(node, exp.Table):
                name = node.name
                if name:
                    tables.add(name.lower())

        return list(tables)

    def _check_columns_warnings(self, statement, result: ValidationResult) -> None:
        """Adiciona warnings para colunas não reconhecidas (não invalida)."""
        for node in statement.walk():
            if isinstance(node, exp.Column):
                col_name = node.name
                table_alias = node.table
                if col_name and table_alias and table_alias.lower() in self.known_columns:
                    cols = self.known_columns[table_alias.lower()]
                    if col_name.lower() not in cols:
                        result.warnings.append(
                            f"Coluna '{col_name}' não reconhecida na tabela '{table_alias}'"
                        )



    def _validate_with_regex(self, sql: str) -> ValidationResult:
        result = ValidationResult(valid=True, normalized_sql=sql)

        sql_upper = sql.upper().strip()

        if not sql_upper.startswith('SELECT'):
            result.valid = False
            result.errors.append("Apenas consultas SELECT são permitidas")
            return result

        for kw in self.DANGEROUS_KEYWORDS:
            pattern = r'\b' + re.escape(kw) + r'\b'
            if re.search(pattern, sql_upper):
                result.valid = False
                result.errors.append(f"Operação não permitida detectada: {kw}")

        if not result.valid:
            return result

        tables_found = self._extract_tables_regex(sql)
        result.tables_found = tables_found

        for table in tables_found:
            if table not in self.safe_tables:
                result.valid = False
                result.errors.append(f"Acesso à tabela '{table}' não é permitido")

        return result

    @staticmethod
    def _extract_tables_regex(sql: str) -> List[str]:
        sql_clean = re.sub(r'--.*?\n', ' ', sql)
        sql_clean = re.sub(r'/\*.*?\*/', ' ', sql_clean, flags=re.DOTALL)
        sql_clean = re.sub(r"'[^']*'", "''", sql_clean)
        sql_clean = re.sub(r'"[^"]*"', '""', sql_clean)

        pattern = r'\b(?:FROM|JOIN)\s+([a-zA-Z_][a-zA-Z0-9_]*)'
        matches = re.findall(pattern, sql_clean, re.IGNORECASE)
        return [m.lower() for m in matches]



    def _explain_dry_run(self, sql: str) -> Optional[str]:
        """
        Tenta executar EXPLAIN no banco para validação adicional.
        Retorna None em caso de sucesso, ou a mensagem de erro em caso de falha.
        """
        try:
            from django.db import connection
            with connection.cursor() as cursor:
                cursor.execute(f"EXPLAIN {sql}")
            return None
        except Exception as exc:
            return str(exc)
