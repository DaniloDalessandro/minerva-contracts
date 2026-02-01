import { apiClient } from './client';
import { API_ENDPOINTS } from '@/constants/api-endpoints';
import type {
  Auxilio,
  AuxiliosResponse,
  CreateAuxilioData,
} from '@/types/entities/auxilio';

// Funções principais da API de auxílios
export async function fetchAuxiliosAPI(params: URLSearchParams): Promise<AuxiliosResponse> {
  const url = `${API_ENDPOINTS.AID.LIST}?${params}`;
  const response = await apiClient(url);
  if (!response.ok) {
    throw new Error('Falha ao buscar auxílios');
  }
  return response.json();
}

export async function fetchAuxilioByIdAPI(id: number): Promise<Auxilio> {
  const url = API_ENDPOINTS.AID.BY_ID(id);
  const response = await apiClient(url);
  if (!response.ok) {
    throw new Error('Falha ao buscar auxílio');
  }
  return response.json();
}

export async function createAuxilioAPI(data: CreateAuxilioData): Promise<Auxilio> {
  const url = API_ENDPOINTS.AID.CREATE;
  const response = await apiClient(url, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Falha ao criar auxílio');
  }
  return response.json();
}

export async function updateAuxilioAPI(data: CreateAuxilioData): Promise<Auxilio> {
  const url = API_ENDPOINTS.AID.UPDATE(data.id!);
  const response = await apiClient(url, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Falha ao atualizar auxílio');
  }
  return response.json();
}

export async function deleteAuxilioAPI(id: number): Promise<any> {
  const url = API_ENDPOINTS.AID.DELETE(id);
  const response = await apiClient(url, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Falha ao excluir auxílio');
  }
  return response.json();
}

// API de dados para dropdown
export async function fetchColaboradoresForDropdownAPI(): Promise<any[]> {
  const url = `${API_ENDPOINTS.EMPLOYEE.ALL_EMPLOYEES}?page_size=1000`;
  const response = await apiClient(url);
  if (!response.ok) {
    throw new Error('Falha ao buscar colaboradores');
  }
  const data = await response.json();
  return data.results || data;
}

export async function fetchBudgetLinesForDropdownAPI(): Promise<any[]> {
  const url = `${API_ENDPOINTS.BUDGET_LINE.ALL}?page_size=1000`;
  const response = await apiClient(url);
  if (!response.ok) {
    throw new Error('Falha ao buscar linhas orçamentárias');
  }
  const data = await response.json();
  return data.results || data;
}

// Exportações legadas para compatibilidade (obsoleto - use a camada de serviço em seu lugar)
export async function fetchAuxilios(
  page: number = 1,
  pageSize: number = 10,
  search: string = "",
  ordering: string = ""
): Promise<AuxiliosResponse> {
  const params = new URLSearchParams({
    page: page.toString(),
    page_size: pageSize.toString(),
  });
  if (search) params.append('search', search);
  if (ordering) params.append('ordering', ordering);
  return fetchAuxiliosAPI(params);
}

export async function fetchAuxilioById(id: number): Promise<Auxilio> {
  return fetchAuxilioByIdAPI(id);
}

export async function createAuxilio(data: CreateAuxilioData): Promise<Auxilio> {
  return createAuxilioAPI(data);
}

export async function updateAuxilio(data: CreateAuxilioData): Promise<Auxilio> {
  return updateAuxilioAPI(data);
}

export async function deleteAuxilio(id: number): Promise<any> {
  return deleteAuxilioAPI(id);
}

export async function fetchColaboradores(): Promise<any[]> {
  return fetchColaboradoresForDropdownAPI();
}

export async function fetchBudgetLines(): Promise<any[]> {
  return fetchBudgetLinesForDropdownAPI();
}

export async function getAuxilios(): Promise<AuxiliosResponse> {
  return fetchAuxilios();
}

export async function getAuxilio(id: number): Promise<Auxilio> {
  return fetchAuxilioById(id);
}
