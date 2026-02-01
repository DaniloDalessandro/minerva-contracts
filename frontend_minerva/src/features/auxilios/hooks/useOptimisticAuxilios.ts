"use client";

import { useState, useCallback } from 'react';
import { Auxilio } from '@/lib/api/auxilios';

export interface OptimisticAuxiliosState {
  auxilios: Auxilio[];
  totalCount: number;
  isLoading: boolean;
}

export function useOptimisticAuxilios() {
  const [state, setState] = useState<OptimisticAuxiliosState>({
    auxilios: [],
    totalCount: 0,
    isLoading: false
  });

  const setAuxilios = useCallback((auxilios: Auxilio[]) => {
    setState(prev => ({ ...prev, auxilios }));
  }, []);

  const setTotalCount = useCallback((totalCount: number) => {
    setState(prev => ({ ...prev, totalCount }));
  }, []);

  const setLoading = useCallback((isLoading: boolean) => {
    setState(prev => ({ ...prev, isLoading }));
  }, []);

  const addOptimisticAuxilio = useCallback((auxilio: Partial<Auxilio> & { 
    employee?: any; 
    budget_line?: any; 
  }) => {
    const optimisticAuxilio: Auxilio = {
      id: Date.now(), // Temporary ID
      employee: auxilio.employee || { id: auxilio.employee || 0, full_name: 'Carregando...' },
      budget_line: auxilio.budget_line || { id: auxilio.budget_line || 0, name: 'Carregando...' },
      type: auxilio.type || 'GRADUACAO',
      total_amount: auxilio.total_amount || '0.00',
      installment_count: auxilio.installment_count || 1,
      amount_per_installment: auxilio.amount_per_installment || '0.00',
      start_date: auxilio.start_date || new Date().toISOString().split('T')[0],
      end_date: auxilio.end_date || new Date().toISOString().split('T')[0],
      status: auxilio.status || 'AGUARDANDO',
      notes: auxilio.notes || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: null,
      updated_by: null,
      isOptimistic: true
    };

    setState(prev => ({
      ...prev,
      auxilios: [optimisticAuxilio, ...prev.auxilios],
      totalCount: prev.totalCount + 1
    }));

    return optimisticAuxilio.id;
  }, []);

  const replaceOptimisticAuxilio = useCallback((tempId: number, realAuxilio: Auxilio) => {
    setState(prev => ({
      ...prev,
      auxilios: prev.auxilios.map(auxilio => 
        auxilio.id === tempId && auxilio.isOptimistic ? 
        { ...realAuxilio, isOptimistic: false } : 
        auxilio
      )
    }));
  }, []);

  const removeOptimisticAuxilio = useCallback((tempId: number) => {
    setState(prev => ({
      ...prev,
      auxilios: prev.auxilios.filter(auxilio => 
        !(auxilio.id === tempId && auxilio.isOptimistic)
      ),
      totalCount: prev.totalCount - 1
    }));
  }, []);

  const updateAuxilio = useCallback((updatedAuxilio: Auxilio) => {
    setState(prev => ({
      ...prev,
      auxilios: prev.auxilios.map(auxilio => 
        auxilio.id === updatedAuxilio.id ? updatedAuxilio : auxilio
      )
    }));
  }, []);

  return {
    auxilios: state.auxilios,
    totalCount: state.totalCount,
    isLoading: state.isLoading,
    setAuxilios,
    setTotalCount,
    setLoading,
    addOptimisticAuxilio,
    replaceOptimisticAuxilio,
    removeOptimisticAuxilio,
    updateAuxilio
  };
}