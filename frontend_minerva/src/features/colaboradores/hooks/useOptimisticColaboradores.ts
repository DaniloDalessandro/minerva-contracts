"use client";

import { useState, useCallback } from 'react';
import { Colaborador } from '@/lib/api/colaboradores';

export interface OptimisticColaboradoresState {
  colaboradores: Colaborador[];
  totalCount: number;
  isLoading: boolean;
}

export function useOptimisticColaboradores() {
  const [state, setState] = useState<OptimisticColaboradoresState>({
    colaboradores: [],
    totalCount: 0,
    isLoading: false
  });

  const setColaboradores = useCallback((colaboradores: Colaborador[]) => {
    setState(prev => ({ ...prev, colaboradores }));
  }, []);

  const setTotalCount = useCallback((totalCount: number) => {
    setState(prev => ({ ...prev, totalCount }));
  }, []);

  const setLoading = useCallback((isLoading: boolean) => {
    setState(prev => ({ ...prev, isLoading }));
  }, []);

  const addOptimisticColaborador = useCallback((colaborador: Partial<Colaborador> & { 
    direction?: any; 
    management?: any; 
    coordination?: any; 
  }) => {
    const optimisticColaborador: Colaborador = {
      id: Date.now(), // Temporary ID
      full_name: colaborador.full_name || '',
      email: colaborador.email || '',
      cpf: colaborador.cpf || '',
      phone: colaborador.phone,
      position: colaborador.position,
      direction: colaborador.direction || null,
      management: colaborador.management || null,
      coordination: colaborador.coordination || null,
      status: colaborador.status || 'ATIVO',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: null,
      updated_by: null,
      isOptimistic: true
    };

    setState(prev => ({
      ...prev,
      colaboradores: [optimisticColaborador, ...prev.colaboradores],
      totalCount: prev.totalCount + 1
    }));

    return optimisticColaborador.id;
  }, []);

  const replaceOptimisticColaborador = useCallback((tempId: number, realColaborador: Colaborador) => {
    setState(prev => ({
      ...prev,
      colaboradores: prev.colaboradores.map(colaborador => 
        colaborador.id === tempId && colaborador.isOptimistic ? 
        { ...realColaborador, isOptimistic: false } : 
        colaborador
      )
    }));
  }, []);

  const removeOptimisticColaborador = useCallback((tempId: number) => {
    setState(prev => ({
      ...prev,
      colaboradores: prev.colaboradores.filter(colaborador => 
        !(colaborador.id === tempId && colaborador.isOptimistic)
      ),
      totalCount: prev.totalCount - 1
    }));
  }, []);

  const updateColaborador = useCallback((updatedColaborador: Colaborador) => {
    setState(prev => ({
      ...prev,
      colaboradores: prev.colaboradores.map(colaborador => 
        colaborador.id === updatedColaborador.id ? updatedColaborador : colaborador
      )
    }));
  }, []);

  return {
    colaboradores: state.colaboradores,
    totalCount: state.totalCount,
    isLoading: state.isLoading,
    setColaboradores,
    setTotalCount,
    setLoading,
    addOptimisticColaborador,
    replaceOptimisticColaborador,
    removeOptimisticColaborador,
    updateColaborador
  };
}