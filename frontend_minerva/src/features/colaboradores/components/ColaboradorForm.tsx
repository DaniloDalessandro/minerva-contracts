"use client";

import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import {
  Colaborador,
  fetchDirectionsAPI as fetchDirections,
  fetchManagementsAPI as fetchManagements,
  fetchCoordinationsAPI as fetchCoordinations,
  fetchColaboradoresAPI,
} from "@/lib/api/colaboradores";
import { formatCPF, formatPhone, onlyDigits } from "@/lib/masks";
import { isValidCPF, isValidEmail, normalizeName, collapseSpaces, normalizeEmail } from "@/lib/validators";
import { cn } from "@/lib/utils";
import { UserPlus, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

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

type FieldStatus = "idle" | "checking" | "ok" | "duplicate";

const EMPTY_FORM = {
  id: undefined as number | undefined,
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
};

function StatusIcon({ status }: { status: FieldStatus }) {
  if (status === "checking") return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;
  if (status === "ok") return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
  if (status === "duplicate") return <AlertCircle className="h-4 w-4 text-destructive" />;
  return null;
}

interface TextFieldProps {
  id: string;
  label: string;
  required?: boolean;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: () => void;
  onKeyDown?: (e: KeyboardEvent<HTMLInputElement>) => void;
  placeholder?: string;
  type?: string;
  maxLength?: number;
  error?: string;
  touched?: boolean;
  status?: FieldStatus;
  inputRef?: React.Ref<HTMLInputElement>;
}

function TextField({
  id, label, required, value, onChange, onBlur, onKeyDown,
  placeholder, type = "text", maxLength, error, touched, status = "idle", inputRef,
}: TextFieldProps) {
  const showError = Boolean(touched && error);
  const showValid = Boolean(touched && !error && value && status !== "checking");

  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>
        {label}
        {required && <span className="ml-px text-destructive">*</span>}
      </Label>
      <div className="relative">
        <Input
          id={id}
          ref={inputRef}
          type={type}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          maxLength={maxLength}
          aria-required={required}
          aria-invalid={showError}
          aria-describedby={showError ? `${id}-error` : undefined}
          className={cn(
            "h-10 rounded-[10px] pr-9",
            showError && "border-destructive focus-visible:ring-destructive/30",
            showValid && "border-emerald-500/60"
          )}
        />
        {(status !== "idle" || showValid) && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <StatusIcon status={status !== "idle" ? status : "ok"} />
          </div>
        )}
      </div>
      <span
        id={`${id}-error`}
        className={cn("block min-h-[16px] text-xs leading-[16px] text-destructive", !showError && "invisible")}
      >
        {error || " "}
      </span>
    </div>
  );
}

