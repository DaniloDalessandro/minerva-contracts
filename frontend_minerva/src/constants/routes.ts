/**
 * Application Routes Constants
 * Centralized route paths for the application
 */

export const ROUTES = {
  // Public routes
  HOME: '/',
  LOGIN: '/login',

  // Dashboard
  DASHBOARD: '/dashboard',

  // Colaboradores (Employees)
  COLABORADORES: '/colaboradores',
  COLABORADOR_DETAIL: (id: number) => `/colaboradores/${id}`,
  COLABORADOR_CREATE: '/colaboradores/novo',
  COLABORADOR_EDIT: (id: number) => `/colaboradores/${id}/editar`,

  // Contratos (Contracts)
  CONTRATOS: '/contratos',
  CONTRATO_DETAIL: (id: number) => `/contratos/${id}`,
  CONTRATO_CREATE: '/contratos/novo',
  CONTRATO_EDIT: (id: number) => `/contratos/${id}/editar`,

  // Orçamentos (Budgets)
  BUDGETS: '/orcamentos',
  BUDGET_DETAIL: (id: number) => `/orcamentos/${id}`,
  BUDGET_CREATE: '/orcamentos/novo',
  BUDGET_EDIT: (id: number) => `/orcamentos/${id}/editar`,

  // Linhas Orçamentárias (Budget Lines)
  BUDGET_LINES: '/linhas-orcamentarias',
  BUDGET_LINE_DETAIL: (id: number) => `/linhas-orcamentarias/${id}`,
  BUDGET_LINE_CREATE: '/linhas-orcamentarias/novo',
  BUDGET_LINE_EDIT: (id: number) => `/linhas-orcamentarias/${id}/editar`,

  // Auxílios (Aids)
  AUXILIOS: '/auxilios',
  AUXILIO_DETAIL: (id: number) => `/auxilios/${id}`,
  AUXILIO_CREATE: '/auxilios/novo',
  AUXILIO_EDIT: (id: number) => `/auxilios/${id}/editar`,

  // Centros de Gestão (Management Centers)
  MANAGEMENT_CENTERS: '/centros-gestao',
  MANAGEMENT_CENTER_DETAIL: (id: number) => `/centros-gestao/${id}`,
  MANAGEMENT_CENTER_CREATE: '/centros-gestao/novo',
  MANAGEMENT_CENTER_EDIT: (id: number) => `/centros-gestao/${id}/editar`,

  // Centros Solicitantes (Requesting Centers)
  REQUESTING_CENTERS: '/centros-solicitantes',
  REQUESTING_CENTER_DETAIL: (id: number) => `/centros-solicitantes/${id}`,
  REQUESTING_CENTER_CREATE: '/centros-solicitantes/novo',
  REQUESTING_CENTER_EDIT: (id: number) => `/centros-solicitantes/${id}/editar`,

  // Direções (Directions)
  DIRECTIONS: '/direcoes',
  DIRECTION_DETAIL: (id: number) => `/direcoes/${id}`,
  DIRECTION_CREATE: '/direcoes/novo',
  DIRECTION_EDIT: (id: number) => `/direcoes/${id}/editar`,

  // Gerências (Managements)
  MANAGEMENTS: '/gerencias',
  MANAGEMENT_DETAIL: (id: number) => `/gerencias/${id}`,
  MANAGEMENT_CREATE: '/gerencias/novo',
  MANAGEMENT_EDIT: (id: number) => `/gerencias/${id}/editar`,

  // Coordenações (Coordinations)
  COORDINATIONS: '/coordenacoes',
  COORDINATION_DETAIL: (id: number) => `/coordenacoes/${id}`,
  COORDINATION_CREATE: '/coordenacoes/novo',
  COORDINATION_EDIT: (id: number) => `/coordenacoes/${id}/editar`,

  // Alice AI Assistant
  ALICE: '/alice',
  ALICE_CHAT: '/alice/chat',
  ALICE_SESSIONS: '/alice/sessoes',
  ALICE_SESSION_DETAIL: (id: number) => `/alice/sessoes/${id}`,

  // Settings
  SETTINGS: '/configuracoes',
  SETTINGS_PROFILE: '/configuracoes/perfil',
  SETTINGS_PASSWORD: '/configuracoes/senha',
  SETTINGS_PREFERENCES: '/configuracoes/preferencias',

  // Reports
  REPORTS: '/relatorios',
  REPORTS_BUDGET: '/relatorios/orcamentos',
  REPORTS_CONTRACTS: '/relatorios/contratos',
  REPORTS_EMPLOYEES: '/relatorios/colaboradores',
  REPORTS_AIDS: '/relatorios/auxilios',

  // Admin
  ADMIN: '/admin',
  ADMIN_USERS: '/admin/usuarios',
  ADMIN_PERMISSIONS: '/admin/permissoes',
  ADMIN_LOGS: '/admin/logs',
} as const;

/**
 * Helper function to check if a route is public
 */
export function isPublicRoute(path: string): boolean {
  const publicRoutes = [ROUTES.HOME, ROUTES.LOGIN];
  return publicRoutes.includes(path);
}

/**
 * Helper function to check if a route requires authentication
 */
export function requiresAuth(path: string): boolean {
  return !isPublicRoute(path);
}
