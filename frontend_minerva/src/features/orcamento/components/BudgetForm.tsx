"use client";

import { useState, useEffect } from "react";
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
        console.log("🔍 Fetching management centers...");
        const data = await fetchManagementCenters(1, 1000);
        console.log("📋 Management centers response:", data);
        
        if (data && data.results && Array.isArray(data.results)) {
          setManagementCenters(data.results);
          console.log("✅ Management centers loaded successfully:", data.results.length, "centers");
          if (data.results.length > 0) {
            console.log("📝 First center example:", data.results[0]);
          }
        } else if (Array.isArray(data)) {
          // Fallback in case the response is a direct array (non-paginated)
          console.warn("⚠️ Response is direct array, using as is:", data.length);
          setManagementCenters(data);
        } else {
          console.warn("⚠️ Unexpected response format:", data);
          setManagementCenters([]);
        }
      } catch (error) {
        console.error("❌ Erro ao carregar centros gestores:", error);
        // Set empty array so the form still works, just without management centers
        setManagementCenters([]);
        // Show user-friendly error in the form
        setErrors(prev => ({
          ...prev, 
          management_center_id: "Erro ao carregar centros gestores. Verifique sua conexão."
        }));
      } finally {
        setLoadingCenters(false);
      }
    }
    
    if (open) { // Only load when form opens
      loadManagementCenters();
    }
  }, [open]);

  useEffect(() => {
    if (open) {
      if (initialData) {
        console.log("📝 Editing existing budget:", initialData);
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
        console.log("➕ Creating new budget - resetting form");
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
    
    // Clear error when user starts typing
    if (errors[id]) {
      setErrors({ ...errors, [id]: "" });
    }
  };

  const handleSelectChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: field === "management_center_id" ? parseInt(value) : value });
    
    // Clear error when user selects
    if (errors[field]) {
      setErrors({ ...errors, [field]: "" });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.year || formData.year < 2000 || formData.year > 2100) {
      newErrors.year = "Ano deve estar entre 2000 e 2100";
    }

    if (!formData.category) {
      newErrors.category = "Categoria é obrigatória";
    }

    if (!formData.management_center_id || formData.management_center_id === 0) {
      if (managementCenters.length === 0 && !loadingCenters) {
        newErrors.management_center_id = "Nenhum centro gestor disponível. Verifique as permissões ou cadastre um centro gestor primeiro.";
      } else {
        newErrors.management_center_id = "Centro Gestor é obrigatório";
      }
    }

    if (!formData.total_amount || parseFloat(formData.total_amount) <= 0) {
      newErrors.total_amount = "Valor total deve ser maior que zero";
    }

    // Only validate available_amount for existing budgets (editing)
    if (initialData) {
      if (!formData.available_amount || parseFloat(formData.available_amount) < 0) {
        newErrors.available_amount = "Valor disponível não pode ser negativo";
      }

      if (parseFloat(formData.available_amount) > parseFloat(formData.total_amount)) {
        newErrors.available_amount = "Valor disponível não pode ser maior que o total";
      }
    }

    if (!formData.status) {
      newErrors.status = "Status é obrigatório";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent submission while management centers are still loading
    if (loadingCenters) {
      console.warn("⚠️ Form submission blocked - management centers still loading");
      return;
    }
    
    if (!validateForm()) {
      return;
    }

    onSubmit(formData);
    // Form will be closed by the parent component after successful submission
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[480px] max-w-[90vw]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-primary">
              {initialData ? "Editar Orçamento" : "Novo Orçamento"}
            </DialogTitle>
            <hr className="mt-2 border-b border-gray-200" />
          </DialogHeader>

          <div className="grid gap-4 py-6">
            <div className="grid gap-2">
              <Label htmlFor="year">Ano</Label>
              <Input
                id="year"
                type="number"
                value={formData.year}
                onChange={handleChange}
                required
                placeholder="2024"
                min="2000"
                max="2100"
              />
              {errors.year && <span className="text-sm text-red-500">{errors.year}</span>}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="category">Categoria</Label>
              <Select
                onValueChange={(value) => handleSelectChange("category", value)}
                value={formData.category}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CAPEX">CAPEX</SelectItem>
                  <SelectItem value="OPEX">OPEX</SelectItem>
                </SelectContent>
              </Select>
              {errors.category && <span className="text-sm text-red-500">{errors.category}</span>}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="management_center">Centro Gestor</Label>
              <Select
                onValueChange={(value) => handleSelectChange("management_center_id", value)}
                value={formData.management_center_id > 0 ? formData.management_center_id.toString() : ""}
                disabled={loadingCenters}
              >
                <SelectTrigger className="w-full">
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
                    <SelectItem value="0" disabled>
                      Nenhum centro gestor encontrado
                    </SelectItem>
                  ) : (
                    managementCenters.map((center) => (
                      <SelectItem key={center.id} value={center.id.toString()}>
                        {center.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {errors.management_center_id && <span className="text-sm text-red-500">{errors.management_center_id}</span>}
              {loadingCenters && (
                <span className="text-sm text-gray-500">Carregando centros gestores...</span>
              )}
              {!loadingCenters && managementCenters.length === 0 && !errors.management_center_id && (
                <span className="text-sm text-orange-500">
                  Nenhum centro gestor disponível. Verifique as permissões ou crie um centro gestor primeiro.
                </span>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="total_amount">Valor Total</Label>
              <Input
                id="total_amount"
                type="number"
                step="0.01"
                value={formData.total_amount}
                onChange={handleChange}
                required
                placeholder="0.00"
                min="0"
              />
              {errors.total_amount && <span className="text-sm text-red-500">{errors.total_amount}</span>}
            </div>

            {/* Only show available_amount field for editing existing budgets */}
            {initialData && (
              <div className="grid gap-2">
                <Label htmlFor="available_amount">Valor Disponível</Label>
                <Input
                  id="available_amount"
                  type="number"
                  step="0.01"
                  value={formData.available_amount}
                  onChange={handleChange}
                  required
                  placeholder="0.00"
                  min="0"
                />
                {errors.available_amount && <span className="text-sm text-red-500">{errors.available_amount}</span>}
              </div>
            )}
            
            {/* Show info for new budgets that available_amount will be set automatically */}
            {!initialData && (
              <div className="grid gap-2">
                <Label className="text-sm text-gray-600">
                  Valor Disponível: Será definido automaticamente igual ao valor total
                </Label>
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>
              <Select
                onValueChange={(value) => handleSelectChange("status", value)}
                value={formData.status}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione um status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ATIVO">ATIVO</SelectItem>
                  <SelectItem value="INATIVO">INATIVO</SelectItem>
                </SelectContent>
              </Select>
              {errors.status && <span className="text-sm text-red-500">{errors.status}</span>}
            </div>
          </div>

          <DialogFooter className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting || loadingCenters}>
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  {initialData ? "Salvando..." : "Criando..."}
                </>
              ) : loadingCenters ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Carregando...
                </>
              ) : (
                initialData ? "Salvar Alterações" : "Criar Orçamento"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}