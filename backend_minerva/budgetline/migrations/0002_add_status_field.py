

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("budgetline", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="budgetline",
            name="status",
            field=models.CharField(
                choices=[
                    ("ATIVO", "ATIVO"),
                    ("INATIVO", "INATIVO"),
                    ("FINALIZADO", "FINALIZADO"),
                ],
                default="ATIVO",
                max_length=20,
                verbose_name="Status",
            ),
        ),
        migrations.AddField(
            model_name="budgetlineversion",
            name="status",
            field=models.CharField(
                choices=[
                    ("ATIVO", "ATIVO"),
                    ("INATIVO", "INATIVO"),
                    ("FINALIZADO", "FINALIZADO"),
                ],
                default="ATIVO",
                max_length=20,
                verbose_name="Status",
            ),
        ),
    ]
