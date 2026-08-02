"use client"

import React, { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { type Auxilio } from "@/features/auxilios"
import { AuxilioService } from "@/services"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  ArrowLeft, Edit, Printer,
  User, DollarSign, Calendar, Tag, FileText, CheckCircle,
} from "lucide-react"
import { generateAuxilioPdf } from "@/lib/pdf-report"

const fmtCurrency = (v: string | number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    typeof v === "string" ? parseFloat(v) : v
  )

const fmtDate = (d?: string | null) =>
  d ? new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }) : "—"

const fmtDateTime = (d: string) =>
  new Date(d)
    .toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })
    .replace(",", "")

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

export default function AuxilioDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const id = params?.id as string

  const [auxilio, setAuxilio] = useState<Auxilio | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    AuxilioService.fetchAuxilioById(parseInt(id))
      .then(setAuxilio)
      .catch(() => setError("Erro ao carregar os detalhes do auxílio"))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Carregando detalhes do auxílio...</div>
        </div>
      </div>
    )
  }

  if (error || !auxilio) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg text-red-500">{error || "Auxílio não encontrado"}</div>
        </div>
      </div>
    )
  }

  const expDate  = auxilio.end_date ? new Date(auxilio.end_date) : null
  const daysDiff = expDate ? Math.ceil((expDate.getTime() - Date.now()) / 86400000) : null
  const isExpired  = daysDiff !== null && daysDiff < 0
  const isExpiring = daysDiff !== null && daysDiff >= 0 && daysDiff <= 30

  const createdBy = auxilio.created_by
    ? [auxilio.created_by.first_name, auxilio.created_by.last_name].filter(Boolean).join(" ") || auxilio.created_by.email
    : null

  const updatedBy = auxilio.updated_by
    ? [auxilio.updated_by.first_name, auxilio.updated_by.last_name].filter(Boolean).join(" ") || auxilio.updated_by.email
    : null

  return (
    <div className="h-full overflow-auto">
      <div className="container mx-auto py-6 px-4">


        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => router.push("/auxilios")}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                {TYPE_LABELS[auxilio.type] ?? auxilio.type}
              </h1>
              <p className="text-sm text-muted-foreground">
                Auxílio #{auxilio.id}
                {(isExpired || isExpiring) && (
                  <span className="ml-2 text-amber-600 dark:text-amber-400">
                    · {isExpired ? `Vencido há ${Math.abs(daysDiff!)} dias` : `Vence em ${daysDiff} dias`}
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => generateAuxilioPdf(auxilio)} className="flex items-center gap-2">
              <Printer className="h-4 w-4" />
              Gerar PDF
            </Button>
            <Button
              onClick={() => { window.sessionStorage.setItem("editAuxilioId", id); router.push("/auxilios") }}
              className="flex items-center gap-2"
            >
              <Edit className="h-4 w-4" />
              Editar
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <Tag className="h-5 w-5" />
                Informações do Auxílio
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <User className="h-3 w-3" />
                    Colaborador
                  </div>
                  <p className="text-base font-semibold">{auxilio.employee?.full_name ?? "—"}</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <User className="h-3 w-3" />
                    Matrícula
                  </div>
                  <p className="text-base font-semibold">{auxilio.employee?.employee_id ?? "—"}</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <CheckCircle className="h-3 w-3" />
                    Status
                  </div>
                  <p className="text-base font-semibold">{STATUS_LABELS[auxilio.status] ?? auxilio.status}</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <DollarSign className="h-3 w-3" />
                    Valor Total
                  </div>
                  <p className="text-base font-semibold text-primary">{fmtCurrency(auxilio.total_amount)}</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <DollarSign className="h-3 w-3" />
                    Parcelas
                  </div>
                  <p className="text-base font-semibold">{auxilio.installment_count}x</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <DollarSign className="h-3 w-3" />
                    Valor por Parcela
                  </div>
                  <p className="text-base font-semibold">{fmtCurrency(auxilio.amount_per_installment)}</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    Início
                  </div>
                  <p className="text-base font-semibold">{fmtDate(auxilio.start_date)}</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    Término
                  </div>
                  <p className={`text-base font-semibold ${isExpired ? "text-red-600 dark:text-red-400" : isExpiring ? "text-amber-600 dark:text-amber-400" : ""}`}>
                    {fmtDate(auxilio.end_date)}
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <FileText className="h-3 w-3" />
                    Linha Orçamentária
                  </div>
                  <p className="text-base font-semibold">{auxilio.budget_line?.name ?? "Não informado"}</p>
                </div>

              </div>

              {auxilio.notes && (
                <>
                  <Separator className="my-4" />
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                      <FileText className="h-3 w-3" />
                      Observações
                    </div>
                    <p className="text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed">{auxilio.notes}</p>
                  </div>
                </>
              )}

              <Separator className="my-4" />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span>Criado em {fmtDateTime(auxilio.created_at)}</span>
                  {createdBy && <span className="font-medium">por {createdBy}</span>}
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span>Atualizado em {fmtDateTime(auxilio.updated_at)}</span>
                  {updatedBy && <span className="font-medium">por {updatedBy}</span>}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  )
}
