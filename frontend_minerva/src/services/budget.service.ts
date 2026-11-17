import {
  fetchBudgetsAPI,
  fetchBudgetByIdAPI,
  createBudgetAPI,
  updateBudgetAPI,
  deleteBudgetAPI,
  getBudgetMovementsAPI,
  createBudgetMovementAPI,
  updateBudgetMovementAPI,
  deleteBudgetMovementAPI,
  getBudgetMovementsByBudgetAPI,
  fetchBudgetLinesAPI,
  fetchContractsByBudgetLineAPI,
  fetchBudgetContractsAPI,
} from '@/lib/api/budgets';
import type {
  Budget,
  BudgetMovement,
  CreateBudgetData,
  CreateBudgetMovementData,
} from '@/types/entities/budget';
import type { Contract } from '@/types/entities/contrato';
import { PAGINATION_DEFAULTS } from '@/constants/ui';

export class BudgetService {
  static async fetchBudgets(
    page: number = PAGINATION_DEFAULTS.PAGE,
    pageSize: number = PAGINATION_DEFAULTS.PAGE_SIZE,
    search: string = "",
    ordering: string = ""
  ): Promise<any> {
    const params = new URLSearchParams({
      page: page.toString(),
      page_size: pageSize.toString(),
    });

    if (search) params.append('search', search);
    if (ordering) params.append('ordering', ordering);

    return fetchBudgetsAPI(params);
  }

  static async fetchBudgetById(id: number): Promise<Budget> {
    return fetchBudgetByIdAPI(id);
  }

  static async createBudget(data: CreateBudgetData): Promise<Budget> {
    return createBudgetAPI(data);
  }

  static async updateBudget(id: number, data: CreateBudgetData): Promise<Budget> {
    return updateBudgetAPI(id, data);
  }

  static async deleteBudget(id: number): Promise<boolean> {
    return deleteBudgetAPI(id);
  }

  static async getBudgetMovements(): Promise<BudgetMovement[]> {

    const data = await getBudgetMovementsAPI();

    return data.results || data;
  }

  static async createBudgetMovement(data: CreateBudgetMovementData): Promise<BudgetMovement> {
    return createBudgetMovementAPI(data);
  }

  static async updateBudgetMovement(id: number, data: CreateBudgetMovementData): Promise<BudgetMovement> {
    return updateBudgetMovementAPI(id, data);
  }

  static async deleteBudgetMovement(id: number): Promise<boolean> {
    return deleteBudgetMovementAPI(id);
  }

  static async getBudgetMovementsByBudget(budgetId: number): Promise<BudgetMovement[]> {
    return getBudgetMovementsByBudgetAPI(budgetId);
  }

  static async fetchBudgetLines(budgetId: number): Promise<any> {
    return fetchBudgetLinesAPI(budgetId);
  }

  static async fetchBudgetContracts(budgetId: number): Promise<Contract[]> {
    return fetchBudgetContractsAPI(budgetId);
  }

  static async fetchContractsByBudgetLine(budgetLineId: number): Promise<any> {
    return fetchContractsByBudgetLineAPI(budgetLineId);
  }
}
