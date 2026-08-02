import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import type { Auxilio } from "@/types/entities/auxilio"
import type { Contract } from "@/types/entities/contrato"
import type { BudgetLine } from "@/types/entities/budget-line"
import type { Budget, BudgetMovement, BudgetLineListItem } from "@/types/entities/budget"
import type { Colaborador, ColaboradorContrato, ColaboradorAuxilio } from "@/types/entities/colaborador"


const C = {
  primary:  [109,  40, 217] as [number, number, number],
  text:     [ 17,  24,  39] as [number, number, number],
  muted:    [107, 114, 128] as [number, number, number],
  border:   [229, 231, 235] as [number, number, number],
  rowAlt:   [249, 250, 251] as [number, number, number],
  white:    [255, 255, 255] as [number, number, number],
  green:    [ 22, 163,  74] as [number, number, number],
  red:      [220,  38,  38] as [number, number, number],
  orange:   [234,  88,  12] as [number, number, number],
}


const fmtCurrency = (v: string | number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    typeof v === "string" ? parseFloat(v) : v
  )

const fmtDate = (d?: string | null) => {
  if (!d) return "—"
  return new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })
}

const fmtDateTime = (d: string) =>
  new Date(d)
    .toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })
    .replace(",", "")

const now = () =>
  new Date().toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }).replace(",", "")

const userLabel = (u: { first_name?: string; last_name?: string; email?: string } | null | undefined) => {
  if (!u) return "—"
  const name = [u.first_name, u.last_name].filter(Boolean).join(" ")
  return name || u.email || "—"
}


function drawAnchor(doc: jsPDF, cx: number, cy: number, size: number) {
  doc.setDrawColor(...C.primary)
  doc.setLineWidth(size * 0.12)

  const r = size * 0.22
  doc.circle(cx, cy - size * 0.28, r, "S")

  doc.line(cx, cy - size * 0.06, cx, cy + size * 0.38)

  doc.line(cx - size * 0.35, cy, cx + size * 0.35, cy)

  doc.line(cx - size * 0.35, cy + size * 0.22, cx - size * 0.35, cy + size * 0.38)
  doc.line(cx + size * 0.35, cy + size * 0.22, cx + size * 0.35, cy + size * 0.38)

  const tw = size * 0.2
  doc.line(cx - size * 0.35, cy + size * 0.38, cx - size * 0.35 + tw, cy + size * 0.38)
  doc.line(cx + size * 0.35, cy + size * 0.38, cx + size * 0.35 - tw, cy + size * 0.38)
}


function createDoc() {
  return new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })
}

function drawHeader(doc: jsPDF, docNumber: string, title: string, subtitle?: string): number {
  const pw = doc.internal.pageSize.getWidth()

  doc.setFillColor(...C.primary)
  doc.rect(0, 0, pw, 4, "F")

  doc.setFillColor(248, 246, 255)
  doc.rect(0, 4, pw, 22, "F")

  drawAnchor(doc, 20, 15, 12)

  doc.setFontSize(13)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(...C.primary)
  doc.text("MINERVA", 30, 12)

  doc.setFontSize(7)
  doc.setFont("helvetica", "normal")
  doc.setTextColor(...C.muted)
  doc.text("Sistema de Gestão de Contratos", 30, 17)

  doc.setFontSize(7.5)
  doc.setTextColor(...C.muted)
  doc.text(`Emitido em ${now()}`, pw - 14, 10, { align: "right" })
  doc.setFontSize(7)
  doc.text(docNumber, pw - 14, 15, { align: "right" })

  doc.setDrawColor(...C.border)
  doc.setLineWidth(0.3)
  doc.line(0, 26, pw, 26)

  let y = 35
  doc.setFontSize(17)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(...C.text)
  doc.text(title, 14, y)

  y += 5
  if (subtitle) {
    doc.setFontSize(9.5)
    doc.setFont("helvetica", "normal")
    doc.setTextColor(...C.muted)
    doc.text(subtitle, 14, y)
    y += 4
  }

  doc.setDrawColor(...C.primary)
  doc.setLineWidth(0.5)
  doc.line(14, y + 1, pw - 14, y + 1)

  return y + 7
}


function sectionTitle(doc: jsPDF, label: string, y: number): number {
  doc.setFontSize(7.5)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(...C.primary)
  doc.text(label.toUpperCase(), 14, y)
  return y + 2
}


