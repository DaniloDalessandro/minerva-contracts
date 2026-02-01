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

  // Load dropdown data
  useEffect(() => {
    async function loadDropdownData() {
      try {
        setLoadingData(true);
        console.log("🔍 Fetching dropdown data...");
        
        const [employeesData, budgetLinesData] = await Promise.all([
          fetchEmployees(),
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
          budget_line: "Erro ao carregar dados. Verifique sua conexão."
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
        console.log("📝 Editing existing contract:", initialData);
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
        console.log("➕ Creating new contract - resetting form");
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

  // Auto-set current_value when original_value changes and current_value is empty
  useEffect(() => {
    if (formData.original_value && !formData.current_value) {
      setFormData(prev => ({ ...prev, current_value: prev.original_value }));
    }
  }, [formData.original_value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData({ ...formData, [id]: value });
    
    // Clear error when user starts typing
    if (errors[id]) {
      setErrors({ ...errors, [id]: "" });
    }
  };

  const handleSelectChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: 
      field === 'budget_line' || field === 'main_inspector' || field === 'substitute_inspector'
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

    if (!formData.budget_line || formData.budget_line === 0) {
      newErrors.budget_line = "Linha orçamentária é obrigatória";
    }

    if (!formData.main_inspector || formData.main_inspector === 0) {
      newErrors.main_inspector = "Fiscal principal é obrigatório";
    }

    if (!formData.substitute_inspector || formData.substitute_inspector === 0) {
      newErrors.substitute_inspector = "Fiscal substituto é obrigatório";
    }

    if (formData.main_inspector && formData.substitute_inspector && formData.main_inspector === formData.substitute_inspector) {
      newErrors.substitute_inspector = "Fiscal substituto deve ser diferente do fiscal principal";
    }

    if (!formData.payment_nature) {
      newErrors.payment_nature = "Natureza do pagamento é obrigatória";
    }

    if (!formData.description) {
      newErrors.description = "Descrição é obrigatória";
    } else if (formData.description.length > 255) {
      newErrors.description = "Descrição deve ter no máximo 255 caracteres";
    }

    if (!formData.original_value) {
      newErrors.original_value = "Valor original é obrigatório";
    } else {
      const originalValue = parseFloat(formData.original_value.replace(/[^\d.,]/g, '').replace(',', '.'));
      if (isNaN(originalValue) || originalValue <= 0) {
        newErrors.original_value = "Valor original deve ser um número válido maior que zero";
      }
    }

    if (!formData.current_value) {
      newErrors.current_value = "Valor atual é obrigatório";
    } else {
      const currentValue = parseFloat(formData.current_value.replace(/[^\d.,]/g, '').replace(',', '.'));
      if (isNaN(currentValue) || currentValue <= 0) {
        newErrors.current_value = "Valor atual deve ser um número válido maior que zero";
      }
    }

    if (!formData.start_date) {
      newErrors.start_date = "Data de início é obrigatória";
    }

    if (formData.start_date && formData.end_date) {
      if (new Date(formData.start_date) >= new Date(formData.end_date)) {
        newErrors.end_date = "Data de término deve ser posterior à data de início";
      }
    }

    if (formData.signing_date && formData.expiration_date) {
      if (new Date(formData.signing_date) >= new Date(formData.expiration_date)) {
        newErrors.expiration_date = "Data de expiração deve ser posterior à data de assinatura";
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

    // Prepare data for submission
    const submitData = {
      ...formData,
      budget_line: formData.budget_line > 0 ? formData.budget_line : null,
      main_inspector: formData.main_inspector > 0 ? formData.main_inspector : null,
      substitute_inspector: formData.substitute_inspector > 0 ? formData.substitute_inspector : null,
      // Ensure date fields are properly formatted or null
      end_date: formData.end_date || null,
      signing_date: formData.signing_date || null,
      expiration_date: formData.expiration_date || null,
      // Ensure string values
      original_value: formData.original_value.toString(),
      current_value: formData.current_value.toString(),
    };

    onSubmit(submitData);
  };

  const getPaymentNatureLabel = (nature: string) => {
    switch (nature) {
      case 'PAGAMENTO ÚNICO':
        return 'Único';
      case 'PAGAMENTO ANUAL':
        return 'Anual';
      case 'PAGAMENTO SEMANAL':
        return 'Semanal';
      case 'PAGAMENTO MENSAL':
        return 'Mensal';
      case 'PAGAMENTO QUINZENAL':
        return 'Quinzenal';
      case 'PAGAMENTO TRIMESTRAL':
        return 'Trimestral';
      case 'PAGAMENTO SEMESTRAL':
        return 'Semestral';
      case 'PAGAMENTO SOB DEMANDA':
        return 'Sob Demanda';
      default:
        return nature;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ATIVO':
        return 'Ativo';
      case 'ENCERRADO':
        return 'Encerrado';
      default:
        return status;
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[900px] max-w-[90vw] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-primary">
              {initialData ? "Editar Contrato" : "Novo Contrato"}
            </DialogTitle>
            <hr className="mt-2 border-b border-gray-200" />
          </DialogHeader>

          <div className="grid gap-4 py-6">
            {/* Protocol Number Display (only for editing) */}
            {initialData && (
              <div className="space-y-4">
                <h3 className="text-md font-semibold text-gray-700 border-b pb-2">Informações do Protocolo</h3>
                
                <div className="grid gap-2">
                  <Label>Número do Protocolo</Label>
                  <Input
                    value={initialData.protocol_number}
                    readOnly
                    className="bg-gray-50 font-mono font-semibold"
                  />
                </div>
              </div>
            )}

            {/* Seção: Dados Básicos */}
            <div className="space-y-4">
              <h3 className="text-md font-semibold text-gray-700 border-b pb-2">Dados Básicos</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2 grid gap-2">
                  <Label htmlFor="budget_line">Linha Orçamentária *</Label>
                  <Select
                    onValueChange={(value) => handleSelectChange("budget_line", value)}
                    value={formData.budget_line > 0 ? formData.budget_line.toString() : ""}
                    disabled={loadingData}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={
                        loadingData 
                          ? "Carregando linhas orçamentárias..." 
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
                  <Label htmlFor="main_inspector">Fiscal Principal *</Label>
                  <Select
                    onValueChange={(value) => handleSelectChange("main_inspector", value)}
                    value={formData.main_inspector > 0 ? formData.main_inspector.toString() : ""}
                    disabled={loadingData}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={
                        loadingData 
                          ? "Carregando funcionários..." 
                          : "Selecione o fiscal principal"
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
                  {errors.main_inspector && <span className="text-sm text-red-500">{errors.main_inspector}</span>}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="substitute_inspector">Fiscal Substituto *</Label>
                  <Select
                    onValueChange={(value) => handleSelectChange("substitute_inspector", value)}
                    value={formData.substitute_inspector > 0 ? formData.substitute_inspector.toString() : ""}
                    disabled={loadingData}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={
                        loadingData 
                          ? "Carregando funcionários..." 
                          : "Selecione o fiscal substituto"
                      } />
                    </SelectTrigger>
                    <SelectContent>
                      {employees
                        .filter(emp => emp.id !== formData.main_inspector)
                        .map((employee) => (
                          <SelectItem key={employee.id} value={employee.id.toString()}>
                            {employee.full_name} {employee.employee_id ? `(${employee.employee_id})` : ''}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  {errors.substitute_inspector && <span className="text-sm text-red-500">{errors.substitute_inspector}</span>}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="payment_nature">Natureza do Pagamento *</Label>
                  <Select
                    onValueChange={(value) => handleSelectChange("payment_nature", value)}
                    value={formData.payment_nature}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione a natureza do pagamento" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PAGAMENTO ÚNICO">{getPaymentNatureLabel("PAGAMENTO ÚNICO")}</SelectItem>
                      <SelectItem value="PAGAMENTO ANUAL">{getPaymentNatureLabel("PAGAMENTO ANUAL")}</SelectItem>
                      <SelectItem value="PAGAMENTO SEMANAL">{getPaymentNatureLabel("PAGAMENTO SEMANAL")}</SelectItem>
                      <SelectItem value="PAGAMENTO MENSAL">{getPaymentNatureLabel("PAGAMENTO MENSAL")}</SelectItem>
                      <SelectItem value="PAGAMENTO QUINZENAL">{getPaymentNatureLabel("PAGAMENTO QUINZENAL")}</SelectItem>
                      <SelectItem value="PAGAMENTO TRIMESTRAL">{getPaymentNatureLabel("PAGAMENTO TRIMESTRAL")}</SelectItem>
                      <SelectItem value="PAGAMENTO SEMESTRAL">{getPaymentNatureLabel("PAGAMENTO SEMESTRAL")}</SelectItem>
                      <SelectItem value="PAGAMENTO SOB DEMANDA">{getPaymentNatureLabel("PAGAMENTO SOB DEMANDA")}</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.payment_nature && <span className="text-sm text-red-500">{errors.payment_nature}</span>}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="status">Status *</Label>
                  <Select
                    onValueChange={(value) => handleSelectChange("status", value)}
                    value={formData.status}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione o status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ATIVO">{getStatusLabel("ATIVO")}</SelectItem>
                      <SelectItem value="ENCERRADO">{getStatusLabel("ENCERRADO")}</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.status && <span className="text-sm text-red-500">{errors.status}</span>}
                </div>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="description">Descrição *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Descrição detalhada do contrato..."
                  rows={3}
                  maxLength={255}
                  required
                />
                <div className="text-xs text-gray-500">
                  {formData.description.length}/255 caracteres
                </div>
                {errors.description && <span className="text-sm text-red-500">{errors.description}</span>}
              </div>
            </div>

            {/* Seção: Valores */}
            <div className="space-y-4">
              <h3 className="text-md font-semibold text-gray-700 border-b pb-2">Valores</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="original_value">Valor Original *</Label>
                  <Input
                    id="original_value"
                    value={formData.original_value}
                    onChange={handleChange}
                    placeholder="0,00"
                    required
                  />
                  {errors.original_value && <span className="text-sm text-red-500">{errors.original_value}</span>}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="current_value">Valor Atual *</Label>
                  <Input
                    id="current_value"
                    value={formData.current_value}
                    onChange={handleChange}
                    placeholder="0,00"
                    required
                  />
                  {errors.current_value && <span className="text-sm text-red-500">{errors.current_value}</span>}
                </div>
              </div>
            </div>

            {/* Seção: Datas Principais */}
            <div className="space-y-4">
              <h3 className="text-md font-semibold text-gray-700 border-b pb-2">Datas Principais</h3>
              
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
                  <Label htmlFor="end_date">Data de Término</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={formData.end_date}
                    onChange={handleChange}
                  />
                  {errors.end_date && <span className="text-sm text-red-500">{errors.end_date}</span>}
                </div>
              </div>
            </div>

            {/* Seção: Datas Opcionais */}
            <div className="space-y-4">
              <h3 className="text-md font-semibold text-gray-700 border-b pb-2">Datas Opcionais</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="signing_date">Data de Assinatura</Label>
                  <Input
                    id="signing_date"
                    type="date"
                    value={formData.signing_date}
                    onChange={handleChange}
                  />
                  {errors.signing_date && <span className="text-sm text-red-500">{errors.signing_date}</span>}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="expiration_date">Data de Expiração</Label>
                  <Input
                    id="expiration_date"
                    type="date"
                    value={formData.expiration_date}
                    onChange={handleChange}
                  />
                  {errors.expiration_date && <span className="text-sm text-red-500">{errors.expiration_date}</span>}
                </div>
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
                initialData ? "Salvar Alterações" : "Criar Contrato"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}