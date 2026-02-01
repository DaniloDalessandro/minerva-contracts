from .models import Budget, BudgetMovement
from rest_framework import serializers
from center.models import ManagementCenter
from center.serializers import ManagementCenterSerializer, UserInfoSerializer
from django.core.exceptions import ValidationError as DjangoValidationError
import logging

class BudgetSerializer(serializers.ModelSerializer):
    # Nested representation for read operations
    management_center = ManagementCenterSerializer(read_only=True)
    # Write field for management_center
    management_center_id = serializers.IntegerField(write_only=True, required=True)
    # User information for audit fields
    created_by = UserInfoSerializer(read_only=True)
    updated_by = UserInfoSerializer(read_only=True)
    
    # Campos calculados
    used_amount = serializers.ReadOnlyField()
    calculated_available_amount = serializers.ReadOnlyField()
    valor_remanejado_entrada = serializers.ReadOnlyField()
    valor_remanejado_saida = serializers.ReadOnlyField()
    
    class Meta:
        model = Budget
        fields = [
            'id', 'year', 'category', 'management_center', 
            'management_center_id', 'total_amount', 'available_amount', 'status',
            'used_amount', 'calculated_available_amount',
            'valor_remanejado_entrada', 'valor_remanejado_saida',
            'created_at', 'updated_at', 'created_by', 'updated_by'
        ]
        read_only_fields = ['created_at', 'updated_at', 'available_amount', 'used_amount', 'calculated_available_amount', 'valor_remanejado_entrada', 'valor_remanejado_saida']


