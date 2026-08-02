from django.urls import path
from . import views

urlpatterns = [
    path('shares/', views.ShareListCreateView.as_view(), name='share-list-create'),
    path('shares/<int:pk>/', views.ShareDetailView.as_view(), name='share-detail'),
    path('notifications/', views.ShareNotificationListView.as_view(), name='share-notification-list'),
    path('notifications/<int:pk>/mark-read/', views.ShareNotificationMarkReadView.as_view(), name='share-notification-mark-read'),
    path('notifications/mark-all-read/', views.ShareNotificationMarkAllReadView.as_view(), name='share-notification-mark-all-read'),
    path('users/search/', views.UserSearchView.as_view(), name='share-user-search'),
    path('resources/search/', views.ResourceSearchView.as_view(), name='share-resource-search'),
]
