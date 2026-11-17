"use client";

import React from "react";
import { FileText } from "lucide-react";
import { CrudTablePage, type CrudListProps } from "@/components/common/CrudTablePage";
import { contractColumns, ContractForm, type Contract } from "@/features/contratos";
import { ContractService } from "@/services";
import { usePermissions } from "@/hooks";

import { ContractCards } from "@/features/contratos/components/ContractCards";

const contractServiceAdapter = {
  fetch: ContractService.fetchContracts,
  create: ContractService.createContract,
  update: ContractService.updateContract,
  toggleStatus: ContractService.toggleStatus,
};

const renderContractCards = (props: CrudListProps<Contract>) => <ContractCards {...props} />;

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



  return (
    <CrudTablePage<Contract>
      columns={contractColumns}
      renderList={renderContractCards}
      service={contractServiceAdapter}
      readOnly={!canManageContratos}
      entityName="contrato"
      entityNamePlural="contratos"
      title="Contratos"
      titleIcon={<FileText className="h-8 w-8" />}
      subtitle="Gerenciamento de contratos e fiscalizações"
      editStorageKey="editContractId"
      fetchEditItem={ContractService.fetchContractById}
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
