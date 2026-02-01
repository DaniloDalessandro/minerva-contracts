from django.db import models, transaction
from accounts.models import User
from budgetline.models import BudgetLine
from budget.models import Budget
from employee.models import Employee
from django.core.validators import MinValueValidator
from decimal import Decimal
from .exceptions import InsufficientAidBudgetException, AidOperationException

# =================================================================================================================
class Assistance(models.Model):
    
    STATUS_CHOICES = [
    ('AGUARDANDO', 'Aguardando Início'),
    ('ATIVO', 'Ativo'),
    ('CONCLUIDO', 'Concluído'),
    ('CANCELADO', 'Cancelado'),
    ]

    TYPE_CHOICES = [
    ('GRADUACAO', 'Graduação'),
    ('POS_GRADUACAO', 'Pós-Graduação'),
    ('AUXILIO_CHECHE_ESCOLA', 'Auxílio Creche Escola'),
    ('LINGUA_ESTRANGEIRA', 'Língua Estrangeira'),
    ]

    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='assistances',verbose_name='Funcionário')
    budget = models.ForeignKey(Budget, on_delete=models.CASCADE, related_name='assistances', null=True, blank=True, verbose_name='Orçamento')
    budget_line = models.ForeignKey(BudgetLine, on_delete=models.CASCADE, related_name='assistances', null=True, blank=True, verbose_name='Linha Orçamentária')
    type = models.CharField(max_length=100, choices=TYPE_CHOICES, null=True, blank=True,verbose_name='Tipo')
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0.01)],verbose_name='Valor Total')
    installment_count = models.PositiveIntegerField(null=True, blank=True,verbose_name='Número de Parcelas')
    amount_per_installment = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True,verbose_name='Valor por Parcela')
    start_date = models.DateField(verbose_name='Data de Início')
    end_date = models.DateField(null=True, blank=True,verbose_name='Data de Término')
    notes = models.TextField(blank=True,verbose_name='Observações')
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='AGUARDANDO',verbose_name='Status')
    created_at = models.DateTimeField(auto_now_add=True,verbose_name='Criado em')   
    updated_at = models.DateTimeField(auto_now=True,verbose_name='Atualizado em')
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='created_assistances', verbose_name='Criado por')
    updated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='updated_assistances', verbose_name='Atualizado por')

    @transaction.atomic
    def save(self, *args, **kwargs):
        """
        Ao criar um auxílio:
        - Deve subtrair o valor do orçamento
        - Validar se o orçamento tem saldo suficiente
        """
        is_new = self.pk is None
        old_total_amount = Decimal('0.00')

        if not is_new:
            # Recuperar valor antigo se estiver atualizando
            old_instance = Assistance.objects.get(pk=self.pk)
            old_total_amount = old_instance.total_amount

        # Se for novo auxílio, validar se o orçamento tem saldo
        if is_new:
            # Validar que pelo menos budget está preenchido
            if not self.budget:
                # Se não tem budget, tentar pegar do budget_line
                if self.budget_line and self.budget_line.budget:
                    self.budget = self.budget_line.budget
                else:
                    raise AidOperationException("O auxílio deve estar vinculado a um orçamento.")

            # Recarregar orçamento com lock
            budget = Budget.objects.select_for_update().get(pk=self.budget.pk)

            if budget.available_amount < self.total_amount:
                raise InsufficientAidBudgetException(
                    budget.available_amount,
                    self.total_amount
                )

        # Se o valor mudou em uma atualização
        if not is_new and old_total_amount != self.total_amount:
            difference = self.total_amount - old_total_amount
            budget = Budget.objects.select_for_update().get(pk=self.budget.pk)

            if difference > 0:  # Aumento no valor
                if budget.available_amount < difference:
                    raise InsufficientAidBudgetException(
                        budget.available_amount,
                        difference,
                        f"Operação não permitida: o aumento de valor (R$ {difference:.2f}) "
                        f"excede o saldo disponível do orçamento (R$ {budget.available_amount:.2f})."
                    )

        super().save(*args, **kwargs)

        # Atualizar orçamento
        if self.budget:
            self.budget.update_calculated_amounts()

    @transaction.atomic
    def delete(self, *args, **kwargs):
        """
        Ao deletar um auxílio:
        - O valor deve retornar ao orçamento
        """
        budget = self.budget
        super().delete(*args, **kwargs)

        # Atualizar valores do orçamento (o valor retorna automaticamente)
        if budget:
            budget.update_calculated_amounts()

    def __str__(self):
        if self.budget_line:
            return self.employee.name + ' - ' + str(self.budget_line)
        return self.employee.name + ' - ' + str(self.budget)

    class Meta:
        ordering = ['start_date']
        verbose_name = 'Assistência'
        verbose_name_plural = 'Assistências'