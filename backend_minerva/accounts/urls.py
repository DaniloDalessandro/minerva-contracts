from django.urls import path
from rest_framework.authtoken.views import obtain_auth_token
from .views import (
    LoginView,
    LogoutView,
    RegisterView,
    PasswordResetView,
    PasswordResetConfirmView,
    ChangePasswordView,
    ProfileUpdateView,
    UserMeView,
    CustomTokenObtainPairView,
)

from rest_framework_simplejwt.views import (
    TokenRefreshView,
    TokenVerifyView,
)

urlpatterns = [
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('register/', RegisterView.as_view(), name='register'),
    path('password-reset/', PasswordResetView.as_view(), name='password_reset'),
    path('password-reset-confirm/', PasswordResetConfirmView.as_view(), name='password_reset_confirm'),
    path('change-password/', ChangePasswordView.as_view(), name='change_password'),
    path('update-profile/', ProfileUpdateView.as_view(), name='update_profile'),
    path('token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('token/verify/', TokenVerifyView.as_view(), name='token_verify'),
    path("me/", UserMeView.as_view(), name="user-me"),
    
]
