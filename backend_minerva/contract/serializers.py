from rest_framework import serializers
from .models import Contract, ContractAmendment, ContractInstallment

class ContractSerializer(serializers.ModelSerializer):  
    class Meta:
        model = Contract
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'updated_at')

class ContractAmendmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContractAmendment
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'updated_at')

class ContractInstallmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContractInstallment
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'updated_at')
