"""
Exceções customizadas para o módulo de Linha Orçamentária
"""
from rest_framework.exceptions import ValidationError


class InsufficientBudgetLineException(ValidationError):
    """Exceção lançada quando a linha orçamentária não tem saldo suficiente"""

    def __init__(self, available, required, message=None):
        if message is None:
            message = (
                f"Operação não permitida: o valor informado (R$ {required:.2f}) "
                f"excede o saldo disponível da linha orçamentária (R$ {available:.2f})."
            )
        super().__init__({"detail": message})


class NegativeBudgetLineException(ValidationError):
    """Exceção lançada quando uma operação resultaria em saldo negativo na linha"""

    def __init__(self, message=None):
        if message is None:
            message = "Operação não permitida: não é possível deixar a linha orçamentária com saldo negativo."
        super().__init__({"detail": message})


class BudgetLineOperationException(ValidationError):
    """Exceção genérica para operações de linha orçamentária"""

    def __init__(self, message):
        super().__init__({"detail": message})
