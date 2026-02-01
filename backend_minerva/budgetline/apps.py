from django.apps import AppConfig


class BudgetlineConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'budgetline'
    verbose_name = 'Linhas Orçamentárias'

    def ready(self):
        import budgetline.signals
