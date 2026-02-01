"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { 
  ListIcon, 
  DollarSignIcon, 
  TrendingUpIcon, 
  ClipboardListIcon, 
  HistoryIcon,
  UserIcon,
  TagIcon,
  CheckCircle2Icon,
  AlertCircleIcon,
  ChevronRightIcon,
  PlusIcon,
  Pencil,
  Trash2
} from "lucide-react"
import { BudgetLineListItem, BudgetLinesSummary } from "@/lib/api/budgets"
import BudgetLineVersionHistory from "./BudgetLineVersionHistory"

interface BudgetLinesProps {
  budgetLines: BudgetLineListItem[]
  budgetLinesSummary: BudgetLinesSummary
  onCreateNewBudgetLine?: () => void
  onEditBudgetLine?: (budgetLineId: number) => void
  onDeleteBudgetLine?: (budgetLineId: number) => void
  budgetInfo?: {
    name: string
    year: number
    category: string
    totalAmount: string
  }
}

export function BudgetLines({ budgetLines, budgetLinesSummary, onCreateNewBudgetLine, onEditBudgetLine, onDeleteBudgetLine, budgetInfo }: BudgetLinesProps) {
  const [selectedLineId, setSelectedLineId] = useState<number | null>(null)
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount)
  }

  const getStatusColor = (status: string, type: 'contract' | 'process') => {
    const statusColors: { [key: string]: string } = {
      // Contract Status Colors
      'DENTRO DO PRAZO': 'bg-green-100 text-green-800 border-green-200',
      'CONTRATADO NO PRAZO': 'bg-green-100 text-green-800 border-green-200',
      'CONTRATADO COM ATRASO': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'PRAZO VENCIDO': 'bg-red-100 text-red-800 border-red-200',
      'VENCIDO': 'bg-red-100 text-red-800 border-red-200',
      // Process Status Colors
      'ELABORADO NO PRAZO': 'bg-green-100 text-green-800 border-green-200',
      'ELABORADO COM ATRASO': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'EM ELABORAÇÃO': 'bg-blue-100 text-blue-800 border-blue-200',
      'PENDENTE': 'bg-orange-100 text-orange-800 border-orange-200',
    }
    return statusColors[status] || 'bg-gray-100 text-gray-800 border-gray-200'
  }

  const getExpenseTypeColor = (expenseType: string) => {
    const typeColors: { [key: string]: string } = {
      'Base Principal': 'bg-blue-100 text-blue-800 border-blue-200',
      'Base Suplementar': 'bg-purple-100 text-purple-800 border-purple-200',
      'Reserva Técnica': 'bg-orange-100 text-orange-800 border-orange-200',
      'Contingência': 'bg-red-100 text-red-800 border-red-200',
    }
    return typeColors[expenseType] || 'bg-gray-100 text-gray-800 border-gray-200'
  }

  const handleViewHistory = (lineId: number) => {
    setSelectedLineId(lineId)
    setIsHistoryDialogOpen(true)
  }

  const handleCloseHistoryDialog = () => {
    setIsHistoryDialogOpen(false)
    setSelectedLineId(null)
  }


  // Summary statistics cards
  const summaryCards = [
    {
      title: "Total de Linhas",
      value: budgetLinesSummary.total_lines.toString(),
      icon: ListIcon,
      color: "text-blue-600"
    },
    {
      title: "Valor Total Orçado",
      value: formatCurrency(budgetLinesSummary.total_budgeted_amount),
      icon: DollarSignIcon,
      color: "text-green-600"
    },
    {
      title: "% de Utilização",
      value: `${budgetLinesSummary.utilization_percentage.toFixed(1)}%`,
      icon: TrendingUpIcon,
      color: "text-orange-600"
    }
  ]

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <ClipboardListIcon className="h-5 w-5" />
            Linhas Orçamentárias Vinculadas
          </CardTitle>
          {onCreateNewBudgetLine && (
            <Button onClick={onCreateNewBudgetLine} className="flex items-center gap-2">
              <PlusIcon className="h-4 w-4" />
              Gerar Nova Linha Orçamentária
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {summaryCards.map((card, index) => (
            <Card key={index} className="border-0 bg-gray-50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{card.title}</p>
                    <p className={`text-xl font-bold ${card.color}`}>{card.value}</p>
                  </div>
                  <card.icon className={`h-8 w-8 ${card.color} opacity-70`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Budget Lines Table */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-900">Lista de Linhas Orçamentárias</h3>
          
          {budgetLines.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <ClipboardListIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-semibold text-gray-900">Nenhuma linha orçamentária</h3>
              <p className="mt-1 text-sm text-gray-500">
                Este orçamento não possui linhas orçamentárias vinculadas.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-bold">Descrição</TableHead>
                  <TableHead className="font-bold">Valor Orçado</TableHead>
                  <TableHead className="font-bold">Centro Gestor</TableHead>
                  <TableHead className="font-bold">Fiscal</TableHead>
                  <TableHead className="font-bold">Tipo de Despesa</TableHead>
                  <TableHead className="w-[100px] font-bold">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {budgetLines.map((line) => (
                  <TableRow key={line.id}>
                    <TableCell>
                      {line.summary_description || "Descrição não informada"}
                    </TableCell>
                    <TableCell>
                      {formatCurrency(line.budgeted_amount)}
                    </TableCell>
                    <TableCell>
                      {line.management_center_name}
                    </TableCell>
                    <TableCell>
                      {line.main_fiscal_name}
                    </TableCell>
                    <TableCell>
                      {line.expense_type}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {onEditBudgetLine && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEditBudgetLine(line.id)}
                            className="h-8 w-8 p-0"
                            title="Editar"
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                        )}
                        {onDeleteBudgetLine && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDeleteBudgetLine(line.id)}
                            className="h-8 w-8 p-0"
                            title="Excluir"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

      </CardContent>

      {/* Version History Dialog */}
      <Dialog open={isHistoryDialogOpen} onOpenChange={setIsHistoryDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Histórico de Versões da Linha Orçamentária</DialogTitle>
          </DialogHeader>
          <div className="overflow-auto">
            {selectedLineId && (
              <BudgetLineVersionHistory 
                budgetLineId={selectedLineId} 
                isOpen={isHistoryDialogOpen} 
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  )
}