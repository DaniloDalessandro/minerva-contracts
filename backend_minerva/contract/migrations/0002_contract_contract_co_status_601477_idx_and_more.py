

from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("budgetline", "0004_budgetline_budgetline__budget__ee0088_idx_and_more"),
        ("contract", "0001_initial"),
        ("employee", "0002_alter_employee_created_by_alter_employee_updated_by"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AddIndex(
            model_name="contract",
            index=models.Index(fields=["status"], name="contract_co_status_601477_idx"),
        ),
        migrations.AddIndex(
            model_name="contract",
            index=models.Index(
                fields=["main_inspector"], name="contract_co_main_in_ce4f32_idx"
            ),
        ),
        migrations.AddIndex(
            model_name="contract",
            index=models.Index(
                fields=["substitute_inspector"], name="contract_co_substit_769a4a_idx"
            ),
        ),
        migrations.AddIndex(
            model_name="contract",
            index=models.Index(
                fields=["budget_line"], name="contract_co_budget__d2568b_idx"
            ),
        ),
        migrations.AddIndex(
            model_name="contract",
            index=models.Index(
                fields=["status", "main_inspector"],
                name="contract_co_status_e3b07f_idx",
            ),
        ),
        migrations.AddIndex(
            model_name="contractinstallment",
            index=models.Index(
                fields=["contract"], name="contract_co_contrac_1d74c4_idx"
            ),
        ),
        migrations.AddIndex(
            model_name="contractinstallment",
            index=models.Index(fields=["status"], name="contract_co_status_74818b_idx"),
        ),
        migrations.AddIndex(
            model_name="contractinstallment",
            index=models.Index(
                fields=["contract", "status"], name="contract_co_contrac_b37a2b_idx"
            ),
        ),
    ]
