"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { DataTable, type DataTableProps } from "@/components/ui/data-table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useCrudTable, CrudService, STATUS_FILTER_ALL } from "@/hooks/useCrudTable";
import { useRegisterRefresh } from "@/context";

export type CrudListProps<T> = Omit<DataTableProps<T, unknown>, "columns"> & {
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
};

export interface CrudTablePageProps<T> {
  renderList?: (props: CrudListProps<T>) => React.ReactNode;

  columns: any[];
  service: CrudService<T>;
  entityName: string;
  entityNamePlural: string;
  title: string;


  FormComponent: React.ComponentType<{
    open: boolean;
    handleClose: () => void;
    initialData: T | null;
    onSubmit: (data: any) => Promise<void>;
    isSubmitting?: boolean;
    [key: string]: any;
  }>;


  subtitle?: string;
  titleIcon?: React.ReactNode;
  initialPageSize?: number;
  initialStatusFilter?: string;
  readOnly?: boolean;


  onAdd?: () => void;
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  onViewDetails?: (item: T) => void;
  onSubmit?: (data: any, editingItem: T | null) => Promise<void>;
  onConfirmDelete?: (item: T) => Promise<void>;
  onLoadSuccess?: (items: T[]) => void;


  formProps?: Record<string, any>;


  deleteDialogTitle?: React.ReactNode | ((item: T) => React.ReactNode);
  deleteDialogDescription?: React.ReactNode | ((item: T) => React.ReactNode);
  deleteDialogConfirmText?: string;


  editStorageKey?: string;
  fetchEditItem?: (id: number) => Promise<T>;
  refreshKey?: string;


  addLabel?: string;


  hideRowActionsUntilSelected?: boolean;


  defaultVisibleColumnIds?: string[];
}

