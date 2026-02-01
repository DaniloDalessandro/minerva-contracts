from rest_framework import serializers
from .models import Assistance
from employee.serializers import EmployeeSerializer
from budgetline.serializers import BudgetLineSerializer
from accounts.serializers import UserSerializer


class AidSerializer(serializers.ModelSerializer):
    employee = EmployeeSerializer(read_only=True)
    employee_id = serializers.IntegerField(write_only=True)
    budget_line = BudgetLineSerializer(read_only=True)
    budget_line_id = serializers.IntegerField(write_only=True)
    created_by = UserSerializer(read_only=True)
    updated_by = UserSerializer(read_only=True)

    class Meta:
        model = Assistance
        fields = [
            'id', 'employee', 'employee_id', 'budget_line', 'budget_line_id',
            'type', 'total_amount', 'installment_count', 'amount_per_installment',
            'start_date', 'end_date', 'notes', 'status',
            'created_at', 'updated_at', 'created_by', 'updated_by'
        ]
        read_only_fields = ['id', 'created_by', 'updated_by', 'created_at', 'updated_at']

    def create(self, validated_data):
        return Assistance.objects.create(**validated_data)

    def update(self, instance, validated_data):
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance
