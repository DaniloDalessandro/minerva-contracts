"""
Exceções customizadas para o módulo de Auxílios
"""
from rest_framework.exceptions import ValidationError


class AidOperationException(ValidationError):
    """Exceção genérica para operações de auxílio"""

    def __init__(self, message):
        super().__init__({"detail": message})


class InsufficientAidBudgetException(ValidationError):
    """Exceção lançada quando não há saldo no orçamento para criar o auxílio"""

    def __init__(self, available, required, message=None):
        if message is None:
            message = (
                f"Operação não permitida: o valor do auxílio (R$ {required:.2f}) "
                f"excede o saldo disponível do orçamento (R$ {available:.2f})."
            )
        super().__init__({"detail": message})
