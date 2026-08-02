from django.contrib import admin
from .models import ResourceShare, ShareNotification


@admin.register(ResourceShare)
class ResourceShareAdmin(admin.ModelAdmin):
    list_display = ['id', 'resource_type', 'resource_id', 'resource_name', 'owner', 'invited_email', 'permission_type', 'status', 'created_at']
    list_filter = ['resource_type', 'permission_type', 'status']
    search_fields = ['invited_email', 'resource_name']
    readonly_fields = ['created_at', 'updated_at', 'accepted_at']


@admin.register(ShareNotification)
class ShareNotificationAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'notification_type', 'title', 'is_read', 'created_at']
    list_filter = ['notification_type', 'is_read']
    search_fields = ['user__email', 'title']
    readonly_fields = ['created_at', 'read_at']
