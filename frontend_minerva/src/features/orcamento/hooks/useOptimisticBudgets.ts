"use client";

import { useState, useCallback } from 'react';
import { Budget } from '@/lib/api/budgets';

export interface OptimisticState {
  budgets: Budget[];
  totalCount: number;
  isLoading: boolean;
}

export function useOptimisticBudgets() {
  const [state, setState] = useState<OptimisticState>({
    budgets: [],
    totalCount: 0,
    isLoading: false
  });

  const setBudgets = useCallback((budgets: Budget[]) => {
    setState(prev => ({ ...prev, budgets }));
  }, []);

  const setTotalCount = useCallback((totalCount: number) => {
    setState(prev => ({ ...prev, totalCount }));
  }, []);

  const setLoading = useCallback((isLoading: boolean) => {
    setState(prev => ({ ...prev, isLoading }));
  }, []);

  const addOptimisticBudget = useCallback((budget: Partial<Budget> & { management_center?: any }) => {
    const optimisticBudget: Budget = {
      id: Date.now(), // Temporary ID
      year: budget.year || new Date().getFullYear(),
      category: budget.category || 'OPEX',
      management_center_id: budget.management_center_id || 0,
      total_amount: budget.total_amount || '0',
      available_amount: budget.available_amount || budget.total_amount || '0',
      status: budget.status || 'ATIVO',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      management_center: budget.management_center || null,
      created_by: null,
      updated_by: null,
      isOptimistic: true
    };

    setState(prev => ({
      ...prev,
      budgets: [optimisticBudget, ...prev.budgets],
      totalCount: prev.totalCount + 1
    }));

    return optimisticBudget.id;
  }, []);

  const replaceOptimisticBudget = useCallback((tempId: number, realBudget: Budget) => {
    setState(prev => ({
      ...prev,
      budgets: prev.budgets.map(budget => 
        budget.id === tempId && budget.isOptimistic ? 
        { ...realBudget, isOptimistic: false } : 
        budget
      )
    }));
  }, []);

  const removeOptimisticBudget = useCallback((tempId: number) => {
    setState(prev => ({
      ...prev,
      budgets: prev.budgets.filter(budget => 
        !(budget.id === tempId && budget.isOptimistic)
      ),
      totalCount: prev.totalCount - 1
    }));
  }, []);

  const updateBudget = useCallback((updatedBudget: Budget) => {
    setState(prev => ({
      ...prev,
      budgets: prev.budgets.map(budget => 
        budget.id === updatedBudget.id ? updatedBudget : budget
      )
    }));
  }, []);

  return {
    budgets: state.budgets,
    totalCount: state.totalCount,
    isLoading: state.isLoading,
    setBudgets,
    setTotalCount,
    setLoading,
    addOptimisticBudget,
    replaceOptimisticBudget,
    removeOptimisticBudget,
    updateBudget
  };
}