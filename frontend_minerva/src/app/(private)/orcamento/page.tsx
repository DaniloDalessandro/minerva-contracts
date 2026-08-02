"use client";

import React from "react";
import { BarChart2 } from "lucide-react";
import { CrudTablePage } from "@/components/common/CrudTablePage";
import { budgetColumns, BudgetForm, type Budget } from "@/features/orcamento";
import { BudgetService } from "@/services";
import { usePermissions } from "@/hooks";

export default function BudgetPage() {
  const { canManageOrcamento } = usePermissions()


  const handleViewDetails = (budget: Budget) => {
    window.open(`/orcamento/${budget.id}`, "_blank");
  };




  const budgetServiceAdapter = {
    fetch: BudgetService.fetchBudgets,
    create: BudgetService.createBudget,
    update: (data: any) => {
      const { id, ...restData } = data;
      return BudgetService.updateBudget(id, restData);
    },
    delete: async (id: number) => {
      await BudgetService.deleteBudget(id);
    },
  };

  return (
    <CrudTablePage<Budget>
      columns={budgetColumns}
      service={budgetServiceAdapter}
      readOnly={!canManageOrcamento}
      entityName="orçamento"
      entityNamePlural="orçamentos"
      title="Orçamentos"
      titleIcon={<BarChart2 className="h-8 w-8" />}
      subtitle="Gerenciamento de orçamentos anuais"
      FormComponent={BudgetForm}
      onViewDetails={handleViewDetails}
      deleteDialogTitle="Confirmar exclusão"
      deleteDialogDescription={(budget) => (
        <>
          Tem certeza que deseja excluir o orçamento do ano{" "}
          <strong>{budget.year}</strong>?
          <br />
          <br />
          Esta ação não pode ser desfeita.
        </>
      )}
      deleteDialogConfirmText="Excluir"
      refreshKey="orcamentos"
      initialStatusFilter=""
      hideRowActionsUntilSelected
      defaultVisibleColumnIds={[
        "year",
        "management_center",
        "category",
        "total_amount",
        "status",
      ]}
    />
  );
}
