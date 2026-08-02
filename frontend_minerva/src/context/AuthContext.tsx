"use client"

import { createContext, useCallback, useContext, useEffect, useState } from "react"

import {
  clearSession,
  getAuthSnapshot,
  isTokenValid,
  refreshAccessToken as refreshSessionAccessToken,
  revokeSession,
  saveSession,
  saveUserProfile,
  tokenExpiringSoon,
  type UserData,
} from "@/lib/auth/session"

interface AuthContextType {
  user: UserData | null
  accessToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  login: (data: { access?: string; refresh?: string; user: UserData }) => void
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

  const login = useCallback((data: { access?: string; refresh?: string; user: UserData }) => {
    try {
      saveSession(data)
      setAccessToken(data.access ?? "cookie")
      setUser(data.user)
      setError(null)
    } catch {
      setError("Falha ao salvar os dados de autenticacao")
    }
  }, [])

  const updateUserProfile = useCallback((data: Partial<UserData>) => {
    try {
      saveUserProfile(data)
      setUser((previousUser) => previousUser ? { ...previousUser, ...data } : null)
    } catch {
      setError("Falha ao atualizar o perfil do usuario")
    }
  }, [])

  const logout = useCallback(() => {
    try {
      void revokeSession()
      setAccessToken(null)
      setUser(null)
      setError(null)
    } catch {
      setError("Falha ao limpar os dados de autenticacao")
    }
  }, [])

  const refreshAccessToken = useCallback(async (): Promise<boolean> => {
    try {
      setIsLoading(true)
      const access = await refreshSessionAccessToken()
      if (!access) throw new Error("Refresh failed")

      setAccessToken(access)
      setError(null)
      return true
    } catch {
      setError("Sessao expirada. Por favor, faca login novamente.")
      logout()
      return false
    } finally {
      setIsLoading(false)
    }
  }, [logout])

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { accessToken: storedToken, user: storedUser } = getAuthSnapshot()

        if (storedToken && storedUser) {
          if (storedToken !== "cookie" && !isTokenValid(storedToken)) {
            const refreshed = await refreshAccessToken()
            if (refreshed) setUser(storedUser)
          } else {
            setAccessToken(storedToken)
            setUser(storedUser)
          }
        }
      } catch {
        setError("Falha ao inicializar a autenticacao")
      } finally {
        setIsLoading(false)
      }
    }

    initializeAuth()
  }, [refreshAccessToken])

  useEffect(() => {
    if (!accessToken || accessToken === "cookie") return

    const interval = setInterval(async () => {
      if (tokenExpiringSoon(accessToken)) {
        await refreshAccessToken()
      }
    }, 30 * 1000)

    return () => clearInterval(interval)
  }, [accessToken, refreshAccessToken])

  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key !== "user_id") return

      const { accessToken: storedToken, user: storedUser } = getAuthSnapshot()
      setAccessToken(storedToken)
      setUser(storedUser)
    }

    window.addEventListener("storage", handleStorageChange)
    return () => window.removeEventListener("storage", handleStorageChange)
  }, [])

  useEffect(() => {
    const handleTokenRefresh = (event: Event) => {
      const customEvent = event as CustomEvent<{ access?: string }>
      if (customEvent.detail?.access) setAccessToken(customEvent.detail.access)
    }

    window.addEventListener("auth:token-refreshed", handleTokenRefresh)
    return () => window.removeEventListener("auth:token-refreshed", handleTokenRefresh)
  }, [])

  useEffect(() => {
    const handleForceLogout = () => {
      clearSession()
      setAccessToken(null)
      setUser(null)
      window.location.href = "/login"
    }

    window.addEventListener("auth:logout", handleForceLogout)
    return () => window.removeEventListener("auth:logout", handleForceLogout)
  }, [])

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
