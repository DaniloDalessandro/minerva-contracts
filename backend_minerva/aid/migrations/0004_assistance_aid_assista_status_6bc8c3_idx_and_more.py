

from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("aid", "0003_alter_assistance_created_by_and_more"),
        ("budget", "0002_add_cached_amount_fields"),
        ("budgetline", "0003_budgetline_available_amount"),
        ("employee", "0002_alter_employee_created_by_alter_employee_updated_by"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AddIndex(
            model_name="assistance",
            index=models.Index(fields=["status"], name="aid_assista_status_6bc8c3_idx"),
        ),
        migrations.AddIndex(
            model_name="assistance",
            index=models.Index(
                fields=["employee"], name="aid_assista_employe_9cf43b_idx"
            ),
        ),
        migrations.AddIndex(
            model_name="assistance",
            index=models.Index(
                fields=["budget_line"], name="aid_assista_budget__d8963e_idx"
            ),
        ),
        migrations.AddIndex(
            model_name="assistance",
            index=models.Index(
                fields=["status", "employee"], name="aid_assista_status_32ae88_idx"
            ),
        ),
    ]
