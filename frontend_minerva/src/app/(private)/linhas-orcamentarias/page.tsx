"use client";

import React from "react";
import { ListChecks } from "lucide-react";
import { CrudTablePage } from "@/components/common/CrudTablePage";
import { budgetLineColumns, BudgetLineForm, type BudgetLine } from "@/features/orcamento";
import { BudgetLineService } from "@/services";
import { usePermissions } from "@/hooks";

export default function LinhasOrcamentariasPage() {
  const { canManageLinhas } = usePermissions()


  const handleViewDetails = (budgetLine: BudgetLine) => {
    window.open(`/linhas-orcamentarias/${budgetLine.id}`, "_blank");
  };


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
      readOnly={!canManageLinhas}
      entityName="linha orçamentária"
      entityNamePlural="linhas orçamentárias"
      title="Linhas Orçamentárias"
      titleIcon={<ListChecks className="h-8 w-8" />}
      subtitle="Gerenciamento de linhas orçamentárias"
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
      hideRowActionsUntilSelected
      defaultVisibleColumnIds={[
        "budget.name",
        "category",
        "summary_description",
        "budgeted_amount",
        "status",
      ]}
    />
  );
}