function kvTable(doc: jsPDF, rows: [string, string][], y: number): number {
  autoTable(doc, {
    startY: y,
    margin: { left: 14, right: 14 },
    body: rows,
    theme: "plain",
    styles: {
      fontSize: 9.5,
      cellPadding: { top: 2.5, bottom: 2.5, left: 3, right: 3 },
      lineColor: C.border,
      lineWidth: 0.1,
    },
    columnStyles: {
      0: { cellWidth: 58, fontStyle: "bold", textColor: C.muted },
      1: { textColor: C.text },
    },
    alternateRowStyles: { fillColor: C.rowAlt },
  })
  return (doc as any).lastAutoTable.finalY + 8
}


function dataTable(
  doc: jsPDF,
  head: string[],
  body: (string | number)[][],
  y: number
): number {
  autoTable(doc, {
    startY: y,
    margin: { left: 14, right: 14 },
    head: [head],
    body,
    theme: "striped",
    headStyles: {
      fillColor: C.primary,
      textColor: C.white,
      fontStyle: "bold",
      fontSize: 8.5,
      cellPadding: { top: 3, bottom: 3, left: 3, right: 3 },
    },
    bodyStyles: {
      fontSize: 9,
      textColor: C.text,
      cellPadding: { top: 2.5, bottom: 2.5, left: 3, right: 3 },
    },
    alternateRowStyles: { fillColor: C.rowAlt },
  })
  return (doc as any).lastAutoTable.finalY + 8
}


function addFooters(doc: jsPDF) {
  const total = doc.getNumberOfPages()
  const pw = doc.internal.pageSize.getWidth()
  const ph = doc.internal.pageSize.getHeight()

  for (let i = 1; i <= total; i++) {
    doc.setPage(i)

    doc.setFillColor(...C.primary)
    doc.rect(0, ph - 10, pw, 10, "F")

    drawAnchor(doc, 10, ph - 5, 5)

    doc.setFontSize(7)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(...C.white)
    doc.text("MINERVA", 17, ph - 6)

    doc.setFont("helvetica", "normal")
    doc.setFontSize(6.5)
    doc.text("Documento gerado automaticamente.", 17, ph - 3)

    doc.setFontSize(7)
    doc.text(`${i} / ${total}`, pw - 14, ph - 4.5, { align: "right" })
  }
}

function checkPageBreak(doc: jsPDF, y: number, needed: number = 20): number {
  const ph = doc.internal.pageSize.getHeight()
  if (y + needed > ph - 18) {
    doc.addPage()
    return 18
  }
  return y
}



const TYPE_LABELS: Record<string, string> = {
  GRADUACAO:             "Graduação",
  POS_GRADUACAO:         "Pós-Graduação",
  AUXILIO_CRECHE_ESCOLA: "Auxílio Creche / Escola",
  LINGUA_ESTRANGEIRA:    "Língua Estrangeira",
}
const STATUS_LABELS: Record<string, string> = {
  AGUARDANDO: "Aguardando",
  ATIVO:      "Ativo",
  CONCLUIDO:  "Concluído",
  CANCELADO:  "Cancelado",
}

export function generateAuxilioPdf(a: Auxilio) {
  const doc = createDoc()
  let y = drawHeader(
    doc,
    `Auxílio Nº ${String(a.id).padStart(5, "0")}`,
    TYPE_LABELS[a.type] ?? a.type,
    `${a.employee?.full_name}${a.employee?.employee_id ? " · Matrícula " + a.employee.employee_id : ""}`
  )

  y = sectionTitle(doc, "Colaborador", y)
  y = kvTable(doc, [
    ["Nome",      a.employee?.full_name ?? "—"],
    ["Matrícula", a.employee?.employee_id ?? "—"],
  ], y)

  y = sectionTitle(doc, "Financeiro", y)
  y = kvTable(doc, [
    ["Valor total",      fmtCurrency(a.total_amount)],
    ["Parcelas",         `${a.installment_count}x`],
    ["Valor / parcela",  fmtCurrency(a.amount_per_installment)],
  ], y)

  y = sectionTitle(doc, "Vigência", y)
  y = kvTable(doc, [
    ["Início",  fmtDate(a.start_date)],
    ["Término", fmtDate(a.end_date)],
    ["Status",  STATUS_LABELS[a.status] ?? a.status],
  ], y)

  y = sectionTitle(doc, "Classificação", y)
  y = kvTable(doc, [
    ["Tipo de auxílio",     TYPE_LABELS[a.type] ?? a.type],
    ["Linha orçamentária",  a.budget_line?.name ?? "—"],
  ], y)

  if (a.notes) {
    y = sectionTitle(doc, "Observações", y)
    doc.setFontSize(9.5)
    doc.setFont("helvetica", "normal")
    doc.setTextColor(...C.text)
    const lines = doc.splitTextToSize(a.notes, 182) as string[]
    doc.text(lines, 14, y)
    y += lines.length * 5 + 8
  }

  y = sectionTitle(doc, "Auditoria", y)
  kvTable(doc, [
    ["Criado em",       fmtDateTime(a.created_at)],
    ["Criado por",      userLabel(a.created_by)],
    ["Atualizado em",   fmtDateTime(a.updated_at)],
    ["Atualizado por",  userLabel(a.updated_by)],
  ], y)

  addFooters(doc)
  doc.save(`auxilio-${a.id}.pdf`)
}



