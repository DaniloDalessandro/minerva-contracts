/**
 * Status Enums
 * Common status enumerations used across the application
 */

/**
 * Employee (Colaborador) Status
 */
export enum ColaboradorStatus {
  ATIVO = 'ATIVO',
  INATIVO = 'INATIVO',
}

/**
 * Contract Status
 */
export enum ContractStatus {
  ATIVO = 'ATIVO',
  ENCERRADO = 'ENCERRADO',
}

/**
 * Aid (Auxílio) Status
 */
export enum AuxilioStatus {
  AGUARDANDO = 'AGUARDANDO',
  ATIVO = 'ATIVO',
  CONCLUIDO = 'CONCLUIDO',
  CANCELADO = 'CANCELADO',
  SUSPENSO = 'SUSPENSO',
}

/**
 * Contract Installment Status
 */
export enum ContractInstallmentStatus {
  PENDENTE = 'PENDENTE',
  PAGO = 'PAGO',
  ATRASADO = 'ATRASADO',
}

/**
 * Budget Status
 */
export enum BudgetStatus {
  ATIVO = 'ATIVO',
  INATIVO = 'INATIVO',
}

/**
 * General Active Status (for centers, sectors, etc.)
 */
export enum ActiveStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ALL = 'all',
}
