import json
import logging
from typing import Dict, Any, Optional, List

from django.conf import settings
from django.core.exceptions import ImproperlyConfigured

from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
from langchain_core.messages import HumanMessage, SystemMessage, AIMessage
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.output_parsers import JsonOutputParser

logger = logging.getLogger(__name__)

# Personalidade da Alice
ALICE_PERSONALITY = """
Você é Alice, a assistente virtual do Sistema Minerva.
Seu papel é ajudar usuários de forma clara, educada, natural e profissional.

REGRAS OBRIGATÓRIAS:
1. NUNCA mencione termos técnicos como SQL, banco de dados, consultas, query, exceção ou processamento
2. NUNCA exponha falhas técnicas ao usuário
3. Sempre responda como uma assistente humana experiente
4. Use linguagem natural, educada, profissional e acolhedora
5. Use emojis com moderação para tornar a conversa mais amigável 😊

FORMATO DE VALORES:
- Valores monetários: R$ X.XXX,XX (formato brasileiro)
- Datas: DD/MM/YYYY (formato brasileiro)
- Percentuais: X,XX%

QUANDO NÃO HOUVER RESULTADOS:
Responda de forma empática, por exemplo:
"Não encontrei informações sobre isso. Pode me dar mais detalhes para que eu possa ajudar melhor?"

QUANDO A PERGUNTA FOR VAGA:
Peça esclarecimentos de forma natural:
"Pode me dar um pouco mais de detalhes para que eu possa ajudar melhor?"

SAUDAÇÕES (oi, olá, bom dia, etc):
Responda de forma amigável apresentando suas capacidades:
"Olá! 😊 Eu sou a Alice, sua assistente virtual do Sistema Minerva.
Posso ajudar você a encontrar informações sobre contratos, orçamentos, funcionários e muito mais.
É só me dizer o que você precisa!"
"""

ALICE_FRIENDLY_ERROR = """
Desculpe, não consegui entender sua solicitação dessa vez.
Pode reformular a pergunta ou me dar mais detalhes? 😊
"""


