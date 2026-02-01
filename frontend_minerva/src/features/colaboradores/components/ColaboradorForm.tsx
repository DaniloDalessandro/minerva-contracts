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
import { Colaborador, fetchDirections, fetchManagements, fetchCoordinations } from "@/lib/api/colaboradores";

interface ColaboradorFormProps {
  open: boolean;
  handleClose: () => void;
  initialData: Colaborador | null;
  onSubmit: (data: any) => void;
  isSubmitting?: boolean;
}

interface Direction {
  id: number;
  name: string;
}

interface Management {
  id: number;
  name: string;
  direction: number | { id: number; name: string };
}

interface Coordination {
  id: number;
  name: string;
  management: number | { id: number; name: string };
}

export default function ColaboradorForm({
  open,
  handleClose,
  initialData,
  onSubmit,
  isSubmitting = false,
}: ColaboradorFormProps) {
  const [formData, setFormData] = useState<any>({
    id: undefined,
    full_name: "",
    email: "",
    cpf: "",
    phone: "",
    employee_id: "",
    position: "",
    direction: 0,
    management: 0,
    coordination: 0,
    status: "ATIVO",
  });

  const [directions, setDirections] = useState<Direction[]>([]);
  const [managements, setManagements] = useState<Management[]>([]);
  const [coordinations, setCoordinations] = useState<Coordination[]>([]);
  const [filteredManagements, setFilteredManagements] = useState<Management[]>([]);
  const [filteredCoordinations, setFilteredCoordinations] = useState<Coordination[]>([]);
  
  const [loadingDirections, setLoadingDirections] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load organizational data
  useEffect(() => {
    async function loadOrganizationalData() {
      try {
        setLoadingDirections(true);
        console.log("🔍 Fetching organizational data...");
        
        const [directionsData, managementsData, coordinationsData] = await Promise.all([
          fetchDirections(),
          fetchManagements(),
          fetchCoordinations()
        ]);
        
        console.log("📋 Organizational data loaded:", {
          directions: directionsData.length,
          managements: managementsData.length,
          coordinations: coordinationsData.length
        });
        
        setDirections(directionsData);
        setManagements(managementsData);
        setCoordinations(coordinationsData);
        
      } catch (error) {
        console.error("❌ Erro ao carregar dados organizacionais:", error);
        setErrors(prev => ({
          ...prev, 
          direction: "Erro ao carregar dados organizacionais. Verifique sua conexão."
        }));
      } finally {
        setLoadingDirections(false);
      }
    }
    
    if (open) {
      loadOrganizationalData();
    }
  }, [open]);

  // Filter managements based on selected direction
  useEffect(() => {
    console.log("🔄 Filtrando gerências para direção:", formData.direction);
    console.log("📊 Total de gerências disponíveis:", managements.length);
    
    if (formData.direction > 0) {
      console.log("🔍 Estrutura das gerências:", managements.slice(0, 3).map(m => ({
        id: m.id,
        name: m.name,
        direction: m.direction,
        directionType: typeof m.direction
      })));
      
      const filtered = managements.filter(mgmt => {
        const directionId = typeof mgmt.direction === 'object' ? mgmt.direction.id : mgmt.direction;
        return directionId === formData.direction;
      });
      console.log("✅ Gerências filtradas:", filtered.length, filtered.map(m => {
        const dirId = typeof m.direction === 'object' ? m.direction.id : m.direction;
        return `${m.name} (dir: ${dirId})`;
      }));
      setFilteredManagements(filtered);
      
      // Reset management and coordination if current selection is not valid
      if (formData.management > 0 && !filtered.find(m => m.id === formData.management)) {
        console.log("🔄 Resetando gerência/coordenação - seleção atual não é válida");
        setFormData(prev => ({ ...prev, management: 0, coordination: 0 }));
      }
    } else {
      console.log("❌ Nenhuma direção selecionada - limpando gerências");
      setFilteredManagements([]);
      setFormData(prev => ({ ...prev, management: 0, coordination: 0 }));
    }
  }, [formData.direction, managements]);

  // Filter coordinations based on selected management
  useEffect(() => {
    console.log("🔄 Filtrando coordenações para gerência:", formData.management);
    
    if (formData.management > 0) {
      const filtered = coordinations.filter(coord => {
        const managementId = typeof coord.management === 'object' ? coord.management.id : coord.management;
        return managementId === formData.management;
      });
      console.log("✅ Coordenações filtradas:", filtered.length, filtered.map(c => {
        const mgmtId = typeof c.management === 'object' ? c.management.id : c.management;
        return `${c.name} (mgmt: ${mgmtId})`;
      }));
      setFilteredCoordinations(filtered);
      
      // Reset coordination if current selection is not valid
      if (formData.coordination > 0 && !filtered.find(c => c.id === formData.coordination)) {
        console.log("🔄 Resetando coordenação - seleção atual não é válida");
        setFormData(prev => ({ ...prev, coordination: 0 }));
      }
    } else {
      console.log("❌ Nenhuma gerência selecionada - limpando coordenações");
      setFilteredCoordinations([]);
      setFormData(prev => ({ ...prev, coordination: 0 }));
    }
  }, [formData.management, coordinations]);

  useEffect(() => {
    if (open) {
      if (initialData) {
        console.log("📝 Editing existing colaborador:", initialData);
        setFormData({
          id: initialData.id,
          full_name: initialData.full_name || "",
          email: initialData.email || "",
          cpf: initialData.cpf || "",
          phone: initialData.phone || "",
          employee_id: initialData.employee_id || "",
          position: initialData.position || "",
          direction: initialData.direction?.id || 0,
          management: initialData.management?.id || 0,
          coordination: initialData.coordination?.id || 0,
          status: initialData.status,
        });
      } else {
        console.log("➕ Creating new colaborador - resetting form");
        setFormData({
          id: undefined,
          full_name: "",
          email: "",
          cpf: "",
          phone: "",
          employee_id: "",
          position: "",
          direction: 0,
          management: 0,
          coordination: 0,
          status: "ATIVO",
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
      field.includes('_id') || field === 'direction' || field === 'management' || field === 'coordination'
        ? parseInt(value) 
        : value 
    });
    
    // Clear error when user selects
    if (errors[field]) {
      setErrors({ ...errors, [field]: "" });
    }
  };

  const validateCPF = (cpf: string) => {
    // Remove all non-digit characters
    const cleanCpf = cpf.replace(/\D/g, '');
    
    // Check if CPF has 11 digits
    if (cleanCpf.length !== 11) {
      return false;
    }
    
    // Check if all digits are the same (invalid CPF)
    if (/^(\d)\1{10}$/.test(cleanCpf)) {
      return false;
    }
    
    // Validate CPF algorithm
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cleanCpf.charAt(i)) * (10 - i);
    }
    let remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cleanCpf.charAt(9))) return false;
    
    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cleanCpf.charAt(i)) * (11 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cleanCpf.charAt(10))) return false;
    
    return true;
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.full_name.trim()) {
      newErrors.full_name = "Nome completo é obrigatório";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email é obrigatório";
    } else if (!validateEmail(formData.email)) {
      newErrors.email = "Email deve ter um formato válido";
    }

    if (!formData.cpf.trim()) {
      newErrors.cpf = "CPF é obrigatório";
    } else if (!validateCPF(formData.cpf)) {
      newErrors.cpf = "CPF deve ter um formato válido";
    }


    // Phone validation removed per user request

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (loadingDirections) {
      console.warn("⚠️ Form submission blocked - organizational data still loading");
      return;
    }
    
    if (!validateForm()) {
      return;
    }

    // Prepare data for submission (convert 0 values to null for foreign keys)
    const submitData = {
      ...formData,
      direction: formData.direction > 0 ? formData.direction : null,
      management: formData.management > 0 ? formData.management : null,
      coordination: formData.coordination > 0 ? formData.coordination : null,
    };

    onSubmit(submitData);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[800px] max-w-[90vw] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-primary">
              {initialData ? "Editar Colaborador" : "Novo Colaborador"}
            </DialogTitle>
            <hr className="mt-2 border-b border-gray-200" />
          </DialogHeader>

          <div className="grid gap-4 py-6">
            {/* Seção: Dados Pessoais */}
            <div className="space-y-4">
              <h3 className="text-md font-semibold text-gray-700 border-b pb-2">Dados Pessoais</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="full_name">Nome Completo *</Label>
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={handleChange}
                    required
                    placeholder="Nome completo do colaborador"
                  />
                  {errors.full_name && <span className="text-sm text-red-500">{errors.full_name}</span>}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="email@exemplo.com"
                  />
                  {errors.email && <span className="text-sm text-red-500">{errors.email}</span>}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="cpf">CPF *</Label>
                  <Input
                    id="cpf"
                    value={formData.cpf}
                    onChange={handleChange}
                    required
                    placeholder="000.000.000-00 ou 00000000000"
                  />
                  {errors.cpf && <span className="text-sm text-red-500">{errors.cpf}</span>}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="(00) 00000-0000"
                    maxLength={15}
                  />
                  {errors.phone && <span className="text-sm text-red-500">{errors.phone}</span>}
                </div>
              </div>
            </div>

            {/* Seção: Dados Funcionais */}
            <div className="space-y-4">
              <h3 className="text-md font-semibold text-gray-700 border-b pb-2">Dados Funcionais</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="employee_id">Matrícula</Label>
                  <Input
                    id="employee_id"
                    value={formData.employee_id}
                    onChange={handleChange}
                    placeholder="Matrícula do colaborador"
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="position">Cargo</Label>
                  <Input
                    id="position"
                    value={formData.position}
                    onChange={handleChange}
                    placeholder="Cargo do colaborador"
                  />
                </div>

              </div>
            </div>

            {/* Seção: Hierarquia Organizacional */}
            <div className="space-y-4">
              <h3 className="text-md font-semibold text-gray-700 border-b pb-2">Hierarquia Organizacional</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="direction">Direção</Label>
                  <Select
                    onValueChange={(value) => handleSelectChange("direction", value)}
                    value={formData.direction > 0 ? formData.direction.toString() : ""}
                    disabled={loadingDirections}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={
                        loadingDirections 
                          ? "Carregando direções..." 
                          : "Selecione uma direção"
                      } />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Nenhuma</SelectItem>
                      {directions.map((direction) => (
                        <SelectItem key={direction.id} value={direction.id.toString()}>
                          {direction.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="management">Gerência</Label>
                  <Select
                    onValueChange={(value) => handleSelectChange("management", value)}
                    value={formData.management > 0 ? formData.management.toString() : ""}
                    disabled={formData.direction === 0}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={
                        formData.direction === 0 
                          ? "Selecione uma direção primeiro" 
                          : "Selecione uma gerência"
                      } />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Nenhuma</SelectItem>
                      {filteredManagements.map((management) => (
                        <SelectItem key={management.id} value={management.id.toString()}>
                          {management.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="coordination">Coordenação</Label>
                  <Select
                    onValueChange={(value) => handleSelectChange("coordination", value)}
                    value={formData.coordination > 0 ? formData.coordination.toString() : ""}
                    disabled={formData.management === 0}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={
                        formData.management === 0 
                          ? "Selecione uma gerência primeiro" 
                          : "Selecione uma coordenação"
                      } />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Nenhuma</SelectItem>
                      {filteredCoordinations.map((coordination) => (
                        <SelectItem key={coordination.id} value={coordination.id.toString()}>
                          {coordination.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

          </div>

          <DialogFooter className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting || loadingDirections}>
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  {initialData ? "Salvando..." : "Criando..."}
                </>
              ) : loadingDirections ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Carregando...
                </>
              ) : (
                initialData ? "Salvar Alterações" : "Criar Colaborador"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}