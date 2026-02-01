"use client";

import React from "react";
import { CrudTablePage } from "@/components/common/CrudTablePage";
import { budgetColumns, BudgetForm, type Budget } from "@/features/orcamento";
import { BudgetService } from "@/services";

export default function BudgetPage() {
  // Custom view details handler - opens in new tab
  const handleViewDetails = (budget: Budget) => {
    window.open(`/orcamento/${budget.id}`, "_blank");
  };

  // Service adapter to match CrudService interface
  // Note: BudgetService.updateBudget has a different signature (id, data)
  // and deleteBudget returns boolean, so we need to adapt both
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
      entityName="orçamento"
      entityNamePlural="orçamentos"
      title="Orçamentos"
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
    />
  );
}
