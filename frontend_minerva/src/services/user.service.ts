import {
  fetchUsers,
  fetchInvites,
  createUser,
  updateUser,
  toggleUserStatus,
  sendInvite,
  cancelInvite,
  resendInvite,
  type AdminUser,
  type AdminUsersResponse,
  type InvitesResponse,
  type UserInvitation,
} from '@/lib/api/users'
import { PAGINATION_DEFAULTS } from '@/constants/ui'

export class UserService {
  static async fetchUsers(
    page: number = PAGINATION_DEFAULTS.PAGE,
    pageSize: number = PAGINATION_DEFAULTS.PAGE_SIZE,
    search: string = '',
    ordering: string = '',
    statusFilter: string = ''
  ): Promise<AdminUsersResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      page_size: pageSize.toString(),
    })
    if (search) params.append('search', search)
    if (ordering) params.append('ordering', ordering)
    if (statusFilter === 'active') params.append('is_active', 'true')
    else if (statusFilter === 'inactive') params.append('is_active', 'false')
    return fetchUsers(params)
  }

  static async createUser(data: any): Promise<AdminUser> {
    return createUser(data)
  }

  static async updateUser(data: any): Promise<AdminUser> {
    return updateUser(data.id, {
      first_name: data.first_name,
      last_name: data.last_name,
      group: data.group,
      is_active: data.is_active,
    })
  }

  static async toggleUserStatus(id: number): Promise<void> {
    await toggleUserStatus(id)
  }
}

export class InviteService {
  static async fetchInvites(
    page: number = PAGINATION_DEFAULTS.PAGE,
    pageSize: number = PAGINATION_DEFAULTS.PAGE_SIZE,
    search: string = '',
    ordering: string = '',
    statusFilter: string = ''
  ): Promise<InvitesResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      page_size: pageSize.toString(),
    })
    if (statusFilter && statusFilter !== 'ALL') params.append('status', statusFilter)
    return fetchInvites(params)
  }

  static async createInvite(data: { email: string; group: string }): Promise<UserInvitation> {
    return sendInvite(data.email, data.group)
  }

  static async cancelInvite(id: number): Promise<void> {
    await cancelInvite(id)
  }

  static async resendInvite(id: number): Promise<void> {
    await resendInvite(id)
  }
}
