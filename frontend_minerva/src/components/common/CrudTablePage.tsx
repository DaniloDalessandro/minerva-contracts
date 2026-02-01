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
  // Required props
  columns: any[];
  service: CrudService<T>;
  entityName: string;
  entityNamePlural: string;
  title: string;

  // Form component
  FormComponent: React.ComponentType<{
    open: boolean;
    handleClose: () => void;
    initialData: T | null;
    onSubmit: (data: any) => Promise<void>;
    isSubmitting?: boolean;
    [key: string]: any;
  }>;

  // Optional customization
  subtitle?: string;
  initialPageSize?: number;
  initialStatusFilter?: string;
  readOnly?: boolean;

  // Custom handlers (optional - for complex logic)
  onAdd?: () => void;
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  onViewDetails?: (item: T) => void;
  onSubmit?: (data: any, editingItem: T | null) => Promise<void>;
  onConfirmDelete?: (item: T) => Promise<void>;
  onLoadSuccess?: (items: T[]) => void;

  // Additional form props
  formProps?: Record<string, any>;

  // Delete dialog customization
  deleteDialogTitle?: React.ReactNode | ((item: T) => React.ReactNode);
  deleteDialogDescription?: React.ReactNode | ((item: T) => React.ReactNode);
  deleteDialogConfirmText?: string;

  // Refresh key for sidebar integration
  refreshKey?: string;
}

export function CrudTablePage<T extends { id: number; [key: string]: any }>({
  columns,
  service,
  entityName,
  entityNamePlural,
  title,
  FormComponent,
  subtitle,
  initialPageSize = 10,
  initialStatusFilter = STATUS_FILTER_ALL, // Por padrão, sem filtro (Todos)
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
}: CrudTablePageProps<T>) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const crud = useCrudTable<T>({
    service,
    initialPageSize,
    initialStatusFilter,
    onLoadSuccess,
  });

  // Register refresh if refreshKey is provided
  if (refreshKey) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useRegisterRefresh(refreshKey, crud.loadItems);
  }

  // Handle add - use custom handler if provided
  const handleAdd = () => {
    if (onAdd) {
      onAdd();
    } else {
      crud.handleAdd();
    }
  };

  // Handle edit - use custom handler if provided
  const handleEdit = (item: T) => {
    if (onEdit) {
      onEdit(item);
    } else {
      crud.handleEdit(item);
    }
  };

  // Handle delete - use custom handler if provided
  const handleDelete = (item: T) => {
    if (onDelete) {
      onDelete(item);
    } else {
      crud.handleDelete(item);
    }
  };

  // Handle form submit
  const handleFormSubmit = async (data: any) => {
    try {
      setIsSubmitting(true);

      if (onSubmit) {
        // Use custom submit handler
        await onSubmit(data, crud.editingItem);
      } else {
        // Default submit logic
        const isEditing = data.id;

        if (isEditing && service.update) {
          const result = await service.update(data);
          const updatedItem = (result as any).data || result;
          console.log("✅ Item updated:", updatedItem);
        } else if (!isEditing && service.create) {
          const result = await service.create(data);
          const newItem = (result as any).data || result;
          console.log("✅ Item created:", newItem);
        }
      }

      // Reload items and close form
      await crud.loadItems();
      crud.handleCloseForm();
    } catch (error) {
      console.error(`❌ Error saving ${entityName}:`, error);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle confirm delete
  const handleConfirmDelete = async () => {
    if (!crud.itemToDelete?.id) return;

    try {
      if (onConfirmDelete) {
        // Use custom delete handler
        await onConfirmDelete(crud.itemToDelete);
      } else {
        // Default delete logic
        if (service.toggleStatus) {
          await service.toggleStatus(crud.itemToDelete.id);
        } else if (service.delete) {
          await service.delete(crud.itemToDelete.id);
        }
      }

      // Reload items
      await crud.loadItems();

      // Adjust page if needed
      if (crud.items.length === 1 && crud.page > 1) {
        crud.setPage(crud.page - 1);
      }
    } catch (error) {
      console.error(`❌ Error deleting ${entityName}:`, error);
    } finally {
      crud.setDeleteDialogOpen(false);
      crud.setItemToDelete(null);
    }
  };

  // Get delete dialog title
  const getDeleteDialogTitle = (): React.ReactNode => {
    if (typeof deleteDialogTitle === "function" && crud.itemToDelete) {
      return deleteDialogTitle(crud.itemToDelete) as React.ReactNode;
    }
    return (deleteDialogTitle || `Inativar ${entityName}`) as React.ReactNode;
  };

  // Get delete dialog description
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
          subtitle={subtitle}
          pageSize={crud.pageSize}
          pageIndex={crud.page - 1}
          totalCount={crud.totalCount}
          initialFilters={crud.initialFilters}
          onPageChange={crud.handlePageChange}
          onPageSizeChange={crud.handlePageSizeChange}
          onAdd={readOnly ? undefined : handleAdd}
          onEdit={readOnly ? undefined : handleEdit}
          onDelete={readOnly ? undefined : handleDelete}
          onViewDetails={onViewDetails}
          onFilterChange={crud.handleFilterChange}
          onSortingChange={crud.handleSortingChange}
          readOnly={readOnly}
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
