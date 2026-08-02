"use client";

import React, { useState, useCallback } from "react";
import { CrudTablePage } from "@/components/common/CrudTablePage";
import { usePermissions } from "@/hooks";
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
import { Building2, Compass, Briefcase, GitBranch } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function SetoresPage() {
  const { canManageSetor } = usePermissions()


  const [directionsForForm, setDirectionsForForm] = useState<Direction[]>([]);
  const [managementsForForm, setManagementsForForm] = useState<Management[]>([]);
  const [coordinationsForForm, setCoordinationsForForm] = useState<Coordination[]>([]);


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


  const handleDirectionsLoaded = useCallback((items: Direction[]) => {
    setDirectionsForForm(items);
  }, []);


  const handleManagementsLoaded = useCallback((items: Management[]) => {
    setManagementsForForm(items);
  }, []);


  const handleCoordinationsLoaded = useCallback((items: Coordination[]) => {
    setCoordinationsForForm(items);
  }, []);

  return (
    <div className="w-full py-1">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-primary"><Building2 className="h-8 w-8" /></span>
        <div>
          <h1 className="text-xl font-semibold">Setores</h1>
          <p className="text-sm text-muted-foreground">Gerenciamento de direções, gerências e coordenações</p>
        </div>
      </div>
      <Tabs
        defaultValue="directions"
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-3 gap-2 bg-muted p-1 h-auto">
          <TabsTrigger
            value="directions"
            className="flex items-center justify-center px-4 py-3 text-sm font-medium transition-all duration-200
                       bg-background text-muted-foreground rounded-md border border-transparent
                       hover:bg-accent hover:text-accent-foreground
                       data-[state=active]:bg-primary/10 data-[state=active]:text-primary
                       data-[state=active]:border-primary/20 data-[state=active]:shadow-sm"
          >
            Direções
          </TabsTrigger>
          <TabsTrigger
            value="managements"
            className="flex items-center justify-center px-4 py-3 text-sm font-medium transition-all duration-200
                       bg-background text-muted-foreground rounded-md border border-transparent
                       hover:bg-accent hover:text-accent-foreground
                       data-[state=active]:bg-primary/10 data-[state=active]:text-primary
                       data-[state=active]:border-primary/20 data-[state=active]:shadow-sm"
          >
            Gerências
          </TabsTrigger>
          <TabsTrigger
            value="coordinations"
            className="flex items-center justify-center px-4 py-3 text-sm font-medium transition-all duration-200
                       bg-background text-muted-foreground rounded-md border border-transparent
                       hover:bg-accent hover:text-accent-foreground
                       data-[state=active]:bg-primary/10 data-[state=active]:text-primary
                       data-[state=active]:border-primary/20 data-[state=active]:shadow-sm"
          >
            Coordenações
          </TabsTrigger>
        </TabsList>

        <TabsContent value="directions">
          <CrudTablePage<Direction>
            columns={directionColumns()}
            service={directionServiceAdapter}
            readOnly={!canManageSetor}
            entityName="direção"
            entityNamePlural="direções"
            title="Direções"
            titleIcon={<Compass className="h-8 w-8" />}
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

        <TabsContent value="managements">
          <CrudTablePage<Management>
            columns={managementColumns()}
            service={managementServiceAdapter}
            readOnly={!canManageSetor}
            entityName="gerência"
            entityNamePlural="gerências"
            title="Gerências"
            titleIcon={<Briefcase className="h-8 w-8" />}
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
            hideRowActionsUntilSelected
            defaultVisibleColumnIds={[
              "name",
              "direction.name",
              "is_active",
              "created_at",
              "updated_at",
            ]}
          />
        </TabsContent>

        <TabsContent value="coordinations">
          <CrudTablePage<Coordination>
            columns={coordinationColumns()}
            service={coordinationServiceAdapter}
            readOnly={!canManageSetor}
            entityName="coordenação"
            entityNamePlural="coordenações"
            title="Coordenações"
            titleIcon={<GitBranch className="h-8 w-8" />}
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
            hideRowActionsUntilSelected
            defaultVisibleColumnIds={[
              "name",
              "management.name",
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
