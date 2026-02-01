"use client";

import React from "react";
import { CrudTablePage } from "@/components/common/CrudTablePage";
import { contractColumns, ContractForm, type Contract } from "@/features/contratos";
import { ContractService } from "@/services";

export default function ContratosPage() {
  // Custom view details handler - opens in new tab
  const handleViewDetails = (contract: Contract) => {
    window.open(`/contratos/${contract.id}`, "_blank");
  };

  // Custom delete dialog messages based on status
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

  // Service adapter to match CrudService interface
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
      entityName="contrato"
      entityNamePlural="contratos"
      title="Contratos"
      FormComponent={ContractForm}
      initialStatusFilter="ALL"
      onViewDetails={handleViewDetails}
      deleteDialogTitle={getDeleteDialogTitle}
      deleteDialogDescription={getDeleteDialogDescription}
      deleteDialogConfirmText="Confirmar"
      refreshKey="contratos"
    />
  );
}
