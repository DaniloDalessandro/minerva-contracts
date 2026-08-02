import os
from pathlib import Path
from datetime import timedelta
from decouple import config, Csv

BASE_DIR = Path(__file__).resolve().parent.parent


SECRET_KEY = config('SECRET_KEY')


DEBUG = config('DEBUG', default=False, cast=bool)

ALLOWED_HOSTS = config('ALLOWED_HOSTS', default='localhost,127.0.0.1', cast=Csv())




INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    'django_celery_results',
    'django_celery_beat',
    'rest_framework',
    'rest_framework.authtoken',
    'rest_framework_simplejwt.token_blacklist',
    'corsheaders',
    'django_filters',
    'drf_spectacular',

    'accounts',
    'employee',
    'sector',
    'center',
    'budget',
    'budgetline',
    'aid',
    'contract',
    'ai_assistant',
    'notifications',
    'access_control',
    'sharing',
    'dashboard',
]

CORS_ALLOWED_ORIGINS = config(
    'CORS_ALLOWED_ORIGINS',
    default='http://localhost:3000,http://localhost:3001,http://127.0.0.1:3000,http://127.0.0.1:3001',
    cast=Csv()
)

CORS_ALLOW_CREDENTIALS = True

CORS_ALLOW_ALL_ORIGINS = False


SESSION_COOKIE_SECURE = not DEBUG
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = 'Strict'
CSRF_COOKIE_SECURE = not DEBUG
CSRF_COOKIE_HTTPONLY = True
CSRF_COOKIE_SAMESITE = 'Strict'
AUTH_COOKIE_SECURE = config('AUTH_COOKIE_SECURE', default=not DEBUG, cast=bool)

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'core.middleware.APIAuthenticationMiddleware',
    'core.middleware.HierarchicalPermissionMiddleware',
    'core.middleware.AdminAuthRedirectMiddleware',
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
                'accounts.middleware.user_permission_context',
            ],
        },
    },
]

WSGI_APPLICATION = 'core.wsgi.application'


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


LANGUAGE_CODE = 'pt-br'

TIME_ZONE = 'America/Sao_Paulo'

USE_I18N = True

USE_TZ = True


STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_DIRS = [
    BASE_DIR / 'static',
]

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

AUTH_USER_MODEL = 'accounts.User'


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


FRONTEND_URL = config('FRONTEND_URL', default='http://localhost:3000')


REDIS_URL = config('REDIS_URL', default='redis://localhost:6379/0')

CELERY_BROKER_URL = REDIS_URL
CELERY_RESULT_BACKEND = 'django-db'
CELERY_CACHE_BACKEND = 'default'
CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERY_TIMEZONE = TIME_ZONE
CELERY_BEAT_SCHEDULER = 'django_celery_beat.schedulers:DatabaseScheduler'


CELERY_BEAT_SCHEDULE = {
    'check-expiring-contracts-daily': {
        'task': 'notifications.check_expiring_contracts',
        'schedule': 86400,
        'options': {'expires': 3600},
    },
    'expire-access-grants-hourly': {
        'task': 'access_control.expire_access_grants',
        'schedule': 3600,
        'options': {'expires': 1800},
    },
}


GEMINI_API_KEY = config('GEMINI_API_KEY', default=None)

# DeepSeek API (OpenAI-compatible)
DEEPSEEK_API_KEY = config('DEEPSEEK_API_KEY', default=None)
DEEPSEEK_API_BASE = config('DEEPSEEK_API_BASE', default='https://api.deepseek.com')
DEEPSEEK_MODEL = config('DEEPSEEK_MODEL', default='deepseek-chat')

# LangSmith observability (optional)
LANGCHAIN_TRACING_V2 = config('LANGCHAIN_TRACING_V2', default='false')
LANGCHAIN_API_KEY = config('LANGCHAIN_API_KEY', default=None)
LANGCHAIN_PROJECT = config('LANGCHAIN_PROJECT', default='minerva-alice')

# Sentry (optional)
SENTRY_DSN = config('SENTRY_DSN', default=None)

