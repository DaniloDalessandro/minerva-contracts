"use client";

import React from "react";
import Link from "next/link";
import { ArrowUpRight, ChevronLeft, ChevronRight, FileText, Loader2, Plus, Search, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { CrudListProps } from "@/components/common/CrudTablePage";
import { getContractStatusLabel, getPaymentNatureLabel } from "@/constants/status";
import type { Contract } from "../types";

const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const formatMoney = (value: string) => Number.isFinite(Number(value)) ? money.format(Number(value)) : "—";
const formatDate = (value?: string) => {
  if (!value) return "Não informada";
  const date = new Date(`${value.slice(0, 10)}T12:00:00`);
  return Number.isNaN(date.getTime()) ? "Não informada" : date.toLocaleDateString("pt-BR");
};
const inspectorName = (contract: Contract & { main_inspector_detail?: { full_name: string } | null }) =>
  contract.main_inspector_detail?.full_name || contract.main_inspector?.full_name || "Não informado";

const substituteInspectorName = (contract: Contract & { substitute_inspector_detail?: { full_name: string } | null }) =>
  contract.substitute_inspector_detail?.full_name || contract.substitute_inspector?.full_name || "Não informado";

const paymentLabels: Record<string, string> = {
  UNICO: "Único", ANUAL: "Anual", SEMANAL: "Semanal", MENSAL: "Mensal",
  QUINZENAL: "Quinzenal", TRIMESTRAL: "Trimestral", SEMESTRAL: "Semestral", SOB_DEMANDA: "Sob demanda",
};

const ORDER_OPTIONS = [
  { value: "default", label: "Padrão" },
  { value: "protocol_number", label: "Protocolo: crescente" },
  { value: "-protocol_number", label: "Protocolo: decrescente" },
  { value: "-current_value", label: "Maior valor" },
  { value: "current_value", label: "Menor valor" },
  { value: "expiration_date", label: "Vencimento mais próximo" },
  { value: "-start_date", label: "Início mais recente" },
];

/* Hallmark · component: contract collection · theme: existing Minerva tokens
 * Pre-emit critique: P4 H5 E4 S5 R5 V4. Component scope: no page macrostructure.
 */
export function ContractCards({
  data, title, titleIcon, subtitle, isLoading, error, onRetry,
  pageIndex = 0, pageSize = 10, totalCount = 0,
  onPageChange, onPageSizeChange, onFilterChange, onSortingChange,
  onAdd, readOnly,
}: CrudListProps<Contract>) {
  const [search, setSearch] = React.useState("");
  const appliedSearch = React.useRef("");
  const [status, setStatus] = React.useState("ALL");
  const [ordering, setOrdering] = React.useState("default");
  const pageCount = Math.max(1, Math.ceil(totalCount / pageSize));

  React.useEffect(() => {
    const normalized = search.trim();
    if (appliedSearch.current === normalized) return;
    const timeout = setTimeout(() => {
      appliedSearch.current = normalized;
      onFilterChange?.("search", normalized);
    }, 300);
    return () => clearTimeout(timeout);
  }, [search, onFilterChange]);

  const clearFilters = () => {
    appliedSearch.current = "";
    setSearch("");
    setStatus("ALL");
    onFilterChange?.("search", "");
    onFilterChange?.("status", "ALL");
  };

  return (
    <section className="min-w-0 space-y-5" aria-label="Listagem de contratos">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <div className="shrink-0 text-primary" aria-hidden="true">{titleIcon}</div>
          <div className="min-w-0">
            <h2 className="break-words text-xl font-semibold tracking-tight">{title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
          </div>
        </div>
        {!readOnly && onAdd && (
          <Button onClick={onAdd} aria-label="Adicionar novo item" className="h-11 self-start">
            <Plus aria-hidden="true" /> Novo contrato
          </Button>
        )}
      </header>

      <div className="grid min-w-0 gap-3 rounded-xl border border-border bg-card p-4 md:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_11rem_15rem]">
        <div className="min-w-0 md:col-span-2 xl:col-span-1">
          <label htmlFor="contract-search" className="mb-1.5 block text-xs font-medium">Buscar contratos</label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-3.5 size-4 text-muted-foreground" aria-hidden="true" />
            <Input id="contract-search" value={search} onChange={(event) => setSearch(event.target.value)}
              placeholder="Protocolo, descrição ou fiscal" className="h-11 min-w-0 pl-9 pr-11" />
            {search && <Button variant="ghost" size="icon-lg" className="absolute right-0 top-0" aria-label="Limpar busca" onClick={() => setSearch("")}><X /></Button>}
          </div>
        </div>
        <div className="min-w-0">
          <label htmlFor="contract-status" className="mb-1.5 block text-xs font-medium">Status</label>
          <Select value={status} onValueChange={(value) => { setStatus(value); onFilterChange?.("status", value); }}>
            <SelectTrigger id="contract-status" className="h-11 w-full min-w-0 data-[size=default]:h-11"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="ALL">Todos os status</SelectItem><SelectItem value="ATIVO">Ativos</SelectItem><SelectItem value="ENCERRADO">Encerrados</SelectItem></SelectContent>
          </Select>
        </div>
        <div className="min-w-0">
          <label htmlFor="contract-order" className="mb-1.5 block text-xs font-medium">Ordenar por</label>
          <Select value={ordering} onValueChange={(value) => {
            setOrdering(value);
            onSortingChange?.(value === "default" ? [] : [{ id: value.replace(/^-/, ""), desc: value.startsWith("-") }]);
          }}>
            <SelectTrigger id="contract-order" className="h-11 w-full min-w-0 data-[size=default]:h-11"><SelectValue /></SelectTrigger>
            <SelectContent>{ORDER_OPTIONS.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
        <p role="status" aria-live="polite">{isLoading ? "Carregando contratos…" : `${totalCount} ${totalCount === 1 ? "contrato encontrado" : "contratos encontrados"}`}</p>
        {(search || status !== "ALL") && <Button variant="ghost" className="h-11" onClick={clearFilters}><X aria-hidden="true" />Limpar filtros</Button>}
      </div>

      {error ? (
        <div role="alert" className="rounded-xl border border-destructive/30 bg-card p-6 text-center">
          <p className="font-medium">Não foi possível carregar os contratos.</p>
          <p className="mt-1 text-sm text-muted-foreground">Verifique sua conexão e tente novamente.</p>
          <Button variant="outline" onClick={onRetry} disabled={isLoading} className="mt-4 h-11">{isLoading && <Loader2 className="animate-spin" />}Tentar novamente</Button>
        </div>
      ) : isLoading ? (
        <div className="grid min-w-0 grid-cols-[repeat(auto-fill,minmax(min(100%,20rem),1fr))] gap-3" aria-busy="true" aria-label="Carregando contratos">
          {Array.from({ length: 3 }, (_, index) => <div key={index} className="h-56 animate-pulse rounded-xl border border-border bg-muted/40 motion-reduce:animate-none" />)}
        </div>
      ) : data.length === 0 ? (
        <div className="flex flex-col items-center rounded-xl border border-dashed border-border px-4 py-14 text-center">
          <FileText className="mb-4 size-8 text-muted-foreground" aria-hidden="true" />
          <h3 className="font-semibold">Nenhum contrato encontrado</h3>
          <p className="mt-1 text-sm text-muted-foreground">{search || status !== "ALL" ? "Tente ajustar a busca ou os filtros aplicados." : "Os contratos cadastrados aparecerão aqui."}</p>
        </div>
      ) : (
        <div className="grid min-w-0 grid-cols-[repeat(auto-fill,minmax(min(100%,20rem),1fr))] gap-3">
          {data.map((contract) => (
            <article key={contract.id} aria-label={`Contrato ${contract.protocol_number}`} className="flex min-w-0 flex-col rounded-xl border border-border bg-card text-card-foreground transition-colors hover:border-primary/40">
              <div className="flex-1 space-y-1.5 p-2.5">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="min-w-0 truncate text-sm font-semibold">
                    <Link href={`/contratos/${contract.id}`} target="_blank" rel="noopener noreferrer" title={contract.protocol_number} className="rounded-sm hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring">{contract.protocol_number}</Link>
                  </h3>
                  <div className="flex shrink-0 items-center gap-2">
                    <Badge variant={contract.status === "ATIVO" ? "default" : "secondary"}>{getContractStatusLabel(contract.status)}</Badge>
                    <Button asChild variant="ghost" className="h-8 gap-1 px-1.5 text-xs text-primary">
                      <Link href={`/contratos/${contract.id}`} target="_blank" rel="noopener noreferrer">Ver detalhes<ArrowUpRight className="size-3.5" aria-hidden="true" /></Link>
                    </Button>
                  </div>
                </div>
                <p className="line-clamp-2 break-words text-xs leading-4 text-muted-foreground [overflow-wrap:anywhere]" title={contract.description}>{contract.description || "Sem descrição informada"}</p>
                <dl className="flex min-w-0 flex-wrap items-start justify-between gap-x-4 gap-y-2 rounded-md bg-muted/40 px-3 py-2">
                  <div className="min-w-0">
                    <dt className="text-[11px] leading-4 text-muted-foreground">Valor atual</dt>
                    <dd className="whitespace-nowrap text-sm font-semibold leading-5 tabular-nums">{formatMoney(contract.current_value)}</dd>
                  </div>
                  <div className="min-w-0">
                    <dt className="text-[11px] leading-4 text-muted-foreground">Valor original</dt>
                    <dd className="whitespace-nowrap text-sm font-semibold leading-5 tabular-nums">{formatMoney(contract.original_value)}</dd>
                  </div>
                  <div className="min-w-0">
                    <dt className="text-[11px] leading-4 text-muted-foreground">Pagamento</dt>
                    <dd className="text-xs font-medium leading-5">{paymentLabels[contract.payment_nature] || getPaymentNatureLabel(contract.payment_nature)}</dd>
                  </div>
                </dl>
                <dl className="grid min-w-0 grid-cols-2 gap-x-3 gap-y-1.5 text-xs sm:grid-cols-3">
                  <div className="min-w-0"><dt className="text-[11px] text-muted-foreground">Fiscal principal</dt><dd className="truncate leading-5" title={inspectorName(contract)}>{inspectorName(contract)}</dd></div>
                  <div className="min-w-0"><dt className="text-[11px] text-muted-foreground">Fiscal substituto</dt><dd className="truncate leading-5" title={substituteInspectorName(contract)}>{substituteInspectorName(contract)}</dd></div>
                  <div className="min-w-0"><dt className="text-[11px] text-muted-foreground">Assinatura</dt><dd className="break-words leading-5 tabular-nums">{formatDate(contract.signing_date)}</dd></div>
                  <div className="min-w-0"><dt className="text-[11px] text-muted-foreground">Início da vigência</dt><dd className="break-words leading-5 tabular-nums">{formatDate(contract.start_date)}</dd></div>
                  <div className="min-w-0"><dt className="text-[11px] text-muted-foreground">Fim da vigência</dt><dd className="break-words leading-5 tabular-nums">{formatDate(contract.end_date)}</dd></div>
                  <div className="min-w-0"><dt className="text-[11px] text-muted-foreground">Vencimento</dt><dd className="break-words leading-5 tabular-nums">{formatDate(contract.expiration_date)}</dd></div>
                </dl>
              </div>
            </article>
          ))}
        </div>
      )}

      <nav aria-label="Paginação de contratos" className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
        <p className="text-xs text-muted-foreground">Página <span className="font-medium text-foreground">{pageIndex + 1}</span> de {pageCount}</p>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={String(pageSize)} onValueChange={(value) => onPageSizeChange?.(Number(value))} disabled={isLoading}>
            <SelectTrigger aria-label="Contratos por página" className="h-11 w-32 data-[size=default]:h-11"><SelectValue /></SelectTrigger>
            <SelectContent>{[10, 20, 50].map((size) => <SelectItem key={size} value={String(size)}>{size} por página</SelectItem>)}</SelectContent>
          </Select>
          <Button variant="outline" size="icon-lg" aria-label="Primeira página" disabled={isLoading || pageIndex === 0} onClick={() => onPageChange?.(0)}>«</Button>
          <Button variant="outline" size="icon-lg" aria-label="Página anterior" disabled={isLoading || pageIndex === 0} onClick={() => onPageChange?.(pageIndex - 1)}><ChevronLeft /></Button>
          <Button variant="outline" size="icon-lg" aria-label="Próxima página" disabled={isLoading || pageIndex >= pageCount - 1} onClick={() => onPageChange?.(pageIndex + 1)}><ChevronRight /></Button>
          <Button variant="outline" size="icon-lg" aria-label="Última página" disabled={isLoading || pageIndex >= pageCount - 1} onClick={() => onPageChange?.(pageCount - 1)}>»</Button>
        </div>
      </nav>
    </section>
  );
}
