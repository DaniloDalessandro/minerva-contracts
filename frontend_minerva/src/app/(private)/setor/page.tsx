"use client";

import React, { useState, useCallback } from "react";
import { CrudTablePage } from "@/components/common/CrudTablePage";
import {
  DirectionForm,
  ManagementForm,
  CoordinationForm,
  directionColumns,
  managementColumns,
  coordinationColumns,
  type Direction,
  type Management,
  type Coordination,
} from "@/features/setor";
import { SetorService } from "@/services";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function SetoresPage() {
  // Active tab state
  const [activeTab, setActiveTab] = useState("directions");

  // Shared refresh states for form data
  const [directionsForForm, setDirectionsForForm] = useState<Direction[]>([]);
  const [managementsForForm, setManagementsForForm] = useState<Management[]>([]);
  const [coordinationsForForm, setCoordinationsForForm] = useState<Coordination[]>([]);

  // Service adapters
  const directionServiceAdapter = {
    fetch: SetorService.fetchDirections,
    create: SetorService.createDirection,
    update: SetorService.updateDirection,
    delete: SetorService.deleteDirection,
  };

  const managementServiceAdapter = {
    fetch: SetorService.fetchManagements,
    create: SetorService.createManagement,
    update: SetorService.updateManagement,
    delete: SetorService.deleteManagement,
  };

  const coordinationServiceAdapter = {
    fetch: SetorService.fetchCoordinations,
    create: SetorService.createCoordination,
    update: SetorService.updateCoordination,
    delete: SetorService.deleteCoordination,
  };

  // Callback to update directions list for form validation
  const handleDirectionsLoaded = useCallback((items: Direction[]) => {
    setDirectionsForForm(items);
  }, []);

  // Callback to update managements list for form validation
  const handleManagementsLoaded = useCallback((items: Management[]) => {
    setManagementsForForm(items);
  }, []);

  // Callback to update coordinations list for form validation
  const handleCoordinationsLoaded = useCallback((items: Coordination[]) => {
    setCoordinationsForForm(items);
  }, []);

  return (
    <div className="w-full py-1">
      <Tabs
        defaultValue="directions"
        className="w-full"
        onValueChange={setActiveTab}
      >
        <TabsList className="grid w-full grid-cols-3 gap-2 bg-muted p-1 h-auto">
          <TabsTrigger
            value="directions"
            className="flex items-center justify-center px-4 py-3 text-sm font-medium transition-all duration-200
                       bg-background text-muted-foreground rounded-md border border-transparent
                       hover:bg-accent hover:text-accent-foreground
                       data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700
                       data-[state=active]:border-blue-200 data-[state=active]:shadow-sm"
          >
            Direções
          </TabsTrigger>
          <TabsTrigger
            value="managements"
            className="flex items-center justify-center px-4 py-3 text-sm font-medium transition-all duration-200
                       bg-background text-muted-foreground rounded-md border border-transparent
                       hover:bg-accent hover:text-accent-foreground
                       data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700
                       data-[state=active]:border-blue-200 data-[state=active]:shadow-sm"
          >
            Gerências
          </TabsTrigger>
          <TabsTrigger
            value="coordinations"
            className="flex items-center justify-center px-4 py-3 text-sm font-medium transition-all duration-200
                       bg-background text-muted-foreground rounded-md border border-transparent
                       hover:bg-accent hover:text-accent-foreground
                       data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700
                       data-[state=active]:border-blue-200 data-[state=active]:shadow-sm"
          >
            Coordenações
          </TabsTrigger>
        </TabsList>

        <TabsContent value="directions">
          <CrudTablePage<Direction>
            columns={directionColumns()}
            service={directionServiceAdapter}
            entityName="direção"
            entityNamePlural="direções"
            title="Direções"
            FormComponent={DirectionForm}
            formProps={{
              existingNames: directionsForForm.map((d) => d.name),
            }}
            onLoadSuccess={handleDirectionsLoaded}
            initialStatusFilter=""
            deleteDialogTitle="Confirmar inativação"
            deleteDialogDescription={(direction) =>
              `Tem certeza que deseja inativar a direção "${direction.name}"?`
            }
            refreshKey="setores-directions"
          />
        </TabsContent>

        <TabsContent value="managements">
          <CrudTablePage<Management>
            columns={managementColumns()}
            service={managementServiceAdapter}
            entityName="gerência"
            entityNamePlural="gerências"
            title="Gerências"
            FormComponent={ManagementForm}
            formProps={{
              existingNames: managementsForForm.map((m) => m.name),
            }}
            onLoadSuccess={handleManagementsLoaded}
            initialStatusFilter=""
            deleteDialogTitle="Confirmar inativação"
            deleteDialogDescription={(management) =>
              `Tem certeza que deseja inativar a gerência "${management.name}"?`
            }
            refreshKey="setores-managements"
          />
        </TabsContent>

        <TabsContent value="coordinations">
          <CrudTablePage<Coordination>
            columns={coordinationColumns()}
            service={coordinationServiceAdapter}
            entityName="coordenação"
            entityNamePlural="coordenações"
            title="Coordenações"
            FormComponent={CoordinationForm}
            formProps={{
              existingNames: coordinationsForForm.map((c) => c.name),
            }}
            onLoadSuccess={handleCoordinationsLoaded}
            initialStatusFilter=""
            deleteDialogTitle="Confirmar inativação"
            deleteDialogDescription={(coordination) =>
              `Tem certeza que deseja inativar a coordenação "${coordination.name}"?`
            }
            refreshKey="setores-coordinations"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
