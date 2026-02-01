"""
Signals para atualização automática de valores relacionados
"""
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from .models import BudgetLine, BudgetLineMovement


@receiver(post_save, sender=BudgetLine)
def update_budget_on_line_save(sender, instance, created, **kwargs):
    """
    Após salvar uma linha orçamentária, atualizar o orçamento pai
    """
    # Evitar recursão verificando se já está em uma transação de update
    if hasattr(instance, '_skip_signal'):
        return

    if instance.budget:
        instance.budget.update_calculated_amounts()


@receiver(post_delete, sender=BudgetLine)
def update_budget_on_line_delete(sender, instance, **kwargs):
    """
    Após deletar uma linha orçamentária, atualizar o orçamento pai
    """
    if instance.budget:
        instance.budget.update_calculated_amounts()


@receiver(post_save, sender=BudgetLineMovement)
def update_lines_on_movement_save(sender, instance, created, **kwargs):
    """
    Após salvar uma movimentação, atualizar as linhas de origem e destino
    """
    if hasattr(instance, '_skip_signal'):
        return

    if instance.source_line:
        instance.source_line.update_available_amount()
    if instance.destination_line:
        instance.destination_line.update_available_amount()


@receiver(post_delete, sender=BudgetLineMovement)
def update_lines_on_movement_delete(sender, instance, **kwargs):
    """
    Após deletar uma movimentação, atualizar as linhas de origem e destino
    """
    if instance.source_line:
        instance.source_line.update_available_amount()
    if instance.destination_line:
        instance.destination_line.update_available_amount()
