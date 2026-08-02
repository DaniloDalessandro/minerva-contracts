import { apiClient } from './client'

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

export interface DirecaoResumo {
  id: number
  name: string
  total_orcamento: number
  disponivel_orcamento: number
  total_contratos: number
  contratos_ativos: number
}

export interface DirecoesList {
  ano: number
  geral: Omit<DirecaoResumo, 'id' | 'name'>
  direcoes: DirecaoResumo[]
}

export interface OrcamentoCategoria {
  category: string
  total: number
  disponivel: number
  utilizado: number
}

export interface TopFiscal {
  main_inspector__id: number
  main_inspector__full_name: string
  main_inspector__position: string
  total_contratos: number
  contratos_ativos: number
  valor_total: number
}

export interface TopContrato {
  id: number
  protocol_number: string
  description: string
  status: string
  original_value: number
  current_value: number
  main_inspector__full_name: string
}

export interface OrcamentoResumo {
  scope_name: string
  ano: number
  por_categoria: OrcamentoCategoria[]
  contratos: {
    total: number
    ativos: number
    encerrados: number
    valor_total: number
    valor_ativos: number
  }
  top_fiscais: TopFiscal[]
  top_contratos: TopContrato[]
}

export interface GraficoCategoriaItem {
  name: string
  value: number
}

export interface GraficoStatusItem {
  name: string
  status: string
  count: number
  value: number
}

export interface GraficoDistribuicaoItem {
  category: string
  total: number
  disponivel: number
  utilizado: number
}

export interface GraficoFiscalItem {
  name: string
  contratos_ativos: number
  total_contratos: number
}

export interface GraficoContratoItem {
  name: string
  protocol_number: string
  description: string
  value: number
  status: string
}

export interface OrcamentoGraficos {
  por_categoria: GraficoCategoriaItem[]
  por_status_contrato: GraficoStatusItem[]
  distribuicao_financeira: GraficoDistribuicaoItem[]
  top_contratos: GraficoContratoItem[]
  ranking_fiscais: GraficoFiscalItem[]
}

export async function getDirecoes(ano?: number): Promise<DirecoesList> {
  const params = new URLSearchParams()
  if (ano) params.set('ano', String(ano))
  const res = await apiClient(`${BASE}/api/v1/dashboard/orcamento/direcoes/?${params}`)
  if (!res.ok) throw new Error('Erro ao carregar direções')
  return res.json()
}

export async function getOrcamentoResumo(direcaoId: number, ano: number): Promise<OrcamentoResumo> {
  const params = new URLSearchParams({ direcao_id: String(direcaoId), ano: String(ano) })
  const res = await apiClient(`${BASE}/api/v1/dashboard/orcamento/resumo/?${params}`)
  if (!res.ok) throw new Error('Erro ao carregar resumo')
  return res.json()
}

export async function getOrcamentoGraficos(
  direcaoId: number,
  ano: number,
  managementId: number = 0,
  coordinationId: number = 0,
): Promise<OrcamentoGraficos> {
  const params = new URLSearchParams({
    direcao_id: String(direcaoId),
    management_id: String(managementId),
    coordination_id: String(coordinationId),
    ano: String(ano),
  })
  const res = await apiClient(`${BASE}/api/v1/dashboard/orcamento/graficos/?${params}`)
  if (!res.ok) throw new Error('Erro ao carregar gráficos')
  return res.json()
}
