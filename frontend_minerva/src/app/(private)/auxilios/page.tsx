"use client";

import React from "react";
import { CrudTablePage } from "@/components/common/CrudTablePage";
import { AuxilioForm, auxilioColumns, type Auxilio } from "@/features/auxilios";
import { AuxilioService } from "@/services";

export default function AuxiliosPage() {
  // Custom view details handler - opens in new tab
  const handleViewDetails = (auxilio: Auxilio) => {
    window.open(`/auxilios/${auxilio.id}`, "_blank");
  };

  // Service adapter to match CrudService interface
  const auxilioServiceAdapter = {
    fetch: AuxilioService.fetchAuxilios,
    create: AuxilioService.createAuxilio,
    update: AuxilioService.updateAuxilio,
    delete: AuxilioService.deleteAuxilio,
  };

  return (
    <CrudTablePage<Auxilio>
      columns={auxilioColumns}
      service={auxilioServiceAdapter}
      entityName="auxílio"
      entityNamePlural="auxílios"
      title="Auxílios"
      FormComponent={AuxilioForm}
      onViewDetails={handleViewDetails}
      deleteDialogTitle="Confirmar exclusão"
      deleteDialogDescription={(auxilio) => (
        <>
          Tem certeza que deseja excluir o auxílio de{" "}
          <strong>{auxilio.type}</strong> para o colaborador{" "}
          <strong>{auxilio.employee?.full_name}</strong>?
          <br />
          <br />
          Esta ação não pode ser desfeita.
        </>
      )}
      deleteDialogConfirmText="Excluir"
      refreshKey="auxilios"
      initialStatusFilter="ATIVO"
    />
  );
}
