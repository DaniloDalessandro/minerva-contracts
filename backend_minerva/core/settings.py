from pathlib import Path
from datetime import timedelta
from decouple import config, Csv

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent


# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/5.2/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
# SECRET_KEY is required and must be set in environment variables
SECRET_KEY = config('SECRET_KEY')

# SECURITY WARNING: don't run with debug turned on in production!
# DEBUG defaults to False for security. Set DEBUG=True in .env for development.
DEBUG = config('DEBUG', default=False, cast=bool)

ALLOWED_HOSTS = config('ALLOWED_HOSTS', default='localhost,127.0.0.1', cast=Csv())


# Application definition

INSTALLED_APPS = [
    'jazzmin',
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    #LIBS
    'rest_framework',
    'rest_framework.authtoken',
    'corsheaders',
    'django_filters',
    'drf_spectacular',
    # APPS
    'accounts',
    'employee',
    'sector',
    'center',
    'budget',
    'budgetline',
    'aid',
    'contract',
    'ai_assistant',

]

CORS_ALLOWED_ORIGINS = config(
    'CORS_ALLOWED_ORIGINS',
    default='http://localhost:3000,http://localhost:3001,http://127.0.0.1:3000,http://127.0.0.1:3001',
    cast=Csv()
)

CORS_ALLOW_CREDENTIALS = True
# Nunca permitir todas as origens - sempre usar lista específica
CORS_ALLOW_ALL_ORIGINS = False

# Configurações de segurança para cookies
SESSION_COOKIE_SECURE = not DEBUG  # True em produção
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = 'Strict'
CSRF_COOKIE_SECURE = not DEBUG  # True em produção
CSRF_COOKIE_HTTPONLY = True
CSRF_COOKIE_SAMESITE = 'Strict'

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'core.middleware.APIAuthenticationMiddleware',  # Middleware de autenticação da API
    'core.middleware.HierarchicalPermissionMiddleware',  # Middleware de permissões hierárquicas  
    'core.middleware.AdminAuthRedirectMiddleware',  # Middleware de redirecionamento do admin
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'core.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
                'accounts.middleware.user_permission_context',  # Context processor de permissões
            ],
        },
    },
]

WSGI_APPLICATION = 'core.wsgi.application'


# Database
# https://docs.djangoproject.com/en/5.2/ref/settings/#databases

DATABASES = {
    'default': {
        'ENGINE': config('DATABASE_ENGINE', default='django.db.backends.sqlite3'),
        'NAME': config('DATABASE_NAME', default=str(BASE_DIR / 'db.sqlite3')),
        'USER': config('DATABASE_USER', default=''),
        'PASSWORD': config('DATABASE_PASSWORD', default=''),
        'HOST': config('DATABASE_HOST', default=''),
        'PORT': config('DATABASE_PORT', default=''),
    }
}


# Password validation
# https://docs.djangoproject.com/en/5.2/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]


# Internationalization
# https://docs.djangoproject.com/en/5.2/topics/i18n/

LANGUAGE_CODE = 'pt-br'

TIME_ZONE = 'America/Sao_Paulo'

USE_I18N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/5.2/howto/static-files/

STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_DIRS = [
    BASE_DIR / 'static',
]

# Default primary key field type
# https://docs.djangoproject.com/en/5.2/ref/settings/#default-auto-field

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

AUTH_USER_MODEL = 'accounts.User'

# Logging configuration
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
            'style': '{',
        },
        'simple': {
            'format': '{levelname} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'INFO',
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': False,
        },
        'budget': {
            'handlers': ['console'],
            'level': 'DEBUG',
            'propagate': True,
        },
    },
}

# Email Settings
EMAIL_BACKEND = config(
    'EMAIL_BACKEND',
    default='django.core.mail.backends.console.EmailBackend'
)
EMAIL_HOST = config('EMAIL_HOST', default='')
EMAIL_PORT = config('EMAIL_PORT', default=587, cast=int)
EMAIL_USE_TLS = config('EMAIL_USE_TLS', default=True, cast=bool)
EMAIL_HOST_USER = config('EMAIL_HOST_USER', default='')
EMAIL_HOST_PASSWORD = config('EMAIL_HOST_PASSWORD', default='')
DEFAULT_FROM_EMAIL = config('DEFAULT_FROM_EMAIL', default='noreply@sistemacontratos.local')

# Frontend URL for password reset links
FRONTEND_URL = config('FRONTEND_URL', default='http://localhost:3000')

# Configuração da API do Google Gemini
# Se não configurada, o assistente de IA ficará desabilitado
GEMINI_API_KEY = config('GEMINI_API_KEY', default=None)


REST_FRAMEWORK = {
    "DEFAULT_PAGINATION_CLASS": (
        "rest_framework.pagination.PageNumberPagination"
    ),
    "PAGE_SIZE": 10,
    "DEFAULT_FILTER_BACKENDS": [
        "django_filters.rest_framework.DjangoFilterBackend",
        "rest_framework.filters.SearchFilter",
        "rest_framework.filters.OrderingFilter",
    ],
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_RENDERER_CLASSES': (
        'rest_framework.renderers.JSONRenderer',
        'rest_framework.renderers.BrowsableAPIRenderer',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle',
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '50/hour',  # 50 requisições por hora para usuários anônimos
        'user': '1000/hour',  # 1000 requisições por hora para usuários autenticados
        'login': '5/hour',  # 5 tentativas de login por hora (previne brute force)
        'registration': '3/hour',  # 3 registros por hora (previne spam de contas)
        'password_reset': '3/hour',  # 3 resets de senha por hora (previne abuso)
        'pdf_export': '10/hour',  # 10 PDFs por hora (previne sobrecarga do servidor)
        'ai_assistant': '30/hour',  # 30 requisições de IA por hora (previne abuso)
    },
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
}

