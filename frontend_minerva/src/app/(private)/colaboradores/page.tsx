"use client";

import React from "react";
import { Users } from "lucide-react";
import { CrudTablePage } from "@/components/common/CrudTablePage";
import { usePermissions } from "@/hooks";
import {
  colaboradorColumns,
  ColaboradorForm,
  type Colaborador,
} from "@/features/colaboradores";
import { ColaboradorService } from "@/services";

export default function ColaboradoresPage() {
  const { canManageColaboradores } = usePermissions()


  const handleViewDetails = (colaborador: Colaborador) => {
    window.open(`/colaboradores/${colaborador.id}`, "_blank");
  };


  const getDeleteDialogTitle = (colaborador: Colaborador) => {
    return colaborador.status === "ATIVO"
      ? "Inativar colaborador"
      : "Ativar colaborador";
  };

  const getDeleteDialogDescription = (colaborador: Colaborador) => {
    return (
      <>
        Tem certeza que deseja{" "}
        {colaborador.status === "ATIVO" ? "inativar" : "ativar"} o colaborador{" "}
        <strong>{colaborador.full_name}</strong>?
        {colaborador.cpf && <> (CPF: {colaborador.cpf})</>}
        <br />
        <br />
        {colaborador.status === "ATIVO"
          ? "O colaborador será marcado como inativo e não aparecerá na listagem padrão."
          : "O colaborador será reativado e voltará a aparecer na listagem padrão."}
      </>
    );
  };


  const colaboradorServiceAdapter = {
    fetch: ColaboradorService.fetchColaboradores,
    create: ColaboradorService.createColaborador,
    update: ColaboradorService.updateColaborador,
    toggleStatus: ColaboradorService.toggleStatus,
  };

  return (
    <CrudTablePage<Colaborador>
      columns={colaboradorColumns}
      service={colaboradorServiceAdapter}
      readOnly={!canManageColaboradores}
      entityName="colaborador"
      entityNamePlural="colaboradores"
      title="Colaboradores"
      titleIcon={<Users className="h-8 w-8" />}
      subtitle="Gerencie os colaboradores cadastrados no sistema"
      FormComponent={ColaboradorForm}
      initialPageSize={15}
      initialStatusFilter="ATIVO"
      onViewDetails={handleViewDetails}
      deleteDialogTitle={getDeleteDialogTitle}
      deleteDialogDescription={getDeleteDialogDescription}
      deleteDialogConfirmText="Confirmar"
      refreshKey="colaboradores"
      hideRowActionsUntilSelected
    />
  );
}
