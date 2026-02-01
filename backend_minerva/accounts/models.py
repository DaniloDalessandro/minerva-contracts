import logging
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models
from django.utils.translation import gettext_lazy as _

logger = logging.getLogger(__name__)


class UserManager(BaseUserManager):
    use_in_migrations = True

    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError(_('O e-mail deve ser fornecido'))
        email = self.normalize_email(email)
        extra_fields.setdefault('is_active', True)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)

        if not password:
            raise ValueError(_('A senha é obrigatória para superusuário'))

        if extra_fields.get('is_staff') is not True:
            raise ValueError(_('Superusuário precisa ter is_staff=True.'))

        if extra_fields.get('is_superuser') is not True:
            raise ValueError(_('Superusuário precisa ter is_superuser=True.'))

        return self.create_user(email, password, **extra_fields)


class User(AbstractUser):
    username = None  # Remove o campo username
    email = models.EmailField(unique=True, verbose_name="E-mail")
    employee = models.OneToOneField(
    'employee.Employee',  # ← lazy import via string
    on_delete=models.CASCADE,
    verbose_name="Funcionário",
    related_name="user",
    null=True,
    blank=False,
)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    objects = UserManager()

    def save(self, *args, **kwargs):
        # Se employee está definido e email não está definido, usar email do employee
        if self.employee and not self.email:
            self.email = self.employee.email
        # Se employee mudou, atualizar email
        elif self.employee and self.email != self.employee.email:
            self.email = self.employee.email
        super().save(*args, **kwargs)

    def __str__(self):
        if self.employee:
            return f"{self.employee.full_name} ({self.employee.cpf})"
        return self.email

    class Meta:
        verbose_name = "Usuário"
        verbose_name_plural = "Usuários"


class BlacklistedToken(models.Model):
    """
    Modelo para armazenar tokens que foram invalidados (logout, etc)
    """
    jti = models.CharField(max_length=255, unique=True)  # JWT ID
    token = models.TextField()  # Token completo para verificação adicional
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='blacklisted_tokens')
    blacklisted_at = models.DateTimeField(auto_now_add=True)
    reason = models.CharField(max_length=255, default='logout')
    
    class Meta:
        db_table = 'blacklisted_tokens'
        verbose_name = "Token Invalidado"
        verbose_name_plural = "Tokens Invalidados"
        indexes = [
            models.Index(fields=['jti']),
            models.Index(fields=['user', 'blacklisted_at']),
        ]
    
    def __str__(self):
        return f"Token {self.jti[:10]}... invalidado para {self.user.email}"

    @classmethod
    def is_blacklisted(cls, token: str) -> bool:
        """
        Verifica se um token está na blacklist.

        IMPORTANTE: Este método apenas verifica se o token está na blacklist,
        NÃO verifica se o token é válido ou expirado. A validação de token
        deve ser feita pelo JWTAuthentication antes de chamar este método.

        Se não conseguir extrair o JTI do token, retorna False para permitir
        que o erro de validação seja tratado pelo sistema de autenticação.
        """
        try:
            from rest_framework_simplejwt.tokens import AccessToken
            # Tenta decodificar sem verificar expiração
            decoded_token = AccessToken(token, verify=False)
            jti = decoded_token.get('jti')

            if not jti:
                # Sem JTI, não pode estar na blacklist
                return False

            return cls.objects.filter(jti=jti).exists()
        except Exception as e:
            # Se não consegue extrair o JTI, assume que não está na blacklist
            # O erro de validação será tratado pelo middleware/autenticação
            logger.debug(f"Não foi possível verificar blacklist (token pode ser inválido): {e}")
            return False

    @classmethod
    def add_token(cls, token: str, user, reason: str = 'logout'):
        """Adiciona um token à blacklist"""
        try:
            from rest_framework_simplejwt.tokens import AccessToken
            decoded_token = AccessToken(token)
            jti = decoded_token.get('jti')
            
            cls.objects.get_or_create(
                jti=jti,
                defaults={
                    'token': token,
                    'user': user,
                    'reason': reason
                }
            )
            return True
        except Exception as e:
            logger.error(f"Erro ao adicionar token à blacklist: {e}")
            return False

    @classmethod
    def cleanup_expired(cls):
        """Remove tokens expirados da blacklist"""
        from django.utils import timezone
        from datetime import timedelta
        
        # Remove tokens com mais de 7 dias (tempo de vida máximo do refresh token)
        cutoff_date = timezone.now() - timedelta(days=7)
        deleted_count = cls.objects.filter(blacklisted_at__lt=cutoff_date).delete()[0]
        return deleted_count