export default function ColaboradorForm({
  open,
  handleClose,
  initialData,
  onSubmit,
  isSubmitting = false,
}: ColaboradorFormProps) {
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [initialSnapshot, setInitialSnapshot] = useState(EMPTY_FORM);

  const [directions, setDirections] = useState<Direction[]>([]);
  const [managements, setManagements] = useState<Management[]>([]);
  const [coordinations, setCoordinations] = useState<Coordination[]>([]);
  const [filteredManagements, setFilteredManagements] = useState<Management[]>([]);
  const [filteredCoordinations, setFilteredCoordinations] = useState<Coordination[]>([]);

  const [loadingDirections, setLoadingDirections] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [cpfStatus, setCpfStatus] = useState<FieldStatus>("idle");
  const [employeeIdStatus, setEmployeeIdStatus] = useState<FieldStatus>("idle");
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const submittingRef = useRef(false);

  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const cpfRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const employeeIdRef = useRef<HTMLInputElement>(null);
  const positionRef = useRef<HTMLInputElement>(null);
  const directionRef = useRef<HTMLButtonElement>(null);
  const managementRef = useRef<HTMLButtonElement>(null);
  const coordinationRef = useRef<HTMLButtonElement>(null);
  const submitRef = useRef<HTMLButtonElement>(null);

  const fieldOrder = useMemo(
    () => [nameRef, emailRef, cpfRef, phoneRef, employeeIdRef, positionRef, directionRef, managementRef, coordinationRef],
    []
  );

  useEffect(() => {
    async function loadOrganizationalData() {
      try {
        setLoadingDirections(true);
        const [directionsData, managementsData, coordinationsData] = await Promise.all([
          fetchDirections(),
          fetchManagements(),
          fetchCoordinations(),
        ]);
        setDirections(directionsData);
        setManagements(managementsData);
        setCoordinations(coordinationsData);
      } catch (error) {
        console.error("Erro ao carregar dados organizacionais:", error);
        setErrors((prev) => ({
          ...prev,
          direction: "Erro ao carregar dados organizacionais. Verifique sua conexão.",
        }));
      } finally {
        setLoadingDirections(false);
      }
    }

    if (open) {
      loadOrganizationalData();
    }
  }, [open]);

  useEffect(() => {
    if (formData.direction > 0) {
      const filtered = managements.filter((mgmt) => {
        const directionId = typeof mgmt.direction === "object" ? mgmt.direction.id : mgmt.direction;
        return directionId === formData.direction;
      });
      setFilteredManagements(filtered);

      if (formData.management > 0 && !filtered.find((m) => m.id === formData.management)) {
        setFormData((prev) => ({ ...prev, management: 0, coordination: 0 }));
      }
    } else {
      setFilteredManagements([]);
      setFormData((prev) => ({ ...prev, management: 0, coordination: 0 }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.direction, managements]);

  useEffect(() => {
    if (formData.management > 0) {
      const filtered = coordinations.filter((coord) => {
        const managementId = typeof coord.management === "object" ? coord.management.id : coord.management;
        return managementId === formData.management;
      });
      setFilteredCoordinations(filtered);

      if (formData.coordination > 0 && !filtered.find((c) => c.id === formData.coordination)) {
        setFormData((prev) => ({ ...prev, coordination: 0 }));
      }
    } else {
      setFilteredCoordinations([]);
      setFormData((prev) => ({ ...prev, coordination: 0 }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.management, coordinations]);

  useEffect(() => {
    if (open) {
      submittingRef.current = false;
      const next = initialData
        ? {
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
          }
        : EMPTY_FORM;
      setFormData(next);
      setInitialSnapshot(next);
      setErrors({});
      setTouched({});
      setCpfStatus("idle");
      setEmployeeIdStatus("idle");
    }
  }, [open, initialData]);

  // Foco automático no Nome Completo é feito via onOpenAutoFocus na DialogContent.

  const isDirty = useMemo(
    () => JSON.stringify(formData) !== JSON.stringify(initialSnapshot),
    [formData, initialSnapshot]
  );

  // Checagem de duplicidade de CPF em tempo real (debounced).
  useEffect(() => {
    if (!open || !formData.cpf || !isValidCPF(formData.cpf)) {
      setCpfStatus("idle");
      return;
    }
    setCpfStatus("checking");
    const handle = setTimeout(async () => {
      try {
        const params = new URLSearchParams({ search: formData.cpf, page_size: "5" });
        const res = await fetchColaboradoresAPI(params);
        const duplicate = res.results.some((r) => r.cpf === formData.cpf && r.id !== formData.id);
        setCpfStatus(duplicate ? "duplicate" : "ok");
        setErrors((prev) => {
          if (duplicate) return { ...prev, cpf: "Este CPF já está cadastrado no sistema" };
          if (!prev.cpf) return prev;
          const rest = { ...prev };
          delete rest.cpf;
          return rest;
        });
      } catch {
        setCpfStatus("idle");
      }
    }, 400);
    return () => clearTimeout(handle);
  }, [formData.cpf, formData.id, open]);

  // Checagem de duplicidade de Matrícula em tempo real (debounced).
  useEffect(() => {
    if (!open || !formData.employee_id.trim()) {
      setEmployeeIdStatus("idle");
      return;
    }
    setEmployeeIdStatus("checking");
    const handle = setTimeout(async () => {
      try {
        const params = new URLSearchParams({ search: formData.employee_id.trim(), page_size: "5" });
        const res = await fetchColaboradoresAPI(params);
        const duplicate = res.results.some(
          (r) => r.employee_id?.trim() === formData.employee_id.trim() && r.id !== formData.id
        );
        setEmployeeIdStatus(duplicate ? "duplicate" : "ok");
        setErrors((prev) => {
          if (duplicate) return { ...prev, employee_id: "Esta matrícula já está cadastrada no sistema" };
          if (!prev.employee_id) return prev;
          const rest = { ...prev };
          delete rest.employee_id;
          return rest;
        });
      } catch {
        setEmployeeIdStatus("idle");
      }
    }, 400);
    return () => clearTimeout(handle);
  }, [formData.employee_id, formData.id, open]);

  const getFieldError = (field: string, data: typeof formData): string => {
    switch (field) {
      case "full_name": {
        const v = normalizeName(data.full_name);
        if (!v) return "Nome completo é obrigatório";
        if (v.length < 3) return "Nome deve ter pelo menos 3 caracteres";
        return "";
      }
      case "email": {
        if (!data.email.trim()) return "Email é obrigatório";
        if (!isValidEmail(data.email)) return "Email deve ter um formato válido";
        return "";
      }
      case "cpf": {
        if (!data.cpf.trim()) return "CPF é obrigatório";
        if (!isValidCPF(data.cpf)) return "CPF inválido";
        return "";
      }
      case "phone": {
        if (data.phone && onlyDigits(data.phone).length < 10) return "Telefone incompleto";
        return "";
      }
      case "employee_id": {
        if (!data.employee_id.trim()) return "Matrícula é obrigatória";
        return "";
      }
      case "position": {
        if (!data.position.trim()) return "Cargo é obrigatório";
        return "";
      }
      default:
        return "";
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    let nextValue = value;
    if (id === "cpf") nextValue = formatCPF(value);
    else if (id === "phone") nextValue = formatPhone(value);
    else if (id === "email") nextValue = normalizeEmail(value);
    else if (id === "full_name") nextValue = collapseSpaces(value);

    setFormData((prev) => ({ ...prev, [id]: nextValue }));

    if (touched[id]) {
      const error = getFieldError(id, { ...formData, [id]: nextValue });
      setErrors((prev) => ({ ...prev, [id]: error }));
    }
  };

  const handleBlur = (field: string) => () => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const normalized = field === "full_name" ? normalizeName(formData.full_name) : formData[field as keyof typeof formData];
    const nextData = field === "full_name" ? { ...formData, full_name: normalized as string } : formData;
    if (field === "full_name" && normalized !== formData.full_name) {
      setFormData((prev) => ({ ...prev, full_name: normalized as string }));
    }
    const error = getFieldError(field, nextData);
    setErrors((prev) => ({ ...prev, [field]: error }));
  };

  const handleSelectChange = (field: "direction" | "management" | "coordination") => (value: string) => {
    if (field === "direction") {
      setFormData((prev) => ({ ...prev, direction: parseInt(value), management: 0, coordination: 0 }));
    } else if (field === "management") {
      setFormData((prev) => ({ ...prev, management: parseInt(value), coordination: 0 }));
    } else {
      setFormData((prev) => ({ ...prev, coordination: parseInt(value) }));
    }
  };

  const clearHierarchy = (field: "direction" | "management" | "coordination") => () => {
    if (field === "direction") setFormData((prev) => ({ ...prev, direction: 0, management: 0, coordination: 0 }));
    else if (field === "management") setFormData((prev) => ({ ...prev, management: 0, coordination: 0 }));
    else setFormData((prev) => ({ ...prev, coordination: 0 }));
  };

  const focusFieldAt = (index: number) => {
    for (let i = index; i < fieldOrder.length; i++) {
      const el = fieldOrder[i].current;
      if (el && !el.disabled) {
        el.focus();
        return true;
      }
    }
    return false;
  };

  const handleFieldKeyDown = (index: number) => (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const advanced = focusFieldAt(index + 1);
      if (!advanced) submitRef.current?.click();
    }
  };

  const requestClose = () => {
    if (isDirty) setShowCancelConfirm(true);
    else handleClose();
  };

  const confirmDiscard = () => {
    setShowCancelConfirm(false);
    handleClose();
  };

  const validateForm = () => {
    const fields = ["full_name", "email", "cpf", "phone", "employee_id", "position"];
    const newErrors: Record<string, string> = {};
    const newTouched: Record<string, boolean> = {};
    for (const field of fields) {
      newTouched[field] = true;
      const error = getFieldError(field, formData);
      if (error) newErrors[field] = error;
    }
    if (cpfStatus === "duplicate") newErrors.cpf = "Este CPF já está cadastrado no sistema";
    if (employeeIdStatus === "duplicate") newErrors.employee_id = "Esta matrícula já está cadastrada no sistema";

    setTouched((prev) => ({ ...prev, ...newTouched }));
    setErrors((prev) => ({ ...prev, ...newErrors }));
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (submittingRef.current || isSubmitting || loadingDirections) return;
    if (cpfStatus === "checking" || employeeIdStatus === "checking") return;
    if (!validateForm()) return;

    submittingRef.current = true;

    const submitData = {
      ...formData,
      full_name: normalizeName(formData.full_name),
      direction: formData.direction > 0 ? formData.direction : null,
      management: formData.management > 0 ? formData.management : null,
      coordination: formData.coordination > 0 ? formData.coordination : null,
    };

    onSubmit(submitData);
  };

  const directionOptions: ComboboxOption[] = useMemo(
    () => directions.map((d) => ({ value: d.id.toString(), label: d.name })),
    [directions]
  );
  const managementOptions: ComboboxOption[] = useMemo(
    () => filteredManagements.map((m) => ({ value: m.id.toString(), label: m.name })),
    [filteredManagements]
  );
  const coordinationOptions: ComboboxOption[] = useMemo(
    () => filteredCoordinations.map((c) => ({ value: c.id.toString(), label: c.name })),
    [filteredCoordinations]
  );

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (!next) {
            if (isSubmitting) return;
            requestClose();
          }
        }}
      >
        <DialogContent
          className="flex flex-col gap-0 p-0 sm:max-w-[800px] max-w-[92vw] max-h-[90vh] overflow-hidden"
          onOpenAutoFocus={(e) => {
            e.preventDefault();
            nameRef.current?.focus();
          }}
          onInteractOutside={(e) => {
            // O Popover do Combobox (Direção/Gerência/Coordenação) renderiza num
            // portal fora da árvore do Dialog — sem isso, clicar numa opção é lido
            // como "clique fora" e fecha o formulário inteiro.
            const target = e.target as HTMLElement | null;
            if (target?.closest("[data-radix-popper-content-wrapper]")) {
              e.preventDefault();
            }
          }}
        >
          <DialogHeader className="shrink-0 px-6 pt-4">
            <DialogTitle className="text-lg font-bold text-primary">
              {initialData ? "Editar Colaborador" : "Novo Colaborador"}
            </DialogTitle>
            <hr className="mt-2 mb-0 border-border" />
          </DialogHeader>

          <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-3">
              <div className="grid gap-2.5">

                <div className="space-y-1.5">
                  <h3 className="text-[15px] font-semibold text-foreground border-b border-primary/25 pb-1.5 flex items-center gap-2">
                    <span className="inline-block w-1 h-[18px] rounded-full bg-primary/70 shrink-0" aria-hidden="true" />
                    Dados Pessoais
                  </h3>

                  <div className="grid gap-3">
                    <TextField
                      id="full_name"
                      label="Nome Completo"
                      required
                      value={formData.full_name}
                      onChange={handleChange}
                      onBlur={handleBlur("full_name")}
                      onKeyDown={handleFieldKeyDown(0)}
                      placeholder="Nome completo do colaborador"
                      error={errors.full_name}
                      touched={touched.full_name}
                      inputRef={nameRef}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <TextField
                        id="email"
                        label="Email"
                        required
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        onBlur={handleBlur("email")}
                        onKeyDown={handleFieldKeyDown(1)}
                        placeholder="email@exemplo.com"
                        error={errors.email}
                        touched={touched.email}
                        inputRef={emailRef}
                      />
                      <TextField
                        id="cpf"
                        label="CPF"
                        required
                        value={formData.cpf}
                        onChange={handleChange}
                        onBlur={handleBlur("cpf")}
                        onKeyDown={handleFieldKeyDown(2)}
                        placeholder="000.000.000-00"
                        maxLength={14}
                        error={errors.cpf}
                        touched={touched.cpf}
                        status={cpfStatus}
                        inputRef={cpfRef}
                      />
                      <TextField
                        id="phone"
                        label="Telefone"
                        value={formData.phone}
                        onChange={handleChange}
                        onBlur={handleBlur("phone")}
                        onKeyDown={handleFieldKeyDown(3)}
                        placeholder="(00) 00000-0000"
                        maxLength={15}
                        error={errors.phone}
                        touched={touched.phone}
                        inputRef={phoneRef}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-[15px] font-semibold text-foreground border-b border-primary/25 pb-1.5 flex items-center gap-2">
                    <span className="inline-block w-1 h-[18px] rounded-full bg-primary/70 shrink-0" aria-hidden="true" />
                    Dados Funcionais
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <TextField
                      id="employee_id"
                      label="Matrícula"
                      required
                      value={formData.employee_id}
                      onChange={handleChange}
                      onBlur={handleBlur("employee_id")}
                      onKeyDown={handleFieldKeyDown(4)}
                      placeholder="Matrícula do colaborador"
                      error={errors.employee_id}
                      touched={touched.employee_id}
                      status={employeeIdStatus}
                      inputRef={employeeIdRef}
                    />
                    <TextField
                      id="position"
                      label="Cargo"
                      required
                      value={formData.position}
                      onChange={handleChange}
                      onBlur={handleBlur("position")}
                      onKeyDown={handleFieldKeyDown(5)}
                      placeholder="Cargo do colaborador"
                      error={errors.position}
                      touched={touched.position}
                      inputRef={positionRef}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-[15px] font-semibold text-foreground border-b border-primary/25 pb-1.5 flex items-center gap-2">
                    <span className="inline-block w-1 h-[18px] rounded-full bg-primary/70 shrink-0" aria-hidden="true" />
                    Hierarquia Organizacional
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="grid gap-1.5">
                      <Label htmlFor="direction">Direção</Label>
                      <Combobox
                        id="direction"
                        ref={directionRef}
                        options={directionOptions}
                        value={formData.direction > 0 ? formData.direction.toString() : ""}
                        onChange={handleSelectChange("direction")}
                        onClear={formData.direction > 0 ? clearHierarchy("direction") : undefined}
                        loading={loadingDirections}
                        placeholder="Direção..."
                        searchPlaceholder="Buscar..."
                        emptyText="Nenhuma direção."
                        triggerClassName="h-9 rounded-[10px]"
                      />
                    </div>

                    <div className="grid gap-1.5">
                      <Label htmlFor="management">Gerência</Label>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="block w-full">
                            <Combobox
                              id="management"
                              ref={managementRef}
                              options={managementOptions}
                              value={formData.management > 0 ? formData.management.toString() : ""}
                              onChange={handleSelectChange("management")}
                              onClear={formData.management > 0 ? clearHierarchy("management") : undefined}
                              disabled={formData.direction === 0}
                              placeholder={formData.direction === 0 ? "Selec. direção" : "Gerência..."}
                              searchPlaceholder="Buscar..."
                              emptyText="Nenhuma gerência."
                              triggerClassName="h-9 rounded-[10px]"
                            />
                          </span>
                        </TooltipTrigger>
                        {formData.direction === 0 && (
                          <TooltipContent side="top">
                            Selecione uma direção primeiro
                          </TooltipContent>
                        )}
                      </Tooltip>
                    </div>

                    <div className="grid gap-1.5">
                      <Label htmlFor="coordination">Coordenação</Label>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="block w-full">
                            <Combobox
                              id="coordination"
                              ref={coordinationRef}
                              options={coordinationOptions}
                              value={formData.coordination > 0 ? formData.coordination.toString() : ""}
                              onChange={handleSelectChange("coordination")}
                              onClear={formData.coordination > 0 ? clearHierarchy("coordination") : undefined}
                              disabled={formData.management === 0}
                              placeholder={formData.management === 0 ? "Selec. gerência" : "Coordenação..."}
                              searchPlaceholder="Buscar..."
                              emptyText="Nenhuma coordenação."
                              triggerClassName="h-9 rounded-[10px]"
                            />
                          </span>
                        </TooltipTrigger>
                        {formData.management === 0 && (
                          <TooltipContent side="top">
                            Selecione uma gerência primeiro
                          </TooltipContent>
                        )}
                      </Tooltip>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            <DialogFooter className="shrink-0 flex-col-reverse sm:flex-row sm:justify-end gap-2 border-t border-border/70 px-6 py-4 bg-muted/20">
              <Button
                type="button"
                variant="outline"
                className="h-9 w-full rounded-[10px] sm:w-auto"
                onClick={requestClose}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button
                ref={submitRef}
                type="submit"
                className="h-9 w-full rounded-[10px] sm:w-auto gap-2 font-semibold"
                disabled={isSubmitting || loadingDirections || cpfStatus === "duplicate" || employeeIdStatus === "duplicate"}
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                ) : (
                  <UserPlus className="h-4 w-4 shrink-0" />
                )}
                {isSubmitting
                  ? (initialData ? "Salvando alterações..." : "Criando colaborador...")
                  : loadingDirections
                    ? "Carregando..."
                    : initialData ? "Salvar Alterações" : "Criar Colaborador"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showCancelConfirm} onOpenChange={setShowCancelConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Descartar alterações?</AlertDialogTitle>
            <AlertDialogDescription>
              Você tem alterações não salvas neste formulário. Se sair agora, elas serão perdidas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continuar editando</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDiscard}>Descartar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
