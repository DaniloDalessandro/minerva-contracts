from django.db import models, transaction
from django.core.validators import MinValueValidator
from accounts.models import User
from budget.models import Budget
from employee.models import Employee
from center.models import ManagementCenter, RequestingCenter
from accounts.mixins import HierarchicalQuerysetMixin
from decimal import Decimal
from .exceptions import InsufficientBudgetLineException, BudgetLineOperationException

class BudgetLine(models.Model, HierarchicalQuerysetMixin):
    budget = models.ForeignKey(Budget, on_delete=models.PROTECT, related_name='budget_lines',verbose_name='Orçamento')
    BUDGET_CATEGORY_CHOICES = [
        ('CAPEX', 'CAPEX'),
        ('OPEX', 'OPEX'),
    ]
    category = models.CharField(
        max_length=100, 
        choices=BUDGET_CATEGORY_CHOICES, 
        blank=True, 
        null=True, 
        verbose_name='Categoria'
    )

    EXPENSE_TYPE_CHOICES = [
        ('Base Principal', 'Base Principal'),
        ('Serviços Especializados', 'Serviços Especializados'),
        ('Despesas Compartilhadas', 'Despesas Compartilhadas'),
    ]
    expense_type = models.CharField(
        max_length=100, 
        choices=EXPENSE_TYPE_CHOICES, 
        verbose_name='Tipo de Despesa'
    )

    management_center = models.ForeignKey(
        ManagementCenter, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='budget_lines',
        verbose_name='Centro de Gestor'
    )
    requesting_center = models.ForeignKey(
        RequestingCenter, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        verbose_name='Centro Solicitante'
    )
    summary_description = models.CharField(
        max_length=255, 
        null=True, 
        blank=True, 
        verbose_name='Descrição resumida'
    )
    object = models.CharField(
        max_length=80, 
        blank=True, 
        null=True, 
        verbose_name='Objeto'
    )

    BUDGET_CLASSIFICATION_CHOICES = [
        ('NOVO', 'NOVO'),
        ('RENOVAÇÃO', 'RENOVAÇÃO'),
        ('CARY OVER', 'CARY OVER'),
        ('REPLANEJAMENTO', 'REPLANEJAMENTO'),
        ('N/A', 'N/A'),
    ]
    budget_classification = models.CharField(
        max_length=100, 
        choices=BUDGET_CLASSIFICATION_CHOICES, 
        null=True, 
        blank=True,
        verbose_name='Classificação Orçamentária'
    )

    main_fiscal = models.ForeignKey(
        Employee, 
        on_delete=models.PROTECT, 
        related_name='main_contract_fiscal', 
        blank=True,
        null=True,
        verbose_name='Fiscal Principal'
    )
    secondary_fiscal = models.ForeignKey(
        Employee, 
        on_delete=models.PROTECT, 
        related_name='secondary_contract_fiscal', 
        blank=True,
        null=True,
        verbose_name='Fiscal Substituto'
    )

    CONTRACT_TYPE_CHOICES = [
        ('SERVIÇO', 'SERVIÇO'),
        ('FORNECIMENTO', 'FORNECIMENTO'),
        ('ASSINATURA', 'ASSINATURA'),
        ('FORNECIMENTO/SERVIÇO', 'FORNECIMENTO/SERVIÇO'),
    ]
    contract_type = models.CharField(
        max_length=100, 
        choices=CONTRACT_TYPE_CHOICES, 
        blank=True, 
        null=True,
        verbose_name='Tipo de Contrato'
    )

    PROCUREMENT_TYPE_CHOICES = [
        ('LICITAÇÃO', 'LICITAÇÃO'),
        ('DISPENSA EM RAZÃO DO VALOR', 'DISPENSA EM RAZÃO DO VALOR'),
        ('CONVÊNIO', 'CONVÊNIO'),
        ('FUNDO FIXO', 'FUNDO FIXO'),
        ('INEXIGIBILIDADE', 'INEXIGIBILIDADE'),
        ('ATA DE REGISTRO DE PREÇO', 'ATA DE REGISTRO DE PREÇO'),
        ('ACORDO DE COOPERAÇÃO', 'ACORDO DE COOPERAÇÃO'),
        ('APOSTILAMENTO', 'APOSTILAMENTO'),
    ]
    probable_procurement_type = models.CharField(
        max_length=100,
        choices=PROCUREMENT_TYPE_CHOICES,
        verbose_name='Tipo de Aquisição'
    )

    budgeted_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(0.01)],
        verbose_name='Valor Orçado'
    )

    available_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(0)],
        verbose_name='Valor Disponível',
        help_text='Valor disponível para criação de contratos'
    )

    PROCESS_STATUS_CHOICES = [
        ('VENCIDO', 'VENCIDO'),
        ('DENTRO DO PRAZO', 'DENTRO DO PRAZO'),
        ('ELABORADO COM ATRASO', 'ELABORADO COM ATRASO'),
        ('ELABORADO NO PRAZO', 'ELABORADO NO PRAZO'),
    ]
    process_status = models.CharField(
        max_length=100, 
        choices=PROCESS_STATUS_CHOICES, 
        blank=True, 
        null=True,
        verbose_name='Status do Processo'
    )

    CONTRACT_STATUS_CHOICES = [
        ('DENTRO DO PRAZO', 'DENTRO DO PRAZO'),
        ('CONTRATADO NO PRAZO', 'CONTRATADO NO PRAZO'),
        ('CONTRATADO COM ATRASO', 'CONTRATADO COM ATRASO'),
        ('PRAZO VENCIDO', 'PRAZO VENCIDO'),
        ('LINHA TOTALMENTE REMANEJADA', 'LINHA TOTALMENTE REMANEJADA'),
        ('LINHA TOTALMENTE EXECUTADA', 'LINHA TOTALMENTE EXECUTADA'),
        ('LINHA DE PAGAMENTO', 'LINHA DE PAGAMENTO'),
        ('LINHA PARCIALMENTE REMANEJADA', 'LINHA PARCIALMENTE REMANEJADA'),
        ('LINHA PARCIALMENTE EXECUTADA', 'LINHA PARCIALMENTE EXECUTADA'),
        ('N/A', 'N/A'),
    ]
    contract_status = models.CharField(
        max_length=100,
        choices=CONTRACT_STATUS_CHOICES,
        blank=True,
        null=True,
        verbose_name='Status do Contrato'
    )

    STATUS_CHOICES = [
        ('ATIVO', 'ATIVO'),
        ('INATIVO', 'INATIVO'),
        ('FINALIZADO', 'FINALIZADO'),
    ]
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='ATIVO',
        verbose_name='Status'
    )

    contract_notes = models.TextField(
        max_length=400, 
        blank=True, 
        null=True,
        verbose_name='Observações'
    
    )
    created_at = models.DateTimeField(auto_now_add=True,verbose_name='Criado em')
    updated_at = models.DateTimeField(auto_now=True,verbose_name='Atualizado em')
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='budget_lines_created',verbose_name='Criado por')
    updated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='budget_lines_updated',verbose_name='Atualizado por')   
   
    @transaction.atomic
    def save(self, *args, **kwargs):
        from budget.exceptions import InsufficientBudgetException

        is_new = self.pk is None
        old_budgeted_amount = Decimal('0.00')

        if not is_new:
            # Recuperar valor antigo se estiver atualizando
            old_instance = BudgetLine.objects.get(pk=self.pk)
            old_budgeted_amount = old_instance.budgeted_amount

        # Se for nova linha, validar se o orçamento tem saldo suficiente
        if is_new:
            if not self.budget:
                raise BudgetLineOperationException("A linha orçamentária deve estar vinculada a um orçamento.")

            # Recarregar orçamento com lock para evitar race conditions
            budget = Budget.objects.select_for_update().get(pk=self.budget.pk)

            if budget.available_amount < self.budgeted_amount:
                raise InsufficientBudgetException(
                    budget.available_amount,
                    self.budgeted_amount,
                    f"Operação não permitida: o valor da linha orçamentária (R$ {self.budgeted_amount:.2f}) "
                    f"excede o saldo disponível do orçamento (R$ {budget.available_amount:.2f})."
                )

            # Inicializar available_amount com o valor total
            if not self.available_amount or self.available_amount == 0:
                self.available_amount = self.budgeted_amount

        # Se o valor orçado mudou em uma atualização
        if not is_new and old_budgeted_amount != self.budgeted_amount:
            difference = self.budgeted_amount - old_budgeted_amount
            budget = Budget.objects.select_for_update().get(pk=self.budget.pk)

            if difference > 0:  # Aumento no valor
                if budget.available_amount < difference:
                    raise InsufficientBudgetException(
                        budget.available_amount,
                        difference,
                        f"Operação não permitida: o aumento de valor (R$ {difference:.2f}) "
                        f"excede o saldo disponível do orçamento (R$ {budget.available_amount:.2f})."
                    )
            # Se diminuiu o valor, o available_amount da linha deve ajustar proporcionalmente
            # mas não pode ficar negativo
            if difference < 0:  # Redução no valor
                reduction = abs(difference)
                if reduction > self.available_amount:
                    # Não pode reduzir mais do que está disponível na linha
                    raise BudgetLineOperationException(
                        f"Operação não permitida: não é possível reduzir R$ {reduction:.2f} "
                        f"pois apenas R$ {self.available_amount:.2f} está disponível na linha."
                    )
                self.available_amount -= reduction

        super().save(*args, **kwargs)

        # Atualizar valores calculados do orçamento relacionado
        if self.budget:
            self.budget.update_calculated_amounts()

        if not is_new:
            self.create_version("Atualização da linha orçamentária", kwargs.get('updated_by'))
    
    @transaction.atomic
    def delete(self, *args, **kwargs):
        """
        Ao deletar uma linha orçamentária:
        - O valor deve retornar ao orçamento
        - Não permitir se houver contratos ativos vinculados
        """
        # Verificar se há contratos vinculados
        if self.contracts.exists():
            raise BudgetLineOperationException(
                "Operação não permitida: não é possível excluir uma linha orçamentária "
                "que possui contratos vinculados. Cancele ou exclua os contratos primeiro."
            )

        budget = self.budget
        super().delete(*args, **kwargs)

        # Atualizar valores calculados do orçamento relacionado
        # O valor da linha retorna automaticamente ao orçamento via recalculate_cached_amounts
        if budget:
            budget.update_calculated_amounts()

    def recalculate_available_amount(self):
        """
        Recalcula o valor disponível da linha baseado nos contratos criados
        available_amount = budgeted_amount - soma(contratos.original_value)
        """
        from django.db.models import Sum
        from contract.models import Contract

        total_contracted = self.contracts.filter(
            status='ATIVO'
        ).aggregate(
            total=Sum('original_value')
        )['total'] or Decimal('0.00')

        # Recalcular movimentações (entradas e saídas)
        total_incoming = self.incoming_movements.aggregate(
            total=Sum('movement_amount')
        )['total'] or Decimal('0.00')

        total_outgoing = self.outgoing_movements.aggregate(
            total=Sum('movement_amount')
        )['total'] or Decimal('0.00')

        # Calcular disponível: valor orçado + entradas - saídas - contratos ativos
        self.available_amount = (
            self.budgeted_amount +
            total_incoming -
            total_outgoing -
            total_contracted
        )

        # Garantir que não fique negativo
        if self.available_amount < 0:
            self.available_amount = Decimal('0.00')

        return self.available_amount

    def update_available_amount(self):
        """Atualiza e salva o valor disponível"""
        self.recalculate_available_amount()
        self.save(update_fields=['available_amount', 'updated_at'])

    def create_version(self, change_reason, user=None):
        latest_version = self.versions.first()
        version_number = (latest_version.version_number + 1) if latest_version else 1
        
        BudgetLineVersion.objects.create(
            budget_line=self,
            version_number=version_number,
            category=self.category,
            expense_type=self.expense_type,
            management_center=self.management_center,
            requesting_center=self.requesting_center,
            summary_description=self.summary_description,
            object=self.object,
            budget_classification=self.budget_classification,
            main_fiscal=self.main_fiscal,
            secondary_fiscal=self.secondary_fiscal,
            contract_type=self.contract_type,
            probable_procurement_type=self.probable_procurement_type,
            budgeted_amount=self.budgeted_amount,
            process_status=self.process_status,
            contract_status=self.contract_status,
            status=self.status,
            contract_notes=self.contract_notes,
            change_reason=change_reason,
            created_by=user
        )

    def __str__(self):
        return self.summary_description or "Linha orçamentaria desconhecida"

    @classmethod
    def get_objects_by_direction(cls, direction):
        """Retorna linhas orçamentárias baseadas na direção"""
        return cls.objects.filter(
            budget__management_center__direction=direction
        )
    
    @classmethod
    def get_objects_by_management(cls, management):
        """Retorna linhas orçamentárias baseadas na gerência"""
        return cls.objects.filter(
            budget__management_center__management=management
        )
    
    @classmethod
    def get_objects_by_coordination(cls, coordination):
        """Retorna linhas orçamentárias baseadas na coordenação - filtro principal"""
        return cls.objects.filter(
            budget__management_center__coordination=coordination
        )
    
    @classmethod
    def get_objects_by_user(cls, user):
        """Retorna linhas orçamentárias que o usuário específico pode ver"""
        if user.employee and user.employee.coordination:
            return cls.get_objects_by_coordination(user.employee.coordination)
        return cls.objects.none()

    class Meta:
        verbose_name = 'Linha Orçamentária'
        verbose_name_plural = 'Linhas Orçamentárias'
        ordering = ['-created_at']


        
