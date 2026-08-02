import type { UserReference, OptimisticUpdate } from '../common';


export interface ColaboradorDirection {
  id: number;
  name: string;
}

export interface ColaboradorManagement {
  id: number;
  name: string;
  direction: number;
}

export interface ColaboradorCoordination {
  id: number;
  name: string;
  management: number;
}

export interface ColaboradorBudgetLineRef {
  id: number;
  name: string;
}


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
  direction?: ColaboradorDirection;
  management?: ColaboradorManagement;
  coordination?: ColaboradorCoordination;
  bank_name?: string;
  bank_agency?: string;
  bank_account?: string;
  status: 'ATIVO' | 'INATIVO';
  created_at: string;
  updated_at: string;
  created_by: UserReference | null;
  updated_by: UserReference | null;
}


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


export interface ColaboradoresResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Colaborador[];
}


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
  budget_line?: ColaboradorBudgetLineRef;
  created_at: string;
  updated_at: string;
}
