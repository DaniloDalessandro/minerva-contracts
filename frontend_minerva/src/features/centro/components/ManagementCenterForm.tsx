"use client";

import { useEffect, useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ManagementCenter } from "@/lib/api/centers";
import { 
  managementCenterSchema, 
  ManagementCenterFormData,
  createUniqueManagementCenterNameValidator 
} from "@/lib/schemas/center-schemas";

interface ManagementCenterFormProps {
  open: boolean;
  handleClose: () => void;
  initialData: ManagementCenter | null;
  onSubmit: (data: ManagementCenterFormData & { id?: number }) => void;
  existingNames?: string[];
}

export default function ManagementCenterForm({
  open,
  handleClose,
  initialData,
  onSubmit,
  existingNames = [],
}: ManagementCenterFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
    setError,
    clearErrors,
  } = useForm<ManagementCenterFormData>({
    resolver: zodResolver(managementCenterSchema),
    defaultValues: {
      name: "",
    },
  });

  const watchedName = watch("name");

  useEffect(() => {
    if (open) {
      if (initialData) {
        reset({
          name: initialData.name,
        });
      } else {
        reset({
          name: "",
        });
      }
    }
  }, [initialData, open, reset]);

  const checkDuplicateName = useCallback((name: string) => {
    if (!name.trim() || name.trim().length < 2) {
      clearErrors("name");
      return;
    }

    // Verifica na lista local (instantâneo)
    const localDuplicate = existingNames.some(
      existingName => existingName.toLowerCase() === name.trim().toLowerCase()
    );

    if (localDuplicate) {
      setError("name", {
        type: "manual", 
        message: "Este nome já está sendo usado por outro centro gestor",
      });
    } else {
      clearErrors("name");
    }
  }, [existingNames, setError, clearErrors]);

  // Validação instantânea de nome
  useEffect(() => {
    if (!watchedName) return;

    checkDuplicateName(watchedName);
  }, [watchedName, checkDuplicateName]);

  const onFormSubmit = async (data: ManagementCenterFormData) => {
    setIsSubmitting(true);
    clearErrors();

    try {
      // Revalidar duplicatas antes de enviar
      checkDuplicateName(data.name);
      
      // Se ainda há erros após a validação, não enviar
      if (Object.keys(errors).length > 0) {
        setIsSubmitting(false);
        return;
      }

      await onSubmit({
        ...data,
        id: initialData?.id,
      });
      
      handleClose();
      reset();
    } catch (error) {
      console.error("Erro ao enviar formulário:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[480px] max-w-[90vw]">
        <form onSubmit={handleSubmit(onFormSubmit)}>
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-primary">
              {initialData ? "Editar Centro Gestor" : "Novo Centro Gestor"}
            </DialogTitle>
            <hr className="mt-2 border-b border-gray-200" />
          </DialogHeader>

          <div className="grid gap-4 py-6">
            <div className="grid gap-2">
              <Label htmlFor="name">Nome *</Label>
              <div className="relative">
                <Input
                  id="name"
                  {...register("name")}
                  placeholder="Nome do Centro Gestor"
                  className={errors.name ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""}
                  style={{ textTransform: 'uppercase' }}
                  onChange={(e) => {
                    e.target.value = e.target.value.toUpperCase();
                    register("name").onChange(e);
                  }}
                />
              </div>
              {errors.name && (
                <div className="bg-red-50 border border-red-200 rounded-md p-2 mt-1">
                  <p className="text-sm text-red-600 font-medium flex items-center gap-1">
                    <span className="text-red-500">⚠️</span>
                    {errors.name.message}
                  </p>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="flex justify-end gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting 
                ? "Salvando..." 
                : initialData 
                ? "Salvar Alterações" 
                : "Criar Centro Gestor"
              }
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}