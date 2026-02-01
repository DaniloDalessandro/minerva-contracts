from django.urls import path
from .views import (
    BudgetListView, BudgetCreateView, BudgetDetailView,
    BudgetUpdateView, BudgetDeleteView,
    BudgetMovementListView, BudgetMovementCreateView,
    BudgetMovementDetailView, BudgetMovementUpdateView,
    BudgetMovementDeleteView, budget_form_metadata,
    generate_budget_report_pdf, generate_budget_summary_report_pdf
)

urlpatterns = [
    # Budget URLs
    path('budgets/', BudgetListView.as_view(), name='budget-list'),
    path('budgets/create/', BudgetCreateView.as_view(), name='budget-create'),
    path('budgets/<int:pk>/', BudgetDetailView.as_view(), name='budget-detail'),
    path('budgets/<int:pk>/update/', BudgetUpdateView.as_view(), name='budget-update'),
    path('budgets/<int:pk>/delete/', BudgetDeleteView.as_view(), name='budget-delete'),

    # Budget Movement URLs
    path('movements/', BudgetMovementListView.as_view(), name='movement-list'),
    path('movements/create/', BudgetMovementCreateView.as_view(), name='movement-create'),
    path('movements/<int:pk>/', BudgetMovementDetailView.as_view(), name='movement-detail'),
    path('movements/<int:pk>/update/', BudgetMovementUpdateView.as_view(), name='movement-update'),
    path('movements/<int:pk>/delete/', BudgetMovementDeleteView.as_view(), name='movement-delete'),
    
    # Utility URLs for forms
    path('form-metadata/', budget_form_metadata, name='budget-form-metadata'),
    
    # PDF Report URLs
    path('budgets/<int:budget_id>/report/pdf/', generate_budget_report_pdf, name='budget-report-pdf'),
    path('budgets/summary/pdf/', generate_budget_summary_report_pdf, name='budget-summary-pdf'),
]
