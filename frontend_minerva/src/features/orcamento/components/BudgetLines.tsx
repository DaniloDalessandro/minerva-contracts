"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

import { Button } from "@/components/ui/button"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ListIcon, DollarSignIcon, TrendingUpIcon, ClipboardListIcon, PlusIcon, Pencil, Trash2 } from "lucide-react";
import { BudgetLineListItem, BudgetLinesSummary } from "@/lib/api/budgets"

interface BudgetLinesProps {
  budgetLines: BudgetLineListItem[]
  budgetLinesSummary: BudgetLinesSummary
  onCreateNewBudgetLine?: () => void
  onEditBudgetLine?: (budgetLineId: number) => void
  onDeleteBudgetLine?: (budgetLineId: number) => void
}

export function BudgetLines({ budgetLines, budgetLinesSummary, onCreateNewBudgetLine, onEditBudgetLine, onDeleteBudgetLine }: BudgetLinesProps) {

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount)
  }

  const summaryCards = [
    {
      title: "Total de Linhas",
      value: budgetLinesSummary.total_lines.toString(),
      icon: ListIcon,
      color: "text-primary"
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {summaryCards.map((card, index) => (
            <Card key={index} className="border bg-muted/30">
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

        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-foreground">Lista de Linhas Orçamentárias</h3>

          {budgetLines.length === 0 ? (
            <div className="text-center py-8 bg-muted/30 rounded-xl">
              <ClipboardListIcon className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-2 text-sm font-semibold text-foreground">Nenhuma linha orçamentária</h3>
              <p className="mt-1 text-sm text-muted-foreground">
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

    </Card>
  )
}
