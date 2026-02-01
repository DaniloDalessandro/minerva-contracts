import type { UserReference, OptimisticUpdate } from '../common';

// Nested types
export interface BudgetLineReference {
  id: number;
  name: string;
}

export interface InspectorReference {
  id: number;
  full_name: string;
  employee_id?: string;
}

// Main entity
export interface Contract extends OptimisticUpdate {
  id: number;
  protocol_number: string;
  budget_line: BudgetLineReference;
  main_inspector: InspectorReference;
  substitute_inspector: InspectorReference;
  payment_nature: 'PAGAMENTO ÚNICO' | 'PAGAMENTO ANUAL' | 'PAGAMENTO SEMANAL' | 'PAGAMENTO MENSAL' | 'PAGAMENTO QUINZENAL' | 'PAGAMENTO TRIMESTRAL' | 'PAGAMENTO SEMESTRAL' | 'PAGAMENTO SOB DEMANDA';
  description: string;
  original_value: string;
  current_value: string;
  start_date: string;
  end_date?: string;
  signing_date?: string;
  expiration_date?: string;
  status: 'ATIVO' | 'ENCERRADO';
  created_at: string;
  updated_at: string;
  created_by: UserReference | null;
  updated_by: UserReference | null;
}

// Create/Update payload
export interface CreateContractData {
  id?: number;
  budget_line: number;
  main_inspector: number;
  substitute_inspector: number;
  payment_nature: 'PAGAMENTO ÚNICO' | 'PAGAMENTO ANUAL' | 'PAGAMENTO SEMANAL' | 'PAGAMENTO MENSAL' | 'PAGAMENTO QUINZENAL' | 'PAGAMENTO TRIMESTRAL' | 'PAGAMENTO SEMESTRAL' | 'PAGAMENTO SOB DEMANDA';
  description: string;
  original_value: string;
  current_value: string;
  start_date: string;
  end_date?: string;
  signing_date?: string;
  expiration_date?: string;
  status: 'ATIVO' | 'ENCERRADO';
}

// Paginated response
export interface ContractsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Contract[];
}

// Related entity: installments
export interface ContractInstallment {
  id: number;
  contract: number;
  number: number;
  value: string;
  due_date: string;
  payment_date?: string;
  status: 'PENDENTE' | 'PAGO' | 'ATRASADO';
  notes?: string;
  created_at: string;
  updated_at: string;
  created_by: UserReference | null;
  updated_by: UserReference | null;
}

// Related entity: amendments
export interface ContractAmendment {
  id: number;
  contract: number;
  description: string;
  type: 'Acréscimo de Valor' | 'Redução de Valor' | 'Prorrogação de Prazo';
  value: string;
  additional_term?: string;
  created_at: string;
  updated_at: string;
  created_by: UserReference | null;
  updated_by: UserReference | null;
}
