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
  Contract,
} from '@/types/entities/budget';
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

    console.log("💰 Buscando orçamentos:", params.toString());

    const data = await fetchBudgetsAPI(params);
    console.log("📊 Dados orçamentos recebidos:", {
      count: data.count,
      results: data.results?.length || 0,
    });

    return data;
  }

  static async fetchBudgetById(id: number): Promise<Budget> {
    console.log("💰 Buscando orçamento por ID:", id);
    const data = await fetchBudgetByIdAPI(id);
    console.log("✅ Orçamento encontrado:", data.year);
    return data;
  }

  static async createBudget(data: CreateBudgetData): Promise<Budget> {
    console.log("➕ Criando novo orçamento:", data.year);
    const result = await createBudgetAPI(data);
    console.log("✅ Orçamento criado com sucesso:", result.id);
    return result;
  }

  static async updateBudget(id: number, data: CreateBudgetData): Promise<Budget> {
    console.log("✏️ Atualizando orçamento:", id);
    const result = await updateBudgetAPI(id, data);
    console.log("✅ Orçamento atualizado com sucesso");
    return result;
  }

  static async deleteBudget(id: number): Promise<boolean> {
    console.log("🗑️ Deletando orçamento:", id);
    const result = await deleteBudgetAPI(id);
    console.log("✅ Orçamento deletado com sucesso");
    return result;
  }

  static async getBudgetMovements(): Promise<BudgetMovement[]> {
    console.log("🔄 Buscando movimentações de orçamento");
    const data = await getBudgetMovementsAPI();
    console.log("📊 Movimentações encontradas:", data.results?.length || data.length || 0);
    return data.results || data;
  }

  static async createBudgetMovement(data: CreateBudgetMovementData): Promise<BudgetMovement> {
    console.log("➕ Criando movimentação de orçamento");
    const result = await createBudgetMovementAPI(data);
    console.log("✅ Movimentação criada com sucesso:", result.id);
    return result;
  }

  static async updateBudgetMovement(id: number, data: CreateBudgetMovementData): Promise<BudgetMovement> {
    console.log("✏️ Atualizando movimentação de orçamento:", id);
    const result = await updateBudgetMovementAPI(id, data);
    console.log("✅ Movimentação atualizada com sucesso");
    return result;
  }

  static async deleteBudgetMovement(id: number): Promise<boolean> {
    console.log("🗑️ Deletando movimentação de orçamento:", id);
    const result = await deleteBudgetMovementAPI(id);
    console.log("✅ Movimentação deletada com sucesso");
    return result;
  }

  static async getBudgetMovementsByBudget(budgetId: number): Promise<BudgetMovement[]> {
    console.log("🔄 Buscando movimentações do orçamento:", budgetId);
    const data = await getBudgetMovementsByBudgetAPI(budgetId);
    console.log("📊 Movimentações encontradas:", data.length);
    return data;
  }

  static async fetchBudgetLines(budgetId: number): Promise<any> {
    console.log("📋 Buscando linhas do orçamento:", budgetId);
    const data = await fetchBudgetLinesAPI(budgetId);
    console.log("📊 Linhas encontradas:", data.results?.length || data.length || 0);
    return data;
  }

  static async fetchBudgetContracts(budgetId: number): Promise<Contract[]> {
    console.log("📄 Buscando contratos do orçamento:", budgetId);
    const data = await fetchBudgetContractsAPI(budgetId);
    console.log("📊 Contratos encontrados:", data.length);
    return data;
  }

  static async fetchContractsByBudgetLine(budgetLineId: number): Promise<any> {
    console.log("📄 Buscando contratos da linha orçamentária:", budgetLineId);
    const data = await fetchContractsByBudgetLineAPI(budgetLineId);
    console.log("📊 Contratos encontrados:", data.results?.length || data.length || 0);
    return data;
  }
}
