import { apiClient } from "./client";
import { API_URL } from "@/lib/config";
import { API_ENDPOINTS } from "@/constants/api-endpoints";

// Função para verificar se um nome de centro gestor já existe
export async function checkManagementCenterNameExists(
  name: string, 
  excludeId?: number
): Promise<boolean> {
  try {
    const params = new URLSearchParams({
      search: name.trim(),
      page_size: "1000",
    });
    
    const res = await apiClient(`${API_URL}${API_ENDPOINTS.CENTER.MANAGEMENT_LIST}?${params.toString()}`);
    if (!res.ok) {
      return false;
    }
    
    const data = await res.json();
    const centers = data.results || [];
    
    // Verifica se existe algum centro com o mesmo nome (case-insensitive)
    // excluindo o próprio centro se estiver editando
    const duplicateExists = centers.some((center: any) => 
      center.name.toLowerCase() === name.toLowerCase() && 
      center.id !== excludeId
    );
    
    return duplicateExists;
  } catch (error) {
    return false;
  }
}

// Função para verificar se um nome de centro solicitante já existe em um centro gestor
export async function checkRequestingCenterNameExists(
  name: string,
  managementCenterId: number,
  excludeId?: number
): Promise<boolean> {
  try {
    const params = new URLSearchParams({
      search: name.trim(),
      page_size: "1000",
    });
    
    const res = await apiClient(`${API_URL}${API_ENDPOINTS.CENTER.REQUESTING_LIST}?${params.toString()}`);
    if (!res.ok) {
      return false;
    }
    
    const data = await res.json();
    const centers = data.results || [];
    
    // Verifica se existe algum centro com o mesmo nome no mesmo centro gestor
    // excluindo o próprio centro se estiver editando
    const duplicateExists = centers.some((center: any) => 
      center.name.toLowerCase() === name.toLowerCase() && 
      center.management_center.id === managementCenterId &&
      center.id !== excludeId
    );
    
    return duplicateExists;
  } catch (error) {
    return false;
  }
}

// Função utilitária para debounce de verificação
export function createDebouncedValidation<T extends any[]>(
  validationFn: (...args: T) => Promise<boolean>,
  delay = 500
) {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: T): Promise<boolean> => {
    return new Promise((resolve) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(async () => {
        const result = await validationFn(...args);
        resolve(result);
      }, delay);
    });
  };
}