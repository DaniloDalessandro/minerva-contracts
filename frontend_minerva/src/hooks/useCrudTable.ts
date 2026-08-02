import { useState, useCallback, useEffect } from "react";


export const STATUS_FILTER_ALL = "ALL";

export interface CrudService<T> {
  fetch: (
    page?: number,
    pageSize?: number,
    search?: string,
    ordering?: string,
    statusFilter?: string
  ) => Promise<{ results: T[]; count: number }>;
  create?: (data: any) => Promise<{ data?: T } | T>;
  update?: (data: any) => Promise<{ data?: T } | T>;
  delete?: (id: number) => Promise<void>;
  toggleStatus?: (id: number) => Promise<void | T>;
}

export interface UseCrudTableOptions<T> {
  service: CrudService<T>;
  initialPageSize?: number;

  initialStatusFilter?: string;
  onLoadSuccess?: (data: T[]) => void;
  onLoadError?: (error: any) => void;
}

export interface UseCrudTableReturn<T> {

  items: T[];
  totalCount: number;
  isLoading: boolean;


  page: number;
  pageSize: number;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;


  search: string;
  sorting: any[];
  filters: Record<string, string>;
  statusFilter: string;
  initialFilters: any[];
  setSearch: (search: string) => void;
  setSorting: (sorting: any[]) => void;
  setFilters: (filters: Record<string, string>) => void;
  setStatusFilter: (filter: string) => void;


  formOpen: boolean;
  editingItem: T | null;
  setFormOpen: (open: boolean) => void;
  setEditingItem: (item: T | null) => void;


  deleteDialogOpen: boolean;
  itemToDelete: T | null;
  setDeleteDialogOpen: (open: boolean) => void;
  setItemToDelete: (item: T | null) => void;


  loadItems: () => Promise<void>;
  handleAdd: () => void;
  handleEdit: (item: T) => void;
  handleDelete: (item: T) => void;
  handleCloseForm: () => void;
  handleFilterChange: (columnId: string, value: string) => void;
  handleSortingChange: (newSorting: any[]) => void;
  handlePageChange: (newPageIndex: number) => void;
  handlePageSizeChange: (newPageSize: number) => void;
  convertSortingToOrdering: (sorting: any[]) => string;
}

export function useCrudTable<T = any>(
  options: UseCrudTableOptions<T>
): UseCrudTableReturn<T> {
  const {
    service,
    initialPageSize = 10,
    initialStatusFilter = STATUS_FILTER_ALL,
    onLoadSuccess,
    onLoadError,
  } = options;

  const [items, setItems] = useState<T[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const [search, setSearch] = useState("");
  const [sorting, setSorting] = useState<any[]>([]);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [statusFilter, setStatusFilter] = useState(initialStatusFilter);


  const [isStatusFilterUserSelected, setIsStatusFilterUserSelected] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<T | null>(null);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<T | null>(null);

  const convertSortingToOrdering = useCallback((sorting: any[]) => {
    if (!sorting || sorting.length === 0) return "";
    const sortItem = sorting[0];
    const prefix = sortItem.desc ? "-" : "";
    return `${prefix}${sortItem.id}`;
  }, []);


  const isAllFilter = useCallback((value: string | undefined): boolean => {
    if (!value) return true;
    const normalizedValue = value.toUpperCase();
    return normalizedValue === "ALL" || normalizedValue === "TODOS";
  }, []);

  const loadItems = useCallback(async () => {
    try {
      setIsLoading(true);


      const effectiveStatusFilter = isAllFilter(statusFilter) ? "" : statusFilter;
      const ordering = convertSortingToOrdering(sorting);

      const filterValues = Object.values(filters).filter(Boolean);
      const searchParam =
        filterValues.length > 0
          ? filterValues[filterValues.length - 1]
          : search;

      const data = await service.fetch(
        page,
        pageSize,
        searchParam,
        ordering,
        effectiveStatusFilter
      );

      setItems(data.results);
      setTotalCount(data.count);

      if (onLoadSuccess) {
        onLoadSuccess(data.results);
      }
    } catch (error) {
      if (onLoadError) {
        onLoadError(error);
      }
    } finally {
      setIsLoading(false);
    }
  }, [
    page,
    pageSize,
    search,
    sorting,
    filters,
    statusFilter,
    service,
    convertSortingToOrdering,
    isAllFilter,
    onLoadSuccess,
    onLoadError,
  ]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const handleAdd = useCallback(() => {
    setEditingItem(null);
    setFormOpen(true);
  }, []);

  const handleEdit = useCallback((item: T) => {
    setEditingItem(item);
    setFormOpen(true);
  }, []);

  const handleDelete = useCallback((item: T) => {
    setItemToDelete(item);
    setDeleteDialogOpen(true);
  }, []);

  const handleCloseForm = useCallback(() => {
    setFormOpen(false);
    setEditingItem(null);
  }, []);

  const handleFilterChange = useCallback((columnId: string, value: string) => {
    if (columnId === "status" || columnId === "is_active") {
      const normalizedValue = value?.toUpperCase?.() || "";

      if (normalizedValue === "ALL" || normalizedValue === "TODOS" || value === "") {
        setStatusFilter(STATUS_FILTER_ALL);
        setIsStatusFilterUserSelected(value !== "");
      } else if (value) {
        setStatusFilter(value);
        setIsStatusFilterUserSelected(true);
      } else {
        setStatusFilter(initialStatusFilter);
        setIsStatusFilterUserSelected(false);
      }
      setPage(1);
    } else {
      setFilters((prev) => {
        const newFilters = { ...prev };
        const normalizedValue = value?.toUpperCase?.() || "";
        if (value && normalizedValue !== "ALL" && normalizedValue !== "TODOS") {
          newFilters[columnId] = value;
        } else {
          delete newFilters[columnId];
        }
        return newFilters;
      });
      setPage(1);
    }
  }, [initialStatusFilter]);

  const handleSortingChange = useCallback((newSorting: any[]) => {
    setSorting(newSorting);
    setPage(1);
  }, []);

  const handlePageChange = useCallback((newPageIndex: number) => {
    setPage(newPageIndex + 1);
  }, []);

  const handlePageSizeChange = useCallback((newPageSize: number) => {
    setPageSize(newPageSize);
    setPage(1);
  }, []);


  const getInitialFilters = () => {
    const initialFilters: any[] = [];

    if (isStatusFilterUserSelected && statusFilter && !isAllFilter(statusFilter)) {
      const statusColumnId = (statusFilter === "active" || statusFilter === "inactive") ? "is_active" : "status";
      initialFilters.push({ id: statusColumnId, value: statusFilter });
    }

    return initialFilters;
  };

  return {
    items,
    totalCount,
    isLoading,

    page,
    pageSize,
    setPage,
    setPageSize,

    search,
    sorting,
    filters,
    statusFilter,
    setSearch,
    setSorting,
    setFilters,
    setStatusFilter,

    formOpen,
    editingItem,
    setFormOpen,
    setEditingItem,

    deleteDialogOpen,
    itemToDelete,
    setDeleteDialogOpen,
    setItemToDelete,

    loadItems,
    handleAdd,
    handleEdit,
    handleDelete,
    handleCloseForm,
    handleFilterChange,
    handleSortingChange,
    handlePageChange,
    handlePageSizeChange,
    convertSortingToOrdering,

    initialFilters: getInitialFilters(),
  };
}
