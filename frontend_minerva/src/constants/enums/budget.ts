/**
 * Budget Related Enums
 * Enumerations for budget, budget lines, and related entities
 */

/**
 * Budget Category
 */
export enum BudgetCategory {
  CAPEX = 'CAPEX',
  OPEX = 'OPEX',
}

/**
 * Expense Type
 */
export enum ExpenseType {
  BASE_PRINCIPAL = 'Base Principal',
  SERVICOS_ESPECIALIZADOS = 'Serviços Especializados',
  DESPESAS_COMPARTILHADAS = 'Despesas Compartilhadas',
}

/**
 * Budget Classification
 */
export enum BudgetClassification {
  NOVO = 'NOVO',
  RENOVACAO = 'RENOVAÇÃO',
  CARY_OVER = 'CARY OVER',
  REPLANEJAMENTO = 'REPLANEJAMENTO',
  NA = 'N/A',
}

/**
 * Contract Type
 */
export enum ContractType {
  SERVICO = 'SERVIÇO',
  FORNECIMENTO = 'FORNECIMENTO',
  ASSINATURA = 'ASSINATURA',
  FORNECIMENTO_SERVICO = 'FORNECIMENTO/SERVIÇO',
}

/**
 * Procurement Type (Tipo de Contratação)
 */
export enum ProcurementType {
  LICITACAO = 'LICITAÇÃO',
  DISPENSA_EM_RAZAO_DO_VALOR = 'DISPENSA EM RAZÃO DO VALOR',
  CONVENIO = 'CONVÊNIO',
  FUNDO_FIXO = 'FUNDO FIXO',
  INEXIGIBILIDADE = 'INEXIGIBILIDADE',
  ATA_DE_REGISTRO_DE_PRECO = 'ATA DE REGISTRO DE PREÇO',
  ACORDO_DE_COOPERACAO = 'ACORDO DE COOPERAÇÃO',
  APOSTILAMENTO = 'APOSTILAMENTO',
}

/**
 * Process Status
 */
export enum ProcessStatus {
  VENCIDO = 'VENCIDO',
  DENTRO_DO_PRAZO = 'DENTRO DO PRAZO',
  ELABORADO_COM_ATRASO = 'ELABORADO COM ATRASO',
  ELABORADO_NO_PRAZO = 'ELABORADO NO PRAZO',
}

/**
 * Contract Status for Budget Lines
 */
export enum ContractStatusBudgetLine {
  DENTRO_DO_PRAZO = 'DENTRO DO PRAZO',
  CONTRATADO_NO_PRAZO = 'CONTRATADO NO PRAZO',
  CONTRATADO_COM_ATRASO = 'CONTRATADO COM ATRASO',
  PRAZO_VENCIDO = 'PRAZO VENCIDO',
  LINHA_TOTALMENTE_REMANEJADA = 'LINHA TOTALMENTE REMANEJADA',
  LINHA_TOTALMENTE_EXECUTADA = 'LINHA TOTALMENTE EXECUTADA',
  LINHA_DE_PAGAMENTO = 'LINHA DE PAGAMENTO',
  LINHA_PARCIALMENTE_REMANEJADA = 'LINHA PARCIALMENTE REMANEJADA',
  LINHA_PARCIALMENTE_EXECUTADA = 'LINHA PARCIALMENTE EXECUTADA',
  NA = 'N/A',
}