class BudgetDetailSerializer(BudgetSerializer):
    """
    Serializer detalhado para Budget incluindo linhas orçamentárias vinculadas
    """
    # Linhas orçamentárias vinculadas
    budget_lines = serializers.SerializerMethodField()
    
    # Estatísticas das linhas orçamentárias
    budget_lines_summary = serializers.SerializerMethodField()
    
    # Histórico de movimentações
    movements_summary = serializers.SerializerMethodField()
    
    class Meta(BudgetSerializer.Meta):
        fields = BudgetSerializer.Meta.fields + [
            'budget_lines', 'budget_lines_summary', 'movements_summary'
        ]
    
    def get_budget_lines(self, obj):
        """
        Retorna as linhas orçamentárias vinculadas ao orçamento com informações detalhadas
        """
        from budgetline.serializers import BudgetLineDetailSerializer
        
        # Busca as linhas com prefetch para otimização
        budget_lines = obj.budget_lines.select_related(
            'management_center', 'requesting_center', 'main_fiscal', 
            'secondary_fiscal', 'created_by', 'updated_by'
        ).prefetch_related('versions').order_by('-created_at')
        
        return BudgetLineDetailSerializer(budget_lines, many=True).data
    
    def get_budget_lines_summary(self, obj):
        """Retorna resumo das linhas orçamentárias usando agregações SQL"""
        from django.db.models import Count, Sum, Q
        from django.db.models.functions import Coalesce

        lines_qs = obj.budget_lines.all()

        total_budgeted = lines_qs.aggregate(
            total=Coalesce(Sum('budgeted_amount'), 0)
        )['total']

        process_status = lines_qs.values('process_status').annotate(
            count=Count('id')
        )
        contract_status = lines_qs.values('contract_status').annotate(
            count=Count('id')
        )
        expense_type = lines_qs.values('expense_type').annotate(
            count=Count('id')
        )

        return {
            'total_lines': lines_qs.count(),
            'total_budgeted_amount': float(total_budgeted),
            'remaining_amount': float(obj.available_amount),
            'utilization_percentage': round((float(total_budgeted) / float(obj.total_amount)) * 100, 2) if obj.total_amount > 0 else 0,
            'process_status_distribution': {
                item['process_status'] or 'N/A': item['count'] for item in process_status
            },
            'contract_status_distribution': {
                item['contract_status'] or 'N/A': item['count'] for item in contract_status
            },
            'expense_type_distribution': {
                item['expense_type'] or 'N/A': item['count'] for item in expense_type
            }
        }
    
    def get_movements_summary(self, obj):
        """Retorna resumo das movimentações usando agregações SQL"""
        from django.db.models import Sum, Max
        from django.db.models.functions import Coalesce

        outgoing = obj.outgoing_movements.aggregate(
            count=Count('id'),
            total=Coalesce(Sum('amount'), 0),
            last_date=Max('movement_date')
        )
        incoming = obj.incoming_movements.aggregate(
            count=Count('id'),
            total=Coalesce(Sum('amount'), 0),
            last_date=Max('movement_date')
        )

        last_movement = max(
            filter(None, [outgoing['last_date'], incoming['last_date']]),
            default=None
        )

        return {
            'total_outgoing_movements': outgoing['count'],
            'total_incoming_movements': incoming['count'],
            'total_outgoing_amount': float(outgoing['total']),
            'total_incoming_amount': float(incoming['total']),
            'net_movement': float(incoming['total'] - outgoing['total']),
            'last_movement_date': last_movement
        }

    def create(self, validated_data):
        management_center_id = validated_data.pop('management_center_id', None)
        if management_center_id:
            try:
                management_center = ManagementCenter.objects.get(id=management_center_id)
                validated_data['management_center'] = management_center
            except ManagementCenter.DoesNotExist:
                raise serializers.ValidationError(
                    {'management_center_id': 'Centro gestor não encontrado.'}
                )

        total_amount = validated_data.get('total_amount')
        if total_amount is None:
            raise serializers.ValidationError(
                {'total_amount': 'Valor total é obrigatório.'}
            )

        validated_data['available_amount'] = total_amount
        return super().create(validated_data)

    def update(self, instance, validated_data):
        management_center_id = validated_data.pop('management_center_id', None)
        if management_center_id:
            try:
                management_center = ManagementCenter.objects.get(id=management_center_id)
                validated_data['management_center'] = management_center
            except ManagementCenter.DoesNotExist:
                raise serializers.ValidationError(
                    {'management_center_id': 'Centro gestor não encontrado.'}
                )

        return super().update(instance, validated_data)

    def validate(self, data):
        required_fields = ['year', 'category', 'total_amount']
        for field in required_fields:
            if not data.get(field):
                raise serializers.ValidationError(
                    {field: f"O campo {field} é obrigatório."}
                )

        management_center = data.get('management_center')
        management_center_id = data.get('management_center_id')

        if not management_center and management_center_id:
            try:
                management_center = ManagementCenter.objects.get(id=management_center_id)
                data['management_center'] = management_center
            except ManagementCenter.DoesNotExist:
                raise serializers.ValidationError(
                    {'management_center_id': 'Centro gestor não encontrado.'}
                )

        if not management_center and not management_center_id:
            raise serializers.ValidationError(
                {'management_center_id': 'Centro gestor é obrigatório.'}
            )

        total_amount = data.get('total_amount')
        if total_amount is not None and total_amount <= 0:
            raise serializers.ValidationError(
                {'total_amount': 'O valor total deve ser maior que zero.'}
            )

        year = data.get('year')
        if year:
            try:
                from .utils.validators import validate_year
                validate_year(year)
            except DjangoValidationError as e:
                raise serializers.ValidationError({'year': str(e)})

        category = data.get('category')

        if management_center and year and category:
            budget_exists = Budget.objects.filter(
                year=year,
                category=category,
                management_center=management_center
            )

            if self.instance:
                budget_exists = budget_exists.exclude(pk=self.instance.pk)

            if budget_exists.exists():
                error_msg = f"Já existe um orçamento para o ano de {year}, categoria {category} e centro gestor {management_center.name}."
                raise serializers.ValidationError({'non_field_errors': [error_msg]})

        return data

class BudgetMovementSerializer(serializers.ModelSerializer):
    # Nested representation for read operations
    source = BudgetSerializer(read_only=True)
    destination = BudgetSerializer(read_only=True)
    # Write fields for creating/updating movements
    source_id = serializers.IntegerField(write_only=True, required=True)
    destination_id = serializers.IntegerField(write_only=True, required=True)
    # User information for audit fields
    created_by = UserInfoSerializer(read_only=True)
    updated_by = UserInfoSerializer(read_only=True)
    
    class Meta:
        model = BudgetMovement
        fields = [
            'id', 'source', 'source_id', 'destination', 'destination_id', 
            'amount', 'movement_date', 'notes', 
            'created_at', 'updated_at', 'created_by', 'updated_by'
        ]
        read_only_fields = ['created_by', 'updated_by', 'created_at', 'updated_at']
