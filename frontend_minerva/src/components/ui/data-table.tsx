"use client";

import React from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
  type VisibilityState,
  type PaginationState,
  type Updater,
} from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Plus,
  Settings2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Pencil,
  Trash2,
  Filter,
  Inbox,
  X,
  Eye,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";


declare module "@tanstack/react-table" {
  interface ColumnMeta<TData, TValue> {
    typeMarker?: (data: TData) => TValue;
    showFilterIcon?: boolean;
    filterType?: "text" | "select";
    filterOptions?: { value: string; label: string }[];
    hiddenByDefault?: boolean;
  }
}

export interface FilterConfig {
  id: string;
  label: string;
  type: "text" | "select";
  options?: { value: string; label: string }[];
}

export interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  title: string;
  titleIcon?: React.ReactNode;
  subtitle?: string;
  pageSize?: number;
  pageIndex?: number;
  totalCount?: number;
  filterConfigs?: FilterConfig[];
  initialFilters?: { id: string; value: string }[];
  onPageChange?: (pageIndex: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  onSortingChange?: (sorting: SortingState) => void;
  onFilterChange?: (columnId: string, value: string) => void;
  onAdd?: () => void;
  addLabel?: string;
  onEdit?: (row: TData) => void;
  onDelete?: (row: TData) => void;
  onViewDetails?: (row: TData) => void;
  readOnly?: boolean;
  hideRowActionsUntilSelected?: boolean;
  defaultVisibleColumnIds?: string[];
}


const AUDIT_COLUMN_IDS = new Set([
  "created_at",
  "criado_em",
  "createdAt",
  "created_by",
  "criado_por",
  "createdBy",
  "updated_at",
  "atualizado_em",
  "updatedAt",
  "updated_by",
  "atualizado_por",
  "updatedBy",
]);

function getColumnId<TData, TValue>(column: ColumnDef<TData, TValue>): string {
  const rawId =
    ("accessorKey" in column && typeof column.accessorKey === "string"
      ? column.accessorKey
      : column.id) ?? "";

  return rawId.replaceAll(".", "_");
}

function buildInitialVisibility<TData, TValue>(
  columns: ColumnDef<TData, TValue>[],
  defaultVisibleColumnIds?: string[]
): VisibilityState {
  const visibility: VisibilityState = {};
  const defaultVisibleIds = defaultVisibleColumnIds
    ? new Set(
        defaultVisibleColumnIds.flatMap((id) => [id, id.replaceAll(".", "_")])
      )
    : null;

  for (const col of columns) {
    const id = getColumnId(col);

    if (defaultVisibleIds) {
      visibility[id] = defaultVisibleIds.has(id);
    } else if (AUDIT_COLUMN_IDS.has(id) || col.meta?.hiddenByDefault) {
      visibility[id] = false;
    }
  }
  return visibility;
}

