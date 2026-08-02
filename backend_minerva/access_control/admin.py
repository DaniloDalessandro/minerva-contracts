from django.contrib import admin

from .models import Action, AccessGrant, AuditLog, Membership, OrganizationalUnit, Role


@admin.register(OrganizationalUnit)
class OrganizationalUnitAdmin(admin.ModelAdmin):
    list_display = ("name", "unit_type", "parent", "is_active", "path")
    list_filter = ("unit_type", "is_active")
    search_fields = ("name", "code")
    readonly_fields = ("path",)


@admin.register(Action)
class ActionAdmin(admin.ModelAdmin):
    list_display = ("label", "code")
    search_fields = ("label", "code")


@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    list_display = ("name", "code", "is_active")
    filter_horizontal = ("actions",)
    search_fields = ("name", "code")


@admin.register(Membership)
class MembershipAdmin(admin.ModelAdmin):
    list_display = ("user", "organizational_unit", "role", "start_date", "end_date", "is_active")
    list_filter = ("is_active", "role")
    search_fields = ("user__email", "organizational_unit__name")


@admin.register(AccessGrant)
class AccessGrantAdmin(admin.ModelAdmin):
    list_display = (
        "id", "resource", "target_user", "target_role", "target_organizational_unit",
        "permission_level", "start_date", "end_date", "is_active",
    )
    list_filter = ("is_active", "permission_level")


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ("created_at", "actor", "action", "target")
    list_filter = ("action",)
    readonly_fields = [f.name for f in AuditLog._meta.fields]

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False
