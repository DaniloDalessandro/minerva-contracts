import { apiClient } from './client';
import { API_ENDPOINTS } from '@/constants/api-endpoints';
import type {
  Direction,
  Management,
  Coordination,
} from '@/types/entities/setor';

// Funções da API de Diretorias
export async function fetchDirectionsAPI(params: URLSearchParams): Promise<any> {
  const url = `${API_ENDPOINTS.DIRECTION.LIST}?${params.toString()}`;
  const res = await apiClient(url);
  if (!res.ok) throw new Error(`Erro ao buscar direções: ${res.status}`);
  return res.json();
}

export async function createDirectionAPI(data: { name: string }): Promise<Direction> {
  const url = API_ENDPOINTS.DIRECTION.CREATE;
  const res = await apiClient(url, {
    method: "POST",
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Erro ao criar direção");
  return res.json();
}

export async function updateDirectionAPI(data: { id: number; name: string }): Promise<Direction> {
  const url = API_ENDPOINTS.DIRECTION.UPDATE(data.id);
  const res = await apiClient(url, {
    method: "PUT",
    body: JSON.stringify({ name: data.name }),
  });
  if (!res.ok) throw new Error("Erro ao atualizar direção");
  return res.json();
}

export async function deleteDirectionAPI(id: number): Promise<any> {
  const url = API_ENDPOINTS.DIRECTION.DELETE(id);
  const res = await apiClient(url, {
    method: "PUT",
  });
  if (!res.ok) throw new Error("Erro ao inativar direção");
  return res.json();
}

// Funções da API de Gerências
export async function fetchManagementsAPI(params: URLSearchParams): Promise<any> {
  const url = `${API_ENDPOINTS.MANAGEMENT.LIST}?${params.toString()}`;
  const res = await apiClient(url);
  if (!res.ok) throw new Error(`Erro ao buscar gerências: ${res.status}`);
  return res.json();
}

export async function createManagementAPI(data: { name: string; direction_id: number }): Promise<Management> {
  const url = API_ENDPOINTS.MANAGEMENT.CREATE;
  const res = await apiClient(url, {
    method: "POST",
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Erro ao criar gerência");
  return res.json();
}

export async function updateManagementAPI(data: { id: number; name: string; direction_id: number }): Promise<Management> {
  const url = API_ENDPOINTS.MANAGEMENT.UPDATE(data.id);
  const res = await apiClient(url, {
    method: "PUT",
    body: JSON.stringify({ name: data.name, direction_id: data.direction_id }),
  });
  if (!res.ok) throw new Error("Erro ao atualizar gerência");
  return res.json();
}

export async function deleteManagementAPI(id: number): Promise<any> {
  const url = API_ENDPOINTS.MANAGEMENT.DELETE(id);
  const res = await apiClient(url, {
    method: "PUT",
  });
  if (!res.ok) throw new Error("Erro ao inativar gerência");
  return res.json();
}

// Funções da API de Coordenações
export async function fetchCoordinationsAPI(params: URLSearchParams): Promise<any> {
  const url = `${API_ENDPOINTS.COORDINATION.LIST}?${params.toString()}`;
  const res = await apiClient(url);
  if (!res.ok) throw new Error("Erro ao buscar coordenações");
  return res.json();
}

export async function createCoordinationAPI(data: { name: string; management_id: number }): Promise<Coordination> {
  const url = API_ENDPOINTS.COORDINATION.CREATE;
  const res = await apiClient(url, {
    method: "POST",
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Erro ao criar coordenação");
  return res.json();
}

export async function updateCoordinationAPI(data: { id: number; name: string; management_id: number }): Promise<Coordination> {
  const url = API_ENDPOINTS.COORDINATION.UPDATE(data.id);
  const res = await apiClient(url, {
    method: "PUT",
    body: JSON.stringify({ name: data.name, management_id: data.management_id }),
  });
  if (!res.ok) throw new Error("Erro ao atualizar coordenação");
  return res.json();
}

export async function deleteCoordinationAPI(id: number): Promise<any> {
  const url = API_ENDPOINTS.COORDINATION.DELETE(id);
  const res = await apiClient(url, {
    method: "PUT",
  });
  if (!res.ok) throw new Error("Erro ao inativar coordenação");
  return res.json();
}

// Exportações legadas para compatibilidade retroativa (obsoleto - use a camada de serviço em vez disso)
export async function fetchDirections(page = 1, pageSize = 10, search = "", ordering = "", statusFilter = ""): Promise<any> {
  const params = new URLSearchParams({
    page: page.toString(),
    page_size: pageSize.toString(),
  });
  if (search) params.append("search", search);
  if (ordering) params.append("ordering", ordering);
  if (statusFilter === "active") {
    params.append("is_active", "true");
  } else if (statusFilter === "inactive") {
    params.append("is_active", "false");
  }
  return fetchDirectionsAPI(params);
}

export async function createDirection(data: { name: string }): Promise<Direction> {
  return createDirectionAPI(data);
}

export async function updateDirection(data: { id: number; name: string }): Promise<Direction> {
  return updateDirectionAPI(data);
}

export async function deleteDirection(id: number): Promise<any> {
  return deleteDirectionAPI(id);
}

export async function fetchManagements(page = 1, pageSize = 10, search = "", ordering = "", statusFilter = ""): Promise<any> {
  const params = new URLSearchParams({
    page: page.toString(),
    page_size: pageSize.toString(),
  });
  if (search) params.append("search", search);
  if (ordering) params.append("ordering", ordering);
  if (statusFilter === "active") {
    params.append("is_active", "true");
  } else if (statusFilter === "inactive") {
    params.append("is_active", "false");
  }
  return fetchManagementsAPI(params);
}

export async function createManagement(data: { name: string; direction_id: number }): Promise<Management> {
  return createManagementAPI(data);
}

export async function updateManagement(data: { id: number; name: string; direction_id: number }): Promise<Management> {
  return updateManagementAPI(data);
}

export async function deleteManagement(id: number): Promise<any> {
  return deleteManagementAPI(id);
}

export async function fetchCoordinations(page = 1, pageSize = 10, search = "", ordering = "", statusFilter = ""): Promise<any> {
  const params = new URLSearchParams({
    page: page.toString(),
    page_size: pageSize.toString(),
  });
  if (search) params.append("search", search);
  if (ordering) params.append("ordering", ordering);
  if (statusFilter === "active") {
    params.append("is_active", "true");
  } else if (statusFilter === "inactive") {
    params.append("is_active", "false");
  }
  return fetchCoordinationsAPI(params);
}

export async function createCoordination(data: { name: string; management_id: number }): Promise<Coordination> {
  return createCoordinationAPI(data);
}

export async function updateCoordination(data: { id: number; name: string; management_id: number }): Promise<Coordination> {
  return updateCoordinationAPI(data);
}

export async function deleteCoordination(id: number): Promise<any> {
  return deleteCoordinationAPI(id);
}
