"""
Signals para atualização automática de valores relacionados
"""
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from .models import Contract


@receiver(post_save, sender=Contract)
def update_budget_line_on_contract_save(sender, instance, created, **kwargs):
    """
    Após salvar um contrato, atualizar a linha orçamentária
    """
    if hasattr(instance, '_skip_signal'):
        return

    if instance.budget_line:
        instance.budget_line.update_available_amount()
        if instance.budget_line.budget:
            instance.budget_line.budget.update_calculated_amounts()


@receiver(post_delete, sender=Contract)
def update_budget_line_on_contract_delete(sender, instance, **kwargs):
    """
    Após deletar um contrato, devolver o valor à linha orçamentária
    """
    if instance.budget_line:
        instance.budget_line.update_available_amount()
        if instance.budget_line.budget:
            instance.budget_line.budget.update_calculated_amounts()
