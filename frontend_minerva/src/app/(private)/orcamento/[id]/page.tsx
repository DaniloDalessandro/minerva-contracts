"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { fetchBudgetById, Budget, createBudgetMovement, CreateBudgetMovementData, fetchBudgets, getBudgetMovementsByBudget } from "@/lib/api/budgets"
import { deleteBudgetLine, fetchBudgetLineById, createBudgetLine, updateBudgetLine } from "@/lib/api/budgetlines"
import { useAuthContext } from "@/context/AuthContext"
import { generateOrcamentoPdf } from "@/lib/pdf-report"
import { BudgetLineForm } from "@/features/orcamento"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { CalendarIcon, DollarSignIcon, BuildingIcon, UserIcon, ArrowLeftRightIcon, InfoIcon, TagIcon, CheckCircleIcon, FileTextIcon, PrinterIcon } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { BudgetMovementHistory, BudgetMovementForm, BudgetLines } from "@/features/orcamento"

export default function BudgetDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const budgetId = Number(params.id)

  const [budget, setBudget] = useState<Budget | null>(null)
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isMovementFormOpen, setIsMovementFormOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)


  const [isBudgetLineFormOpen, setIsBudgetLineFormOpen] = useState(false)
  const [editingBudgetLineId, setEditingBudgetLineId] = useState<number | null>(null)
  const [editingBudgetLineData, setEditingBudgetLineData] = useState<any>(null)
  const [isBudgetLineSubmitting, setIsBudgetLineSubmitting] = useState(false)


  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [budgetLineToDelete, setBudgetLineToDelete] = useState<number | null>(null)


  const { user } = useAuthContext()

  useEffect(() => {
    const loadBudgetDetails = async () => {
      try {
        setLoading(true)


        const [budgetData, budgetsData] = await Promise.all([
          fetchBudgetById(budgetId),
          fetchBudgets()
        ])
        setBudget(budgetData)
        setBudgets(budgetsData.results || budgetsData)

      } catch (err) {
        console.error("Erro ao carregar detalhes do orçamento:", err)
        setError("Erro ao carregar detalhes do orçamento")
      } finally {
        setLoading(false)
      }
    }

    loadBudgetDetails()
  }, [budgetId])

  const formatCurrency = (amount: string) => {
    const value = parseFloat(amount)
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).replace(",", "")
  }

  const handleNewMovement = () => {
    setIsMovementFormOpen(true)
  }

  const handleGenerateReport = async () => {
    if (!budget) return
    try {
      const movements = await getBudgetMovementsByBudget(budget.id)
      const userName = user?.name || user?.email || undefined
      generateOrcamentoPdf(budget, movements, userName)
    } catch (error) {
      console.error('Erro ao gerar relatório:', error)
    }
  }

  const handleCreateNewBudgetLine = () => {
    setEditingBudgetLineId(null)
    setEditingBudgetLineData({ budget: budgetId })
    setIsBudgetLineFormOpen(true)
  }

  const handleEditBudgetLine = async (budgetLineId: number) => {
    try {
      const budgetLineData = await fetchBudgetLineById(budgetLineId)
      setEditingBudgetLineId(budgetLineId)
      setEditingBudgetLineData(budgetLineData)
      setIsBudgetLineFormOpen(true)
    } catch (error) {
      console.error("Erro ao carregar dados da linha orçamentária:", error)
    }
  }

  const handleDeleteBudgetLine = (budgetLineId: number) => {
    setBudgetLineToDelete(budgetLineId)
    setDeleteDialogOpen(true)
  }

  const confirmDeleteBudgetLine = async () => {
    if (budgetLineToDelete) {
      try {
        await deleteBudgetLine(budgetLineToDelete)

        const updatedBudget = await fetchBudgetById(budgetId)
        setBudget(updatedBudget)
      } catch (error) {
        console.error("Erro ao excluir linha orçamentária:", error)
      } finally {
        setDeleteDialogOpen(false)
        setBudgetLineToDelete(null)
      }
    }
  }

  const handleBudgetLineSubmit = async (budgetLineData: any) => {
    try {
      setIsBudgetLineSubmitting(true)

      if (editingBudgetLineId) {

        await updateBudgetLine({ ...budgetLineData, id: editingBudgetLineId })
      } else {

        await createBudgetLine(budgetLineData)
      }


      const updatedBudget = await fetchBudgetById(budgetId)
      setBudget(updatedBudget)
      setIsBudgetLineFormOpen(false)
      setEditingBudgetLineId(null)
      setEditingBudgetLineData(null)
    } catch (error) {
      console.error("Erro ao salvar linha orçamentária:", error)
    } finally {
      setIsBudgetLineSubmitting(false)
    }
  }

  const handleMovementSubmit = async (data: CreateBudgetMovementData) => {
    try {
      setIsSubmitting(true)
      await createBudgetMovement(data)
      setIsMovementFormOpen(false)

      const updatedBudget = await fetchBudgetById(budgetId)
      setBudget(updatedBudget)
    } catch (error) {
      console.error("Erro ao criar movimentação:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCloseMovementForm = () => {
    setIsMovementFormOpen(false)
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Carregando detalhes do orçamento...</div>
        </div>
      </div>
    )
  }

  if (error || !budget) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg text-red-500">
            {error || "Orçamento não encontrado"}
          </div>
        </div>
      </div>
    )
  }


  const usedAmount = parseFloat(budget.used_amount || '0')
  const entradaAmount = parseFloat(budget.valor_remanejado_entrada || '0')
  const saidaAmount = parseFloat(budget.valor_remanejado_saida || '0')
  const totalAmount = parseFloat(budget.total_amount)
  const availableAmount = parseFloat(budget.available_amount)


  const calculatedAvailable = totalAmount + entradaAmount - saidaAmount - usedAmount


  const valorTotalAtual = totalAmount + entradaAmount



  const consumido = valorTotalAtual - availableAmount
  const percentageValue = valorTotalAtual > 0 ? (consumido / valorTotalAtual) * 100 : 0


  const usagePercentage = percentageValue < 1 && percentageValue > 0
    ? percentageValue.toFixed(2)
    : percentageValue.toFixed(1)


  if (Math.abs(calculatedAvailable - availableAmount) > 0.01) {
    console.warn('Inconsistência nos valores do orçamento:')
    console.warn(`Total: ${totalAmount}, Entrada: ${entradaAmount}, Saída: ${saidaAmount}, Utilizado: ${usedAmount}`)
    console.warn(`Disponível (API): ${availableAmount}, Calculado: ${calculatedAvailable}`)
  }

  return (
    <div className="h-full overflow-auto">
    <div className="container mx-auto py-6 px-4">

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Detalhes do Orçamento - {budget.year}
          </h1>
          <p className="text-sm text-muted-foreground">Visualização completa do orçamento</p>
        </div>
        <Button onClick={handleGenerateReport} className="flex items-center gap-2">
          <PrinterIcon className="h-4 w-4" />
          Gerar PDF
        </Button>
      </div>

      <div className="space-y-6">

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <InfoIcon className="h-5 w-5" />
              Informações do Orçamento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <CalendarIcon className="h-3 w-3" />
                  Ano
                </div>
                <p className="text-base font-semibold">{budget.year}</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <TagIcon className="h-3 w-3" />
                  Tipo/Categoria
                </div>
                <p className="text-base font-semibold">{budget.category}</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <CheckCircleIcon className="h-3 w-3" />
                  Status
                </div>
                <p className="text-base font-semibold">{budget.status}</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <BuildingIcon className="h-3 w-3" />
                  Centro Gestor
                </div>
                <p className="text-base font-medium">{budget.management_center?.name || "Não informado"}</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <DollarSignIcon className="h-3 w-3" />
                  Valor Total
                </div>
                <p className="text-base font-semibold text-primary">{formatCurrency(budget.total_amount)}</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <DollarSignIcon className="h-3 w-3" />
                  Valor Disponível
                </div>
                <p className="text-base font-semibold text-green-600">{formatCurrency(budget.available_amount)}</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <DollarSignIcon className="h-3 w-3" />
                  Valor Utilizado
                </div>
                <p className="text-base font-semibold text-orange-600">{formatCurrency(usedAmount.toString())}</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <DollarSignIcon className="h-3 w-3" />
                  Remanejado (Entrada)
                </div>
                <p className="text-base font-semibold text-green-600">
                  {formatCurrency(budget.valor_remanejado_entrada || '0')}
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <DollarSignIcon className="h-3 w-3" />
                  Remanejado (Saída)
                </div>
                <p className="text-base font-semibold text-red-600">
                  {formatCurrency(budget.valor_remanejado_saida || '0')}
                </p>
              </div>
            </div>

            <Separator className="my-4" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <UserIcon className="h-4 w-4" />
                <span>Criado em {formatDate(budget.created_at)}</span>
                {budget.created_by && (
                  <span className="font-medium">
                    por {budget.created_by.first_name && budget.created_by.last_name
                      ? `${budget.created_by.first_name} ${budget.created_by.last_name}`
                      : budget.created_by.email}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <UserIcon className="h-4 w-4" />
                <span>Atualizado em {formatDate(budget.updated_at)}</span>
                {budget.updated_by && (
                  <span className="font-medium">
                    por {budget.updated_by.first_name && budget.updated_by.last_name
                      ? `${budget.updated_by.first_name} ${budget.updated_by.last_name}`
                      : budget.updated_by.email}
                  </span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>


        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <DollarSignIcon className="h-4 w-4" />
              Valores Orçamentários
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">Valor Total Atual</p>
              <p className="text-3xl font-bold text-primary">{formatCurrency(valorTotalAtual.toString())}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Total: {formatCurrency(budget.total_amount)} + Entrada: {formatCurrency(budget.valor_remanejado_entrada || '0')}
              </p>
            </div>
            <div className="w-full bg-muted rounded-full h-3">
              <div
                className="bg-orange-600 h-3 rounded-full transition-all duration-300"
                style={{width: `${usagePercentage}%`}}
              />
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">{usagePercentage}% consumido</span>
              <span className="text-muted-foreground">
                {formatCurrency(consumido.toString())} / {formatCurrency(valorTotalAtual.toString())}
              </span>
            </div>
          </CardContent>
        </Card>


        <BudgetMovementHistory
          budgetId={budget.id}
          onNewMovement={handleNewMovement}
          onMovementChange={async () => {

            const updatedBudget = await fetchBudgetById(budgetId)
            setBudget(updatedBudget)
          }}
        />


        {budget.budget_lines && budget.budget_lines_summary && (
          <BudgetLines
            budgetLines={budget.budget_lines}
            budgetLinesSummary={budget.budget_lines_summary}
            onCreateNewBudgetLine={handleCreateNewBudgetLine}
            onEditBudgetLine={handleEditBudgetLine}
            onDeleteBudgetLine={handleDeleteBudgetLine}
            budgetInfo={{
              name: `${budget.category}-${budget.year}`,
              year: budget.year,
              category: budget.category,
              totalAmount: budget.total_amount
            }}
          />
        )}
      </div>


      <BudgetMovementForm
        isOpen={isMovementFormOpen}
        onClose={handleCloseMovementForm}
        onSubmit={handleMovementSubmit}
        budgets={budgets}
        isLoading={isSubmitting}
        currentBudgetId={budgetId}
      />


      <BudgetLineForm
        open={isBudgetLineFormOpen}
        handleClose={() => {
          setIsBudgetLineFormOpen(false)
          setEditingBudgetLineId(null)
          setEditingBudgetLineData(null)
        }}
        initialData={editingBudgetLineData}
        onSubmit={handleBudgetLineSubmit}
        isSubmitting={isBudgetLineSubmitting}
      />


      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta linha orçamentária?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteBudgetLine}>
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
    </div>
  )
}
