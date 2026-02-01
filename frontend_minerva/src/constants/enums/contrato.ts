/**
 * Contract (Contrato) Related Enums
 * Enumerations for contracts and related entities
 */

/**
 * Payment Nature
 */
export enum PaymentNature {
  PAGAMENTO_UNICO = 'PAGAMENTO ÚNICO',
  PAGAMENTO_ANUAL = 'PAGAMENTO ANUAL',
  PAGAMENTO_SEMANAL = 'PAGAMENTO SEMANAL',
  PAGAMENTO_MENSAL = 'PAGAMENTO MENSAL',
  PAGAMENTO_QUINZENAL = 'PAGAMENTO QUINZENAL',
  PAGAMENTO_TRIMESTRAL = 'PAGAMENTO TRIMESTRAL',
  PAGAMENTO_SEMESTRAL = 'PAGAMENTO SEMESTRAL',
  PAGAMENTO_SOB_DEMANDA = 'PAGAMENTO SOB DEMANDA',
}

/**
 * Contract Amendment Type
 */
export enum ContractAmendmentType {
  ACRESCIMO_DE_VALOR = 'Acréscimo de Valor',
  REDUCAO_DE_VALOR = 'Redução de Valor',
  PRORROGACAO_DE_PRAZO = 'Prorrogação de Prazo',
}

/**
 * Contract Role (Fiscal)
 */
export enum ContractRole {
  FISCAL_PRINCIPAL = 'FISCAL_PRINCIPAL',
  FISCAL_SUBSTITUTO = 'FISCAL_SUBSTITUTO',
}

/**
 * Human-readable labels for Payment Nature
 */
export const PaymentNatureLabels: Record<PaymentNature, string> = {
  [PaymentNature.PAGAMENTO_UNICO]: 'Pagamento Único',
  [PaymentNature.PAGAMENTO_ANUAL]: 'Pagamento Anual',
  [PaymentNature.PAGAMENTO_SEMANAL]: 'Pagamento Semanal',
  [PaymentNature.PAGAMENTO_MENSAL]: 'Pagamento Mensal',
  [PaymentNature.PAGAMENTO_QUINZENAL]: 'Pagamento Quinzenal',
  [PaymentNature.PAGAMENTO_TRIMESTRAL]: 'Pagamento Trimestral',
  [PaymentNature.PAGAMENTO_SEMESTRAL]: 'Pagamento Semestral',
  [PaymentNature.PAGAMENTO_SOB_DEMANDA]: 'Pagamento sob Demanda',
};

/**
 * Human-readable labels for Contract Amendment Type
 */
export const ContractAmendmentTypeLabels: Record<ContractAmendmentType, string> = {
  [ContractAmendmentType.ACRESCIMO_DE_VALOR]: 'Acréscimo de Valor',
  [ContractAmendmentType.REDUCAO_DE_VALOR]: 'Redução de Valor',
  [ContractAmendmentType.PRORROGACAO_DE_PRAZO]: 'Prorrogação de Prazo',
};

/**
 * Human-readable labels for Contract Role
 */
export const ContractRoleLabels: Record<ContractRole, string> = {
  [ContractRole.FISCAL_PRINCIPAL]: 'Fiscal Principal',
  [ContractRole.FISCAL_SUBSTITUTO]: 'Fiscal Substituto',
};
