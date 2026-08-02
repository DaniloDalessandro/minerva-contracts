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
import { Coordination } from "@/lib/api/coordinations";
import { Management, fetchManagements } from "@/lib/api/managements";
import {
  coordinationSchema,
  CoordinationFormData
} from "@/lib/schemas/sector-schemas";

interface CoordinationFormProps {
  open: boolean;
  handleClose: () => void;
  initialData: Coordination | null;
  onSubmit: (data: CoordinationFormData & { id?: number }) => void;
  existingNames?: string[];
}

export default function CoordinationForm({
  open,
  handleClose,
  initialData,
  onSubmit,
  existingNames = [],
}: CoordinationFormProps) {
  const [managements, setManagements] = useState<Management[]>([]);
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
  } = useForm<CoordinationFormData>({
    resolver: zodResolver(coordinationSchema),
    defaultValues: {
      name: "",
      management_id: 0,
    },
  });

  const watchedName = watch("name");
  const watchedManagementId = watch("management_id");

  useEffect(() => {
    async function loadManagements() {
      try {
        const data = await fetchManagements(1, 1000, "", "name");
        setManagements(data.results || []);
      } catch {
        // ignore
      }
    }
    loadManagements();
  }, []);

  useEffect(() => {
    if (open) {
      if (initialData) {
        reset({ name: initialData.name, management_id: initialData.management || 0 });
      } else {
        reset({ name: "", management_id: 0 });
      }
    }
  }, [initialData, open, reset]);

  const checkDuplicateName = useCallback((name: string, managementId: number) => {
    if (!name.trim() || name.trim().length < 2 || managementId <= 0) {
      clearErrors("name");
      return;
    }
    const localDuplicate = existingNames.some(
      existingName => existingName.toLowerCase() === name.trim().toLowerCase()
    );
    if (localDuplicate) {
      setError("name", {
        type: "manual",
        message: "Este nome já está sendo usado por outra coordenação nesta gerência",
      });
    } else {
      clearErrors("name");
    }
  }, [existingNames, setError, clearErrors]);

  useEffect(() => {
    if (!watchedName || watchedManagementId <= 0) return;
    checkDuplicateName(watchedName, watchedManagementId);
  }, [watchedName, watchedManagementId, checkDuplicateName]);

  const onFormSubmit = async (data: CoordinationFormData) => {
    setIsSubmitting(true);
    clearErrors();
    try {
      checkDuplicateName(data.name, data.management_id);
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
              {initialData ? "Editar Coordenação" : "Nova Coordenação"}
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
                  placeholder="Nome da Coordenação"
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
                <Label htmlFor="management_id">
                  Gerência <span className="ml-px text-destructive">*</span>
                </Label>
                <Controller
                  name="management_id"
                  control={control}
                  render={({ field }) => (
                    <Select
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      value={field.value > 0 ? field.value.toString() : ""}
                    >
                      <SelectTrigger
                        id="management_id"
                        className={errors.management_id ? "border-destructive focus:ring-destructive" : ""}
                      >
                        <SelectValue placeholder="Selecione uma gerência" />
                      </SelectTrigger>
                      <SelectContent>
                        {managements.map((management) => (
                          <SelectItem key={management.id} value={management.id.toString()}>
                            {management.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                <span className="min-h-[16px] text-xs leading-[16px] text-destructive block">
                  {errors.management_id?.message}
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
                : initialData ? "Salvar Alterações" : "Criar Coordenação"
              }
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
