import { apiClient } from './client';
import { API_ENDPOINTS } from '@/constants/api-endpoints';
import type {
  BudgetLine,
  BudgetLinesResponse,
  CreateBudgetLineData,
  BudgetLineMovement,
  CreateBudgetLineMovementData,
} from '@/types/entities/budget-line';

// Funções principais da API de linhas orçamentárias
export async function fetchBudgetLinesAPI(params: URLSearchParams): Promise<BudgetLinesResponse> {
  const url = `${API_ENDPOINTS.BUDGET_LINE.LIST}?${params}`;
  const response = await apiClient(url);
  if (!response.ok) {
    throw new Error('Falha ao buscar linhas orçamentárias');
  }
  return response.json();
}

export async function fetchBudgetLineByIdAPI(id: number): Promise<BudgetLine> {
  const url = API_ENDPOINTS.BUDGET_LINE.BY_ID(id);
  const response = await apiClient(url);
  if (!response.ok) {
    throw new Error('Falha ao buscar linha orçamentária');
  }
  return response.json();
}

export async function createBudgetLineAPI(data: CreateBudgetLineData): Promise<BudgetLine> {
  const url = API_ENDPOINTS.BUDGET_LINE.CREATE;
  const response = await apiClient(url, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Falha ao criar linha orçamentária');
  }
  return response.json();
}

export async function updateBudgetLineAPI(data: CreateBudgetLineData): Promise<BudgetLine> {
  const url = API_ENDPOINTS.BUDGET_LINE.UPDATE(data.id!);
  const response = await apiClient(url, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Falha ao atualizar linha orçamentária');
  }
  return response.json();
}

export async function deleteBudgetLineAPI(id: number): Promise<any> {
  const url = API_ENDPOINTS.BUDGET_LINE.DELETE(id);
  const response = await apiClient(url, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Falha ao excluir linha orçamentária');
  }
  return response.json();
}

// API de movimentações de linha orçamentária
export async function getBudgetLineMovementsAPI(): Promise<any> {
  const url = API_ENDPOINTS.BUDGET_LINE_MOVEMENT.LIST;
  const response = await apiClient(url);
  if (!response.ok) {
    throw new Error('Falha ao buscar movimentações da linha orçamentária');
  }
  return response.json();
}

export async function createBudgetLineMovementAPI(data: CreateBudgetLineMovementData): Promise<BudgetLineMovement> {
  const url = API_ENDPOINTS.BUDGET_LINE_MOVEMENT.CREATE;
  const response = await apiClient(url, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error('Falha ao criar movimentação da linha orçamentária');
  }
  return response.json();
}

export async function updateBudgetLineMovementAPI(id: number, data: Partial<CreateBudgetLineMovementData>): Promise<BudgetLineMovement> {
  const url = API_ENDPOINTS.BUDGET_LINE_MOVEMENT.UPDATE(id);
  const response = await apiClient(url, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error('Falha ao atualizar movimentação da linha orçamentária');
  }
  return response.json();
}

export async function deleteBudgetLineMovementAPI(id: number): Promise<any> {
  const url = API_ENDPOINTS.BUDGET_LINE_MOVEMENT.DELETE(id);
  const response = await apiClient(url, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Falha ao excluir movimentação da linha orçamentária');
  }
  return response.json();
}

// API de dados para dropdown
export async function fetchBudgetsAPI(): Promise<any[]> {
  const url = `${API_ENDPOINTS.BUDGET.LIST}?page_size=1000`;
  const response = await apiClient(url);
  if (!response.ok) {
    throw new Error('Falha ao buscar orçamentos');
  }
  const data = await response.json();
  return data.results || data;
}

export async function fetchManagementCentersAPI(): Promise<any[]> {
  const url = `${API_ENDPOINTS.MANAGEMENT_CENTER.LIST}?page_size=1000`;
  const response = await apiClient(url);
  if (!response.ok) {
    throw new Error('Falha ao buscar centros de gestão');
  }
  const data = await response.json();
  return data.results || data;
}

export async function fetchRequestingCentersAPI(): Promise<any[]> {
  const url = `${API_ENDPOINTS.REQUESTING_CENTER.LIST}?page_size=1000`;
  const response = await apiClient(url);
  if (!response.ok) {
    throw new Error('Falha ao buscar centros solicitantes');
  }
  const data = await response.json();
  return data.results || data;
}

export async function fetchEmployeesForDropdownAPI(): Promise<any[]> {
  const url = `${API_ENDPOINTS.EMPLOYEE.ALL_EMPLOYEES}?page_size=1000`;
  const response = await apiClient(url);
  if (!response.ok) {
    throw new Error('Falha ao buscar funcionários');
  }
  const data = await response.json();
  return data.results || data;
}

// Exportações legadas para compatibilidade (obsoleto - use a camada de serviço em seu lugar)
export async function fetchBudgetLines(
  page: number = 1,
  pageSize: number = 10,
  search: string = "",
  ordering: string = ""
): Promise<BudgetLinesResponse> {
  const params = new URLSearchParams({
    page: page.toString(),
    page_size: pageSize.toString(),
  });
  if (search) params.append('search', search);
  if (ordering) params.append('ordering', ordering);
  return fetchBudgetLinesAPI(params);
}

export async function fetchBudgetLineById(id: number): Promise<BudgetLine> {
  return fetchBudgetLineByIdAPI(id);
}

export async function createBudgetLine(data: CreateBudgetLineData): Promise<BudgetLine> {
  return createBudgetLineAPI(data);
}

export async function updateBudgetLine(data: CreateBudgetLineData): Promise<BudgetLine> {
  return updateBudgetLineAPI(data);
}

export async function deleteBudgetLine(id: number): Promise<any> {
  return deleteBudgetLineAPI(id);
}

export async function getBudgetLineMovements(): Promise<any> {
  return getBudgetLineMovementsAPI();
}

export async function getBudgetLineMovement(id: number): Promise<BudgetLineMovement> {
  const url = API_ENDPOINTS.BUDGET_LINE_MOVEMENT.BY_ID(id);
  const response = await apiClient(url);
  if (!response.ok) {
    throw new Error('Falha ao buscar movimentação da linha orçamentária');
  }
  return response.json();
}

export async function createBudgetLineMovement(data: CreateBudgetLineMovementData): Promise<BudgetLineMovement> {
  return createBudgetLineMovementAPI(data);
}

export async function updateBudgetLineMovement(id: number, data: Partial<CreateBudgetLineMovementData>): Promise<BudgetLineMovement> {
  return updateBudgetLineMovementAPI(id, data);
}

export async function deleteBudgetLineMovement(id: number): Promise<any> {
  return deleteBudgetLineMovementAPI(id);
}

export async function fetchBudgets(): Promise<any[]> {
  return fetchBudgetsAPI();
}

export async function fetchManagementCenters(): Promise<any[]> {
  return fetchManagementCentersAPI();
}

export async function fetchRequestingCenters(): Promise<any[]> {
  return fetchRequestingCentersAPI();
}

export async function fetchEmployees(): Promise<any[]> {
  return fetchEmployeesForDropdownAPI();
}

export async function getBudgetLines(): Promise<BudgetLinesResponse> {
  return fetchBudgetLines();
}

export async function getBudgetLine(id: number): Promise<BudgetLine> {
  return fetchBudgetLineById(id);
}
