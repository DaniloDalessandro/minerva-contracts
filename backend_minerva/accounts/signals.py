import logging
from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import User
import secrets
import string
from django.core.mail import send_mail
from django.conf import settings

logger = logging.getLogger(__name__)

def gerar_senha(tamanho=12):
    """Gera senha segura usando secrets"""
    caracteres = string.ascii_letters + string.digits + '!@#$%&*'
    return ''.join(secrets.choice(caracteres) for _ in range(tamanho))

@receiver(post_save, sender=User)
def definir_senha_e_enviar_email(sender, instance, created, **kwargs):
    if created and not instance.has_usable_password():

        if not instance.email and instance.employee:
            instance.email = instance.employee.email


        if instance.employee and User.objects.filter(employee=instance.employee).exclude(id=instance.id).exists():
            raise ValueError("Este funcionário já possui um usuário vinculado.")

        nova_senha = gerar_senha()
        instance.set_password(nova_senha)
        instance.save()


        try:
            send_mail(
                'Acesso ao Sistema Minerva',
                f'Olá,\n\nSeu usuário foi criado no sistema Minerva.\nE-mail: {instance.email}\nSenha: {nova_senha}\n\nRecomenda-se trocar a senha após o primeiro acesso.',
                settings.DEFAULT_FROM_EMAIL,
                [instance.email],
                fail_silently=False,
            )
        except Exception as e:

            logger.error(f"Erro ao enviar email: {e}")
