import { apiClient } from './client'
import { API_ENDPOINTS } from '@/constants/api-endpoints'

export interface AdminUser {
  id: number
  email: string
  name: string
  groups: string[]
  is_active: boolean
  is_superuser: boolean
  date_joined: string
  last_login: string | null
  avatar: string
}

export interface AdminUsersResponse {
  count: number
  results: AdminUser[]
}

export interface CreateUserPayload {
  email: string
  first_name: string
  last_name?: string
  password: string
  group?: string
  is_active?: boolean
  avatar?: string
}

export interface UpdateUserPayload {
  first_name?: string
  last_name?: string
  group?: string
  is_active?: boolean
  avatar?: string
}

export interface UserInvitation {
  id: number
  token: string
  email: string
  group: string
  status: 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'CANCELLED'
  expires_at: string
  accepted_at: string | null
  is_valid: boolean
  is_expired: boolean
  created_at: string
  updated_at: string
  invited_by_name: string | null
}

export interface InvitesResponse {
  count: number
  results: UserInvitation[]
}

export interface InviteValidateResponse {
  valid: boolean
  email?: string
  group?: string
  group_display?: string
  expires_at?: string
  error?: string
}

export interface AcceptInvitePayload {
  token: string
  first_name: string
  last_name?: string
  password: string
  password2: string
}



export async function fetchUsers(params?: URLSearchParams): Promise<AdminUsersResponse> {
  const url = params
    ? `${API_ENDPOINTS.ADMIN_USERS.LIST}?${params}`
    : API_ENDPOINTS.ADMIN_USERS.LIST
  const res = await apiClient(url)
  if (!res.ok) throw new Error('Erro ao buscar usuários')
  return res.json()
}

export async function createUser(data: CreateUserPayload): Promise<AdminUser> {
  const res = await apiClient(API_ENDPOINTS.ADMIN_USERS.CREATE, {
    method: 'POST',
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error?.email?.[0] || err.error || 'Erro ao criar usuário')
  }
  return res.json()
}

export async function updateUser(id: number, data: UpdateUserPayload): Promise<AdminUser> {
  const res = await apiClient(API_ENDPOINTS.ADMIN_USERS.BY_ID(id), {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error || 'Erro ao atualizar usuário')
  }
  return res.json()
}

export async function toggleUserStatus(id: number): Promise<{ is_active: boolean; message: string }> {
  const res = await apiClient(API_ENDPOINTS.ADMIN_USERS.TOGGLE_STATUS(id), { method: 'PATCH' })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error || 'Erro ao alterar status do usuário')
  }
  return res.json()
}



export async function fetchInvites(params?: URLSearchParams): Promise<InvitesResponse> {
  const url = params
    ? `${API_ENDPOINTS.ADMIN_USERS.INVITES_LIST}?${params}`
    : API_ENDPOINTS.ADMIN_USERS.INVITES_LIST
  const res = await apiClient(url)
  if (!res.ok) throw new Error('Erro ao buscar convites')
  return res.json()
}

export async function sendInvite(email: string, group: string): Promise<UserInvitation> {
  const res = await apiClient(API_ENDPOINTS.ADMIN_USERS.INVITES_LIST, {
    method: 'POST',
    body: JSON.stringify({ email, group }),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error?.email?.[0] || err.error || 'Erro ao enviar convite')
  }
  return res.json()
}

export async function resendInvite(id: number): Promise<{ message: string }> {
  const res = await apiClient(API_ENDPOINTS.ADMIN_USERS.INVITE_RESEND(id), { method: 'POST' })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error || 'Erro ao reenviar convite')
  }
  return res.json()
}

export async function cancelInvite(id: number): Promise<{ message: string }> {
  const res = await apiClient(API_ENDPOINTS.ADMIN_USERS.INVITE_CANCEL(id), { method: 'POST' })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error || 'Erro ao cancelar convite')
  }
  return res.json()
}



export async function validateInviteToken(token: string): Promise<InviteValidateResponse> {
  const res = await fetch(API_ENDPOINTS.ADMIN_USERS.INVITE_VALIDATE(token))
  return res.json()
}

export async function acceptInvite(data: AcceptInvitePayload): Promise<{ message: string }> {
  const res = await fetch(API_ENDPOINTS.ADMIN_USERS.INVITE_ACCEPT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  const body = await res.json()
  if (!res.ok) throw new Error(body.error || 'Erro ao criar conta')
  return body
}