export function generateContratoPdf(c: Contract, budgetLine?: BudgetLine) {
  const doc = createDoc()
  let y = drawHeader(
    doc,
    `Contrato Nº ${c.protocol_number}`,
    c.description || "Contrato",
    `Status: ${c.status === "ATIVO" ? "Ativo" : "Encerrado"}`
  )

  y = sectionTitle(doc, "Identificação", y)
  y = kvTable(doc, [
    ["Protocolo",             c.protocol_number],
    ["Status",                c.status === "ATIVO" ? "Ativo" : "Encerrado"],
    ["Natureza do pagamento", c.payment_nature],
  ], y)

  y = sectionTitle(doc, "Fiscais", y)
  y = kvTable(doc, [
    ["Fiscal principal",   c.main_inspector?.full_name ?? "—"],
    ["Fiscal substituto",  c.substitute_inspector?.full_name ?? "—"],
  ], y)

  y = sectionTitle(doc, "Financeiro", y)
  y = kvTable(doc, [
    ["Valor original",        fmtCurrency(c.original_value)],
    ["Valor atual",           fmtCurrency(c.current_value)],
    ["Linha orçamentária",    c.budget_line?.name ?? "—"],
  ], y)

  y = sectionTitle(doc, "Datas", y)
  y = kvTable(doc, [
    ["Assinatura",   fmtDate(c.signing_date)],
    ["Início",       fmtDate(c.start_date)],
    ["Término",      fmtDate(c.end_date)],
    ["Vencimento",   fmtDate(c.expiration_date)],
  ], y)

  if (budgetLine) {
    y = checkPageBreak(doc, y, 60)
    y = sectionTitle(doc, "Detalhes da Linha Orçamentária de Origem", y)
    y = kvTable(doc, [
      ["ID da Linha",           `#${String(budgetLine.id).padStart(5, "0")}`],
      ["Descrição",             budgetLine.summary_description || "—"],
      ["Orçamento de Origem",   budgetLine.budget?.name ?? "—"],
      ["Categoria",             budgetLine.category],
      ["Tipo de Despesa",       budgetLine.expense_type],
      ["Tipo de Contrato",      budgetLine.contract_type],
      ["Classificação",         budgetLine.budget_classification],
      ["Valor Orçado",          fmtCurrency(budgetLine.budgeted_amount)],
      ["Centro Gestor",         budgetLine.management_center?.name ?? "—"],
      ["Centro Solicitante",    budgetLine.requesting_center?.name ?? "—"],
      ["Status da Linha",       budgetLine.status],
    ], y)
  }

  if (c.description) {
    y = checkPageBreak(doc, y, 20)
    y = sectionTitle(doc, "Descrição", y)
    const lines = doc.splitTextToSize(c.description, 182) as string[]
    doc.setFontSize(9.5)
    doc.setFont("helvetica", "normal")
    doc.setTextColor(...C.text)
    doc.text(lines, 14, y)
    y += lines.length * 5 + 8
  }

  y = checkPageBreak(doc, y, 30)
  y = sectionTitle(doc, "Auditoria", y)
  kvTable(doc, [
    ["Criado em",      fmtDateTime(c.created_at)],
    ["Criado por",     userLabel(c.created_by)],
    ["Atualizado em",  fmtDateTime(c.updated_at)],
    ["Atualizado por", userLabel(c.updated_by)],
  ], y)

  addFooters(doc)
  doc.save(`contrato-${c.protocol_number}.pdf`)
}



