from django.contrib import admin
from .models import ContractNotification


@admin.register(ContractNotification)
class ContractNotificationAdmin(admin.ModelAdmin):
    list_display = [
        'contract', 'notification_type', 'cycle_month',
        'is_read', 'email_sent_at', 'created_at',
    ]
    list_filter = ['notification_type', 'is_read', 'cycle_month']
    search_fields = ['contract__protocol_number', 'contract__description']
    readonly_fields = ['created_at', 'read_at', 'email_sent_at', 'email_recipients', 'email_error']
    ordering = ['-created_at']
