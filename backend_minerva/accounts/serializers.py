from rest_framework import serializers
from django.contrib.auth import get_user_model, authenticate
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.models import Group
from .utils.messages import LOGIN_MESSAGES
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

User = get_user_model()

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        # Adiciona informações extras ao token incluindo dados do funcionário
        token['email'] = user.email
        token['id'] = user.id
        
        if hasattr(user, 'employee') and user.employee:
            token['name'] = user.employee.full_name
            token['cpf'] = user.employee.cpf
            token['employee_id'] = user.employee.id
        else:
            token['name'] = user.first_name or user.email
            token['cpf'] = None
            token['employee_id'] = None

        return token

    def validate(self, attrs):
        data = super().validate(attrs)

        # Adiciona dados completos do usuário na resposta incluindo funcionário
        user_data = {
            'id': self.user.id,
            'email': self.user.email,
        }
        
        if hasattr(self.user, 'employee') and self.user.employee:
            user_data.update({
                'name': self.user.employee.full_name,
                'cpf': self.user.employee.cpf,
                'employee_id': self.user.employee.id,
                'full_display': f"{self.user.employee.full_name} - {self.user.employee.cpf}",
                'hierarchy_info': {
                    'direction': self.user.employee.direction.name if self.user.employee.direction else None,
                    'management': self.user.employee.management.name if self.user.employee.management else None,
                    'coordination': self.user.employee.coordination.name if self.user.employee.coordination else None,
                }
            })
        else:
            user_data.update({
                'name': self.user.first_name or self.user.email,
                'cpf': None,
                'employee_id': None,
                'full_display': self.user.email,
                'hierarchy_info': {}
            })

        # Adicionar grupos do usuário
        user_data['groups'] = [group.name for group in self.user.groups.all()]
        
        data['user'] = user_data
        return data

class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        try:
            user = User.objects.get(email=data['email'])
        except User.DoesNotExist:
            raise serializers.ValidationError(LOGIN_MESSAGES['invalid_credentials'])

        if not user.check_password(data['password']):
            raise serializers.ValidationError(LOGIN_MESSAGES['invalid_credentials'])

        if not user.is_active:
            raise serializers.ValidationError("Usuário inativo.")  # você pode criar uma msg específica se quiser

        return {'user': user}



# -------------------------------
class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ('id', 'email', 'password', 'password2', 'first_name', 'last_name')

    def validate(self, data):
        if data['password'] != data['password2']:
            raise serializers.ValidationError({"password": "As senhas não coincidem."})
        return data

    def create(self, validated_data):
        validated_data.pop('password2')
        user = User.objects.create_user(**validated_data)
        return user

# -------------------------------
class PasswordResetSerializer(serializers.Serializer):
    email = serializers.EmailField()

# -------------------------------
class PasswordResetConfirmSerializer(serializers.Serializer):
    uidb64 = serializers.CharField()
    token = serializers.CharField()
    password = serializers.CharField(write_only=True, validators=[validate_password])

# -------------------------------
class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, validators=[validate_password])

# -------------------------------
class ProfileUpdateSerializer(serializers.ModelSerializer):
    # Campos do Employee
    full_name = serializers.CharField(required=False, write_only=True)
    cpf = serializers.CharField(required=False, write_only=True)
    phone = serializers.CharField(required=False, allow_blank=True, write_only=True)
    direction_id = serializers.IntegerField(required=False, allow_null=True, write_only=True)
    management_id = serializers.IntegerField(required=False, allow_null=True, write_only=True)
    coordination_id = serializers.IntegerField(required=False, allow_null=True, write_only=True)

    class Meta:
        model = User
        fields = ('first_name', 'last_name', 'email', 'full_name', 'cpf', 'phone', 'direction_id', 'management_id', 'coordination_id')
        read_only_fields = ('email',)

    def update(self, instance, validated_data):
        # Extrair dados do Employee
        employee_data = {}
        for field in ['full_name', 'cpf', 'phone', 'direction_id', 'management_id', 'coordination_id']:
            if field in validated_data:
                employee_data[field] = validated_data.pop(field)

        # Atualizar User
        instance = super().update(instance, validated_data)

        # Atualizar Employee se existir e houver dados
        if instance.employee and employee_data:
            employee = instance.employee
            for field, value in employee_data.items():
                setattr(employee, field, value)
            employee.save()

        return instance

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if instance.employee:
            data['full_name'] = instance.employee.full_name
            data['cpf'] = instance.employee.cpf
            data['phone'] = instance.employee.phone
            data['direction_id'] = instance.employee.direction_id
            data['management_id'] = instance.employee.management_id
            data['coordination_id'] = instance.employee.coordination_id
            data['direction_name'] = instance.employee.direction.name if instance.employee.direction else None
            data['management_name'] = instance.employee.management.name if instance.employee.management else None
            data['coordination_name'] = instance.employee.coordination.name if instance.employee.coordination else None
        return data


class UserSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()
    cpf = serializers.SerializerMethodField()
    full_display = serializers.SerializerMethodField()
    employee_id = serializers.SerializerMethodField()
    hierarchy_info = serializers.SerializerMethodField()
    groups = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'name', 'cpf', 'email', 'full_display', 'employee_id', 'hierarchy_info', 'groups', 'is_active']
    
    def get_name(self, obj):
        """Retorna o nome do funcionário ou email se não houver funcionário associado"""
        if hasattr(obj, 'employee') and obj.employee:
            return obj.employee.full_name
        return obj.first_name or obj.email
    
    def get_cpf(self, obj):
        """Retorna o CPF do funcionário associado"""
        if hasattr(obj, 'employee') and obj.employee:
            return obj.employee.cpf
        return None
    
    def get_full_display(self, obj):
        """Retorna nome completo concatenado com CPF"""
        if hasattr(obj, 'employee') and obj.employee:
            return f"{obj.employee.full_name} - {obj.employee.cpf}"
        return obj.email
    
    def get_employee_id(self, obj):
        """Retorna o ID do funcionário associado"""
        if hasattr(obj, 'employee') and obj.employee:
            return obj.employee.id
        return None
    
    def get_hierarchy_info(self, obj):
        """Retorna informações hierárquicas do funcionário"""
        if hasattr(obj, 'employee') and obj.employee:
            return {
                'direction': obj.employee.direction.name if obj.employee.direction else None,
                'management': obj.employee.management.name if obj.employee.management else None,
                'coordination': obj.employee.coordination.name if obj.employee.coordination else None,
            }
        return {}
    
    def get_groups(self, obj):
        """Retorna os grupos hierárquicos do usuário"""
        return [group.name for group in obj.groups.all()]
