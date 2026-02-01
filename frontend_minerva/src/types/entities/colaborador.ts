import type { UserReference, OptimisticUpdate } from '../common';

// Nested types
export interface Direction {
  id: number;
  name: string;
}

export interface Management {
  id: number;
  name: string;
  direction: number;
}

export interface Coordination {
  id: number;
  name: string;
  management: number;
}

export interface BudgetLineReference {
  id: number;
  name: string;
}

// Main entity
export interface Colaborador extends OptimisticUpdate {
  id: number;
  full_name: string;
  email: string;
  cpf: string;
  phone?: string;
  birth_date?: string;
  employee_id?: string;
  position?: string;
  department?: string;
  admission_date?: string;
  street?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  direction?: Direction;
  management?: Management;
  coordination?: Coordination;
  bank_name?: string;
  bank_agency?: string;
  bank_account?: string;
  status: 'ATIVO' | 'INATIVO';
  created_at: string;
  updated_at: string;
  created_by: UserReference | null;
  updated_by: UserReference | null;
}

// Create/Update payload
export interface CreateColaboradorData {
  id?: number;
  full_name: string;
  email: string;
  cpf: string;
  phone?: string;
  birth_date?: string;
  employee_id?: string;
  position?: string;
  department?: string;
  admission_date?: string;
  street?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  direction?: number;
  management?: number;
  coordination?: number;
  bank_name?: string;
  bank_agency?: string;
  bank_account?: string;
  status: 'ATIVO' | 'INATIVO';
}

// Paginated response (uses common type)
export interface ColaboradoresResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Colaborador[];
}

// Related entity: contracts
export interface ColaboradorContrato {
  id: number;
  contract_protocol: string;
  role: 'FISCAL_PRINCIPAL' | 'FISCAL_SUBSTITUTO';
  start_date?: string;
  end_date?: string;
  notes?: string;
  status: 'ATIVO' | 'INATIVO';
  created_at: string;
  updated_at: string;
}

// Related entity: aids/benefits
export interface ColaboradorAuxilio {
  id: number;
  type: 'GRADUACAO' | 'POS_GRADUACAO' | 'AUXILIO_CRECHE_ESCOLA' | 'LINGUA_ESTRANGEIRA' | 'CAPACITACAO_TECNICA' | 'AUXILIO_ALIMENTACAO' | 'AUXILIO_TRANSPORTE' | 'PLANO_SAUDE' | 'OUTROS';
  description?: string;
  total_amount: string;
  monthly_amount?: string;
  start_date: string;
  end_date?: string;
  payment_frequency: 'MENSAL' | 'TRIMESTRAL' | 'SEMESTRAL' | 'ANUAL' | 'PAGAMENTO_UNICO';
  installment_count?: number;
  institution_name?: string;
  course_name?: string;
  status: 'AGUARDANDO' | 'ATIVO' | 'CONCLUIDO' | 'CANCELADO' | 'SUSPENSO';
  notes?: string;
  budget_line?: BudgetLineReference;
  created_at: string;
  updated_at: string;
}
