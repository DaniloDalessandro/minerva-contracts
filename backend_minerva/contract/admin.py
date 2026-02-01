from django.contrib import admin
from .models import Contract, ContractAmendment, ContractInstallment

@admin.register(Contract)
class ContractAdmin(admin.ModelAdmin):
    list_display = ('protocol_number', 'description', 'payment_nature', 'signing_date', 'expiration_date', 'status')
    search_fields = ('protocol_number', 'description')
    list_filter = ('status', 'payment_nature')
    readonly_fields = ('created_at', 'updated_at', 'protocol_number', 'get_created_by', 'get_updated_by')

    @admin.display(description='Criado por')
    def get_created_by(self, obj):
        return obj.created_by

    @admin.display(description='Atualizado por')
    def get_updated_by(self, obj):
        return obj.updated_by

    def save_model(self, request, obj, form, change):
        if not obj.pk:
            obj.created_by = request.user
        obj.updated_by = request.user
        super().save_model(request, obj, form, change)


@admin.register(ContractInstallment)
class ContractInstallmentAdmin(admin.ModelAdmin):
    list_display = ('contract', 'number', 'value', 'due_date', 'payment_date', 'status')
    search_fields = ('contract__protocol_number', 'contract__description')
    list_filter = ('status', 'due_date')
    readonly_fields = ('created_at', 'updated_at', 'get_created_by', 'get_updated_by')

    @admin.display(description='Criado por')
    def get_created_by(self, obj):
        return obj.created_by

    @admin.display(description='Atualizado por')
    def get_updated_by(self, obj):
        return obj.updated_by

    def save_model(self, request, obj, form, change):
        if not obj.pk:
            obj.created_by = request.user
        obj.updated_by = request.user
        super().save_model(request, obj, form, change)


@admin.register(ContractAmendment)
class ContractAmendmentAdmin(admin.ModelAdmin):
    list_display = ('contract', 'description', 'type', 'value', 'additional_term')
    search_fields = ('contract__protocol_number', 'description')
    list_filter = ('type',)
    readonly_fields = ('created_at', 'updated_at', 'get_created_by', 'get_updated_by')

    @admin.display(description='Criado por')
    def get_created_by(self, obj):
        return obj.created_by

    @admin.display(description='Atualizado por')
    def get_updated_by(self, obj):
        return obj.updated_by

    def save_model(self, request, obj, form, change):
        if not obj.pk:
            obj.created_by = request.user
        obj.updated_by = request.user
        super().save_model(request, obj, form, change)
