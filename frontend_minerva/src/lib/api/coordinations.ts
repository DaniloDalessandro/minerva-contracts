import { apiClient } from "./client";
import { API_URL } from "@/lib/config";
import { API_ENDPOINTS } from "@/constants/api-endpoints";

export interface Coordination {
  id: number;
  name: string;
  is_active: boolean;
  management: number;
  created_at: string;
  updated_at: string;
  created_by?: {
    email: string;
  };
  updated_by?: {
    email: string;
  };
}

const API_BASE_URL = `${API_URL}${API_ENDPOINTS.COORDINATION.LIST}`;

export async function fetchCoordinations(page = 1, pageSize = 10, search = "", ordering = "", statusFilter = "") {
  const params = new URLSearchParams({
    page: page.toString(),
    page_size: pageSize.toString(),
  });
  
  if (search) {
    params.append("search", search);
  }
  
  if (ordering) {
    params.append("ordering", ordering);
  }

  if (statusFilter === "active") {
    params.append("is_active", "true");
  } else if (statusFilter === "inactive") {
    params.append("is_active", "false");
  }
  const res = await apiClient(`${API_BASE_URL}?${params.toString()}`);
  if (!res.ok) throw new Error("Erro ao buscar coordenações");
  const json = await res.json();
  return json;
}

export async function createCoordination(data: { name: string, management_id: number }) {
  const res = await apiClient(`${API_URL}${API_ENDPOINTS.COORDINATION.CREATE}`, {
    method: "POST",
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Erro ao criar coordenação");
  return res.json();
}


export async function updateCoordination(data: { id: number; name: string, management_id: number }) {
  const res = await apiClient(`${API_URL}${API_ENDPOINTS.COORDINATION.UPDATE(data.id)}`, {
    method: "PUT",
    body: JSON.stringify({ name: data.name, management_id: data.management_id }),
  });
  if (!res.ok) throw new Error("Erro ao atualizar coordenação");
  return res.json();
}

export async function deleteCoordination(id: number) {
  const res = await apiClient(`${API_URL}${API_ENDPOINTS.COORDINATION.DELETE(id)}`, {
    method: "PUT",
  });
  if (!res.ok) throw new Error("Erro ao inativar coordenação");
  return res.json();
}