"""
Cross-encoder reranking via Gemini.
Pega N candidatos e retorna os top_k mais relevantes para a query.
"""
import json
import logging
from typing import Any, Dict, List

logger = logging.getLogger(__name__)

_RERANK_PROMPT_TEMPLATE = """
Você é um sistema de reranking de documentos.

PERGUNTA DO USUÁRIO:
{query}

DOCUMENTOS CANDIDATOS (lista numerada):
{candidates_text}

TAREFA:
Analise cada documento e ordene os IDs dos documentos do mais relevante para o menos relevante
em relação à pergunta do usuário.

Retorne APENAS um JSON válido neste formato exato (sem markdown, sem texto adicional):
{{"ranked_ids": [id1, id2, id3, ...]}}

Inclua apenas os IDs dos {top_k} documentos mais relevantes na lista.
"""


class RerankerService:
    """
    Cross-encoder reranking via Gemini.
    Pega N candidatos e retorna os top_k mais relevantes para a query.
    Apenas ativado quando candidates > top_k.
    Faz fallback por rrf_score se o parse da resposta Gemini falhar.
    """

    def __init__(self, gemini_service):
        self.gemini = gemini_service

    def rerank(
        self,
        query: str,
        candidates: List[Dict[str, Any]],
        top_k: int = 5,
    ) -> List[Dict[str, Any]]:
        """
        Reordena candidatos usando Gemini como cross-encoder.

        Args:
            query: Pergunta do usuário
            candidates: Lista de dicts com pelo menos {id, content, title}
            top_k: Número de resultados finais desejados

        Returns:
            Lista de até top_k candidatos reordenados por relevância
        """
        if not candidates:
            return []

        if len(candidates) <= top_k:
            return candidates[:top_k]

        try:
            ranked = self._rerank_with_gemini(query, candidates, top_k)
            if ranked:
                return ranked
        except Exception as exc:
            logger.warning(f"Reranking via Gemini falhou: {exc} — usando fallback por rrf_score")

        return self._fallback_by_rrf_score(candidates, top_k)





    def _rerank_with_gemini(
        self,
        query: str,
        candidates: List[Dict[str, Any]],
        top_k: int,
    ) -> List[Dict[str, Any]]:
        """Chama LLM (DeepSeek ou Gemini) com prompt estruturado e parseia a resposta."""
        candidates_text = self._format_candidates_for_prompt(candidates)

        prompt = _RERANK_PROMPT_TEMPLATE.format(
            query=query,
            candidates_text=candidates_text,
            top_k=top_k,
        )

        # Tenta DeepSeek primeiro
        response = None
        try:
            from django.conf import settings
            deepseek_key = getattr(settings, 'DEEPSEEK_API_KEY', None)
            if deepseek_key:
                from .deepseek_service import DeepSeekService
                ds = DeepSeekService()
                response = ds.generate_response(prompt)
        except Exception as exc:
            logger.debug("Reranker DeepSeek attempt failed: %s — falling back to Gemini", exc)

        if not response or not response.get('success'):
            response = self.gemini.generate_response(prompt)

        if not response.get('success'):
            raise RuntimeError(f"LLM retornou erro no reranking: {response.get('error', 'desconhecido')}")

        raw_content = response.get('content', '')
        ranked_ids = self._parse_ranked_ids(raw_content)

        if not ranked_ids:
            raise ValueError("Não foi possível parsear ranked_ids da resposta Gemini")

        return self._build_result(candidates, ranked_ids, top_k)

    @staticmethod
    def _format_candidates_for_prompt(candidates: List[Dict[str, Any]]) -> str:
        lines = []
        for doc in candidates:
            doc_id = doc.get('id', '')
            title = doc.get('title', '')

            content = (doc.get('content', '') or '')[:400]
            lines.append(f"ID={doc_id} | Título: {title}\n{content}\n---")
        return "\n".join(lines)

    @staticmethod
    def _parse_ranked_ids(content: str) -> List[int]:
        """Tenta extrair a lista de IDs do JSON retornado pelo Gemini."""
        if not content:
            return []


        cleaned = content.strip()
        if cleaned.startswith('```'):
            lines = cleaned.split('\n')
            cleaned = '\n'.join(
                line for line in lines
                if not line.startswith('```')
            ).strip()

        try:
            parsed = json.loads(cleaned)
            ranked = parsed.get('ranked_ids', [])
            return [int(x) for x in ranked if x is not None]
        except (json.JSONDecodeError, ValueError, TypeError):
            pass


        import re
        match = re.search(r'\[\s*(\d+(?:\s*,\s*\d+)*)\s*\]', content)
        if match:
            try:
                return [int(x.strip()) for x in match.group(1).split(',')]
            except ValueError:
                pass

        return []

    @staticmethod
    def _build_result(
        candidates: List[Dict[str, Any]],
        ranked_ids: List[int],
        top_k: int,
    ) -> List[Dict[str, Any]]:
        """Reconstrói a lista de candidatos na ordem fornecida pelos IDs."""
        id_to_doc = {doc['id']: doc for doc in candidates}
        result = []
        for doc_id in ranked_ids[:top_k]:
            if doc_id in id_to_doc:
                result.append(id_to_doc[doc_id])


        if len(result) < top_k:
            seen_ids = {d['id'] for d in result}
            for doc in candidates:
                if doc['id'] not in seen_ids:
                    result.append(doc)
                    if len(result) >= top_k:
                        break

        return result[:top_k]

    @staticmethod
    def _fallback_by_rrf_score(
        candidates: List[Dict[str, Any]], top_k: int
    ) -> List[Dict[str, Any]]:
        """Fallback: ordena por rrf_score (ou vector_score) sem chamada à API."""
        def sort_key(doc: Dict[str, Any]) -> float:
            return float(doc.get('rrf_score') or doc.get('vector_score') or 0.0)

        return sorted(candidates, key=sort_key, reverse=True)[:top_k]
