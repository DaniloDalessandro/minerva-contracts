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

    console.log("📄 Buscando contratos:", params.toString());

    const data = await fetchContractsAPI(params);
    console.log("📊 Dados contratos recebidos:", {
      count: data.count,
      results: data.results?.length || 0,
    });

    return data;
  }

  static async fetchContractById(id: number): Promise<Contract> {
    console.log("📄 Buscando contrato por ID:", id);
    const data = await fetchContractByIdAPI(id);
    console.log("✅ Contrato encontrado:", data.protocol_number);
    return data;
  }

  static async createContract(data: CreateContractData): Promise<Contract> {
    console.log("➕ Criando novo contrato");
    const result = await createContractAPI(data);
    console.log("✅ Contrato criado com sucesso:", result.id);
    return result;
  }

  static async updateContract(data: CreateContractData): Promise<Contract> {
    console.log("✏️ Atualizando contrato:", data.id);
    const result = await updateContractAPI(data);
    console.log("✅ Contrato atualizado com sucesso");
    return result;
  }

  static async deleteContract(id: number): Promise<void> {
    console.log("🗑️ Deletando contrato:", id);
    await deleteContractAPI(id);
    console.log("✅ Contrato deletado com sucesso");
  }

  static async toggleStatus(id: number): Promise<Contract> {
    console.log("🔄 Alternando status do contrato:", id);
    const result = await toggleContractStatusAPI(id);
    console.log("✅ Status alterado para:", result.status);
    return result;
  }

  static async fetchEmployees(): Promise<any[]> {
    console.log("👥 Buscando funcionários para dropdown");
    const data = await fetchEmployeesAPI();
    console.log("📊 Funcionários encontrados:", data.length);
    return data;
  }

  static async fetchBudgetLines(): Promise<any[]> {
    console.log("💰 Buscando linhas orçamentárias para dropdown");
    const data = await fetchBudgetLinesAPI();
    console.log("📊 Linhas orçamentárias encontradas:", data.length);
    return data;
  }


  static async getContracts(): Promise<ContractsResponse> {
    return this.fetchContracts();
  }

  static async getContract(id: number): Promise<Contract> {
    return this.fetchContractById(id);
  }
}
