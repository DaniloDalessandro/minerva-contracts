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

const SectionHeading = ({ children }: { children: React.ReactNode }) => (
  <h3 className="text-[15px] font-semibold text-foreground border-b border-primary/25 pb-1.5 flex items-center gap-2">
    <span className="inline-block w-1 h-[18px] rounded-full bg-primary/70 shrink-0" aria-hidden="true" />
    {children}
  </h3>
);

const TYPE_LABELS: Record<string, string> = {
  GRADUACAO: "Graduação",
  POS_GRADUACAO: "Pós-Graduação",
  AUXILIO_CRECHE_ESCOLA: "Creche/Escola",
  LINGUA_ESTRANGEIRA: "Língua Estrangeira",
};

const STATUS_LABELS: Record<string, string> = {
  AGUARDANDO: "Aguardando",
  ATIVO: "Ativo",
  CONCLUIDO: "Concluído",
  CANCELADO: "Cancelado",
};

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

  useEffect(() => {
    async function loadDropdownData() {
      try {
        setLoadingData(true);
        const [employeesData, budgetLinesData] = await Promise.all([
          fetchColaboradores(),
          fetchBudgetLines()
        ]);
        setEmployees(employeesData);
        setBudgetLines(budgetLinesData);
      } catch {
        setErrors(prev => ({ ...prev, employee: "Erro ao carregar dados. Verifique sua conexão." }));
      } finally {
        setLoadingData(false);
      }
    }
    if (open) loadDropdownData();
  }, [open]);

  useEffect(() => {
    if (open) {
      if (initialData) {
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

  useEffect(() => {
    if (formData.total_amount && formData.installment_count > 0) {
      const totalAmount = parseFloat(formData.total_amount.replace(/[^\d.,]/g, "").replace(",", "."));
      if (!isNaN(totalAmount)) {
        const amountPerInstallment = (totalAmount / formData.installment_count).toFixed(2);
        setFormData((prev: any) => ({ ...prev, amount_per_installment: amountPerInstallment }));
      }
    }
  }, [formData.total_amount, formData.installment_count]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    if (id === "installment_count") {
      setFormData({ ...formData, [id]: Math.max(1, parseInt(value) || 1) });
    } else {
      setFormData({ ...formData, [id]: value });
    }
    if (errors[id]) setErrors({ ...errors, [id]: "" });
  };

  const handleSelectChange = (field: string, value: string) => {
    setFormData({
      ...formData,
      [field]: field === "employee" || field === "budget_line" ? parseInt(value) : value,
    });
    if (errors[field]) setErrors({ ...errors, [field]: "" });
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.employee || formData.employee === 0) newErrors.employee = "Colaborador é obrigatório";
    if (!formData.budget_line || formData.budget_line === 0) newErrors.budget_line = "Linha orçamentária é obrigatória";
    if (!formData.type) newErrors.type = "Tipo é obrigatório";
    if (!formData.total_amount) {
      newErrors.total_amount = "Valor total é obrigatório";
    } else {
      const v = parseFloat(formData.total_amount.replace(/[^\d.,]/g, "").replace(",", "."));
      if (isNaN(v) || v <= 0) newErrors.total_amount = "Valor total deve ser um número válido maior que zero";
    }
    if (!formData.installment_count || formData.installment_count < 1)
      newErrors.installment_count = "Número de parcelas deve ser pelo menos 1";
    if (!formData.start_date) newErrors.start_date = "Data de início é obrigatória";
    if (!formData.end_date) newErrors.end_date = "Data de fim é obrigatória";
    if (formData.start_date && formData.end_date) {
      if (new Date(formData.start_date) >= new Date(formData.end_date))
        newErrors.end_date = "Data de fim deve ser posterior à data de início";
    }
    if (!formData.status) newErrors.status = "Status é obrigatório";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (loadingData) return;
    if (!validateForm()) return;
    onSubmit({
      ...formData,
      employee: formData.employee > 0 ? formData.employee : null,
      budget_line: formData.budget_line > 0 ? formData.budget_line : null,
      total_amount: formData.total_amount.toString(),
      amount_per_installment: formData.amount_per_installment.toString(),
      installment_count: parseInt(formData.installment_count.toString()),
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="flex flex-col gap-0 p-0 sm:max-w-[800px] max-w-[92vw] max-h-[90vh] overflow-hidden">
        <form onSubmit={handleSubmit} className="flex flex-col min-h-0 flex-1 overflow-hidden">
          <DialogHeader className="shrink-0 px-6 pt-4 pb-3">
            <DialogTitle className="text-lg font-semibold">
              {initialData ? "Editar Auxílio" : "Novo Auxílio"}
            </DialogTitle>
          </DialogHeader>

          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-3">
            <div className="grid gap-4">

              <div className="space-y-2">
                <SectionHeading>Dados Básicos</SectionHeading>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="grid gap-1">
                    <Label htmlFor="employee">
                      Colaborador <span className="ml-px text-destructive">*</span>
                    </Label>
                    <Select
                      onValueChange={(value) => handleSelectChange("employee", value)}
                      value={formData.employee > 0 ? formData.employee.toString() : ""}
                      disabled={loadingData}
                    >
                      <SelectTrigger id="employee" className="w-full">
                        <SelectValue placeholder={loadingData ? "Carregando colaboradores..." : "Selecione um colaborador"} />
                      </SelectTrigger>
                      <SelectContent>
                        {employees.map((employee) => (
                          <SelectItem key={employee.id} value={employee.id.toString()}>
                            {employee.full_name} {employee.employee_id ? `(${employee.employee_id})` : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <span className="min-h-[16px] text-xs leading-[16px] text-destructive block">{errors.employee}</span>
                  </div>

                  <div className="grid gap-1">
                    <Label htmlFor="budget_line">
                      Linha Orçamentária <span className="ml-px text-destructive">*</span>
                    </Label>
                    <Select
                      onValueChange={(value) => handleSelectChange("budget_line", value)}
                      value={formData.budget_line > 0 ? formData.budget_line.toString() : ""}
                      disabled={loadingData}
                    >
                      <SelectTrigger id="budget_line" className="w-full">
                        <SelectValue placeholder={loadingData ? "Carregando linhas..." : "Selecione uma linha orçamentária"} />
                      </SelectTrigger>
                      <SelectContent>
                        {budgetLines.map((bl) => (
                          <SelectItem key={bl.id} value={bl.id.toString()}>{bl.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <span className="min-h-[16px] text-xs leading-[16px] text-destructive block">{errors.budget_line}</span>
                  </div>

                  <div className="grid gap-1">
                    <Label htmlFor="type">
                      Tipo <span className="ml-px text-destructive">*</span>
                    </Label>
                    <Select onValueChange={(value) => handleSelectChange("type", value)} value={formData.type}>
                      <SelectTrigger id="type" className="w-full">
                        <SelectValue placeholder="Selecione um tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(TYPE_LABELS).map(([k, v]) => (
                          <SelectItem key={k} value={k}>{v}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <span className="min-h-[16px] text-xs leading-[16px] text-destructive block">{errors.type}</span>
                  </div>

                  <div className="grid gap-1">
                    <Label htmlFor="status">
                      Status <span className="ml-px text-destructive">*</span>
                    </Label>
                    <Select onValueChange={(value) => handleSelectChange("status", value)} value={formData.status}>
                      <SelectTrigger id="status" className="w-full">
                        <SelectValue placeholder="Selecione um status" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(STATUS_LABELS).map(([k, v]) => (
                          <SelectItem key={k} value={k}>{v}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <span className="min-h-[16px] text-xs leading-[16px] text-destructive block">{errors.status}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <SectionHeading>Valores</SectionHeading>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="grid gap-1">
                    <Label htmlFor="total_amount">
                      Valor Total <span className="ml-px text-destructive">*</span>
                    </Label>
                    <Input id="total_amount" value={formData.total_amount} onChange={handleChange} placeholder="0,00" />
                    <span className="min-h-[16px] text-xs leading-[16px] text-destructive block">{errors.total_amount}</span>
                  </div>

                  <div className="grid gap-1">
                    <Label htmlFor="installment_count">
                      Nº de Parcelas <span className="ml-px text-destructive">*</span>
                    </Label>
                    <Input id="installment_count" type="number" min="1" value={formData.installment_count} onChange={handleChange} />
                    <span className="min-h-[16px] text-xs leading-[16px] text-destructive block">{errors.installment_count}</span>
                  </div>

                  <div className="grid gap-1">
                    <Label htmlFor="amount_per_installment">Valor por Parcela</Label>
                    <Input id="amount_per_installment" value={formData.amount_per_installment} readOnly className="bg-muted/40" placeholder="Calculado automaticamente" />
                    <span className="min-h-[16px] text-xs leading-[16px] text-destructive block" />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <SectionHeading>Período</SectionHeading>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="grid gap-1">
                    <Label htmlFor="start_date">
                      Data de Início <span className="ml-px text-destructive">*</span>
                    </Label>
                    <Input id="start_date" type="date" value={formData.start_date} onChange={handleChange} />
                    <span className="min-h-[16px] text-xs leading-[16px] text-destructive block">{errors.start_date}</span>
                  </div>

                  <div className="grid gap-1">
                    <Label htmlFor="end_date">
                      Data de Fim <span className="ml-px text-destructive">*</span>
                    </Label>
                    <Input id="end_date" type="date" value={formData.end_date} onChange={handleChange} />
                    <span className="min-h-[16px] text-xs leading-[16px] text-destructive block">{errors.end_date}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <SectionHeading>Observações</SectionHeading>
                <div className="grid gap-1">
                  <Label htmlFor="notes">Observações</Label>
                  <Textarea id="notes" value={formData.notes} onChange={handleChange} placeholder="Observações adicionais sobre o auxílio..." rows={3} />
                  <span className="min-h-[16px] text-xs leading-[16px] text-destructive block" />
                </div>
              </div>

            </div>
          </div>

          <DialogFooter className="shrink-0 flex-col-reverse sm:flex-row sm:justify-end gap-2 border-t border-border/70 px-6 py-4 bg-muted/20">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || loadingData}
              className="h-9 w-full rounded-[10px] sm:w-auto gap-2 font-semibold"
            >
              {(isSubmitting || loadingData) && <Loader2 className="h-4 w-4 animate-spin" />}
              {isSubmitting
                ? initialData ? "Salvando alterações..." : "Criando auxílio..."
                : loadingData ? "Carregando..."
                : initialData ? "Salvar Alterações" : "Criar Auxílio"
              }
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
