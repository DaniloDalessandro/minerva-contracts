import {
  fetchAuxiliosAPI,
  fetchAuxilioByIdAPI,
  createAuxilioAPI,
  updateAuxilioAPI,
  deleteAuxilioAPI,
  fetchColaboradoresForDropdownAPI,
  fetchBudgetLinesForDropdownAPI,
} from '@/lib/api/auxilios';
import type {
  Auxilio,
  AuxiliosResponse,
  CreateAuxilioData,
} from '@/types/entities/auxilio';
import { PAGINATION_DEFAULTS } from '@/constants/ui';

export class AuxilioService {

  static async fetchAuxilios(
    page: number = PAGINATION_DEFAULTS.PAGE,
    pageSize: number = PAGINATION_DEFAULTS.PAGE_SIZE,
    search: string = "",
    ordering: string = "",
    status: string = ""
  ): Promise<AuxiliosResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      page_size: pageSize.toString(),
    });

    if (search) params.append('search', search);
    if (ordering) params.append('ordering', ordering);

    if (status && status.trim() !== "") {
      params.append('status', status);
    }

    console.log("💰 Buscando auxílios:", params.toString(), status ? `(filtro: ${status})` : "(sem filtro - todos)");

    const data = await fetchAuxiliosAPI(params);
    console.log("📊 Auxílios recebidos:", {
      count: data.count,
      results: data.results?.length || 0,
    });

    return data;
  }

  static async fetchAuxilioById(id: number): Promise<Auxilio> {
    console.log("💰 Buscando auxílio por ID:", id);
    const data = await fetchAuxilioByIdAPI(id);
    console.log("✅ Auxílio encontrado:", data.type);
    return data;
  }

  static async createAuxilio(data: CreateAuxilioData): Promise<Auxilio> {
    console.log("➕ Criando novo auxílio:", data.type);
    const result = await createAuxilioAPI(data);
    console.log("✅ Auxílio criado com sucesso:", result.id);
    return result;
  }

  static async updateAuxilio(data: CreateAuxilioData): Promise<Auxilio> {
    console.log("✏️ Atualizando auxílio:", data.id);
    const result = await updateAuxilioAPI(data);
    console.log("✅ Auxílio atualizado com sucesso");
    return result;
  }

  static async deleteAuxilio(id: number): Promise<void> {
    console.log("🗑️ Deletando auxílio:", id);
    await deleteAuxilioAPI(id);
    console.log("✅ Auxílio deletado com sucesso");
  }

  static async fetchColaboradores(): Promise<any[]> {
    console.log("👥 Buscando colaboradores para dropdown");
    const data = await fetchColaboradoresForDropdownAPI();
    console.log("📊 Colaboradores encontrados:", data.length);
    return data;
  }

  static async fetchBudgetLines(): Promise<any[]> {
    console.log("💰 Buscando linhas orçamentárias para dropdown");
    const data = await fetchBudgetLinesForDropdownAPI();
    console.log("📊 Linhas orçamentárias encontradas:", data.length);
    return data;
  }


  static async getAuxilios(): Promise<AuxiliosResponse> {
    return this.fetchAuxilios();
  }

  static async getAuxilio(id: number): Promise<Auxilio> {
    return this.fetchAuxilioById(id);
  }
}
