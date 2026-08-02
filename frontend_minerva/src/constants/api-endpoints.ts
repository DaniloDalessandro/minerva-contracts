


const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

export const API_ENDPOINTS = {

  BASE: API_BASE,


  EMPLOYEE: {
    LIST: `${API_BASE}/api/v1/employee/`,
    CREATE: `${API_BASE}/api/v1/employee/create/`,
    BY_ID: (id: number) => `${API_BASE}/api/v1/employee/${id}/`,
    UPDATE: (id: number) => `${API_BASE}/api/v1/employee/${id}/update/`,
    TOGGLE_STATUS: (id: number) => `${API_BASE}/api/v1/employee/${id}/toggle-status/`,
    CONTRACTS: `${API_BASE}/api/v1/employee/contracts/`,
    AIDS: `${API_BASE}/api/v1/employee/aids/`,
    ALL_EMPLOYEES: `${API_BASE}/api/v1/employee/employees/`,
  },


  CONTRACT: {
    LIST: `${API_BASE}/api/v1/contract/contracts/`,
    CREATE: `${API_BASE}/api/v1/contract/contracts/create/`,
    BY_ID: (id: number) => `${API_BASE}/api/v1/contract/contracts/${id}/`,
    UPDATE: (id: number) => `${API_BASE}/api/v1/contract/contracts/${id}/update/`,
    DELETE: (id: number) => `${API_BASE}/api/v1/contract/contracts/${id}/delete/`,
    TOGGLE_STATUS: (id: number) => `${API_BASE}/api/v1/contract/contracts/${id}/toggle-status/`,
  },


  BUDGET: {
    LIST: `${API_BASE}/api/v1/budget/budgets/`,
    CREATE: `${API_BASE}/api/v1/budget/budgets/create/`,
    BY_ID: (id: number) => `${API_BASE}/api/v1/budget/budgets/${id}/`,
    UPDATE: (id: number) => `${API_BASE}/api/v1/budget/budgets/${id}/update/`,
    DELETE: (id: number) => `${API_BASE}/api/v1/budget/budgets/${id}/delete/`,
  },


  BUDGET_MOVEMENT: {
    LIST: `${API_BASE}/api/v1/budget/movements/`,
    CREATE: `${API_BASE}/api/v1/budget/movements/create/`,
    UPDATE: (id: number) => `${API_BASE}/api/v1/budget/movements/${id}/update/`,
    DELETE: (id: number) => `${API_BASE}/api/v1/budget/movements/${id}/delete/`,
  },


  BUDGET_LINE: {
    LIST: `${API_BASE}/api/v1/budgetline/budgetslines/`,
    CREATE: `${API_BASE}/api/v1/budgetline/budgetslines/create/`,
    BY_ID: (id: number) => `${API_BASE}/api/v1/budgetline/budgetslines/${id}/`,
    UPDATE: (id: number) => `${API_BASE}/api/v1/budgetline/budgetslines/${id}/update/`,
    DELETE: (id: number) => `${API_BASE}/api/v1/budgetline/budgetslines/${id}/delete/`,
    ALL: `${API_BASE}/api/v1/budgetline/budgetlines/`,
  },


  BUDGET_LINE_MOVEMENT: {
    LIST: `${API_BASE}/api/v1/budgetline/budgetlinemovements/`,
    CREATE: `${API_BASE}/api/v1/budgetline/budgetlinemovements/create/`,
    BY_ID: (id: number) => `${API_BASE}/api/v1/budgetline/budgetlinemovements/${id}/`,
    UPDATE: (id: number) => `${API_BASE}/api/v1/budgetline/budgetlinemovements/${id}/update/`,
    DELETE: (id: number) => `${API_BASE}/api/v1/budgetline/budgetlinemovements/${id}/delete/`,
  },


  AID: {
    LIST: `${API_BASE}/api/v1/aid/aid/`,
    CREATE: `${API_BASE}/api/v1/aid/aid/create/`,
    BY_ID: (id: number) => `${API_BASE}/api/v1/aid/aid/${id}/`,
    UPDATE: (id: number) => `${API_BASE}/api/v1/aid/aid/update/${id}/`,
    DELETE: (id: number) => `${API_BASE}/api/v1/aid/aid/delete/${id}/`,
  },


  MANAGEMENT_CENTER: {
    LIST: `${API_BASE}/api/v1/center/management-centers/`,
    CREATE: `${API_BASE}/api/v1/center/management-centers/create/`,
    UPDATE: (id: number) => `${API_BASE}/api/v1/center/management-centers/${id}/update/`,
    DELETE: (id: number) => `${API_BASE}/api/v1/center/management-centers/${id}/delete/`,
  },


  REQUESTING_CENTER: {
    LIST: `${API_BASE}/api/v1/center/requesting-centers/`,
    CREATE: `${API_BASE}/api/v1/center/requesting-centers/create/`,
    UPDATE: (id: number) => `${API_BASE}/api/v1/center/requesting-centers/${id}/update/`,
    DELETE: (id: number) => `${API_BASE}/api/v1/center/requesting-centers/${id}/delete/`,
  },


  DIRECTION: {
    LIST: `${API_BASE}/api/v1/sector/directions/`,
    CREATE: `${API_BASE}/api/v1/sector/directions/create/`,
    UPDATE: (id: number) => `${API_BASE}/api/v1/sector/directions/${id}/update/`,
    DELETE: (id: number) => `${API_BASE}/api/v1/sector/directions/${id}/delete/`,
  },


  MANAGEMENT: {
    LIST: `${API_BASE}/api/v1/sector/managements/`,
    CREATE: `${API_BASE}/api/v1/sector/managements/create/`,
    UPDATE: (id: number) => `${API_BASE}/api/v1/sector/managements/${id}/update/`,
    DELETE: (id: number) => `${API_BASE}/api/v1/sector/managements/${id}/delete/`,
  },


  COORDINATION: {
    LIST: `${API_BASE}/api/v1/sector/coordinations/`,
    CREATE: `${API_BASE}/api/v1/sector/coordinations/create/`,
    UPDATE: (id: number) => `${API_BASE}/api/v1/sector/coordinations/${id}/update/`,
    DELETE: (id: number) => `${API_BASE}/api/v1/sector/coordinations/${id}/delete/`,
  },


  ALICE: {
    CHAT: `${API_BASE}/api/v1/alice/chat/`,
    QUICK_QUESTION: `${API_BASE}/api/v1/alice/quick/`,
    STATS: `${API_BASE}/api/v1/alice/stats/`,
    SESSIONS: `${API_BASE}/api/v1/alice/sessions/`,
    SESSION_DETAIL: (id: number) => `${API_BASE}/api/v1/alice/sessions/${id}/`,
    SESSION_SEND: (id: number) => `${API_BASE}/api/v1/alice/sessions/${id}/send/`,
    SESSION_CLEAR: (id: number) => `${API_BASE}/api/v1/alice/sessions/${id}/clear/`,
    SCHEMA_TABLES: `${API_BASE}/api/v1/alice/schema/tables/`,
    SCHEMA: `${API_BASE}/api/v1/alice/schema/`,
    FEEDBACK: `${API_BASE}/api/v1/alice/feedback/`,
  },


  AUTH: {
    LOGIN: `${API_BASE}/api/v1/accounts/token/`,
    REFRESH: `${API_BASE}/api/v1/accounts/token/refresh/`,
    CHANGE_PASSWORD: `${API_BASE}/api/v1/accounts/change-password/`,
    UPDATE_PROFILE: `${API_BASE}/api/v1/accounts/update-profile/`,
    ME: `${API_BASE}/api/v1/accounts/me/`,
    LOGOUT: `${API_BASE}/api/v1/accounts/logout/`,
    PASSWORD_RESET: `${API_BASE}/api/v1/accounts/password-reset/`,
    PASSWORD_RESET_CONFIRM: `${API_BASE}/api/v1/accounts/password-reset-confirm/`,
  },


  ADMIN_PERMISSIONS: {
    LIST: `${API_BASE}/api/v1/accounts/admin/permissions/`,
    GROUPS: `${API_BASE}/api/v1/accounts/admin/groups/`,
    GROUP_PERMISSIONS: (id: number) => `${API_BASE}/api/v1/accounts/admin/groups/${id}/permissions/`,
  },

  ADMIN_USERS: {
    LIST: `${API_BASE}/api/v1/accounts/admin/users/`,
    CREATE: `${API_BASE}/api/v1/accounts/admin/users/create/`,
    BY_ID: (id: number) => `${API_BASE}/api/v1/accounts/admin/users/${id}/`,
    TOGGLE_STATUS: (id: number) => `${API_BASE}/api/v1/accounts/admin/users/${id}/toggle-status/`,
    INVITES_LIST: `${API_BASE}/api/v1/accounts/admin/invites/`,
    INVITE_RESEND: (id: number) => `${API_BASE}/api/v1/accounts/admin/invites/${id}/resend/`,
    INVITE_CANCEL: (id: number) => `${API_BASE}/api/v1/accounts/admin/invites/${id}/cancel/`,
    INVITE_VALIDATE: (token: string) => `${API_BASE}/api/v1/accounts/invite/validate/${token}/`,
    INVITE_ACCEPT: `${API_BASE}/api/v1/accounts/invite/accept/`,
  },

  SHARING: {
    LIST: `${API_BASE}/api/v1/sharing/shares/`,
    BY_ID: (id: number) => `${API_BASE}/api/v1/sharing/shares/${id}/`,
    NOTIFICATIONS: `${API_BASE}/api/v1/sharing/notifications/`,
    NOTIFICATION_MARK_READ: (id: number) => `${API_BASE}/api/v1/sharing/notifications/${id}/mark-read/`,
    NOTIFICATIONS_MARK_ALL_READ: `${API_BASE}/api/v1/sharing/notifications/mark-all-read/`,
    USER_SEARCH: `${API_BASE}/api/v1/sharing/users/search/`,
    RESOURCE_SEARCH: `${API_BASE}/api/v1/sharing/resources/search/`,
  },
} as const;
