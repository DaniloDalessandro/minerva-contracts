import {
  fetchContractsAPI,
  fetchContractByIdAPI,
  createContractAPI,
  updateContractAPI,
  deleteContractAPI,
  toggleContractStatusAPI,
  fetchEmployeesAPI,
  fetchBudgetLinesAPI,
} from '@/lib/api/contratos';
import type {
  Contract,
  ContractsResponse,
  CreateContractData,
} from '@/types/entities/contrato';
import { PAGINATION_DEFAULTS } from '@/constants/ui';

export class ContractService {
  static async fetchContracts(
    page: number = PAGINATION_DEFAULTS.PAGE,
    pageSize: number = PAGINATION_DEFAULTS.PAGE_SIZE,
    search: string = "",
    ordering: string = "",
    statusFilter: string = ""
  ): Promise<ContractsResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      page_size: pageSize.toString(),
    });

    if (search) params.append('search', search);
    if (ordering) params.append('ordering', ordering);
    if (statusFilter) params.append('status', statusFilter);

    return fetchContractsAPI(params);
  }

  static async fetchContractById(id: number): Promise<Contract> {
    return fetchContractByIdAPI(id);
  }

  static async createContract(data: CreateContractData): Promise<Contract> {
    return createContractAPI(data);
  }

  static async updateContract(data: CreateContractData): Promise<Contract> {
    return updateContractAPI(data);
  }

  static async deleteContract(id: number): Promise<void> {
    await deleteContractAPI(id);

  }

  static async toggleStatus(id: number): Promise<Contract> {
    return toggleContractStatusAPI(id);
  }

  static async fetchEmployees(): Promise<any[]> {
    return fetchEmployeesAPI();
  }

  static async fetchBudgetLines(): Promise<any[]> {
    return fetchBudgetLinesAPI();
  }

  static async getContracts(): Promise<ContractsResponse> {
    return this.fetchContracts();
  }

  static async getContract(id: number): Promise<Contract> {
    return this.fetchContractById(id);
  }
}
