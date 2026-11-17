import {
  fetchManagementCentersAPI,
  createManagementCenterAPI,
  updateManagementCenterAPI,
  deleteManagementCenterAPI,
  fetchRequestingCentersAPI,
  createRequestingCenterAPI,
  updateRequestingCenterAPI,
  deleteRequestingCenterAPI,
} from '@/lib/api/centers';
import type {
  ManagementCenter,
  RequestingCenter,
} from '@/types/entities/center';
import { PAGINATION_DEFAULTS } from '@/constants/ui';

export class CenterService {
  static async fetchManagementCenters(
    page: number = PAGINATION_DEFAULTS.PAGE,
    pageSize: number = PAGINATION_DEFAULTS.PAGE_SIZE,
    search: string = "",
    ordering: string = "",
    statusFilter: string = "active"
  ): Promise<any> {
    const params = new URLSearchParams({
      page: page.toString(),
      page_size: pageSize.toString(),
    });

    if (search) params.append('search', search);
    if (ordering) params.append('ordering', ordering);
    if (statusFilter === "active") {
      params.append("is_active", "true");
    } else if (statusFilter === "inactive") {
      params.append("is_active", "false");
    } else {
      params.append("is_active", "");
    }

    return fetchManagementCentersAPI(params);
  }

  static async createManagementCenter(data: { name: string; description?: string }): Promise<ManagementCenter> {
    return createManagementCenterAPI(data);
  }

  static async updateManagementCenter(data: { id: number; name: string; description?: string }): Promise<ManagementCenter> {
    return updateManagementCenterAPI(data);
  }

  static async deleteManagementCenter(id: number): Promise<void> {
    await deleteManagementCenterAPI(id);

  }

  static async fetchRequestingCenters(
    page: number = PAGINATION_DEFAULTS.PAGE,
    pageSize: number = PAGINATION_DEFAULTS.PAGE_SIZE,
    search: string = "",
    ordering: string = "",
    statusFilter: string = "active"
  ): Promise<any> {
    const params = new URLSearchParams({
      page: page.toString(),
      page_size: pageSize.toString(),
    });

    if (search) params.append('search', search);
    if (ordering) params.append('ordering', ordering);
    if (statusFilter === "active") {
      params.append("is_active", "true");
    } else if (statusFilter === "inactive") {
      params.append("is_active", "false");
    } else {
      params.append("is_active", "");
    }

    return fetchRequestingCentersAPI(params);
  }

  static async createRequestingCenter(data: { name: string; description?: string; management_center_id: number }): Promise<RequestingCenter> {
    return createRequestingCenterAPI(data);
  }

  static async updateRequestingCenter(data: { id: number; name: string; description?: string; management_center_id: number }): Promise<RequestingCenter> {
    return updateRequestingCenterAPI(data);
  }

  static async deleteRequestingCenter(id: number): Promise<void> {
    await deleteRequestingCenterAPI(id);

  }
}
