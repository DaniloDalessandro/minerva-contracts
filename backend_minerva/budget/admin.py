from django.contrib import admin
from .models import Budget, BudgetMovement


@admin.register(Budget)
class BudgetAdmin(admin.ModelAdmin):
    list_display = (
        'year',
        'category',
        'management_center',
        'total_amount',
        'available_amount',
        'status',
        'created_by',
        'updated_by',
        'created_at',
        'updated_at',
    )
    list_filter = (
        'year',
        'category',
        'management_center',
        'status',
    )
    search_fields = (
        'management_center__name',
    )
    readonly_fields = (
        'created_by',
        'updated_by',
        'created_at',
        'updated_at',
    )
    fieldsets = (
        (None, {
            'fields': (
                'year',
                'category',
                'management_center',
                'total_amount',
                'available_amount',
                'status',
            )
        }),
        ('Auditoria', {
            'classes': ('collapse',),
            'fields': (
                'created_by',
                'updated_by',
                'created_at',
                'updated_at',
            )
        }),
    )

    def save_model(self, request, obj, form, change):
        if not obj.pk:
            obj.created_by = request.user
        obj.updated_by = request.user
        super().save_model(request, obj, form, change)


@admin.register(BudgetMovement)
class BudgetMovementAdmin(admin.ModelAdmin):
    list_display = (
        'source',
        'destination',
        'amount',
        'movement_date',
        'created_by',
        'updated_by',
        'created_at',
        'updated_at',
    )
    list_filter = (
        'movement_date',
        'source',
        'destination',
    )
    search_fields = (
        'source__management_center__name',
        'destination__management_center__name',
        'notes',
    )
    readonly_fields = (
        'created_by',
        'updated_by',
        'movement_date',
        'created_at',
        'updated_at',
    )
    fieldsets = (
        (None, {
            'fields': (
                'source',
                'destination',
                'amount',
                'notes',
            )
        }),
        ('Auditoria', {
            'classes': ('collapse',),
            'fields': (
                'created_by',
                'updated_by',
                'movement_date',
                'created_at',
                'updated_at',
            )
        }),
    )

    def save_model(self, request, obj, form, change):
        if not obj.pk:
            obj.created_by = request.user
        obj.updated_by = request.user
        super().save_model(request, obj, form, change)
