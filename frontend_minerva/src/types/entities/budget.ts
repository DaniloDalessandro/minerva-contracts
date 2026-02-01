import type { UserReference, OptimisticUpdate } from '../common';

// Nested types
export interface ManagementCenterReference {
  id: number;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
  created_by?: UserReference;
  updated_by?: UserReference;
}

// Main entity
export interface Budget extends OptimisticUpdate {
  id: number;
  year: number;
  category: 'CAPEX' | 'OPEX';
  management_center?: ManagementCenterReference;
  management_center_id?: number;
  total_amount: string;
  available_amount: string;
  used_amount?: string;
  calculated_available_amount?: string;
  valor_remanejado_entrada?: string;
  valor_remanejado_saida?: string;
  status: 'ATIVO' | 'INATIVO';
  created_at: string;
  updated_at: string;
  created_by?: UserReference;
  updated_by?: UserReference;
  budget_lines?: BudgetLineListItem[];
  budget_lines_summary?: BudgetLinesSummary;
}

// Budget Movement
export interface BudgetMovement {
  id: number;
  source: Budget;
  source_id?: number;
  destination: Budget;
  destination_id?: number;
  amount: string;
  movement_date: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  created_by?: UserReference;
  updated_by?: UserReference;
}

// Create/Update payloads
export interface CreateBudgetData {
  year: number;
  category: 'CAPEX' | 'OPEX';
  management_center_id: number;
  total_amount: string;
  status: 'ATIVO' | 'INATIVO';
}

export interface CreateBudgetMovementData {
  source: number;
  destination: number;
  amount: string;
  notes?: string;
}

// Budget Line items (for display in budget summary)
export interface BudgetLineListItem {
  id: number;
  summary_description: string;
  budgeted_amount: number;
  management_center_name: string;
  main_fiscal_name: string;
  current_version: number;
  total_versions: number;
  expense_type: string;
  contract_status: string;
  process_status: string;
}

// Budget Lines Summary
export interface BudgetLinesSummary {
  total_lines: number;
  total_budgeted_amount: number;
  utilization_percentage: number;
  process_status_distribution: { [key: string]: number };
  contract_status_distribution: { [key: string]: number };
  expense_type_distribution: { [key: string]: number };
}