# Alice memory TTL in Redis (seconds, default 24h)
ALICE_REDIS_MEMORY_TTL = config('ALICE_REDIS_MEMORY_TTL', default=86400, cast=int)
ALICE_MEMORY_WINDOW = config('ALICE_MEMORY_WINDOW', default=20, cast=int)  # last N messages in Redis
ALICE_CONFIDENCE_THRESHOLD = config('ALICE_CONFIDENCE_THRESHOLD', default=0.70, cast=float)


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
        'anon': '50/hour',
        'user': '1000/hour',
        'login': '5/hour',
        'registration': '3/hour',
        'password_reset': '3/hour',
        'pdf_export': '10/hour',
        'ai_assistant': '30/hour',
    },
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
}


SPECTACULAR_SETTINGS = {
    'TITLE': 'Minerva API',
    'DESCRIPTION': (
        'API REST do Sistema Minerva — gestão de contratos, orçamentos, '
        'linhas orçamentárias, colaboradores, centros gestores e auxílios.\n\n'
        '## Autenticação\n'
        'Todos os endpoints (exceto login, registro e recuperação de senha) '
        'exigem JWT Bearer Token no header `Authorization: Bearer <token>`.\n\n'
        '## Controle de Acesso (RBAC)\n'
        '| Papel | Escrita permitida em |\n'
        '|-------|---------------------|\n'
        '| PRESIDENTE / DIRETOR | Tudo |\n'
        '| GERENTE | Centro, Colaboradores, Linhas, Contratos, Auxílios |\n'
        '| COORDENADOR | Contratos, Auxílios |\n'
        '| FUNCIONARIO | Somente leitura |'
    ),
    'VERSION': '1.0.0',
    'SERVE_INCLUDE_SCHEMA': False,
    'COMPONENT_SPLIT_REQUEST': True,
    'SORT_OPERATIONS': False,
    'TAGS': [
        {'name': 'Auth', 'description': 'Login, logout, registro e gestão de senha'},
        {'name': 'Colaboradores', 'description': 'CRUD de colaboradores/funcionários'},
        {'name': 'Setor', 'description': 'Direções, gerências e coordenações'},
        {'name': 'Centro', 'description': 'Centros gestores e solicitantes'},
        {'name': 'Orçamento', 'description': 'Orçamentos e movimentações financeiras'},
        {'name': 'Linhas Orçamentárias', 'description': 'Linhas orçamentárias e versões'},
        {'name': 'Contratos', 'description': 'Contratos, parcelas e aditivos'},
        {'name': 'Auxílios', 'description': 'Auxílios educacionais e assistenciais'},
        {'name': 'IA', 'description': 'Assistente de IA Alice'},
        {'name': 'Notificações', 'description': 'Notificações de vencimento de contratos'},
    ],


    'SECURITY': [{'jwtAuth': []}],
    'SWAGGER_UI_SETTINGS': {
        'persistAuthorization': True,
        'displayRequestDuration': True,
        'filter': True,
        'defaultModelsExpandDepth': 1,
        'defaultModelExpandDepth': 2,
    },
    'REDOC_UI_SETTINGS': {
        'hideDownloadButton': False,
        'expandResponses': '200,201',
    },
}

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=8),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    "ROTATE_REFRESH_TOKENS": True,
    'BLACKLIST_AFTER_ROTATION': True,
    'UPDATE_LAST_LOGIN': True,
}

# ── Sentry ────────────────────────────────────────────────────────────────────
_sentry_dsn = config('SENTRY_DSN', default=None)
if _sentry_dsn:
    import sentry_sdk
    from sentry_sdk.integrations.django import DjangoIntegration
    from sentry_sdk.integrations.celery import CeleryIntegration
    sentry_sdk.init(
        dsn=_sentry_dsn,
        integrations=[DjangoIntegration(), CeleryIntegration()],
        traces_sample_rate=0.1,
        send_default_pii=False,
        environment='production' if not DEBUG else 'development',
    )

# ── LangSmith ─────────────────────────────────────────────────────────────────
_langsmith_key = config('LANGCHAIN_API_KEY', default=None)
if _langsmith_key:
    os.environ.setdefault('LANGCHAIN_TRACING_V2', config('LANGCHAIN_TRACING_V2', default='true'))
    os.environ.setdefault('LANGCHAIN_API_KEY', _langsmith_key)
    os.environ.setdefault('LANGCHAIN_PROJECT', config('LANGCHAIN_PROJECT', default='minerva-alice'))