export function CrudTablePage<T extends { id: number; [key: string]: any }>({
  columns,
  service,
  entityName,
  entityNamePlural,
  title,
  FormComponent,
  subtitle,
  titleIcon,
  initialPageSize = 10,
  initialStatusFilter = STATUS_FILTER_ALL,
  readOnly = false,
  onAdd,
  onEdit,
  onDelete,
  onViewDetails,
  onSubmit,
  onConfirmDelete,
  onLoadSuccess,
  formProps = {},
  deleteDialogTitle,
  deleteDialogDescription,
  deleteDialogConfirmText = "Confirmar",
  editStorageKey,
  fetchEditItem,
  refreshKey,
  addLabel,
  hideRowActionsUntilSelected = false,
  defaultVisibleColumnIds,
  renderList,
}: CrudTablePageProps<T>) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const [loadError, setLoadError] = React.useState<string | null>(null);
  const handleLoadError = React.useCallback((error: unknown) => {
    setLoadError(error instanceof Error ? error.message : "Não foi possível carregar os registros.");
  }, []);
  const handleLoadSuccess = React.useCallback((items: T[]) => {
    setLoadError(null);
    onLoadSuccess?.(items);
  }, [onLoadSuccess]);

  const crud = useCrudTable<T>({
    service,
    initialPageSize,
    initialStatusFilter,
    onLoadSuccess: handleLoadSuccess,
    onLoadError: handleLoadError,
  });

  useRegisterRefresh(refreshKey ?? "", crud.loadItems);
  const { setEditingItem, setFormOpen } = crud;

  React.useEffect(() => {
    if (readOnly || !editStorageKey || !fetchEditItem) return;
    const pendingId = window.sessionStorage.getItem(editStorageKey);
    if (!pendingId) return;
    window.sessionStorage.removeItem(editStorageKey);
    const id = Number(pendingId);
    if (!Number.isInteger(id) || id <= 0) return;
    fetchEditItem(id).then(item => {
      setEditingItem(item);
      setFormOpen(true);
    }).catch(error => {
      toast({ title: "Não foi possível abrir a edição", description: error instanceof Error ? error.message : "Tente novamente.", variant: "destructive" });
    });
  }, [readOnly, editStorageKey, fetchEditItem, setEditingItem, setFormOpen]);


  const handleAdd = () => {
    if (onAdd) {
      onAdd();
    } else {
      crud.handleAdd();
    }
  };


  const handleEdit = (item: T) => {
    if (onEdit) {
      onEdit(item);
    } else {
      crud.handleEdit(item);
    }
  };


  const handleDelete = (item: T) => {
    if (onDelete) {
      onDelete(item);
    } else {
      crud.handleDelete(item);
    }
  };


  const handleFormSubmit = async (data: any) => {
    try {
      setIsSubmitting(true);

      if (onSubmit) {

        await onSubmit(data, crud.editingItem);
      } else {

        const isEditing = data.id;

        if (isEditing && service.update) {
          await service.update(data);
        } else if (!isEditing && service.create) {
          await service.create(data);
        }
      }


      await crud.loadItems();
      crud.handleCloseForm();
    } catch (error) {
      toast({ title: "Não foi possível salvar", description: error instanceof Error ? error.message : "Tente novamente.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };


  const handleConfirmDelete = async () => {
    if (!crud.itemToDelete?.id || isDeleting) return;
    setIsDeleting(true);

    try {
      if (onConfirmDelete) {

        await onConfirmDelete(crud.itemToDelete);
      } else {

        if (service.toggleStatus) {
          await service.toggleStatus(crud.itemToDelete.id);
        } else if (service.delete) {
          await service.delete(crud.itemToDelete.id);
        }
      }


      await crud.loadItems();


      if (crud.items.length === 1 && crud.page > 1) {
        crud.setPage(crud.page - 1);
      }
      crud.setDeleteDialogOpen(false);
      crud.setItemToDelete(null);
    } catch (error) {
      toast({ title: "Não foi possível concluir a ação", description: error instanceof Error ? error.message : "Tente novamente.", variant: "destructive" });
    } finally {
      setIsDeleting(false);
    }
  };


  const getDeleteDialogTitle = (): React.ReactNode => {
    if (typeof deleteDialogTitle === "function" && crud.itemToDelete) {
      return deleteDialogTitle(crud.itemToDelete) as React.ReactNode;
    }
    return (deleteDialogTitle || `Inativar ${entityName}`) as React.ReactNode;
  };


  const getDeleteDialogDescription = (): React.ReactNode => {
    if (typeof deleteDialogDescription === "function" && crud.itemToDelete) {
      return deleteDialogDescription(crud.itemToDelete) as React.ReactNode;
    }
    return (
      deleteDialogDescription ||
      `Tem certeza que deseja inativar este ${entityName}?`
    ) as React.ReactNode;
  };

  const listProps: DataTableProps<T, unknown> = {
    columns: columns,
    data: crud.items,
    title: title,
    titleIcon: titleIcon,
    subtitle: subtitle,
    pageSize: crud.pageSize,
    pageIndex: crud.page - 1,
    totalCount: crud.totalCount,
    initialFilters: crud.initialFilters,
    onPageChange: crud.handlePageChange,
    onPageSizeChange: crud.handlePageSizeChange,
    onAdd: readOnly ? undefined : handleAdd,
    addLabel: addLabel,
    onEdit: readOnly ? undefined : handleEdit,
    onDelete: readOnly ? undefined : handleDelete,
    onViewDetails: onViewDetails,
    onFilterChange: crud.handleFilterChange,
    onSortingChange: crud.handleSortingChange,
    readOnly: readOnly,
    hideRowActionsUntilSelected: hideRowActionsUntilSelected,
    defaultVisibleColumnIds: defaultVisibleColumnIds,
  };

  return (
    <div className="w-full py-1">
      <div className="space-y-2">
        {renderList ? renderList({
          ...listProps,
          isLoading: crud.isLoading,
          error: loadError,
          onRetry: () => { void crud.loadItems(); },
        }) : loadError ? (
          <div role="alert" className="space-y-3 rounded-xl border border-destructive/30 bg-card p-5">
            <p className="font-medium">Não foi possível carregar {entityNamePlural}.</p>
            <p className="text-sm text-muted-foreground">{loadError}</p>
            <Button variant="outline" disabled={crud.isLoading} onClick={() => { void crud.loadItems(); }}>
              {crud.isLoading ? "Carregando…" : "Tentar novamente"}
            </Button>
          </div>
        ) : <DataTable {...listProps} />}

        <FormComponent
          open={crud.formOpen}
          handleClose={crud.handleCloseForm}
          initialData={crud.editingItem}
          onSubmit={handleFormSubmit}
          isSubmitting={isSubmitting}
          {...formProps}
        />

        <AlertDialog
          open={crud.deleteDialogOpen}
          onOpenChange={crud.setDeleteDialogOpen}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{getDeleteDialogTitle()}</AlertDialogTitle>
              <AlertDialogDescription>
                {getDeleteDialogDescription()}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction disabled={isDeleting} onClick={(event) => { event.preventDefault(); void handleConfirmDelete(); }}>
                {isDeleting ? "Aguarde…" : deleteDialogConfirmText}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
