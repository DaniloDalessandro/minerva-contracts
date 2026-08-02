"use client";

import { useState, useEffect } from "react";
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
import { Budget } from "@/lib/api/budgets";
import { ManagementCenter, fetchManagementCenters } from "@/lib/api/centers";

interface BudgetFormProps {
  open: boolean;
  handleClose: () => void;
  initialData: Budget | null;
  onSubmit: (data: any) => void;
  isSubmitting?: boolean;
}

export default function BudgetForm({
  open,
  handleClose,
  initialData,
  onSubmit,
  isSubmitting = false,
}: BudgetFormProps) {
  const [formData, setFormData] = useState<any>({
    id: undefined,
    year: new Date().getFullYear(),
    category: "",
    management_center_id: 0,
    total_amount: "",
    available_amount: "",
    status: "ATIVO",
  });
  const [managementCenters, setManagementCenters] = useState<ManagementCenter[]>([]);
  const [loadingCenters, setLoadingCenters] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    async function loadManagementCenters() {
      try {
        setLoadingCenters(true);
        const data = await fetchManagementCenters(1, 1000);
        if (data && data.results && Array.isArray(data.results)) {
          setManagementCenters(data.results);
        } else if (Array.isArray(data)) {
          setManagementCenters(data);
        } else {
          setManagementCenters([]);
        }
      } catch {
        setManagementCenters([]);
        setErrors(prev => ({ ...prev, management_center_id: "Erro ao carregar centros gestores. Verifique sua conexão." }));
      } finally {
        setLoadingCenters(false);
      }
    }
    if (open) loadManagementCenters();
  }, [open]);

  useEffect(() => {
    if (open) {
      if (initialData) {
        setFormData({
          id: initialData.id,
          year: initialData.year,
          category: initialData.category,
          management_center_id: initialData.management_center?.id || 0,
          total_amount: initialData.total_amount,
          available_amount: initialData.available_amount,
          status: initialData.status,
        });
      } else {
        setFormData({
          id: undefined,
          year: new Date().getFullYear(),
          category: "",
          management_center_id: 0,
          total_amount: "",
          available_amount: "",
          status: "ATIVO",
        });
      }
      setErrors({});
    }
  }, [open, initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData({ ...formData, [id]: value });
    if (errors[id]) setErrors({ ...errors, [id]: "" });
  };

  const handleSelectChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: field === "management_center_id" ? parseInt(value) : value });
    if (errors[field]) setErrors({ ...errors, [field]: "" });
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.year || formData.year < 2000 || formData.year > 2100)
      newErrors.year = "Ano deve estar entre 2000 e 2100";
    if (!formData.category) newErrors.category = "Categoria é obrigatória";
    if (!formData.management_center_id || formData.management_center_id === 0) {
      newErrors.management_center_id = managementCenters.length === 0 && !loadingCenters
        ? "Nenhum centro gestor disponível. Verifique as permissões ou cadastre um centro gestor primeiro."
        : "Centro Gestor é obrigatório";
    }
    if (!formData.total_amount || parseFloat(formData.total_amount) <= 0)
      newErrors.total_amount = "Valor total deve ser maior que zero";
    if (initialData) {
      if (!formData.available_amount || parseFloat(formData.available_amount) < 0)
        newErrors.available_amount = "Valor disponível não pode ser negativo";
      if (parseFloat(formData.available_amount) > parseFloat(formData.total_amount))
        newErrors.available_amount = "Valor disponível não pode ser maior que o total";
    }
    if (!formData.status) newErrors.status = "Status é obrigatório";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (loadingCenters) return;
    if (!validateForm()) return;
    onSubmit(formData);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="flex flex-col gap-0 p-0 sm:max-w-[480px] max-w-[92vw] max-h-[90vh] overflow-hidden">
        <form onSubmit={handleSubmit} className="flex flex-col min-h-0 flex-1 overflow-hidden">
          <DialogHeader className="shrink-0 px-6 pt-4 pb-3">
            <DialogTitle className="text-lg font-semibold">
              {initialData ? "Editar Orçamento" : "Novo Orçamento"}
            </DialogTitle>
          </DialogHeader>

          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-3">
            <div className="grid gap-2.5">
              <div className="grid gap-1">
                <Label htmlFor="year">
                  Ano <span className="ml-px text-destructive">*</span>
                </Label>
                <Input id="year" type="number" value={formData.year} onChange={handleChange} placeholder="2024" min="2000" max="2100" />
                <span className="min-h-[16px] text-xs leading-[16px] text-destructive block">{errors.year}</span>
              </div>

              <div className="grid gap-1">
                <Label htmlFor="category">
                  Categoria <span className="ml-px text-destructive">*</span>
                </Label>
                <Select onValueChange={(value) => handleSelectChange("category", value)} value={formData.category}>
                  <SelectTrigger id="category" className="w-full">
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CAPEX">CAPEX</SelectItem>
                    <SelectItem value="OPEX">OPEX</SelectItem>
                  </SelectContent>
                </Select>
                <span className="min-h-[16px] text-xs leading-[16px] text-destructive block">{errors.category}</span>
              </div>

              <div className="grid gap-1">
                <Label htmlFor="management_center">
                  Centro Gestor <span className="ml-px text-destructive">*</span>
                </Label>
                <Select
                  onValueChange={(value) => handleSelectChange("management_center_id", value)}
                  value={formData.management_center_id > 0 ? formData.management_center_id.toString() : ""}
                  disabled={loadingCenters}
                >
                  <SelectTrigger id="management_center" className="w-full">
                    <SelectValue placeholder={
                      loadingCenters
                        ? "Carregando centros gestores..."
                        : managementCenters.length === 0
                        ? "Nenhum centro gestor encontrado"
                        : "Selecione um centro gestor"
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {!loadingCenters && managementCenters.length === 0 ? (
                      <SelectItem value="0" disabled>Nenhum centro gestor encontrado</SelectItem>
                    ) : (
                      managementCenters.map((center) => (
                        <SelectItem key={center.id} value={center.id.toString()}>{center.name}</SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <span className="min-h-[16px] text-xs leading-[16px] text-destructive block">
                  {errors.management_center_id || (!loadingCenters && managementCenters.length === 0 && !errors.management_center_id ? "Nenhum centro gestor disponível. Crie um centro gestor primeiro." : "")}
                </span>
              </div>

              <div className="grid gap-1">
                <Label htmlFor="total_amount">
                  Valor Total <span className="ml-px text-destructive">*</span>
                </Label>
                <Input id="total_amount" type="number" step="0.01" value={formData.total_amount} onChange={handleChange} placeholder="0.00" min="0" />
                <span className="min-h-[16px] text-xs leading-[16px] text-destructive block">{errors.total_amount}</span>
              </div>

              {initialData && (
                <div className="grid gap-1">
                  <Label htmlFor="available_amount">Valor Disponível</Label>
                  <Input id="available_amount" type="number" step="0.01" value={formData.available_amount} onChange={handleChange} placeholder="0.00" min="0" />
                  <span className="min-h-[16px] text-xs leading-[16px] text-destructive block">{errors.available_amount}</span>
                </div>
              )}

              {!initialData && (
                <p className="text-xs text-muted-foreground">
                  Valor disponível será definido automaticamente igual ao valor total.
                </p>
              )}

              <div className="grid gap-1">
                <Label htmlFor="status">
                  Status <span className="ml-px text-destructive">*</span>
                </Label>
                <Select onValueChange={(value) => handleSelectChange("status", value)} value={formData.status}>
                  <SelectTrigger id="status" className="w-full">
                    <SelectValue placeholder="Selecione um status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ATIVO">ATIVO</SelectItem>
                    <SelectItem value="INATIVO">INATIVO</SelectItem>
                  </SelectContent>
                </Select>
                <span className="min-h-[16px] text-xs leading-[16px] text-destructive block">{errors.status}</span>
              </div>
            </div>
          </div>

          <DialogFooter className="shrink-0 flex-col-reverse sm:flex-row sm:justify-end gap-2 border-t border-border/70 px-6 py-4 bg-muted/20">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || loadingCenters}
              className="h-9 w-full rounded-[10px] sm:w-auto gap-2 font-semibold"
            >
              {(isSubmitting || loadingCenters) && <Loader2 className="h-4 w-4 animate-spin" />}
              {isSubmitting
                ? initialData ? "Salvando alterações..." : "Criando orçamento..."
                : loadingCenters ? "Carregando..."
                : initialData ? "Salvar Alterações" : "Criar Orçamento"
              }
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