export function generateLinhaOrcamentariaPdf(b: BudgetLine, contracts: Contract[] = []) {
  const doc = createDoc()
  let y = drawHeader(
    doc,
    `Linha Orçamentária Nº ${String(b.id).padStart(5, "0")}`,
    b.summary_description || "Linha Orçamentária",
    `${b.category} · ${b.expense_type} · Orçamento: ${b.budget?.name ?? "—"}`
  )

  y = sectionTitle(doc, "Identificação", y)
  y = kvTable(doc, [
    ["Categoria",           b.category],
    ["Tipo de despesa",     b.expense_type],
    ["Tipo de contrato",    b.contract_type],
    ["Classificação",       b.budget_classification],
    ["Status",              b.status],
  ], y)

  y = sectionTitle(doc, "Orçamento de Origem", y)
  y = kvTable(doc, [
    ["Orçamento",          b.budget?.name ?? "—"],
    ["Centro gestor",      b.management_center?.name ?? "—"],
    ["Centro solicitante", b.requesting_center?.name ?? "—"],
  ], y)

  y = sectionTitle(doc, "Fiscais", y)
  y = kvTable(doc, [
    ["Fiscal principal",    b.main_fiscal?.full_name ?? "—"],
    ["Fiscal secundário",   b.secondary_fiscal?.full_name ?? "—"],
  ], y)

  y = sectionTitle(doc, "Financeiro", y)
  y = kvTable(doc, [
    ["Valor orçado",            fmtCurrency(b.budgeted_amount)],
    ["Tipo de licitação",       b.probable_procurement_type],
    ["Status do processo",      b.process_status ?? "—"],
    ["Status do contrato",      b.contract_status ?? "—"],
  ], y)

  if (b.object) {
    y = checkPageBreak(doc, y, 20)
    y = sectionTitle(doc, "Objeto", y)
    const lines = doc.splitTextToSize(b.object, 182) as string[]
    doc.setFontSize(9.5)
    doc.setFont("helvetica", "normal")
    doc.setTextColor(...C.text)
    doc.text(lines, 14, y)
    y += lines.length * 5 + 8
  }

  if (b.contract_notes) {
    y = checkPageBreak(doc, y, 20)
    y = sectionTitle(doc, "Observações", y)
    const lines = doc.splitTextToSize(b.contract_notes, 182) as string[]
    doc.setFontSize(9.5)
    doc.setFont("helvetica", "normal")
    doc.setTextColor(...C.text)
    doc.text(lines, 14, y)
    y += lines.length * 5 + 8
  }

  if (contracts.length > 0) {
    y = checkPageBreak(doc, y, 30)
    y = sectionTitle(doc, `Contratos Vinculados (${contracts.length})`, y)
    y = dataTable(
      doc,
      ["Protocolo", "Fiscal Principal", "Fiscal Substituto", "Início", "Término", "Valor Atual", "Status"],
      contracts.map((ct) => [
        ct.protocol_number,
        ct.main_inspector?.full_name ?? "—",
        ct.substitute_inspector?.full_name ?? "—",
        fmtDate(ct.start_date),
        fmtDate(ct.end_date),
        fmtCurrency(ct.current_value),
        ct.status === "ATIVO" ? "Ativo" : "Encerrado",
      ]),
      y
    )
  }

  y = checkPageBreak(doc, y, 30)
  y = sectionTitle(doc, "Auditoria", y)
  kvTable(doc, [
    ["Criado em",      fmtDateTime(b.created_at)],
    ["Criado por",     userLabel(b.created_by)],
    ["Atualizado em",  fmtDateTime(b.updated_at)],
    ["Atualizado por", userLabel(b.updated_by)],
  ], y)

  addFooters(doc)
  doc.save(`linha-orcamentaria-${b.id}.pdf`)
}



