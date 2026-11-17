import {
  fetchBudgetLinesAPI,
  fetchBudgetLineByIdAPI,
  createBudgetLineAPI,
  updateBudgetLineAPI,
  deleteBudgetLineAPI,
  getBudgetLineMovementsAPI,
  createBudgetLineMovementAPI,
  updateBudgetLineMovementAPI,
  deleteBudgetLineMovementAPI,
  fetchBudgetsAPI as fetchBudgetsForDropdownAPI,
  fetchManagementCentersAPI,
  fetchRequestingCentersAPI,
  fetchEmployeesForDropdownAPI,
} from '@/lib/api/budgetlines';
import type {
  BudgetLine,
  BudgetLinesResponse,
  CreateBudgetLineData,
  BudgetLineMovement,
  CreateBudgetLineMovementData,
} from '@/types/entities/budget-line';
import { PAGINATION_DEFAULTS } from '@/constants/ui';

export class BudgetLineService {
  static async fetchBudgetLines(
    page: number = PAGINATION_DEFAULTS.PAGE,
    pageSize: number = PAGINATION_DEFAULTS.PAGE_SIZE,
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

  static async fetchBudgetLineById(id: number): Promise<BudgetLine> {
    return fetchBudgetLineByIdAPI(id);
  }

  static async createBudgetLine(data: CreateBudgetLineData): Promise<BudgetLine> {
    return createBudgetLineAPI(data);
  }

  static async updateBudgetLine(data: CreateBudgetLineData): Promise<BudgetLine> {
    return updateBudgetLineAPI(data);
  }

  static async deleteBudgetLine(id: number): Promise<void> {
    await deleteBudgetLineAPI(id);

  }

  static async getBudgetLineMovements(): Promise<BudgetLineMovement[]> {

    const data = await getBudgetLineMovementsAPI();

    return data.results || data;
  }

  static async createBudgetLineMovement(data: CreateBudgetLineMovementData): Promise<BudgetLineMovement> {
    return createBudgetLineMovementAPI(data);
  }

  static async updateBudgetLineMovement(id: number, data: Partial<CreateBudgetLineMovementData>): Promise<BudgetLineMovement> {
    return updateBudgetLineMovementAPI(id, data);
  }

  static async deleteBudgetLineMovement(id: number): Promise<void> {
    await deleteBudgetLineMovementAPI(id);

  }

  static async fetchBudgets(): Promise<any[]> {
    return fetchBudgetsForDropdownAPI();
  }

  static async fetchManagementCenters(): Promise<any[]> {
    return fetchManagementCentersAPI();
  }

  static async fetchRequestingCenters(): Promise<any[]> {
    return fetchRequestingCentersAPI();
  }

  static async fetchEmployees(): Promise<any[]> {
    return fetchEmployeesForDropdownAPI();
  }

  static async getBudgetLines(): Promise<BudgetLinesResponse> {
    return this.fetchBudgetLines();
  }

  static async getBudgetLine(id: number): Promise<BudgetLine> {
    return this.fetchBudgetLineById(id);
  }
}
