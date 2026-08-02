"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
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
      } catch {
        // ignore
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
        reset({ name: "", management_center_id: 0 });
      }
    }
  }, [initialData, open, reset]);

  const checkDuplicateName = useCallback((name: string, managementCenterId: number) => {
    if (!name.trim() || name.trim().length < 2 || managementCenterId <= 0) {
      clearErrors("name");
      return;
    }
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

  useEffect(() => {
    if (!watchedName || watchedManagementCenterId <= 0) return;
    checkDuplicateName(watchedName, watchedManagementCenterId);
  }, [watchedName, watchedManagementCenterId, checkDuplicateName]);

  const onFormSubmit = async (data: RequestingCenterFormData) => {
    setIsSubmitting(true);
    clearErrors();
    try {
      checkDuplicateName(data.name, data.management_center_id);
      if (Object.keys(errors).length > 0) {
        setIsSubmitting(false);
        return;
      }
      await onSubmit({ ...data, id: initialData?.id });
      handleClose();
      reset();
    } catch {
      // handled by parent
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="flex flex-col gap-0 p-0 sm:max-w-[480px] max-w-[92vw] max-h-[90vh] overflow-hidden">
        <form onSubmit={handleSubmit(onFormSubmit)} className="flex flex-col min-h-0 flex-1 overflow-hidden">
          <DialogHeader className="shrink-0 px-6 pt-4 pb-3">
            <DialogTitle className="text-lg font-semibold">
              {initialData ? "Editar Centro Solicitante" : "Novo Centro Solicitante"}
            </DialogTitle>
          </DialogHeader>

          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-3">
            <div className="grid gap-2.5">
              <div className="grid gap-1">
                <Label htmlFor="name">
                  Nome <span className="ml-px text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  {...register("name")}
                  placeholder="Nome do Centro Solicitante"
                  className={errors.name ? "border-destructive focus-visible:ring-destructive" : ""}
                  style={{ textTransform: "uppercase" }}
                  onChange={(e) => {
                    e.target.value = e.target.value.toUpperCase();
                    register("name").onChange(e);
                  }}
                  autoFocus
                />
                <span className="min-h-[16px] text-xs leading-[16px] text-destructive block">
                  {errors.name?.message}
                </span>
              </div>

              <div className="grid gap-1">
                <Label htmlFor="management_center_id">
                  Centro Gestor <span className="ml-px text-destructive">*</span>
                </Label>
                <Controller
                  name="management_center_id"
                  control={control}
                  render={({ field }) => (
                    <Select
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      value={field.value > 0 ? field.value.toString() : ""}
                    >
                      <SelectTrigger
                        id="management_center_id"
                        className={errors.management_center_id ? "border-destructive focus:ring-destructive" : ""}
                      >
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
                <span className="min-h-[16px] text-xs leading-[16px] text-destructive block">
                  {errors.management_center_id?.message}
                </span>
              </div>
            </div>
          </div>

          <DialogFooter className="shrink-0 flex-col-reverse sm:flex-row sm:justify-end gap-2 border-t border-border/70 px-6 py-4 bg-muted/20">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-9 w-full rounded-[10px] sm:w-auto gap-2 font-semibold"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {isSubmitting
                ? initialData ? "Salvando..." : "Criando..."
                : initialData ? "Salvar Alterações" : "Criar Centro Solicitante"
              }
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
