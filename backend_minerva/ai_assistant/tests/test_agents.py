"""
Testes para o fluxo do AliceGraphService.

Cobre:
- Classificação de perguntas → agente correto
- Roteamento do LangGraph
- Resposta com campos obrigatórios (success, response, confidence, source)
- Fallback quando LLM indisponível
"""
from unittest.mock import MagicMock, patch
from django.test import TestCase, override_settings


class ClassifyNodeTests(TestCase):
    """Testa o nó de classificação isoladamente."""

    def _classify(self, question: str) -> str:
        """Chama classify_node e retorna agent_type."""
        from ai_assistant.services.alice_graph import classify_node
        state = {'question': question, 'resolved_question': question}
        result = classify_node(state)
        return result.get('agent_type', '')

    @patch('ai_assistant.services.alice_graph._get_llm')
    def test_classifies_database_question(self, mock_llm_factory):
        mock_llm = MagicMock()
        mock_llm.invoke.return_value = MagicMock(content='database')
        mock_llm_factory.return_value = mock_llm

        agent_type = self._classify('Quantos contratos ativos existem?')
        self.assertEqual(agent_type, 'database')

    @patch('ai_assistant.services.alice_graph._get_llm')
    def test_classifies_general_question(self, mock_llm_factory):
        mock_llm = MagicMock()
        mock_llm.invoke.return_value = MagicMock(content='general')
        mock_llm_factory.return_value = mock_llm

        agent_type = self._classify('Olá, bom dia!')
        self.assertEqual(agent_type, 'general')

    @patch('ai_assistant.services.alice_graph._get_llm')
    def test_invalid_llm_response_defaults_to_general(self, mock_llm_factory):
        mock_llm = MagicMock()
        mock_llm.invoke.return_value = MagicMock(content='INVALID_TYPE')
        mock_llm_factory.return_value = mock_llm

        agent_type = self._classify('Qualquer coisa')
        self.assertEqual(agent_type, 'general')

    @patch('ai_assistant.services.alice_graph._get_llm')
    def test_llm_error_defaults_to_database(self, mock_llm_factory):
        mock_llm = MagicMock()
        mock_llm.invoke.side_effect = Exception("LLM unavailable")
        mock_llm_factory.return_value = mock_llm

        agent_type = self._classify('Quantos funcionários existem?')
        self.assertEqual(agent_type, 'database')


class AliceGraphServiceTests(TestCase):
    """Testa AliceGraphService.run com mocks."""

    @patch('ai_assistant.services.alice_graph.get_graph')
    @patch('ai_assistant.services.memory_service._get_redis', return_value=None)
    def test_run_returns_required_fields(self, _mock_redis, mock_get_graph):
        mock_graph = MagicMock()
        mock_graph.invoke.return_value = {
            'question': 'Teste',
            'resolved_question': 'Teste',
            'agent_type': 'general',
            'agent_response': 'Resposta de teste',
            'confidence': 0.85,
            'source': 'Conhecimento Geral',
            'tools_used': ['general_llm'],
            'final_response': 'Resposta de teste',
            'start_time': 0.0,
        }
        mock_get_graph.return_value = mock_graph

        from ai_assistant.services.alice_graph import AliceGraphService
        svc = AliceGraphService()
        result = svc.run('Olá!')

        self.assertIn('success', result)
        self.assertIn('response', result)
        self.assertIn('confidence', result)
        self.assertIn('source', result)
        self.assertIn('agent_type', result)
        self.assertIn('tools_used', result)
        self.assertTrue(result['success'])
        self.assertEqual(result['response'], 'Resposta de teste')
        self.assertEqual(result['confidence'], 0.85)

    @patch('ai_assistant.services.alice_graph.get_graph')
    @patch('ai_assistant.services.memory_service._get_redis', return_value=None)
    def test_run_handles_graph_exception(self, _mock_redis, mock_get_graph):
        mock_graph = MagicMock()
        mock_graph.invoke.side_effect = Exception("Graph crashed")
        mock_get_graph.return_value = mock_graph

        from ai_assistant.services.alice_graph import AliceGraphService
        svc = AliceGraphService()
        result = svc.run('Qualquer pergunta')

        self.assertFalse(result['success'])
        self.assertIn('response', result)
        self.assertIsInstance(result['response'], str)
        self.assertGreater(len(result['response']), 0)


class ValidateNodeTests(TestCase):
    """Testa o nó de validação e score de confiança."""

    def test_high_confidence_no_disclaimer(self):
        from ai_assistant.services.alice_graph import validate_node
        import time
        state = {
            'agent_response': 'Existem 42 contratos ativos.',
            'confidence': 0.92,
            'source': 'Banco de Dados',
            'start_time': time.time(),
        }
        result = validate_node(state)
        self.assertNotIn('⚠️', result['final_response'])
        self.assertEqual(result['final_response'], 'Existem 42 contratos ativos.')

    @override_settings(ALICE_CONFIDENCE_THRESHOLD=0.70)
    def test_low_confidence_adds_disclaimer(self):
        from ai_assistant.services.alice_graph import validate_node
        import time
        state = {
            'agent_response': 'Talvez existam contratos.',
            'confidence': 0.50,
            'source': 'Conhecimento Geral',
            'start_time': time.time(),
        }
        result = validate_node(state)
        self.assertIn('⚠️', result['final_response'])
        self.assertIn('50%', result['final_response'])
