"use client"

import { Budget } from "@/lib/api/budgets"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CalendarIcon, DollarSignIcon, BuildingIcon, UserIcon } from "lucide-react"
import { BudgetMovementHistory } from "./BudgetMovementHistory"

interface BudgetDetailsModalProps {
  budget: Budget | null
  isOpen: boolean
  onClose: () => void
}

export function BudgetDetailsModal({ budget, isOpen, onClose }: BudgetDetailsModalProps) {
  if (!budget) return null

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

  // Usar valores calculados do backend
  const usedAmount = parseFloat(budget.used_amount || '0')
  const entradaAmount = parseFloat(budget.valor_remanejado_entrada || '0')
  const saidaAmount = parseFloat(budget.valor_remanejado_saida || '0')
  const totalAmount = parseFloat(budget.total_amount)
  const availableAmount = parseFloat(budget.available_amount)
  
  // Verificar se os valores batem com a lógica: Disponível = Total + Entrada - Saída - Utilizado
  const calculatedAvailable = totalAmount + entradaAmount - saidaAmount - usedAmount
  
  // Valor Total Atual = Total + Entrada
  const valorTotalAtual = totalAmount + entradaAmount
  
  // Porcentagem correta: quanto foi consumido do Valor Total Atual
  // Consumido = Valor Total Atual - Disponível
  const consumido = valorTotalAtual - availableAmount
  const percentageValue = valorTotalAtual > 0 ? (consumido / valorTotalAtual) * 100 : 0
  
  // Ajustar precisão: se for menor que 1%, mostrar 2 casas decimais
  const usagePercentage = percentageValue < 1 && percentageValue > 0 
    ? percentageValue.toFixed(2) 
    : percentageValue.toFixed(1)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Detalhes do Orçamento - {budget.year}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Informações do Orçamento */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4" />
                Informações do Orçamento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Ano</p>
                  <p className="font-semibold">{budget.year}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Categoria</p>
                  <p className="font-semibold">{budget.category}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Centro Gestor</p>
                  <p className="font-semibold">{budget.management_center?.name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <p className="font-semibold">{budget.status}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Informações Financeiras Compactas */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <DollarSignIcon className="h-4 w-4" />
                Valores Orçamentários
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-2">Valor Total Atual</p>
                <p className="text-xl font-bold text-blue-600">{formatCurrency(valorTotalAtual.toString())}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Total: {formatCurrency(budget.total_amount)} + Entrada: {formatCurrency(budget.valor_remanejado_entrada || '0')}
                </p>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-orange-600 h-2 rounded-full transition-all duration-300" 
                  style={{width: `${usagePercentage}%`}}
                />
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">{usagePercentage}% consumido</span>
                <span className="text-muted-foreground">
                  {formatCurrency(consumido.toString())} / {formatCurrency(valorTotalAtual.toString())}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Histórico de Movimentações do Orçamento */}
          <BudgetMovementHistory budgetId={budget.id} />

          {/* Informações de Auditoria Compactas */}
          <Card>
            <CardContent className="pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <UserIcon className="h-3 w-3" />
                  <span>Criado: {formatDate(budget.created_at)}</span>
                  {budget.created_by && <span>por {budget.created_by.email}</span>}
                </div>
                <div className="flex items-center gap-1">
                  <UserIcon className="h-3 w-3" />
                  <span>Atualizado: {formatDate(budget.updated_at)}</span>
                  {budget.updated_by && <span>por {budget.updated_by.email}</span>}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}