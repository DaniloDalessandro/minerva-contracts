import type { UserReference, OptimisticUpdate } from '../common';

// Nested types
export interface EmployeeReference {
  id: number;
  full_name: string;
  employee_id?: string;
}

export interface BudgetLineReference {
  id: number;
  name: string;
}

// Main entity
export interface Auxilio extends OptimisticUpdate {
  id: number;
  employee: EmployeeReference;
  budget_line: BudgetLineReference;
  type: 'GRADUACAO' | 'POS_GRADUACAO' | 'AUXILIO_CRECHE_ESCOLA' | 'LINGUA_ESTRANGEIRA';
  total_amount: string;
  installment_count: number;
  amount_per_installment: string;
  start_date: string;
  end_date: string;
  status: 'AGUARDANDO' | 'ATIVO' | 'CONCLUIDO' | 'CANCELADO';
  notes?: string;
  created_at: string;
  updated_at: string;
  created_by: UserReference | null;
  updated_by: UserReference | null;
}

// Create/Update payload
export interface CreateAuxilioData {
  id?: number;
  employee: number;
  budget_line: number;
  type: 'GRADUACAO' | 'POS_GRADUACAO' | 'AUXILIO_CRECHE_ESCOLA' | 'LINGUA_ESTRANGEIRA';
  total_amount: string;
  installment_count: number;
  amount_per_installment: string;
  start_date: string;
  end_date: string;
  status: 'AGUARDANDO' | 'ATIVO' | 'CONCLUIDO' | 'CANCELADO';
  notes?: string;
}

// Paginated response
export interface AuxiliosResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Auxilio[];
}
