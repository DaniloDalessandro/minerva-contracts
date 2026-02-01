import { apiClient } from './client';
import { API_ENDPOINTS } from '@/constants/api-endpoints';
import type {
  ManagementCenter,
  RequestingCenter,
} from '@/types/entities/center';

// Funções da API de Centros Gestores
export async function fetchManagementCentersAPI(params: URLSearchParams): Promise<any> {
  const url = `${API_ENDPOINTS.MANAGEMENT_CENTER.LIST}?${params.toString()}`;
  const res = await apiClient(url);
  if (!res.ok) {
    let errorText;
    try {
      errorText = await res.text();
    } catch (e) {
      errorText = "Não foi possível ler a resposta de erro";
    }

    if (res.status === 401) {
      throw new Error("Não autorizado. Faça login novamente.");
    } else if (res.status === 403) {
      throw new Error("Sem permissão para acessar centros gestores.");
    } else if (res.status === 404) {
      throw new Error("Endpoint não encontrado. Verifique se o servidor está executando.");
    } else if (res.status >= 500) {
      throw new Error("Erro interno do servidor. Tente novamente em alguns minutos.");
    } else {
      throw new Error(`Erro ao buscar centros gestores: ${res.status} - ${errorText}`);
    }
  }

  return res.json();
}

export async function createManagementCenterAPI(data: { name: string; description?: string }): Promise<ManagementCenter> {
  const url = API_ENDPOINTS.MANAGEMENT_CENTER.CREATE;
  const res = await apiClient(url, {
    method: "POST",
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Erro ao criar centro gestor");
  return res.json();
}

export async function updateManagementCenterAPI(data: { id: number; name: string; description?: string }): Promise<ManagementCenter> {
  const url = API_ENDPOINTS.MANAGEMENT_CENTER.UPDATE(data.id);
  const res = await apiClient(url, {
    method: "PUT",
    body: JSON.stringify({ name: data.name, description: data.description }),
  });
  if (!res.ok) throw new Error("Erro ao atualizar centro gestor");
  return res.json();
}

export async function deleteManagementCenterAPI(id: number): Promise<any> {
  const url = API_ENDPOINTS.MANAGEMENT_CENTER.DELETE(id);
  const res = await apiClient(url, {
    method: "PUT",
  });
  if (!res.ok) throw new Error("Erro ao inativar centro gestor");
  return res.json();
}

// Funções da API de Centros Solicitantes
export async function fetchRequestingCentersAPI(params: URLSearchParams): Promise<any> {
  const url = `${API_ENDPOINTS.REQUESTING_CENTER.LIST}?${params.toString()}`;
  const res = await apiClient(url);
  if (!res.ok) throw new Error("Erro ao buscar centros solicitantes");
  return res.json();
}

export async function createRequestingCenterAPI(data: { name: string; description?: string; management_center_id: number }): Promise<RequestingCenter> {
  const url = API_ENDPOINTS.REQUESTING_CENTER.CREATE;
  const res = await apiClient(url, {
    method: "POST",
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Erro ao criar centro solicitante");
  return res.json();
}

export async function updateRequestingCenterAPI(data: { id: number; name: string; description?: string; management_center_id: number }): Promise<RequestingCenter> {
  const url = API_ENDPOINTS.REQUESTING_CENTER.UPDATE(data.id);
  const res = await apiClient(url, {
    method: "PUT",
    body: JSON.stringify({ name: data.name, description: data.description, management_center_id: data.management_center_id }),
  });
  if (!res.ok) throw new Error("Erro ao atualizar centro solicitante");
  return res.json();
}

export async function deleteRequestingCenterAPI(id: number): Promise<any> {
  const url = API_ENDPOINTS.REQUESTING_CENTER.DELETE(id);
  const res = await apiClient(url, {
    method: "PUT",
  });
  if (!res.ok) throw new Error("Erro ao inativar centro solicitante");
  return res.json();
}

// Exportações legadas para compatibilidade (obsoleto - use a camada de serviço em seu lugar)
export async function fetchManagementCenters(page = 1, pageSize = 10, search = "", ordering = "", statusFilter = "active"): Promise<any> {
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
  return fetchManagementCentersAPI(params);
}

export async function createManagementCenter(data: { name: string; description?: string }): Promise<ManagementCenter> {
  return createManagementCenterAPI(data);
}

export async function updateManagementCenter(data: { id: number; name: string; description?: string }): Promise<ManagementCenter> {
  return updateManagementCenterAPI(data);
}

export async function deleteManagementCenter(id: number): Promise<any> {
  return deleteManagementCenterAPI(id);
}

export async function fetchRequestingCenters(page = 1, pageSize = 10, search = "", ordering = "", statusFilter = "active"): Promise<any> {
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
  return fetchRequestingCentersAPI(params);
}

export async function createRequestingCenter(data: { name: string; description?: string; management_center_id: number }): Promise<RequestingCenter> {
  return createRequestingCenterAPI(data);
}

export async function updateRequestingCenter(data: { id: number; name: string; description?: string; management_center_id: number }): Promise<RequestingCenter> {
  return updateRequestingCenterAPI(data);
}

export async function deleteRequestingCenter(id: number): Promise<any> {
  return deleteRequestingCenterAPI(id);
}
