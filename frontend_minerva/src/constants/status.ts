export const STATUS_FILTER_ALL = "ALL";

export const STATUS_VALUES = {
  ATIVO: "ATIVO",
  INATIVO: "INATIVO",
  ALL: STATUS_FILTER_ALL,
} as const;

export const STATUS_FILTER_OPTIONS = [
  { value: STATUS_VALUES.ALL, label: "Todos" },
  { value: STATUS_VALUES.ATIVO, label: "Ativo" },
  { value: STATUS_VALUES.INATIVO, label: "Inativo" },
];

export const IS_ACTIVE_VALUES = {
  ACTIVE: "active",
  INACTIVE: "inactive",
  ALL: STATUS_FILTER_ALL,
} as const;

export const IS_ACTIVE_FILTER_OPTIONS = [
  { value: IS_ACTIVE_VALUES.ALL, label: "Todos" },
  { value: IS_ACTIVE_VALUES.ACTIVE, label: "Ativo" },
  { value: IS_ACTIVE_VALUES.INACTIVE, label: "Inativo" },
];

export const CONTRACT_STATUS_VALUES = {
  ATIVO: "ATIVO",
  ENCERRADO: "ENCERRADO",
  ALL: STATUS_FILTER_ALL,
} as const;

export const CONTRACT_STATUS_FILTER_OPTIONS = [
  { value: CONTRACT_STATUS_VALUES.ALL, label: "Todos" },
  { value: CONTRACT_STATUS_VALUES.ATIVO, label: "Ativo" },
  { value: CONTRACT_STATUS_VALUES.ENCERRADO, label: "Encerrado" },
];

export const AUXILIO_STATUS_VALUES = {
  AGUARDANDO: "AGUARDANDO",
  ATIVO: "ATIVO",
  CONCLUIDO: "CONCLUIDO",
  CANCELADO: "CANCELADO",
  ALL: STATUS_FILTER_ALL,
} as const;

export const AUXILIO_STATUS_FILTER_OPTIONS = [
  { value: AUXILIO_STATUS_VALUES.ALL, label: "Todos" },
  { value: AUXILIO_STATUS_VALUES.AGUARDANDO, label: "Aguardando" },
  { value: AUXILIO_STATUS_VALUES.ATIVO, label: "Ativo" },
  { value: AUXILIO_STATUS_VALUES.CONCLUIDO, label: "Concluído" },
  { value: AUXILIO_STATUS_VALUES.CANCELADO, label: "Cancelado" },
];

export const BUDGET_LINE_STATUS_VALUES = {
  ATIVO: "ATIVO",
  INATIVO: "INATIVO",
  FINALIZADO: "FINALIZADO",
  ALL: STATUS_FILTER_ALL,
} as const;

export const BUDGET_LINE_STATUS_FILTER_OPTIONS = [
  { value: BUDGET_LINE_STATUS_VALUES.ALL, label: "Todos" },
  { value: BUDGET_LINE_STATUS_VALUES.ATIVO, label: "Ativo" },
  { value: BUDGET_LINE_STATUS_VALUES.INATIVO, label: "Inativo" },
  { value: BUDGET_LINE_STATUS_VALUES.FINALIZADO, label: "Finalizado" },
];

export function getStatusLabel(status: string): string {
  switch (status) {
    case STATUS_VALUES.ATIVO:
    case IS_ACTIVE_VALUES.ACTIVE:
      return "Ativo";
    case STATUS_VALUES.INATIVO:
    case IS_ACTIVE_VALUES.INACTIVE:
      return "Inativo";
    case STATUS_VALUES.ALL:
    case IS_ACTIVE_VALUES.ALL:
      return "Todos";
    default:
      return status;
  }
}

export function getContractStatusLabel(status: string): string {
  switch (status) {
    case CONTRACT_STATUS_VALUES.ATIVO:
      return "Ativo";
    case CONTRACT_STATUS_VALUES.ENCERRADO:
      return "Encerrado";
    default:
      return status;
  }
}

