import {
  sendMessageAPI,
  quickQuestionAPI,
  getStatsAPI,
  getSessionsAPI,
  getSessionDetailAPI,
  sendMessageToSessionAPI,
  clearSessionAPI,
  getAvailableTablesAPI,
  getDatabaseSchemaAPI,
} from '@/lib/api/alice';
import type {
  ChatMessage,
  ChatResponse,
  QuickQuestionRequest,
  SessionStats,
  ConversationSession,
} from '@/types/entities/alice';

export class AliceService {
  static async sendMessage(data: ChatMessage): Promise<ChatResponse> {
    return sendMessageAPI(data);
  }

  static async quickQuestion(data: QuickQuestionRequest): Promise<Omit<ChatResponse, 'session_id'>> {
    return quickQuestionAPI(data);
  }

  static async getStats(): Promise<SessionStats> {
    return getStatsAPI();
  }

  static async getSessions(): Promise<{ results: ConversationSession[] }> {
    return getSessionsAPI();
  }

  static async getSessionDetail(sessionId: number): Promise<ConversationSession & { messages: any[] }> {
    return getSessionDetailAPI(sessionId);
  }

  static async sendMessageToSession(sessionId: number, message: string): Promise<ChatResponse> {
    return sendMessageToSessionAPI(sessionId, message);
  }

  static async clearSession(sessionId: number): Promise<{ success: boolean; message: string }> {
    return clearSessionAPI(sessionId);
  }

  static async getAvailableTables(): Promise<string[]> {
    return getAvailableTablesAPI();
  }

  static async getDatabaseSchema(): Promise<any[]> {
    return getDatabaseSchemaAPI();
  }
}
