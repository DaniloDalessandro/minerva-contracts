"""
Comando para recalcular valores em cache de todos os orçamentos.
Útil após migração ou para corrigir inconsistências.
"""
from django.core.management.base import BaseCommand
from budget.models import Budget


class Command(BaseCommand):
    help = 'Recalcula valores em cache de todos os orçamentos'

    def add_arguments(self, parser):
        parser.add_argument(
            '--budget-id',
            type=int,
            help='ID específico do orçamento para recalcular (opcional)',
        )

    def handle(self, *args, **options):
        budget_id = options.get('budget_id')

        if budget_id:
            try:
                budget = Budget.objects.get(pk=budget_id)
                budgets = [budget]
                self.stdout.write(f'Recalculando orçamento ID {budget_id}...')
            except Budget.DoesNotExist:
                self.stdout.write(
                    self.style.ERROR(f'Orçamento com ID {budget_id} não encontrado')
                )
                return
        else:
            budgets = Budget.objects.all()
            total = budgets.count()
            self.stdout.write(f'Recalculando {total} orçamentos...')

        updated = 0
        for budget in budgets:
            budget.recalculate_cached_amounts()
            budget.save(update_fields=[
                'cached_used_amount',
                'cached_incoming_movements',
                'cached_outgoing_movements',
                'available_amount',
                'updated_at'
            ])
            updated += 1

            if updated % 100 == 0:
                self.stdout.write(f'  Processados: {updated}...')

        self.stdout.write(
            self.style.SUCCESS(f'[OK] {updated} orcamentos recalculados com sucesso!')
        )
