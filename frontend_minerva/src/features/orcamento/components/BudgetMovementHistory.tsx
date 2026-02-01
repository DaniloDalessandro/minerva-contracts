"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowRightIcon, HistoryIcon, PlusIcon, Pencil, Trash2 } from "lucide-react"
import { BudgetMovement, getBudgetMovementsByBudget, deleteBudgetMovement, updateBudgetMovement } from "@/lib/api/budgets"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface BudgetMovementHistoryProps {
  budgetId: number
  onNewMovement?: () => void
  onMovementChange?: () => void
}

export function BudgetMovementHistory({ budgetId, onNewMovement, onMovementChange }: BudgetMovementHistoryProps) {
  const [movements, setMovements] = useState<BudgetMovement[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editingMovement, setEditingMovement] = useState<BudgetMovement | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [movementToDelete, setMovementToDelete] = useState<BudgetMovement | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editForm, setEditForm] = useState({
    amount: '',
    notes: '',
    source_id: 0,
    destination_id: 0
  })

  useEffect(() => {
    loadMovements()
  }, [budgetId])

  const loadMovements = async () => {
    try {
      setIsLoading(true)
      const data = await getBudgetMovementsByBudget(budgetId)
      setMovements(data)
    } catch (error) {
      setMovements([])
    } finally {
      setIsLoading(false)
    }
  }

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
    })
  }

  const handleEditMovement = (movement: BudgetMovement) => {
    setEditingMovement(movement)
    setEditForm({
      amount: movement.amount.toString(),
      notes: movement.notes || '',
      source_id: movement.source.id,
      destination_id: movement.destination.id
    })
    setIsEditDialogOpen(true)
  }

  const handleDeleteMovement = (movement: BudgetMovement) => {
    setMovementToDelete(movement)
    setIsDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!movementToDelete) return
    
    try {
      setIsSubmitting(true)
      await deleteBudgetMovement(movementToDelete.id)
      await loadMovements() 
      setIsDeleteDialogOpen(false)
      setMovementToDelete(null)
      
      if (onMovementChange) {
        onMovementChange()
      }
    } catch (error) {
      alert('Erro ao excluir movimentação. Tente novamente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const confirmEdit = async () => {
    if (!editingMovement) return
    
    try {
      setIsSubmitting(true)
      await updateBudgetMovement(editingMovement.id, {
        source: editForm.source_id,
        destination: editForm.destination_id,
        amount: editForm.amount,
        notes: editForm.notes
      })
      await loadMovements() 
      setIsEditDialogOpen(false)
      setEditingMovement(null)
      
      if (onMovementChange) {
        onMovementChange()
      }
    } catch (error) {
      alert('Erro ao editar movimentação. Tente novamente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <HistoryIcon className="h-4 w-4" />
            Histórico de Movimentações
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground">Carregando movimentações...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <HistoryIcon className="h-4 w-4" />
            Histórico de Movimentações ({movements.filter(m => m.source?.id === budgetId || m.destination?.id === budgetId).length})
          </CardTitle>
          {onNewMovement && (
            <Button onClick={onNewMovement} className="flex items-center gap-2">
              <PlusIcon className="h-4 w-4" />
              Nova Movimentação
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {movements.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground">Nenhuma movimentação encontrada</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-bold">Data</TableHead>
                <TableHead className="font-bold">Valor</TableHead>
                <TableHead className="font-bold">Tipo</TableHead>
                <TableHead className="font-bold">Origem</TableHead>
                <TableHead className="font-bold">Destino</TableHead>
                <TableHead className="w-[100px] font-bold">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {movements.filter((movement) => {
                // Mostrar apenas movimentações onde o orçamento atual é origem OU destino
                return movement.source?.id === budgetId || movement.destination?.id === budgetId;
              }).map((movement) => {
                // Determinar a direção da movimentação em relação ao orçamento atual
                const isOutgoing = movement.source?.id === budgetId
                const direction = isOutgoing ? 'SAÍDA' : 'ENTRADA'
                const relatedBudget = isOutgoing ? movement.destination : movement.source
                
                return (
                  <TableRow key={movement.id}>
                    <TableCell>
                      <span className="text-sm">
                        {formatDate(movement.movement_date)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {formatCurrency(movement.amount)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {direction}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {movement.source?.category}-{movement.source?.year}-{movement.source?.management_center?.name || 'N/A'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {movement.destination?.category}-{movement.destination?.year}-{movement.destination?.management_center?.name || 'N/A'}
                        {movement.notes && (
                          <div className="text-xs text-muted-foreground mt-1">
                            <span className="font-medium">Obs:</span> {movement.notes}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditMovement(movement)}
                          className="h-8 w-8 p-0"
                          title="Editar"
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteMovement(movement)}
                          className="h-8 w-8 p-0"
                          title="Excluir"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>

      {/* Diálogo de Edição de Movimentação */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Movimentação</DialogTitle>
          </DialogHeader>
          
          {editingMovement && (
            <div className="space-y-4">
              {/* Informações sobre a movimentação atual */}
              <div className="p-3 bg-muted rounded-lg space-y-2">
                <div className="text-sm font-medium">Movimentação atual:</div>
                <div className="text-sm text-muted-foreground space-y-1">
                  <div>Data: {formatDate(editingMovement.movement_date)}</div>
                  <div>ID da movimentação: {editingMovement.id}</div>
                  <div className="flex items-center gap-2">
                    <span>De: {editingMovement.source?.category} {editingMovement.source?.year}</span>
                    <ArrowRightIcon className="h-3 w-3" />
                    <span>Para: {editingMovement.destination?.category} {editingMovement.destination?.year}</span>
                  </div>
                  {editingMovement.source?.management_center?.name && (
                    <div>Centro de origem: {editingMovement.source.management_center.name}</div>
                  )}
                  {editingMovement.destination?.management_center?.name && (
                    <div>Centro de destino: {editingMovement.destination.management_center.name}</div>
                  )}
                </div>
              </div>

              {/* Informação sobre qual orçamento está visualizando */}
              <div className="p-2 bg-blue-50 border border-blue-200 rounded text-sm">
                <div className="font-medium text-blue-800">
                  {editingMovement.source?.id === budgetId 
                    ? `Esta é uma SAÍDA do orçamento atual para ${editingMovement.destination?.category} ${editingMovement.destination?.year}`
                    : `Esta é uma ENTRADA no orçamento atual vinda de ${editingMovement.source?.category} ${editingMovement.source?.year}`
                  }
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="amount">Valor</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={editForm.amount}
                  onChange={(e) => setEditForm({...editForm, amount: e.target.value})}
                  placeholder="0.00"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="notes">Observações</Label>
                <Textarea
                  id="notes"
                  value={editForm.notes}
                  onChange={(e) => setEditForm({...editForm, notes: e.target.value})}
                  placeholder="Observações sobre a movimentação..."
                  rows={3}
                />
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsEditDialogOpen(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button onClick={confirmEdit} disabled={isSubmitting}>
              {isSubmitting ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de Exclusão de Movimentação */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
          </DialogHeader>
          
          {movementToDelete && (
            <div className="space-y-3">
              <p className="text-sm">
                Tem certeza que deseja excluir esta movimentação?
              </p>
              
              <div className="p-3 bg-muted rounded-lg space-y-2">
                <div className="text-sm space-y-1">
                  <div>Data: {formatDate(movementToDelete.movement_date)}</div>
                  <div>Valor: {formatCurrency(movementToDelete.amount)}</div>
                  
                  <div className="flex items-center gap-2">
                    <span>De: {movementToDelete.source?.category} {movementToDelete.source?.year}</span>
                    <ArrowRightIcon className="h-3 w-3" />
                    <span>Para: {movementToDelete.destination?.category} {movementToDelete.destination?.year}</span>
                  </div>
                  
                  {movementToDelete.notes && (
                    <div>Observações: {movementToDelete.notes}</div>
                  )}
                </div>
              </div>
              
              <p className="text-xs text-muted-foreground">
                Esta ação não pode ser desfeita.
              </p>
            </div>
          )}
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDelete} 
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Excluindo...' : 'Excluir'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}