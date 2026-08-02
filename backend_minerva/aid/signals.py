"""
Signals para atualização automática de valores relacionados
"""
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from .models import Assistance


@receiver(post_save, sender=Assistance)
def update_budget_on_assistance_save(sender, instance, created, **kwargs):
    """
    Após salvar um auxílio, atualizar o orçamento
    """
    if hasattr(instance, '_skip_signal'):
        return

    if instance.budget:
        instance.budget.update_calculated_amounts()


@receiver(post_delete, sender=Assistance)
def update_budget_on_assistance_delete(sender, instance, **kwargs):
    """
    Após deletar um auxílio, devolver o valor ao orçamento
    """
    if instance.budget:
        instance.budget.update_calculated_amounts()
