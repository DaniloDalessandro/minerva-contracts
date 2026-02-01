from django.urls import path
from .views import (
    ManagementCenterListView,
    ManagementCenterCreateView,
    ManagementCenterDetailView,
    ManagementCenterUpdateView,
    ManagementCenterDeleteView,
    RequestingCenterListView,
    RequestingCenterCreateView,
    RequestingCenterDetailView,
    RequestingCenterUpdateView,
    RequestingCenterDeleteView,
)

app_name = 'cost_center'

urlpatterns = [
    # Managing Centers
    path('management-centers/', ManagementCenterListView.as_view(), name='management-center-list'),
    path('management-centers/create/', ManagementCenterCreateView.as_view(), name='management-center-create'),
    path('management-centers/<int:pk>/', ManagementCenterDetailView.as_view(), name='management-center-detail'),
    path('management-centers/<int:pk>/update/', ManagementCenterUpdateView.as_view(), name='management-center-update'),
    path('management-centers/<int:pk>/delete/', ManagementCenterDeleteView.as_view(), name='management-center-delete'),

    # Requesting Centers
    path('requesting-centers/', RequestingCenterListView.as_view(), name='requesting-center-list'),
    path('requesting-centers/create/', RequestingCenterCreateView.as_view(), name='requesting-center-create'),
    path('requesting-centers/<int:pk>/', RequestingCenterDetailView.as_view(), name='requesting-center-detail'),
    path('requesting-centers/<int:pk>/update/', RequestingCenterUpdateView.as_view(), name='requesting-center-update'),
    path('requesting-centers/<int:pk>/delete/', RequestingCenterDeleteView.as_view(), name='requesting-center-delete'),
]
