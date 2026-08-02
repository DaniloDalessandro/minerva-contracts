"use client"

import React, { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { fetchContractById, Contract } from "@/lib/api/contratos"
import { fetchBudgetLineById } from "@/lib/api/budgetlines"
import type { BudgetLine } from "@/types/entities/budget-line"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  ArrowLeft, Edit, Printer,
  User, DollarSign, Calendar, FileText, Tag, CheckCircle, Users, Building, ExternalLink,
} from "lucide-react"
import { generateContratoPdf } from "@/lib/pdf-report"
import Link from "next/link"

export default function ContractDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const id = params?.id as string

  const [contract, setContract] = useState<Contract | null>(null)
  const [budgetLine, setBudgetLine] = useState<BudgetLine | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (id) loadDetails()
  }, [id])

  const loadDetails = async () => {
    try {
      setLoading(true)
      const c = await fetchContractById(parseInt(id))
      setContract(c)
      if (c.budget_line?.id) {
        const bl = await fetchBudgetLineById(c.budget_line.id).catch(() => null)
        setBudgetLine(bl)
      }
    } catch {
      setError("Erro ao carregar os detalhes do contrato")
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = () => {
    window.sessionStorage.setItem("editContractId", id)
    router.push("/contratos")
  }

  const fmtCurrency = (v: string | number) => {
    const n = typeof v === "string" ? parseFloat(v) : v
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n)
  }

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

  if (error || !contract) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg text-red-500">{error || "Contrato não encontrado"}</div>
        </div>
      </div>
    )
  }

  const originalValue = parseFloat(contract.original_value)
  const currentValue  = parseFloat(contract.current_value)
  const hasValueChanged = originalValue !== currentValue

  const expDate  = contract.expiration_date ? new Date(contract.expiration_date) : null
  const daysDiff = expDate ? Math.ceil((expDate.getTime() - Date.now()) / (1000 * 3600 * 24)) : null
  const isExpired  = daysDiff !== null && daysDiff < 0
  const isExpiring = daysDiff !== null && daysDiff >= 0 && daysDiff <= 30

  const createdBy = contract.created_by
    ? [contract.created_by.first_name, contract.created_by.last_name].filter(Boolean).join(" ") || contract.created_by.email
    : null

  const updatedBy = contract.updated_by
    ? [contract.updated_by.first_name, contract.updated_by.last_name].filter(Boolean).join(" ") || contract.updated_by.email
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
            <Button variant="ghost" size="icon" onClick={() => router.push("/contratos")}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Contratos</span>
              <span className="text-border">/</span>
              <span className="font-medium">#{contract.protocol_number}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => generateContratoPdf(contract, budgetLine ?? undefined)}>
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

          {/* Cabeçalho do contrato */}
          <Card className="rounded-2xl">
            <CardContent className="pt-5">
              <div className="flex items-start justify-between gap-4 pb-4 border-b border-border mb-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-muted-foreground font-medium">Protocolo #{contract.protocol_number}</span>
                    <Badge variant={contract.status === "ATIVO" ? "success" : "secondary"}>
                      {contract.status === "ATIVO" ? "Ativo" : "Encerrado"}
                    </Badge>
                    {isExpired && <Badge variant="destructive">Vencido</Badge>}
                    {isExpiring && !isExpired && <Badge variant="warning">Vence em {daysDiff}d</Badge>}
                  </div>
                  {contract.description && (
                    <p className="text-sm text-muted-foreground leading-relaxed">{contract.description}</p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-muted-foreground">Valor Atual</p>
                  <p className="text-xl font-bold text-primary">{fmtCurrency(contract.current_value)}</p>
                  {hasValueChanged && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Original: {fmtCurrency(contract.original_value)}{" "}
                      <span className={currentValue > originalValue ? "text-green-600" : "text-red-600"}>
                        ({currentValue > originalValue ? "↗" : "↘"})
                      </span>
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                <InfoField icon={Tag} label="Natureza do Pagamento" value={contract.payment_nature} />
                <InfoField icon={Calendar} label="Assinatura" value={fmtDate(contract.signing_date)} />
                <InfoField icon={Calendar} label="Início" value={fmtDate(contract.start_date)} />
                <InfoField icon={Calendar} label="Término" value={fmtDate(contract.end_date)} />
                <InfoField
                  icon={Calendar}
                  label="Vencimento"
                  value={fmtDate(contract.expiration_date)}
                  className={isExpired ? "text-red-600" : isExpiring ? "text-amber-600" : ""}
                />
              </div>
            </CardContent>
          </Card>

          {/* Fiscais */}
          <Card className="rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                Fiscais
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <InfoField icon={User} label="Fiscal Principal" value={contract.main_inspector?.full_name ?? "—"} />
                <InfoField icon={User} label="Fiscal Substituto" value={contract.substitute_inspector?.full_name ?? "—"} />
              </div>
            </CardContent>
          </Card>

          {/* Linha Orçamentária de Origem */}
          <Card className="rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                Linha Orçamentária de Origem
                {contract.budget_line?.id && (
                  <Button variant="ghost" size="icon" className="h-6 w-6 ml-1" asChild>
                    <Link href={`/linhas-orcamentarias/${contract.budget_line.id}`}>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {budgetLine ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 pb-3 border-b border-border">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-muted-foreground">
                        #{String(budgetLine.id).padStart(5, "0")} · {budgetLine.category} · {budgetLine.expense_type}
                      </p>
                      <p className="text-sm font-semibold mt-0.5">{budgetLine.summary_description}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-muted-foreground">Valor Orçado</p>
                      <p className="text-base font-bold text-primary">
                        {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(parseFloat(budgetLine.budgeted_amount))}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                    <div className="space-y-1.5">
                      <p className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                        <Building className="h-3 w-3" /> Orçamento
                      </p>
                      {budgetLine.budget ? (
                        <Link href={`/orcamento/${budgetLine.budget.id}`}
                          className="text-sm font-semibold text-primary hover:underline flex items-center gap-1">
                          {budgetLine.budget.name}
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                      ) : (
                        <p className="text-sm font-semibold">—</p>
                      )}
                    </div>
                    <InfoField icon={Building} label="Centro Gestor" value={budgetLine.management_center?.name ?? "—"} />
                    <InfoField icon={Building} label="Centro Solicitante" value={budgetLine.requesting_center?.name ?? "—"} />
                    <InfoField icon={CheckCircle} label="Classificação" value={budgetLine.budget_classification} />
                    <InfoField icon={Tag} label="Tipo de Contrato" value={budgetLine.contract_type} />
                    <InfoField icon={Tag} label="Tipo de Licitação" value={budgetLine.probable_procurement_type ?? "—"} />
                    {budgetLine.process_status && (
                      <InfoField icon={CheckCircle} label="Status do Processo" value={budgetLine.process_status} />
                    )}
                    {budgetLine.contract_status && (
                      <InfoField icon={CheckCircle} label="Status do Contrato" value={budgetLine.contract_status} />
                    )}
                  </div>

                  {budgetLine.object && (
                    <>
                      <Separator />
                      <div>
                        <p className="text-xs text-muted-foreground font-medium mb-1.5">Objeto da Linha</p>
                        <p className="text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed">{budgetLine.object}</p>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2">
                  <InfoField icon={FileText} label="Linha Orçamentária" value={contract.budget_line?.name ?? "—"} />
                </div>
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
                  <p className="text-xs font-medium mt-0.5">{fmtDateTime(contract.created_at)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Criado por</p>
                  <p className="text-xs font-medium mt-0.5">{createdBy || "—"}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Atualizado em</p>
                  <p className="text-xs font-medium mt-0.5">{fmtDateTime(contract.updated_at)}</p>
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
