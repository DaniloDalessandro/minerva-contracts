import logging
from typing import List, Optional, Dict, Any
from django.db import connection
from django.conf import settings

from ..models import DocumentEmbedding, ConversationEmbedding, ConversationSession, ConversationMessage
from .gemini_service import GeminiService

logger = logging.getLogger(__name__)


class EmbeddingService:
    """
    Serviço para gerenciar embeddings e busca semântica com pgvector.
    Usa LangChain + Gemini para gerar embeddings e PostgreSQL + pgvector para armazenamento e busca.
    """

    def __init__(self):
        self.gemini_service = GeminiService()
        self._pgvector_enabled = self._check_pgvector()

    def _check_pgvector(self) -> bool:
        """Verifica se pgvector está disponível no banco."""
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1 FROM pg_extension WHERE extname = 'vector'")
                return cursor.fetchone() is not None
        except Exception as e:
            logger.warning(f"pgvector não disponível: {str(e)}")
            return False

    def create_document_embedding(
        self,
        document_type: str,
        title: str,
        content: str,
        metadata: Dict = None
    ) -> Optional[DocumentEmbedding]:
        """
        Cria um documento com seu embedding vetorial.

        Args:
            document_type: Tipo do documento (SCHEMA, BUSINESS_RULE, FAQ, etc.)
            title: Título do documento
            content: Conteúdo do documento
            metadata: Metadados adicionais

        Returns:
            DocumentEmbedding criado ou None em caso de erro
        """
        try:
            # Gera embedding para o conteúdo
            embedding = self.gemini_service.get_embedding(content)

            if not embedding:
                logger.error("Falha ao gerar embedding para documento")
                return None

            doc = DocumentEmbedding.objects.create(
                document_type=document_type,
                title=title,
                content=content,
                metadata=metadata or {},
                embedding=embedding
            )

            logger.info(f"Documento criado com embedding: {doc.id} - {title}")
            return doc

        except Exception as e:
            logger.error(f"Erro ao criar documento com embedding: {str(e)}")
            return None

    def create_conversation_embedding(
        self,
        session: ConversationSession,
        content_summary: str,
        message: ConversationMessage = None
    ) -> Optional[ConversationEmbedding]:
        """
        Cria embedding para uma conversa ou mensagem.

        Args:
            session: Sessão da conversa
            content_summary: Resumo do conteúdo
            message: Mensagem específica (opcional)

        Returns:
            ConversationEmbedding criado ou None
        """
        try:
            embedding = self.gemini_service.get_embedding(content_summary)

            if not embedding:
                logger.error("Falha ao gerar embedding para conversa")
                return None

            conv_emb = ConversationEmbedding.objects.create(
                session=session,
                message=message,
                content_summary=content_summary,
                embedding=embedding
            )

            return conv_emb

        except Exception as e:
            logger.error(f"Erro ao criar embedding de conversa: {str(e)}")
            return None

    def search_similar_documents(
        self,
        query: str,
        document_type: str = None,
        limit: int = 5,
        threshold: float = 0.7
    ) -> List[Dict[str, Any]]:
        """
        Busca documentos similares usando busca vetorial.

        Args:
            query: Texto da busca
            document_type: Filtrar por tipo de documento (opcional)
            limit: Número máximo de resultados
            threshold: Limiar de similaridade (0-1)

        Returns:
            Lista de documentos similares com scores
        """
        try:
            # Gera embedding da query
            query_embedding = self.gemini_service.get_embedding(query)

            if not query_embedding:
                logger.error("Falha ao gerar embedding para query")
                return []

            if self._pgvector_enabled:
                return self._search_with_pgvector(
                    query_embedding, document_type, limit, threshold
                )
            else:
                return self._search_fallback(
                    query_embedding, document_type, limit, threshold
                )

        except Exception as e:
            logger.error(f"Erro na busca por similaridade: {str(e)}")
            return []

    def _search_with_pgvector(
        self,
        query_embedding: List[float],
        document_type: str = None,
        limit: int = 5,
        threshold: float = 0.7
    ) -> List[Dict[str, Any]]:
        """Busca usando pgvector nativo."""
        try:
            embedding_str = f"[{','.join(map(str, query_embedding))}]"

            type_filter = ""
            params = [embedding_str, 1 - threshold, limit]

            if document_type:
                type_filter = "AND document_type = %s"
                params = [embedding_str, document_type, 1 - threshold, limit]

            query = f"""
                SELECT
                    id,
                    document_type,
                    title,
                    content,
                    metadata,
                    1 - (embedding <=> %s::vector) as similarity
                FROM ai_assistant_documentembedding
                WHERE is_active = true
                {type_filter}
                AND 1 - (embedding <=> %s::vector) >= %s
                ORDER BY embedding <=> %s::vector
                LIMIT %s
            """

            # Ajusta parâmetros para query com 5 placeholders
            if document_type:
                params = [embedding_str, document_type, embedding_str, threshold, embedding_str, limit]
            else:
                params = [embedding_str, embedding_str, threshold, embedding_str, limit]

            with connection.cursor() as cursor:
                if document_type:
                    cursor.execute(f"""
                        SELECT
                            id,
                            document_type,
                            title,
                            content,
                            metadata,
                            1 - (embedding <=> %s::vector) as similarity
                        FROM ai_assistant_documentembedding
                        WHERE is_active = true
                        AND document_type = %s
                        AND 1 - (embedding <=> %s::vector) >= %s
                        ORDER BY embedding <=> %s::vector
                        LIMIT %s
                    """, [embedding_str, document_type, embedding_str, threshold, embedding_str, limit])
                else:
                    cursor.execute(f"""
                        SELECT
                            id,
                            document_type,
                            title,
                            content,
                            metadata,
                            1 - (embedding <=> %s::vector) as similarity
                        FROM ai_assistant_documentembedding
                        WHERE is_active = true
                        AND 1 - (embedding <=> %s::vector) >= %s
                        ORDER BY embedding <=> %s::vector
                        LIMIT %s
                    """, [embedding_str, embedding_str, threshold, embedding_str, limit])

                columns = [col[0] for col in cursor.description]
                results = [dict(zip(columns, row)) for row in cursor.fetchall()]

            return results

        except Exception as e:
            logger.error(f"Erro na busca pgvector: {str(e)}")
            return self._search_fallback(query_embedding, document_type, limit, threshold)

    def _search_fallback(
        self,
        query_embedding: List[float],
        document_type: str = None,
        limit: int = 5,
        threshold: float = 0.7
    ) -> List[Dict[str, Any]]:
        """Fallback para busca sem pgvector (usa similaridade de cosseno em Python)."""
        import math

        def cosine_similarity(a: List[float], b: List[float]) -> float:
            if not a or not b or len(a) != len(b):
                return 0.0
            dot_product = sum(x * y for x, y in zip(a, b))
            norm_a = math.sqrt(sum(x * x for x in a))
            norm_b = math.sqrt(sum(x * x for x in b))
            if norm_a == 0 or norm_b == 0:
                return 0.0
            return dot_product / (norm_a * norm_b)

        try:
            queryset = DocumentEmbedding.objects.filter(is_active=True)
            if document_type:
                queryset = queryset.filter(document_type=document_type)

            results = []
            for doc in queryset:
                if doc.embedding:
                    # Embedding pode ser list (pgvector) ou JSON
                    embedding = doc.embedding if isinstance(doc.embedding, list) else list(doc.embedding)
                    similarity = cosine_similarity(query_embedding, embedding)

                    if similarity >= threshold:
                        results.append({
                            'id': doc.id,
                            'document_type': doc.document_type,
                            'title': doc.title,
                            'content': doc.content,
                            'metadata': doc.metadata,
                            'similarity': similarity
                        })

            # Ordena por similaridade e limita
            results.sort(key=lambda x: x['similarity'], reverse=True)
            return results[:limit]

        except Exception as e:
            logger.error(f"Erro na busca fallback: {str(e)}")
            return []

    def search_similar_conversations(
        self,
        query: str,
        session_id: int = None,
        limit: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Busca conversas anteriores similares.

        Args:
            query: Texto da busca
            session_id: ID da sessão para excluir (opcional)
            limit: Número máximo de resultados

        Returns:
            Lista de conversas similares
        """
        try:
            query_embedding = self.gemini_service.get_embedding(query)

            if not query_embedding or not self._pgvector_enabled:
                return []

            embedding_str = f"[{','.join(map(str, query_embedding))}]"

            exclude_filter = ""
            params = [embedding_str, embedding_str, limit]

            if session_id:
                exclude_filter = "AND session_id != %s"
                params = [embedding_str, session_id, embedding_str, limit]

            with connection.cursor() as cursor:
                if session_id:
                    cursor.execute(f"""
                        SELECT
                            ce.id,
                            ce.session_id,
                            ce.content_summary,
                            cs.title as session_title,
                            1 - (ce.embedding <=> %s::vector) as similarity
                        FROM ai_assistant_conversationembedding ce
                        JOIN ai_assistant_conversationsession cs ON ce.session_id = cs.id
                        WHERE ce.session_id != %s
                        ORDER BY ce.embedding <=> %s::vector
                        LIMIT %s
                    """, params)
                else:
                    cursor.execute(f"""
                        SELECT
                            ce.id,
                            ce.session_id,
                            ce.content_summary,
                            cs.title as session_title,
                            1 - (ce.embedding <=> %s::vector) as similarity
                        FROM ai_assistant_conversationembedding ce
                        JOIN ai_assistant_conversationsession cs ON ce.session_id = cs.id
                        ORDER BY ce.embedding <=> %s::vector
                        LIMIT %s
                    """, [embedding_str, embedding_str, limit])

                columns = [col[0] for col in cursor.description]
                return [dict(zip(columns, row)) for row in cursor.fetchall()]

        except Exception as e:
            logger.error(f"Erro na busca de conversas similares: {str(e)}")
            return []

    def get_context_for_query(
        self,
        query: str,
        include_schema: bool = True,
        include_business_rules: bool = True,
        include_faqs: bool = True,
        limit_per_type: int = 3
    ) -> List[str]:
        """
        Recupera contexto relevante para uma query usando RAG.

        Args:
            query: Pergunta do usuário
            include_schema: Incluir documentos de schema
            include_business_rules: Incluir regras de negócio
            include_faqs: Incluir FAQs
            limit_per_type: Limite de documentos por tipo

        Returns:
            Lista de conteúdos de documentos relevantes
        """
        context_docs = []

        types_to_search = []
        if include_schema:
            types_to_search.append('SCHEMA')
        if include_business_rules:
            types_to_search.append('BUSINESS_RULE')
        if include_faqs:
            types_to_search.append('FAQ')

        for doc_type in types_to_search:
            results = self.search_similar_documents(
                query=query,
                document_type=doc_type,
                limit=limit_per_type,
                threshold=0.5
            )
            for doc in results:
                context_docs.append(f"[{doc['document_type']}] {doc['title']}:\n{doc['content']}")

        return context_docs

    def index_database_schema(self, schema_info: str) -> int:
        """
        Indexa informações do schema do banco como documentos vetorizados.

        Args:
            schema_info: String com informações do schema

        Returns:
            Número de documentos criados
        """
        # Remove documentos antigos de schema
        DocumentEmbedding.objects.filter(document_type='SCHEMA').delete()

        # Divide o schema em partes menores para melhor recuperação
        tables = schema_info.split('\n\n')
        created = 0

        for table_info in tables:
            if table_info.strip():
                # Extrai nome da tabela
                lines = table_info.strip().split('\n')
                title = lines[0] if lines else 'Schema'

                doc = self.create_document_embedding(
                    document_type='SCHEMA',
                    title=title,
                    content=table_info.strip(),
                    metadata={'source': 'database_schema'}
                )
                if doc:
                    created += 1

        logger.info(f"Indexados {created} documentos de schema")
        return created

    def add_business_rule(self, title: str, content: str, metadata: Dict = None) -> Optional[DocumentEmbedding]:
        """Adiciona uma regra de negócio ao índice."""
        return self.create_document_embedding(
            document_type='BUSINESS_RULE',
            title=title,
            content=content,
            metadata=metadata
        )

    def add_faq(self, question: str, answer: str, metadata: Dict = None) -> Optional[DocumentEmbedding]:
        """Adiciona uma FAQ ao índice."""
        return self.create_document_embedding(
            document_type='FAQ',
            title=question,
            content=f"Pergunta: {question}\nResposta: {answer}",
            metadata=metadata
        )

    def add_query_example(
        self,
        natural_language: str,
        sql_query: str,
        explanation: str = None
    ) -> Optional[DocumentEmbedding]:
        """Adiciona um exemplo de consulta ao índice."""
        content = f"Pergunta: {natural_language}\nSQL: {sql_query}"
        if explanation:
            content += f"\nExplicação: {explanation}"

        return self.create_document_embedding(
            document_type='QUERY_EXAMPLE',
            title=natural_language[:100],
            content=content,
            metadata={'sql': sql_query}
        )
