from rest_framework import serializers
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework.exceptions import ValidationError
from .models import ManagementCenter, RequestingCenter
from .utils.validators import validate_registry_field
from django.contrib.auth import get_user_model

User = get_user_model()

class UserInfoSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email']

# Serializer for the models in the centers app
class ManagementCenterSerializer(serializers.ModelSerializer):
    created_by = UserInfoSerializer(read_only=True)
    updated_by = UserInfoSerializer(read_only=True)
    created_at = serializers.DateTimeField(read_only=True, format="%Y-%m-%d %H:%M:%S")
    updated_at = serializers.DateTimeField(read_only=True, format="%Y-%m-%d %H:%M:%S")

    class Meta:
        model = ManagementCenter
        fields = ['id', 'name', 'is_active', 'created_at', 'updated_at', 'created_by', 'updated_by']
        read_only_fields = ['id', 'created_at', 'updated_at', 'created_by', 'updated_by', 'is_active']

    def validate_name(self, value):
        """Zod-like validation for name field"""
        if not value:
            raise ValidationError({
                'field': 'name',
                'code': 'required',
                'message': 'O campo de registro é obrigatório.'
            })
        
        try:
            return validate_registry_field(value)
        except DjangoValidationError as e:
            if hasattr(e, 'message_dict') and 'name' in e.message_dict:
                error_detail = e.message_dict['name']
                if isinstance(error_detail, dict):
                    raise ValidationError(error_detail)
            # Trata both dict and string error messages
            error_message = e.message_dict if hasattr(e, 'message_dict') else str(e)
            raise ValidationError({
                'field': 'name',
                'code': 'validation_error',
                'message': error_message
            })

    def validate(self, attrs):
        """Cross-field validation"""
        name = attrs.get('name')
        if name:
            # Verifica for duplicates
            existing = ManagementCenter.objects.filter(name=name.upper())
            if self.instance:
                existing = existing.exclude(pk=self.instance.pk)
            
            if existing.exists():
                raise ValidationError({
                    'name': {
                        'field': 'name',
                        'code': 'duplicate',
                        'message': 'Já existe um centro gestor com este registro.'
                    }
                })
        
        return attrs


# Serializer for the models in the centers app
class RequestingCenterSerializer(serializers.ModelSerializer):
    management_center = ManagementCenterSerializer(read_only=True)
    management_center_id = serializers.IntegerField(write_only=True)
    created_by = UserInfoSerializer(read_only=True)
    updated_by = UserInfoSerializer(read_only=True)
    created_at = serializers.DateTimeField(read_only=True, format="%Y-%m-%d %H:%M:%S")
    updated_at = serializers.DateTimeField(read_only=True, format="%Y-%m-%d %H:%M:%S")

    class Meta:
        model = RequestingCenter
        fields = ['id', 'name', 'management_center', 'management_center_id', 'is_active', 'created_at', 'updated_at', 'created_by', 'updated_by']
        read_only_fields = ['id', 'created_at', 'updated_at', 'created_by', 'updated_by', 'is_active']

    def validate_name(self, value):
        """Zod-like validation for name field"""
        if not value:
            raise ValidationError({
                'field': 'name',
                'code': 'required',
                'message': 'O campo de registro é obrigatório.'
            })
        
        try:
            return validate_registry_field(value)
        except DjangoValidationError as e:
            if hasattr(e, 'message_dict') and 'name' in e.message_dict:
                error_detail = e.message_dict['name']
                if isinstance(error_detail, dict):
                    raise ValidationError(error_detail)
            # Trata both dict and string error messages
            error_message = e.message_dict if hasattr(e, 'message_dict') else str(e)
            raise ValidationError({
                'field': 'name',
                'code': 'validation_error',
                'message': error_message
            })

    def validate_management_center_id(self, value):
        """Validate that the management center exists"""
        if not value:
            raise ValidationError({
                'field': 'management_center_id',
                'code': 'required',
                'message': 'O centro gestor é obrigatório.'
            })
        
        try:
            ManagementCenter.objects.get(id=value)
            return value
        except ManagementCenter.DoesNotExist:
            raise ValidationError({
                'field': 'management_center_id',
                'code': 'not_found',
                'message': 'Centro gestor não encontrado.'
            })

    def validate(self, attrs):
        """Cross-field validation"""
        name = attrs.get('name')
        management_center_id = attrs.get('management_center_id')
        
        if name and management_center_id:
            # Verifica for duplicates within the same management center
            existing = RequestingCenter.objects.filter(
                management_center_id=management_center_id,
                name=name.upper()
            )
            if self.instance:
                existing = existing.exclude(pk=self.instance.pk)
            
            if existing.exists():
                raise ValidationError({
                    'name': {
                        'field': 'name',
                        'code': 'duplicate',
                        'message': 'Já existe um centro solicitante com este registro no centro gestor selecionado.'
                    }
                })
        
        return attrs

    def create(self, validated_data):
        management_center_id = validated_data.pop('management_center_id', None)
        if management_center_id:
            try:
                management_center = ManagementCenter.objects.get(id=management_center_id)
                validated_data['management_center'] = management_center
            except ManagementCenter.DoesNotExist:
                raise ValidationError({
                    'management_center_id': {
                        'field': 'management_center_id',
                        'code': 'not_found',
                        'message': 'Centro gestor não encontrado.'
                    }
                })
        return super().create(validated_data)

    def update(self, instance, validated_data):
        management_center_id = validated_data.pop('management_center_id', None)
        if management_center_id:
            try:
                management_center = ManagementCenter.objects.get(id=management_center_id)
                validated_data['management_center'] = management_center
            except ManagementCenter.DoesNotExist:
                raise ValidationError({
                    'management_center_id': {
                        'field': 'management_center_id',
                        'code': 'not_found',
                        'message': 'Centro gestor não encontrado.'
                    }
                })
        return super().update(instance, validated_data)