"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm, Controller } from "react-hook-form";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RequestingCenter, fetchManagementCenters, ManagementCenter } from "@/lib/api/centers";
import { 
  requestingCenterSchema, 
  RequestingCenterFormData
} from "@/lib/schemas/center-schemas";

interface RequestingCenterFormProps {
  open: boolean;
  handleClose: () => void;
  initialData: RequestingCenter | null;
  onSubmit: (data: RequestingCenterFormData & { id?: number }) => void;
  existingNames?: string[];
}

export default function RequestingCenterForm({
  open,
  handleClose,
  initialData,
  onSubmit,
  existingNames = [],
}: RequestingCenterFormProps) {
  const [managementCenters, setManagementCenters] = useState<ManagementCenter[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    formState: { errors },
    setError,
    clearErrors,
  } = useForm<RequestingCenterFormData>({
    resolver: zodResolver(requestingCenterSchema),
    defaultValues: {
      name: "",
      management_center_id: 0,
    },
  });

  const watchedName = watch("name");
  const watchedManagementCenterId = watch("management_center_id");

  useEffect(() => {
    async function loadManagementCenters() {
      try {
        const data = await fetchManagementCenters(1, 1000);
        setManagementCenters(data.results);
      } catch (error) {
        console.error("Erro ao carregar centros gestores:", error);
      }
    }
    loadManagementCenters();
  }, []);

  useEffect(() => {
    if (open) {
      if (initialData) {
        reset({
          name: initialData.name,
          management_center_id: initialData.management_center?.id || 0,
        });
      } else {
        reset({
          name: "",
          management_center_id: 0,
        });
      }
    }
  }, [initialData, open, reset]);

  const checkDuplicateName = useCallback((name: string, managementCenterId: number) => {
    if (!name.trim() || name.trim().length < 2 || managementCenterId <= 0) {
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
        message: "Este nome já está sendo usado por outro centro solicitante neste centro gestor",
      });
    } else {
      clearErrors("name");
    }
  }, [existingNames, setError, clearErrors]);

  // Validação instantânea de nome
  useEffect(() => {
    if (!watchedName || watchedManagementCenterId <= 0) return;

    checkDuplicateName(watchedName, watchedManagementCenterId);
  }, [watchedName, watchedManagementCenterId, checkDuplicateName]);

  const onFormSubmit = async (data: RequestingCenterFormData) => {
    setIsSubmitting(true);
    clearErrors();

    try {
      // Revalidar duplicatas antes de enviar
      checkDuplicateName(data.name, data.management_center_id);
      
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
              {initialData ? "Editar Centro Solicitante" : "Novo Centro Solicitante"}
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
                  placeholder="Nome do Centro Solicitante"
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

            <div className="grid gap-2">
              <Label htmlFor="management_center">Centro Gestor *</Label>
              <Controller
                name="management_center_id"
                control={control}
                render={({ field }) => (
                  <Select
                    onValueChange={(value) => field.onChange(parseInt(value))}
                    value={field.value.toString()}
                  >
                    <SelectTrigger className={`w-full ${errors.management_center_id ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""}`}>
                      <SelectValue placeholder="Selecione um centro gestor" />
                    </SelectTrigger>
                    <SelectContent>
                      {managementCenters.map((center) => (
                        <SelectItem key={center.id} value={center.id.toString()}>
                          {center.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.management_center_id && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.management_center_id.message}
                </p>
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
                : "Criar Centro Solicitante"
              }
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}