export function getPaymentNatureLabel(nature: string): string {
  switch (nature) {
    case "PAGAMENTO ÚNICO":
      return "Único";
    case "PAGAMENTO ANUAL":
      return "Anual";
    case "PAGAMENTO SEMANAL":
      return "Semanal";
    case "PAGAMENTO MENSAL":
      return "Mensal";
    case "PAGAMENTO QUINZENAL":
      return "Quinzenal";
    case "PAGAMENTO TRIMESTRAL":
      return "Trimestral";
    case "PAGAMENTO SEMESTRAL":
      return "Semestral";
    case "PAGAMENTO SOB DEMANDA":
      return "Sob Demanda";
    default:
      return nature;
  }
}

export function getAuxilioStatusLabel(status: string): string {
  switch (status) {
    case AUXILIO_STATUS_VALUES.AGUARDANDO:
      return "Aguardando";
    case AUXILIO_STATUS_VALUES.ATIVO:
      return "Ativo";
    case AUXILIO_STATUS_VALUES.CONCLUIDO:
      return "Concluído";
    case AUXILIO_STATUS_VALUES.CANCELADO:
      return "Cancelado";
    default:
      return status;
  }
}

export function getAuxilioTypeLabel(type: string): string {
  switch (type) {
    case "GRADUACAO":
      return "Graduação";
    case "POS_GRADUACAO":
      return "Pós-Graduação";
    case "AUXILIO_CRECHE_ESCOLA":
      return "Creche/Escola";
    case "LINGUA_ESTRANGEIRA":
      return "Língua Estrangeira";
    default:
      return type;
  }
}

export function getBudgetLineStatusLabel(status: string): string {
  switch (status) {
    case BUDGET_LINE_STATUS_VALUES.ATIVO:
      return "Ativo";
    case BUDGET_LINE_STATUS_VALUES.INATIVO:
      return "Inativo";
    case BUDGET_LINE_STATUS_VALUES.FINALIZADO:
      return "Finalizado";
    default:
      return status;
  }
}

export function getContractTypeLabel(type: string): string {
  switch (type) {
    case "SERVIÇO":
      return "Serviço";
    case "FORNECIMENTO":
      return "Fornecimento";
    case "ASSINATURA":
      return "Assinatura";
    case "FORNECIMENTO/SERVIÇO":
      return "Forn./Serv.";
    default:
      return type;
  }
}

export function getProcurementTypeLabel(type: string): string {
  switch (type) {
    case "LICITAÇÃO":
      return "Licitação";
    case "DISPENSA EM RAZÃO DO VALOR":
      return "Dispensa";
    case "CONVÊNIO":
      return "Convênio";
    case "FUNDO FIXO":
      return "Fundo Fixo";
    case "INEXIGIBILIDADE":
      return "Inexigibilidade";
    case "ATA DE REGISTRO DE PREÇO":
      return "ARP";
    case "ACORDO DE COOPERAÇÃO":
      return "Acordo Coop.";
    case "APOSTILAMENTO":
      return "Apostilamento";
    default:
      return type;
  }
}

export type StatusValue = (typeof STATUS_VALUES)[keyof typeof STATUS_VALUES];
export type IsActiveValue = (typeof IS_ACTIVE_VALUES)[keyof typeof IS_ACTIVE_VALUES];
export type ContractStatusValue = (typeof CONTRACT_STATUS_VALUES)[keyof typeof CONTRACT_STATUS_VALUES];
export type AuxilioStatusValue = (typeof AUXILIO_STATUS_VALUES)[keyof typeof AUXILIO_STATUS_VALUES];
export type BudgetLineStatusValue = (typeof BUDGET_LINE_STATUS_VALUES)[keyof typeof BUDGET_LINE_STATUS_VALUES];