# drf-spectacular settings
SPECTACULAR_SETTINGS = {
    'TITLE': 'Minerva API',
    'DESCRIPTION': 'Sistema de Gestão de Contratos, Orçamentos e Colaboradores',
    'VERSION': '1.0.0',
    'SERVE_INCLUDE_SCHEMA': False,
    'COMPONENT_SPLIT_REQUEST': True,
}

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=8),  # Aumentado para 8 horas     
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),  # Aumentado para 7 dias
    "ROTATE_REFRESH_TOKENS": False,  # Desabilitado para evitar erros
    'BLACKLIST_AFTER_ROTATION': False,
    'UPDATE_LAST_LOGIN': True,
    
}

# Configuração do Jazzmin
JAZZMIN_SETTINGS = {
    "site_title": "Minerva Admin",
    "site_header": "Minerva",
    "site_brand": "Minerva",
    "site_logo": "img/logo.svg",
    "login_logo": None,
    "login_logo_dark": None,
    "site_icon": "img/favicon.svg",  # Favicon customizado com âncora
    "welcome_sign": "Bem-vindo ao Sistema Minerva",
    "copyright": "Minerva © 2024 - Sistema de Gestão",
    
    # Sidebar
    "show_sidebar": True,
    "navigation_expanded": True,
    
    # Top Menu
    "topmenu_links": [
        {"name": "Início", "url": "admin:index", "permissions": ["auth.view_user"]},
        {"name": "Ver Site", "url": "/", "new_window": True},
    ],
    
    # User Menu
    "usermenu_links": [
        {"name": "Perfil", "url": "admin:password_change", "icon": "fas fa-user-cog"},
    ],
    
    # Ícones por aplicação/modelo - Modernizados e coesos
    "icons": {
        # Autenticação e Usuários
        "auth": "fas fa-shield-alt",
        "auth.user": "fas fa-user-circle",
        "auth.Group": "fas fa-users",
        "accounts": "fas fa-user-shield",
        "accounts.User": "fas fa-id-card",
        
        # Funcionários
        "employee": "fas fa-address-card",
        "employee.Employee": "fas fa-user-tag",
        
        # Centros
        "center": "fas fa-building",
        "center.ManagementCenter": "fas fa-warehouse",
        "center.RequestingCenter": "fas fa-store-alt",
        
        # Setores
        "sector": "fas fa-sitemap",
        "sector.Direction": "fas fa-compass",
        "sector.Management": "fas fa-cogs",
        "sector.Coordination": "fas fa-project-diagram",
        
        # Orçamento
        "budget": "fas fa-chart-pie",
        "budget.Budget": "fas fa-wallet",
        "budgetline": "fas fa-chart-line",
        "budgetline.BudgetLine": "fas fa-list-alt",
        
        # Contratos
        "contract": "fas fa-file-signature",
        "contract.Contract": "fas fa-handshake",
        
        # Auxílios/Assistência
        "aid": "fas fa-hand-holding-usd",
        "aid.Assistance": "fas fa-heart",
        
        # IA Assistant
        "ai_assistant": "fas fa-brain",
        "ai_assistant.ConversationSession": "fas fa-comment-dots",
        
        # Admin
        "admin.LogEntry": "fas fa-clipboard-list",
    },
    
    # Ícones padrão
    "default_icon_parents": "fas fa-folder",
    "default_icon_children": "fas fa-file",
    
    # Configurações de UI
    "changeform_format": "horizontal_tabs",
    "changeform_format_overrides": {
        "auth.user": "collapsible",
        "auth.group": "vertical_tabs"
    },
    
    # Configurações de tema
    "theme": "default",
    "dark_mode_theme": None,
    
    # Modern UI improvements
    "show_ui_builder": False,
    "related_modal_active": False,
    "use_google_fonts_cdn": True,
    
    # Links customizados
    "custom_links": {
        "accounts": [{
            "name": "Gerenciar Usuários",
            "url": "admin:accounts_user_changelist",
            "icon": "fas fa-users-cog",
            "permissions": ["accounts.view_user"]
        }],
        "budget": [{
            "name": "Dashboard Financeiro",
            "url": "admin:budget_budget_changelist",
            "icon": "fas fa-chart-pie",
            "permissions": ["budget.view_budget"]
        }],
        "contract": [{
            "name": "Relatório de Contratos",
            "url": "admin:contract_contract_changelist",
            "icon": "fas fa-file-chart-column",
            "permissions": ["contract.view_contract"]
        }]
    },
    
    # Ordem dos apps
    "order_with_respect_to": [
        "accounts",
        "employee", 
        "center",
        "sector",
        "budget",
        "budgetline",
        "contract",
        "aid",
        "ai_assistant",
        "auth"
    ],
    
}

