/**
 * UI Constants
 * Constants for user interface behavior and configuration
 */

/**
 * Pagination defaults
 */
export const PAGINATION_DEFAULTS = {
  PAGE: 1,
  PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [10, 25, 50, 100],
} as const;

/**
 * Debounce delays (in milliseconds)
 */
export const DEBOUNCE_DELAYS = {
  SEARCH: 300,
  INPUT: 500,
  AUTOCOMPLETE: 400,
  SCROLL: 150,
} as const;

/**
 * Token refresh configuration (in milliseconds and seconds)
 */
export const TOKEN_REFRESH = {
  CHECK_INTERVAL: 30 * 1000, // 30 seconds
  EXPIRY_THRESHOLD: 300, // 5 minutes in seconds
  RETRY_DELAY: 5000, // 5 seconds
  MAX_RETRIES: 3,
} as const;

/**
 * API request timeouts (in milliseconds)
 */
export const TIMEOUTS = {
  DEFAULT: 30000, // 30 seconds
  UPLOAD: 120000, // 2 minutes
  DOWNLOAD: 180000, // 3 minutes
  LONG_OPERATION: 300000, // 5 minutes
} as const;

/**
 * Toast notification durations (in milliseconds)
 */
export const TOAST_DURATION = {
  SHORT: 2000,
  MEDIUM: 4000,
  LONG: 6000,
  PERSISTENT: 0, // Won't auto-dismiss
} as const;

/**
 * Animation durations (in milliseconds)
 */
export const ANIMATION_DURATION = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500,
} as const;

/**
 * Table configuration
 */
export const TABLE_CONFIG = {
  MIN_COLUMN_WIDTH: 100,
  DEFAULT_COLUMN_WIDTH: 150,
  MAX_COLUMN_WIDTH: 500,
  ROW_HEIGHT: 48,
  HEADER_HEIGHT: 56,
} as const;

/**
 * Form configuration
 */
export const FORM_CONFIG = {
  AUTO_SAVE_DELAY: 3000, // 3 seconds
  VALIDATION_DELAY: 500, // 0.5 seconds
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  ALLOWED_DOCUMENT_TYPES: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
} as const;

/**
 * Date format constants
 */
export const DATE_FORMATS = {
  DISPLAY: 'dd/MM/yyyy',
  DISPLAY_WITH_TIME: 'dd/MM/yyyy HH:mm',
  API: 'yyyy-MM-dd',
  API_WITH_TIME: "yyyy-MM-dd'T'HH:mm:ss",
  MONTH_YEAR: 'MM/yyyy',
  YEAR: 'yyyy',
} as const;

/**
 * Currency configuration
 */
export const CURRENCY_CONFIG = {
  LOCALE: 'pt-BR',
  CURRENCY: 'BRL',
  DECIMAL_PLACES: 2,
  THOUSAND_SEPARATOR: '.',
  DECIMAL_SEPARATOR: ',',
} as const;

/**
 * Breakpoints (in pixels) - matching Tailwind defaults
 */
export const BREAKPOINTS = {
  XS: 0,
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280,
  '2XL': 1536,
} as const;

/**
 * Z-index layers
 */
export const Z_INDEX = {
  BASE: 0,
  DROPDOWN: 1000,
  STICKY: 1100,
  FIXED: 1200,
  MODAL_BACKDROP: 1300,
  MODAL: 1400,
  POPOVER: 1500,
  TOOLTIP: 1600,
  TOAST: 1700,
  LOADING: 1800,
} as const;

/**
 * Local storage keys
 */
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_ID: 'user_id',
  USER_EMAIL: 'user_email',
  USER_NAME: 'user_name',
  THEME: 'theme',
  LANGUAGE: 'language',
  SIDEBAR_STATE: 'sidebar_state',
  TABLE_PREFERENCES: 'table_preferences',
} as const;

/**
 * Query keys for React Query
 */
export const QUERY_KEYS = {
  COLABORADORES: 'colaboradores',
  COLABORADOR: 'colaborador',
  CONTRATOS: 'contratos',
  CONTRATO: 'contrato',
  BUDGETS: 'budgets',
  BUDGET: 'budget',
  BUDGET_LINES: 'budget-lines',
  BUDGET_LINE: 'budget-line',
  AUXILIOS: 'auxilios',
  AUXILIO: 'auxilio',
  MANAGEMENT_CENTERS: 'management-centers',
  REQUESTING_CENTERS: 'requesting-centers',
  DIRECTIONS: 'directions',
  MANAGEMENTS: 'managements',
  COORDINATIONS: 'coordinations',
  ALICE_SESSIONS: 'alice-sessions',
  ALICE_STATS: 'alice-stats',
  USER_PROFILE: 'user-profile',
} as const;

/**
 * Error messages
 */
export const ERROR_MESSAGES = {
  GENERIC: 'Ocorreu um erro inesperado. Tente novamente.',
  NETWORK: 'Erro de conexão. Verifique sua internet.',
  UNAUTHORIZED: 'Sessão expirada. Faça login novamente.',
  FORBIDDEN: 'Você não tem permissão para acessar este recurso.',
  NOT_FOUND: 'Recurso não encontrado.',
  SERVER_ERROR: 'Erro no servidor. Tente novamente mais tarde.',
  VALIDATION: 'Verifique os campos e tente novamente.',
  REQUIRED_FIELD: 'Este campo é obrigatório.',
  INVALID_EMAIL: 'Email inválido.',
  INVALID_CPF: 'CPF inválido.',
  INVALID_PHONE: 'Telefone inválido.',
  INVALID_DATE: 'Data inválida.',
  FILE_TOO_LARGE: 'Arquivo muito grande.',
  INVALID_FILE_TYPE: 'Tipo de arquivo não permitido.',
} as const;

/**
 * Success messages
 */
export const SUCCESS_MESSAGES = {
  CREATED: 'Criado com sucesso!',
  UPDATED: 'Atualizado com sucesso!',
  DELETED: 'Excluído com sucesso!',
  SAVED: 'Salvo com sucesso!',
  SENT: 'Enviado com sucesso!',
  UPLOADED: 'Upload realizado com sucesso!',
  DOWNLOADED: 'Download realizado com sucesso!',
  PASSWORD_CHANGED: 'Senha alterada com sucesso!',
  LOGGED_IN: 'Login realizado com sucesso!',
  LOGGED_OUT: 'Logout realizado com sucesso!',
} as const;
