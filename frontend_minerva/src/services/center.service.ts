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
    }

    console.log("🏢 Buscando centros gestores:", params.toString());

    const data = await fetchManagementCentersAPI(params);
    console.log("📊 Centros gestores recebidos:", {
      count: data.count,
      results: data.results?.length || 0,
    });

    return data;
  }

  static async createManagementCenter(data: { name: string; description?: string }): Promise<ManagementCenter> {
    console.log("➕ Criando centro gestor:", data.name);
    const result = await createManagementCenterAPI(data);
    console.log("✅ Centro gestor criado com sucesso:", result.id);
    return result;
  }

  static async updateManagementCenter(data: { id: number; name: string; description?: string }): Promise<ManagementCenter> {
    console.log("✏️ Atualizando centro gestor:", data.id);
    const result = await updateManagementCenterAPI(data);
    console.log("✅ Centro gestor atualizado com sucesso");
    return result;
  }

  static async deleteManagementCenter(id: number): Promise<void> {
    console.log("🗑️ Inativando centro gestor:", id);
    await deleteManagementCenterAPI(id);
    console.log("✅ Centro gestor inativado com sucesso");
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
    }

    console.log("📋 Buscando centros solicitantes:", params.toString());

    const data = await fetchRequestingCentersAPI(params);
    console.log("📊 Centros solicitantes recebidos:", {
      count: data.count,
      results: data.results?.length || 0,
    });

    return data;
  }

  static async createRequestingCenter(data: { name: string; description?: string; management_center_id: number }): Promise<RequestingCenter> {
    console.log("➕ Criando centro solicitante:", data.name);
    const result = await createRequestingCenterAPI(data);
    console.log("✅ Centro solicitante criado com sucesso:", result.id);
    return result;
  }

  static async updateRequestingCenter(data: { id: number; name: string; description?: string; management_center_id: number }): Promise<RequestingCenter> {
    console.log("✏️ Atualizando centro solicitante:", data.id);
    const result = await updateRequestingCenterAPI(data);
    console.log("✅ Centro solicitante atualizado com sucesso");
    return result;
  }

  static async deleteRequestingCenter(id: number): Promise<void> {
    console.log("🗑️ Inativando centro solicitante:", id);
    await deleteRequestingCenterAPI(id);
    console.log("✅ Centro solicitante inativado com sucesso");
  }
}
