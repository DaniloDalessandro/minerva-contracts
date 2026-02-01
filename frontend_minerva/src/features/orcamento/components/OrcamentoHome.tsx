"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DataTable } from "@/components/ui/data-table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
import { Plus, Search } from "lucide-react"
import { 
  Budget, 
  BudgetMovement,
  fetchBudgets,
  getBudgetMovements,
  createBudget,
  createBudgetMovement,
  updateBudget,
  updateBudgetMovement,
  deleteBudget,
  deleteBudgetMovement,
  CreateBudgetData,
  CreateBudgetMovementData
} from "@/lib/api/budgets"
import { fetchManagementCenters } from "@/lib/api/centers"
import type { ManagementCenter } from "@/types/entities/center"
import { budgetColumns, budgetMovementColumns } from "./budget-detail-columns"
import BudgetForm from "./BudgetForm"
import { BudgetMovementForm } from "./BudgetMovementForm"
import { useDebounce } from "@/hooks/useDebounce"

type FormType = 'budget' | 'movement' | null

export default function OrcamentoHome() {
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [budgetMovements, setBudgetMovements] = useState<BudgetMovement[]>([])
  const [managementCenters, setManagementCenters] = useState<ManagementCenter[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [formType, setFormType] = useState<FormType>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null)
  const [selectedBudgetMovement, setSelectedBudgetMovement] = useState<BudgetMovement | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState("budgets")
  
  const debouncedSearch = useDebounce(searchTerm, 300)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setIsLoading(true)
      const [budgetsRes, movementsRes, centersRes] = await Promise.all([
        fetchBudgets(),
        getBudgetMovements(),
        fetchManagementCenters(1, 1000)
      ])
      
      setBudgets(budgetsRes.results || budgetsRes)
      setBudgetMovements(movementsRes.results || movementsRes)
      setManagementCenters(centersRes.results || centersRes)
    } catch (error) {
    } finally {
      setIsLoading(false)
    }
  }

  // Manipuladores de orçamento
  const handleEditBudget = (budget: Budget) => {
    setSelectedBudget(budget)
    setFormType('budget')
    setIsFormOpen(true)
  }

  const handleDeleteBudget = (budget: Budget) => {
    setSelectedBudget(budget)
    setFormType('budget')
    setIsDeleteDialogOpen(true)
  }

  const handleBudgetSubmit = async (data: CreateBudgetData) => {
    try {
      setIsSubmitting(true)
      if (selectedBudget) {
        await updateBudget(selectedBudget.id, data)
      } else {
        await createBudget(data)
      }
      await loadData()
      handleCloseForm()
    } catch (error) {
    } finally {
      setIsSubmitting(false)
    }
  }

  // Manipuladores de movimentação de orçamento
  const handleEditBudgetMovement = (movement: BudgetMovement) => {
    setSelectedBudgetMovement(movement)
    setFormType('movement')
    setIsFormOpen(true)
  }

  const handleDeleteBudgetMovement = (movement: BudgetMovement) => {
    setSelectedBudgetMovement(movement)
    setFormType('movement')
    setIsDeleteDialogOpen(true)
  }

  const handleBudgetMovementSubmit = async (data: CreateBudgetMovementData) => {
    try {
      setIsSubmitting(true)
      if (selectedBudgetMovement) {
        await updateBudgetMovement(selectedBudgetMovement.id, data)
      } else {
        await createBudgetMovement(data)
      }
      await loadData()
      handleCloseForm()
    } catch (error) {
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleConfirmDelete = async () => {
    try {
      if (formType === 'budget' && selectedBudget) {
        await deleteBudget(selectedBudget.id)
      } else if (formType === 'movement' && selectedBudgetMovement) {
        await deleteBudgetMovement(selectedBudgetMovement.id)
      }
      await loadData()
      setIsDeleteDialogOpen(false)
      setSelectedBudget(null)
      setSelectedBudgetMovement(null)
      setFormType(null)
    } catch (error) {
    }
  }

  const handleCloseForm = () => {
    setIsFormOpen(false)
    setSelectedBudget(null)
    setSelectedBudgetMovement(null)
    setFormType(null)
  }

  const handleNewBudget = () => {
    setFormType('budget')
    setIsFormOpen(true)
  }

  const handleNewBudgetMovement = () => {
    setFormType('movement')
    setIsFormOpen(true)
  }

  // Filtra os dados com base na pesquisa
  const filteredBudgets = budgets.filter(budget => {
    const centerName = managementCenters.find(mc => mc.id === budget.management_center)?.name || ""
    return (
      budget.category.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      budget.year.toString().includes(debouncedSearch) ||
      centerName.toLowerCase().includes(debouncedSearch.toLowerCase())
    )
  })

  const filteredBudgetMovements = budgetMovements.filter(movement => 
    movement.notes?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
    movement.amount.includes(debouncedSearch)
  )

  const budgetColumnsWithActions = budgetColumns(handleEditBudget, handleDeleteBudget, managementCenters)
  const budgetMovementColumnsWithActions = budgetMovementColumns(handleEditBudgetMovement, handleDeleteBudgetMovement, budgets)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Orçamentos</h1>
          <p className="text-muted-foreground">
            Gerencie orçamentos e suas movimentações
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="budgets">Orçamentos</TabsTrigger>
            <TabsTrigger value="movements">Movimentações</TabsTrigger>
          </TabsList>
          
          <Button onClick={activeTab === 'budgets' ? handleNewBudget : handleNewBudgetMovement}>
            <Plus className="mr-2 h-4 w-4" />
            {activeTab === 'budgets' ? 'Novo Orçamento' : 'Nova Movimentação'}
          </Button>
        </div>

        <div className="flex items-center space-x-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <TabsContent value="budgets">
          <DataTable
            columns={budgetColumnsWithActions}
            data={filteredBudgets}
            isLoading={isLoading}
          />
        </TabsContent>

        <TabsContent value="movements">
          <DataTable
            columns={budgetMovementColumnsWithActions}
            data={filteredBudgetMovements}
            isLoading={isLoading}
          />
        </TabsContent>
      </Tabs>

      {formType === 'budget' && (
        <BudgetForm
          open={isFormOpen}
          handleClose={handleCloseForm}
          onSubmit={handleBudgetSubmit}
          initialData={selectedBudget}
          isSubmitting={isSubmitting}
        />
      )}

      {formType === 'movement' && (
        <BudgetMovementForm
          isOpen={isFormOpen}
          onClose={handleCloseForm}
          onSubmit={handleBudgetMovementSubmit}
          movement={selectedBudgetMovement || undefined}
          budgets={budgets}
          isLoading={isSubmitting}
        />
      )}

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este{" "}
              {formType === 'budget' ? 'orçamento' : 'movimentação'}? 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-red-600 hover:bg-red-700">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}