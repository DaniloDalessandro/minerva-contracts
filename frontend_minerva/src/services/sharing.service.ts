import {
  fetchShares,
  createShare,
  revokeShare,
  fetchShareNotifications,
  markShareNotificationRead,
  markAllShareNotificationsRead,
  searchUsers,
  searchUsersByQuery,
  searchResources,
  type ResourceType,
  type PermissionType,
  type ShareCreatePayload,
} from '@/lib/api/sharing'

export class SharingService {
  static async fetchShares(params: {
    resource_type?: ResourceType
    direction?: 'given' | 'received' | 'all'
    page?: number
    page_size?: number
  }) {
    return fetchShares(params)
  }

  static async createShare(data: ShareCreatePayload) {
    return createShare(data)
  }

  static async revokeShare(id: number) {
    return revokeShare(id)
  }

  static async fetchNotifications() {
    return fetchShareNotifications()
  }

  static async markNotificationRead(id: number) {
    return markShareNotificationRead(id)
  }

  static async markAllRead() {
    return markAllShareNotificationsRead()
  }

  static async searchUsers(email: string) {
    return searchUsers(email)
  }

  static async searchUsersByQuery(q: string) {
    return searchUsersByQuery(q)
  }

  static async searchResources(resourceType: ResourceType, q: string) {
    return searchResources(resourceType, q)
  }
}
