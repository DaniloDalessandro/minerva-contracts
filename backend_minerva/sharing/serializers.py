from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import ResourceShare, ShareNotification

User = get_user_model()

VALID_PERMISSIONS_BY_TYPE = {
    'BUDGET': ['VIEW', 'CREATE_BUDGET_LINES'],
    'BUDGET_LINE': ['VIEW', 'CREATE_CONTRACTS'],
    'CONTRACT': ['VIEW'],
}


class ResourceShareCreateSerializer(serializers.Serializer):
    resource_type = serializers.ChoiceField(choices=['BUDGET', 'BUDGET_LINE', 'CONTRACT'])
    resource_id = serializers.IntegerField(min_value=1)
    invited_email = serializers.EmailField()
    permission_type = serializers.ChoiceField(
        choices=['VIEW', 'CREATE_BUDGET_LINES', 'CREATE_CONTRACTS'],
        default='VIEW',
    )
    message = serializers.CharField(required=False, allow_blank=True, default='')

    def validate(self, data):
        resource_type = data['resource_type']
        permission_type = data['permission_type']
        valid = VALID_PERMISSIONS_BY_TYPE.get(resource_type, ['VIEW'])
        if permission_type not in valid:
            raise serializers.ValidationError(
                f"Para {resource_type}, as permissões válidas são: {', '.join(valid)}."
            )
        return data

    def validate_invited_email(self, value):
        request = self.context.get('request')
        if request and request.user.email == value:
            raise serializers.ValidationError("Você não pode compartilhar com você mesmo.")
        return value


class ResourceShareListSerializer(serializers.ModelSerializer):
    owner_name = serializers.SerializerMethodField()
    invited_user_name = serializers.SerializerMethodField()
    permission_label = serializers.SerializerMethodField()
    resource_type_label = serializers.SerializerMethodField()
    status_label = serializers.SerializerMethodField()

    class Meta:
        model = ResourceShare
        fields = [
            'id', 'resource_type', 'resource_type_label', 'resource_id', 'resource_name',
            'owner', 'owner_name',
            'invited_user', 'invited_user_name', 'invited_email',
            'permission_type', 'permission_label',
            'status', 'status_label',
            'message', 'accepted_at', 'expires_at',
            'created_at', 'updated_at',
        ]

    def get_owner_name(self, obj):
        if obj.owner and obj.owner.employee_id:
            try:
                return obj.owner.employee.full_name
            except Exception:
                pass
        return obj.owner.email if obj.owner else ''

    def get_invited_user_name(self, obj):
        if obj.invited_user:
            if obj.invited_user.employee_id:
                try:
                    return obj.invited_user.employee.full_name
                except Exception:
                    pass
            return obj.invited_user.email
        return ''

    def get_permission_label(self, obj):
        return dict(ResourceShare.PERMISSION_TYPE_CHOICES).get(obj.permission_type, obj.permission_type)

    def get_resource_type_label(self, obj):
        return dict(ResourceShare.RESOURCE_TYPE_CHOICES).get(obj.resource_type, obj.resource_type)

    def get_status_label(self, obj):
        return dict(ResourceShare.STATUS_CHOICES).get(obj.status, obj.status)


class ShareNotificationSerializer(serializers.ModelSerializer):
    notification_type_label = serializers.SerializerMethodField()
    resource_type = serializers.SerializerMethodField()
    resource_name = serializers.SerializerMethodField()

    class Meta:
        model = ShareNotification
        fields = [
            'id', 'notification_type', 'notification_type_label',
            'title', 'message',
            'is_read', 'read_at', 'created_at',
            'share', 'resource_type', 'resource_name',
        ]

    def get_notification_type_label(self, obj):
        return obj.get_notification_type_display()

    def get_resource_type(self, obj):
        return obj.share.resource_type if obj.share_id else ''

    def get_resource_name(self, obj):
        return obj.share.resource_name if obj.share_id else ''
