from django.urls import path
from rest_framework.authtoken.views import obtain_auth_token
from .views import (
    LoginView,
    LogoutView,
    PasswordResetView,
    PasswordResetConfirmView,
    ChangePasswordView,
    ProfileUpdateView,
    UserMeView,
    CustomTokenObtainPairView,
    CookieTokenRefreshView,
)
from .user_admin_views import (
    AdminUserListView,
    AdminUserCreateView,
    AdminUserDetailView,
    AdminUserToggleStatusView,
    InviteListCreateView,
    InviteResendView,
    InviteCancelView,
    InviteValidateView,
    InviteAcceptView,
    AdminPermissionListView,
    AdminGroupListView,
    AdminGroupPermissionsUpdateView,
)
from rest_framework_simplejwt.views import TokenVerifyView

urlpatterns = [

    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('password-reset/', PasswordResetView.as_view(), name='password_reset'),
    path('password-reset-confirm/', PasswordResetConfirmView.as_view(), name='password_reset_confirm'),
    path('change-password/', ChangePasswordView.as_view(), name='change_password'),
    path('update-profile/', ProfileUpdateView.as_view(), name='update_profile'),
    path('token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', CookieTokenRefreshView.as_view(), name='token_refresh'),
    path('token/verify/', TokenVerifyView.as_view(), name='token_verify'),
    path('me/', UserMeView.as_view(), name='user-me'),


    path('admin/users/', AdminUserListView.as_view(), name='admin-user-list'),
    path('admin/users/create/', AdminUserCreateView.as_view(), name='admin-user-create'),
    path('admin/users/<int:user_id>/', AdminUserDetailView.as_view(), name='admin-user-detail'),
    path('admin/users/<int:user_id>/toggle-status/', AdminUserToggleStatusView.as_view(), name='admin-user-toggle'),


    path('admin/permissions/', AdminPermissionListView.as_view(), name='admin-permission-list'),
    path('admin/groups/', AdminGroupListView.as_view(), name='admin-group-list'),
    path('admin/groups/<int:group_id>/permissions/', AdminGroupPermissionsUpdateView.as_view(), name='admin-group-permissions'),

    path('admin/invites/', InviteListCreateView.as_view(), name='admin-invite-list-create'),
    path('admin/invites/<int:invite_id>/resend/', InviteResendView.as_view(), name='admin-invite-resend'),
    path('admin/invites/<int:invite_id>/cancel/', InviteCancelView.as_view(), name='admin-invite-cancel'),


    path('invite/validate/<uuid:token>/', InviteValidateView.as_view(), name='invite-validate'),
    path('invite/accept/', InviteAcceptView.as_view(), name='invite-accept'),
]
