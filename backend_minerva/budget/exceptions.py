"""
Exceções customizadas para o módulo de Orçamento
"""
from rest_framework.exceptions import ValidationError


class InsufficientBudgetException(ValidationError):
    """Exceção lançada quando o orçamento não tem saldo suficiente"""

    def __init__(self, available, required, message=None):
        if message is None:
            message = (
                f"Operação não permitida: o valor informado (R$ {required:.2f}) "
                f"excede o saldo disponível do orçamento (R$ {available:.2f})."
            )
        super().__init__({"detail": message})


class NegativeBudgetException(ValidationError):
    """Exceção lançada quando uma operação resultaria em saldo negativo"""

    def __init__(self, message=None):
        if message is None:
            message = "Operação não permitida: não é possível deixar o orçamento com saldo negativo."
        super().__init__({"detail": message})


class BudgetOperationException(ValidationError):
    """Exceção genérica para operações de orçamento"""

    def __init__(self, message):
        super().__init__({"detail": message})
