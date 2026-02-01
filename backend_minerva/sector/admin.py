from django.contrib import admin
from .models import Direction, Management, Coordination

@admin.register(Direction)
class DirectionAdmin(admin.ModelAdmin):
    list_display = ('name', 'get_created_by', 'get_updated_by', 'created_at', 'updated_at')
    readonly_fields = ('created_by', 'updated_by')
    search_fields = ('name',)
    
    def save_model(self, request, obj, form, change):
        if not obj.pk:
            obj.created_by = request.user
        obj.updated_by = request.user
        super().save_model(request, obj, form, change)

    def get_created_by(self, obj):
        return getattr(obj.created_by, 'email', '-')
    get_created_by.short_description = 'Criado por'

    def get_updated_by(self, obj):
        return getattr(obj.updated_by, 'email', '-')
    get_updated_by.short_description = 'Atualizado por'


@admin.register(Management)
class ManagementAdmin(admin.ModelAdmin):
    list_display = ('name', 'direction', 'get_created_by', 'get_updated_by', 'created_at', 'updated_at')
    readonly_fields = ('created_by', 'updated_by')
    search_fields = ('name',)
    list_filter = ('direction',)

    def save_model(self, request, obj, form, change):
        if not obj.pk:
            obj.created_by = request.user
        obj.updated_by = request.user
        super().save_model(request, obj, form, change)

    def get_created_by(self, obj):
        return getattr(obj.created_by, 'email', '-')
    get_created_by.short_description = 'Criado por'

    def get_updated_by(self, obj):
        return getattr(obj.updated_by, 'email', '-')
    get_updated_by.short_description = 'Atualizado por'


@admin.register(Coordination)
class CoordinationAdmin(admin.ModelAdmin):
    list_display = ('name', 'management', 'get_created_by', 'get_updated_by', 'created_at', 'updated_at')
    readonly_fields = ('created_by', 'updated_by')
    search_fields = ('name',)
    list_filter = ('management',)

    def save_model(self, request, obj, form, change):
        if not obj.pk:
            obj.created_by = request.user
        obj.updated_by = request.user
        super().save_model(request, obj, form, change)

    def get_created_by(self, obj):
        return getattr(obj.created_by, 'email', '-')
    get_created_by.short_description = 'Criado por'

    def get_updated_by(self, obj):
        return getattr(obj.updated_by, 'email', '-')
    get_updated_by.short_description = 'Atualizado por'
