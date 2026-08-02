"use client"

import React, { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { fetchBudgetLineById, BudgetLine } from "@/lib/api/budgetlines"
import { fetchContractsByBudgetLine } from "@/lib/api/contratos"
import type { Contract } from "@/types/entities/contrato"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  ArrowLeft, Edit, Printer,
  User, DollarSign, FileText, Building, Tag, CheckCircle, Settings, ExternalLink,
} from "lucide-react"
import { generateLinhaOrcamentariaPdf } from "@/lib/pdf-report"
import Link from "next/link"

export default function BudgetLineDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const id = params?.id as string

  const [budgetLine, setBudgetLine] = useState<BudgetLine | null>(null)
  const [contracts, setContracts] = useState<Contract[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (id) loadDetails()
  }, [id])

  const loadDetails = async () => {
    try {
      setLoading(true)
      const [bl, cts] = await Promise.all([
        fetchBudgetLineById(parseInt(id)),
        fetchContractsByBudgetLine(parseInt(id)).catch(() => []),
      ])
      setBudgetLine(bl)
      setContracts(cts)
    } catch {
      setError("Erro ao carregar os detalhes da linha orçamentária")
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = () => {
    window.sessionStorage.setItem("editBudgetLineId", id)
    router.push("/linhas-orcamentarias")
  }

  const fmtCurrency = (v: string) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(parseFloat(v))

  const fmtDate = (d?: string | null) =>
    d ? new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }) : "—"

  const fmtDateTime = (d: string) =>
    new Date(d)
      .toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })
      .replace(",", "")

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Carregando...</div>
        </div>
      </div>
    )
  }

  if (error || !budgetLine) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg text-red-500">{error || "Linha orçamentária não encontrada"}</div>
        </div>
      </div>
    )
  }

  const createdBy = budgetLine.created_by
    ? [budgetLine.created_by.first_name, budgetLine.created_by.last_name].filter(Boolean).join(" ") || budgetLine.created_by.email
    : null

  const updatedBy = budgetLine.updated_by
    ? [budgetLine.updated_by.first_name, budgetLine.updated_by.last_name].filter(Boolean).join(" ") || budgetLine.updated_by.email
    : null

  const InfoField = ({ icon: Icon, label, value, className = "" }: { icon: any; label: string; value: string; className?: string }) => (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <Icon className="h-3 w-3" />
        {label}
      </div>
      <p className={`text-sm font-semibold ${className}`}>{value}</p>
    </div>
  )

  return (
    <div className="h-full overflow-auto">
      <div className="container mx-auto py-6 px-4 max-w-5xl">

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.push("/linhas-orcamentarias")}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Linhas Orçamentárias</span>
              <span className="text-border">/</span>
              <span className="font-medium">#{String(budgetLine.id).padStart(5, "0")}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => generateLinhaOrcamentariaPdf(budgetLine, contracts)}>
              <Printer className="h-3.5 w-3.5 mr-1.5" />
              Gerar PDF
            </Button>
            <Button size="sm" onClick={handleEdit}>
              <Edit className="h-3.5 w-3.5 mr-1.5" />
              Editar
            </Button>
          </div>
        </div>

        <div className="space-y-4">

          {/* Identificação */}
          <Card className="rounded-2xl">
            <CardContent className="pt-5">
              <div className="flex items-start justify-between gap-4 pb-4 border-b border-border mb-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-muted-foreground font-medium">
                      #{String(budgetLine.id).padStart(5, "0")}
                    </span>
                    <Badge variant={budgetLine.status === "ATIVO" ? "success" : "secondary"}>
                      {budgetLine.status}
                    </Badge>
                  </div>
                  <h2 className="text-base font-bold text-foreground leading-snug">
                    {budgetLine.summary_description}
                  </h2>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {budgetLine.category} · {budgetLine.expense_type}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-muted-foreground">Valor Orçado</p>
                  <p className="text-xl font-bold text-primary">{fmtCurrency(budgetLine.budgeted_amount)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                <InfoField icon={Tag} label="Categoria" value={budgetLine.category} />
                <InfoField icon={FileText} label="Tipo de Despesa" value={budgetLine.expense_type} />
                <InfoField icon={FileText} label="Tipo de Contrato" value={budgetLine.contract_type} />
                <InfoField icon={CheckCircle} label="Classificação" value={budgetLine.budget_classification} />
                <InfoField icon={Settings} label="Tipo de Licitação" value={budgetLine.probable_procurement_type ?? "—"} />
                {budgetLine.process_status && (
                  <InfoField icon={Settings} label="Status do Processo" value={budgetLine.process_status} />
                )}
                {budgetLine.contract_status && (
                  <InfoField icon={CheckCircle} label="Status do Contrato" value={budgetLine.contract_status} />
                )}
              </div>
            </CardContent>
          </Card>

          {/* Orçamento de Origem */}
          <Card className="rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Building className="h-4 w-4 text-primary" />
                Orçamento de Origem
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
                <div className="space-y-1.5">
                  <p className="text-xs text-muted-foreground font-medium">Orçamento</p>
                  {budgetLine.budget ? (
                    <Link
                      href={`/orcamento/${budgetLine.budget.id}`}
                      className="text-sm font-semibold text-primary hover:underline flex items-center gap-1"
                    >
                      {budgetLine.budget.name}
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  ) : (
                    <p className="text-sm font-semibold">—</p>
                  )}
                </div>
                <InfoField icon={Building} label="Centro Gestor" value={budgetLine.management_center?.name ?? "—"} />
                <InfoField icon={Building} label="Centro Solicitante" value={budgetLine.requesting_center?.name ?? "—"} />
              </div>
            </CardContent>
          </Card>

          {/* Fiscais */}
          <Card className="rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <User className="h-4 w-4 text-primary" />
                Fiscais
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <InfoField icon={User} label="Fiscal Principal" value={budgetLine.main_fiscal?.full_name ?? "—"} />
                <InfoField icon={User} label="Fiscal Secundário" value={budgetLine.secondary_fiscal?.full_name ?? "—"} />
              </div>
            </CardContent>
          </Card>

          {/* Objeto / Observações */}
          {(budgetLine.object || budgetLine.contract_notes) && (
            <Card className="rounded-2xl">
              <CardContent className="pt-5 space-y-4">
                {budgetLine.object && (
                  <div>
                    <p className="text-xs text-muted-foreground font-medium mb-1.5 flex items-center gap-1">
                      <FileText className="h-3 w-3" /> Objeto
                    </p>
                    <p className="text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed">{budgetLine.object}</p>
                  </div>
                )}
                {budgetLine.object && budgetLine.contract_notes && <Separator />}
                {budgetLine.contract_notes && (
                  <div>
                    <p className="text-xs text-muted-foreground font-medium mb-1.5 flex items-center gap-1">
                      <FileText className="h-3 w-3" /> Observações
                    </p>
                    <p className="text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed">{budgetLine.contract_notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Contratos Vinculados */}
          <Card className="rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                Contratos Vinculados
                <Badge variant="secondary" className="ml-1 text-xs">{contracts.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {contracts.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/30">
                        <TableHead>Protocolo</TableHead>
                        <TableHead>Fiscal Principal</TableHead>
                        <TableHead>Fiscal Substituto</TableHead>
                        <TableHead>Início</TableHead>
                        <TableHead>Término</TableHead>
                        <TableHead className="text-right">Valor Atual</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {contracts.map((ct) => (
                        <TableRow key={ct.id}>
                          <TableCell className="font-semibold">{ct.protocol_number}</TableCell>
                          <TableCell className="text-sm">{ct.main_inspector?.full_name ?? "—"}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{ct.substitute_inspector?.full_name ?? "—"}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{fmtDate(ct.start_date)}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{fmtDate(ct.end_date)}</TableCell>
                          <TableCell className="text-right font-semibold text-primary">
                            {fmtCurrency(ct.current_value)}
                          </TableCell>
                          <TableCell>
                            <Badge variant={ct.status === "ATIVO" ? "success" : "secondary"}>
                              {ct.status === "ATIVO" ? "Ativo" : "Encerrado"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                              <Link href={`/contratos/${ct.id}`}>
                                <ExternalLink className="h-3.5 w-3.5" />
                              </Link>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Nenhum contrato vinculado a esta linha orçamentária.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Auditoria */}
          <Card className="rounded-2xl">
            <CardContent className="pt-5">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-primary mb-3">Auditoria</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Criado em</p>
                  <p className="text-xs font-medium mt-0.5">{fmtDateTime(budgetLine.created_at)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Criado por</p>
                  <p className="text-xs font-medium mt-0.5">{createdBy || "—"}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Atualizado em</p>
                  <p className="text-xs font-medium mt-0.5">{fmtDateTime(budgetLine.updated_at)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Atualizado por</p>
                  <p className="text-xs font-medium mt-0.5">{updatedBy || "—"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  )
}
