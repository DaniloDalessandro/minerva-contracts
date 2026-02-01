from rest_framework import serializers
from .models import Employee
from sector.models import Direction, Management, Coordination
from accounts.models import User

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name']

class DirectionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Direction
        fields = ['id', 'name']

class ManagementSerializer(serializers.ModelSerializer):
    direction = DirectionSerializer(read_only=True)
    
    class Meta:
        model = Management
        fields = ['id', 'name', 'direction']

class CoordinationSerializer(serializers.ModelSerializer):
    management = ManagementSerializer(read_only=True)
    
    class Meta:
        model = Coordination
        fields = ['id', 'name', 'management']

class EmployeeWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Employee
        fields = [
            'id', 'full_name', 'cpf', 'email', 'phone', 'admission_date',
            'direction', 'management', 'coordination', 'status',
            'created_at', 'updated_at', 'created_by', 'updated_by'
        ]
        read_only_fields = ('created_by', 'updated_by')

class EmployeeSerializer(serializers.ModelSerializer):
    direction = DirectionSerializer(read_only=True)
    management = ManagementSerializer(read_only=True)
    coordination = CoordinationSerializer(read_only=True)
    created_by = UserSerializer(read_only=True)
    updated_by = UserSerializer(read_only=True)

    class Meta:
        model = Employee
        fields = [
            'id', 'full_name', 'cpf', 'email', 'phone', 'admission_date',
            'direction', 'management', 'coordination', 'status',
            'created_at', 'updated_at', 'created_by', 'updated_by'
        ]
        read_only_fields = ('created_by', 'updated_by')

