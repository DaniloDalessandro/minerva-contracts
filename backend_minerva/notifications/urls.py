from django.urls import path
from . import views

urlpatterns = [
    path('contract-expiration/', views.ContractNotificationListView.as_view(), name='contract-notifications-list'),
    path('contract-expiration/<int:pk>/mark-read/', views.mark_notification_read, name='notification-mark-read'),
    path('contract-expiration/mark-all-read/', views.mark_all_read, name='notifications-mark-all-read'),
    path('contract-expiration/trigger-check/', views.trigger_expiration_check, name='notifications-trigger-check'),
]
