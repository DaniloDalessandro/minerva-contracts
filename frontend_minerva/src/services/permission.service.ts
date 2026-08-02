import {
  fetchPermissions,
  fetchGroups,
  updateGroupPermissions,
} from '@/lib/api/permissions';
import type { PermissionListResponse, GroupPermissions } from '@/lib/api/permissions';

export class PermissionService {
  static async fetchPermissions(): Promise<PermissionListResponse> {
    return fetchPermissions();
  }

  static async fetchGroups(): Promise<GroupPermissions[]> {
    return fetchGroups();
  }

  static async updateGroupPermissions(
    groupId: number,
    permissionIds: number[]
  ): Promise<GroupPermissions> {
    return updateGroupPermissions(groupId, permissionIds);
  }
}
