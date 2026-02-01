from django.http import JsonResponse
from django.contrib.auth.models import AnonymousUser
from django.urls import resolve
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from accounts.models import BlacklistedToken
import json


class APIAuthenticationMiddleware:
    """
    Middleware para proteger todas as rotas da API
    Redireciona para login se não autenticado
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
        self.jwt_authenticator = JWTAuthentication()
    
    def __call__(self, request):
        # URLs que não precisam de autenticação
        public_endpoints = [
            '/api/v1/accounts/login/',
            '/api/v1/accounts/register/',
            '/api/v1/accounts/token/',
            '/api/v1/accounts/token/refresh/',
            '/api/v1/accounts/token/verify/',
            '/api/v1/accounts/password-reset/',
            '/api/v1/accounts/password-reset-confirm/',
            '/admin/',
            '/static/',
            '/media/',
        ]
        
        # Verificar se é uma rota da API
        if request.path.startswith('/api/'):
            # Verificar se é um endpoint público
            is_public = any(request.path.startswith(endpoint) for endpoint in public_endpoints)
            
            if not is_public:
                # Tentar autenticar usando JWT
                try:
                    user_auth_tuple = self.jwt_authenticator.authenticate(request)
                    if user_auth_tuple is None:
                        # Não há token de autenticação
                        return JsonResponse({
                            'error': 'Token de autenticação necessário',
                            'detail': 'Você precisa fazer login para acessar este recurso',
                            'redirect': '/login'
                        }, status=401)
                    
                    user, token = user_auth_tuple
                    if isinstance(user, AnonymousUser) or not user.is_authenticated:
                        return JsonResponse({
                            'error': 'Usuário não autenticado',
                            'detail': 'Token inválido ou expirado',
                            'redirect': '/login'
                        }, status=401)
                    
                    # ÚNICA VERIFICAÇÃO: Apenas verificar blacklist se conseguiu decodificar o token
                    if hasattr(token, 'token'):
                        token_string = str(token.token)
                        if BlacklistedToken.is_blacklisted(token_string):
                            return JsonResponse({
                                'error': 'Token invalidado',
                                'detail': 'Este token foi invalidado. Faça login novamente.',
                                'redirect': '/login'
                            }, status=401)
                    
                    # Definir o usuário no request para usar nas views
                    request.user = user
                    
                except (InvalidToken, TokenError) as e:
                    return JsonResponse({
                        'error': 'Token inválido',
                        'detail': str(e),
                        'redirect': '/login'
                    }, status=401)
                except Exception as e:
                    import logging
                    logger = logging.getLogger(__name__)
                    logger.error(f"Erro no middleware de autenticação: {type(e).__name__}: {str(e)}", exc_info=True)
                    return JsonResponse({
                        'error': 'Erro de autenticação',
                        'detail': 'Erro interno no servidor',
                        'redirect': '/login'
                    }, status=500)
        
        response = self.get_response(request)
        return response


class HierarchicalPermissionMiddleware:
    """
    Middleware para injetar filtros hierárquicos automaticamente em requisições da API
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        # Apenas aplicar em rotas da API e se usuário autenticado
        if (request.path.startswith('/api/') and 
            hasattr(request, 'user') and 
            request.user.is_authenticated):
            
            # Adicionar filtro hierárquico ao request para uso nas views
            from accounts.mixins import HierarchicalFilterMixin
            request.hierarchical_filter = HierarchicalFilterMixin()
            
        response = self.get_response(request)
        return response


class AdminAuthRedirectMiddleware:
    """
    Middleware específico para o Django Admin
    Garante que usuários não autenticados sejam redirecionados para login
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        # Verificar se é uma rota do admin
        if request.path.startswith('/admin/') and not request.path.startswith('/admin/login/'):
            # Se não está autenticado, redirecionar para login do admin
            if isinstance(request.user, AnonymousUser) or not request.user.is_authenticated:
                from django.shortcuts import redirect
                from django.urls import reverse
                login_url = reverse('admin:login')
                return redirect(f"{login_url}?next={request.path}")
        
        response = self.get_response(request)
        return response