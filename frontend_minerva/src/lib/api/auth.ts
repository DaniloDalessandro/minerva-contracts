import { apiClient } from './client';
import { API_ENDPOINTS } from '@/constants/api-endpoints';

export interface ChangePasswordData {
  old_password: string;
  new_password: string;
}

export interface ChangePasswordResponse {
  message: string;
}

export interface ApiError {
  error: string;
}

// Funções da API de autenticação
export async function changePasswordAPI(data: ChangePasswordData): Promise<ChangePasswordResponse> {
  const url = API_ENDPOINTS.AUTH.CHANGE_PASSWORD;
  const response = await apiClient(url, {
    method: 'POST',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Erro ao alterar senha');
  }

  return response.json();
}

export async function logoutAPI(): Promise<void> {
  try {
    const url = API_ENDPOINTS.AUTH.LOGOUT;
    await apiClient(url, {
      method: 'POST',
    });
  } catch (error) {
  } finally {
    // Sempre limpa os dados locais, mesmo que a chamada falhe
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('access');
    localStorage.removeItem('refresh');
    localStorage.removeItem('user_id');
    localStorage.removeItem('user_email');
    localStorage.removeItem('user_name');

    // Remove o cookie
    document.cookie = 'access=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
  }
}

// Exportações legadas para compatibilidade (obsoleto - use a camada de serviço em seu lugar)
export async function changePassword(data: ChangePasswordData): Promise<ChangePasswordResponse> {
  return changePasswordAPI(data);
}

export async function logout(): Promise<void> {
  return logoutAPI();
}