const AUX_TYPE: Record<string, string> = {
  GRADUACAO:             "Graduação",
  POS_GRADUACAO:         "Pós-Graduação",
  AUXILIO_CRECHE_ESCOLA: "Creche/Escola",
  LINGUA_ESTRANGEIRA:    "Língua Estrangeira",
  CAPACITACAO_TECNICA:   "Capacitação Técnica",
  AUXILIO_ALIMENTACAO:   "Alimentação",
  AUXILIO_TRANSPORTE:    "Transporte",
  PLANO_SAUDE:           "Plano de Saúde",
  OUTROS:                "Outros",
}

export function generateColaboradorPdf(
  c: Colaborador,
  contratos: ColaboradorContrato[],
  auxilios: ColaboradorAuxilio[]
) {
  const doc = createDoc()
  let y = drawHeader(
    doc,
    c.full_name,
    "Ficha do Colaborador",
    `${c.position ?? "—"}${c.department ? " · " + c.department : ""}  ·  Status: ${c.status === "ATIVO" ? "Ativo" : "Inativo"}`
  )

  y = sectionTitle(doc, "Dados Pessoais", y)
  y = kvTable(doc, [
    ["Nome completo", c.full_name],
    ["CPF",          c.cpf ?? "—"],
    ["E-mail",       c.email ?? "—"],
    ["Telefone",     c.phone ?? "—"],
    ["Status",       c.status === "ATIVO" ? "Ativo" : "Inativo"],
  ], y)

  y = sectionTitle(doc, "Dados Funcionais", y)
  y = kvTable(doc, [
    ["Matrícula",          c.employee_id ?? "—"],
    ["Cargo",              c.position ?? "—"],
    ["Departamento",       c.department ?? "—"],
    ["Data de admissão",   fmtDate(c.admission_date)],
    ["Data de nascimento", fmtDate(c.birth_date)],
  ], y)

  if (c.direction?.name || c.management?.name || c.coordination?.name) {
    y = sectionTitle(doc, "Hierarquia Organizacional", y)
    y = kvTable(doc, [
      ["Direção",       c.direction?.name ?? "—"],
      ["Gerência",      c.management?.name ?? "—"],
      ["Coordenação",   c.coordination?.name ?? "—"],
    ], y)
  }

  if (c.street || c.city || c.state || c.postal_code) {
    y = sectionTitle(doc, "Endereço", y)
    y = kvTable(doc, [
      ["Logradouro", c.street ?? "—"],
      ["Cidade / UF", [c.city, c.state].filter(Boolean).join(" / ") || "—"],
      ["CEP",         c.postal_code ?? "—"],
    ], y)
  }

  if (c.bank_name || c.bank_agency || c.bank_account) {
    y = sectionTitle(doc, "Dados Bancários", y)
    y = kvTable(doc, [
      ["Banco",   c.bank_name ?? "—"],
      ["Agência", c.bank_agency ?? "—"],
      ["Conta",   c.bank_account ?? "—"],
    ], y)
  }

  if (contratos.length > 0) {
    y = checkPageBreak(doc, y, 30)
    y = sectionTitle(doc, `Contratos Relacionados (${contratos.length})`, y)
    y = dataTable(
      doc,
      ["Protocolo", "Função", "Início", "Término", "Status"],
      contratos.map((ct) => [
        ct.contract_protocol,
        ct.role === "FISCAL_PRINCIPAL" ? "Fiscal Principal" : "Fiscal Substituto",
        fmtDate(ct.start_date),
        fmtDate(ct.end_date),
        ct.status,
      ]),
      y
    )
  }

  if (auxilios.length > 0) {
    y = checkPageBreak(doc, y, 30)
    y = sectionTitle(doc, `Auxílios Recebidos (${auxilios.length})`, y)
    y = dataTable(
      doc,
      ["Tipo", "Valor Total", "Valor Mensal", "Início", "Término", "Status"],
      auxilios.map((ax) => [
        AUX_TYPE[ax.type] ?? ax.type,
        fmtCurrency(ax.total_amount),
        ax.monthly_amount ? fmtCurrency(ax.monthly_amount) : "—",
        fmtDate(ax.start_date),
        fmtDate(ax.end_date),
        ax.status,
      ]),
      y
    )
  }

  y = checkPageBreak(doc, y, 30)
  y = sectionTitle(doc, "Auditoria", y)
  kvTable(doc, [
    ["Criado em",      fmtDateTime(c.created_at)],
    ["Criado por",     userLabel(c.created_by)],
    ["Atualizado em",  fmtDateTime(c.updated_at)],
    ["Atualizado por", userLabel(c.updated_by)],
  ], y)

  addFooters(doc)
  doc.save(`colaborador-${c.id}-${c.full_name.replace(/\s+/g, "-").toLowerCase()}.pdf`)
}



