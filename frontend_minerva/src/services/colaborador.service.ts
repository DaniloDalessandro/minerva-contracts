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

  static async fetchColaboradores(
    page: number = PAGINATION_DEFAULTS.PAGE,
    pageSize: number = PAGINATION_DEFAULTS.PAGE_SIZE,
    search: string = "",
    ordering: string = "",
    status: string = ""
  ): Promise<ColaboradoresResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      page_size: pageSize.toString(),
    });
    if (search) params.append('search', search);
    if (ordering) params.append('ordering', ordering);
    if (status && status.trim() !== "") params.append('status', status);
    return fetchColaboradoresAPI(params);
  }

  static async fetchColaboradorById(id: number): Promise<Colaborador> {
    return fetchColaboradorByIdAPI(id);
  }

  static async createColaborador(data: CreateColaboradorData): Promise<Colaborador> {
    return createColaboradorAPI(data);
  }

  static async updateColaborador(data: CreateColaboradorData): Promise<Colaborador> {
    return updateColaboradorAPI(data);
  }

  static async toggleStatus(id: number): Promise<Colaborador> {
    return toggleColaboradorStatusAPI(id);
  }

  static async fetchContratos(colaboradorId: number): Promise<ColaboradorContrato[]> {
    return fetchColaboradorContratosAPI(colaboradorId);
  }

  static async fetchAuxilios(colaboradorId: number): Promise<ColaboradorAuxilio[]> {
    return fetchColaboradorAuxiliosAPI(colaboradorId);
  }

  static async fetchDirections(): Promise<any[]> {
    return fetchDirectionsAPI();
  }

  static async fetchManagements(): Promise<any[]> {
    return fetchManagementsAPI();
  }

  static async fetchCoordinations(): Promise<any[]> {
    return fetchCoordinationsAPI();
  }

  static async getColaboradores(): Promise<ColaboradoresResponse> {
    return this.fetchColaboradores();
  }

  static async getColaborador(id: number): Promise<Colaborador> {
    return this.fetchColaboradorById(id);
  }
}
