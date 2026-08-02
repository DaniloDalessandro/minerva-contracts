import type { UserReference, OptimisticUpdate } from '../common';


export interface EmployeeReference {
  id: number;
  full_name: string;
  employee_id?: string;
}

export interface AuxilioBudgetLineRef {
  id: number;
  name: string;
}


export interface Auxilio extends OptimisticUpdate {
  id: number;
  employee: EmployeeReference;
  budget_line: AuxilioBudgetLineRef;
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


export interface AuxiliosResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Auxilio[];
}
