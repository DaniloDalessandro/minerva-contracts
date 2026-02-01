import {
  fetchColaboradoresAPI,
  fetchColaboradorByIdAPI,
  createColaboradorAPI,
  updateColaboradorAPI,
  toggleColaboradorStatusAPI,
  fetchColaboradorContratosAPI,
  fetchColaboradorAuxiliosAPI,
  fetchDirectionsAPI,
  fetchManagementsAPI,
  fetchCoordinationsAPI,
} from '@/lib/api/colaboradores';
import type {
  Colaborador,
  ColaboradoresResponse,
  CreateColaboradorData,
  ColaboradorContrato,
  ColaboradorAuxilio,
} from '@/types/entities/colaborador';
import { PAGINATION_DEFAULTS } from '@/constants/ui';

export class ColaboradorService {
  /**
   * Busca colaboradores com suporte a filtros opcionais.
   * @param status - Filtro de status. Vazio ou não informado = retorna todos.
   */
  static async fetchColaboradores(
    page: number = PAGINATION_DEFAULTS.PAGE,
    pageSize: number = PAGINATION_DEFAULTS.PAGE_SIZE,
    search: string = "",
    ordering: string = "",
    status: string = "" // Sem valor padrão - vazio significa "todos"
  ): Promise<ColaboradoresResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      page_size: pageSize.toString(),
    });

    if (search) params.append('search', search);
    if (ordering) params.append('ordering', ordering);
    // Só adiciona status se tiver valor (vazio = sem filtro = todos)
    if (status && status.trim() !== "") {
      params.append('status', status);
    }

    console.log("👥 Buscando colaboradores:", params.toString(), status ? `(filtro: ${status})` : "(sem filtro - todos)");

    const data = await fetchColaboradoresAPI(params);
    console.log("📊 Dados colaboradores recebidos:", {
      count: data.count,
      results: data.results?.length || 0,
    });

    return data;
  }

  static async fetchColaboradorById(id: number): Promise<Colaborador> {
    console.log("👤 Buscando colaborador por ID:", id);
    const data = await fetchColaboradorByIdAPI(id);
    console.log("✅ Colaborador encontrado:", data.full_name);
    return data;
  }

  static async createColaborador(data: CreateColaboradorData): Promise<Colaborador> {
    console.log("➕ Criando novo colaborador:", data.full_name);
    const result = await createColaboradorAPI(data);
    console.log("✅ Colaborador criado com sucesso:", result.id);
    return result;
  }

  static async updateColaborador(data: CreateColaboradorData): Promise<Colaborador> {
    console.log("✏️ Atualizando colaborador:", data.id);
    const result = await updateColaboradorAPI(data);
    console.log("✅ Colaborador atualizado com sucesso");
    return result;
  }

  static async toggleStatus(id: number): Promise<Colaborador> {
    console.log("🔄 Alternando status do colaborador:", id);
    const result = await toggleColaboradorStatusAPI(id);
    console.log("✅ Status alterado para:", result.status);
    return result;
  }

  static async fetchContratos(colaboradorId: number): Promise<ColaboradorContrato[]> {
    console.log("📄 Buscando contratos do colaborador:", colaboradorId);
    const data = await fetchColaboradorContratosAPI(colaboradorId);
    console.log("📊 Contratos encontrados:", data.length);
    return data;
  }

  static async fetchAuxilios(colaboradorId: number): Promise<ColaboradorAuxilio[]> {
    console.log("💰 Buscando auxílios do colaborador:", colaboradorId);
    const data = await fetchColaboradorAuxiliosAPI(colaboradorId);
    console.log("📊 Auxílios encontrados:", data.length);
    return data;
  }

  static async fetchDirections(): Promise<any[]> {
    console.log("🎯 Buscando direções disponíveis");
    const data = await fetchDirectionsAPI();
    console.log("📊 Direções encontradas:", data.length);
    return data;
  }

  static async fetchManagements(): Promise<any[]> {
    console.log("🏢 Buscando gerências disponíveis");
    const data = await fetchManagementsAPI();
    console.log("📊 Gerências encontradas:", data.length);
    return data;
  }

  static async fetchCoordinations(): Promise<any[]> {
    console.log("🎯 Buscando coordenações disponíveis");
    const data = await fetchCoordinationsAPI();
    console.log("📊 Coordenações encontradas:", data.length);
    return data;
  }

  // Legacy methods for backward compatibility
  static async getColaboradores(): Promise<ColaboradoresResponse> {
    return this.fetchColaboradores();
  }

  static async getColaborador(id: number): Promise<Colaborador> {
    return this.fetchColaboradorById(id);
  }
}