class BudgetLineMovement(models.Model):
    source_line = models.ForeignKey(BudgetLine, on_delete=models.CASCADE, related_name='outgoing_movements', verbose_name='Linha de Origem', null=True, blank=True)
    destination_line = models.ForeignKey(BudgetLine, on_delete=models.CASCADE, related_name='incoming_movements', verbose_name='Linha de Destino', null=True, blank=True)
    movement_amount = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0.01)], verbose_name='Valor da Movimentação')
    movement_notes = models.TextField(max_length=400, blank=True, null=True, verbose_name='Motivo')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Criado em')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Atualizado em')
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='budget_line_movements_created', verbose_name='Criado por')
    updated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='budget_line_movements_updated', verbose_name='Atualizado por')

    @transaction.atomic
    def save(self, *args, **kwargs):
        """
        Ao criar uma movimentação entre linhas:
        - Validar que a linha de origem tem saldo suficiente
        - Subtrair da origem e adicionar ao destino
        """
        is_new = self.pk is None

        if is_new:
            # Validações
            if not self.source_line or not self.destination_line:
                raise BudgetLineOperationException(
                    "Operação não permitida: ambas as linhas (origem e destino) devem ser informadas."
                )

            if self.source_line.pk == self.destination_line.pk:
                raise BudgetLineOperationException(
                    "Operação não permitida: a linha de origem não pode ser igual à linha de destino."
                )

            # Recarregar linha de origem com lock
            source = BudgetLine.objects.select_for_update().get(pk=self.source_line.pk)

            # Validar saldo disponível na linha de origem
            if source.available_amount < self.movement_amount:
                raise InsufficientBudgetLineException(
                    source.available_amount,
                    self.movement_amount,
                    f"Operação não permitida: o valor da movimentação (R$ {self.movement_amount:.2f}) "
                    f"excede o saldo disponível da linha de origem (R$ {source.available_amount:.2f})."
                )

        super().save(*args, **kwargs)

        # Atualizar valores das linhas envolvidas
        if is_new:
            self.source_line.update_available_amount()
            self.destination_line.update_available_amount()

    @transaction.atomic
    def delete(self, *args, **kwargs):
        """
        Ao deletar uma movimentação:
        - Devolver o valor à linha de origem
        - Subtrair da linha de destino
        """
        source = self.source_line
        destination = self.destination_line

        super().delete(*args, **kwargs)

        # Atualizar valores das linhas
        if source:
            source.update_available_amount()
        if destination:
            destination.update_available_amount()

    def __str__(self):
        if self.source_line and self.destination_line:
            return f'{self.source_line} → {self.destination_line} - R$ {self.movement_amount}'
        return f'Movimentação - R$ {self.movement_amount}'

    class Meta:
        verbose_name = 'Movimentação'
        verbose_name_plural = 'Movimentações'
        ordering = ['-created_at']


