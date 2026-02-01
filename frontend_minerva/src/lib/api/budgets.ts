import { apiClient } from './client';
import { API_ENDPOINTS } from '@/constants/api-endpoints';
import type {
  Budget,
  BudgetMovement,
  CreateBudgetData,
  CreateBudgetMovementData,
  BudgetLine,
  Contract,
} from '@/types/entities/budget';

// Funções principais da API de orçamentos
export async function fetchBudgetsAPI(params: URLSearchParams): Promise<any> {
  const url = `${API_ENDPOINTS.BUDGET.LIST}?${params.toString()}`;
  const res = await apiClient(url);
  if (!res.ok) throw new Error("Erro ao buscar orçamentos");
  return res.json();
}

export async function fetchBudgetByIdAPI(id: number): Promise<Budget> {
  const url = API_ENDPOINTS.BUDGET.BY_ID(id);
  const res = await apiClient(url);
  if (!res.ok) throw new Error("Erro ao buscar orçamento");
  return res.json();
}

export async function createBudgetAPI(data: CreateBudgetData): Promise<Budget> {
  const url = API_ENDPOINTS.BUDGET.CREATE;
  const res = await apiClient(url, {
    method: "POST",
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Erro ao criar orçamento");
  return res.json();
}

export async function updateBudgetAPI(id: number, data: CreateBudgetData): Promise<Budget> {
  const url = API_ENDPOINTS.BUDGET.UPDATE(id);
  const res = await apiClient(url, {
    method: "PUT",
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Erro ao atualizar orçamento");
  return res.json();
}

export async function deleteBudgetAPI(id: number): Promise<boolean> {
  const url = API_ENDPOINTS.BUDGET.DELETE(id);
  const res = await apiClient(url, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Erro ao deletar orçamento");
  return true;
}

// API de movimentações orçamentárias
export async function getBudgetMovementsAPI(): Promise<any> {
  const url = API_ENDPOINTS.BUDGET_MOVEMENT.LIST;
  const res = await apiClient(url);
  if (!res.ok) throw new Error("Erro ao buscar movimentações");
  return res.json();
}

export async function createBudgetMovementAPI(data: CreateBudgetMovementData): Promise<BudgetMovement> {
  const url = API_ENDPOINTS.BUDGET_MOVEMENT.CREATE;
  const res = await apiClient(url, {
    method: "POST",
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Erro ao criar movimentação");
  return res.json();
}

export async function updateBudgetMovementAPI(id: number, data: CreateBudgetMovementData): Promise<BudgetMovement> {
  const url = API_ENDPOINTS.BUDGET_MOVEMENT.UPDATE(id);
  const res = await apiClient(url, {
    method: "PUT",
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Erro ao atualizar movimentação");
  return res.json();
}

export async function deleteBudgetMovementAPI(id: number): Promise<boolean> {
  const url = API_ENDPOINTS.BUDGET_MOVEMENT.DELETE(id);
  const res = await apiClient(url, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Erro ao deletar movimentação");
  return true;
}

export async function getBudgetMovementsByBudgetAPI(budgetId: number): Promise<BudgetMovement[]> {
  const res = await apiClient(API_ENDPOINTS.BUDGET_MOVEMENT.LIST);
  if (!res.ok) throw new Error("Erro ao buscar movimentações do orçamento");
  const data = await res.json();
  const movements = data.results || data;

  const filteredMovements = movements.filter((movement: BudgetMovement) => {
    return movement.source?.id === budgetId || movement.destination?.id === budgetId;
  });

  return filteredMovements;
}

// API de linhas orçamentárias
export async function fetchBudgetLinesAPI(budgetId: number): Promise<any> {
  const url = `${API_ENDPOINTS.BUDGET_LINE.ALL}?budget=${budgetId}`;
  const res = await apiClient(url);
  if (!res.ok) throw new Error("Erro ao buscar linhas orçamentárias");
  return res.json();
}

export async function fetchContractsByBudgetLineAPI(budgetLineId: number): Promise<any> {
  const url = `${API_ENDPOINTS.CONTRACT.LIST}?budget_line=${budgetLineId}`;
  const res = await apiClient(url);
  if (!res.ok) throw new Error("Erro ao buscar contratos");
  return res.json();
}

export async function fetchBudgetContractsAPI(budgetId: number): Promise<Contract[]> {
  try {
    const budgetLinesResponse = await fetchBudgetLinesAPI(budgetId);
    const budgetLines: BudgetLine[] = budgetLinesResponse.results || budgetLinesResponse;

    if (!budgetLines.length) {
      return [];
    }

    const contractPromises = budgetLines.map(budgetLine =>
      fetchContractsByBudgetLineAPI(budgetLine.id)
    );

    const contractsResponses = await Promise.all(contractPromises);

    const allContracts: Contract[] = [];
    contractsResponses.forEach(response => {
      const contracts = response.results || response;
      if (Array.isArray(contracts)) {
        allContracts.push(...contracts);
      }
    });

    return allContracts;
  } catch (error) {
    return [];
  }
}

// Exportações legadas para compatibilidade (obsoleto - use a camada de serviço em seu lugar)
export async function fetchBudgets(page = 1, pageSize = 10, search = "", ordering = ""): Promise<any> {
  const params = new URLSearchParams({
    page: page.toString(),
    page_size: pageSize.toString(),
  });
  if (search) params.append("search", search);
  if (ordering) params.append("ordering", ordering);
  return fetchBudgetsAPI(params);
}

export async function fetchBudgetById(id: number): Promise<Budget> {
  return fetchBudgetByIdAPI(id);
}

export async function createBudget(data: CreateBudgetData): Promise<Budget> {
  return createBudgetAPI(data);
}

export async function updateBudget(id: number, data: CreateBudgetData): Promise<Budget> {
  return updateBudgetAPI(id, data);
}

export async function deleteBudget(id: number): Promise<boolean> {
  return deleteBudgetAPI(id);
}

export async function getBudgetMovements(): Promise<any> {
  return getBudgetMovementsAPI();
}

export async function createBudgetMovement(data: CreateBudgetMovementData): Promise<BudgetMovement> {
  return createBudgetMovementAPI(data);
}

export async function updateBudgetMovement(id: number, data: CreateBudgetMovementData): Promise<BudgetMovement> {
  return updateBudgetMovementAPI(id, data);
}

export async function deleteBudgetMovement(id: number): Promise<boolean> {
  return deleteBudgetMovementAPI(id);
}

export async function getBudgetMovementsByBudget(budgetId: number): Promise<BudgetMovement[]> {
  return getBudgetMovementsByBudgetAPI(budgetId);
}

export async function fetchBudgetLines(budgetId: number): Promise<any> {
  return fetchBudgetLinesAPI(budgetId);
}

export async function fetchContractsByBudgetLine(budgetLineId: number): Promise<any> {
  return fetchContractsByBudgetLineAPI(budgetLineId);
}

export async function fetchBudgetContracts(budgetId: number): Promise<Contract[]> {
  return fetchBudgetContractsAPI(budgetId);
}
