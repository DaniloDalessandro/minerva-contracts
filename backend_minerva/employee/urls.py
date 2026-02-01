from django.urls import path
from .views import (
    EmployeeListView,
    EmployeeCreateView,
    EmployeeRetrieveView,
    EmployeeUpdateView,
    EmployeeToggleStatusView,
)

urlpatterns = [
    path('', EmployeeListView.as_view(), name='employee-list'),
    path('create/', EmployeeCreateView.as_view(), name='employee-create'),
    path('<int:pk>/', EmployeeRetrieveView.as_view(), name='employee-retrieve'),
    path('<int:pk>/update/', EmployeeUpdateView.as_view(), name='employee-update'),
    path('<int:pk>/toggle-status/', EmployeeToggleStatusView.as_view(), name='employee-toggle-status'),
]
