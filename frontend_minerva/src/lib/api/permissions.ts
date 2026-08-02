import { apiClient } from './client'
import { API_ENDPOINTS } from '@/constants/api-endpoints'

export interface PermissionItem {
  id: number
  codename: string
  action: 'view' | 'add' | 'change' | 'delete'
  action_label: string
}

export interface PermissionModule {
  app_label: string
  model: string
  label: string
  permissions: PermissionItem[]
}

export interface PermissionListResponse {
  modules: PermissionModule[]
}

export interface GroupPermissions {
  id: number
  name: string
  label: string
  permission_ids: number[]
}

export async function fetchPermissions(): Promise<PermissionListResponse> {
  const res = await apiClient(API_ENDPOINTS.ADMIN_PERMISSIONS.LIST)
  if (!res.ok) throw new Error('Erro ao buscar permissões')
  return res.json()
}

export async function fetchGroups(): Promise<GroupPermissions[]> {
  const res = await apiClient(API_ENDPOINTS.ADMIN_PERMISSIONS.GROUPS)
  if (!res.ok) throw new Error('Erro ao buscar grupos')
  return res.json()
}

export async function updateGroupPermissions(
  groupId: number,
  permissionIds: number[]
): Promise<GroupPermissions> {
  const res = await apiClient(API_ENDPOINTS.ADMIN_PERMISSIONS.GROUP_PERMISSIONS(groupId), {
    method: 'PUT',
    body: JSON.stringify({ permission_ids: permissionIds }),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error || 'Erro ao salvar permissões')
  }
  return res.json()
}
