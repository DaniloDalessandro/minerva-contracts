from django.db import migrations
from pgvector.django import VectorField, HnswIndex


class Migration(migrations.Migration):
    dependencies = [
        ('ai_assistant', '0005_rename_ai_assistan_session_fb_idx_ai_assistan_session_2cbcb7_idx_and_more'),
    ]

    # 0005 already converted the PostgreSQL columns and created these indexes
    # with RunPython. Record the corresponding state without rewriting vectors
    # or attempting to create the same indexes again.
    operations = [migrations.SeparateDatabaseAndState(
        database_operations=[],
        state_operations=[
            *[migrations.AlterField(
                model_name=model_name, name='embedding',
                field=VectorField(dimensions=768, null=True, blank=True, verbose_name='Embedding'),
            ) for model_name in ['conversationembedding', 'documentembedding', 'fewshotexample']],
            *[migrations.AddIndex(
                model_name=model_name,
                index=HnswIndex(name=index_name, fields=['embedding'], m=16,
                                ef_construction=64, opclasses=['vector_cosine_ops']),
            ) for model_name, index_name in [
                ('conversationembedding', 'conv_embedding_hnsw_idx'),
                ('documentembedding', 'embedding_hnsw_idx'),
                ('fewshotexample', 'fewshot_embedding_hnsw_idx'),
            ]],
        ],
    )]
