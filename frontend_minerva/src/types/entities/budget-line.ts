import type { UserReference, OptimisticUpdate } from '../common';

// Nested types
export interface BudgetReference {
  id: number;
  name: string;
}

export interface ManagementCenterReference {
  id: number;
  name: string;
}

export interface RequestingCenterReference {
  id: number;
  name: string;
}

export interface FiscalReference {
  id: number;
  full_name: string;
  employee_id?: string;
}

// Main entity
export interface BudgetLine extends OptimisticUpdate {
  id: number;
  budget: BudgetReference;
  category: 'CAPEX' | 'OPEX';
  expense_type: 'Base Principal' | 'Serviços Especializados' | 'Despesas Compartilhadas';
  management_center: ManagementCenterReference;
  requesting_center: RequestingCenterReference;
  summary_description: string;
  object: string;
  budget_classification: 'NOVO' | 'RENOVAÇÃO' | 'CARY OVER' | 'REPLANEJAMENTO' | 'N/A';
  main_fiscal: FiscalReference | null;
  secondary_fiscal: FiscalReference | null;
  contract_type: 'SERVIÇO' | 'FORNECIMENTO' | 'ASSINATURA' | 'FORNECIMENTO/SERVIÇO';
  probable_procurement_type: 'LICITAÇÃO' | 'DISPENSA EM RAZÃO DO VALOR' | 'CONVÊNIO' | 'FUNDO FIXO' | 'INEXIGIBILIDADE' | 'ATA DE REGISTRO DE PREÇO' | 'ACORDO DE COOPERAÇÃO' | 'APOSTILAMENTO';
  budgeted_amount: string;
  process_status: 'VENCIDO' | 'DENTRO DO PRAZO' | 'ELABORADO COM ATRASO' | 'ELABORADO NO PRAZO' | null;
  contract_status: 'DENTRO DO PRAZO' | 'CONTRATADO NO PRAZO' | 'CONTRATADO COM ATRASO' | 'PRAZO VENCIDO' | 'LINHA TOTALMENTE REMANEJADA' | 'LINHA TOTALMENTE EXECUTADA' | 'LINHA DE PAGAMENTO' | 'LINHA PARCIALMENTE REMANEJADA' | 'LINHA PARCIALMENTE EXECUTADA' | 'N/A' | null;
  status: 'ATIVO' | 'INATIVO' | 'FINALIZADO';
  contract_notes?: string;
  created_at: string;
  updated_at: string;
  created_by: UserReference | null;
  updated_by: UserReference | null;
}

// Budget Line Movement
export interface BudgetLineMovement {
  id: number;
  source_line?: number;
  destination_line?: number;
  movement_amount: number;
  movement_notes?: string;
  created_at: string;
  updated_at: string;
  created_by?: number;
  updated_by?: number;
}

// Create/Update payloads
export interface CreateBudgetLineData {
  id?: number;
  budget: number;
  category: 'CAPEX' | 'OPEX';
  expense_type: 'Base Principal' | 'Serviços Especializados' | 'Despesas Compartilhadas';
  management_center: number;
  requesting_center: number;
  summary_description: string;
  object: string;
  budget_classification: 'NOVO' | 'RENOVAÇÃO' | 'CARY OVER' | 'REPLANEJAMENTO' | 'N/A';
  main_fiscal?: number | null;
  secondary_fiscal?: number | null;
  contract_type: 'SERVIÇO' | 'FORNECIMENTO' | 'ASSINATURA' | 'FORNECIMENTO/SERVIÇO';
  probable_procurement_type: 'LICITAÇÃO' | 'DISPENSA EM RAZÃO DO VALOR' | 'CONVÊNIO' | 'FUNDO FIXO' | 'INEXIGIBILIDADE' | 'ATA DE REGISTRO DE PREÇO' | 'ACORDO DE COOPERAÇÃO' | 'APOSTILAMENTO';
  budgeted_amount: string;
  process_status?: 'VENCIDO' | 'DENTRO DO PRAZO' | 'ELABORADO COM ATRASO' | 'ELABORADO NO PRAZO' | null;
  contract_status?: 'DENTRO DO PRAZO' | 'CONTRATADO NO PRAZO' | 'CONTRATADO COM ATRASO' | 'PRAZO VENCIDO' | 'LINHA TOTALMENTE REMANEJADA' | 'LINHA TOTALMENTE EXECUTADA' | 'LINHA DE PAGAMENTO' | 'LINHA PARCIALMENTE REMANEJADA' | 'LINHA PARCIALMENTE EXECUTADA' | 'N/A' | null;
  status?: 'ATIVO' | 'INATIVO' | 'FINALIZADO';
  contract_notes?: string;
}

export interface CreateBudgetLineMovementData {
  source_line?: number;
  destination_line?: number;
  movement_amount: number;
  movement_notes?: string;
}

// Paginated response
export interface BudgetLinesResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: BudgetLine[];
}
