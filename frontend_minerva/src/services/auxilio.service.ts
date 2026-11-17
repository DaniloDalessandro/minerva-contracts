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

    return fetchAuxiliosAPI(params);
  }

  static async fetchAuxilioById(id: number): Promise<Auxilio> {
    return fetchAuxilioByIdAPI(id);
  }

  static async createAuxilio(data: CreateAuxilioData): Promise<Auxilio> {
    return createAuxilioAPI(data);
  }

  static async updateAuxilio(data: CreateAuxilioData): Promise<Auxilio> {
    return updateAuxilioAPI(data);
  }

  static async deleteAuxilio(id: number): Promise<void> {
    await deleteAuxilioAPI(id);

  }

  static async fetchColaboradores(): Promise<any[]> {
    return fetchColaboradoresForDropdownAPI();
  }

  static async fetchBudgetLines(): Promise<any[]> {
    return fetchBudgetLinesForDropdownAPI();
  }

  static async getAuxilios(): Promise<AuxiliosResponse> {
    return this.fetchAuxilios();
  }

  static async getAuxilio(id: number): Promise<Auxilio> {
    return this.fetchAuxilioById(id);
  }
}
