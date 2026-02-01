from django.contrib import admin
from django.urls import path, include
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView, SpectacularRedocView

urlpatterns = [
    path('admin/', admin.site.urls),

    # API Documentation
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),

    # API Endpoints
    path('api/v1/accounts/', include('accounts.urls')),
    path('api/v1/sector/', include('sector.urls')),
    path('api/v1/employee/', include('employee.urls')),
    path('api/v1/center/', include('center.urls')),
    path('api/v1/budget/', include('budget.urls')),
    path('api/v1/budgetline/', include('budgetline.urls')),
    path('api/v1/aid/', include('aid.urls')),
    path('api/v1/contract/', include('contract.urls')),
    path('api/v1/alice/', include('ai_assistant.urls')),

]