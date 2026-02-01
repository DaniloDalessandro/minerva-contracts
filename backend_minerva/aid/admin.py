from django.contrib import admin
from aid.models import Assistance

class AssistanceAdmin(admin.ModelAdmin):
    list_display = ('employee', 'budget_line', 'type', 'total_amount', 'installment_count', 'amount_per_installment', 'start_date', 'end_date', 'status', 'created_by', 'updated_by', 'created_at', 'updated_at')
    readonly_fields = ('created_by', 'updated_by', 'created_at', 'updated_at')
    search_fields = ['employee__name', 'budget_line__name', 'type', 'status']

    def save_model(self, request, obj, form, change):
        if not obj.pk: 
            obj.created_by = request.user
        obj.updated_by = request.user
        super().save_model(request, obj, form, change)

admin.site.register(Assistance, AssistanceAdmin)