"use client"

import { createContext, useContext, useCallback, useRef } from "react"

interface RefreshFunction {
  (): Promise<void> | void
}

interface DataRefreshContextType {
  registerRefreshFunction: (entityType: string, refreshFn: RefreshFunction) => void
  unregisterRefreshFunction: (entityType: string) => void
  refreshData: (entityType: string) => Promise<void>
  refreshCurrentPage: (pathname: string) => Promise<void>
}

const DataRefreshContext = createContext<DataRefreshContextType | undefined>(undefined)

export function DataRefreshProvider({ children }: { children: React.ReactNode }) {
  // Usa useRef para armazenar as funções de atualização para evitar re-renderizações quando elas mudam
  const refreshFunctions = useRef<Map<string, RefreshFunction>>(new Map())

  const registerRefreshFunction = useCallback((entityType: string, refreshFn: RefreshFunction) => {
    refreshFunctions.current.set(entityType, refreshFn)
  }, [])

  const unregisterRefreshFunction = useCallback((entityType: string) => {
    refreshFunctions.current.delete(entityType)
  }, [])

  const refreshData = useCallback(async (entityType: string) => {
    const refreshFn = refreshFunctions.current.get(entityType)
    if (refreshFn) {
      try {
        await refreshFn()
      } catch (error) {
      }
    } else {
    }
  }, [])

  // Mapeia os pathnames para os tipos de entidade para atualização automática
  const getEntityTypeFromPathname = (pathname: string): string | null => {
    if (pathname.includes('/colaboradores')) return 'colaboradores'
    if (pathname.includes('/auxilios')) return 'auxilios'
    if (pathname.includes('/contratos')) return 'contratos'
    if (pathname.includes('/linhas-orcamentarias')) return 'linhas-orcamentarias'
    if (pathname.includes('/orcamento')) return 'orcamento'
    if (pathname.includes('/centro')) return 'centro'
    if (pathname.includes('/setor')) return 'setor'
    return null
  }

  const refreshCurrentPage = useCallback(async (pathname: string) => {
    const entityType = getEntityTypeFromPathname(pathname)
    if (entityType) {
      await refreshData(entityType)
    }
  }, [refreshData])

  return (
    <DataRefreshContext.Provider
      value={{
        registerRefreshFunction,
        unregisterRefreshFunction,
        refreshData,
        refreshCurrentPage,
      }}
    >
      {children}
    </DataRefreshContext.Provider>
  )
}

export function useDataRefresh() {
  const context = useContext(DataRefreshContext)
  if (context === undefined) {
    throw new Error("useDataRefresh must be used within a DataRefreshProvider")
  }
  return context
}

// Hook para que as páginas registrem facilmente suas funções de atualização
export function usePageRefresh(entityType: string, refreshFunction: RefreshFunction) {
  const { registerRefreshFunction, unregisterRefreshFunction } = useDataRefresh()

  // Registra na montagem, desregistra na desmontagem
  useCallback(() => {
    registerRefreshFunction(entityType, refreshFunction)

    return () => {
      unregisterRefreshFunction(entityType)
    }
  }, [entityType, refreshFunction, registerRefreshFunction, unregisterRefreshFunction])()
}

// Alias para compatibilidade com versões anteriores
export { usePageRefresh as useRegisterRefresh }