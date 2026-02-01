import { useState, useCallback, useEffect } from 'react';

export interface SpecialFilter {
  name: string;
  defaultValue?: string;
  isDefaultFilter?: boolean;
}

export interface EntityTableConfig<T, CreateT = any> {
  entityName: string;
  initialPageSize?: number;
  specialFilters?: SpecialFilter[];
  optimisticHook?: any;
  serviceModule: {
    fetch: (page: number, pageSize: number, search: string, ordering: string, ...filterValues: any[]) => Promise<{ results: T[], count: number }>;
    create?: (data: CreateT) => Promise<any>;
    update?: (data: CreateT) => Promise<any>;
    delete?: (id: number) => Promise<void>;
  };
  onBeforeCreate?: (data: CreateT) => Promise<any>;
  onBeforeUpdate?: (data: CreateT) => Promise<any>;
}

export interface EntityTableState<T> {
  data: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  search: string;
  sorting: any[];
  filters: Record<string, string>;
  specialFilterValues: Record<string, string>;
  specialFilterDefaults: Record<string, boolean>;
  isLoading: boolean;
  selectedItem: T | null;
  editingItem: T | null;
  itemToDelete: T | null;
  formOpen: boolean;
  deleteDialogOpen: boolean;
  isSubmitting: boolean;
}

export interface EntityTableActions<T, CreateT = any> {
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  setSearch: (search: string) => void;
  setSorting: (sorting: any[]) => void;
  setFilters: (filters: Record<string, string>) => void;
  setSpecialFilter: (name: string, value: string, isDefault?: boolean) => void;
  loadData: () => Promise<void>;
  handleAdd: () => void;
  handleEdit: (item: T) => void;
  handleDelete: (item: T) => void;
  handleViewDetails?: (item: T) => void;
  handleSubmit: (data: CreateT) => Promise<void>;
  handleFilterChange: (columnId: string, value: string) => void;
  handleSortingChange: (newSorting: any[]) => void;
  confirmDelete: () => Promise<void>;
  closeForm: () => void;
  closeDeleteDialog: () => void;
}