class GeminiService:
    """
    Serviço para integração com a API do Google Gemini usando LangChain.
    Suporta chat, embeddings e RAG com pgvector.
    """

    def __init__(self):
        self.api_key = getattr(settings, 'GEMINI_API_KEY', None)
        if not self.api_key:
            raise ImproperlyConfigured("GEMINI_API_KEY não configurada nas settings")

        # Modelo de chat principal
        self.chat_model = ChatGoogleGenerativeAI(
            model="gemini-2.5-flash",
            google_api_key=self.api_key,
            temperature=0.3,
        )

        # Modelo de embeddings para vetorização
        self.embeddings_model = GoogleGenerativeAIEmbeddings(
            model="models/text-embedding-004",
            google_api_key=self.api_key,
        )

    def get_embedding(self, text: str) -> List[float]:
        """
        Gera embedding para um texto.

        Args:
            text: Texto para gerar embedding

        Returns:
            Lista de floats representando o embedding
        """
        try:
            return self.embeddings_model.embed_query(text)
        except Exception as e:
            logger.error(f"Erro ao gerar embedding: {str(e)}")
            return []

    def get_embeddings_batch(self, texts: List[str]) -> List[List[float]]:
        """
        Gera embeddings para múltiplos textos em batch.

        Args:
            texts: Lista de textos

        Returns:
            Lista de embeddings
        """
        try:
            return self.embeddings_model.embed_documents(texts)
        except Exception as e:
            logger.error(f"Erro ao gerar embeddings em batch: {str(e)}")
            return []

    def generate_response(self, prompt: str, system_instruction: str = None) -> Dict[str, Any]:
        """
        Gera uma resposta usando o modelo Gemini via LangChain.

        Args:
            prompt: O prompt para enviar ao modelo
            system_instruction: Instrução do sistema (opcional)

        Returns:
            Dict com a resposta e metadados
        """
        try:
            messages = []

            if system_instruction:
                messages.append(SystemMessage(content=system_instruction))

            messages.append(HumanMessage(content=prompt))

            response = self.chat_model.invoke(messages)

            return {
                'success': True,
                'content': response.content,
                'usage': {
                    'prompt_tokens': len(prompt.split()),
                    'completion_tokens': len(response.content.split()) if response.content else 0,
                },
                'model': 'gemini-1.5-flash',
                'metadata': {
                    'finish_reason': 'stop',
                    'response_metadata': getattr(response, 'response_metadata', {})
                }
            }

        except Exception as e:
            logger.error(f"Erro ao gerar resposta com Gemini/LangChain: {str(e)}")
            return {
                'success': False,
                'error': str(e),
                'content': None
            }

    def generate_response_with_context(
        self,
        prompt: str,
        context_documents: List[str],
        system_instruction: str = None,
        chat_history: List[Dict] = None
    ) -> Dict[str, Any]:
        """
        Gera resposta usando RAG com documentos de contexto.

        Args:
            prompt: Pergunta do usuário
            context_documents: Lista de documentos relevantes recuperados via similaridade
            system_instruction: Instrução do sistema
            chat_history: Histórico de mensagens anteriores

        Returns:
            Dict com a resposta e metadados
        """
        try:
            # Monta o contexto dos documentos
            context_str = "\n\n---\n\n".join(context_documents) if context_documents else ""

            # Template com RAG
            rag_template = ChatPromptTemplate.from_messages([
                ("system", """{system_instruction}

CONTEXTO RELEVANTE DO SISTEMA:
{context}

Use o contexto acima para responder às perguntas quando relevante."""),
                MessagesPlaceholder(variable_name="chat_history", optional=True),
                ("human", "{question}")
            ])

            # Prepara histórico
            history_messages = []
            if chat_history:
                for msg in chat_history[-10:]:  # Últimas 10 mensagens
                    if msg.get('role') == 'user':
                        history_messages.append(HumanMessage(content=msg.get('content', '')))
                    elif msg.get('role') == 'assistant':
                        history_messages.append(AIMessage(content=msg.get('content', '')))

            # Cria a chain
            chain = rag_template | self.chat_model

            response = chain.invoke({
                "system_instruction": system_instruction or "Você é Alice, assistente do Sistema Minerva.",
                "context": context_str,
                "chat_history": history_messages,
                "question": prompt
            })

            return {
                'success': True,
                'content': response.content,
                'usage': {
                    'prompt_tokens': len(prompt.split()),
                    'completion_tokens': len(response.content.split()) if response.content else 0,
                },
                'model': 'gemini-1.5-flash',
                'context_used': len(context_documents),
                'metadata': {
                    'finish_reason': 'stop',
                    'rag_enabled': True
                }
            }

        except Exception as e:
            logger.error(f"Erro ao gerar resposta com RAG: {str(e)}")
            return {
                'success': False,
                'error': str(e),
                'content': None
            }

    def interpret_natural_language_query(self, user_question: str, schema_info: str) -> Dict[str, Any]:
        """
        Interpreta uma pergunta em linguagem natural e gera SQL usando LangChain.

        Args:
            user_question: Pergunta do usuário
            schema_info: Informações sobre o esquema do banco

        Returns:
            Dict com SQL gerado e metadados
        """
        system_instruction = """
        Você é Alice, um assistente especializado em interpretar perguntas sobre dados financeiros e gerar consultas SQL.

        CONTEXTO DO SISTEMA MINERVA:
        - Sistema de gestão de contratos, orçamentos e funcionários
        - Banco de dados PostgreSQL
        - Tabelas principais: contracts, budgets, employees, budget_lines, etc.

        REGRAS IMPORTANTES:
        1. SEMPRE gere SQL válido para PostgreSQL
        2. Use APENAS tabelas e colunas que existem no schema fornecido
        3. Para valores monetários, use formatação brasileira (R$)
        4. Para datas, considere formato brasileiro (DD/MM/YYYY)
        5. Seja conservador com JOINs - use apenas quando necessário
        6. Sempre inclua limitadores (LIMIT) quando apropriado
        7. Para agregações, sempre use GROUP BY quando necessário

        FORMATO DE RESPOSTA:
        Responda SEMPRE em JSON válido com esta estrutura:
        {
            "intent": "descrição da intenção interpretada",
            "sql": "consulta SQL gerada",
            "explanation": "explicação em português do que a consulta faz",
            "confidence": número de 0 a 1 indicando confiança,
            "tables_used": ["lista", "de", "tabelas", "utilizadas"],
            "potential_issues": ["possíveis problemas ou limitações"]
        }
        """

        prompt = f"""
        ESQUEMA DO BANCO DE DADOS:
        {schema_info}

        PERGUNTA DO USUÁRIO:
        {user_question}

        Interprete a pergunta e gere uma consulta SQL apropriada.
        """

        response = self.generate_response(prompt, system_instruction)

        if response['success']:
            try:
                content = response['content']
                # Remove markdown se presente
                if content.startswith('```json'):
                    content = content.replace('```json', '').replace('```', '').strip()
                elif content.startswith('```'):
                    content = content.replace('```', '').strip()

                parsed_response = json.loads(content)

                return {
                    'success': True,
                    'interpretation': parsed_response,
                    'raw_response': response['content'],
                    'metadata': response.get('metadata', {})
                }

            except json.JSONDecodeError as e:
                logger.error(f"Erro ao parsear resposta JSON do Gemini: {str(e)}")
                return {
                    'success': False,
                    'error': f"Resposta inválida do modelo: {str(e)}",
                    'raw_response': response['content']
                }
        else:
            return response

    def generate_humanized_response(
        self,
        query_result: Any,
        original_question: str,
        sql_query: str,
        context_documents: List[str] = None
    ) -> Dict[str, Any]:
        """
        Gera uma resposta humanizada baseada nos resultados da consulta.
        Opcionalmente usa RAG para enriquecer a resposta.

        Args:
            query_result: Resultado da consulta SQL
            original_question: Pergunta original do usuário
            sql_query: Consulta SQL executada
            context_documents: Documentos de contexto para RAG (opcional)

        Returns:
            Dict com resposta humanizada
        """
        system_instruction = ALICE_PERSONALITY + """

        TAREFA ATUAL:
        Transforme os dados fornecidos em uma resposta natural e amigável.
        NUNCA mencione que os dados vieram de uma consulta ou banco de dados.
        Responda como se você simplesmente soubesse a informação.

        Se não houver dados, diga algo como:
        "Não encontrei informações sobre isso. Pode me dar mais detalhes?"

        Se houver muitos resultados, resuma os principais pontos.
        """

        # Converte o resultado para string legível
        if hasattr(query_result, '__iter__') and not isinstance(query_result, str):
            try:
                result_str = json.dumps(list(query_result), default=str, ensure_ascii=False, indent=2)
            except:
                result_str = str(query_result)
        else:
            result_str = str(query_result)

        prompt = f"""
        O usuário perguntou: {original_question}

        Informações disponíveis:
        {result_str}

        Responda de forma natural e amigável, sem mencionar aspectos técnicos.
        """

        # Se temos documentos de contexto, usa RAG
        if context_documents:
            return self.generate_response_with_context(
                prompt=prompt,
                context_documents=context_documents,
                system_instruction=system_instruction
            )

        return self.generate_response(prompt, system_instruction)
