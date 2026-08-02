from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import uuid


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0002_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='UserInvitation',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('token', models.UUIDField(default=uuid.uuid4, editable=False, unique=True, verbose_name='Token')),
                ('email', models.EmailField(max_length=254, verbose_name='E-mail do convidado')),
                ('group', models.CharField(
                    choices=[
                        ('PRESIDENTE', 'Presidente'),
                        ('DIRETOR', 'Diretor'),
                        ('GERENTE', 'Gerente'),
                        ('COORDENADOR', 'Coordenador'),
                        ('FUNCIONARIO', 'Funcionário'),
                    ],
                    default='FUNCIONARIO',
                    max_length=20,
                    verbose_name='Perfil',
                )),
                ('status', models.CharField(
                    choices=[
                        ('PENDING', 'Pendente'),
                        ('ACCEPTED', 'Aceito'),
                        ('EXPIRED', 'Expirado'),
                        ('CANCELLED', 'Cancelado'),
                    ],
                    default='PENDING',
                    max_length=20,
                    verbose_name='Status',
                )),
                ('expires_at', models.DateTimeField(verbose_name='Expira em')),
                ('accepted_at', models.DateTimeField(blank=True, null=True, verbose_name='Aceito em')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='Criado em')),
                ('updated_at', models.DateTimeField(auto_now=True, verbose_name='Atualizado em')),
                ('created_by', models.ForeignKey(
                    null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name='invitations_sent',
                    to=settings.AUTH_USER_MODEL,
                    verbose_name='Enviado por',
                )),
                ('updated_by', models.ForeignKey(
                    blank=True,
                    null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name='invitations_updated',
                    to=settings.AUTH_USER_MODEL,
                    verbose_name='Atualizado por',
                )),
            ],
            options={
                'verbose_name': 'Convite de usuário',
                'verbose_name_plural': 'Convites de usuários',
                'ordering': ['-created_at'],
            },
        ),
        migrations.AddIndex(
            model_name='userinvitation',
            index=models.Index(fields=['token'], name='accounts_ui_token_idx'),
        ),
        migrations.AddIndex(
            model_name='userinvitation',
            index=models.Index(fields=['email'], name='accounts_ui_email_idx'),
        ),
        migrations.AddIndex(
            model_name='userinvitation',
            index=models.Index(fields=['status'], name='accounts_ui_status_idx'),
        ),
    ]