function isFilterHidden(filter: { id: string; value: unknown }): boolean {
  const val = filter.value;
  if (val === undefined || val === "" || val === null) return true;
  if (val === "all" || val === "todos") return true;
  if (filter.id === "is_active" && val === "active") return true;
  return false;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  title,
  titleIcon,
  subtitle,
  pageSize = 10,
  pageIndex = 0,
  totalCount = 0,
  filterConfigs,
  initialFilters = [],
  onPageChange,
  onPageSizeChange,
  onSortingChange,
  onFilterChange,
  onAdd,
  addLabel,
  onEdit,
  onDelete,
  onViewDetails,
  readOnly = false,
  hideRowActionsUntilSelected = false,
  defaultVisibleColumnIds,
}: DataTableProps<TData, TValue>) {
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>(() =>
      buildInitialVisibility(columns, defaultVisibleColumnIds)
    );


  const [selectedRowIndex, setSelectedRowIndex] = React.useState<number | null>(
    null
  );

  const [sorting, setSorting] = React.useState<SortingState>([]);


  const [columnFilters, setColumnFilters] =
    React.useState<ColumnFiltersState>(() =>
      initialFilters.map((f) => ({ id: f.id, value: f.value }))
    );

  const initialFiltersKey = JSON.stringify(initialFilters);
  React.useEffect(() => {
    const parsedInitialFilters = JSON.parse(initialFiltersKey) as {
      id: string;
      value: string;
    }[];

    if (parsedInitialFilters.length > 0) {
      const processed = parsedInitialFilters
        .map((f) => ({ id: f.id, value: f.value }))
        .filter((f) => f.value !== undefined && f.value !== null);
      setColumnFilters(processed);
    }
  }, [initialFiltersKey]);

  const [openFilterId, setOpenFilterId] = React.useState<string | null>(null);

  const pageCount =
    totalCount > 0 ? Math.ceil(totalCount / pageSize) : -1;

  const table = useReactTable<TData>({
    data,
    columns,
    pageCount,
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
    state: {
      pagination: { pageIndex, pageSize } satisfies PaginationState,
      sorting,
      columnFilters,
      columnVisibility,
    },
    onPaginationChange: (updater: Updater<PaginationState>) => {
      const prev: PaginationState = { pageIndex, pageSize };
      const next =
        typeof updater === "function" ? updater(prev) : updater;
      if (onPageChange && next.pageIndex !== prev.pageIndex)
        onPageChange(next.pageIndex);
      if (onPageSizeChange && next.pageSize !== prev.pageSize)
        onPageSizeChange(next.pageSize);
    },
    onSortingChange: (updater: Updater<SortingState>) => {
      const next =
        typeof updater === "function" ? updater(sorting) : updater;
      setSorting(next);
      onSortingChange?.(next);
    },
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
  });


  const resolveFilterConfig = (
    columnId: string
  ): { show: boolean; type: "text" | "select"; options?: { value: string; label: string }[]; label: string } | null => {
    if (filterConfigs) {
      const cfg = filterConfigs.find((fc) => fc.id === columnId);
      if (cfg) {
        return { show: true, type: cfg.type, options: cfg.options, label: cfg.label };
      }
      return null;
    }

    const col = table.getColumn(columnId);
    if (!col) return null;
    const meta = col.columnDef.meta;
    if (!meta?.showFilterIcon) return null;
    return {
      show: true,
      type: meta.filterType ?? "text",
      options: meta.filterOptions,
      label:
        typeof col.columnDef.header === "string"
          ? col.columnDef.header
          : columnId,
    };
  };

  const handleFilterChange = (columnId: string, value: string) => {
    const filterValue =
      value === "all" || value === "ALL" || value === "todos" ? undefined : value;
    table.getColumn(columnId)?.setFilterValue(filterValue);
    onFilterChange?.(columnId, value);
  };

  const clearFilter = (columnId: string) => {
    table.getColumn(columnId)?.setFilterValue(undefined);
    setOpenFilterId(null);
    onFilterChange?.(columnId, "");
  };

  const clearAllFilters = () => {
    const toReset: string[] = [];
    table.getAllColumns().forEach((col) => {
      const val = col.getFilterValue();
      if (val !== undefined && val !== "") {
        toReset.push(col.id);
      }
    });
    table.getAllColumns().forEach((col) => col.setFilterValue(undefined));
    setOpenFilterId(null);
    toReset.forEach((columnId) => onFilterChange?.(columnId, ""));
  };

  const activeFilters = table
    .getState()
    .columnFilters.filter(
      (f) => f.value !== undefined && f.value !== ""
    );

  const displayableFilters = activeFilters.filter((f) => !isFilterHidden(f));

  const rows = table.getRowModel().rows;
  const selectedRow =
    selectedRowIndex !== null && selectedRowIndex < rows.length
      ? rows[selectedRowIndex].original
      : null;

  const hasSelection = selectedRow !== null;

  return (
    <Card className="overflow-hidden pb-0.5">
      <CardHeader className="pb-1">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/60 bg-muted/20">
          <div className="flex items-center gap-3">
            {titleIcon && (
              <div className="text-primary">
                {titleIcon}
              </div>
            )}
            <div>
            <h2 className="text-lg font-semibold text-foreground tracking-tight">
              {title}
            </h2>
            {subtitle && (
              <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
            )}
            </div>
          </div>

          <div className="flex items-center gap-1">
            {!readOnly && onAdd && (
              addLabel ? (
                <Button
                  size="sm"
                  onClick={onAdd}
                  className="flex items-center gap-1.5 h-8 px-3"
                >
                  <Plus className="h-3.5 w-3.5" />
                  {addLabel}
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={onAdd}
                  aria-label="Adicionar novo item"
                  className="rounded-lg text-muted-foreground hover:text-foreground hover:bg-primary/8 hover:text-primary"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              )
            )}

            {onViewDetails && (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => { if (selectedRow) onViewDetails(selectedRow); }}
                disabled={!hasSelection}
                aria-label="Ver detalhes do item selecionado"
                className="rounded-lg text-muted-foreground hover:text-foreground disabled:opacity-30"
              >
                <Eye className="h-4 w-4" />
              </Button>
            )}

            {!readOnly && onEdit && (!hideRowActionsUntilSelected || hasSelection) && (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => { if (selectedRow) onEdit(selectedRow); }}
                disabled={!hasSelection}
                aria-label="Editar item selecionado"
                className="rounded-lg text-muted-foreground hover:text-foreground disabled:opacity-30"
              >
                <Pencil className="h-4 w-4" />
              </Button>
            )}

            {!readOnly && onDelete && (!hideRowActionsUntilSelected || hasSelection) && (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => { if (selectedRow) onDelete(selectedRow); }}
                disabled={!hasSelection}
                aria-label="Excluir item selecionado"
                className="rounded-lg text-muted-foreground hover:text-destructive disabled:opacity-30"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}

            <div className="w-px h-5 bg-border/60 mx-1" />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="rounded-lg text-muted-foreground hover:text-foreground"
                  aria-label="Configurar visibilidade de colunas"
                >
                  <Settings2 className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="rounded-xl">
                {table
                  .getAllColumns()
                  .filter((col) => col.getCanHide())
                  .map((col) => (
                    <DropdownMenuCheckboxItem
                      key={col.id}
                      className="capitalize rounded-lg"
                      checked={col.getIsVisible()}
                      onSelect={(e) => {
                        e.preventDefault();
                        col.toggleVisibility(!col.getIsVisible());
                      }}
                    >
                      {typeof col.columnDef.header === "string"
                        ? col.columnDef.header
                        : col.id}
                    </DropdownMenuCheckboxItem>
                  ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {displayableFilters.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mb-4 px-1">
            <span className="text-xs text-muted-foreground font-medium">Filtros:</span>
            {displayableFilters.map((filter) => {
              const col = table.getColumn(filter.id);
              const cfg = resolveFilterConfig(filter.id);
              let displayValue =
                filter.value != null ? String(filter.value) : "";

              if (cfg?.type === "select" && cfg.options) {
                const opt = cfg.options.find((o) => o.value === filter.value);
                if (opt && opt.value !== "all" && opt.value !== "todos") {
                  displayValue = opt.label;
                } else {
                  return null;
                }
              }

              const headerLabel =
                cfg?.label ??
                (col && typeof col.columnDef.header === "string"
                  ? col.columnDef.header
                  : filter.id);

              return (
                <Badge
                  key={filter.id}
                  variant="outline"
                  className="flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-full border-primary/30 bg-primary/5 text-primary hover:bg-primary/10 transition-colors"
                >
                  <span className="text-xs font-medium">{headerLabel}: {displayValue}</span>
                  <button
                    type="button"
                    aria-label={`Remover filtro ${headerLabel}`}
                    onClick={() => clearFilter(filter.id)}
                    className="rounded-full hover:bg-primary/15 p-0.5 transition-colors"
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                </Badge>
              );
            })}
            <button
              onClick={clearAllFilters}
              className="text-xs text-muted-foreground hover:text-destructive transition-colors"
            >
              Limpar todos
            </button>
          </div>
        )}

        <div className="border border-border/60 rounded-xl overflow-hidden shadow-xs">
          <Table>
            <TableHeader className="bg-muted/30">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    const columnId = header.column.id;
                    const cfg = resolveFilterConfig(columnId);
                    const showFilter = cfg !== null;
                    const filterValue = header.column.getFilterValue();
                    const isFilterOpen = openFilterId === columnId;

                    return (
                      <TableHead key={header.id} className="font-semibold">
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-1 flex-1 min-w-0">
                            {showFilter && (
                              <div className="relative flex-shrink-0">
                                <Popover
                                  open={isFilterOpen}
                                  onOpenChange={(open) =>
                                    setOpenFilterId(open ? columnId : null)
                                  }
                                >
                                  <PopoverTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-7 w-7 p-0 hover:bg-muted/50 dark:hover:bg-muted/40"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setOpenFilterId(
                                          isFilterOpen ? null : columnId
                                        );
                                      }}
                                      aria-label={`Filtrar coluna ${cfg?.label ?? columnId}`}
                                    >
                                      <Filter
                                        className={`h-3.5 w-3.5 ${
                                          filterValue
                                            ? "text-primary"
                                            : "text-muted-foreground"
                                        }`}
                                      />
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent
                                    className="w-60 p-3"
                                    align="start"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <div className="space-y-2">
                                      <div className="flex items-center justify-between">
                                        <h4 className="font-medium text-sm">
                                          Filtrar{" "}
                                          {cfg?.label ??
                                            (typeof header.column.columnDef
                                              .header === "string"
                                              ? header.column.columnDef.header
                                              : columnId)}
                                        </h4>
                                        {Boolean(filterValue) && (
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 px-2"
                                            onClick={() =>
                                              clearFilter(columnId)
                                            }
                                            aria-label="Limpar filtro"
                                          >
                                            <X className="h-3 w-3" />
                                          </Button>
                                        )}
                                      </div>
                                      {cfg?.type === "select" ? (
                                        <Select
                                          value={
                                            filterValue != null
                                              ? String(filterValue)
                                              : undefined
                                          }
                                          onValueChange={(val) =>
                                            handleFilterChange(columnId, val)
                                          }
                                        >
                                          <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Filtrar..." />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {cfg.options?.map((opt) => (
                                              <SelectItem
                                                key={opt.value}
                                                value={opt.value}
                                              >
                                                {opt.label}
                                              </SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                      ) : (
                                        <Input
                                          placeholder="Filtrar..."
                                          value={
                                            filterValue != null
                                              ? String(filterValue)
                                              : ""
                                          }
                                          onChange={(e) =>
                                            handleFilterChange(
                                              columnId,
                                              e.target.value
                                            )
                                          }
                                          autoFocus
                                        />
                                      )}
                                    </div>
                                  </PopoverContent>
                                </Popover>
                              </div>
                            )}

                            <div
                              className={`flex items-center flex-1 min-w-0 select-none ${
                                header.column.getCanSort()
                                  ? "cursor-pointer"
                                  : ""
                              }`}
                              onClick={() =>
                                header.column.getCanSort() &&
                                header.column.toggleSorting()
                              }
                            >
                              <span className="truncate">
                                {header.isPlaceholder
                                  ? null
                                  : flexRender(
                                      header.column.columnDef.header,
                                      header.getContext()
                                    )}
                              </span>
                              {header.column.getCanSort() && (
                                <span className="ml-1 text-muted-foreground flex-shrink-0">
                                  {header.column.getIsSorted() === "asc"
                                    ? "▲"
                                    : header.column.getIsSorted() === "desc"
                                    ? "▼"
                                    : "↕"}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>

            <TableBody>
              {rows.length > 0 ? (
                rows.map((row, rowIndex) => {
                  const isSelected = rowIndex === selectedRowIndex;
                  return (
                    <TableRow
                      key={row.id}
                      data-state={isSelected ? "selected" : undefined}
                      className={`cursor-pointer transition-colors duration-150 ${
                        isSelected
                          ? "bg-primary/6 dark:bg-primary/10 border-l-2 border-l-primary"
                          : "hover:bg-muted/40"
                      }`}
                      onClick={() =>
                        setSelectedRowIndex(isSelected ? null : rowIndex)
                      }
                    >
                      {row.getVisibleCells().map((cell) => {
                        const cellColumnId = cell.column.id;
                        const cellCfg = resolveFilterConfig(cellColumnId);
                        const showFilterSpacer = cellCfg !== null;
                        return (
                          <TableCell key={cell.id} className="py-2">
                            <div className="flex items-center w-full">
                              <div className="flex items-center gap-1 flex-1 min-w-0">
                                {showFilterSpacer && (
                                  <div className="w-7 flex-shrink-0" />
                                )}
                                <div className="flex-1 min-w-0">
                                  <span className="truncate block">
                                    {flexRender(
                                      cell.column.columnDef.cell,
                                      cell.getContext()
                                    )}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="text-center py-16 text-muted-foreground"
                  >
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-muted/60 flex items-center justify-center">
                        <Inbox className="h-5 w-5 text-muted-foreground/50" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground/70">Nenhum registro encontrado</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Tente ajustar os filtros aplicados</p>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between py-3 px-1">
          <p className="text-xs text-muted-foreground">
            Página <span className="font-semibold text-foreground">{pageIndex + 1}</span> de{" "}
            <span className="font-semibold text-foreground">{pageCount > 0 ? pageCount : 1}</span>
            {" "}&middot;{" "}
            <span className="font-semibold text-foreground">{totalCount}</span> registros
          </p>

          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => onPageChange?.(0)}
              disabled={pageIndex === 0}
              aria-label="Primeira página"
              className="rounded-lg text-muted-foreground hover:text-foreground disabled:opacity-30"
            >
              <ChevronsLeft className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => onPageChange?.(pageIndex - 1)}
              disabled={pageIndex === 0}
              aria-label="Página anterior"
              className="rounded-lg text-muted-foreground hover:text-foreground disabled:opacity-30"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => onPageChange?.(pageIndex + 1)}
              disabled={pageCount > 0 ? pageIndex >= pageCount - 1 : false}
              aria-label="Próxima página"
              className="rounded-lg text-muted-foreground hover:text-foreground disabled:opacity-30"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => onPageChange?.(pageCount > 0 ? pageCount - 1 : 0)}
              disabled={pageCount > 0 ? pageIndex >= pageCount - 1 : false}
              aria-label="Última página"
              className="rounded-lg text-muted-foreground hover:text-foreground disabled:opacity-30"
            >
              <ChevronsRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
