from rest_framework import serializers
from .models import ContractNotification


class ContractNotificationSerializer(serializers.ModelSerializer):
    contract_protocol = serializers.CharField(
        source='contract.protocol_number', read_only=True
    )
    contract_description = serializers.CharField(
        source='contract.description', read_only=True
    )
    contract_expiration_date = serializers.DateField(
        source='contract.expiration_date', read_only=True
    )
    days_until_expiration = serializers.SerializerMethodField()

    class Meta:
        model = ContractNotification
        fields = [
            'id',
            'contract',
            'contract_protocol',
            'contract_description',
            'contract_expiration_date',
            'days_until_expiration',
            'notification_type',
            'is_read',
            'read_at',
            'email_sent_at',
            'email_recipients',
            'created_at',
        ]
        read_only_fields = fields

    def get_days_until_expiration(self, obj):
        from django.utils import timezone
        if obj.contract.expiration_date:
            delta = obj.contract.expiration_date - timezone.now().date()
            return delta.days
        return None
