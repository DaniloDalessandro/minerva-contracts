import logging
from drf_spectacular.utils import extend_schema
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from rest_framework.throttling import AnonRateThrottle, UserRateThrottle
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from django.utils.encoding import force_bytes, force_str
from django.contrib.auth import get_user_model
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from django.core.mail import send_mail
from django.conf import settings
from .models import BlacklistedToken

logger = logging.getLogger(__name__)

from .serializers import (
    LoginSerializer,
    RegisterSerializer,
    PasswordResetSerializer,
    PasswordResetConfirmSerializer,
    ChangePasswordSerializer,
    ProfileUpdateSerializer,
    UserSerializer,
    CustomTokenObtainPairSerializer,
)

from .utils.messages import (
    LOGIN_MESSAGES,
    LOGOUT_MESSAGES,
    REGISTER_MESSAGES,
    PASSWORD_RESET_MESSAGES,
    PASSWORD_CONFIRM_MESSAGES,
    CHANGE_PASSWORD_MESSAGES,
    PROFILE_MESSAGES
)

User = get_user_model()

ACCESS_COOKIE_NAME = 'access'
REFRESH_COOKIE_NAME = 'refresh'


def _cookie_settings():
    return {
        'httponly': True,
        'secure': getattr(settings, 'AUTH_COOKIE_SECURE', getattr(settings, 'DEBUG', True) is False),
        'samesite': 'Lax',
        'path': '/',
    }


def _set_auth_cookies(response, access_token=None, refresh_token=None):
    cookie_options = _cookie_settings()

    if access_token:
        response.set_cookie(
            key=ACCESS_COOKIE_NAME,
            value=access_token,
            max_age=int(settings.SIMPLE_JWT['ACCESS_TOKEN_LIFETIME'].total_seconds()),
            **cookie_options,
        )

    if refresh_token:
        response.set_cookie(
            key=REFRESH_COOKIE_NAME,
            value=refresh_token,
            max_age=int(settings.SIMPLE_JWT['REFRESH_TOKEN_LIFETIME'].total_seconds()),
            **cookie_options,
        )


def _delete_auth_cookies(response):
    cookie_options = _cookie_settings()
    for cookie_name in ('access', 'refresh', 'access_token', 'refresh_token'):
        response.delete_cookie(
            cookie_name,
            path=cookie_options['path'],
            samesite=cookie_options['samesite'],
        )

class LoginRateThrottle(AnonRateThrottle):
    scope = 'login'

class RegistrationRateThrottle(AnonRateThrottle):
    scope = 'registration'

class PasswordResetRateThrottle(AnonRateThrottle):
    scope = 'password_reset'


@extend_schema(tags=['Auth'])
class LoginView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [LoginRateThrottle]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data['user']
            refresh = RefreshToken.for_user(user)
            access_token = str(refresh.access_token)
            refresh_token = str(refresh)

            response = Response({
                'message': LOGIN_MESSAGES['success'],
                'user': {
                    'id': user.id,
                    'email': user.email,
                    'name': user.first_name,
                    'groups': [g.name for g in user.groups.all()],
                    'is_superuser': user.is_superuser,
                }
            })

            _set_auth_cookies(response, access_token, refresh_token)
            return response

        return Response({'error': LOGIN_MESSAGES['invalid_credentials']}, status=status.HTTP_400_BAD_REQUEST)


@extend_schema(tags=['Auth'])
class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:

            auth_header = request.META.get('HTTP_AUTHORIZATION')
            if auth_header and auth_header.startswith('Bearer '):
                token_string = auth_header.split(' ')[1]


                BlacklistedToken.add_token(token_string, request.user, 'logout')
                logger.info(f"Token adicionado à blacklist para usuário {request.user.email}")


            refresh_token = request.COOKIES.get(REFRESH_COOKIE_NAME) or request.data.get('refresh_token')
            if refresh_token:
                try:
                    refresh = RefreshToken(refresh_token)
                    BlacklistedToken.add_token(str(refresh.access_token), request.user, 'logout_refresh')
                except Exception as e:
                    logger.warning(f"Erro ao processar refresh token: {e}")

        except Exception as e:
            logger.error(f"Erro ao adicionar token à blacklist: {e}")

        response = Response({'message': LOGOUT_MESSAGES['success']})


        _delete_auth_cookies(response)
        response.delete_cookie('access_token')
        response.delete_cookie('refresh_token')
        response.delete_cookie('access')
        response.delete_cookie('refresh')

        return response



