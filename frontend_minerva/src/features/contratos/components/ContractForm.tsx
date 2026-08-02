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
import { Contract, fetchEmployees, fetchBudgetLines } from "@/lib/api/contratos";

interface ContractFormProps {
  open: boolean;
  handleClose: () => void;
  initialData: Contract | null;
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

const PAYMENT_NATURE_LABELS: Record<string, string> = {
  "PAGAMENTO ÚNICO": "Único",
  "PAGAMENTO ANUAL": "Anual",
  "PAGAMENTO SEMANAL": "Semanal",
  "PAGAMENTO MENSAL": "Mensal",
  "PAGAMENTO QUINZENAL": "Quinzenal",
  "PAGAMENTO TRIMESTRAL": "Trimestral",
  "PAGAMENTO SEMESTRAL": "Semestral",
  "PAGAMENTO SOB DEMANDA": "Sob Demanda",
};

export default function ContractForm({
  open,
  handleClose,
  initialData,
  onSubmit,
  isSubmitting = false,
}: ContractFormProps) {
  const [formData, setFormData] = useState<any>({
    id: undefined,
    budget_line: 0,
    main_inspector: 0,
    substitute_inspector: 0,
    payment_nature: "PAGAMENTO ÚNICO",
    description: "",
    original_value: "",
    current_value: "",
    start_date: "",
    end_date: "",
    signing_date: "",
    expiration_date: "",
    status: "ATIVO",
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
          fetchEmployees(),
          fetchBudgetLines()
        ]);
        setEmployees(employeesData);
        setBudgetLines(budgetLinesData);
      } catch {
        setErrors(prev => ({ ...prev, budget_line: "Erro ao carregar dados. Verifique sua conexão." }));
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
          budget_line: initialData.budget_line?.id || 0,
          main_inspector: initialData.main_inspector?.id || 0,
          substitute_inspector: initialData.substitute_inspector?.id || 0,
          payment_nature: initialData.payment_nature || "PAGAMENTO ÚNICO",
          description: initialData.description || "",
          original_value: initialData.original_value || "",
          current_value: initialData.current_value || "",
          start_date: initialData.start_date || "",
          end_date: initialData.end_date || "",
          signing_date: initialData.signing_date || "",
          expiration_date: initialData.expiration_date || "",
          status: initialData.status || "ATIVO",
        });
      } else {
        setFormData({
          id: undefined,
          budget_line: 0,
          main_inspector: 0,
          substitute_inspector: 0,
          payment_nature: "PAGAMENTO ÚNICO",
          description: "",
          original_value: "",
          current_value: "",
          start_date: "",
          end_date: "",
          signing_date: "",
          expiration_date: "",
          status: "ATIVO",
        });
      }
      setErrors({});
    }
  }, [open, initialData]);

  useEffect(() => {
    if (formData.original_value && !formData.current_value) {
      setFormData((prev: any) => ({ ...prev, current_value: prev.original_value }));
    }
  }, [formData.original_value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData({ ...formData, [id]: value });
    if (errors[id]) setErrors({ ...errors, [id]: "" });
  };

  const handleSelectChange = (field: string, value: string) => {
    setFormData({
      ...formData,
      [field]: ["budget_line", "main_inspector", "substitute_inspector"].includes(field)
        ? parseInt(value)
        : value,
    });
    if (errors[field]) setErrors({ ...errors, [field]: "" });
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.budget_line || formData.budget_line === 0) newErrors.budget_line = "Linha orçamentária é obrigatória";
    if (!formData.main_inspector || formData.main_inspector === 0) newErrors.main_inspector = "Fiscal principal é obrigatório";
    if (!formData.substitute_inspector || formData.substitute_inspector === 0) newErrors.substitute_inspector = "Fiscal substituto é obrigatório";
    if (formData.main_inspector && formData.substitute_inspector && formData.main_inspector === formData.substitute_inspector)
      newErrors.substitute_inspector = "Fiscal substituto deve ser diferente do fiscal principal";
    if (!formData.payment_nature) newErrors.payment_nature = "Natureza do pagamento é obrigatória";
    if (!formData.description) {
      newErrors.description = "Descrição é obrigatória";
    } else if (formData.description.length > 255) {
      newErrors.description = "Descrição deve ter no máximo 255 caracteres";
    }
    if (!formData.original_value) {
      newErrors.original_value = "Valor original é obrigatório";
    } else {
      const v = parseFloat(formData.original_value.replace(/[^\d.,]/g, "").replace(",", "."));
      if (isNaN(v) || v <= 0) newErrors.original_value = "Valor original deve ser um número válido maior que zero";
    }
    if (!formData.current_value) {
      newErrors.current_value = "Valor atual é obrigatório";
    } else {
      const v = parseFloat(formData.current_value.replace(/[^\d.,]/g, "").replace(",", "."));
      if (isNaN(v) || v <= 0) newErrors.current_value = "Valor atual deve ser um número válido maior que zero";
    }
    if (!formData.start_date) newErrors.start_date = "Data de início é obrigatória";
    if (formData.start_date && formData.end_date) {
      if (new Date(formData.start_date) >= new Date(formData.end_date))
        newErrors.end_date = "Data de término deve ser posterior à data de início";
    }
    if (formData.signing_date && formData.expiration_date) {
      if (new Date(formData.signing_date) >= new Date(formData.expiration_date))
        newErrors.expiration_date = "Data de expiração deve ser posterior à data de assinatura";
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
      budget_line: formData.budget_line > 0 ? formData.budget_line : null,
      main_inspector: formData.main_inspector > 0 ? formData.main_inspector : null,
      substitute_inspector: formData.substitute_inspector > 0 ? formData.substitute_inspector : null,
      end_date: formData.end_date || null,
      signing_date: formData.signing_date || null,
      expiration_date: formData.expiration_date || null,
      original_value: formData.original_value.toString(),
      current_value: formData.current_value.toString(),
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="flex flex-col gap-0 p-0 sm:max-w-[900px] max-w-[92vw] max-h-[90vh] overflow-hidden">
        <form onSubmit={handleSubmit} className="flex flex-col min-h-0 flex-1 overflow-hidden">
          <DialogHeader className="shrink-0 px-6 pt-4 pb-3">
            <DialogTitle className="text-lg font-semibold">
              {initialData ? "Editar Contrato" : "Novo Contrato"}
            </DialogTitle>
          </DialogHeader>

          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-3">
            <div className="grid gap-4">

              {initialData && (
                <div className="space-y-2">
                  <SectionHeading>Informações do Protocolo</SectionHeading>
                  <div className="grid gap-1">
                    <Label>Número do Protocolo</Label>
                    <Input value={initialData.protocol_number} readOnly className="bg-muted/40 font-mono font-semibold" />
                    <span className="min-h-[16px] text-xs leading-[16px] text-destructive block" />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <SectionHeading>Dados Básicos</SectionHeading>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="md:col-span-2 grid gap-1">
                    <Label htmlFor="budget_line">
                      Linha Orçamentária <span className="ml-px text-destructive">*</span>
                    </Label>
                    <Select
                      onValueChange={(value) => handleSelectChange("budget_line", value)}
                      value={formData.budget_line > 0 ? formData.budget_line.toString() : ""}
                      disabled={loadingData}
                    >
                      <SelectTrigger id="budget_line" className="w-full">
                        <SelectValue placeholder={loadingData ? "Carregando linhas orçamentárias..." : "Selecione uma linha orçamentária"} />
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
                    <Label htmlFor="main_inspector">
                      Fiscal Principal <span className="ml-px text-destructive">*</span>
                    </Label>
                    <Select
                      onValueChange={(value) => handleSelectChange("main_inspector", value)}
                      value={formData.main_inspector > 0 ? formData.main_inspector.toString() : ""}
                      disabled={loadingData}
                    >
                      <SelectTrigger id="main_inspector" className="w-full">
                        <SelectValue placeholder={loadingData ? "Carregando funcionários..." : "Selecione o fiscal principal"} />
                      </SelectTrigger>
                      <SelectContent>
                        {employees.map((emp) => (
                          <SelectItem key={emp.id} value={emp.id.toString()}>
                            {emp.full_name} {emp.employee_id ? `(${emp.employee_id})` : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <span className="min-h-[16px] text-xs leading-[16px] text-destructive block">{errors.main_inspector}</span>
                  </div>

                  <div className="grid gap-1">
                    <Label htmlFor="substitute_inspector">
                      Fiscal Substituto <span className="ml-px text-destructive">*</span>
                    </Label>
                    <Select
                      onValueChange={(value) => handleSelectChange("substitute_inspector", value)}
                      value={formData.substitute_inspector > 0 ? formData.substitute_inspector.toString() : ""}
                      disabled={loadingData}
                    >
                      <SelectTrigger id="substitute_inspector" className="w-full">
                        <SelectValue placeholder={loadingData ? "Carregando funcionários..." : "Selecione o fiscal substituto"} />
                      </SelectTrigger>
                      <SelectContent>
                        {employees.filter(emp => emp.id !== formData.main_inspector).map((emp) => (
                          <SelectItem key={emp.id} value={emp.id.toString()}>
                            {emp.full_name} {emp.employee_id ? `(${emp.employee_id})` : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <span className="min-h-[16px] text-xs leading-[16px] text-destructive block">{errors.substitute_inspector}</span>
                  </div>

                  <div className="grid gap-1">
                    <Label htmlFor="payment_nature">
                      Natureza do Pagamento <span className="ml-px text-destructive">*</span>
                    </Label>
                    <Select onValueChange={(value) => handleSelectChange("payment_nature", value)} value={formData.payment_nature}>
                      <SelectTrigger id="payment_nature" className="w-full">
                        <SelectValue placeholder="Selecione a natureza do pagamento" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(PAYMENT_NATURE_LABELS).map(([k, v]) => (
                          <SelectItem key={k} value={k}>{v}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <span className="min-h-[16px] text-xs leading-[16px] text-destructive block">{errors.payment_nature}</span>
                  </div>

                  <div className="grid gap-1">
                    <Label htmlFor="status">
                      Status <span className="ml-px text-destructive">*</span>
                    </Label>
                    <Select onValueChange={(value) => handleSelectChange("status", value)} value={formData.status}>
                      <SelectTrigger id="status" className="w-full">
                        <SelectValue placeholder="Selecione o status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ATIVO">Ativo</SelectItem>
                        <SelectItem value="ENCERRADO">Encerrado</SelectItem>
                      </SelectContent>
                    </Select>
                    <span className="min-h-[16px] text-xs leading-[16px] text-destructive block">{errors.status}</span>
                  </div>
                </div>

                <div className="grid gap-1">
                  <Label htmlFor="description">
                    Descrição <span className="ml-px text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Descrição detalhada do contrato..."
                    rows={3}
                    maxLength={255}
                  />
                  <div className="flex justify-between items-center">
                    <span className="min-h-[16px] text-xs leading-[16px] text-destructive block">{errors.description}</span>
                    <span className="text-xs text-muted-foreground">{formData.description.length}/255</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <SectionHeading>Valores</SectionHeading>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="grid gap-1">
                    <Label htmlFor="original_value">
                      Valor Original <span className="ml-px text-destructive">*</span>
                    </Label>
                    <Input id="original_value" value={formData.original_value} onChange={handleChange} placeholder="0,00" />
                    <span className="min-h-[16px] text-xs leading-[16px] text-destructive block">{errors.original_value}</span>
                  </div>

                  <div className="grid gap-1">
                    <Label htmlFor="current_value">
                      Valor Atual <span className="ml-px text-destructive">*</span>
                    </Label>
                    <Input id="current_value" value={formData.current_value} onChange={handleChange} placeholder="0,00" />
                    <span className="min-h-[16px] text-xs leading-[16px] text-destructive block">{errors.current_value}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <SectionHeading>Datas Principais</SectionHeading>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="grid gap-1">
                    <Label htmlFor="start_date">
                      Data de Início <span className="ml-px text-destructive">*</span>
                    </Label>
                    <Input id="start_date" type="date" value={formData.start_date} onChange={handleChange} />
                    <span className="min-h-[16px] text-xs leading-[16px] text-destructive block">{errors.start_date}</span>
                  </div>

                  <div className="grid gap-1">
                    <Label htmlFor="end_date">Data de Término</Label>
                    <Input id="end_date" type="date" value={formData.end_date} onChange={handleChange} />
                    <span className="min-h-[16px] text-xs leading-[16px] text-destructive block">{errors.end_date}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <SectionHeading>Datas Opcionais</SectionHeading>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="grid gap-1">
                    <Label htmlFor="signing_date">Data de Assinatura</Label>
                    <Input id="signing_date" type="date" value={formData.signing_date} onChange={handleChange} />
                    <span className="min-h-[16px] text-xs leading-[16px] text-destructive block">{errors.signing_date}</span>
                  </div>

                  <div className="grid gap-1">
                    <Label htmlFor="expiration_date">Data de Expiração</Label>
                    <Input id="expiration_date" type="date" value={formData.expiration_date} onChange={handleChange} />
                    <span className="min-h-[16px] text-xs leading-[16px] text-destructive block">{errors.expiration_date}</span>
                  </div>
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
                ? initialData ? "Salvando alterações..." : "Criando contrato..."
                : loadingData ? "Carregando..."
                : initialData ? "Salvar Alterações" : "Criar Contrato"
              }
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
