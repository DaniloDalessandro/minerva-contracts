from rest_framework import serializers
from .models import BudgetLine, BudgetLineMovement, BudgetLineVersion
from center.serializers import ManagementCenterSerializer, UserInfoSerializer
from employee.serializers import EmployeeSerializer

class BudgetLineDetailSerializer(serializers.ModelSerializer):
    """
    Serializer detalhado para BudgetLine com informações dos relacionamentos
    """
    # Informações dos relacionamentos
    management_center_name = serializers.CharField(source='management_center.name', read_only=True)
    requesting_center_name = serializers.CharField(source='requesting_center.name', read_only=True)
    main_fiscal_name = serializers.CharField(source='main_fiscal.name', read_only=True)
    secondary_fiscal_name = serializers.CharField(source='secondary_fiscal.name', read_only=True)
    
    # Informações de auditoria
    created_by_name = serializers.CharField(source='created_by.username', read_only=True)
    updated_by_name = serializers.CharField(source='updated_by.username', read_only=True)
    
    # Informação do orçamento pai
    budget_info = serializers.SerializerMethodField()
    
    # Informações de versioning
    current_version = serializers.SerializerMethodField()
    total_versions = serializers.SerializerMethodField()
    
    class Meta:
        model = BudgetLine
        fields = [
            'id', 'budget', 'category', 'expense_type', 'management_center', 'requesting_center',
            'summary_description', 'object', 'budget_classification', 'main_fiscal',
            'secondary_fiscal', 'contract_type', 'probable_procurement_type', 'budgeted_amount',
            'process_status', 'contract_status', 'status', 'contract_notes', 'created_at', 'updated_at',
            'created_by', 'updated_by',
            # Campos extras para exibição
            'management_center_name', 'requesting_center_name', 'main_fiscal_name',
            'secondary_fiscal_name', 'created_by_name', 'updated_by_name', 'budget_info',
            'current_version', 'total_versions'
        ]
        read_only_fields = ['created_by', 'updated_by', 'created_at', 'updated_at']
    
    def get_budget_info(self, obj):
        """Informações básicas do orçamento pai"""
        if obj.budget:
            return {
                'id': obj.budget.id,
                'year': obj.budget.year,
                'category': obj.budget.category,
                'management_center_name': obj.budget.management_center.name if obj.budget.management_center else None,
                'total_amount': str(obj.budget.total_amount),
                'available_amount': str(obj.budget.available_amount)
            }
        return None
    
    def get_current_version(self, obj):
        """Número da versão atual"""
        latest_version = obj.versions.first()
        return latest_version.version_number if latest_version else 1
    
    def get_total_versions(self, obj):
        """Total de versões da linha orçamentária"""
        return obj.versions.count()

class BudgetLineSerializer(serializers.ModelSerializer):
    """
    Serializer básico para BudgetLine para uso em listagens
    """
    management_center_name = serializers.CharField(source='management_center.name', read_only=True)
    requesting_center_name = serializers.CharField(source='requesting_center.name', read_only=True)
    main_fiscal_name = serializers.CharField(source='main_fiscal.full_name', read_only=True)

    class Meta:
        model = BudgetLine
        fields = [
            'id', 'budget', 'category', 'expense_type', 'management_center', 'requesting_center',
            'summary_description', 'object', 'budget_classification', 'budgeted_amount',
            'process_status', 'contract_status', 'status', 'main_fiscal', 'created_at', 'updated_at',
            'management_center_name', 'requesting_center_name', 'main_fiscal_name'
        ]
        read_only_fields = ['created_by', 'updated_by', 'created_at', 'updated_at']



class BudgetLineMovementSerializer(serializers.ModelSerializer):
    class Meta:
        model = BudgetLineMovement
        fields = '__all__'
        read_only_fields = ['created_by', 'updated_by', 'created_at', 'updated_at']


class BudgetLineVersionSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source='created_by.username', read_only=True)
    management_center_name = serializers.CharField(source='management_center.name', read_only=True)
    requesting_center_name = serializers.CharField(source='requesting_center.name', read_only=True)
    main_fiscal_name = serializers.CharField(source='main_fiscal.name', read_only=True)
    secondary_fiscal_name = serializers.CharField(source='secondary_fiscal.name', read_only=True)
    
    class Meta:
        model = BudgetLineVersion
        fields = '__all__'
        read_only_fields = ['created_by', 'created_at', 'version_number']