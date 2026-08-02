"use client";

import React from "react";
import { DataTable } from "@/components/ui/data-table";
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

export interface CrudTablePageProps<T> {

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
  refreshKey,
  addLabel,
  hideRowActionsUntilSelected = false,
  defaultVisibleColumnIds,
}: CrudTablePageProps<T>) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const crud = useCrudTable<T>({
    service,
    initialPageSize,
    initialStatusFilter,
    onLoadSuccess,
  });

  useRegisterRefresh(refreshKey ?? "", crud.loadItems);


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
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };


  const handleConfirmDelete = async () => {
    if (!crud.itemToDelete?.id) return;

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
    } catch {
    } finally {
      crud.setDeleteDialogOpen(false);
      crud.setItemToDelete(null);
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

  return (
    <div className="w-full py-1">
      <div className="space-y-2">
        <DataTable
          columns={columns}
          data={crud.items}
          title={title}
          titleIcon={titleIcon}
          subtitle={subtitle}
          pageSize={crud.pageSize}
          pageIndex={crud.page - 1}
          totalCount={crud.totalCount}
          initialFilters={crud.initialFilters}
          onPageChange={crud.handlePageChange}
          onPageSizeChange={crud.handlePageSizeChange}
          onAdd={readOnly ? undefined : handleAdd}
          addLabel={addLabel}
          onEdit={readOnly ? undefined : handleEdit}
          onDelete={readOnly ? undefined : handleDelete}
          onViewDetails={onViewDetails}
          onFilterChange={crud.handleFilterChange}
          onSortingChange={crud.handleSortingChange}
          readOnly={readOnly}
          hideRowActionsUntilSelected={hideRowActionsUntilSelected}
          defaultVisibleColumnIds={defaultVisibleColumnIds}
        />

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
              <AlertDialogAction onClick={handleConfirmDelete}>
                {deleteDialogConfirmText}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
