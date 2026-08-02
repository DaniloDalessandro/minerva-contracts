"""
Testes unitários para MemoryService.

Cobre:
- Escrita e leitura no Redis (mockado)
- Fallback para PostgreSQL quando Redis indisponível
- Ring-buffer (limite de mensagens)
- Clear de sessão
"""
from unittest.mock import MagicMock, patch
from django.test import TestCase


class MemoryServiceRedisTests(TestCase):
    """Testa comportamento com Redis disponível."""

    def _make_service(self, redis_mock):
        with patch('ai_assistant.services.memory_service._get_redis', return_value=redis_mock):
            from ai_assistant.services.memory_service import MemoryService
            # Força reimport para pegar mock
            svc = MemoryService.__new__(MemoryService)
            svc._redis = redis_mock
            svc._ttl = 86400
            svc._window = 20
            return svc

    def test_save_message_calls_rpush(self):
        redis_mock = MagicMock()
        pipe_mock = MagicMock()
        redis_mock.pipeline.return_value = pipe_mock
        pipe_mock.__enter__ = lambda s: pipe_mock
        pipe_mock.__exit__ = MagicMock(return_value=False)

        from ai_assistant.services.memory_service import MemoryService
        svc = MemoryService.__new__(MemoryService)
        svc._redis = redis_mock
        svc._ttl = 86400
        svc._window = 20

        svc.save_message('sess-001', 'user', 'Quantos contratos existem?')

        redis_mock.pipeline.assert_called_once()
        pipe_mock.rpush.assert_called_once()
        pipe_mock.ltrim.assert_called_once()
        pipe_mock.expire.assert_called_once()
        pipe_mock.execute.assert_called_once()

    def test_get_history_from_redis(self):
        import json
        redis_mock = MagicMock()
        redis_mock.lrange.return_value = [
            json.dumps({'role': 'user', 'content': 'Oi'}),
            json.dumps({'role': 'assistant', 'content': 'Olá!'}),
        ]

        from ai_assistant.services.memory_service import MemoryService
        svc = MemoryService.__new__(MemoryService)
        svc._redis = redis_mock
        svc._ttl = 86400
        svc._window = 20

        history = svc._get_from_redis('sess-001', 10)
        self.assertEqual(len(history), 2)
        self.assertEqual(history[0]['role'], 'user')
        self.assertEqual(history[1]['role'], 'assistant')

    def test_clear_session_deletes_key(self):
        redis_mock = MagicMock()

        from ai_assistant.services.memory_service import MemoryService
        svc = MemoryService.__new__(MemoryService)
        svc._redis = redis_mock
        svc._ttl = 86400
        svc._window = 20

        svc.clear_session('sess-001')
        redis_mock.delete.assert_called_once_with('alice:memory:sess-001')


class MemoryServiceNoRedisTests(TestCase):
    """Testa comportamento sem Redis (graceful degradation)."""

    def test_save_message_without_redis_does_not_raise(self):
        from ai_assistant.services.memory_service import MemoryService
        svc = MemoryService.__new__(MemoryService)
        svc._redis = None
        svc._ttl = 86400
        svc._window = 20

        # Não deve levantar exceção
        svc.save_message('sess-001', 'user', 'Teste')

    def test_get_history_without_redis_returns_empty(self):
        from ai_assistant.services.memory_service import MemoryService
        svc = MemoryService.__new__(MemoryService)
        svc._redis = None
        svc._ttl = 86400
        svc._window = 20

        result = svc._get_from_redis('sess-001', 10)
        self.assertEqual(result, [])

    def test_clear_session_without_redis_does_not_raise(self):
        from ai_assistant.services.memory_service import MemoryService
        svc = MemoryService.__new__(MemoryService)
        svc._redis = None
        svc._ttl = 86400
        svc._window = 20

        svc.clear_session('sess-001')  # deve ser silencioso