class BudgetLineVersion(models.Model):
    budget_line = models.ForeignKey(
        BudgetLine, 
        on_delete=models.CASCADE, 
        related_name='versions',
        verbose_name='Linha Orçamentária'
    )
    version_number = models.PositiveIntegerField(verbose_name='Número da Versão')
    
    category = models.CharField(
        max_length=100, 
        choices=BudgetLine.BUDGET_CATEGORY_CHOICES, 
        blank=True, 
        null=True, 
        verbose_name='Categoria'
    )
    expense_type = models.CharField(
        max_length=100, 
        choices=BudgetLine.EXPENSE_TYPE_CHOICES, 
        verbose_name='Tipo de Despesa'
    )
    management_center = models.ForeignKey(
        ManagementCenter, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='budget_line_versions',
        verbose_name='Centro de Gestor'
    )
    requesting_center = models.ForeignKey(
        RequestingCenter, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        verbose_name='Centro Solicitante'
    )
    summary_description = models.CharField(
        max_length=255, 
        null=True, 
        blank=True, 
        verbose_name='Descrição resumida'
    )
    object = models.CharField(
        max_length=80, 
        blank=True, 
        null=True, 
        verbose_name='Objeto'
    )
    budget_classification = models.CharField(
        max_length=100, 
        choices=BudgetLine.BUDGET_CLASSIFICATION_CHOICES, 
        null=True, 
        blank=True,
        verbose_name='Classificação Orçamentária'
    )
    main_fiscal = models.ForeignKey(
        Employee, 
        on_delete=models.PROTECT, 
        related_name='main_fiscal_versions', 
        blank=True,
        null=True,
        verbose_name='Fiscal Principal'
    )
    secondary_fiscal = models.ForeignKey(
        Employee, 
        on_delete=models.PROTECT, 
        related_name='secondary_fiscal_versions', 
        blank=True,
        null=True,
        verbose_name='Fiscal Substituto'
    )
    contract_type = models.CharField(
        max_length=100, 
        choices=BudgetLine.CONTRACT_TYPE_CHOICES, 
        blank=True, 
        null=True,
        verbose_name='Tipo de Contrato'
    )
    probable_procurement_type = models.CharField(
        max_length=100, 
        choices=BudgetLine.PROCUREMENT_TYPE_CHOICES,
        verbose_name='Tipo de Aquisição'
    )
    budgeted_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(0.01)],
        verbose_name='Valor Orçado'
    )
    process_status = models.CharField(
        max_length=100, 
        choices=BudgetLine.PROCESS_STATUS_CHOICES, 
        blank=True, 
        null=True,
        verbose_name='Status do Processo'
    )
    contract_status = models.CharField(
        max_length=100,
        choices=BudgetLine.CONTRACT_STATUS_CHOICES,
        blank=True,
        null=True,
        verbose_name='Status do Contrato'
    )
    status = models.CharField(
        max_length=20,
        choices=BudgetLine.STATUS_CHOICES,
        default='ATIVO',
        verbose_name='Status'
    )
    contract_notes = models.TextField(
        max_length=400,
        blank=True,
        null=True,
        verbose_name='Observações'
    )

    change_reason = models.TextField(
        max_length=500,
        verbose_name='Motivo da Alteração'
    )
    
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Criado em')
    created_by = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        related_name='budget_line_versions_created',
        verbose_name='Criado por'
    )
    
    def __str__(self):
        return f"{self.budget_line.summary_description} - Versão {self.version_number}"
    
    class Meta:
        verbose_name = 'Versão de Linha Orçamentária'
        verbose_name_plural = 'Versões de Linhas Orçamentárias'
        unique_together = ['budget_line', 'version_number']
        ordering = ['-version_number']