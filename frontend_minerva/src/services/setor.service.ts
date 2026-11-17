import {
  fetchDirectionsAPI,
  createDirectionAPI,
  updateDirectionAPI,
  deleteDirectionAPI,
  fetchManagementsAPI,
  createManagementAPI,
  updateManagementAPI,
  deleteManagementAPI,
  fetchCoordinationsAPI,
  createCoordinationAPI,
  updateCoordinationAPI,
  deleteCoordinationAPI,
} from '@/lib/api/directions';
import type {
  Direction,
  Management,
  Coordination,
} from '@/types/entities/setor';
import { PAGINATION_DEFAULTS } from '@/constants/ui';

export class SetorService {

  static async fetchDirections(
    page: number = PAGINATION_DEFAULTS.PAGE,
    pageSize: number = PAGINATION_DEFAULTS.PAGE_SIZE,
    search: string = "",
    ordering: string = "",
    statusFilter: string = ""
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
    }

    return fetchDirectionsAPI(params);
  }

  static async createDirection(data: { name: string }): Promise<Direction> {
    return createDirectionAPI(data);
  }

  static async updateDirection(data: { id: number; name: string }): Promise<Direction> {
    return updateDirectionAPI(data);
  }

  static async deleteDirection(id: number): Promise<void> {
    await deleteDirectionAPI(id);

  }

  static async fetchManagements(
    page: number = PAGINATION_DEFAULTS.PAGE,
    pageSize: number = PAGINATION_DEFAULTS.PAGE_SIZE,
    search: string = "",
    ordering: string = "",
    statusFilter: string = ""
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
    }

    return fetchManagementsAPI(params);
  }

  static async createManagement(data: { name: string; direction_id: number }): Promise<Management> {
    return createManagementAPI(data);
  }

  static async updateManagement(data: { id: number; name: string; direction_id: number }): Promise<Management> {
    return updateManagementAPI(data);
  }

  static async deleteManagement(id: number): Promise<void> {
    await deleteManagementAPI(id);

  }

  static async fetchCoordinations(
    page: number = PAGINATION_DEFAULTS.PAGE,
    pageSize: number = PAGINATION_DEFAULTS.PAGE_SIZE,
    search: string = "",
    ordering: string = "",
    statusFilter: string = ""
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
    }

    return fetchCoordinationsAPI(params);
  }

  static async createCoordination(data: { name: string; management_id: number }): Promise<Coordination> {
    return createCoordinationAPI(data);
  }

  static async updateCoordination(data: { id: number; name: string; management_id: number }): Promise<Coordination> {
    return updateCoordinationAPI(data);
  }

  static async deleteCoordination(id: number): Promise<void> {
    await deleteCoordinationAPI(id);

  }
}
