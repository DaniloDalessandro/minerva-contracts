

from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("budget", "0002_add_cached_amount_fields"),
        ("budgetline", "0003_budgetline_available_amount"),
        ("center", "0001_initial"),
        ("employee", "0002_alter_employee_created_by_alter_employee_updated_by"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AddIndex(
            model_name="budgetline",
            index=models.Index(
                fields=["budget"], name="budgetline__budget__ee0088_idx"
            ),
        ),
        migrations.AddIndex(
            model_name="budgetline",
            index=models.Index(fields=["status"], name="budgetline__status_bdc85e_idx"),
        ),
        migrations.AddIndex(
            model_name="budgetline",
            index=models.Index(
                fields=["management_center"], name="budgetline__managem_19c30a_idx"
            ),
        ),
        migrations.AddIndex(
            model_name="budgetline",
            index=models.Index(
                fields=["budget", "status"], name="budgetline__budget__82ebd4_idx"
            ),
        ),
        migrations.AddIndex(
            model_name="budgetline",
            index=models.Index(
                fields=["main_fiscal"], name="budgetline__main_fi_ce3176_idx"
            ),
        ),
    ]
