from rest_framework import serializers
from .models import Contract, ContractAmendment, ContractInstallment


class ContractSerializer(serializers.ModelSerializer):

    main_inspector_detail = serializers.SerializerMethodField(read_only=True)
    substitute_inspector_detail = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Contract
        fields = '__all__'
        read_only_fields = ('id', 'protocol_number', 'created_at', 'updated_at', 'created_by', 'updated_by')

    def get_main_inspector_detail(self, obj):
        if obj.main_inspector:
            return {
                'id': obj.main_inspector.id,
                'full_name': obj.main_inspector.full_name,
                'email': obj.main_inspector.email,
            }
        return None

    def get_substitute_inspector_detail(self, obj):
        if obj.substitute_inspector:
            return {
                'id': obj.substitute_inspector.id,
                'full_name': obj.substitute_inspector.full_name,
                'email': obj.substitute_inspector.email,
            }
        return None

    def validate(self, attrs):
        main_inspector = attrs.get('main_inspector') or (
            self.instance.main_inspector if self.instance else None
        )
        substitute_inspector = attrs.get('substitute_inspector') or (
            self.instance.substitute_inspector if self.instance else None
        )

        if main_inspector and not main_inspector.email:
            raise serializers.ValidationError({
                'main_inspector': (
                    f"O fiscal principal '{main_inspector.full_name}' "
                    "não possui e-mail cadastrado. "
                    "Atualize o cadastro do colaborador antes de vinculá-lo ao contrato."
                )
            })

        if substitute_inspector and not substitute_inspector.email:
            raise serializers.ValidationError({
                'substitute_inspector': (
                    f"O fiscal substituto '{substitute_inspector.full_name}' "
                    "não possui e-mail cadastrado. "
                    "Atualize o cadastro do colaborador antes de vinculá-lo ao contrato."
                )
            })

        return attrs


class ContractAmendmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContractAmendment
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'updated_at', 'created_by', 'updated_by')


class ContractInstallmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContractInstallment
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'updated_at', 'created_by', 'updated_by')
