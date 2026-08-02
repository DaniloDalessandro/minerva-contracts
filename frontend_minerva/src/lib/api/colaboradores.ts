import { apiClient } from './client';
import { API_ENDPOINTS } from '@/constants/api-endpoints';
import type {
  Colaborador,
  ColaboradoresResponse,
  CreateColaboradorData,
  ColaboradorContrato,
  ColaboradorAuxilio,
} from '@/types/entities/colaborador';

export type { Colaborador, ColaboradoresResponse, CreateColaboradorData, ColaboradorContrato, ColaboradorAuxilio } from '@/types/entities/colaborador';


export async function fetchColaboradoresAPI(params: URLSearchParams): Promise<ColaboradoresResponse> {
  const url = `${API_ENDPOINTS.EMPLOYEE.LIST}?${params}`;
  const response = await apiClient(url);
  if (!response.ok) {
    throw new Error(`Erro ao buscar colaboradores: ${response.status}`);
  }
  return response.json();
}

export async function fetchColaboradorByIdAPI(id: number): Promise<Colaborador> {
  const url = API_ENDPOINTS.EMPLOYEE.BY_ID(id);
  const response = await apiClient(url);
  if (!response.ok) {
    throw new Error('Falha ao buscar colaborador');
  }
  return response.json();
}

export async function createColaboradorAPI(data: CreateColaboradorData): Promise<Colaborador> {
  const url = API_ENDPOINTS.EMPLOYEE.CREATE;
  const response = await apiClient(url, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Falha ao criar colaborador');
  }
  return response.json();
}

export async function updateColaboradorAPI(data: CreateColaboradorData): Promise<Colaborador> {
  const url = API_ENDPOINTS.EMPLOYEE.UPDATE(data.id!);
  const response = await apiClient(url, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Falha ao atualizar colaborador');
  }
  return response.json();
}

export async function toggleColaboradorStatusAPI(id: number): Promise<Colaborador> {
  const url = API_ENDPOINTS.EMPLOYEE.TOGGLE_STATUS(id);
  const response = await apiClient(url, {
    method: 'PATCH',
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Falha ao alternar status do colaborador');
  }
  return response.json();
}


export async function fetchColaboradorContratosAPI(colaboradorId: number): Promise<ColaboradorContrato[]> {
  const url = `${API_ENDPOINTS.EMPLOYEE.CONTRACTS}?employee=${colaboradorId}`;
  const response = await apiClient(url);
  if (!response.ok) {
    throw new Error('Falha ao buscar contratos do colaborador');
  }
  const data = await response.json();
  return data.results || data;
}


export async function fetchColaboradorAuxiliosAPI(colaboradorId: number): Promise<ColaboradorAuxilio[]> {
  const url = `${API_ENDPOINTS.EMPLOYEE.AIDS}?employee=${colaboradorId}`;
  const response = await apiClient(url);
  if (!response.ok) {
    throw new Error('Falha ao buscar auxílios do colaborador');
  }
  const data = await response.json();
  return data.results || data;
}


export async function fetchDirectionsAPI(): Promise<any[]> {
  const url = `${API_ENDPOINTS.DIRECTION.LIST}?page_size=1000&ordering=name`;
  const response = await apiClient(url);
  if (!response.ok) {
    throw new Error('Falha ao buscar diretorias');
  }
  const data = await response.json();
  return data.results || data;
}

export async function fetchManagementsAPI(): Promise<any[]> {
  const url = `${API_ENDPOINTS.MANAGEMENT.LIST}?page_size=1000&ordering=name`;
  const response = await apiClient(url);
  if (!response.ok) {
    throw new Error('Falha ao buscar gerências');
  }
  const data = await response.json();
  return data.results || data;
}

export async function fetchCoordinationsAPI(): Promise<any[]> {
  const url = `${API_ENDPOINTS.COORDINATION.LIST}?page_size=1000&ordering=name`;
  const response = await apiClient(url);
  if (!response.ok) {
    throw new Error('Falha ao buscar coordenações');
  }
  const data = await response.json();
  return data.results || data;
}


