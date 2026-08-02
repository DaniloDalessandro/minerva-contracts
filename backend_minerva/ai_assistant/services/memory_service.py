"""
MemoryService — memória de curto e longo prazo para o agente Alice.

Curto prazo  → Redis (TTL configurável, padrão 24h, últimas N mensagens)
Longo prazo  → PostgreSQL (ConversationMessage, já existente)

Uso:
    memory = MemoryService()
    memory.save_message(session_id, "user", "Quantos contratos existem?")
    memory.save_message(session_id, "assistant", "Existem 42 contratos ativos.")
    history = memory.get_history(session_id, limit=10)
"""
import json
import logging
from typing import Dict, List, Optional

from django.conf import settings

logger = logging.getLogger(__name__)

_REDIS_PREFIX = "alice:memory:"


def _get_redis():
    """Retorna cliente Redis ou None se não disponível."""
    try:
        import redis
        url = getattr(settings, 'REDIS_URL', 'redis://localhost:6379/0')
        client = redis.from_url(url, decode_responses=True, socket_connect_timeout=2)
        client.ping()
        return client
    except Exception as exc:
        logger.warning("MemoryService: Redis indisponível — %s", exc)
        return None


class MemoryService:
    """
    Gerencia memória conversacional em duas camadas:
    - Redis (curto prazo): rápido, com TTL, ring-buffer das últimas N mensagens
    - PostgreSQL (longo prazo): via ConversationMessage (já salvo pelas views)
    """

    def __init__(self):
        self._redis = _get_redis()
        self._ttl: int = getattr(settings, 'ALICE_REDIS_MEMORY_TTL', 86400)
        self._window: int = getattr(settings, 'ALICE_MEMORY_WINDOW', 20)

    # ------------------------------------------------------------------
    # Escrita
    # ------------------------------------------------------------------
    def save_message(self, session_id: str, role: str, content: str) -> None:
        """
        Persiste uma mensagem no Redis.
        ring-buffer: mantém somente as últimas _window mensagens.
        """
        if not self._redis:
            return
        try:
            key = f"{_REDIS_PREFIX}{session_id}"
            entry = json.dumps({"role": role, "content": content[:1000]}, ensure_ascii=False)
            pipe = self._redis.pipeline()
            pipe.rpush(key, entry)
            pipe.ltrim(key, -self._window, -1)
            pipe.expire(key, self._ttl)
            pipe.execute()
        except Exception as exc:
            logger.warning("MemoryService.save_message Redis error: %s", exc)

    # ------------------------------------------------------------------
    # Leitura
    # ------------------------------------------------------------------
    def get_history(
        self,
        session_id: str,
        limit: int = 10,
        fallback_to_db: bool = True,
    ) -> List[Dict[str, str]]:
        """
        Retorna histórico recente da conversa.
        Tenta Redis primeiro; se vazio, lê do PostgreSQL.
        """
        history = self._get_from_redis(session_id, limit)
        if history:
            return history

        if fallback_to_db:
            return self._get_from_db(session_id, limit)
        return []

    def _get_from_redis(self, session_id: str, limit: int) -> List[Dict[str, str]]:
        if not self._redis:
            return []
        try:
            key = f"{_REDIS_PREFIX}{session_id}"
            raw_messages = self._redis.lrange(key, -limit, -1)
            result = []
            for raw in raw_messages:
                try:
                    result.append(json.loads(raw))
                except json.JSONDecodeError:
                    pass
            return result
        except Exception as exc:
            logger.warning("MemoryService._get_from_redis error: %s", exc)
            return []

    def _get_from_db(self, session_id: str, limit: int) -> List[Dict[str, str]]:
        try:
            from ..models import ConversationMessage, ConversationSession
            try:
                session = ConversationSession.objects.get(session_id=session_id)
            except ConversationSession.DoesNotExist:
                return []

            messages = (
                ConversationMessage.objects
                .filter(session=session)
                .exclude(message_type__in=['SYSTEM', 'ERROR'])
                .order_by('-created_at')[:limit]
            )
            result = []
            for msg in reversed(list(messages)):
                role = 'user' if msg.message_type == 'USER' else 'assistant'
                result.append({'role': role, 'content': msg.content})
            return result
        except Exception as exc:
            logger.warning("MemoryService._get_from_db error: %s", exc)
            return []

    # ------------------------------------------------------------------
    # Utilitários
    # ------------------------------------------------------------------
    def clear_session(self, session_id: str) -> None:
        """Remove a memória Redis de uma sessão."""
        if not self._redis:
            return
        try:
            self._redis.delete(f"{_REDIS_PREFIX}{session_id}")
        except Exception as exc:
            logger.warning("MemoryService.clear_session error: %s", exc)

    def warm_from_db(self, session_id: str) -> None:
        """
        Pré-carrega o histórico do PostgreSQL no Redis (útil ao reconectar).
        Chamado quando Redis está vazio mas sessão existe no banco.
        """
        if not self._redis:
            return
        try:
            db_history = self._get_from_db(session_id, self._window)
            if not db_history:
                return
            key = f"{_REDIS_PREFIX}{session_id}"
            if self._redis.exists(key):
                return  # já tem dados no Redis, não sobrescrever
            pipe = self._redis.pipeline()
            for msg in db_history:
                entry = json.dumps(msg, ensure_ascii=False)
                pipe.rpush(key, entry)
            pipe.expire(key, self._ttl)
            pipe.execute()
        except Exception as exc:
            logger.warning("MemoryService.warm_from_db error: %s", exc)
