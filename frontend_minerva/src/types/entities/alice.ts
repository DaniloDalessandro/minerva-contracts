// Chat message request
export interface ChatMessage {
  message: string;
  session_id?: string;
  create_new_session?: boolean;
}

// Chat response
export interface ChatResponse {
  success: boolean;
  session_id: string;
  response: string;
  sql_query?: string;
  data?: any[];
  execution_time_ms?: number;
  result_count?: number;
  error?: string;
  metadata?: any;
}

// Quick question request
export interface QuickQuestionRequest {
  question: string;
}

// Session statistics
export interface SessionStats {
  total_sessions: number;
  active_sessions: number;
  total_messages: number;
  total_queries: number;
  successful_queries: number;
  average_response_time: number;
  most_active_user: string;
  popular_questions: Array<{
    user_question: string;
    count: number;
  }>;
}

// Conversation session
export interface ConversationSession {
  id: number;
  session_id: string;
  title: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  message_count: number;
}
