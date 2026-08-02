"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ColaboradorService } from "@/services"
import type { Colaborador, ColaboradorContrato, ColaboradorAuxilio } from "@/types/entities/colaborador"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Edit, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { generateColaboradorPdf } from "@/lib/pdf-report"

interface Field {
  label: string
  value: string
}

function FieldGrid({ fields, muted = false }: { fields: Field[]; muted?: boolean }) {
  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-x-5 gap-y-3.5">
      {fields.map((f) => (
        <div key={f.label} className="min-w-0">
          <p className="m-0 text-[10px] uppercase tracking-wide text-muted-foreground">{f.label}</p>
          <p className={`mt-1 text-sm break-words ${muted ? "text-muted-foreground" : "font-medium"}`}>{f.value}</p>
        </div>
      ))}
    </div>
  )
}

function Section({ title, muted = false, children }: { title: string; muted?: boolean; children: React.ReactNode }) {
  return (
    <div className="border-t border-border pt-3.5 first:border-t-0 first:pt-0">
      <h4 className={`m-0 mb-2.5 text-[11px] font-semibold uppercase tracking-wide ${muted ? "text-muted-foreground" : "text-primary"}`}>
        {title}
      </h4>
      {children}
    </div>
  )
}

export default function ColaboradorDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const colaboradorId = Number(params.id)

  const [colaborador, setColaborador] = useState<Colaborador | null>(null)
  const [contratos, setContratos] = useState<ColaboradorContrato[]>([])
  const [auxilios, setAuxilios] = useState<ColaboradorAuxilio[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const [colab, cts, auxs] = await Promise.all([
          ColaboradorService.fetchColaboradorById(colaboradorId),
          ColaboradorService.fetchContratos(colaboradorId).catch(() => []),
          ColaboradorService.fetchAuxilios(colaboradorId).catch(() => []),
        ])
        setColaborador(colab)
        setContratos(cts)
        setAuxilios(auxs)
      } catch {
        setError("Erro ao carregar detalhes do colaborador")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [colaboradorId])

  const fmtDate = (d?: string) =>
    d ? new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }) : "-"

  const fmtDateTime = (d: string) =>
    new Date(d)
      .toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })
      .replace(",", "")

  const fmtCurrency = (v: string) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(parseFloat(v))

  const AUX_TYPE: Record<string, string> = {
    GRADUACAO: "Graduação", POS_GRADUACAO: "Pós-Graduação",
    AUXILIO_CRECHE_ESCOLA: "Auxílio Creche/Escola", LINGUA_ESTRANGEIRA: "Língua Estrangeira",
    CAPACITACAO_TECNICA: "Capacitação Técnica", AUXILIO_ALIMENTACAO: "Auxílio Alimentação",
    AUXILIO_TRANSPORTE: "Auxílio Transporte", PLANO_SAUDE: "Plano de Saúde", OUTROS: "Outros",
  }

  const AUX_STATUS: Record<string, string> = {
    AGUARDANDO: "Aguardando", ATIVO: "Ativo", CONCLUIDO: "Concluído",
    CANCELADO: "Cancelado", SUSPENSO: "Suspenso",
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Carregando detalhes do colaborador...</div>
        </div>
      </div>
    )
  }

  if (error || !colaborador) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg text-red-500">{error || "Colaborador não encontrado"}</div>
        </div>
      </div>
    )
  }

  const createdBy = colaborador.created_by
    ? [colaborador.created_by.first_name, colaborador.created_by.last_name].filter(Boolean).join(" ") || colaborador.created_by.email
    : null

  const updatedBy = colaborador.updated_by
    ? [colaborador.updated_by.first_name, colaborador.updated_by.last_name].filter(Boolean).join(" ") || colaborador.updated_by.email
    : null

  const initials = colaborador.full_name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase()

  const hasEndereco = Boolean(colaborador.street || colaborador.city || colaborador.state || colaborador.postal_code)
  const hasDadosBancarios = Boolean(colaborador.bank_name || colaborador.bank_agency || colaborador.bank_account)

  return (
    <div className="h-full overflow-auto">
      <div className="container mx-auto py-6 px-4">

        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.push("/colaboradores")}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Colaboradores</span>
              <span className="text-border">/</span>
              <span className="font-medium">{colaborador.full_name}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => generateColaboradorPdf(colaborador, contratos, auxilios)}>
              <Download className="h-3.5 w-3.5" />
              Baixar PDF
            </Button>
            <Button
              size="sm"
              onClick={() => { window.sessionStorage.setItem("editColaboradorId", colaboradorId.toString()); router.push("/colaboradores") }}
            >
              <Edit className="h-3.5 w-3.5" />
              Editar
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-3.5">

          <Card className="rounded-2xl">
            <CardContent className="flex flex-col gap-4">
              <div className="flex items-center gap-3.5 pb-4 border-b border-border">
                <div className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-lg font-bold text-primary">
                  {initials}
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="m-0 truncate text-base font-bold">{colaborador.full_name}</h2>
                  <p className="mt-0.5 truncate text-sm text-muted-foreground">{colaborador.position || "-"}</p>
                </div>
                <Badge variant={colaborador.status === "ATIVO" ? "success" : "secondary"} className="shrink-0">
                  {colaborador.status === "ATIVO" ? "Ativo" : "Inativo"}
                </Badge>
              </div>

              <div className="flex flex-col gap-4">
                <Section title="Dados Pessoais">
                  <FieldGrid
                    fields={[
                      { label: "Nome Completo", value: colaborador.full_name },
                      { label: "Email", value: colaborador.email || "-" },
                      { label: "CPF", value: colaborador.cpf || "-" },
                      { label: "Telefone", value: colaborador.phone || "-" },
                      { label: "Data de Nascimento", value: fmtDate(colaborador.birth_date) },
                    ]}
                  />
                </Section>

                <Section title="Dados Funcionais">
                  <FieldGrid
                    fields={[
                      { label: "Matrícula", value: colaborador.employee_id || "-" },
                      { label: "Cargo", value: colaborador.position || "-" },
                      { label: "Departamento", value: colaborador.department || "-" },
                      { label: "Data de Admissão", value: fmtDate(colaborador.admission_date) },
                    ]}
                  />
                </Section>

                <Section title="Hierarquia Organizacional">
                  <FieldGrid
                    fields={[
                      { label: "Direção", value: colaborador.direction?.name || "-" },
                      { label: "Gerência", value: colaborador.management?.name || "-" },
                      { label: "Coordenação", value: colaborador.coordination?.name || "-" },
                    ]}
                  />
                </Section>

                {hasEndereco && (
                  <Section title="Endereço">
                    <FieldGrid
                      fields={[
                        { label: "Logradouro", value: colaborador.street || "-" },
                        { label: "Cidade / UF", value: [colaborador.city, colaborador.state].filter(Boolean).join(" / ") || "-" },
                        { label: "CEP", value: colaborador.postal_code || "-" },
                      ]}
                    />
                  </Section>
                )}

                {hasDadosBancarios && (
                  <Section title="Dados Bancários">
                    <FieldGrid
                      fields={[
                        { label: "Banco", value: colaborador.bank_name || "-" },
                        { label: "Agência", value: colaborador.bank_agency || "-" },
                        { label: "Conta", value: colaborador.bank_account || "-" },
                      ]}
                    />
                  </Section>
                )}

                <Section title="Registro" muted>
                  <FieldGrid
                    muted
                    fields={[
                      { label: "Criado por", value: createdBy || "-" },
                      { label: "Criado em", value: fmtDateTime(colaborador.created_at) },
                      { label: "Atualizado por", value: updatedBy || "-" },
                      { label: "Atualizado em", value: fmtDateTime(colaborador.updated_at) },
                      { label: "ID do Registro", value: `#${String(colaborador.id).padStart(5, "0")}` },
                    ]}
                  />
                </Section>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardContent className="flex flex-col gap-3">
              <h3 className="m-0 border-b border-border pb-2 text-sm font-semibold">Contratos como Fiscal</h3>
              {contratos.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/40">
                        <TableHead>Protocolo</TableHead>
                        <TableHead>Papel</TableHead>
                        <TableHead>Início</TableHead>
                        <TableHead>Término</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {contratos.map((ct) => (
                        <TableRow key={ct.id}>
                          <TableCell className="font-medium">{ct.contract_protocol}</TableCell>
                          <TableCell>
                            <Badge variant={ct.role === "FISCAL_PRINCIPAL" ? "purple" : "warning"}>
                              {ct.role === "FISCAL_PRINCIPAL" ? "Fiscal Principal" : "Fiscal Substituto"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{fmtDate(ct.start_date)}</TableCell>
                          <TableCell className="text-muted-foreground">{fmtDate(ct.end_date)}</TableCell>
                          <TableCell>
                            <Badge variant={ct.status === "ATIVO" ? "success" : "secondary"}>
                              {ct.status === "ATIVO" ? "Ativo" : "Inativo"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="py-5 text-center text-sm text-muted-foreground">
                  Nenhum contrato vinculado como fiscal ou fiscal substituto
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardContent className="flex flex-col gap-3">
              <h3 className="m-0 border-b border-border pb-2 text-sm font-semibold">Auxílios</h3>
              {auxilios.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {auxilios.map((aux) => (
                    <div key={aux.id} className="rounded-xl border border-border p-3.5">
                      <div className="mb-2.5 flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h4 className="text-sm font-semibold">{AUX_TYPE[aux.type] ?? aux.type}</h4>
                          {aux.description && <p className="text-xs text-muted-foreground">{aux.description}</p>}
                        </div>
                        <Badge variant={aux.status === "ATIVO" ? "success" : "secondary"} className="shrink-0">
                          {AUX_STATUS[aux.status] ?? aux.status}
                        </Badge>
                      </div>
                      <FieldGrid
                        fields={[
                          { label: "Valor Total", value: fmtCurrency(aux.total_amount) },
                          ...(aux.monthly_amount ? [{ label: "Valor Mensal", value: fmtCurrency(aux.monthly_amount) }] : []),
                          { label: "Início", value: fmtDate(aux.start_date) },
                          ...(aux.end_date ? [{ label: "Término", value: fmtDate(aux.end_date) }] : []),
                          ...(aux.institution_name ? [{ label: "Instituição", value: aux.institution_name }] : []),
                          ...(aux.course_name ? [{ label: "Curso", value: aux.course_name }] : []),
                          ...(aux.budget_line ? [{ label: "Linha Orçamentária", value: aux.budget_line.name }] : []),
                          ...(aux.notes ? [{ label: "Observações", value: aux.notes }] : []),
                        ]}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="py-5 text-center text-sm text-muted-foreground">
                  Este colaborador não possui auxílios cadastrados.
                </p>
              )}
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  )
}
