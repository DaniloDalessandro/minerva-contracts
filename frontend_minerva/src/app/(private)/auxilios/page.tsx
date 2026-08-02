"use client";

import React from "react";
import { HandCoins } from "lucide-react";
import { CrudTablePage } from "@/components/common/CrudTablePage";
import { usePermissions } from "@/hooks";
import { AuxilioForm, auxilioColumns, type Auxilio } from "@/features/auxilios";
import { AuxilioService } from "@/services";

export default function AuxiliosPage() {
  const { canManageAuxilios } = usePermissions()


  const handleViewDetails = (auxilio: Auxilio) => {
    window.open(`/auxilios/${auxilio.id}`, "_blank");
  };


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
      readOnly={!canManageAuxilios}
      entityName="auxílio"
      entityNamePlural="auxílios"
      title="Auxílios"
      titleIcon={<HandCoins className="h-8 w-8" />}
      subtitle="Gerenciamento de auxílios educacionais e benefícios"
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
      hideRowActionsUntilSelected
      defaultVisibleColumnIds={[
        "employee.full_name",
        "type",
        "total_amount",
        "start_date",
        "status",
      ]}
    />
  );
}
