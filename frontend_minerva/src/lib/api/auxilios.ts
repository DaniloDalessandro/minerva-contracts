import { fetchAllRecords } from './collection';
import { budgetLineLabel, normalizeAid } from './normalizers';
import { apiClient } from './client';
import { API_ENDPOINTS } from '@/constants/api-endpoints';
import type {
  Auxilio,
  AuxiliosResponse,
  CreateAuxilioData,
} from '@/types/entities/auxilio';

export type { Auxilio, AuxiliosResponse, CreateAuxilioData };


export async function fetchAuxiliosAPI(params: URLSearchParams): Promise<AuxiliosResponse> {
  const url = `${API_ENDPOINTS.AID.LIST}?${params}`;
  const response = await apiClient(url);
  if (!response.ok) {
    throw new Error('Falha ao buscar auxílios');
  }
  const data = await response.json();
  return { ...data, results: data.results.map(normalizeAid) };
}

export async function fetchAuxilioByIdAPI(id: number): Promise<Auxilio> {
  const url = API_ENDPOINTS.AID.BY_ID(id);
  const response = await apiClient(url);
  if (!response.ok) {
    throw new Error('Falha ao buscar auxílio');
  }
  return normalizeAid(await response.json());
}

export async function createAuxilioAPI(data: CreateAuxilioData): Promise<Auxilio> {
  const url = API_ENDPOINTS.AID.CREATE;
  const response = await apiClient(url, {
    method: 'POST',
    body: JSON.stringify({ ...data, employee_id: data.employee, budget_line_id: data.budget_line }),
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
    body: JSON.stringify({ ...data, employee_id: data.employee, budget_line_id: data.budget_line }),
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
  return response.status === 204 ? null : response.json();
}


export async function fetchColaboradoresForDropdownAPI(): Promise<any[]> {
  return fetchAllRecords(API_ENDPOINTS.EMPLOYEE.LIST);
}

export async function fetchBudgetLinesForDropdownAPI(): Promise<any[]> {
  const data = await fetchAllRecords(API_ENDPOINTS.BUDGET_LINE.LIST);
  return data.map(item => ({ ...item, name: budgetLineLabel(item) }));
}


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
