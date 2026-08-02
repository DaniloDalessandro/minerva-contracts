

import pgvector.django.indexes
import pgvector.django.vector
from django.db import migrations, models


def _add_hnsw_indexes(apps, schema_editor):
    if schema_editor.connection.vendor != "postgresql":
        return
    from pgvector.django.indexes import HnswIndex
    for model_name, index_name in [
        ("conversationembedding", "conv_embedding_hnsw_idx"),
        ("documentembedding", "embedding_hnsw_idx"),
        ("fewshotexample", "fewshot_embedding_hnsw_idx"),
    ]:
        Model = apps.get_model("ai_assistant", model_name)
        idx = HnswIndex(
            ef_construction=64,
            fields=["embedding"],
            m=16,
            name=index_name,
            opclasses=["vector_cosine_ops"],
        )
        schema_editor.add_index(Model, idx)


def _remove_hnsw_indexes(apps, schema_editor):
    if schema_editor.connection.vendor != "postgresql":
        return
    from pgvector.django.indexes import HnswIndex
    for model_name, index_name in [
        ("conversationembedding", "conv_embedding_hnsw_idx"),
        ("documentembedding", "embedding_hnsw_idx"),
        ("fewshotexample", "fewshot_embedding_hnsw_idx"),
    ]:
        Model = apps.get_model("ai_assistant", model_name)
        idx = HnswIndex(
            ef_construction=64,
            fields=["embedding"],
            m=16,
            name=index_name,
            opclasses=["vector_cosine_ops"],
        )
        schema_editor.remove_index(Model, idx)


def _alter_vector_fields(apps, schema_editor):
    if schema_editor.connection.vendor != "postgresql":
        return
    for model_name, field_name in [
        ("conversationembedding", "embedding"),
        ("documentembedding", "embedding"),
        ("fewshotexample", "embedding"),
    ]:
        Model = apps.get_model("ai_assistant", model_name)
        table = schema_editor.quote_name(Model._meta.db_table)
        column = schema_editor.quote_name(field_name)
        schema_editor.execute(
            f"ALTER TABLE {table} ALTER COLUMN {column} TYPE vector(768) USING NULL::vector(768)"
        )


class Migration(migrations.Migration):

    dependencies = [
        ("ai_assistant", "0004_feedbacklog"),
    ]

    operations = [
        migrations.RenameIndex(
            model_name="feedbacklog",
            new_name="ai_assistan_session_2cbcb7_idx",
            old_name="ai_assistan_session_fb_idx",
        ),
        migrations.RenameIndex(
            model_name="feedbacklog",
            new_name="ai_assistan_rating_5c2893_idx",
            old_name="ai_assistan_rating_fb_idx",
        ),
        migrations.RunPython(
            code=_alter_vector_fields,
            reverse_code=migrations.RunPython.noop,
        ),
        migrations.AlterField(
            model_name="feedbacklog",
            name="correction",
            field=models.TextField(
                blank=True,
                help_text="SQL ou resposta correta sugerida pelo usuário",
                verbose_name="Correção do usuário",
            ),
        ),
        migrations.RunPython(
            code=_add_hnsw_indexes,
            reverse_code=_remove_hnsw_indexes,
        ),
    ]
