"use client";

import { useEffect, useState, useCallback } from "react";
import { useForm } from "react-hook-form";
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
import { Direction } from "@/lib/api/directions";
import {
  directionSchema,
  DirectionFormData
} from "@/lib/schemas/sector-schemas";

interface DirectionFormProps {
  open: boolean;
  handleClose: () => void;
  initialData: Direction | null;
  onSubmit: (data: DirectionFormData & { id?: number }) => void;
  existingNames?: string[];
}

export default function DirectionForm({
  open,
  handleClose,
  initialData,
  onSubmit,
  existingNames = [],
}: DirectionFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
    setError,
    clearErrors,
  } = useForm<DirectionFormData>({
    resolver: zodResolver(directionSchema),
    defaultValues: {
      name: "",
    },
  });

  const watchedName = watch("name");

  useEffect(() => {
    if (open) {
      if (initialData) {
        reset({ name: initialData.name });
      } else {
        reset({ name: "" });
      }
    }
  }, [initialData, open, reset]);

  const checkDuplicateName = useCallback((name: string) => {
    if (!name.trim() || name.trim().length < 2) {
      clearErrors("name");
      return;
    }
    const localDuplicate = existingNames.some(
      existingName => existingName.toLowerCase() === name.trim().toLowerCase()
    );
    if (localDuplicate) {
      setError("name", {
        type: "manual",
        message: "Este nome já está sendo usado por outra direção",
      });
    } else {
      clearErrors("name");
    }
  }, [existingNames, setError, clearErrors]);

  useEffect(() => {
    if (!watchedName) return;
    checkDuplicateName(watchedName);
  }, [watchedName, checkDuplicateName]);

  const onFormSubmit = async (data: DirectionFormData) => {
    setIsSubmitting(true);
    clearErrors();
    try {
      checkDuplicateName(data.name);
      if (Object.keys(errors).length > 0) {
        setIsSubmitting(false);
        return;
      }
      await onSubmit({ ...data, id: initialData?.id });
      handleClose();
      reset();
    } catch (error) {
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
              {initialData ? "Editar Direção" : "Nova Direção"}
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
                  placeholder="Nome da Direção"
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
                : initialData ? "Salvar Alterações" : "Criar Direção"
              }
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
