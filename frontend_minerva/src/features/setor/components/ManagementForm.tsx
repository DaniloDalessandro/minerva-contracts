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
import { Management } from "@/lib/api/managements";
import { Direction, fetchDirections } from "@/lib/api/directions";
import { 
  managementSchema, 
  ManagementFormData
} from "@/lib/schemas/sector-schemas";

interface ManagementFormProps {
  open: boolean;
  handleClose: () => void;
  initialData: Management | null;
  onSubmit: (data: ManagementFormData & { id?: number }) => void;
  existingNames?: string[];
}

export default function ManagementForm({
  open,
  handleClose,
  initialData,
  onSubmit,
  existingNames = [],
}: ManagementFormProps) {
  const [directions, setDirections] = useState<Direction[]>([]);
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
  } = useForm<ManagementFormData>({
    resolver: zodResolver(managementSchema),
    defaultValues: {
      name: "",
      direction_id: 0,
    },
  });

  const watchedName = watch("name");
  const watchedDirectionId = watch("direction_id");

  useEffect(() => {
    async function loadDirections() {
      try {
        console.log("🔍 Carregando direções...");
        const data = await fetchDirections(1, 1000, "", "name");
        console.log("📊 Dados recebidos:", data);
        console.log("📋 Direções encontradas:", data.results?.length || 0);
        setDirections(data.results || []);
      } catch (error) {
        console.error("❌ Erro ao carregar direções:", error);
      }
    }
    loadDirections();
  }, []);

  useEffect(() => {
    if (open) {
      if (initialData) {
        reset({
          name: initialData.name,
          direction_id: initialData.direction || 0,
        });
      } else {
        reset({
          name: "",
          direction_id: 0,
        });
      }
    }
  }, [initialData, open, reset]);

  const checkDuplicateName = useCallback((name: string, directionId: number) => {
    if (!name.trim() || name.trim().length < 2 || directionId <= 0) {
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
        message: "Este nome já está sendo usado por outra gerência nesta direção",
      });
    } else {
      clearErrors("name");
    }
  }, [existingNames, setError, clearErrors]);

  // Validação instantânea de nome
  useEffect(() => {
    if (!watchedName || watchedDirectionId <= 0) return;

    checkDuplicateName(watchedName, watchedDirectionId);
  }, [watchedName, watchedDirectionId, checkDuplicateName]);

  const onFormSubmit = async (data: ManagementFormData) => {
    setIsSubmitting(true);
    clearErrors();

    try {
      // Revalidar duplicatas antes de enviar
      checkDuplicateName(data.name, data.direction_id);
      
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
              {initialData ? "Editar Gerência" : "Nova Gerência"}
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
                  placeholder="Nome da Gerência"
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
              <Label htmlFor="direction">Direção *</Label>
              <Controller
                name="direction_id"
                control={control}
                render={({ field }) => (
                  <Select
                    onValueChange={(value) => field.onChange(parseInt(value))}
                    value={field.value.toString()}
                  >
                    <SelectTrigger className={`w-full ${errors.direction_id ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""}`}>
                      <SelectValue placeholder="Selecione uma direção" />
                    </SelectTrigger>
                    <SelectContent>
                      {directions.map((direction) => (
                        <SelectItem key={direction.id} value={direction.id.toString()}>
                          {direction.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.direction_id && (
                <div className="bg-red-50 border border-red-200 rounded-md p-2 mt-1">
                  <p className="text-sm text-red-600 font-medium flex items-center gap-1">
                    <span className="text-red-500">⚠️</span>
                    {errors.direction_id.message}
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
                : "Criar Gerência"
              }
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}