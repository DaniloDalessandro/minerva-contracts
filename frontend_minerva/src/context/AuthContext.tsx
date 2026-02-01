"use client"

import { createContext, useContext, useEffect, useState, useCallback } from "react"
import { jwtDecode } from "jwt-decode"
import { API_URL } from "@/lib/config"
import { API_ENDPOINTS } from "@/constants/api-endpoints"

interface UserData {
  id: string
  email: string
  name: string
  cpf?: string
  phone?: string
  direction_id?: number
  direction_name?: string
  management_id?: number
  management_name?: string
  coordination_id?: number
  coordination_name?: string
  avatar?: string
}

interface AuthContextType {
  user: UserData | null
  accessToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  login: (data: { access: string; refresh: string; user: UserData }) => void
  logout: () => void
  refreshAccessToken: () => Promise<boolean>
  updateUserProfile: (data: Partial<UserData>) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserData | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Centraliza a leitura dos dados de autenticação
  const getAuthData = useCallback(() => {
    try {
      const token = localStorage.getItem("access")
      const userData: UserData = {
        id: localStorage.getItem("user_id") || '',
        email: localStorage.getItem("user_email") || '',
        name: localStorage.getItem("user_name") || '',
        cpf: localStorage.getItem("user_cpf") || '',
        phone: localStorage.getItem("user_phone") || '',
        direction_id: localStorage.getItem("user_direction_id") ? parseInt(localStorage.getItem("user_direction_id")!) : undefined,
        direction_name: localStorage.getItem("user_direction_name") || '',
        management_id: localStorage.getItem("user_management_id") ? parseInt(localStorage.getItem("user_management_id")!) : undefined,
        management_name: localStorage.getItem("user_management_name") || '',
        coordination_id: localStorage.getItem("user_coordination_id") ? parseInt(localStorage.getItem("user_coordination_id")!) : undefined,
        coordination_name: localStorage.getItem("user_coordination_name") || '',
        avatar: localStorage.getItem("user_avatar") || '',
      }

      return {
        token,
        userData: token && userData.id ? userData : null
      }
    } catch (error) {
      return { token: null, userData: null }
    }
  }, [])

  // Verifica se o token está expirado
  const isTokenExpired = useCallback((token: string): boolean => {
    try {
      const decoded = jwtDecode<{ exp: number }>(token)
      return decoded.exp < Date.now() / 1000
    } catch {
      return true
    }
  }, [])

  // Função de login otimizada
  const login = useCallback((data: { access: string; refresh: string; user: UserData }) => {
    try {
      localStorage.setItem("access", data.access)
      localStorage.setItem("refresh", data.refresh)
      localStorage.setItem("user_id", data.user.id)
      localStorage.setItem("user_email", data.user.email)
      localStorage.setItem("user_name", data.user.name)

      // Define também os cookies com tempo de expiração adequado
      document.cookie = `access=${data.access}; path=/; max-age=${8 * 60 * 60}; secure=${window.location.protocol === 'https:'}; samesite=strict`
      document.cookie = `refresh=${data.refresh}; path=/; max-age=${7 * 24 * 60 * 60}; secure=${window.location.protocol === 'https:'}; samesite=strict`

      setAccessToken(data.access)
      setUser(data.user)
      setError(null)
    } catch (error) {
      setError("Falha ao salvar os dados de autenticação")
    }
  }, [])

  // Função para atualizar o perfil do usuário
  const updateUserProfile = useCallback((data: Partial<UserData>) => {
    try {
      if (data.name) localStorage.setItem("user_name", data.name)
      if (data.email) localStorage.setItem("user_email", data.email)
      if (data.cpf) localStorage.setItem("user_cpf", data.cpf)
      if (data.phone) localStorage.setItem("user_phone", data.phone)
      if (data.direction_id) localStorage.setItem("user_direction_id", data.direction_id.toString())
      if (data.direction_name) localStorage.setItem("user_direction_name", data.direction_name)
      if (data.management_id) localStorage.setItem("user_management_id", data.management_id.toString())
      if (data.management_name) localStorage.setItem("user_management_name", data.management_name)
      if (data.coordination_id) localStorage.setItem("user_coordination_id", data.coordination_id.toString())
      if (data.coordination_name) localStorage.setItem("user_coordination_name", data.coordination_name)
      if (data.avatar) localStorage.setItem("user_avatar", data.avatar)

      setUser(prev => prev ? { ...prev, ...data } : null)
    } catch (error) {
      setError("Falha ao atualizar o perfil do usuário")
    }
  }, [])

  // Função de logout otimizada
  const logout = useCallback(() => {
    try {
      localStorage.removeItem("access")
      localStorage.removeItem("refresh")
      localStorage.removeItem("user_id")
      localStorage.removeItem("user_email")
      localStorage.removeItem("user_name")

      // Limpa os cookies
      document.cookie = 'access=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT'
      document.cookie = 'refresh=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT'

      setAccessToken(null)
      setUser(null)
      setError(null)
    } catch (error) {
      setError("Falha ao limpar os dados de autenticação")
    }
  }, [])

  // Verifica se o token está prestes a expirar
  const tokenExpiringSoon = useCallback((token: string, thresholdSeconds = 300): boolean => {
    try {
      const decoded = jwtDecode<{ exp: number }>(token)
      const now = Math.floor(Date.now() / 1000)
      return decoded.exp - now < thresholdSeconds
    } catch {
      return true
    }
  }, [])

  // Refresh token com tratamento de erros melhorado
  const refreshAccessToken = useCallback(async (): Promise<boolean> => {
    const refresh = localStorage.getItem("refresh")
    if (!refresh) {
      logout()
      return false
    }

    try {
      setIsLoading(true)
      const response = await fetch(`${API_URL}${API_ENDPOINTS.AUTH.REFRESH}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh }),
      })

      if (!response.ok) throw new Error("Refresh failed")

      const data = await response.json()
      localStorage.setItem("access", data.access)
      setAccessToken(data.access)
      setError(null)
      return true
    } catch (error) {
      setError("Sessão expirada. Por favor, faça login novamente.")
      logout()
      return false
    } finally {
      setIsLoading(false)
    }
  }, [logout])

  // Inicialização com verificação de token
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { token, userData } = getAuthData()

        if (token && userData) {
          if (isTokenExpired(token)) {
            const refreshed = await refreshAccessToken()
            if (!refreshed) return
          } else {
            setAccessToken(token)
            setUser(userData)
          }
        }
      } catch (error) {
        setError("Falha ao inicializar a autenticação")
      } finally {
        setIsLoading(false)
      }
    }

    initializeAuth()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Verificação periódica do token
  useEffect(() => {
    if (!accessToken) return

    const interval = setInterval(async () => {
      if (accessToken && tokenExpiringSoon(accessToken)) {
        await refreshAccessToken()
      }
    }, 30 * 1000) // Verifica a cada 30 segundos

    return () => clearInterval(interval)
  }, [accessToken, tokenExpiringSoon, refreshAccessToken])

  // Sincronização entre abas
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "access") {
        const { token, userData } = getAuthData()
        setAccessToken(token)
        setUser(userData)
      }
    }

    window.addEventListener("storage", handleStorageChange)
    return () => window.removeEventListener("storage", handleStorageChange)
  }, [getAuthData])

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        isAuthenticated: !!accessToken,
        isLoading,
        error,
        login,
        logout,
        refreshAccessToken,
        updateUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuthContext() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuthContext must be used within an AuthProvider")
  }
  return context
}