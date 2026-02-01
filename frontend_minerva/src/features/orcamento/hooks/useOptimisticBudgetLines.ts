"use client";

import { useState, useCallback } from 'react';
import { BudgetLine } from '@/lib/api/budgetlines';

export interface OptimisticBudgetLinesState {
  budgetLines: BudgetLine[];
  totalCount: number;
  isLoading: boolean;
}

export function useOptimisticBudgetLines() {
  const [state, setState] = useState<OptimisticBudgetLinesState>({
    budgetLines: [],
    totalCount: 0,
    isLoading: false
  });

  const setBudgetLines = useCallback((budgetLines: BudgetLine[]) => {
    setState(prev => ({ ...prev, budgetLines }));
  }, []);

  const setTotalCount = useCallback((totalCount: number) => {
    setState(prev => ({ ...prev, totalCount }));
  }, []);

  const setLoading = useCallback((isLoading: boolean) => {
    setState(prev => ({ ...prev, isLoading }));
  }, []);

  const addOptimisticBudgetLine = useCallback((budgetLine: Partial<BudgetLine> & { 
    budget?: any; 
    management_center?: any;
    requesting_center?: any;
    main_fiscal?: any;
    secondary_fiscal?: any;
  }) => {
    const optimisticBudgetLine: BudgetLine = {
      id: Date.now(), // Temporary ID
      budget: budgetLine.budget || { id: budgetLine.budget || 0, name: 'Carregando...' },
      category: budgetLine.category || 'OPEX',
      expense_type: budgetLine.expense_type || 'Base Principal',
      management_center: budgetLine.management_center || { id: budgetLine.management_center || 0, name: 'Carregando...' },
      requesting_center: budgetLine.requesting_center || { id: budgetLine.requesting_center || 0, name: 'Carregando...' },
      summary_description: budgetLine.summary_description || '',
      object: budgetLine.object || '',
      budget_classification: budgetLine.budget_classification || 'NOVO',
      main_fiscal: budgetLine.main_fiscal || null,
      secondary_fiscal: budgetLine.secondary_fiscal || null,
      contract_type: budgetLine.contract_type || 'SERVIÇO',
      probable_procurement_type: budgetLine.probable_procurement_type || 'LICITAÇÃO',
      budgeted_amount: budgetLine.budgeted_amount || '0.01',
      process_status: budgetLine.process_status || null,
      contract_status: budgetLine.contract_status || null,
      contract_notes: budgetLine.contract_notes || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: null,
      updated_by: null,
      isOptimistic: true
    };

    setState(prev => ({
      ...prev,
      budgetLines: [optimisticBudgetLine, ...prev.budgetLines],
      totalCount: prev.totalCount + 1
    }));

    return optimisticBudgetLine.id;
  }, []);

  const replaceOptimisticBudgetLine = useCallback((tempId: number, realBudgetLine: BudgetLine) => {
    setState(prev => ({
      ...prev,
      budgetLines: prev.budgetLines.map(budgetLine => 
        budgetLine.id === tempId && budgetLine.isOptimistic ? 
        { ...realBudgetLine, isOptimistic: false } : 
        budgetLine
      )
    }));
  }, []);

  const removeOptimisticBudgetLine = useCallback((tempId: number) => {
    setState(prev => ({
      ...prev,
      budgetLines: prev.budgetLines.filter(budgetLine => 
        !(budgetLine.id === tempId && budgetLine.isOptimistic)
      ),
      totalCount: prev.totalCount - 1
    }));
  }, []);

  const updateBudgetLine = useCallback((updatedBudgetLine: BudgetLine) => {
    setState(prev => ({
      ...prev,
      budgetLines: prev.budgetLines.map(budgetLine => 
        budgetLine.id === updatedBudgetLine.id ? updatedBudgetLine : budgetLine
      )
    }));
  }, []);

  return {
    budgetLines: state.budgetLines,
    totalCount: state.totalCount,
    isLoading: state.isLoading,
    setBudgetLines,
    setTotalCount,
    setLoading,
    addOptimisticBudgetLine,
    replaceOptimisticBudgetLine,
    removeOptimisticBudgetLine,
    updateBudgetLine
  };
}