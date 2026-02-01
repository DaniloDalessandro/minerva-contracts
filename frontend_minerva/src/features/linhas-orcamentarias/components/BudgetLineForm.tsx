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
import { BudgetLine, fetchBudgets, fetchManagementCenters, fetchRequestingCenters, fetchEmployees } from "@/lib/api/budgetlines";

interface BudgetLineFormProps {
  open: boolean;
  handleClose: () => void;
  initialData: BudgetLine | null;
  onSubmit: (data: any) => void;
  isSubmitting?: boolean;
}

interface Budget {
  id: number;
  name: string;
}

interface Center {
  id: number;
  name: string;
}

interface Employee {
  id: number;
  full_name: string;
  employee_id?: string;
}

export default function BudgetLineForm({
  open,
  handleClose,
  initialData,
  onSubmit,
  isSubmitting = false,
}: BudgetLineFormProps) {
  const [formData, setFormData] = useState<any>({
    id: undefined,
    budget: 0,
    category: "OPEX",
    expense_type: "Base Principal",
    management_center: 0,
    requesting_center: 0,
    summary_description: "",
    object: "",
    budget_classification: "NOVO",
    main_fiscal: null,
    secondary_fiscal: null,
    contract_type: "SERVIÇO",
    probable_procurement_type: "LICITAÇÃO",
    budgeted_amount: "",
    process_status: null,
    contract_status: null,
    contract_notes: "",
  });

  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [managementCenters, setManagementCenters] = useState<Center[]>([]);
  const [requestingCenters, setRequestingCenters] = useState<Center[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  
  const [loadingData, setLoadingData] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load dropdown data
  useEffect(() => {
    async function loadDropdownData() {
      try {
        setLoadingData(true);
        console.log("🔍 Fetching dropdown data...");
        
        const [budgetsData, managementCentersData, requestingCentersData, employeesData] = await Promise.all([
          fetchBudgets(),
          fetchManagementCenters(),
          fetchRequestingCenters(),
          fetchEmployees()
        ]);
        
        console.log("📋 Dropdown data loaded:", {
          budgets: budgetsData.length,
          managementCenters: managementCentersData.length,
          requestingCenters: requestingCentersData.length,
          employees: employeesData.length
        });
        
        setBudgets(budgetsData);
        setManagementCenters(managementCentersData);
        setRequestingCenters(requestingCentersData);
        setEmployees(employeesData);
        
      } catch (error) {
        console.error("❌ Erro ao carregar dados dos dropdowns:", error);
        setErrors(prev => ({
          ...prev, 
          budget: "Erro ao carregar dados. Verifique sua conexão."
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
        console.log("📝 Editing existing budget line:", initialData);
        setFormData({
          id: initialData.id,
          budget: initialData.budget?.id || 0,
          category: initialData.category || "OPEX",
          expense_type: initialData.expense_type || "Base Principal",
          management_center: initialData.management_center?.id || 0,
          requesting_center: initialData.requesting_center?.id || 0,
          summary_description: initialData.summary_description || "",
          object: initialData.object || "",
          budget_classification: initialData.budget_classification || "NOVO",
          main_fiscal: initialData.main_fiscal?.id || null,
          secondary_fiscal: initialData.secondary_fiscal?.id || null,
          contract_type: initialData.contract_type || "SERVIÇO",
          probable_procurement_type: initialData.probable_procurement_type || "LICITAÇÃO",
          budgeted_amount: initialData.budgeted_amount || "",
          process_status: initialData.process_status || null,
          contract_status: initialData.contract_status || null,
          contract_notes: initialData.contract_notes || "",
        });
      } else {
        console.log("➕ Creating new budget line - resetting form");
        setFormData({
          id: undefined,
          budget: 0,
          category: "OPEX",
          expense_type: "Base Principal",
          management_center: 0,
          requesting_center: 0,
          summary_description: "",
          object: "",
          budget_classification: "NOVO",
          main_fiscal: null,
          secondary_fiscal: null,
          contract_type: "SERVIÇO",
          probable_procurement_type: "LICITAÇÃO",
          budgeted_amount: "",
          process_status: null,
          contract_status: null,
          contract_notes: "",
        });
      }
      setErrors({});
    }
  }, [open, initialData]);

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
      field === 'budget' || field === 'management_center' || field === 'requesting_center' || 
      field === 'main_fiscal' || field === 'secondary_fiscal'
        ? (value === "" ? null : parseInt(value))
        : value 
    });
    
    // Clear error when user selects
    if (errors[field]) {
      setErrors({ ...errors, [field]: "" });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.budget || formData.budget === 0) {
      newErrors.budget = "Orçamento é obrigatório";
    }

    if (!formData.expense_type) {
      newErrors.expense_type = "Tipo de despesa é obrigatório";
    }

    if (!formData.management_center || formData.management_center === 0) {
      newErrors.management_center = "Centro gestor é obrigatório";
    }

    if (!formData.requesting_center || formData.requesting_center === 0) {
      newErrors.requesting_center = "Centro solicitante é obrigatório";
    }

    if (!formData.summary_description) {
      newErrors.summary_description = "Descrição resumida é obrigatória";
    }

    if (!formData.object) {
      newErrors.object = "Objeto é obrigatório";
    }

    if (!formData.probable_procurement_type) {
      newErrors.probable_procurement_type = "Tipo de aquisição é obrigatório";
    }

    if (!formData.budgeted_amount) {
      newErrors.budgeted_amount = "Valor orçado é obrigatório";
    } else {
      const budgetedAmount = parseFloat(formData.budgeted_amount.replace(/[^\d.,]/g, '').replace(',', '.'));
      if (isNaN(budgetedAmount) || budgetedAmount < 0.01) {
        newErrors.budgeted_amount = "Valor orçado deve ser um número válido maior ou igual a 0.01";
      }
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
      budget: formData.budget > 0 ? formData.budget : null,
      management_center: formData.management_center > 0 ? formData.management_center : null,
      requesting_center: formData.requesting_center > 0 ? formData.requesting_center : null,
      main_fiscal: formData.main_fiscal > 0 ? formData.main_fiscal : null,
      secondary_fiscal: formData.secondary_fiscal > 0 ? formData.secondary_fiscal : null,
      // Ensure string values
      budgeted_amount: formData.budgeted_amount.toString(),
    };

    onSubmit(submitData);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[800px] max-w-[90vw] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-primary">
              {initialData ? "Editar Linha Orçamentária" : "Nova Linha Orçamentária"}
            </DialogTitle>
            <hr className="mt-2 border-b border-gray-200" />
          </DialogHeader>

          <div className="grid gap-4 py-6">
            {/* Seção: Dados Básicos */}
            <div className="space-y-4">
              <h3 className="text-md font-semibold text-gray-700 border-b pb-2">Dados Básicos</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="budget">Orçamento *</Label>
                  <Select
                    onValueChange={(value) => handleSelectChange("budget", value)}
                    value={formData.budget > 0 ? formData.budget.toString() : ""}
                    disabled={loadingData}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={
                        loadingData 
                          ? "Carregando orçamentos..." 
                          : "Selecione um orçamento"
                      } />
                    </SelectTrigger>
                    <SelectContent>
                      {budgets.map((budget) => (
                        <SelectItem key={budget.id} value={budget.id.toString()}>
                          {budget.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.budget && <span className="text-sm text-red-500">{errors.budget}</span>}
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
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="expense_type">Tipo de Despesa *</Label>
                  <Select
                    onValueChange={(value) => handleSelectChange("expense_type", value)}
                    value={formData.expense_type}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione um tipo de despesa" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Base Principal">Base Principal</SelectItem>
                      <SelectItem value="Serviços Especializados">Serviços Especializados</SelectItem>
                      <SelectItem value="Despesas Compartilhadas">Despesas Compartilhadas</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.expense_type && <span className="text-sm text-red-500">{errors.expense_type}</span>}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="budget_classification">Classificação Orçamentária</Label>
                  <Select
                    onValueChange={(value) => handleSelectChange("budget_classification", value)}
                    value={formData.budget_classification}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione uma classificação" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NOVO">Novo</SelectItem>
                      <SelectItem value="RENOVAÇÃO">Renovação</SelectItem>
                      <SelectItem value="CARY OVER">Cary Over</SelectItem>
                      <SelectItem value="REPLANEJAMENTO">Replanejamento</SelectItem>
                      <SelectItem value="N/A">N/A</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="summary_description">Descrição Resumida *</Label>
                  <Input
                    id="summary_description"
                    value={formData.summary_description}
                    onChange={handleChange}
                    placeholder="Descrição resumida da linha orçamentária"
                    required
                  />
                  {errors.summary_description && <span className="text-sm text-red-500">{errors.summary_description}</span>}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="object">Objeto *</Label>
                  <Input
                    id="object"
                    value={formData.object}
                    onChange={handleChange}
                    placeholder="Objeto da linha orçamentária"
                    required
                  />
                  {errors.object && <span className="text-sm text-red-500">{errors.object}</span>}
                </div>
              </div>
            </div>

            {/* Seção: Centros */}
            <div className="space-y-4">
              <h3 className="text-md font-semibold text-gray-700 border-b pb-2">Centros</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="management_center">Centro Gestor *</Label>
                  <Select
                    onValueChange={(value) => handleSelectChange("management_center", value)}
                    value={formData.management_center > 0 ? formData.management_center.toString() : ""}
                    disabled={loadingData}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={
                        loadingData 
                          ? "Carregando centros..." 
                          : "Selecione um centro gestor"
                      } />
                    </SelectTrigger>
                    <SelectContent>
                      {managementCenters.map((center) => (
                        <SelectItem key={center.id} value={center.id.toString()}>
                          {center.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.management_center && <span className="text-sm text-red-500">{errors.management_center}</span>}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="requesting_center">Centro Solicitante *</Label>
                  <Select
                    onValueChange={(value) => handleSelectChange("requesting_center", value)}
                    value={formData.requesting_center > 0 ? formData.requesting_center.toString() : ""}
                    disabled={loadingData}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={
                        loadingData 
                          ? "Carregando centros..." 
                          : "Selecione um centro solicitante"
                      } />
                    </SelectTrigger>
                    <SelectContent>
                      {requestingCenters.map((center) => (
                        <SelectItem key={center.id} value={center.id.toString()}>
                          {center.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.requesting_center && <span className="text-sm text-red-500">{errors.requesting_center}</span>}
                </div>
              </div>
            </div>

            {/* Seção: Contrato */}
            <div className="space-y-4">
              <h3 className="text-md font-semibold text-gray-700 border-b pb-2">Informações de Contrato</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="contract_type">Tipo de Contrato</Label>
                  <Select
                    onValueChange={(value) => handleSelectChange("contract_type", value)}
                    value={formData.contract_type}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione um tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SERVIÇO">Serviço</SelectItem>
                      <SelectItem value="FORNECIMENTO">Fornecimento</SelectItem>
                      <SelectItem value="ASSINATURA">Assinatura</SelectItem>
                      <SelectItem value="FORNECIMENTO/SERVIÇO">Fornecimento/Serviço</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="probable_procurement_type">Tipo de Aquisição *</Label>
                  <Select
                    onValueChange={(value) => handleSelectChange("probable_procurement_type", value)}
                    value={formData.probable_procurement_type}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione um tipo de aquisição" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LICITAÇÃO">Licitação</SelectItem>
                      <SelectItem value="DISPENSA EM RAZÃO DO VALOR">Dispensa em Razão do Valor</SelectItem>
                      <SelectItem value="CONVÊNIO">Convênio</SelectItem>
                      <SelectItem value="FUNDO FIXO">Fundo Fixo</SelectItem>
                      <SelectItem value="INEXIGIBILIDADE">Inexigibilidade</SelectItem>
                      <SelectItem value="ATA DE REGISTRO DE PREÇO">Ata de Registro de Preço</SelectItem>
                      <SelectItem value="ACORDO DE COOPERAÇÃO">Acordo de Cooperação</SelectItem>
                      <SelectItem value="APOSTILAMENTO">Apostilamento</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.probable_procurement_type && <span className="text-sm text-red-500">{errors.probable_procurement_type}</span>}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="budgeted_amount">Valor Orçado *</Label>
                  <Input
                    id="budgeted_amount"
                    value={formData.budgeted_amount}
                    onChange={handleChange}
                    placeholder="0,00"
                    required
                  />
                  {errors.budgeted_amount && <span className="text-sm text-red-500">{errors.budgeted_amount}</span>}
                </div>
              </div>
            </div>

            {/* Seção: Fiscais */}
            <div className="space-y-4">
              <h3 className="text-md font-semibold text-gray-700 border-b pb-2">Fiscais</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="main_fiscal">Fiscal Principal</Label>
                  <Select
                    onValueChange={(value) => handleSelectChange("main_fiscal", value)}
                    value={formData.main_fiscal > 0 ? formData.main_fiscal.toString() : ""}
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
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="secondary_fiscal">Fiscal Substituto</Label>
                  <Select
                    onValueChange={(value) => handleSelectChange("secondary_fiscal", value)}
                    value={formData.secondary_fiscal > 0 ? formData.secondary_fiscal.toString() : ""}
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
                      {employees.filter(emp => emp.id !== formData.main_fiscal).map((employee) => (
                        <SelectItem key={employee.id} value={employee.id.toString()}>
                          {employee.full_name} {employee.employee_id ? `(${employee.employee_id})` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Seção: Status */}
            <div className="space-y-4">
              <h3 className="text-md font-semibold text-gray-700 border-b pb-2">Status</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="process_status">Status do Processo</Label>
                  <Select
                    onValueChange={(value) => handleSelectChange("process_status", value)}
                    value={formData.process_status || ""}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione um status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="VENCIDO">Vencido</SelectItem>
                      <SelectItem value="DENTRO DO PRAZO">Dentro do Prazo</SelectItem>
                      <SelectItem value="ELABORADO COM ATRASO">Elaborado com Atraso</SelectItem>
                      <SelectItem value="ELABORADO NO PRAZO">Elaborado no Prazo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="contract_status">Status do Contrato</Label>
                  <Select
                    onValueChange={(value) => handleSelectChange("contract_status", value)}
                    value={formData.contract_status || ""}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione um status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DENTRO DO PRAZO">Dentro do Prazo</SelectItem>
                      <SelectItem value="CONTRATADO NO PRAZO">Contratado no Prazo</SelectItem>
                      <SelectItem value="CONTRATADO COM ATRASO">Contratado com Atraso</SelectItem>
                      <SelectItem value="PRAZO VENCIDO">Prazo Vencido</SelectItem>
                      <SelectItem value="LINHA TOTALMENTE REMANEJADA">Totalmente Remanejada</SelectItem>
                      <SelectItem value="LINHA TOTALMENTE EXECUTADA">Totalmente Executada</SelectItem>
                      <SelectItem value="LINHA DE PAGAMENTO">Linha de Pagamento</SelectItem>
                      <SelectItem value="LINHA PARCIALMENTE REMANEJADA">Parcialmente Remanejada</SelectItem>
                      <SelectItem value="LINHA PARCIALMENTE EXECUTADA">Parcialmente Executada</SelectItem>
                      <SelectItem value="N/A">N/A</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Seção: Observações */}
            <div className="space-y-4">
              <h3 className="text-md font-semibold text-gray-700 border-b pb-2">Observações</h3>
              
              <div className="grid gap-2">
                <Label htmlFor="contract_notes">Observações</Label>
                <Textarea
                  id="contract_notes"
                  value={formData.contract_notes}
                  onChange={handleChange}
                  placeholder="Observações adicionais sobre a linha orçamentária..."
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
                initialData ? "Salvar Alterações" : "Criar Linha Orçamentária"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}