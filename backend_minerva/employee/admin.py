from django.contrib import admin
from .models import Employee

@admin.register(Employee)
class EmployeeAdmin(admin.ModelAdmin):
    list_display = ('full_name', 'email', 'cpf', 'status')
    list_display_links = ('full_name',)
    readonly_fields = ('created_by', 'updated_by', 'created_at', 'updated_at')
    
    fieldsets = (
        ('Informações Pessoais', {
            'fields': ('full_name', 'email', 'phone', 'cpf', 'birth_date', 'status')
        }),
        ('Informações Funcionais', {
            'fields': ('employee_id', 'position', 'department', 'admission_date')
        }),
        ('Estrutura Organizacional', {
            'fields': ('direction', 'management', 'coordination')
        }),
        ('Endereço', {
            'fields': ('street', 'city', 'state', 'postal_code'),
            'classes': ('collapse',)
        }),
        ('Dados Bancários', {
            'fields': ('bank_name', 'bank_agency', 'bank_account'),
            'classes': ('collapse',)
        }),
        ('Auditoria', {
            'fields': ('created_by', 'updated_by', 'created_at', 'updated_at'),
            'classes': ('collapse',),
            'description': 'Informações de auditoria do registro.'
        }),
    )

    def save_model(self, request, obj, form, change):
        if not obj.pk:
            obj.created_by = request.user
        obj.updated_by = request.user
        super().save_model(request, obj, form, change)

