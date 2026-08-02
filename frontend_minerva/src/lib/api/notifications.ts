import { apiClient } from './client'

const BASE = process.env.NEXT_PUBLIC_API_URL || ''

export interface ContractNotification {
  id: number
  contract: number
  contract_protocol: string
  contract_description: string
  contract_expiration_date: string | null
  days_until_expiration: number | null
  notification_type: string
  is_read: boolean
  read_at: string | null
  email_sent_at: string | null
  email_recipients: string[]
  created_at: string
}

export interface NotificationsResponse {
  count: number
  unread_count: number
  results: ContractNotification[]
}

export async function fetchNotifications(unreadOnly = false): Promise<NotificationsResponse> {
  const url = `${BASE}/api/v1/notifications/contract-expiration/${unreadOnly ? '?unread=true' : ''}`
  const res = await apiClient(url)
  if (!res.ok) throw new Error('Falha ao buscar notificações')
  return res.json()
}

export async function markNotificationRead(id: number): Promise<void> {
  const res = await apiClient(`${BASE}/api/v1/notifications/contract-expiration/${id}/mark-read/`, {
    method: 'PATCH',
  })
  if (!res.ok) throw new Error('Falha ao marcar notificação como lida')
}

export async function markAllNotificationsRead(): Promise<void> {
  const res = await apiClient(`${BASE}/api/v1/notifications/contract-expiration/mark-all-read/`, {
    method: 'PATCH',
  })
  if (!res.ok) throw new Error('Falha ao marcar todas as notificações como lidas')
}

export async function fetchDashboardStats() {
  const url = `${BASE}/api/v1/contract/dashboard/`
  const res = await apiClient(url)
  if (!res.ok) throw new Error('Falha ao buscar estatísticas do dashboard')
  return res.json()
}
