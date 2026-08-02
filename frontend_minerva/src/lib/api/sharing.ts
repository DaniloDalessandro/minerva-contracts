import { apiClient } from './client'
import { API_ENDPOINTS } from '@/constants/api-endpoints'

export type ResourceType = 'BUDGET' | 'BUDGET_LINE' | 'CONTRACT'
export type PermissionType = 'VIEW' | 'CREATE_BUDGET_LINES' | 'CREATE_CONTRACTS'
export type ShareStatus = 'PENDING' | 'ACCEPTED' | 'REVOKED' | 'EXPIRED'

export interface ResourceShare {
  id: number
  resource_type: ResourceType
  resource_type_label: string
  resource_id: number
  resource_name: string
  owner: number
  owner_name: string
  invited_user: number | null
  invited_user_name: string
  invited_email: string
  permission_type: PermissionType
  permission_label: string
  status: ShareStatus
  status_label: string
  message: string
  accepted_at: string | null
  expires_at: string | null
  created_at: string
  updated_at: string
}

export interface ShareCreatePayload {
  resource_type: ResourceType
  resource_id: number
  invited_email: string
  permission_type: PermissionType
  message?: string
}

export interface SharesResponse {
  count: number
  results: ResourceShare[]
}

export interface ShareNotification {
  id: number
  notification_type: 'SHARE_RECEIVED' | 'SHARE_REVOKED'
  notification_type_label: string
  title: string
  message: string
  is_read: boolean
  read_at: string | null
  created_at: string
  share: number
  resource_type: string
  resource_name: string
}

export interface ShareNotificationsResponse {
  count: number
  unread_count: number
  results: ShareNotification[]
}

export interface UserSuggestion {
  email: string
  name: string
  matricula?: string
}

export interface ResourceResult {
  id: number
  name: string
}

export async function fetchShares(params: {
  resource_type?: ResourceType
  direction?: 'given' | 'received' | 'all'
  page?: number
  page_size?: number
}): Promise<SharesResponse> {
  const qs = new URLSearchParams()
  if (params.resource_type) qs.set('resource_type', params.resource_type)
  if (params.direction) qs.set('direction', params.direction)
  if (params.page) qs.set('page', String(params.page))
  if (params.page_size) qs.set('page_size', String(params.page_size))
  const url = `${API_ENDPOINTS.SHARING.LIST}${qs.toString() ? '?' + qs.toString() : ''}`
  const res = await apiClient(url)
  if (!res.ok) throw new Error('Erro ao buscar compartilhamentos')
  return res.json()
}

export async function createShare(data: ShareCreatePayload): Promise<ResourceShare> {
  const res = await apiClient(API_ENDPOINTS.SHARING.LIST, {
    method: 'POST',
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error ? JSON.stringify(err.error) : 'Erro ao criar compartilhamento')
  }
  return res.json()
}

export async function revokeShare(id: number): Promise<void> {
  const res = await apiClient(API_ENDPOINTS.SHARING.BY_ID(id), { method: 'DELETE' })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error || 'Erro ao revogar compartilhamento')
  }
}

export async function fetchShareNotifications(): Promise<ShareNotificationsResponse> {
  const res = await apiClient(API_ENDPOINTS.SHARING.NOTIFICATIONS)
  if (!res.ok) throw new Error('Erro ao buscar notificações')
  return res.json()
}

export async function markShareNotificationRead(id: number): Promise<void> {
  const res = await apiClient(API_ENDPOINTS.SHARING.NOTIFICATION_MARK_READ(id), { method: 'PATCH' })
  if (!res.ok) throw new Error('Erro ao marcar notificação como lida')
}

export async function markAllShareNotificationsRead(): Promise<void> {
  const res = await apiClient(API_ENDPOINTS.SHARING.NOTIFICATIONS_MARK_ALL_READ, { method: 'PATCH' })
  if (!res.ok) throw new Error('Erro ao marcar notificações como lidas')
}

export async function searchUsers(email: string): Promise<UserSuggestion[]> {
  const res = await apiClient(`${API_ENDPOINTS.SHARING.USER_SEARCH}?email=${encodeURIComponent(email)}`)
  if (!res.ok) return []
  const data = await res.json()
  return data.results || []
}

export async function searchUsersByQuery(q: string): Promise<UserSuggestion[]> {
  const res = await apiClient(`${API_ENDPOINTS.SHARING.USER_SEARCH}?q=${encodeURIComponent(q)}`)
  if (!res.ok) return []
  const data = await res.json()
  return data.results || []
}

export async function searchResources(resourceType: ResourceType, q: string): Promise<ResourceResult[]> {
  const res = await apiClient(
    `${API_ENDPOINTS.SHARING.RESOURCE_SEARCH}?resource_type=${resourceType}&q=${encodeURIComponent(q)}`
  )
  if (!res.ok) return []
  const data = await res.json()
  return data.results || []
}
