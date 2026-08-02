"use client";

import React from "react";
import { FileText } from "lucide-react";
import { CrudTablePage } from "@/components/common/CrudTablePage";
import { contractColumns, ContractForm, type Contract } from "@/features/contratos";
import { ContractService } from "@/services";
import { usePermissions } from "@/hooks";

export default function ContratosPage() {
  const { canManageContratos } = usePermissions()


  const handleViewDetails = (contract: Contract) => {
    window.open(`/contratos/${contract.id}`, "_blank");
  };


  const getDeleteDialogTitle = (contract: Contract) => {
    return contract.status === "ATIVO"
      ? "Encerrar contrato"
      : "Ativar contrato";
  };

  const getDeleteDialogDescription = (contract: Contract) => {
    return (
      <>
        Tem certeza que deseja{" "}
        {contract.status === "ATIVO" ? "encerrar" : "ativar"} o contrato{" "}
        <strong>{contract.protocol_number}</strong>?
        <br />
        <br />
        {contract.status === "ATIVO"
          ? "O contrato será marcado como encerrado."
          : "O contrato será reativado."}
      </>
    );
  };


  const contractServiceAdapter = {
    fetch: ContractService.fetchContracts,
    create: ContractService.createContract,
    update: ContractService.updateContract,
    toggleStatus: ContractService.toggleStatus,
  };

  return (
    <CrudTablePage<Contract>
      columns={contractColumns}
      service={contractServiceAdapter}
      readOnly={!canManageContratos}
      entityName="contrato"
      entityNamePlural="contratos"
      title="Contratos"
      titleIcon={<FileText className="h-8 w-8" />}
      subtitle="Gerenciamento de contratos e fiscalizações"
      FormComponent={ContractForm}
      initialStatusFilter="ALL"
      onViewDetails={handleViewDetails}
      deleteDialogTitle={getDeleteDialogTitle}
      deleteDialogDescription={getDeleteDialogDescription}
      deleteDialogConfirmText="Confirmar"
      refreshKey="contratos"
      hideRowActionsUntilSelected
      defaultVisibleColumnIds={[
        "protocol_number",
        "main_inspector.full_name",
        "payment_nature",
        "current_value",
        "status",
      ]}
    />
  );
}
