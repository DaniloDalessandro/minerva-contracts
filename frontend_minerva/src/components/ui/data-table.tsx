"use client";

import React from "react";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
  getFilteredRowModel,
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
  Settings,
  ChevronLeft,
  ChevronRight,
  Edit,
  Trash,
  Filter,
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

export function DataTable({
  columns,
  data,
  title,
  subtitle,
  pageSize = 10,
  pageIndex = 0,
  totalCount = 0,
  initialFilters = [],
  onPageChange,
  onPageSizeChange,
  onAdd,
  onEdit,
  onDelete,
  onViewDetails,
  onFilterChange,
  onSortingChange,
  readOnly = false,
}) {
  // Initialize column visibility with audit fields hidden by default
  const getInitialColumnVisibility = React.useCallback(() => {
    const hiddenByDefaultFields = [
      // Audit fields
      'created_at', 'criado_em', 'createdAt',
      'created_by', 'criado_por', 'createdBy', 
      'updated_at', 'atualizado_em', 'updatedAt',
      'updated_by', 'atualizado_por', 'updatedBy',
      // Budget Lines secondary fields
      'management_center.name',
      'requesting_center.name',
      'expense_type',
      'contract_type',
      'probable_procurement_type',
      'main_fiscal.full_name',
      'secondary_fiscal.full_name',
      'process_status',
      // Optional fields that should be hidden by default
      'phone', 'telefone',
      // Auxílios optional fields
      'id',
      'installment_count',
      'amount_per_installment', 
      'start_date',
      'end_date',
      'budget_line.name',
      'notes',
      // Contratos optional fields
      'substitute_inspector.full_name',
      'original_value',
      'current_value',
      'expiration_date',
      'signing_date',
      'description'
    ];
    
    const initialVisibility = {};
    columns.forEach(column => {
      const columnId = column.accessorKey || column.id;
      const headerText = (column.header || '').toString().toLowerCase();
      
      // Check if this field should be hidden by default
      const shouldHide = hiddenByDefaultFields.some(field => 
        columnId === field || 
        headerText.includes('criado') || 
        headerText.includes('atualizado') ||
        headerText.includes('created') ||
        headerText.includes('updated') ||
        headerText.includes('telefone')
      );
      
      if (shouldHide) {
        initialVisibility[columnId] = false;
      }
    });
    
    return initialVisibility;
  }, [columns]);

  const [columnVisibility, setColumnVisibility] = React.useState(() => getInitialColumnVisibility());
  const [selectedRow, setSelectedRow] = React.useState(null);
  const [sorting, setSorting] = React.useState([]);
  const [columnFilters, setColumnFilters] = React.useState(initialFilters);
  const [openFilterId, setOpenFilterId] = React.useState(null);

  // Update column visibility when columns change
  React.useEffect(() => {
    setColumnVisibility(prev => ({ ...getInitialColumnVisibility(), ...prev }));
  }, [getInitialColumnVisibility]);

  const table = useReactTable({
    data,
    columns,
    pageCount: Math.ceil(totalCount / pageSize),
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
    state: {
      pagination: { pageIndex, pageSize },
      sorting,
      columnFilters,
      columnVisibility,
    },
    onPaginationChange: (updater) => {
      const newState = typeof updater === "function" ? updater(table.getState()) : updater;
      if (onPageChange) onPageChange(newState.pageIndex);
      if (onPageSizeChange) onPageSizeChange(newState.pageSize);
    },
    onSortingChange: (updater) => {
      const newSorting = typeof updater === "function" ? updater(sorting) : updater;
      setSorting(newSorting);
      // Call parent callback to trigger API call with new sorting
      if (onSortingChange) {
        onSortingChange(newSorting);
      }
    },
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  // Sincronizar filtros externos com estado interno da tabela
  // Apenas sincroniza quando há filtros explícitos para mostrar
  const initialFiltersStr = JSON.stringify(initialFilters);
  React.useEffect(() => {
    console.log('🔍 DataTable initialFilters:', initialFilters);
    if (initialFilters && initialFilters.length > 0) {
      const processedFilters = initialFilters.map(filter => ({
        id: filter.id,
        value: filter.value === "all" || filter.value === "ALL" ? undefined : filter.value
      })).filter(f => f.value !== undefined);
      console.log('📝 Setting column filters:', processedFilters);
      setColumnFilters(processedFilters);
    }
    // Não faz nada quando initialFilters está vazio - mantém o estado atual
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialFiltersStr]); // Depende da string serializada para evitar loops infinitos

  // Debug: log data changes
  React.useEffect(() => {
    console.log('📊 DataTable data changed:', data?.length, 'items');
  }, [data]);

  // Filtragem, ordenação etc precisam ser refletidos na query backend
  // Para simplificação, agora a paginação já é controlada externamente

  const handleFilterChange = (columnId, value) => {
    console.log('🔄 DataTable handleFilterChange called!', columnId, '=', value);
    // Para filtros do tipo select com valor "all" ou "ALL", usar undefined para indicar "sem filtro"
    const filterValue = (value === "all" || value === "ALL") ? undefined : value;
    table.getColumn(columnId)?.setFilterValue(filterValue);
    console.log('📞 Calling onFilterChange callback:', !!onFilterChange);
    // Call parent callback to trigger API call with filter
    if (onFilterChange) {
      console.log('✅ Executing onFilterChange with:', columnId, value);
      onFilterChange(columnId, value);
    } else {
      console.error('❌ onFilterChange is not defined!');
    }
  };

  const clearFilter = (columnId) => {
    const column = table.getColumn(columnId);
    const filterMeta = column?.columnDef.meta;

    // Resetar o filtro
    table.getColumn(columnId)?.setFilterValue(undefined);
    setOpenFilterId(null);

    // Chamar callback para resetar ao padrão (não para "all")
    if (onFilterChange) {
      // Passar valor vazio para resetar ao padrão do sistema
      onFilterChange(columnId, "");
    }
  };

  const clearAllFilters = () => {
    // Primeiro, obter os valores atuais e preparar as chamadas de callback
    const filtersToReset = [];
    table.getAllColumns().forEach((col) => {
      const currentValue = col.getFilterValue();
      if (currentValue !== undefined && currentValue !== "") {
        filtersToReset.push({ columnId: col.id });
      }
    });

    // Limpar os filtros localmente
    table.getAllColumns().forEach((col) => {
      col.setFilterValue(undefined);
    });
    setOpenFilterId(null);

    // Chamar os callbacks para resetar ao padrão (passar vazio reseta ao padrão do sistema)
    if (onFilterChange && filtersToReset.length > 0) {
      filtersToReset.forEach(({ columnId }) => {
        onFilterChange(columnId, "");
      });
    }
  };

  const activeFilters = table.getState().columnFilters.filter(
    (f) => f.value !== undefined && f.value !== ""
  );

  const displayableFilters = activeFilters.filter(filter => {
    // Don't show badge for empty values, "all", "ALL", or default "active" status
    if (
      !filter.value ||
      filter.value === "all" ||
      filter.value === "ALL" ||
      (filter.id === "is_active" && filter.value === "active") ||
      (filter.id === "status" && filter.value === "ATIVO")
    ) {
      return false;
    }
    return true;
  });

  return (
    <Card className="shadow-lg pb-0.5">
      <CardHeader className="pb-1">
        <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/50 dark:bg-muted/80">
          <div>
            <h2 className="text-xl font-bold text-primary dark:text-primary">{title}</h2>
            {subtitle && (
              <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
            )}
          </div>
          <div className="flex items-center gap-4">
            {onAdd && (
              <Plus
                className="h-6 w-6 cursor-pointer"
                onClick={onAdd}
                aria-label="Adicionar novo item"
                role="button"
              />
            )}
            {onViewDetails && selectedRow && (
              <Eye
                className="h-6 w-6 cursor-pointer"
                onClick={() => onViewDetails(selectedRow)}
                aria-label="Ver detalhes do item selecionado"
                role="button"
              />
            )}
            {!readOnly && selectedRow && (
              <>
                <Edit
                  className="h-6 w-6 cursor-pointer"
                  onClick={() => onEdit(selectedRow)}
                  aria-label="Editar item"
                  role="button"
                />
                <Trash
                  className="h-6 w-6 cursor-pointer"
                  onClick={() => onDelete(selectedRow)}
                  aria-label="Excluir item"
                  role="button"
                />
              </>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Settings className="h-6 w-6 cursor-pointer" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {table
                  .getAllColumns()
                  .filter((column) => column.getCanHide())
                  .map((column) => (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onSelect={(e) => {
                        e.preventDefault();
                        column.toggleVisibility(!column.getIsVisible());
                      }}
                    >
                      {column.columnDef.header || column.id}
                    </DropdownMenuCheckboxItem>
                  ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* TAGS DE FILTROS */}
        {displayableFilters.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {displayableFilters.map((filter) => {
              const column = table.getColumn(filter.id);
              const filterMeta = column?.columnDef.meta;
              let displayValue = filter.value;

              // Se for um filtro do tipo select, buscar o label correspondente
              if (filterMeta?.filterType === "select" && filterMeta?.filterOptions) {
                const option = filterMeta.filterOptions.find(opt => opt.value === filter.value);
                if (option && option.value !== "all") {
                  displayValue = option.label;
                } else {
                  return null; // Não mostrar badge quando "Todos" está selecionado ou valor inválido
                }
              }

              return (
                <Badge
                  key={filter.id}
                  variant="outline"
                  className="flex items-center gap-1"
                >
                  <span className="font-medium">{column?.columnDef.header}:</span>{" "}
                  <span>{displayValue}</span>
                  <X
                    className="h-3 w-3 cursor-pointer ml-1"
                    onClick={() => clearFilter(filter.id)}
                  />
                </Badge>
              );
            })}
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="ml-2 text-sm text-red-500"
            >
              Limpar filtros
            </Button>
          </div>
        )}

        <div className="border shadow-sm">
          <Table>
            <TableHeader className="bg-gray-50">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    const showFilterIcon =
                      header.column.columnDef.meta?.showFilterIcon;
                    const columnId = header.column.id;
                    const filterValue = header.column.getFilterValue();
                    const isFilterOpen = openFilterId === columnId;

                    return (
                      <TableHead key={header.id} className="font-semibold">
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-1 flex-1 min-w-0">
                            {showFilterIcon && (
                              <div className="relative flex-shrink-0">
                                <Popover
                                  open={isFilterOpen}
                                  onOpenChange={(open) => {
                                    if (open) {
                                      setOpenFilterId(columnId);
                                    } else {
                                      setOpenFilterId(null);
                                    }
                                  }}
                                >
                                  <PopoverTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-7 w-7 p-0 hover:bg-muted/50 dark:hover:bg-muted/40"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setOpenFilterId(isFilterOpen ? null : columnId);
                                      }}
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
                                        <h4 className="font-medium">
                                          Filtrar {header.column.columnDef.header}
                                        </h4>
                                        {filterValue && (
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 px-2"
                                            onClick={() => clearFilter(columnId)}
                                          >
                                            <X className="h-3 w-3" />
                                          </Button>
                                        )}
                                      </div>
                                      {header.column.columnDef.meta?.filterType === "select" ? (
                                        <Select
                                          value={filterValue || undefined}
                                          onValueChange={(value) =>
                                            handleFilterChange(columnId, value)
                                          }
                                        >
                                          <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Filtrar..." />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {header.column.columnDef.meta?.filterOptions?.map((option) => (
                                              <SelectItem key={option.value} value={option.value}>
                                                {option.label}
                                              </SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                      ) : (
                                        <Input
                                          placeholder={`Filtrar...`}
                                          value={filterValue ?? ""}
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
                              className="cursor-pointer select-none flex items-center flex-1 min-w-0"
                              onClick={() =>
                                header.column.getCanSort() &&
                                header.column.toggleSorting()
                              }
                            >
                              <span className="truncate">
                                {flexRender(
                                  header.column.columnDef.header,
                                  header.getContext()
                                )}
                              </span>
                              {header.column.getCanSort() && (
                                <span className="ml-1 text-gray-400 flex-shrink-0">
                                  {{
                                    asc: "▲",
                                    desc: "▼",
                                  }[header.column.getIsSorted()] ?? "↕"}
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
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className={`hover:bg-gray-50 transition-colors ${
                      selectedRow?.id === row.original.id ? "bg-gray-200" : ""
                    }`}
                    onClick={() =>
                      setSelectedRow(
                        selectedRow?.id === row.original.id ? null : row.original
                      )
                    }
                  >
                    {row.getVisibleCells().map((cell) => {
                      const showFilterIcon = cell.column.columnDef.meta?.showFilterIcon;
                      return (
                        <TableCell key={cell.id} className="py-2">
                          <div className="flex items-center w-full">
                            <div className="flex items-center gap-1 flex-1 min-w-0">
                              {showFilterIcon && (
                                <div className="w-7 flex-shrink-0"></div>
                              )}
                              <div className="flex-1 min-w-0">
                                <span className="truncate block">
                                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                </span>
                              </div>
                            </div>
                          </div>
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="text-center py-10">
                    Nenhum registro encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* PAGINAÇÃO */}
        <div className="flex items-center justify-between space-x-2 py-2">
          <div className="flex-1 text-sm text-muted-foreground">
            Página {pageIndex + 1} de {Math.ceil(totalCount / pageSize)} —{" "}
            {totalCount} registros
          </div>

          <div className="flex items-center gap-2">
            <Select
              value={pageSize.toString()}
              onValueChange={(value) => {
                console.log('📊 DataTable Select changed:', value, 'current:', pageSize);
                onPageSizeChange && onPageSizeChange(Number(value));
              }}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10 por página</SelectItem>
                <SelectItem value="15">15 por página</SelectItem>
                <SelectItem value="20">20 por página</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange && onPageChange(0)}
              disabled={pageIndex === 0}
            >
              {"<<"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange && onPageChange(pageIndex - 1)}
              disabled={pageIndex === 0}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange && onPageChange(pageIndex + 1)}
              disabled={pageIndex >= Math.ceil(totalCount / pageSize) - 1}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange && onPageChange(Math.ceil(totalCount / pageSize) - 1)}
              disabled={pageIndex >= Math.ceil(totalCount / pageSize) - 1}
            >
              {">>"}
            </Button>


          </div>
        </div>
      </CardContent>
    </Card>
  );
}
