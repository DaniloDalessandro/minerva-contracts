"use client";

import React, { useState, useCallback } from "react";
import { CrudTablePage } from "@/components/common/CrudTablePage";
import { usePermissions } from "@/hooks";
import {
  ManagementCenterForm,
  RequestingCenterForm,
  managementCenterColumns,
  requestingCenterColumns,
  type ManagementCenter,
  type RequestingCenter,
} from "@/features/centro";
import { CenterService } from "@/services";
import { Building, Building2, MapPin } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function CentrosPage() {
  const { canManageCentro } = usePermissions()


  const [activeTab, setActiveTab] = useState("management-centers");


  const [managementCentersForForm, setManagementCentersForForm] = useState<ManagementCenter[]>([]);
  const [requestingCentersForForm, setRequestingCentersForForm] = useState<RequestingCenter[]>([]);


  const managementCenterServiceAdapter = {
    fetch: CenterService.fetchManagementCenters,
    create: CenterService.createManagementCenter,
    update: CenterService.updateManagementCenter,
    delete: CenterService.deleteManagementCenter,
  };

  const requestingCenterServiceAdapter = {
    fetch: CenterService.fetchRequestingCenters,
    create: CenterService.createRequestingCenter,
    update: CenterService.updateRequestingCenter,
    delete: CenterService.deleteRequestingCenter,
  };


  const handleManagementCentersLoaded = useCallback((items: ManagementCenter[]) => {
    setManagementCentersForForm(items);
  }, []);

  const handleRequestingCentersLoaded = useCallback((items: RequestingCenter[]) => {
    setRequestingCentersForForm(items);
  }, []);

  return (
    <div className="w-full py-1">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-primary"><Building className="h-8 w-8" /></span>
        <div>
          <h1 className="text-xl font-semibold">Centros</h1>
          <p className="text-sm text-muted-foreground">Gerenciamento de centros gestores e solicitantes</p>
        </div>
      </div>
      <Tabs
        defaultValue="management-centers"
        className="w-full"
        onValueChange={setActiveTab}
      >
        <TabsList className="grid w-full grid-cols-2 gap-2 bg-muted p-1 h-auto">
          <TabsTrigger
            value="management-centers"
            className="flex items-center justify-center px-4 py-3 text-sm font-medium transition-all duration-200
                       bg-background text-muted-foreground rounded-md border border-transparent
                       hover:bg-accent hover:text-accent-foreground
                       data-[state=active]:bg-primary/10 data-[state=active]:text-primary
                       data-[state=active]:border-primary/20 data-[state=active]:shadow-sm"
          >
            Centros Gestores
          </TabsTrigger>
          <TabsTrigger
            value="requesting-centers"
            className="flex items-center justify-center px-4 py-3 text-sm font-medium transition-all duration-200
                       bg-background text-muted-foreground rounded-md border border-transparent
                       hover:bg-accent hover:text-accent-foreground
                       data-[state=active]:bg-primary/10 data-[state=active]:text-primary
                       data-[state=active]:border-primary/20 data-[state=active]:shadow-sm"
          >
            Centros Solicitantes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="management-centers">
          <CrudTablePage<ManagementCenter>
            columns={managementCenterColumns()}
            service={managementCenterServiceAdapter}
            readOnly={!canManageCentro}
            entityName="centro gestor"
            entityNamePlural="centros gestores"
            title="Centros Gestores"
            titleIcon={<Building2 className="h-8 w-8" />}
            subtitle="Gerenciamento de centros gestores"
            FormComponent={ManagementCenterForm}
            formProps={{
              existingNames: managementCentersForForm.map((c) => c.name),
            }}
            onLoadSuccess={handleManagementCentersLoaded}
            deleteDialogTitle="Confirmar inativação"
            deleteDialogDescription={(center) =>
              `Tem certeza que deseja inativar o centro gestor "${center.name}"?`
            }
            refreshKey="centros"
            hideRowActionsUntilSelected
            defaultVisibleColumnIds={[
              "name",
              "is_active",
              "created_at",
              "updated_at",
              "created_by",
            ]}
          />
        </TabsContent>

        <TabsContent value="requesting-centers">
          <CrudTablePage<RequestingCenter>
            columns={requestingCenterColumns()}
            service={requestingCenterServiceAdapter}
            readOnly={!canManageCentro}
            entityName="centro solicitante"
            entityNamePlural="centros solicitantes"
            title="Centros Solicitantes"
            titleIcon={<MapPin className="h-8 w-8" />}
            subtitle="Gerenciamento de centros solicitantes"
            FormComponent={RequestingCenterForm}
            formProps={{
              existingNames: requestingCentersForForm
                .map((c) => c.name),
            }}
            onLoadSuccess={handleRequestingCentersLoaded}
            deleteDialogTitle="Confirmar inativação"
            deleteDialogDescription={(center) =>
              `Tem certeza que deseja inativar o centro solicitante "${center.name}"?`
            }
            refreshKey="centros"
            hideRowActionsUntilSelected
            defaultVisibleColumnIds={[
              "name",
              "management_center",
              "is_active",
              "created_at",
              "updated_at",
            ]}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
