

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("notifications", "0001_initial"),
    ]

    operations = [
        migrations.RenameIndex(
            model_name="contractnotification",
            new_name="notificatio_cycle_m_d99fab_idx",
            old_name="notif_cycle_idx",
        ),
        migrations.RenameIndex(
            model_name="contractnotification",
            new_name="notificatio_is_read_9da322_idx",
            old_name="notif_read_created_idx",
        ),
    ]
