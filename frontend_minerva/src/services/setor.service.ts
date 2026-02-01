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
  // Directions
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
    // Só aplica filtro se não for vazio (vazio = mostrar todos)
    if (statusFilter === "active") {
      params.append("is_active", "true");
    } else if (statusFilter === "inactive") {
      params.append("is_active", "false");
    }

    console.log("🎯 Buscando direções:", params.toString());

    const data = await fetchDirectionsAPI(params);
    console.log("📊 Direções recebidas:", {
      count: data.count,
      results: data.results?.length || 0,
    });

    return data;
  }

  static async createDirection(data: { name: string }): Promise<Direction> {
    console.log("➕ Criando direção:", data.name);
    const result = await createDirectionAPI(data);
    console.log("✅ Direção criada com sucesso:", result.id);
    return result;
  }

  static async updateDirection(data: { id: number; name: string }): Promise<Direction> {
    console.log("✏️ Atualizando direção:", data.id);
    const result = await updateDirectionAPI(data);
    console.log("✅ Direção atualizada com sucesso");
    return result;
  }

  static async deleteDirection(id: number): Promise<void> {
    console.log("🗑️ Inativando direção:", id);
    await deleteDirectionAPI(id);
    console.log("✅ Direção inativada com sucesso");
  }

  // Managements
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
    // Só aplica filtro se não for vazio (vazio = mostrar todos)
    if (statusFilter === "active") {
      params.append("is_active", "true");
    } else if (statusFilter === "inactive") {
      params.append("is_active", "false");
    }

    console.log("🏢 Buscando gerências:", params.toString());

    const data = await fetchManagementsAPI(params);
    console.log("📊 Gerências recebidas:", {
      count: data.count,
      results: data.results?.length || 0,
    });

    return data;
  }

  static async createManagement(data: { name: string; direction_id: number }): Promise<Management> {
    console.log("➕ Criando gerência:", data.name);
    const result = await createManagementAPI(data);
    console.log("✅ Gerência criada com sucesso:", result.id);
    return result;
  }

  static async updateManagement(data: { id: number; name: string; direction_id: number }): Promise<Management> {
    console.log("✏️ Atualizando gerência:", data.id);
    const result = await updateManagementAPI(data);
    console.log("✅ Gerência atualizada com sucesso");
    return result;
  }

  static async deleteManagement(id: number): Promise<void> {
    console.log("🗑️ Inativando gerência:", id);
    await deleteManagementAPI(id);
    console.log("✅ Gerência inativada com sucesso");
  }

  // Coordinations
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
    // Só aplica filtro se não for vazio (vazio = mostrar todos)
    if (statusFilter === "active") {
      params.append("is_active", "true");
    } else if (statusFilter === "inactive") {
      params.append("is_active", "false");
    }

    console.log("🎯 Buscando coordenações:", params.toString());

    const data = await fetchCoordinationsAPI(params);
    console.log("📊 Coordenações recebidas:", {
      count: data.count,
      results: data.results?.length || 0,
    });

    return data;
  }

  static async createCoordination(data: { name: string; management_id: number }): Promise<Coordination> {
    console.log("➕ Criando coordenação:", data.name);
    const result = await createCoordinationAPI(data);
    console.log("✅ Coordenação criada com sucesso:", result.id);
    return result;
  }

  static async updateCoordination(data: { id: number; name: string; management_id: number }): Promise<Coordination> {
    console.log("✏️ Atualizando coordenação:", data.id);
    const result = await updateCoordinationAPI(data);
    console.log("✅ Coordenação atualizada com sucesso");
    return result;
  }

  static async deleteCoordination(id: number): Promise<void> {
    console.log("🗑️ Inativando coordenação:", id);
    await deleteCoordinationAPI(id);
    console.log("✅ Coordenação inativada com sucesso");
  }
}
