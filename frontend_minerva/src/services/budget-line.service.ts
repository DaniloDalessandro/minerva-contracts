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

    console.log("📋 Buscando linhas orçamentárias:", params.toString());

    const data = await fetchBudgetLinesAPI(params);
    console.log("📊 Linhas orçamentárias recebidas:", {
      count: data.count,
      results: data.results?.length || 0,
    });

    return data;
  }

  static async fetchBudgetLineById(id: number): Promise<BudgetLine> {
    console.log("📋 Buscando linha orçamentária por ID:", id);
    const data = await fetchBudgetLineByIdAPI(id);
    console.log("✅ Linha orçamentária encontrada:", data.summary_description);
    return data;
  }

  static async createBudgetLine(data: CreateBudgetLineData): Promise<BudgetLine> {
    console.log("➕ Criando nova linha orçamentária");
    const result = await createBudgetLineAPI(data);
    console.log("✅ Linha orçamentária criada com sucesso:", result.id);
    return result;
  }

  static async updateBudgetLine(data: CreateBudgetLineData): Promise<BudgetLine> {
    console.log("✏️ Atualizando linha orçamentária:", data.id);
    const result = await updateBudgetLineAPI(data);
    console.log("✅ Linha orçamentária atualizada com sucesso");
    return result;
  }

  static async deleteBudgetLine(id: number): Promise<void> {
    console.log("🗑️ Deletando linha orçamentária:", id);
    await deleteBudgetLineAPI(id);
    console.log("✅ Linha orçamentária deletada com sucesso");
  }

  static async getBudgetLineMovements(): Promise<BudgetLineMovement[]> {
    console.log("🔄 Buscando movimentações de linha orçamentária");
    const data = await getBudgetLineMovementsAPI();
    console.log("📊 Movimentações encontradas:", data.results?.length || data.length || 0);
    return data.results || data;
  }

  static async createBudgetLineMovement(data: CreateBudgetLineMovementData): Promise<BudgetLineMovement> {
    console.log("➕ Criando movimentação de linha orçamentária");
    const result = await createBudgetLineMovementAPI(data);
    console.log("✅ Movimentação criada com sucesso");
    return result;
  }

  static async updateBudgetLineMovement(id: number, data: Partial<CreateBudgetLineMovementData>): Promise<BudgetLineMovement> {
    console.log("✏️ Atualizando movimentação de linha orçamentária:", id);
    const result = await updateBudgetLineMovementAPI(id, data);
    console.log("✅ Movimentação atualizada com sucesso");
    return result;
  }

  static async deleteBudgetLineMovement(id: number): Promise<void> {
    console.log("🗑️ Deletando movimentação de linha orçamentária:", id);
    await deleteBudgetLineMovementAPI(id);
    console.log("✅ Movimentação deletada com sucesso");
  }

  static async fetchBudgets(): Promise<any[]> {
    console.log("💰 Buscando orçamentos para dropdown");
    const data = await fetchBudgetsForDropdownAPI();
    console.log("📊 Orçamentos encontrados:", data.length);
    return data;
  }

  static async fetchManagementCenters(): Promise<any[]> {
    console.log("🏢 Buscando centros de gestão para dropdown");
    const data = await fetchManagementCentersAPI();
    console.log("📊 Centros de gestão encontrados:", data.length);
    return data;
  }

  static async fetchRequestingCenters(): Promise<any[]> {
    console.log("📋 Buscando centros solicitantes para dropdown");
    const data = await fetchRequestingCentersAPI();
    console.log("📊 Centros solicitantes encontrados:", data.length);
    return data;
  }

  static async fetchEmployees(): Promise<any[]> {
    console.log("👥 Buscando funcionários para dropdown");
    const data = await fetchEmployeesForDropdownAPI();
    console.log("📊 Funcionários encontrados:", data.length);
    return data;
  }


  static async getBudgetLines(): Promise<BudgetLinesResponse> {
    return this.fetchBudgetLines();
  }

  static async getBudgetLine(id: number): Promise<BudgetLine> {
    return this.fetchBudgetLineById(id);
  }
}
