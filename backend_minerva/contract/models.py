from django.db import models, transaction
from django.core.validators import MinValueValidator
from accounts.models import User
from employee.models import Employee
from budgetline.models import BudgetLine
from accounts.mixins import HierarchicalQuerysetMixin
from django.utils import timezone
from decimal import Decimal
from .services.services_contract import generate_protocol_number
from .exceptions import InsufficientContractBudgetException, ContractOperationException

class Contract(models.Model, HierarchicalQuerysetMixin):
    budget_line = models.ForeignKey(BudgetLine, on_delete=models.PROTECT, related_name='contracts')
    protocol_number = models.CharField(max_length=7, unique=True, blank=True, editable=False, verbose_name='Contrato')
    signing_date = models.DateField(null=True, blank=True, verbose_name='Data de Assinatura')
    expiration_date = models.DateField(null=True, blank=True, verbose_name='Data de Expiração')
    main_inspector = models.ForeignKey(Employee, on_delete=models.PROTECT, related_name='contracts_main_inspector', verbose_name='Fiscal Principal')
    substitute_inspector = models.ForeignKey(Employee, on_delete=models.PROTECT, related_name='contracts_substitute_inspector', verbose_name='Fiscal Substituto')
    PAYMENT_TYPE_CHOICES = [
        ('UNICO', 'Pagamento Único'),
        ('ANUAL', 'Pagamento Anual'),
        ('SEMANAL', 'Pagamento Semanal'),
        ('MENSAL', 'Pagamento Mensal'),
        ('QUINZENAL', 'Pagamento Quinzenal'),
        ('TRIMESTRAL', 'Pagamento Trimestral'),
        ('SEMESTRAL', 'Pagamento Semestral'),
        ('SOB_DEMANDA', 'Pagamento Sob Demanda'),
    ]
    payment_nature = models.CharField(choices=PAYMENT_TYPE_CHOICES, max_length=30, verbose_name='Natureza do Pagamento')
    description = models.CharField(max_length=255, verbose_name='Descrição')
    original_value = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0.01)], verbose_name='Valor Original')
    current_value = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0.01)], default=0.0, verbose_name='Valor Atual')
    start_date = models.DateField(verbose_name='Data de Início')
    end_date = models.DateField(null=True, blank=True, verbose_name='Data de Término')
    STATUS_CONTRACTS = [('ATIVO', 'ATIVO'), 
                        ('ENCERRADO', 'ENCERRADO')]
    status = models.CharField(max_length=30, choices=STATUS_CONTRACTS, default='ATIVO', verbose_name='Status')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Criado em')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Atualizado em')
    created_by = models.ForeignKey(User, on_delete=models.PROTECT, related_name='contracts_created', verbose_name='Criado por')
    updated_by = models.ForeignKey(User, on_delete=models.PROTECT, related_name='contracts_updated', verbose_name='Atualizado por')

    @transaction.atomic
    def save(self, *args, **kwargs):
        """
        Ao criar um contrato:
        - Deve subtrair o valor do available_amount da linha orçamentária
        - Validar se a linha tem saldo suficiente
        """
        is_new = self.pk is None
        old_original_value = Decimal('0.00')
        old_status = None

        if not is_new:
            # Recuperar valores antigos
            old_instance = Contract.objects.get(pk=self.pk)
            old_original_value = old_instance.original_value
            old_status = old_instance.status

        # Gerar número de protocolo se for novo
        if not self.protocol_number:
            self.protocol_number = generate_protocol_number()

        # Se for novo contrato, validar saldo da linha
        if is_new:
            if not self.budget_line:
                raise ContractOperationException("O contrato deve estar vinculado a uma linha orçamentária.")

            # Recarregar linha com lock
            budget_line = BudgetLine.objects.select_for_update().get(pk=self.budget_line.pk)

            if budget_line.available_amount < self.original_value:
                raise InsufficientContractBudgetException(
                    budget_line.available_amount,
                    self.original_value
                )

        # Se o valor mudou em uma atualização
        if not is_new and old_original_value != self.original_value:
            difference = self.original_value - old_original_value
            budget_line = BudgetLine.objects.select_for_update().get(pk=self.budget_line.pk)

            if difference > 0:  # Aumento no valor
                if budget_line.available_amount < difference:
                    raise InsufficientContractBudgetException(
                        budget_line.available_amount,
                        difference,
                        f"Operação não permitida: o aumento de valor (R$ {difference:.2f}) "
                        f"excede o saldo disponível da linha orçamentária (R$ {budget_line.available_amount:.2f})."
                    )

        # Se o status mudou de ATIVO para ENCERRADO, devolver valor à linha
        if not is_new and old_status == 'ATIVO' and self.status == 'ENCERRADO':
            # O valor será devolvido automaticamente pelo recalculate_available_amount
            pass

        super().save(*args, **kwargs)

        # Atualizar linha orçamentária
        if self.budget_line:
            self.budget_line.update_available_amount()
            # Atualizar orçamento também
            if self.budget_line.budget:
                self.budget_line.budget.update_calculated_amounts()

    @transaction.atomic
    def delete(self, *args, **kwargs):
        """
        Ao deletar um contrato:
        - O valor deve retornar à linha orçamentária
        """
        budget_line = self.budget_line
        super().delete(*args, **kwargs)

        # Atualizar valores (o valor retorna automaticamente)
        if budget_line:
            budget_line.update_available_amount()
            if budget_line.budget:
                budget_line.budget.update_calculated_amounts()

    def __str__(self):
        return self.protocol_number

    @classmethod
    def get_objects_by_direction(cls, direction):
        """Retorna contratos baseados na direção através da linha orçamentária"""
        return cls.objects.filter(
            budget_line__budget__management_center__direction=direction
        )
    
    @classmethod
    def get_objects_by_management(cls, management):
        """Retorna contratos baseados na gerência através da linha orçamentária"""
        return cls.objects.filter(
            budget_line__budget__management_center__management=management
        )
    
    @classmethod
    def get_objects_by_coordination(cls, coordination):
        """Retorna contratos baseados na coordenação através da linha orçamentária - filtro principal"""
        return cls.objects.filter(
            budget_line__budget__management_center__coordination=coordination
        )
    
    @classmethod
    def get_objects_by_user(cls, user):
        """Retorna contratos que o usuário específico pode ver"""
        if user.employee and user.employee.coordination:
            return cls.get_objects_by_coordination(user.employee.coordination)
        return cls.objects.none()

    class Meta:
        verbose_name = 'Contrato'
        verbose_name_plural = 'Contratos'
        ordering = ['protocol_number']



