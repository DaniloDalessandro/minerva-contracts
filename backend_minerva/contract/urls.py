from django.urls import path

from .views import (
    ContractListAPIView, ContractCreateAPIView, ContractRetrieveAPIView,
    ContractUpdateAPIView, ContractDestroyAPIView, ContractToggleStatusAPIView,
    ContractInstallmentListAPIView, ContractInstallmentCreateAPIView,
    ContractInstallmentRetrieveAPIView, ContractInstallmentUpdateAPIView,
    ContractInstallmentDestroyAPIView, ContractAmendmentListAPIView,
    ContractAmendmentCreateAPIView, ContractAmendmentRetrieveAPIView,
    ContractAmendmentUpdateAPIView, ContractAmendmentDestroyAPIView
)

urlpatterns = [
    path('contracts/', ContractListAPIView.as_view(), name='contract-list'),
    path('contracts/create/', ContractCreateAPIView.as_view(), name='contract-create'),
    path('contracts/<int:pk>/', ContractRetrieveAPIView.as_view(), name='contract-detail'),
    path('contracts/<int:pk>/update/', ContractUpdateAPIView.as_view(), name='contract-update'),
    path('contracts/<int:pk>/delete/', ContractDestroyAPIView.as_view(), name='contract-delete'),
    path('contracts/<int:pk>/toggle-status/', ContractToggleStatusAPIView.as_view(), name='contract-toggle-status'),

    path('contract-installments/', ContractInstallmentListAPIView.as_view(), name='contract-installment-list'),
    path('contract-installments/create/', ContractInstallmentCreateAPIView.as_view(), name='contract-installment-create'),
    path('contract-installments/<int:pk>/', ContractInstallmentRetrieveAPIView.as_view(), name='contract-installment-detail'),
    path('contract-installments/<int:pk>/update/', ContractInstallmentUpdateAPIView.as_view(), name='contract-installment-update'),
    path('contract-installments/<int:pk>/delete/', ContractInstallmentDestroyAPIView.as_view(), name='contract-installment-delete'),
    
    path('contract-amendments/', ContractAmendmentListAPIView.as_view(), name='contract-amendment-list'),
    path('contract-amendments/create/', ContractAmendmentCreateAPIView.as_view(), name='contract-amendment-create'),
    path('contract-amendments/<int:pk>/', ContractAmendmentRetrieveAPIView.as_view(), name='contract-amendment-detail'),
    path('contract-amendments/<int:pk>/update/', ContractAmendmentUpdateAPIView.as_view(), name='contract-amendment-update'),
    path('contract-amendments/<int:pk>/delete/', ContractAmendmentDestroyAPIView.as_view(), name='contract-amendment-delete'),
]