export function generateOrcamentoPdf(
  budget: Budget,
  movements: BudgetMovement[],
  userName?: string
) {
  const doc = createDoc()
  const totalAmount = parseFloat(budget.total_amount)
  const availableAmount = parseFloat(budget.available_amount)
  const entradaAmount = parseFloat(budget.valor_remanejado_entrada || "0")
  const valorTotalAtual = totalAmount + entradaAmount
  const consumido = valorTotalAtual - availableAmount
  const pct = valorTotalAtual > 0 ? (consumido / valorTotalAtual) * 100 : 0

  let y = drawHeader(
    doc,
    `Orçamento ${budget.category} · ${budget.year}`,
    "Relatório de Orçamento",
    `Centro Gestor: ${budget.management_center?.name ?? "—"}  ·  Status: ${budget.status === "ATIVO" ? "Ativo" : "Inativo"}`
  )

  y = sectionTitle(doc, "Identificação", y)
  y = kvTable(doc, [
    ["Ano",            budget.year.toString()],
    ["Categoria",      budget.category],
    ["Status",         budget.status === "ATIVO" ? "Ativo" : "Inativo"],
    ["Centro Gestor",  budget.management_center?.name ?? "—"],
  ], y)

  y = sectionTitle(doc, "Resumo Financeiro", y)
  y = kvTable(doc, [
    ["Total Original",      fmtCurrency(budget.total_amount)],
    ["Remanejado (Entrada)", fmtCurrency(budget.valor_remanejado_entrada || "0")],
    ["Remanejado (Saída)",   fmtCurrency(budget.valor_remanejado_saida || "0")],
    ["Total Atual",          fmtCurrency(valorTotalAtual)],
    ["Disponível",           fmtCurrency(budget.available_amount)],
    ["Utilizado",            fmtCurrency(consumido)],
    ["% Consumido",          `${pct.toFixed(1)}%`],
  ], y)

  if (movements.length > 0) {
    y = checkPageBreak(doc, y, 40)
    y = sectionTitle(doc, `Movimentações (${movements.length})`, y)
    y = dataTable(
      doc,
      ["Data", "Valor", "Tipo", "Origem", "Destino", "Observação"],
      movements.map((m) => {
        const isOut = m.source?.id === budget.id
        return [
          fmtDate(m.movement_date),
          fmtCurrency(m.amount),
          isOut ? "↗ Saída" : "↙ Entrada",
          m.source ? `${m.source.category}-${m.source.year}` : "—",
          m.destination ? `${m.destination.category}-${m.destination.year}` : "—",
          m.notes ?? "—",
        ]
      }),
      y
    )
  }

  if (budget.budget_lines && budget.budget_lines.length > 0) {
    y = checkPageBreak(doc, y, 40)
    y = sectionTitle(doc, `Linhas Orçamentárias (${budget.budget_lines.length})`, y)
    y = dataTable(
      doc,
      ["ID", "Descrição", "Tipo de Despesa", "Centro Gestor", "Fiscal Principal", "Valor Orçado"],
      budget.budget_lines.map((l: BudgetLineListItem) => [
        `#${String(l.id).padStart(4, "0")}`,
        (l.summary_description ?? "—").substring(0, 35),
        l.expense_type ?? "—",
        (l.management_center_name ?? "—").substring(0, 20),
        (l.main_fiscal_name ?? "—").substring(0, 20),
        fmtCurrency(l.budgeted_amount),
      ]),
      y
    )
  }

  y = checkPageBreak(doc, y, 30)
  y = sectionTitle(doc, "Auditoria", y)
  kvTable(doc, [
    ["Criado em",      budget.created_at ? fmtDateTime(budget.created_at) : "—"],
    ["Criado por",     userLabel(budget.created_by)],
    ["Atualizado em",  budget.updated_at ? fmtDateTime(budget.updated_at) : "—"],
    ["Atualizado por", userLabel(budget.updated_by)],
    ...(userName ? [["Gerado por", userName] as [string, string]] : []),
  ], y)

  addFooters(doc)
  doc.save(`orcamento-${budget.category}-${budget.year}.pdf`)
}
