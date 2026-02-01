from django.urls import path
from . import views

urlpatterns = [
    # Direções
    path('directions/', views.DirectionListView.as_view(), name='direction-list'),
    path('directions/create/', views.DirectionCreateView.as_view(), name='direction-create'),
    path('directions/<int:pk>/', views.DirectionDetailView.as_view(), name='direction-detail'),
    path('directions/<int:pk>/update/', views.DirectionUpdateView.as_view(), name='direction-update'),
    path('directions/<int:pk>/delete/', views.DirectionDeleteView.as_view(), name='direction-delete'),

    # Gerências
    path('managements/', views.ManagementListView.as_view(), name='management-list'),
    path('managements/create/', views.ManagementCreateView.as_view(), name='management-create'),
    path('managements/<int:pk>/', views.ManagementDetailView.as_view(), name='management-detail'),
    path('managements/<int:pk>/update/', views.ManagementUpdateView.as_view(), name='management-update'),
    path('managements/<int:pk>/delete/', views.ManagementDeleteView.as_view(), name='management-delete'),

    # Coordenações
    path('coordinations/', views.CoordinationListView.as_view(), name='coordination-list'),
    path('coordinations/create/', views.CoordinationCreateView.as_view(), name='coordination-create'),
    path('coordinations/<int:pk>/', views.CoordinationDetailView.as_view(), name='coordination-detail'),
    path('coordinations/<int:pk>/update/', views.CoordinationUpdateView.as_view(), name='coordination-update'),
    path('coordinations/<int:pk>/delete/', views.CoordinationDeleteView.as_view(), name='coordination-delete'),
]
