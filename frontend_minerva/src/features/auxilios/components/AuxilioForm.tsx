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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Auxilio, fetchColaboradores, fetchBudgetLines } from "@/lib/api/auxilios";

interface AuxilioFormProps {
  open: boolean;
  handleClose: () => void;
  initialData: Auxilio | null;
  onSubmit: (data: any) => void;
  isSubmitting?: boolean;
}

interface Employee {
  id: number;
  full_name: string;
  employee_id?: string;
}

interface BudgetLine {
  id: number;
  name: string;
}

export default function AuxilioForm({
  open,
  handleClose,
  initialData,
  onSubmit,
  isSubmitting = false,
}: AuxilioFormProps) {
  const [formData, setFormData] = useState<any>({
    id: undefined,
    employee: 0,
    budget_line: 0,
    type: "GRADUACAO",
    total_amount: "",
    installment_count: 1,
    amount_per_installment: "",
    start_date: "",
    end_date: "",
    status: "AGUARDANDO",
    notes: "",
  });

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [budgetLines, setBudgetLines] = useState<BudgetLine[]>([]);
  
  const [loadingData, setLoadingData] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load dropdown data
  useEffect(() => {
    async function loadDropdownData() {
      try {
        setLoadingData(true);
        console.log("🔍 Fetching dropdown data...");
        
        const [employeesData, budgetLinesData] = await Promise.all([
          fetchColaboradores(),
          fetchBudgetLines()
        ]);
        
        console.log("📋 Dropdown data loaded:", {
          employees: employeesData.length,
          budgetLines: budgetLinesData.length
        });
        
        setEmployees(employeesData);
        setBudgetLines(budgetLinesData);
        
      } catch (error) {
        console.error("❌ Erro ao carregar dados dos dropdowns:", error);
        setErrors(prev => ({
          ...prev, 
          employee: "Erro ao carregar dados. Verifique sua conexão."
        }));
      } finally {
        setLoadingData(false);
      }
    }
    
    if (open) {
      loadDropdownData();
    }
  }, [open]);

  useEffect(() => {
    if (open) {
      if (initialData) {
        console.log("📝 Editing existing auxilio:", initialData);
        setFormData({
          id: initialData.id,
          employee: initialData.employee?.id || 0,
          budget_line: initialData.budget_line?.id || 0,
          type: initialData.type || "GRADUACAO",
          total_amount: initialData.total_amount || "",
          installment_count: initialData.installment_count || 1,
          amount_per_installment: initialData.amount_per_installment || "",
          start_date: initialData.start_date || "",
          end_date: initialData.end_date || "",
          status: initialData.status || "AGUARDANDO",
          notes: initialData.notes || "",
        });
      } else {
        console.log("➕ Creating new auxilio - resetting form");
        setFormData({
          id: undefined,
          employee: 0,
          budget_line: 0,
          type: "GRADUACAO",
          total_amount: "",
          installment_count: 1,
          amount_per_installment: "",
          start_date: "",
          end_date: "",
          status: "AGUARDANDO",
          notes: "",
        });
      }
      setErrors({});
    }
  }, [open, initialData]);

  // Auto-calculate amount per installment when total amount or installment count changes
  useEffect(() => {
    if (formData.total_amount && formData.installment_count > 0) {
      const totalAmount = parseFloat(formData.total_amount.replace(/[^\d.,]/g, '').replace(',', '.'));
      if (!isNaN(totalAmount)) {
        const amountPerInstallment = (totalAmount / formData.installment_count).toFixed(2);
        setFormData(prev => ({ ...prev, amount_per_installment: amountPerInstallment }));
      }
    }
  }, [formData.total_amount, formData.installment_count]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    
    // Handle numeric fields
    if (id === 'installment_count') {
      const numValue = parseInt(value) || 1;
      setFormData({ ...formData, [id]: Math.max(1, numValue) });
    } else if (id === 'total_amount') {
      // Format as currency but store as string
      setFormData({ ...formData, [id]: value });
    } else {
      setFormData({ ...formData, [id]: value });
    }
    
    // Clear error when user starts typing
    if (errors[id]) {
      setErrors({ ...errors, [id]: "" });
    }
  };

  const handleSelectChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: 
      field === 'employee' || field === 'budget_line'
        ? parseInt(value) 
        : value 
    });
    
    // Clear error when user selects
    if (errors[field]) {
      setErrors({ ...errors, [field]: "" });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.employee || formData.employee === 0) {
      newErrors.employee = "Colaborador é obrigatório";
    }

    if (!formData.budget_line || formData.budget_line === 0) {
      newErrors.budget_line = "Linha orçamentária é obrigatória";
    }

    if (!formData.type) {
      newErrors.type = "Tipo é obrigatório";
    }

    if (!formData.total_amount) {
      newErrors.total_amount = "Valor total é obrigatório";
    } else {
      const totalAmount = parseFloat(formData.total_amount.replace(/[^\d.,]/g, '').replace(',', '.'));
      if (isNaN(totalAmount) || totalAmount <= 0) {
        newErrors.total_amount = "Valor total deve ser um número válido maior que zero";
      }
    }

    if (!formData.installment_count || formData.installment_count < 1) {
      newErrors.installment_count = "Número de parcelas deve ser pelo menos 1";
    }

    if (!formData.start_date) {
      newErrors.start_date = "Data de início é obrigatória";
    }

    if (!formData.end_date) {
      newErrors.end_date = "Data de fim é obrigatória";
    }

    if (formData.start_date && formData.end_date) {
      if (new Date(formData.start_date) >= new Date(formData.end_date)) {
        newErrors.end_date = "Data de fim deve ser posterior à data de início";
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
    
    if (loadingData) {
      console.warn("⚠️ Form submission blocked - data still loading");
      return;
    }
    
    if (!validateForm()) {
      return;
    }

    // Prepare data for submission (convert 0 values to null for foreign keys)
    const submitData = {
      ...formData,
      employee: formData.employee > 0 ? formData.employee : null,
      budget_line: formData.budget_line > 0 ? formData.budget_line : null,
      // Ensure numeric values are properly formatted
      total_amount: formData.total_amount.toString(),
      amount_per_installment: formData.amount_per_installment.toString(),
      installment_count: parseInt(formData.installment_count.toString()),
    };

    onSubmit(submitData);
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'GRADUACAO':
        return 'Graduação';
      case 'POS_GRADUACAO':
        return 'Pós-Graduação';
      case 'AUXILIO_CRECHE_ESCOLA':
        return 'Creche/Escola';
      case 'LINGUA_ESTRANGEIRA':
        return 'Língua Estrangeira';
      default:
        return type;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'AGUARDANDO':
        return 'Aguardando';
      case 'ATIVO':
        return 'Ativo';
      case 'CONCLUIDO':
        return 'Concluído';
      case 'CANCELADO':
        return 'Cancelado';
      default:
        return status;
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[800px] max-w-[90vw] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-primary">
              {initialData ? "Editar Auxílio" : "Novo Auxílio"}
            </DialogTitle>
            <hr className="mt-2 border-b border-gray-200" />
          </DialogHeader>

          <div className="grid gap-4 py-6">
            {/* Seção: Dados Básicos */}
            <div className="space-y-4">
              <h3 className="text-md font-semibold text-gray-700 border-b pb-2">Dados Básicos</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="employee">Colaborador *</Label>
                  <Select
                    onValueChange={(value) => handleSelectChange("employee", value)}
                    value={formData.employee > 0 ? formData.employee.toString() : ""}
                    disabled={loadingData}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={
                        loadingData 
                          ? "Carregando colaboradores..." 
                          : "Selecione um colaborador"
                      } />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map((employee) => (
                        <SelectItem key={employee.id} value={employee.id.toString()}>
                          {employee.full_name} {employee.employee_id ? `(${employee.employee_id})` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.employee && <span className="text-sm text-red-500">{errors.employee}</span>}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="budget_line">Linha Orçamentária *</Label>
                  <Select
                    onValueChange={(value) => handleSelectChange("budget_line", value)}
                    value={formData.budget_line > 0 ? formData.budget_line.toString() : ""}
                    disabled={loadingData}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={
                        loadingData 
                          ? "Carregando linhas..." 
                          : "Selecione uma linha orçamentária"
                      } />
                    </SelectTrigger>
                    <SelectContent>
                      {budgetLines.map((budgetLine) => (
                        <SelectItem key={budgetLine.id} value={budgetLine.id.toString()}>
                          {budgetLine.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.budget_line && <span className="text-sm text-red-500">{errors.budget_line}</span>}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="type">Tipo *</Label>
                  <Select
                    onValueChange={(value) => handleSelectChange("type", value)}
                    value={formData.type}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione um tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GRADUACAO">{getTypeLabel("GRADUACAO")}</SelectItem>
                      <SelectItem value="POS_GRADUACAO">{getTypeLabel("POS_GRADUACAO")}</SelectItem>
                      <SelectItem value="AUXILIO_CRECHE_ESCOLA">{getTypeLabel("AUXILIO_CRECHE_ESCOLA")}</SelectItem>
                      <SelectItem value="LINGUA_ESTRANGEIRA">{getTypeLabel("LINGUA_ESTRANGEIRA")}</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.type && <span className="text-sm text-red-500">{errors.type}</span>}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="status">Status *</Label>
                  <Select
                    onValueChange={(value) => handleSelectChange("status", value)}
                    value={formData.status}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione um status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AGUARDANDO">{getStatusLabel("AGUARDANDO")}</SelectItem>
                      <SelectItem value="ATIVO">{getStatusLabel("ATIVO")}</SelectItem>
                      <SelectItem value="CONCLUIDO">{getStatusLabel("CONCLUIDO")}</SelectItem>
                      <SelectItem value="CANCELADO">{getStatusLabel("CANCELADO")}</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.status && <span className="text-sm text-red-500">{errors.status}</span>}
                </div>
              </div>
            </div>

            {/* Seção: Valores */}
            <div className="space-y-4">
              <h3 className="text-md font-semibold text-gray-700 border-b pb-2">Valores</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="total_amount">Valor Total *</Label>
                  <Input
                    id="total_amount"
                    value={formData.total_amount}
                    onChange={handleChange}
                    placeholder="0,00"
                    required
                  />
                  {errors.total_amount && <span className="text-sm text-red-500">{errors.total_amount}</span>}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="installment_count">Número de Parcelas *</Label>
                  <Input
                    id="installment_count"
                    type="number"
                    min="1"
                    value={formData.installment_count}
                    onChange={handleChange}
                    required
                  />
                  {errors.installment_count && <span className="text-sm text-red-500">{errors.installment_count}</span>}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="amount_per_installment">Valor por Parcela</Label>
                  <Input
                    id="amount_per_installment"
                    value={formData.amount_per_installment}
                    readOnly
                    className="bg-gray-50"
                    placeholder="Calculado automaticamente"
                  />
                </div>
              </div>
            </div>

            {/* Seção: Período */}
            <div className="space-y-4">
              <h3 className="text-md font-semibold text-gray-700 border-b pb-2">Período</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="start_date">Data de Início *</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={handleChange}
                    required
                  />
                  {errors.start_date && <span className="text-sm text-red-500">{errors.start_date}</span>}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="end_date">Data de Fim *</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={formData.end_date}
                    onChange={handleChange}
                    required
                  />
                  {errors.end_date && <span className="text-sm text-red-500">{errors.end_date}</span>}
                </div>
              </div>
            </div>

            {/* Seção: Observações */}
            <div className="space-y-4">
              <h3 className="text-md font-semibold text-gray-700 border-b pb-2">Observações</h3>
              
              <div className="grid gap-2">
                <Label htmlFor="notes">Observações</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Observações adicionais sobre o auxílio..."
                  rows={3}
                />
              </div>
            </div>

          </div>

          <DialogFooter className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting || loadingData}>
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  {initialData ? "Salvando..." : "Criando..."}
                </>
              ) : loadingData ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Carregando...
                </>
              ) : (
                initialData ? "Salvar Alterações" : "Criar Auxílio"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}