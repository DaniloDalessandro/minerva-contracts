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
    console.log("💬 Enviando mensagem para Alice:", data.message.substring(0, 50));
    const result = await sendMessageAPI(data);
    console.log("✅ Resposta recebida de Alice");
    return result;
  }

  static async quickQuestion(data: QuickQuestionRequest): Promise<Omit<ChatResponse, 'session_id'>> {
    console.log("⚡ Pergunta rápida para Alice:", data.question.substring(0, 50));
    const result = await quickQuestionAPI(data);
    console.log("✅ Resposta rápida recebida");
    return result;
  }

  static async getStats(): Promise<SessionStats> {
    console.log("📊 Buscando estatísticas do Alice");
    const result = await getStatsAPI();
    console.log("✅ Estatísticas recebidas:", {
      totalSessions: result.total_sessions,
      activeSessions: result.active_sessions,
    });
    return result;
  }

  static async getSessions(): Promise<{ results: ConversationSession[] }> {
    console.log("💬 Buscando sessões de conversa");
    const result = await getSessionsAPI();
    console.log("✅ Sessões recebidas:", result.results?.length || 0);
    return result;
  }

  static async getSessionDetail(sessionId: number): Promise<ConversationSession & { messages: any[] }> {
    console.log("💬 Buscando detalhes da sessão:", sessionId);
    const result = await getSessionDetailAPI(sessionId);
    console.log("✅ Detalhes da sessão recebidos:", result.message_count, "mensagens");
    return result;
  }

  static async sendMessageToSession(sessionId: number, message: string): Promise<ChatResponse> {
    console.log("💬 Enviando mensagem para sessão:", sessionId);
    const result = await sendMessageToSessionAPI(sessionId, message);
    console.log("✅ Mensagem enviada para sessão");
    return result;
  }

  static async clearSession(sessionId: number): Promise<{ success: boolean; message: string }> {
    console.log("🗑️ Limpando sessão:", sessionId);
    const result = await clearSessionAPI(sessionId);
    console.log("✅ Sessão limpa com sucesso");
    return result;
  }

  static async getAvailableTables(): Promise<string[]> {
    console.log("📋 Buscando tabelas disponíveis");
    const result = await getAvailableTablesAPI();
    console.log("✅ Tabelas recebidas:", result.length);
    return result;
  }

  static async getDatabaseSchema(): Promise<any[]> {
    console.log("📋 Buscando esquema do banco de dados");
    const result = await getDatabaseSchemaAPI();
    console.log("✅ Esquema recebido");
    return result;
  }
}
