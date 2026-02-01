import { apiClient } from "./client";
import { API_URL } from "@/lib/config";
import { API_ENDPOINTS } from "@/constants/api-endpoints";

export interface Management {
  id: number;
  name: string;
  is_active: boolean;
  direction: number;
  created_at: string;
  updated_at: string;
  created_by?: {
    email: string;
  };
  updated_by?: {
    email: string;
  };
}

const API_BASE_URL = `${API_URL}${API_ENDPOINTS.MANAGEMENT.LIST}`;

export async function fetchManagements(page = 1, pageSize = 10, search = "", ordering = "", statusFilter = "") {

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
  
  const url = `${API_BASE_URL}?${params.toString()}`;
  
  const res = await apiClient(url);
  
  if (!res.ok) throw new Error(`Erro ao buscar gerências: ${res.status}`);
  
  const json = await res.json();
  
  return json;
}

export async function createManagement(data: { name: string, direction_id: number }) {
  const res = await apiClient(`${API_URL}${API_ENDPOINTS.MANAGEMENT.CREATE}`, {
    method: "POST",
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Erro ao criar gerência");
  return res.json();
}


export async function updateManagement(data: { id: number; name: string, direction_id: number }) {
  const res = await apiClient(`${API_URL}${API_ENDPOINTS.MANAGEMENT.UPDATE(data.id)}`, {
    method: "PUT",
    body: JSON.stringify({ name: data.name, direction_id: data.direction_id }),
  });
  if (!res.ok) throw new Error("Erro ao atualizar gerência");
  return res.json();
}

export async function deleteManagement(id: number) {
  const res = await apiClient(`${API_URL}${API_ENDPOINTS.MANAGEMENT.DELETE(id)}`, {
    method: "PUT",
  });
  if (!res.ok) throw new Error("Erro ao inativar gerência");
  return res.json();
}