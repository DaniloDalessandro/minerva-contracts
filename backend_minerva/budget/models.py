from django.db import models
from django.core.validators import MinValueValidator
from accounts.models import User
from .utils.validators import validate_year
from center.models import ManagementCenter
from accounts.mixins import HierarchicalQuerysetMixin
from decimal import Decimal
from django.db.models import Sum


class Budget(models.Model, HierarchicalQuerysetMixin):
    BUDGET_CLASSES = [
        ('CAPEX', 'CAPEX'),
        ('OPEX', 'OPEX'),
    ]
    year = models.PositiveIntegerField(validators=[validate_year], verbose_name='Ano')
    category = models.CharField(max_length=5, choices=BUDGET_CLASSES, verbose_name='Categoria')
    management_center = models.ForeignKey(
        ManagementCenter,
        on_delete=models.CASCADE,
        related_name='budgets',
        verbose_name='Centro Gestor'
    )
    total_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))],
        verbose_name='Valor Total'
    )
    available_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.00'))],
        default=Decimal('0.00'),
        verbose_name='Valor Disponível'
    )
    cached_used_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal('0.00'),
        verbose_name='Valor Utilizado (Cache)'
    )
    cached_incoming_movements = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal('0.00'),
        verbose_name='Entrada via Movimentações (Cache)'
    )
    cached_outgoing_movements = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal('0.00'),
        verbose_name='Saída via Movimentações (Cache)'
    )
    STATUS = [
        ('ATIVO', 'Ativo'),
        ('INATIVO', 'Inativo'),
    ]
    status = models.CharField(max_length=7, choices=STATUS, default='ATIVO', verbose_name='Status')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Criado em')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Atualizado em')
    created_by = models.ForeignKey(User, related_name='budgets_created', on_delete=models.SET_NULL, null=True, blank=True, verbose_name='Criado por')
    updated_by = models.ForeignKey(User, related_name='budgets_updated', on_delete=models.SET_NULL, null=True, blank=True, verbose_name='Atualizado por')

    @property
    def used_amount(self):
        """Retorna valor utilizado do cache"""
        return self.cached_used_amount

    @property
    def valor_remanejado_entrada(self):
        """Retorna valor de entrada do cache"""
        return self.cached_incoming_movements

    @property
    def valor_remanejado_saida(self):
        """Retorna valor de saída do cache"""
        return self.cached_outgoing_movements

    @property
    def calculated_available_amount(self):
        """Calcula valor disponível usando campos em cache"""
        base_amount = Decimal(str(self.total_amount))
        available = base_amount + self.cached_incoming_movements - self.cached_outgoing_movements - self.cached_used_amount
        return max(available, Decimal('0.00'))

    def recalculate_cached_amounts(self):
        """Recalcula e atualiza todos os campos em cache"""
        # Valor alocado em linhas orçamentárias
        self.cached_used_amount = self.budget_lines.aggregate(
            total=Sum('budgeted_amount')
        )['total'] or Decimal('0.00')

        # Movimentações de entrada
        self.cached_incoming_movements = self.incoming_movements.aggregate(
            total=Sum('amount')
        )['total'] or Decimal('0.00')

        # Movimentações de saída
        self.cached_outgoing_movements = self.outgoing_movements.aggregate(
            total=Sum('amount')
        )['total'] or Decimal('0.00')

        # Auxílios concedidos
        cached_assistances = self.assistances.filter(
            status__in=['AGUARDANDO', 'ATIVO']
        ).aggregate(
            total=Sum('total_amount')
        )['total'] or Decimal('0.00')

        # Calcular disponível: total + entradas - saídas - linhas - auxílios
        base_amount = Decimal(str(self.total_amount))
        self.available_amount = (
            base_amount +
            self.cached_incoming_movements -
            self.cached_outgoing_movements -
            self.cached_used_amount -
            cached_assistances
        )

        # Garantir que não fique negativo
        self.available_amount = max(self.available_amount, Decimal('0.00'))

    def update_calculated_amounts(self):
        """Atualiza valores calculados e salva"""
        self.recalculate_cached_amounts()
        self.save(update_fields=[
            'cached_used_amount',
            'cached_incoming_movements',
            'cached_outgoing_movements',
            'available_amount',
            'updated_at'
        ])

    def save(self, *args, **kwargs):
        if 'update_fields' not in kwargs or 'available_amount' not in kwargs.get('update_fields', []):
            if self.pk:
                self.recalculate_cached_amounts()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.category} {self.year} - {self.management_center.name}"
    
    @classmethod
    def get_objects_by_direction(cls, direction):
        """Filtra orçamentos por direção"""
        return cls.objects.filter(management_center__direction=direction)

    @classmethod
    def get_objects_by_management(cls, management):
        """Filtra orçamentos por gerência"""
        return cls.objects.filter(management_center__management=management)

    @classmethod
    def get_objects_by_coordination(cls, coordination):
        """Filtra orçamentos por coordenação"""
        return cls.objects.filter(management_center__coordination=coordination)

    @classmethod
    def get_objects_by_user(cls, user):
        """Filtra orçamentos acessíveis ao usuário"""
        if user.employee and user.employee.coordination:
            return cls.get_objects_by_coordination(user.employee.coordination)
        return cls.objects.none()
    
    class Meta:
        unique_together = ['year', 'category', 'management_center']
        verbose_name = 'Orçamento'
        verbose_name_plural = 'Orçamentos'
        indexes = [
            models.Index(fields=['year'], name='budget_year_idx'),
            models.Index(fields=['category'], name='budget_category_idx'),
            models.Index(fields=['status'], name='budget_status_idx'),
            models.Index(fields=['management_center'], name='budget_mgmt_center_idx'),
            models.Index(fields=['year', 'category'], name='budget_year_cat_idx'),
        ]
        ordering = ['-year', 'category']



class BudgetMovement(models.Model):
    source = models.ForeignKey(Budget, on_delete=models.CASCADE, related_name='outgoing_movements', verbose_name='Origem')
    destination = models.ForeignKey(Budget, on_delete=models.CASCADE, related_name='incoming_movements', verbose_name='Destino')
    amount = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(Decimal('0.01'))], verbose_name='Valor')
    movement_date = models.DateField(auto_now_add=True, verbose_name='Data da Movimentação')
    notes = models.TextField(blank=True, null=True, verbose_name='Observações')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Criado em')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Atualizado em')
    created_by = models.ForeignKey(User, related_name='budget_movements_created', on_delete=models.SET_NULL, null=True, blank=True, verbose_name='Criado por')
    updated_by = models.ForeignKey(User, related_name='budget_movements_updated', on_delete=models.SET_NULL, null=True, blank=True, verbose_name='Atualizado por')

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        self.source.update_calculated_amounts()
        self.destination.update_calculated_amounts()

    def delete(self, *args, **kwargs):
        source_budget = self.source
        destination_budget = self.destination
        super().delete(*args, **kwargs)
        source_budget.update_calculated_amounts()
        destination_budget.update_calculated_amounts()

    def __str__(self):
        return f"{self.source} -> {self.destination} ({self.amount})"
    
    class Meta:
        verbose_name = 'Movimentação'
        verbose_name_plural = 'Movimentações'
        ordering = ['-movement_date']
