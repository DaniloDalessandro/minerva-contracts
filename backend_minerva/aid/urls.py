from django.urls import path
from .views import(
    AidListAPIView,
    AidCreateAPIView,
    AidRetrieveAPIView,
    AidUpdateAPIView,
    AidDestroyAPIView,
)
    

urlpatterns = [
    path('aid/', AidListAPIView.as_view(), name='aid-list'),
    path('aid/create/', AidCreateAPIView.as_view(), name='aid-create'),
    path('aid/<int:pk>/', AidRetrieveAPIView.as_view(), name='aid-retrieve'),
    path('aid/update/<int:pk>/', AidUpdateAPIView.as_view(), name='aid-update'),
    path('aid/delete/<int:pk>/', AidDestroyAPIView.as_view(), name='aid-destroy'),
]