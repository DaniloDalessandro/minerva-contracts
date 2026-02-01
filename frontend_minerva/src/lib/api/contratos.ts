import { apiClient } from './client';
import { API_ENDPOINTS } from '@/constants/api-endpoints';
import type {
  Contract,
  ContractsResponse,
  CreateContractData,
} from '@/types/entities/contrato';

// Funções principais da API de contratos
export async function fetchContractsAPI(params: URLSearchParams): Promise<ContractsResponse> {
  const url = `${API_ENDPOINTS.CONTRACT.LIST}?${params}`;
  const response = await apiClient(url);
  if (!response.ok) {
    throw new Error('Falha ao buscar contratos');
  }
  return response.json();
}

export async function fetchContractByIdAPI(id: number): Promise<Contract> {
  const url = API_ENDPOINTS.CONTRACT.BY_ID(id);
  const response = await apiClient(url);
  if (!response.ok) {
    throw new Error('Falha ao buscar contrato');
  }
  return response.json();
}

export async function createContractAPI(data: CreateContractData): Promise<Contract> {
  const url = API_ENDPOINTS.CONTRACT.CREATE;
  const response = await apiClient(url, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Falha ao criar contrato');
  }
  return response.json();
}

export async function updateContractAPI(data: CreateContractData): Promise<Contract> {
  const url = API_ENDPOINTS.CONTRACT.UPDATE(data.id!);
  const response = await apiClient(url, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Falha ao atualizar contrato');
  }
  return response.json();
}

export async function deleteContractAPI(id: number): Promise<any> {
  const url = API_ENDPOINTS.CONTRACT.DELETE(id);
  const response = await apiClient(url, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Falha ao excluir contrato');
  }
  return response.json();
}

export async function toggleContractStatusAPI(id: number): Promise<Contract> {
  const url = API_ENDPOINTS.CONTRACT.TOGGLE_STATUS(id);
  const response = await apiClient(url, {
    method: 'PATCH',
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Falha ao alterar status do contrato');
  }
  return response.json();
}

// API de dados para dropdown
export async function fetchEmployeesAPI(): Promise<any[]> {
  const url = `${API_ENDPOINTS.EMPLOYEE.ALL_EMPLOYEES}?page_size=1000`;
  const response = await apiClient(url);
  if (!response.ok) {
    throw new Error('Falha ao buscar funcionários');
  }
  const data = await response.json();
  return data.results || data;
}

export async function fetchBudgetLinesAPI(): Promise<any[]> {
  const url = `${API_ENDPOINTS.BUDGET_LINE.ALL}?page_size=1000`;
  const response = await apiClient(url);
  if (!response.ok) {
    throw new Error('Falha ao buscar linhas orçamentárias');
  }
  const data = await response.json();
  return data.results || data;
}

// Exportações legadas para compatibilidade com versões anteriores (obsoleto - use a camada de serviço)
export async function fetchContracts(
  page: number = 1,
  pageSize: number = 10,
  search: string = "",
  ordering: string = ""
): Promise<ContractsResponse> {
  const params = new URLSearchParams({
    page: page.toString(),
    page_size: pageSize.toString(),
  });
  if (search) params.append('search', search);
  if (ordering) params.append('ordering', ordering);
  return fetchContractsAPI(params);
}

export async function fetchContractById(id: number): Promise<Contract> {
  return fetchContractByIdAPI(id);
}

export async function createContract(data: CreateContractData): Promise<Contract> {
  return createContractAPI(data);
}

export async function updateContract(data: CreateContractData): Promise<Contract> {
  return updateContractAPI(data);
}

export async function deleteContract(id: number): Promise<any> {
  return deleteContractAPI(id);
}

export async function fetchEmployees(): Promise<any[]> {
  return fetchEmployeesAPI();
}

export async function fetchBudgetLines(): Promise<any[]> {
  return fetchBudgetLinesAPI();
}

export async function getContracts(): Promise<ContractsResponse> {
  return fetchContracts();
}

export async function getContract(id: number): Promise<Contract> {
  return fetchContractById(id);
}
