"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"

export type ThemeMode = "light" | "dark" | "system"
export type ResolvedTheme = "light" | "dark"

interface ThemeContextType {
  mode: ThemeMode
  theme: ResolvedTheme
  toggleTheme: () => void
  setTheme: (theme: ThemeMode) => void
}

const STORAGE_KEY = "theme"
const SYSTEM_QUERY = "(prefers-color-scheme: dark)"

const isThemeMode = (value: string | null): value is ThemeMode =>
  value === "light" || value === "dark" || value === "system"

const getSystemTheme = (): ResolvedTheme =>
  window.matchMedia(SYSTEM_QUERY).matches ? "dark" : "light"

const resolveTheme = (mode: ThemeMode): ResolvedTheme =>
  mode === "system" ? getSystemTheme() : mode

const applyThemeClass = (theme: ResolvedTheme) => {
  document.documentElement.classList.toggle("dark", theme === "dark")
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>("system")
  const [theme, setResolvedTheme] = useState<ResolvedTheme>("light")
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    const storedTheme = localStorage.getItem(STORAGE_KEY)
    const initialMode = isThemeMode(storedTheme) ? storedTheme : "system"
    const initialTheme = resolveTheme(initialMode)

    setMode(initialMode)
    setResolvedTheme(initialTheme)
    applyThemeClass(initialTheme)
    setIsInitialized(true)
  }, [])

  useEffect(() => {
    if (!isInitialized) return

    const mediaQuery = window.matchMedia(SYSTEM_QUERY)

    const updateTheme = () => {
      const nextTheme = resolveTheme(mode)
      setResolvedTheme(nextTheme)
      applyThemeClass(nextTheme)
      localStorage.setItem(STORAGE_KEY, mode)
    }

    updateTheme()

    if (mode !== "system") return

    mediaQuery.addEventListener("change", updateTheme)
    return () => mediaQuery.removeEventListener("change", updateTheme)
  }, [isInitialized, mode])

  const toggleTheme = useCallback(() => {
    setMode((previousMode) => {
      if (previousMode === "light") return "dark"
      if (previousMode === "dark") return "system"
      return "light"
    })
  }, [])

  const setTheme = useCallback((newTheme: ThemeMode) => {
    setMode(newTheme)
  }, [])

  const value = useMemo(
    () => ({
      mode,
      theme,
      toggleTheme,
      setTheme,
    }),
    [mode, theme, toggleTheme, setTheme]
  )

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}
