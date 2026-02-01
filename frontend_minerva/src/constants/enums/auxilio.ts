/**
 * Aid/Benefit (Auxílio) Related Enums
 * Enumerations for employee aids and benefits
 */

/**
 * Aid/Benefit Type
 */
export enum AuxilioType {
  GRADUACAO = 'GRADUACAO',
  POS_GRADUACAO = 'POS_GRADUACAO',
  AUXILIO_CRECHE_ESCOLA = 'AUXILIO_CRECHE_ESCOLA',
  LINGUA_ESTRANGEIRA = 'LINGUA_ESTRANGEIRA',
  CAPACITACAO_TECNICA = 'CAPACITACAO_TECNICA',
  AUXILIO_ALIMENTACAO = 'AUXILIO_ALIMENTACAO',
  AUXILIO_TRANSPORTE = 'AUXILIO_TRANSPORTE',
  PLANO_SAUDE = 'PLANO_SAUDE',
  OUTROS = 'OUTROS',
}

/**
 * Payment Frequency
 */
export enum PaymentFrequency {
  MENSAL = 'MENSAL',
  TRIMESTRAL = 'TRIMESTRAL',
  SEMESTRAL = 'SEMESTRAL',
  ANUAL = 'ANUAL',
  PAGAMENTO_UNICO = 'PAGAMENTO_UNICO',
}

/**
 * Human-readable labels for Aid Types
 */
export const AuxilioTypeLabels: Record<AuxilioType, string> = {
  [AuxilioType.GRADUACAO]: 'Graduação',
  [AuxilioType.POS_GRADUACAO]: 'Pós-Graduação',
  [AuxilioType.AUXILIO_CRECHE_ESCOLA]: 'Auxílio Creche/Escola',
  [AuxilioType.LINGUA_ESTRANGEIRA]: 'Língua Estrangeira',
  [AuxilioType.CAPACITACAO_TECNICA]: 'Capacitação Técnica',
  [AuxilioType.AUXILIO_ALIMENTACAO]: 'Auxílio Alimentação',
  [AuxilioType.AUXILIO_TRANSPORTE]: 'Auxílio Transporte',
  [AuxilioType.PLANO_SAUDE]: 'Plano de Saúde',
  [AuxilioType.OUTROS]: 'Outros',
};

/**
 * Human-readable labels for Payment Frequency
 */
export const PaymentFrequencyLabels: Record<PaymentFrequency, string> = {
  [PaymentFrequency.MENSAL]: 'Mensal',
  [PaymentFrequency.TRIMESTRAL]: 'Trimestral',
  [PaymentFrequency.SEMESTRAL]: 'Semestral',
  [PaymentFrequency.ANUAL]: 'Anual',
  [PaymentFrequency.PAGAMENTO_UNICO]: 'Pagamento Único',
};
