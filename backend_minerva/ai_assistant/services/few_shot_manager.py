"""
Gerencia exemplos few-shot para RAG de geração SQL.
Usa o model FewShotExample para armazenar e recuperar exemplos vetorizados.
"""
import logging
import math
from typing import Any, Dict, List, Optional

from django.db import transaction

logger = logging.getLogger(__name__)

try:
    from pgvector.django import VectorField
    PGVECTOR_AVAILABLE = True
except ImportError:
    PGVECTOR_AVAILABLE = False


class FewShotManager:
    """
    Gerencia exemplos few-shot para RAG de geração SQL.

    - record_success: salva query bem-sucedida como exemplo vetorizado
    - record_failure: incrementa failure_count no exemplo similar
    - get_relevant_examples: busca os N mais similares com pgvector
    - format_for_prompt: formata exemplos para inserção no prompt SQL
    - _deduplicate: não cria duplicatas (similaridade > 0.95)
    """

    DEDUP_THRESHOLD = 0.95

    def __init__(self, gemini_service):
        self.gemini = gemini_service
        self._pgvector_enabled = self._check_pgvector_runtime()

    def _check_pgvector_runtime(self) -> bool:
        try:
            from django.db import connection
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1 FROM pg_extension WHERE extname = 'vector'")
                return cursor.fetchone() is not None
        except Exception:
            return False

    def record_success(
        self,
        user_question: str,
        canonical_sql: str,
        intent: str,
        tables_used: List[str],
        result_count: int = 0,
        execution_ms: float = 0.0,
    ) -> Optional[Any]:
        """
        Salva ou atualiza um exemplo de sucesso.
        Não cria duplicatas quando similaridade > DEDUP_THRESHOLD.
        """
        try:

            embedding = self.gemini.get_embedding(user_question)
            if not embedding:
                logger.warning("FewShotManager.record_success: falha ao gerar embedding")
                return None


            existing = self._find_similar_example(embedding, threshold=self.DEDUP_THRESHOLD)
            if existing:
                return self._update_success_stats(existing, result_count, execution_ms)


            from ..models import FewShotExample
            example = FewShotExample.objects.create(
                user_question=user_question,
                canonical_sql=canonical_sql,
                intent=intent,
                tables_used=tables_used,
                success_count=1,
                failure_count=0,
                avg_result_count=float(result_count),
                avg_execution_ms=float(execution_ms),
                is_active=True,
                embedding=embedding,
            )
            logger.info(f"FewShotExample criado: id={example.id}")
            return example

        except Exception as exc:
            logger.error(f"Erro em record_success: {exc}")
            return None

    def record_failure(self, user_question: str) -> None:
        """Incrementa failure_count no exemplo mais similar à pergunta."""
        try:
            embedding = self.gemini.get_embedding(user_question)
            if not embedding:
                return

            existing = self._find_similar_example(embedding, threshold=0.85)
            if existing:
                existing.failure_count += 1
                existing.save(update_fields=['failure_count', 'updated_at'])
                logger.debug(f"FewShotExample id={existing.id} failure_count incrementado")
        except Exception as exc:
            logger.warning(f"Erro em record_failure: {exc}")

    def get_relevant_examples(
        self,
        user_question: str,
        top_k: int = 5,
        min_success_count: int = 1,
    ) -> List[Dict[str, Any]]:
        """
        Retorna os top_k exemplos mais similares à pergunta.
        Usa pgvector quando disponível, cosseno Python como fallback.
        """
        try:
            embedding = self.gemini.get_embedding(user_question)
            if not embedding:
                return []

            if self._pgvector_enabled:
                return self._search_pgvector(embedding, top_k, min_success_count)
            return self._search_python_cosine(embedding, top_k, min_success_count)

        except Exception as exc:
            logger.error(f"Erro em get_relevant_examples: {exc}")
            return []

    def format_for_prompt(self, examples: List[Dict[str, Any]]) -> str:
        """
        Formata lista de exemplos para inclusão no prompt de geração SQL.
        """
        if not examples:
            return ""

        lines = ["EXEMPLOS DE CONSULTAS ANTERIORES BEM-SUCEDIDAS:"]
        for i, ex in enumerate(examples, start=1):
            question = ex.get('user_question', '')
            sql = ex.get('canonical_sql', '')
            intent = ex.get('intent', '')
            lines.append(f"\nExemplo {i}:")
            lines.append(f"  Pergunta: {question}")
            if intent:
                lines.append(f"  Intenção: {intent}")
            lines.append(f"  SQL: {sql}")

        return "\n".join(lines)



    def _find_similar_example(
        self, embedding: List[float], threshold: float
    ) -> Optional[Any]:
        """Busca exemplo com similaridade acima do limiar."""
        if self._pgvector_enabled:
            return self._find_similar_pgvector(embedding, threshold)
        return self._find_similar_python(embedding, threshold)

    def _find_similar_pgvector(
        self, embedding: List[float], threshold: float
    ) -> Optional[Any]:
        try:
            from django.db import connection
            embedding_str = f"[{','.join(map(str, embedding))}]"
            cosine_threshold = 1.0 - threshold

            with connection.cursor() as cursor:
                cursor.execute(
                    """
                    SELECT id
                    FROM ai_assistant_fewshotexample
                    WHERE is_active = true
                      AND embedding IS NOT NULL
                      AND (embedding <=> %s::vector) <= %s
                    ORDER BY embedding <=> %s::vector
                    LIMIT 1
                    """,
                    [embedding_str, cosine_threshold, embedding_str],
                )
                row = cursor.fetchone()

            if not row:
                return None

            from ..models import FewShotExample
            return FewShotExample.objects.get(id=row[0])
        except Exception as exc:
            logger.warning(f"_find_similar_pgvector erro: {exc}")
            return None

    def _find_similar_python(
        self, embedding: List[float], threshold: float
    ) -> Optional[Any]:
        try:
            from ..models import FewShotExample
            best = None
            best_sim = -1.0

            for ex in FewShotExample.objects.filter(is_active=True).exclude(embedding=None):
                stored = ex.embedding if isinstance(ex.embedding, list) else list(ex.embedding)
                sim = _cosine_similarity(embedding, stored)
                if sim > best_sim:
                    best_sim = sim
                    best = ex

            if best and best_sim >= threshold:
                return best
            return None
        except Exception as exc:
            logger.warning(f"_find_similar_python erro: {exc}")
            return None

    @staticmethod
    def _update_success_stats(example, result_count: int, execution_ms: float):
        """Atualiza média de resultados e tempo de execução via média móvel."""
        try:
            n = example.success_count
            example.success_count = n + 1

            example.avg_result_count = (
                (example.avg_result_count * n + result_count) / (n + 1)
            )
            example.avg_execution_ms = (
                (example.avg_execution_ms * n + execution_ms) / (n + 1)
            )
            example.save(update_fields=[
                'success_count', 'avg_result_count', 'avg_execution_ms', 'updated_at'
            ])
            return example
        except Exception as exc:
            logger.warning(f"_update_success_stats erro: {exc}")
            return example

    def _search_pgvector(
        self,
        embedding: List[float],
        top_k: int,
        min_success_count: int,
    ) -> List[Dict[str, Any]]:
        try:
            from django.db import connection
            embedding_str = f"[{','.join(map(str, embedding))}]"

            with connection.cursor() as cursor:
                cursor.execute(
                    """
                    SELECT id, user_question, canonical_sql, intent, tables_used,
                           success_count, failure_count, avg_result_count, avg_execution_ms,
                           1 - (embedding <=> %s::vector) AS similarity
                    FROM ai_assistant_fewshotexample
                    WHERE is_active = true
                      AND success_count >= %s
                      AND embedding IS NOT NULL
                    ORDER BY embedding <=> %s::vector
                    LIMIT %s
                    """,
                    [embedding_str, min_success_count, embedding_str, top_k],
                )
                columns = [col[0] for col in cursor.description]
                return [dict(zip(columns, row)) for row in cursor.fetchall()]
        except Exception as exc:
            logger.error(f"_search_pgvector erro: {exc}")
            return self._search_python_cosine(embedding, top_k, min_success_count)

    def _search_python_cosine(
        self,
        embedding: List[float],
        top_k: int,
        min_success_count: int,
    ) -> List[Dict[str, Any]]:
        try:
            from ..models import FewShotExample
            results = []

            queryset = FewShotExample.objects.filter(
                is_active=True, success_count__gte=min_success_count
            ).exclude(embedding=None)

            for ex in queryset:
                stored = ex.embedding if isinstance(ex.embedding, list) else list(ex.embedding)
                sim = _cosine_similarity(embedding, stored)
                results.append({
                    'id': ex.id,
                    'user_question': ex.user_question,
                    'canonical_sql': ex.canonical_sql,
                    'intent': ex.intent,
                    'tables_used': ex.tables_used,
                    'success_count': ex.success_count,
                    'failure_count': ex.failure_count,
                    'avg_result_count': ex.avg_result_count,
                    'avg_execution_ms': ex.avg_execution_ms,
                    'similarity': sim,
                })

            results.sort(key=lambda x: x['similarity'], reverse=True)
            return results[:top_k]
        except Exception as exc:
            logger.error(f"_search_python_cosine erro: {exc}")
            return []


def _cosine_similarity(a: List[float], b: List[float]) -> float:
    if not a or not b or len(a) != len(b):
        return 0.0
    dot = sum(x * y for x, y in zip(a, b))
    norm_a = math.sqrt(sum(x * x for x in a))
    norm_b = math.sqrt(sum(x * x for x in b))
    if norm_a == 0.0 or norm_b == 0.0:
        return 0.0
    return dot / (norm_a * norm_b)