export function useEntityTable<T extends { id: number }, CreateT = any>(
  config: EntityTableConfig<T, CreateT>
): EntityTableState<T> & EntityTableActions<T, CreateT> {

  const {
    entityName,
    initialPageSize = 10,
    specialFilters = [],
    optimisticHook,
    serviceModule,
    onBeforeCreate,
    onBeforeUpdate,
  } = config;

  // Optimistic hook (optional)
  const optimistic = optimisticHook ? optimisticHook() : null;

  // State management
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [search, setSearch] = useState("");
  const [sorting, setSorting] = useState<any[]>([]);
  const [filters, setFilters] = useState<Record<string, string>>({});

  // Special filters (like status, type, etc)
  const [specialFilterValues, setSpecialFilterValues] = useState<Record<string, string>>(
    specialFilters.reduce((acc, filter) => {
      acc[filter.name] = filter.defaultValue || '';
      return acc;
    }, {} as Record<string, string>)
  );

  const [specialFilterDefaults, setSpecialFilterDefaults] = useState<Record<string, boolean>>(
    specialFilters.reduce((acc, filter) => {
      acc[filter.name] = filter.isDefaultFilter !== undefined ? filter.isDefaultFilter : false;
      return acc;
    }, {} as Record<string, boolean>)
  );

  // Data state
  const [data, setData] = useState<T[]>(optimistic?.items || []);
  const [totalCount, setTotalCount] = useState(optimistic?.totalCount || 0);
  const [isLoading, setIsLoading] = useState(false);

  // UI state
  const [selectedItem, setSelectedItem] = useState<T | null>(null);
  const [editingItem, setEditingItem] = useState<T | null>(null);
  const [itemToDelete, setItemToDelete] = useState<T | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync with optimistic hook if available
  useEffect(() => {
    if (optimistic) {
      setData(optimistic.items || optimistic.colaboradores || optimistic.auxilios || optimistic.contracts || optimistic.budgetLines || []);
      setTotalCount(optimistic.totalCount);
    }
  }, [optimistic]);

  // Convert sorting to ordering string
  const convertSortingToOrdering = (sorting: { id: string; desc: boolean }[]) => {
    if (!sorting || sorting.length === 0) return "";
    const sortItem = sorting[0];
    const prefix = sortItem.desc ? "-" : "";
    return `${prefix}${sortItem.id}`;
  };

  // Load data function
  const loadData = useCallback(async () => {
    try {
      if (optimistic?.setLoading) {
        optimistic.setLoading(true);
      } else {
        setIsLoading(true);
      }

      console.log(`🔄 Loading ${entityName} with params:`, { page, pageSize, search, sorting, filters, specialFilterValues });

      const ordering = convertSortingToOrdering(sorting);
      const filterValues = Object.values(filters).filter(Boolean);
      const searchParam = filterValues.length > 0 ? filterValues[filterValues.length - 1] : search;

      // Build arguments array with special filters
      const specialFilterArgs = specialFilters.map(sf => specialFilterValues[sf.name] || '');

      const result = await serviceModule.fetch(page, pageSize, searchParam, ordering, ...specialFilterArgs);

      if (optimistic?.setItems) {
        optimistic.setItems(result.results);
        optimistic.setTotalCount(result.count);
      } else {
        setData(result.results);
        setTotalCount(result.count);
      }

      console.log(`✅ ${entityName} loaded successfully:`, result.results.length, "items");
    } catch (error) {
      console.error(`❌ Erro ao carregar ${entityName}:`, error);
    } finally {
      if (optimistic?.setLoading) {
        optimistic.setLoading(false);
      } else {
        setIsLoading(false);
      }
    }
  }, [page, pageSize, search, sorting, filters, specialFilterValues, entityName, optimistic, serviceModule, specialFilters]);

  // Load data on mount and when dependencies change
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handlers
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

  const handleViewDetails = useCallback((item: T) => {
    window.open(`/${entityName}/${item.id}`, '_blank');
  }, [entityName]);

  const closeForm = useCallback(() => {
    setFormOpen(false);
    setEditingItem(null);
  }, []);

  const closeDeleteDialog = useCallback(() => {
    setDeleteDialogOpen(false);
    setItemToDelete(null);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!itemToDelete?.id || !serviceModule.delete) return;

    try {
      await serviceModule.delete(itemToDelete.id);
      await loadData();

      // Adjust page if needed
      if (data.length === 1 && page > 1) {
        setPage(page - 1);
      }
    } catch (error) {
      console.error(`Erro ao excluir ${entityName}:`, error);
    } finally {
      closeDeleteDialog();
    }
  }, [itemToDelete, serviceModule, loadData, data.length, page, entityName, closeDeleteDialog]);

  const handleSubmit = useCallback(async (submitData: CreateT) => {
    let tempId: number | null = null;

    try {
      setIsSubmitting(true);
      const isEditing = (submitData as any).id;

      if (isEditing) {
        console.log(`📝 Updating existing ${entityName} with ID:`, (submitData as any).id);

        // Call onBeforeUpdate if provided
        if (onBeforeUpdate) {
          await onBeforeUpdate(submitData);
        }

        const result = await serviceModule.update!(submitData);
        const updated = result.data || result;

        console.log(`✅ ${entityName} update successful:`, updated);

        if (optimistic?.updateItem || optimistic?.updateColaborador || optimistic?.updateAuxilio || optimistic?.updateContract || optimistic?.updateBudgetLine) {
          const updateFn = optimistic.updateItem || optimistic.updateColaborador || optimistic.updateAuxilio || optimistic.updateContract || optimistic.updateBudgetLine;
          updateFn(updated);
        }
      } else {
        console.log(`➕ Creating new ${entityName}...`);

        // Call onBeforeCreate if provided
        let optimisticData = submitData;
        if (onBeforeCreate) {
          optimisticData = await onBeforeCreate(submitData);
        }

        // Add optimistic entry
        if (optimistic?.addOptimisticItem || optimistic?.addOptimisticColaborador || optimistic?.addOptimisticAuxilio || optimistic?.addOptimisticContract || optimistic?.addOptimisticBudgetLine) {
          const addFn = optimistic.addOptimisticItem || optimistic.addOptimisticColaborador || optimistic.addOptimisticAuxilio || optimistic.addOptimisticContract || optimistic.addOptimisticBudgetLine;
          tempId = addFn(optimisticData);
        }

        const result = await serviceModule.create!(submitData);
        const created = result.data || result;

        console.log(`✅ ${entityName} creation successful:`, created);

        // Replace optimistic entry
        if (tempId !== null && (optimistic?.replaceOptimisticItem || optimistic?.replaceOptimisticColaborador || optimistic?.replaceOptimisticAuxilio || optimistic?.replaceOptimisticContract || optimistic?.replaceOptimisticBudgetLine)) {
          const replaceFn = optimistic.replaceOptimisticItem || optimistic.replaceOptimisticColaborador || optimistic.replaceOptimisticAuxilio || optimistic.replaceOptimisticContract || optimistic.replaceOptimisticBudgetLine;
          replaceFn(tempId, created);
        }
      }

      closeForm();
      console.log(`✅ ${entityName} operation completed successfully`);

    } catch (error) {
      console.error(`❌ Erro ao salvar ${entityName}:`, error);

      // Remove optimistic entry on error
      if (!(submitData as any).id && tempId !== null && (optimistic?.removeOptimisticItem || optimistic?.removeOptimisticColaborador || optimistic?.removeOptimisticAuxilio || optimistic?.removeOptimisticContract || optimistic?.removeOptimisticBudgetLine)) {
        const removeFn = optimistic.removeOptimisticItem || optimistic.removeOptimisticColaborador || optimistic.removeOptimisticAuxilio || optimistic.removeOptimisticContract || optimistic.removeOptimisticBudgetLine;
        removeFn(tempId);
      }

      throw error;
    } finally {
      setIsSubmitting(false);
    }
  }, [entityName, optimistic, serviceModule, closeForm, onBeforeCreate, onBeforeUpdate]);

  const setSpecialFilter = useCallback((name: string, value: string, isDefault: boolean = false) => {
    setSpecialFilterValues(prev => ({ ...prev, [name]: value }));
    setSpecialFilterDefaults(prev => ({ ...prev, [name]: isDefault }));
    setPage(1);
  }, []);

  const handleFilterChange = useCallback((columnId: string, value: string) => {
    // Check if it's a special filter
    const specialFilter = specialFilters.find(sf => sf.name === columnId);

    if (specialFilter) {
      if (value === 'ALL' || value === 'all') {
        setSpecialFilter(columnId, 'ALL', false);
      } else if (value && value !== '') {
        setSpecialFilter(columnId, value, false);
      } else {
        // Reset to default
        setSpecialFilter(columnId, specialFilter.defaultValue || '', true);
      }
    } else {
      // Regular filter
      const newFilters = { ...filters };
      if (value && value !== 'all' && value !== 'ALL') {
        newFilters[columnId] = value;
      } else {
        delete newFilters[columnId];
      }
      setFilters(newFilters);
      setPage(1);
    }
  }, [specialFilters, filters, setSpecialFilter]);

  const handleSortingChange = useCallback((newSorting: any[]) => {
    setSorting(newSorting);
    setPage(1);
  }, []);

  // Build initialFilters for DataTable based on special filters
  // Only include filters that are NOT defaults or have been explicitly changed by user
  const buildInitialFilters = () => {
    return specialFilters
      .filter(sf => {
        const value = specialFilterValues[sf.name];
        const isDefault = specialFilterDefaults[sf.name];
        // Exclude default filters and "ALL" values from being displayed
        return !isDefault && value && value !== '' && value !== 'ALL' && value !== 'all';
      })
      .map(sf => ({ id: sf.name, value: specialFilterValues[sf.name] }));
  };

  return {
    // State
    data,
    totalCount,
    page,
    pageSize,
    search,
    sorting,
    filters,
    specialFilterValues,
    specialFilterDefaults,
    isLoading: optimistic?.isLoading || isLoading,
    selectedItem,
    editingItem,
    itemToDelete,
    formOpen,
    deleteDialogOpen,
    isSubmitting,

    // Actions
    setPage,
    setPageSize,
    setSearch,
    setSorting,
    setFilters,
    setSpecialFilter,
    loadData,
    handleAdd,
    handleEdit,
    handleDelete,
    handleViewDetails,
    handleSubmit,
    handleFilterChange,
    handleSortingChange,
    confirmDelete,
    closeForm,
    closeDeleteDialog,

    // Helper for DataTable
    initialFilters: buildInitialFilters(),
  } as any;
}
