from django.contrib import admin
from budgetline.models import BudgetLine, BudgetLineMovement, BudgetLineVersion

class BudgetLineAdmin(admin.ModelAdmin):
    list_display = ('budget', 'category', 'expense_type', 'management_center', 'requesting_center', 'summary_description', 'object', 'created_by', 'updated_by', 'created_at', 'updated_at')  
    readonly_fields = ('created_by', 'updated_by', 'created_at', 'updated_at')  

    def save_model(self, request, obj, form, change):
        if not obj.pk: 
            obj.created_by = request.user
        obj.updated_by = request.user
        super().save_model(request, obj, form, change)

admin.site.register(BudgetLine, BudgetLineAdmin)



class BudgetLineMovementAdmin(admin.ModelAdmin):
    list_display = ('source_line', 'destination_line','movement_amount', 'created_by', 'updated_by', 'created_at', 'updated_at')  
    readonly_fields = ('created_by', 'updated_by', 'created_at', 'updated_at')  

    def save_model(self, request, obj, form, change):
        if not obj.pk: 
            obj.created_by = request.user
        obj.updated_by = request.user
        super().save_model(request, obj, form, change)

admin.site.register(BudgetLineMovement, BudgetLineMovementAdmin)


class BudgetLineVersionAdmin(admin.ModelAdmin):
    list_display = (
        'budget_line', 
        'version_number', 
        'summary_description', 
        'budgeted_amount',
        'change_reason',
        'created_by', 
        'created_at'
    )
    list_filter = (
        'budget_line', 
        'category',
        'expense_type',
        'management_center',
        'contract_status',
        'process_status',
        'created_at'
    )
    search_fields = (
        'budget_line__summary_description',
        'summary_description',
        'change_reason'
    )
    readonly_fields = (
        'budget_line',
        'version_number',
        'created_by', 
        'created_at'
    )
    
    fieldsets = (
        ('Informações da Versão', {
            'fields': (
                'budget_line',
                'version_number',
                'change_reason'
            )
        }),
        ('Dados da Linha Orçamentária', {
            'fields': (
                'category',
                'expense_type',
                'management_center',
                'requesting_center',
                'summary_description',
                'object',
                'budget_classification',
                'budgeted_amount'
            )
        }),
        ('Informações de Contrato', {
            'fields': (
                'contract_type',
                'probable_procurement_type',
                'main_fiscal',
                'secondary_fiscal',
                'process_status',
                'contract_status',
                'contract_notes'
            )
        }),
        ('Auditoria', {
            'classes': ('collapse',),
            'fields': (
                'created_by',
                'created_at'
            )
        })
    )

    def save_model(self, request, obj, form, change):
        if not obj.pk:
            obj.created_by = request.user
        super().save_model(request, obj, form, change)

admin.site.register(BudgetLineVersion, BudgetLineVersionAdmin)