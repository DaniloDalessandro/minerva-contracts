"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { fetchBudgetById, Budget, createBudgetMovement, CreateBudgetMovementData, fetchBudgets, getBudgetMovementsByBudget } from "@/lib/api/budgets"
import { deleteBudgetLine, fetchBudgetLineById, createBudgetLine, updateBudgetLine } from "@/lib/api/budgetlines"
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { useAuth } from "@/hooks/useAuth"
import { BudgetLineForm } from "@/features/orcamento"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { CalendarIcon, DollarSignIcon, BuildingIcon, UserIcon, ArrowLeftRightIcon, InfoIcon, TagIcon, CheckCircleIcon, FileTextIcon } from "lucide-react"
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
  
  // Budget Line form states
  const [isBudgetLineFormOpen, setIsBudgetLineFormOpen] = useState(false)
  const [editingBudgetLineId, setEditingBudgetLineId] = useState<number | null>(null)
  const [editingBudgetLineData, setEditingBudgetLineData] = useState<any>(null)
  const [isBudgetLineSubmitting, setIsBudgetLineSubmitting] = useState(false)
  
  // Delete confirmation states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [budgetLineToDelete, setBudgetLineToDelete] = useState<number | null>(null)
  
  // Auth context
  const { user } = useAuth()

  useEffect(() => {
    const loadBudgetDetails = async () => {
      try {
        setLoading(true)
        
        // Load budget details and all budgets for movement form
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
      // Buscar dados das movimentações
      const movements = await getBudgetMovementsByBudget(budget.id)
      
      const doc = new jsPDF('landscape', 'mm', 'a4')
      const pageWidth = doc.internal.pageSize.getWidth()
      const pageHeight = doc.internal.pageSize.getHeight()
      
      // Helper functions
      const formatCurrency = (amount: string | number) => {
        const value = typeof amount === 'string' ? parseFloat(amount) : amount
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
        })
      }

      // Função para desenhar ícone de âncora minimalista
      const drawAnchor = (x: number, y: number, size: number = 6) => {
        doc.setDrawColor(59, 130, 246) // Azul moderno
        doc.setLineWidth(1.2)
        
        // Corpo principal
        doc.line(x, y - size/2, x, y + size/2)
        // Braço horizontal
        doc.line(x - size/3, y - size/4, x + size/3, y - size/4)
        // Anel superior
        doc.circle(x, y - size/2 - size/8, size/8, 'S')
        // Garras
        doc.line(x - size/4, y + size/3, x - size/2.5, y + size/2)
        doc.line(x + size/4, y + size/3, x + size/2.5, y + size/2)
      }

      let y = 25
      
      // Header minimalista
      doc.setFillColor(59, 130, 246)
      doc.rect(0, 0, pageWidth, 18, 'F')
      
      // Logo e título clean
      drawAnchor(20, 9, 6)
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(16)
      doc.setFont('helvetica', 'bold')
      doc.text('MINERVA', 35, 10)
      
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.text(`Relatório de Orçamento ${budget.category} ${budget.year}`, 35, 14)
      
      y = 30
      
      // Layout em duas colunas principais
      const col1X = 20
      const col2X = pageWidth / 2 + 10
      const colWidth = (pageWidth - 60) / 2
      
      // ===== INFORMAÇÕES BÁSICAS (Compacta) =====
      doc.setTextColor(55, 65, 81)
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.text('Informações do Orçamento', col1X, y)
      
      y += 8
      const infoData = [
        ['Ano', budget.year.toString()],
        ['Categoria', budget.category],
        ['Status', budget.status],
        ['Centro Gestor', budget.management_center?.name || "N/A"]
      ]
      
      infoData.forEach(([label, value], index) => {
        doc.setTextColor(107, 114, 126)
        doc.setFontSize(9)
        doc.setFont('helvetica', 'normal')
        doc.text(`${label}:`, col1X, y + (index * 6))
        
        doc.setTextColor(17, 24, 39)
        doc.setFont('helvetica', 'bold')
        doc.text(value, col1X + 40, y + (index * 6))
      })
      
      // ===== RESUMO FINANCEIRO (Lado direito) =====
      doc.setTextColor(55, 65, 81)
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.text('Resumo Financeiro', col2X, y - 8)
      
      const usedAmount = parseFloat(budget.used_amount || '0')
      const entradaAmount = parseFloat(budget.valor_remanejado_entrada || '0')
      const saidaAmount = parseFloat(budget.valor_remanejado_saida || '0')
      const totalAmount = parseFloat(budget.total_amount)
      const availableAmount = parseFloat(budget.available_amount)
      const valorTotalAtual = totalAmount + entradaAmount
      const percentageValue = valorTotalAtual > 0 ? ((valorTotalAtual - availableAmount) / valorTotalAtual) * 100 : 0
      
      const financeData = [
        ['Total Original', formatCurrency(budget.total_amount), [59, 130, 246]],
        ['Disponível', formatCurrency(budget.available_amount), [34, 197, 94]],
        ['Utilizado', formatCurrency(usedAmount.toString()), [239, 68, 68]],
        ['Consumo', `${percentageValue.toFixed(1)}%`, percentageValue > 80 ? [239, 68, 68] : [34, 197, 94]]
      ]
      
      financeData.forEach(([label, value, color], index) => {
        doc.setTextColor(107, 114, 126)
        doc.setFontSize(9)
        doc.setFont('helvetica', 'normal')
        doc.text(`${label}:`, col2X, y + (index * 6))
        
        doc.setTextColor(...(color as number[]))
        doc.setFont('helvetica', 'bold')
        doc.text(value, col2X + 40, y + (index * 6))
      })
      
      y += 35
      
      // ===== MOVIMENTAÇÕES (Compacto) =====
      const relevantMovements = movements.filter(movement => 
        movement.source?.id === budget.id || movement.destination?.id === budget.id
      )
      
      if (relevantMovements.length > 0) {
        // Linha divisória sutil
        doc.setDrawColor(229, 231, 235)
        doc.setLineWidth(0.5)
        doc.line(20, y, pageWidth - 20, y)
        
        y += 10
        doc.setTextColor(55, 65, 81)
        doc.setFontSize(14)
        doc.setFont('helvetica', 'bold')
        doc.text(`Movimentações (${relevantMovements.length})`, col1X, y)
        
        y += 10
        
        // Tabela minimalista de movimentações
        const movementHeaders = ['Data', 'Valor', 'Tipo', 'Origem', 'Destino']
        const movementData = relevantMovements.slice(0, 10).map(movement => {
          const isOutgoing = movement.source?.id === budget.id
          const direction = isOutgoing ? '↗ SAÍDA' : '↙ ENTRADA'
          
          return [
            formatDate(movement.movement_date),
            formatCurrency(movement.amount),
            direction,
            `${movement.source?.category}-${movement.source?.year}`,
            `${movement.destination?.category}-${movement.destination?.year}`
          ]
        })
        
        autoTable(doc, {
          head: [movementHeaders],
          body: movementData,
          startY: y,
          theme: 'plain',
          headStyles: {
            fillColor: [249, 250, 251],
            textColor: [75, 85, 99],
            fontSize: 9,
            fontStyle: 'bold',
            cellPadding: 2
          },
          bodyStyles: {
            fontSize: 8,
            cellPadding: 2,
            textColor: [55, 65, 81]
          },
          columnStyles: {
            0: { cellWidth: 25 },
            1: { cellWidth: 25, halign: 'right', fontStyle: 'bold' },
            2: { cellWidth: 22, halign: 'center' },
            3: { cellWidth: 35, fontSize: 7 },
            4: { cellWidth: 35, fontSize: 7 }
          },
          margin: { left: 20, right: 20 }
        })
        
        y = (doc as any).lastAutoTable.finalY + 15
        
        if (relevantMovements.length > 10) {
          doc.setTextColor(107, 114, 126)
          doc.setFontSize(8)
          doc.text(`... e mais ${relevantMovements.length - 10} movimentações`, 20, y)
          y += 10
        }
      }
      
      // ===== LINHAS ORÇAMENTÁRIAS (Compacto) =====
      if (budget.budget_lines && budget.budget_lines.length > 0) {
        // Linha divisória sutil
        doc.setDrawColor(229, 231, 235)
        doc.setLineWidth(0.5)
        doc.line(20, y, pageWidth - 20, y)
        
        y += 10
        
        // Header com estatísticas inline
        doc.setTextColor(55, 65, 81)
        doc.setFontSize(14)
        doc.setFont('helvetica', 'bold')
        doc.text(`Linhas Orçamentárias (${budget.budget_lines.length})`, col1X, y)
        
        // Estatísticas do lado direito
        const totalBudgeted = budget.budget_lines_summary?.total_budgeted_amount || 0
        doc.setTextColor(107, 114, 126)
        doc.setFontSize(10)
        doc.setFont('helvetica', 'normal')
        doc.text(`Total Orçado: `, col2X, y)
        doc.setTextColor(34, 197, 94)
        doc.setFont('helvetica', 'bold')
        doc.text(formatCurrency(totalBudgeted), col2X + 35, y)
        
        y += 15
        
        // Tabela minimalista e compacta
        const budgetLineHeaders = ['ID', 'Descrição', 'Valor', 'Centro Gestor', 'Fiscal']
        const budgetLineData = budget.budget_lines.slice(0, 15).map(line => [
          `#${line.id}`,
          line.summary_description?.substring(0, 30) + (line.summary_description && line.summary_description.length > 30 ? '...' : '') || 'N/A',
          formatCurrency(line.budgeted_amount),
          line.management_center_name?.substring(0, 20) + (line.management_center_name && line.management_center_name.length > 20 ? '...' : '') || 'N/A',
          line.main_fiscal_name?.substring(0, 20) + (line.main_fiscal_name && line.main_fiscal_name.length > 20 ? '...' : '') || 'N/A'
        ])
        
        autoTable(doc, {
          head: [budgetLineHeaders],
          body: budgetLineData,
          startY: y,
          theme: 'plain',
          headStyles: {
            fillColor: [249, 250, 251],
            textColor: [75, 85, 99],
            fontSize: 9,
            fontStyle: 'bold',
            cellPadding: 2
          },
          bodyStyles: {
            fontSize: 8,
            cellPadding: 2,
            textColor: [55, 65, 81]
          },
          columnStyles: {
            0: { cellWidth: 15, halign: 'center', fontStyle: 'bold' },
            1: { cellWidth: 60 },
            2: { cellWidth: 25, halign: 'right', fontStyle: 'bold', textColor: [34, 197, 94] },
            3: { cellWidth: 35 },
            4: { cellWidth: 35 }
          },
          margin: { left: 20, right: 20 }
        })
        
        y = (doc as any).lastAutoTable.finalY + 10
        
        if (budget.budget_lines.length > 15) {
          doc.setTextColor(107, 114, 126)
          doc.setFontSize(8)
          doc.text(`... e mais ${budget.budget_lines.length - 15} linhas orçamentárias`, 20, y)
          y += 10
        }
      }
      
      // ===== FOOTER EM TODAS AS PÁGINAS =====
      const addFooter = () => {
        const currentDate = new Date().toLocaleString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        })
        
        const userName = user?.name || user?.email || 'Usuário não identificado'
        const pageCount = doc.getNumberOfPages()
        
        for (let i = 1; i <= pageCount; i++) {
          doc.setPage(i)
          
          // Footer com gradiente
          doc.setFillColor(248, 250, 252)
          doc.rect(0, pageHeight - 20, pageWidth, 20, 'F')
          
          // Linha superior do footer
          doc.setDrawColor(30, 144, 255)
          doc.setLineWidth(2)
          doc.line(0, pageHeight - 20, pageWidth, pageHeight - 20)
          
          // Ícone da âncora pequeno no footer
          drawAnchor(20, pageHeight - 10, 4)
          
          // Footer text
          doc.setTextColor(60, 60, 60)
          doc.setFontSize(8)
          doc.setFont('helvetica', 'bold')
          doc.text('MINERVA', 30, pageHeight - 12)
          
          doc.setFont('helvetica', 'normal')
          doc.text(`Gerado por: ${userName}`, 30, pageHeight - 6)
          
          // Data/hora centralizada
          const dateText = `Gerado em: ${currentDate}`
          const dateWidth = doc.getTextWidth(dateText)
          doc.text(dateText, (pageWidth - dateWidth) / 2, pageHeight - 9)
          
          // Página à direita
          const pageText = `${i} / ${pageCount}`
          const pageWidth_text = doc.getTextWidth(pageText)
          doc.setFontSize(9)
          doc.setFont('helvetica', 'bold')
          doc.text(pageText, pageWidth - pageWidth_text - 15, pageHeight - 9)
        }
      }
      
      addFooter()
      
      // Salvar o PDF
      const fileName = `relatorio-orcamento-${budget.category}-${budget.year}-${new Date().toISOString().split('T')[0]}.pdf`
      doc.save(fileName)
      
    } catch (error) {
      console.error('Erro ao gerar relatório:', error)
      alert('Erro ao gerar relatório. Tente novamente.')
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
        // Refresh budget details to update the budget lines
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
        // Update existing budget line
        await updateBudgetLine({ ...budgetLineData, id: editingBudgetLineId })
      } else {
        // Create new budget line
        await createBudgetLine(budgetLineData)
      }
      
      // Refresh the budget details to update the budget lines
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
      // Refresh budget details to update available amount
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
  
  // Debug da lógica (temporário)
  if (Math.abs(calculatedAvailable - availableAmount) > 0.01) {
    console.warn('Inconsistência nos valores do orçamento:')
    console.warn(`Total: ${totalAmount}, Entrada: ${entradaAmount}, Saída: ${saidaAmount}, Utilizado: ${usedAmount}`)
    console.warn(`Disponível (API): ${availableAmount}, Calculado: ${calculatedAvailable}`)
  }

  return (
    <div className="container mx-auto py-6 px-4">
      {/* Header with Title */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Detalhes do Orçamento - {budget.year}
          </h1>
          <p className="text-sm text-muted-foreground">Visualização completa do orçamento</p>
        </div>
        <Button onClick={handleGenerateReport} className="flex items-center gap-2">
          <FileTextIcon className="h-4 w-4" />
          Gerar Relatório
        </Button>
      </div>
      
      <div className="space-y-6">
        {/* Budget Information Card */}
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
                <p className="text-base font-semibold text-blue-600">{formatCurrency(budget.total_amount)}</p>
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

        {/* Budget Values */}
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
              <p className="text-3xl font-bold text-blue-600">{formatCurrency(valorTotalAtual.toString())}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Total: {formatCurrency(budget.total_amount)} + Entrada: {formatCurrency(budget.valor_remanejado_entrada || '0')}
              </p>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
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

        {/* Budget Movements History */}
        <BudgetMovementHistory 
          budgetId={budget.id} 
          onNewMovement={handleNewMovement} 
          onMovementChange={async () => {
            // Recarregar dados do orçamento quando há mudanças nas movimentações
            const updatedBudget = await fetchBudgetById(budgetId)
            setBudget(updatedBudget)
          }}
        />

        {/* Budget Lines */}
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

      {/* Budget Movement Form Modal */}
      <BudgetMovementForm
        isOpen={isMovementFormOpen}
        onClose={handleCloseMovementForm}
        onSubmit={handleMovementSubmit}
        budgets={budgets}
        isLoading={isSubmitting}
        currentBudgetId={budgetId}
      />

      {/* Budget Line Form Modal */}
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

      {/* Delete Confirmation Dialog */}
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
  )
}