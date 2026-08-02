"""
Exceções customizadas para o módulo de Contratos
"""
from rest_framework.exceptions import ValidationError


class ContractOperationException(ValidationError):
    """Exceção genérica para operações de contrato"""

    def __init__(self, message):
        super().__init__({"detail": message})


class InsufficientContractBudgetException(ValidationError):
    """Exceção lançada quando não há saldo na linha para criar o contrato"""

    def __init__(self, available, required, message=None):
        if message is None:
            message = (
                f"Operação não permitida: o valor do contrato (R$ {required:.2f}) "
                f"excede o saldo disponível da linha orçamentária (R$ {available:.2f})."
            )
        super().__init__({"detail": message})
