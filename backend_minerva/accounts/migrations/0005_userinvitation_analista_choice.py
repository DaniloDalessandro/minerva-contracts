from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [('accounts', '0004_user_avatar')]

    operations = [
        migrations.AlterField(
            model_name='userinvitation', name='group',
            field=models.CharField(
                choices=[('PRESIDENTE', 'Presidente'), ('DIRETOR', 'Diretor'),
                         ('GERENTE', 'Gerente'), ('COORDENADOR', 'Coordenador'),
                         ('ANALISTA', 'Analista'), ('FUNCIONARIO', 'Funcionário')],
                default='FUNCIONARIO', max_length=20, verbose_name='Perfil',
            ),
        ),
    ]
