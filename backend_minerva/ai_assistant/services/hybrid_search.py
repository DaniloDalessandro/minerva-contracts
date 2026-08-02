"""
Busca híbrida combinando busca vetorial (pgvector) com busca full-text (PostgreSQL tsvector).
Usa Reciprocal Rank Fusion (RRF) para combinar os rankings.
"""
import logging
from typing import Any, Dict, List, Optional, Tuple

from django.db import connection

logger = logging.getLogger(__name__)


class HybridSearchService:
    """
    Combina busca vetorial (pgvector) com busca full-text (tsvector) usando RRF.
    Trata graciosamente ausência de pgvector ou de content_tsv.
    """

    def __init__(self, gemini_service):
        self.gemini_service = gemini_service
        self._pgvector_available = self._check_pgvector()
        self._tsv_column_available = self._check_tsv_column()

    def _check_pgvector(self) -> bool:
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1 FROM pg_extension WHERE extname = 'vector'")
                return cursor.fetchone() is not None
        except Exception:
            return False

    def _check_tsv_column(self) -> bool:
        try:
            with connection.cursor() as cursor:
                cursor.execute("""
                    SELECT 1 FROM information_schema.columns
                    WHERE table_name = 'ai_assistant_documentembedding'
                      AND column_name = 'content_tsv'
                """)
                return cursor.fetchone() is not None
        except Exception:
            return False

    def _vector_search(
        self,
        query_embedding: List[float],
        limit: int = 20,
    ) -> List[Tuple[int, float]]:
        """
        Busca vetorial usando pgvector.
        Retorna lista de (doc_id, cosine_similarity_score) ordenada por score DESC.
        """
        if not self._pgvector_available or not query_embedding:
            return []

        try:
            embedding_str = f"[{','.join(map(str, query_embedding))}]"
            with connection.cursor() as cursor:
                cursor.execute(
                    """
                    SELECT id,
                           1 - (embedding <=> %s::vector) AS cosine_score
                    FROM ai_assistant_documentembedding
                    WHERE is_active = true
                      AND embedding IS NOT NULL
                    ORDER BY embedding <=> %s::vector
                    LIMIT %s
                    """,
                    [embedding_str, embedding_str, limit],
                )
                return [(row[0], float(row[1])) for row in cursor.fetchall()]
        except Exception as exc:
            logger.warning(f"Erro na busca vetorial: {exc}")
            return []

    def _fulltext_search(
        self,
        query_text: str,
        limit: int = 20,
    ) -> List[Tuple[int, float]]:
        """
        Busca full-text usando tsvector.
        Retorna lista de (doc_id, ts_rank) ordenada por rank DESC.
        Usa fallback ILIKE se content_tsv não existir.
        """
        if not query_text or not query_text.strip():
            return []

        if self._tsv_column_available:
            return self._fulltext_tsv(query_text, limit)
        return self._fulltext_ilike(query_text, limit)

    def _fulltext_tsv(
        self, query_text: str, limit: int
    ) -> List[Tuple[int, float]]:
        try:
            with connection.cursor() as cursor:
                cursor.execute(
                    """
                    SELECT id,
                           ts_rank_cd(content_tsv,
                                      plainto_tsquery('portuguese', %s)) AS rank
                    FROM ai_assistant_documentembedding
                    WHERE is_active = true
                      AND content_tsv @@ plainto_tsquery('portuguese', %s)
                    ORDER BY rank DESC
                    LIMIT %s
                    """,
                    [query_text, query_text, limit],
                )
                return [(row[0], float(row[1])) for row in cursor.fetchall()]
        except Exception as exc:
            logger.warning(f"Erro na busca tsvector: {exc} — tentando ILIKE")
            self._tsv_column_available = False
            return self._fulltext_ilike(query_text, limit)

    def _fulltext_ilike(
        self, query_text: str, limit: int
    ) -> List[Tuple[int, float]]:
        """Fallback ILIKE quando content_tsv não está disponível."""
        try:
            terms = [t.strip() for t in query_text.split() if len(t.strip()) > 2]
            if not terms:
                return []


            primary_term = terms[0]
            with connection.cursor() as cursor:
                cursor.execute(
                    """
                    SELECT id, 0.5 AS rank
                    FROM ai_assistant_documentembedding
                    WHERE is_active = true
                      AND content ILIKE %s
                    LIMIT %s
                    """,
                    [f"%{primary_term}%", limit],
                )
                return [(row[0], float(row[1])) for row in cursor.fetchall()]
        except Exception as exc:
            logger.warning(f"Erro no fallback ILIKE: {exc}")
            return []

    @staticmethod
    def _reciprocal_rank_fusion(
        vector_results: List[Tuple[int, float]],
        fulltext_results: List[Tuple[int, float]],
        k: int = 60,
    ) -> Dict[int, Dict[str, Any]]:
        """
        Combina dois rankings usando Reciprocal Rank Fusion.
        RRF score = sum(1 / (k + rank_i)) para cada lista onde o doc aparece.
        """
        scores: Dict[int, Dict[str, Any]] = {}

        for rank, (doc_id, vscore) in enumerate(vector_results, start=1):
            if doc_id not in scores:
                scores[doc_id] = {'rrf': 0.0, 'vector_score': 0.0, 'fulltext_score': 0.0}
            scores[doc_id]['rrf'] += 1.0 / (k + rank)
            scores[doc_id]['vector_score'] = vscore

        for rank, (doc_id, ftscore) in enumerate(fulltext_results, start=1):
            if doc_id not in scores:
                scores[doc_id] = {'rrf': 0.0, 'vector_score': 0.0, 'fulltext_score': 0.0}
            scores[doc_id]['rrf'] += 1.0 / (k + rank)
            scores[doc_id]['fulltext_score'] = ftscore

        return scores

    def search(
        self,
        query_text: str,
        query_embedding: Optional[List[float]] = None,
        limit: int = 20,
        top_k: int = 10,
    ) -> List[Dict[str, Any]]:
        """
        Busca híbrida: combina pgvector + full-text via RRF.

        Args:
            query_text: Texto da pergunta do usuário
            query_embedding: Embedding pré-computado (se None, é gerado aqui)
            limit: Candidatos por método antes do RRF
            top_k: Resultados finais retornados

        Returns:
            Lista de dicts com {id, content, document_type, title,
                                rrf_score, vector_score, fulltext_score}
        """
        try:
            if query_embedding is None:
                query_embedding = self.gemini_service.get_embedding(query_text)

            vector_results = self._vector_search(query_embedding, limit=limit)
            fulltext_results = self._fulltext_search(query_text, limit=limit)

            if not vector_results and not fulltext_results:
                logger.warning("Busca híbrida: nenhum resultado de vetor nem full-text")
                return []

            rrf_scores = self._reciprocal_rank_fusion(vector_results, fulltext_results)

            sorted_ids = sorted(rrf_scores.keys(), key=lambda d: rrf_scores[d]['rrf'], reverse=True)
            top_ids = sorted_ids[:top_k]

            if not top_ids:
                return []

            documents = self._fetch_documents_by_ids(top_ids)


            id_to_doc = {d['id']: d for d in documents}
            results = []
            for doc_id in top_ids:
                if doc_id not in id_to_doc:
                    continue
                doc = id_to_doc[doc_id]
                scores = rrf_scores[doc_id]
                results.append({
                    'id': doc_id,
                    'content': doc.get('content', ''),
                    'document_type': doc.get('document_type', ''),
                    'title': doc.get('title', ''),
                    'rrf_score': scores['rrf'],
                    'vector_score': scores['vector_score'],
                    'fulltext_score': scores['fulltext_score'],
                })

            return results

        except Exception as exc:
            logger.error(f"Erro na busca híbrida: {exc}")
            return []

    def _fetch_documents_by_ids(self, doc_ids: List[int]) -> List[Dict[str, Any]]:
        """Busca documentos pelo conjunto de IDs preservando todos os campos necessários."""
        if not doc_ids:
            return []
        try:
            placeholders = ','.join(['%s'] * len(doc_ids))
            with connection.cursor() as cursor:
                cursor.execute(
                    f"""
                    SELECT id, content, document_type, title
                    FROM ai_assistant_documentembedding
                    WHERE id IN ({placeholders})
                    """,
                    doc_ids,
                )
                columns = [col[0] for col in cursor.description]
                return [dict(zip(columns, row)) for row in cursor.fetchall()]
        except Exception as exc:
            logger.error(f"Erro ao buscar documentos por IDs: {exc}")
            return []
