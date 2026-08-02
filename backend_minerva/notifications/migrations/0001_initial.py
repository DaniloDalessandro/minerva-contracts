from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('contract', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='ContractNotification',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('notification_type', models.CharField(
                    choices=[('EXPIRATION_30_DAYS', 'Vencimento em 30 dias')],
                    default='EXPIRATION_30_DAYS',
                    max_length=30,
                    verbose_name='Tipo',
                )),
                ('cycle_month', models.DateField(verbose_name='Ciclo (mês)')),
                ('is_read', models.BooleanField(default=False, verbose_name='Lida')),
                ('read_at', models.DateTimeField(blank=True, null=True, verbose_name='Lida em')),
                ('email_sent_at', models.DateTimeField(blank=True, null=True, verbose_name='E-mail enviado em')),
                ('email_recipients', models.JSONField(blank=True, default=list, verbose_name='Destinatários do e-mail')),
                ('email_error', models.TextField(blank=True, verbose_name='Erro de e-mail')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='Criado em')),
                ('contract', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='notifications',
                    to='contract.contract',
                    verbose_name='Contrato',
                )),
            ],
            options={
                'verbose_name': 'Notificação de Contrato',
                'verbose_name_plural': 'Notificações de Contrato',
                'ordering': ['-created_at'],
            },
        ),
        migrations.AddIndex(
            model_name='contractnotification',
            index=models.Index(fields=['cycle_month'], name='notif_cycle_idx'),
        ),
        migrations.AddIndex(
            model_name='contractnotification',
            index=models.Index(fields=['is_read', 'created_at'], name='notif_read_created_idx'),
        ),
        migrations.AlterUniqueTogether(
            name='contractnotification',
            unique_together={('contract', 'notification_type', 'cycle_month')},
        ),
    ]
