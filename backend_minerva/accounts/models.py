import logging
import uuid
from datetime import timedelta
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models
from django.utils import timezone
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
    username = None
    email = models.EmailField(unique=True, verbose_name="E-mail")
    employee = models.OneToOneField(
    'employee.Employee',
    on_delete=models.CASCADE,
    verbose_name="Funcionário",
    related_name="user",
    null=True,
    blank=False,
)

    avatar = models.CharField(
        max_length=50, blank=True, default='', verbose_name='Avatar'
    )

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    objects = UserManager()

    def save(self, *args, **kwargs):

        if self.employee and not self.email:
            self.email = self.employee.email

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
    jti = models.CharField(max_length=255, unique=True)
    token = models.TextField()
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

            decoded_token = AccessToken(token, verify=False)
            jti = decoded_token.get('jti')

            if not jti:

                return False

            return cls.objects.filter(jti=jti).exists()
        except Exception as e:


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
        cutoff_date = timezone.now() - timedelta(days=7)
        deleted_count = cls.objects.filter(blacklisted_at__lt=cutoff_date).delete()[0]
        return deleted_count


class UserInvitation(models.Model):
    """
    Convite de acesso enviado por um administrador para um novo usuário.
    O token é gerado automaticamente e expira em 48 horas.
    """

    GROUP_CHOICES = [
        ('PRESIDENTE', 'Presidente'),
        ('DIRETOR', 'Diretor'),
        ('GERENTE', 'Gerente'),
        ('COORDENADOR', 'Coordenador'),
        ('ANALISTA', 'Analista'),
        ('FUNCIONARIO', 'Funcionário'),
    ]

    STATUS_CHOICES = [
        ('PENDING', 'Pendente'),
        ('ACCEPTED', 'Aceito'),
        ('EXPIRED', 'Expirado'),
        ('CANCELLED', 'Cancelado'),
    ]

    token = models.UUIDField(default=uuid.uuid4, unique=True, editable=False, verbose_name='Token')
    email = models.EmailField(verbose_name='E-mail do convidado')
    group = models.CharField(max_length=20, choices=GROUP_CHOICES, default='FUNCIONARIO', verbose_name='Perfil')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING', verbose_name='Status')
    expires_at = models.DateTimeField(verbose_name='Expira em')
    accepted_at = models.DateTimeField(null=True, blank=True, verbose_name='Aceito em')


    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Criado em')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Atualizado em')
    created_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True,
        related_name='invitations_sent', verbose_name='Enviado por',
    )
    updated_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='invitations_updated', verbose_name='Atualizado por',
    )

    class Meta:
        verbose_name = 'Convite de usuário'
        verbose_name_plural = 'Convites de usuários'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['token']),
            models.Index(fields=['email']),
            models.Index(fields=['status']),
        ]

    def __str__(self):
        return f'Convite para {self.email} ({self.get_status_display()})'

    def save(self, *args, **kwargs):
        if not self.expires_at:
            self.expires_at = timezone.now() + timedelta(hours=48)
        super().save(*args, **kwargs)

    @property
    def is_expired(self):
        return self.expires_at < timezone.now()

    @property
    def is_valid(self):
        return self.status == 'PENDING' and not self.is_expired

    def mark_accepted(self):
        self.status = 'ACCEPTED'
        self.accepted_at = timezone.now()
        self.save(update_fields=['status', 'accepted_at', 'updated_at'])
