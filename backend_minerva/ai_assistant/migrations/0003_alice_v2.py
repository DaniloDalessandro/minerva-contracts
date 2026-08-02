

import django.db.models.deletion
from django.db import migrations, models

try:
    from pgvector.django import VectorField, HnswIndex
    PGVECTOR_AVAILABLE = True
except ImportError:
    PGVECTOR_AVAILABLE = False


class Migration(migrations.Migration):

    dependencies = [
        ("ai_assistant", "0002_documentembedding_conversationembedding"),
    ]

    operations = [

        migrations.AddField(
            model_name="querylog",
            name="success_score",
            field=models.FloatField(
                blank=True,
                null=True,
                verbose_name="Score de Sucesso",
            ),
        ),
        migrations.AddField(
            model_name="querylog",
            name="healing_attempts",
            field=models.IntegerField(default=0, verbose_name="Tentativas de Healing"),
        ),
        migrations.AddField(
            model_name="querylog",
            name="context_used",
            field=models.JSONField(
                blank=True,
                default=dict,
                verbose_name="Contexto Utilizado",
            ),
        ),


        migrations.CreateModel(
            name="FewShotExample",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("user_question", models.TextField(verbose_name="Pergunta do Usuário")),
                ("canonical_sql", models.TextField(verbose_name="SQL Canônico")),
                ("intent", models.TextField(verbose_name="Intenção")),
                (
                    "tables_used",
                    models.JSONField(
                        blank=True,
                        default=list,
                        verbose_name="Tabelas Utilizadas",
                    ),
                ),
                (
                    "success_count",
                    models.IntegerField(default=1, verbose_name="Contagem de Sucesso"),
                ),
                (
                    "failure_count",
                    models.IntegerField(default=0, verbose_name="Contagem de Falha"),
                ),
                (
                    "avg_result_count",
                    models.FloatField(default=0.0, verbose_name="Média de Resultados"),
                ),
                (
                    "avg_execution_ms",
                    models.FloatField(default=0.0, verbose_name="Média de Execução (ms)"),
                ),
                ("is_active", models.BooleanField(default=True, verbose_name="Ativo")),
                (
                    "embedding",
                    models.JSONField(
                        blank=True,
                        null=True,
                        verbose_name="Embedding (JSON fallback)",
                    ),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={
                "verbose_name": "Exemplo Few-Shot",
                "verbose_name_plural": "Exemplos Few-Shot",
                "ordering": ["-success_count", "-created_at"],
            },
        ),


        migrations.AddIndex(
            model_name="conversationmessage",
            index=models.Index(fields=["session"], name="ai_assistan_session_6950ed_idx"),
        ),
        migrations.AddIndex(
            model_name="conversationmessage",
            index=models.Index(fields=["session", "message_type"], name="ai_assistan_session_383f8e_idx"),
        ),
        migrations.AddIndex(
            model_name="conversationsession",
            index=models.Index(fields=["user", "is_active"], name="ai_assistan_user_id_33936d_idx"),
        ),
        migrations.AddIndex(
            model_name="conversationsession",
            index=models.Index(fields=["user", "-updated_at"], name="ai_assistan_user_id_a49d1a_idx"),
        ),
        migrations.AddIndex(
            model_name="querylog",
            index=models.Index(fields=["session"], name="ai_assistan_session_2ca5bd_idx"),
        ),
        migrations.AddIndex(
            model_name="querylog",
            index=models.Index(fields=["execution_status"], name="ai_assistan_executi_89117b_idx"),
        ),
        migrations.AddIndex(
            model_name="querylog",
            index=models.Index(fields=["session", "execution_status"], name="ai_assistan_session_3a95b9_idx"),
        ),


        migrations.RunPython(
            code=lambda apps, schema_editor: (
                schema_editor.execute("""
                    ALTER TABLE ai_assistant_documentembedding
                        ADD COLUMN IF NOT EXISTS content_tsv tsvector
                        GENERATED ALWAYS AS (to_tsvector('portuguese', coalesce(content, ''))) STORED;
                    CREATE INDEX IF NOT EXISTS documentembedding_content_tsv_gin
                        ON ai_assistant_documentembedding
                        USING GIN(content_tsv);
                """)
                if schema_editor.connection.vendor == "postgresql"
                else None
            ),
            reverse_code=lambda apps, schema_editor: (
                schema_editor.execute("""
                    DROP INDEX IF EXISTS documentembedding_content_tsv_gin;
                    ALTER TABLE ai_assistant_documentembedding DROP COLUMN IF EXISTS content_tsv;
                """)
                if schema_editor.connection.vendor == "postgresql"
                else None
            ),
        ),
    ]
