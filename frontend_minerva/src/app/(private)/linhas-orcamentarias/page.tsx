"use client";

import React from "react";
import { CrudTablePage } from "@/components/common/CrudTablePage";
import { budgetLineColumns, BudgetLineForm, type BudgetLine } from "@/features/orcamento";
import { BudgetLineService } from "@/services";

export default function LinhasOrcamentariasPage() {
  // Custom view details handler - opens in new tab
  const handleViewDetails = (budgetLine: BudgetLine) => {
    window.open(`/linhas-orcamentarias/${budgetLine.id}`, "_blank");
  };

  // Service adapter to match CrudService interface
  const budgetLineServiceAdapter = {
    fetch: BudgetLineService.fetchBudgetLines,
    create: BudgetLineService.createBudgetLine,
    update: BudgetLineService.updateBudgetLine,
    delete: BudgetLineService.deleteBudgetLine,
  };

  return (
    <CrudTablePage<BudgetLine>
      columns={budgetLineColumns}
      service={budgetLineServiceAdapter}
      entityName="linha orçamentária"
      entityNamePlural="linhas orçamentárias"
      title="Linhas Orçamentárias"
      FormComponent={BudgetLineForm}
      onViewDetails={handleViewDetails}
      deleteDialogTitle="Confirmar exclusão"
      deleteDialogDescription={(budgetLine) => (
        <>
          Tem certeza que deseja excluir a linha orçamentária{" "}
          <strong>{budgetLine.summary_description}</strong>?
          <br />
          <br />
          Esta ação não pode ser desfeita.
        </>
      )}
      deleteDialogConfirmText="Excluir"
      refreshKey="linhas-orcamentarias"
      initialStatusFilter=""
    />
  );
}
