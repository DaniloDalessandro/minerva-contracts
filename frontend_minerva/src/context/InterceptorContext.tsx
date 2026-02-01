"use client";

import { createContext, useContext } from "react";

interface InterceptorContextType {
  setupInterceptors: () => void;
}

const InterceptorContext = createContext<InterceptorContextType | null>(null);

export function InterceptorProvider({ children }: { children: React.ReactNode }) {
  const setupInterceptors = () => {
    // O apiClient já cuida de toda a lógica de autenticação, refresh e logout
    // Este provider está aqui apenas para compatibilidade de código legado
    console.log("InterceptorProvider: Auth handling delegated to apiClient");
  };

  return (
    <InterceptorContext.Provider value={{ setupInterceptors }}>
      {children}
    </InterceptorContext.Provider>
  );
}

export function useInterceptor() {
  const context = useContext(InterceptorContext);
  if (!context) {
    throw new Error('useInterceptor deve ser usado dentro de InterceptorProvider');
  }
  return context;
}