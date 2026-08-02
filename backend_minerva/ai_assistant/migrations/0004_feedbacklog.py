from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("ai_assistant", "0003_alice_v2"),
    ]

    operations = [
        migrations.CreateModel(
            name="FeedbackLog",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("rating", models.CharField(choices=[("POSITIVE", "Positivo 👍"), ("NEGATIVE", "Negativo 👎")], max_length=10)),
                ("correction", models.TextField(blank=True, verbose_name="Correção do usuário")),
                ("user_question", models.TextField(verbose_name="Pergunta original")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("query_log", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="feedbacks", to="ai_assistant.querylog")),
                ("session", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="feedbacks", to="ai_assistant.conversationsession")),
            ],
            options={"verbose_name": "Feedback", "verbose_name_plural": "Feedbacks", "ordering": ["-created_at"]},
        ),
        migrations.AddIndex(
            model_name="feedbacklog",
            index=models.Index(fields=["session"], name="ai_assistan_session_fb_idx"),
        ),
        migrations.AddIndex(
            model_name="feedbacklog",
            index=models.Index(fields=["rating"], name="ai_assistan_rating_fb_idx"),
        ),
    ]
