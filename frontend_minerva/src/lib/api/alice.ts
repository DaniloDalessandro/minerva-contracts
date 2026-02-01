import { apiClient } from './client';
import { API_ENDPOINTS } from '@/constants/api-endpoints';
import type {
  ChatMessage,
  ChatResponse,
  QuickQuestionRequest,
  SessionStats,
  ConversationSession,
} from '@/types/entities/alice';

// Funções da API da Alice
export async function sendMessageAPI(data: ChatMessage): Promise<ChatResponse> {
  const url = API_ENDPOINTS.ALICE.CHAT;
  const response = await apiClient(url, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error('Falha ao enviar mensagem');
  }
  return response.json();
}

export async function quickQuestionAPI(data: QuickQuestionRequest): Promise<Omit<ChatResponse, 'session_id'>> {
  const url = API_ENDPOINTS.ALICE.QUICK_QUESTION;
  const response = await apiClient(url, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error('Falha ao enviar pergunta rápida');
  }
  return response.json();
}

export async function getStatsAPI(): Promise<SessionStats> {
  const url = API_ENDPOINTS.ALICE.STATS;
  const response = await apiClient(url);
  if (!response.ok) {
    throw new Error('Falha ao buscar estatísticas');
  }
  return response.json();
}

export async function getSessionsAPI(): Promise<{ results: ConversationSession[] }> {
  const url = API_ENDPOINTS.ALICE.SESSIONS;
  const response = await apiClient(url);
  if (!response.ok) {
    throw new Error('Falha ao buscar sessões');
  }
  return response.json();
}

export async function getSessionDetailAPI(sessionId: number): Promise<ConversationSession & { messages: any[] }> {
  const url = API_ENDPOINTS.ALICE.SESSION_DETAIL(sessionId);
  const response = await apiClient(url);
  if (!response.ok) {
    throw new Error('Falha ao buscar detalhes da sessão');
  }
  return response.json();
}

export async function sendMessageToSessionAPI(sessionId: number, message: string): Promise<ChatResponse> {
  const url = API_ENDPOINTS.ALICE.SESSION_SEND(sessionId);
  const response = await apiClient(url, {
    method: 'POST',
    body: JSON.stringify({ message }),
  });
  if (!response.ok) {
    throw new Error('Falha ao enviar mensagem para a sessão');
  }
  return response.json();
}

export async function clearSessionAPI(sessionId: number): Promise<{ success: boolean; message: string }> {
  const url = API_ENDPOINTS.ALICE.SESSION_CLEAR(sessionId);
  const response = await apiClient(url, {
    method: 'POST',
  });
  if (!response.ok) {
    throw new Error('Falha ao limpar a sessão');
  }
  return response.json();
}

export async function getAvailableTablesAPI(): Promise<string[]> {
  const url = API_ENDPOINTS.ALICE.SCHEMA_TABLES;
  const response = await apiClient(url);
  if (!response.ok) {
    throw new Error('Falha ao buscar tabelas disponíveis');
  }
  return response.json();
}

export async function getDatabaseSchemaAPI(): Promise<any[]> {
  const url = API_ENDPOINTS.ALICE.SCHEMA;
  const response = await apiClient(url);
  if (!response.ok) {
    throw new Error('Falha ao buscar o esquema do banco de dados');
  }
  return response.json();
}

// Exportação legada para compatibilidade (obsoleto - use a camada de serviço em seu lugar)
export const aliceAPI = {
  sendMessage: sendMessageAPI,
  quickQuestion: quickQuestionAPI,
  getStats: getStatsAPI,
  getSessions: getSessionsAPI,
  getSessionDetail: getSessionDetailAPI,
  sendMessageToSession: sendMessageToSessionAPI,
  clearSession: clearSessionAPI,
  getAvailableTables: getAvailableTablesAPI,
  getDatabaseSchema: getDatabaseSchemaAPI,
};
