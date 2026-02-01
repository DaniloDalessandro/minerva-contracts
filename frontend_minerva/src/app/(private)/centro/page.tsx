"use client";

import React, { useState, useCallback } from "react";
import { CrudTablePage } from "@/components/common/CrudTablePage";
import {
  ManagementCenterForm,
  RequestingCenterForm,
  managementCenterColumns,
  requestingCenterColumns,
  type ManagementCenter,
  type RequestingCenter,
} from "@/features/centro";
import { CenterService } from "@/services";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function CentrosPage() {
  // Active tab state
  const [activeTab, setActiveTab] = useState("management-centers");

  // Shared data for form validation
  const [managementCentersForForm, setManagementCentersForForm] = useState<ManagementCenter[]>([]);
  const [requestingCentersForForm, setRequestingCentersForForm] = useState<RequestingCenter[]>([]);

  // Service adapters
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

  // Callbacks to update lists for form validation
  const handleManagementCentersLoaded = useCallback((items: ManagementCenter[]) => {
    setManagementCentersForForm(items);
  }, []);

  const handleRequestingCentersLoaded = useCallback((items: RequestingCenter[]) => {
    setRequestingCentersForForm(items);
  }, []);

  return (
    <div className="w-full py-1">
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
                       data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700
                       data-[state=active]:border-blue-200 data-[state=active]:shadow-sm"
          >
            Centros Gestores
          </TabsTrigger>
          <TabsTrigger
            value="requesting-centers"
            className="flex items-center justify-center px-4 py-3 text-sm font-medium transition-all duration-200
                       bg-background text-muted-foreground rounded-md border border-transparent
                       hover:bg-accent hover:text-accent-foreground
                       data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700
                       data-[state=active]:border-blue-200 data-[state=active]:shadow-sm"
          >
            Centros Solicitantes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="management-centers">
          <CrudTablePage<ManagementCenter>
            columns={managementCenterColumns()}
            service={managementCenterServiceAdapter}
            entityName="centro gestor"
            entityNamePlural="centros gestores"
            title="Centros Gestores"
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
          />
        </TabsContent>

        <TabsContent value="requesting-centers">
          <CrudTablePage<RequestingCenter>
            columns={requestingCenterColumns()}
            service={requestingCenterServiceAdapter}
            entityName="centro solicitante"
            entityNamePlural="centros solicitantes"
            title="Centros Solicitantes"
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
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
