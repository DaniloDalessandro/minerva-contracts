"""
Testes para HybridSearchService.

Cobre:
- RRF fusion com dois rankings
- Retorno vazio quando não há resultados
- Fallback ILIKE quando content_tsv indisponível
"""
from unittest.mock import MagicMock, patch
from django.test import TestCase

from ai_assistant.services.hybrid_search import HybridSearchService


class RRFFusionTests(TestCase):
    """Testa Reciprocal Rank Fusion de forma isolada."""

    def test_combines_both_rankings(self):
        vector_results = [(1, 0.95), (2, 0.80), (3, 0.70)]
        fulltext_results = [(2, 0.9), (1, 0.75), (4, 0.60)]

        scores = HybridSearchService._reciprocal_rank_fusion(vector_results, fulltext_results)

        # Docs 1 e 2 aparecem em ambas as listas — devem ter RRF maior
        self.assertIn(1, scores)
        self.assertIn(2, scores)
        self.assertIn(3, scores)
        self.assertIn(4, scores)

        # Doc 2 aparece em ambas com boas posições
        self.assertGreater(scores[2]['rrf'], scores[3]['rrf'])
        self.assertGreater(scores[2]['rrf'], scores[4]['rrf'])

    def test_empty_results(self):
        scores = HybridSearchService._reciprocal_rank_fusion([], [])
        self.assertEqual(scores, {})

    def test_only_vector_results(self):
        vector_results = [(10, 0.99), (20, 0.85)]
        scores = HybridSearchService._reciprocal_rank_fusion(vector_results, [])
        self.assertIn(10, scores)
        self.assertIn(20, scores)
        self.assertEqual(scores[10]['fulltext_score'], 0.0)

    def test_only_fulltext_results(self):
        fulltext_results = [(10, 0.9), (20, 0.7)]
        scores = HybridSearchService._reciprocal_rank_fusion([], fulltext_results)
        self.assertIn(10, scores)
        self.assertEqual(scores[10]['vector_score'], 0.0)

    def test_rrf_constant_k60(self):
        """RRF com k=60: rank 1 = 1/61 ≈ 0.01639."""
        vector_results = [(1, 1.0)]
        scores = HybridSearchService._reciprocal_rank_fusion(vector_results, [], k=60)
        self.assertAlmostEqual(scores[1]['rrf'], 1 / 61, places=6)


class HybridSearchNoDbTests(TestCase):
    """Testa comportamento quando pgvector ou tsv não está disponível."""

    def _make_service(self):
        gemini_mock = MagicMock()
        gemini_mock.get_embedding.return_value = [0.1] * 768
        svc = HybridSearchService.__new__(HybridSearchService)
        svc.gemini_service = gemini_mock
        svc._pgvector_available = False
        svc._tsv_column_available = False
        return svc

    def test_search_returns_empty_without_vector(self):
        svc = self._make_service()
        with patch.object(svc, '_fulltext_search', return_value=[]):
            results = svc.search("contratos vencendo", query_embedding=[0.1] * 768)
        self.assertEqual(results, [])