class ContractInstallment(models.Model):
    contract = models.ForeignKey(Contract, on_delete=models.CASCADE, related_name='installments')
    number = models.PositiveIntegerField()
    value = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0.01)])
    due_date = models.DateField()
    payment_date = models.DateField(null=True, blank=True)
    status = models.CharField(
        max_length=20,
        choices=[('PENDENTE', 'Pendente'), ('PAGO', 'Pago'), ('ATRASADO', 'Atrasado')],
        default='PENDENTE',
    )
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(User, on_delete=models.PROTECT, related_name='aditivos_created')
    updated_by = models.ForeignKey(User, on_delete=models.PROTECT, related_name='aditivos_updated')
    
    def __str__(self):
        return f"Installment {self.number} - {self.contract.description}"
    
    class Meta:
        verbose_name = 'Parcela'
        verbose_name_plural = 'Parcelas'
        ordering = ['contract', 'number']



class ContractAmendment(models.Model):
    AMENDMENT_TYPES = [
        ('Acréscimo de Valor', 'Acréscimo de Valor'),
        ('Redução de Valor', 'Redução de Valor'),
        ('Prorrogação de Prazo', 'Prorrogação de Prazo'),
    ]
    contract = models.ForeignKey(Contract, on_delete=models.CASCADE, related_name='amendments')
    description = models.CharField(max_length=255, verbose_name='Descrição')
    type = models.CharField(max_length=20, choices=AMENDMENT_TYPES,verbose_name='Tipo')
    value = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)],verbose_name='Valor')
    additional_term = models.DateTimeField(null=True, blank=True,verbose_name='Prazo Adicional')  
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Criado em')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Atualizado em')
    created_by = models.ForeignKey(User, on_delete=models.PROTECT, related_name='amendments_created',verbose_name='Criado por')
    updated_by = models.ForeignKey(User, on_delete=models.PROTECT, related_name='amendments_updated',verbose_name='Atualizado por')
    
    def __str__(self):
        return f"{self.description} - {self.contract.description}"
    
    class Meta:
        verbose_name = 'Aditivo'
        verbose_name_plural = 'Aditivos'
        ordering = ['contract', 'created_at']