@extend_schema(tags=['Auth'])
class RegisterView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [RegistrationRateThrottle]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()

            refresh = RefreshToken.for_user(user)

            response = Response({
                'message': REGISTER_MESSAGES['success'],
            }, status=status.HTTP_201_CREATED)
            _set_auth_cookies(response, str(refresh.access_token), str(refresh))
            return response

        if 'email' in serializer.errors:
            return Response({'error': REGISTER_MESSAGES['email_exists']}, status=status.HTTP_400_BAD_REQUEST)

        return Response({'error': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)


@extend_schema(tags=['Auth'])
class PasswordResetView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [PasswordResetRateThrottle]

    def post(self, request):
        serializer = PasswordResetSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            try:
                user = User.objects.get(email=email)


                token = default_token_generator.make_token(user)
                uidb64 = urlsafe_base64_encode(force_bytes(user.pk))


                reset_link = f"{getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')}/reset-password/{uidb64}/{token}/"


                try:
                    send_mail(
                        'Redefinição de Senha - Sistema Minerva',
                        f'Olá,\n\nPara redefinir sua senha, clique no link abaixo:\n{reset_link}\n\nEste link expira em 24 horas.\n\nSe você não solicitou esta redefinição, ignore este email.',
                        settings.DEFAULT_FROM_EMAIL,
                        [email],
                        fail_silently=False,
                    )
                    return Response({'message': PASSWORD_RESET_MESSAGES['email_sent']})
                except Exception as e:
                    return Response({'error': 'Erro ao enviar email. Tente novamente.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

            except User.DoesNotExist:

                return Response({'message': PASSWORD_RESET_MESSAGES['email_sent']})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@extend_schema(tags=['Auth'])
class PasswordResetConfirmView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [PasswordResetRateThrottle]

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        if serializer.is_valid():
            try:
                uid = force_str(urlsafe_base64_decode(serializer.validated_data['uidb64']))
                user = User.objects.get(pk=uid)

                if default_token_generator.check_token(user, serializer.validated_data['token']):
                    user.set_password(serializer.validated_data['password'])
                    user.save()
                    return Response({'message': PASSWORD_CONFIRM_MESSAGES['success']})
                else:
                    return Response({'error': PASSWORD_CONFIRM_MESSAGES['invalid_token']}, status=status.HTTP_400_BAD_REQUEST)

            except (TypeError, ValueError, OverflowError, User.DoesNotExist):
                return Response({'error': PASSWORD_CONFIRM_MESSAGES['invalid_token']}, status=status.HTTP_400_BAD_REQUEST)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@extend_schema(tags=['Auth'])
class ChangePasswordView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            user = request.user
            if not user.check_password(serializer.validated_data['old_password']):
                return Response({'error': CHANGE_PASSWORD_MESSAGES['wrong_old_password']}, status=400)
            user.set_password(serializer.validated_data['new_password'])
            user.save()
            return Response({'message': CHANGE_PASSWORD_MESSAGES['success']})
        return Response(serializer.errors, status=400)


@extend_schema(tags=['Auth'])
class ProfileUpdateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def put(self, request):
        serializer = ProfileUpdateSerializer(instance=request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({'message': PROFILE_MESSAGES['update_success'], 'user': serializer.data})
        return Response({'error': PROFILE_MESSAGES['update_error'], 'details': serializer.errors}, status=400)


@extend_schema(tags=['Auth'])
class UserMeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)




@extend_schema(tags=['Auth'])
class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)

        if response.status_code == status.HTTP_200_OK:
            access_token = response.data.pop('access', None)
            refresh_token = response.data.pop('refresh', None)
            _set_auth_cookies(response, access_token, refresh_token)

        return response


@extend_schema(tags=['Auth'])
class CookieTokenRefreshView(TokenRefreshView):
    def post(self, request, *args, **kwargs):
        if not request.data.get('refresh'):
            request._full_data = {
                **request.data,
                'refresh': request.COOKIES.get(REFRESH_COOKIE_NAME),
            }

        response = super().post(request, *args, **kwargs)

        if response.status_code == status.HTTP_200_OK:
            access_token = response.data.pop('access', None)
            refresh_token = response.data.pop('refresh', None)
            _set_auth_cookies(response, access_token, refresh_token)

        return response
