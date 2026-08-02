import { jwtDecode } from "jwt-decode"

import { API_ENDPOINTS } from "@/constants/api-endpoints"

export interface UserData {
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
  groups?: string[]
  is_superuser?: boolean
}

interface JWTPayload {
  exp: number
}

export class AuthSessionError extends Error {
  constructor(
    message: string,
    public readonly code: "missing_token" | "expired_token" | "refresh_failed"
  ) {
    super(message)
    this.name = "AuthSessionError"
  }
}

const ACCESS_COOKIE = "access"
const REFRESH_COOKIE = "refresh"
const COOKIE_SESSION_TOKEN = "cookie"
const USER_STORAGE_KEYS = [
  "user_id",
  "user_email",
  "user_name",
  "user_cpf",
  "user_phone",
  "user_direction_id",
  "user_direction_name",
  "user_management_id",
  "user_management_name",
  "user_coordination_id",
  "user_coordination_name",
  "user_avatar",
  "user_groups",
  "user_is_superuser",
]

let refreshPromise: Promise<string | null> | null = null

const isBrowser = () => typeof window !== "undefined" && typeof document !== "undefined"

export function getCookie(name: string): string | null {
  if (!isBrowser()) return null

  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) return parts.pop()?.split(";").shift() || null
  return null
}

export function deleteCookie(name: string) {
  if (!isBrowser()) return

  document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT`
}

export function getAccessToken() {
  return getCookie(ACCESS_COOKIE)
}

export function isTokenValid(token: string): boolean {
  try {
    const decoded = jwtDecode<JWTPayload>(token)
    return decoded.exp > Date.now() / 1000
  } catch {
    return false
  }
}

export function tokenExpiringSoon(token: string, thresholdSeconds = 300): boolean {
  try {
    const decoded = jwtDecode<JWTPayload>(token)
    const now = Math.floor(Date.now() / 1000)
    return decoded.exp - now < thresholdSeconds
  } catch {
    return true
  }
}

export function saveSession(data: { access?: string; refresh?: string; user: UserData }) {
  if (!isBrowser()) return

  saveUserProfile(data.user)
}

export function saveUserProfile(user: Partial<UserData>) {
  if (!isBrowser()) return

  if (user.id !== undefined) localStorage.setItem("user_id", user.id)
  if (user.email !== undefined) localStorage.setItem("user_email", user.email)
  if (user.name !== undefined) localStorage.setItem("user_name", user.name)
  if (user.cpf !== undefined) localStorage.setItem("user_cpf", user.cpf)
  if (user.phone !== undefined) localStorage.setItem("user_phone", user.phone)
  if (user.direction_id !== undefined) localStorage.setItem("user_direction_id", String(user.direction_id))
  if (user.direction_name !== undefined) localStorage.setItem("user_direction_name", user.direction_name)
  if (user.management_id !== undefined) localStorage.setItem("user_management_id", String(user.management_id))
  if (user.management_name !== undefined) localStorage.setItem("user_management_name", user.management_name)
  if (user.coordination_id !== undefined) localStorage.setItem("user_coordination_id", String(user.coordination_id))
  if (user.coordination_name !== undefined) localStorage.setItem("user_coordination_name", user.coordination_name)
  if (user.avatar !== undefined) localStorage.setItem("user_avatar", user.avatar)
  if (user.groups !== undefined) localStorage.setItem("user_groups", JSON.stringify(user.groups))
  if (user.is_superuser !== undefined) localStorage.setItem("user_is_superuser", String(user.is_superuser))
}

export function getStoredUser(): UserData | null {
  if (!isBrowser()) return null

  try {
    const user: UserData = {
      id: localStorage.getItem("user_id") || "",
      email: localStorage.getItem("user_email") || "",
      name: localStorage.getItem("user_name") || "",
      cpf: localStorage.getItem("user_cpf") || "",
      phone: localStorage.getItem("user_phone") || "",
      direction_id: localStorage.getItem("user_direction_id")
        ? Number(localStorage.getItem("user_direction_id"))
        : undefined,
      direction_name: localStorage.getItem("user_direction_name") || "",
      management_id: localStorage.getItem("user_management_id")
        ? Number(localStorage.getItem("user_management_id"))
        : undefined,
      management_name: localStorage.getItem("user_management_name") || "",
      coordination_id: localStorage.getItem("user_coordination_id")
        ? Number(localStorage.getItem("user_coordination_id"))
        : undefined,
      coordination_name: localStorage.getItem("user_coordination_name") || "",
      avatar: localStorage.getItem("user_avatar") || "",
      groups: JSON.parse(localStorage.getItem("user_groups") || "[]"),
      is_superuser: localStorage.getItem("user_is_superuser") === "true",
    }

    return user.id ? user : null
  } catch {
    return null
  }
}

export function getAuthSnapshot() {
  const accessToken = getAccessToken()
  const user = getStoredUser()

  return {
    accessToken: accessToken ?? (user ? COOKIE_SESSION_TOKEN : null),
    user,
  }
}

export function clearSession() {
  if (!isBrowser()) return

  deleteCookie(ACCESS_COOKIE)
  deleteCookie(REFRESH_COOKIE)
  localStorage.removeItem("access")
  localStorage.removeItem("refresh")
  USER_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key))
}

export async function revokeSession() {
  try {
    await fetch(API_ENDPOINTS.AUTH.LOGOUT, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    })
  } catch {
  } finally {
    clearSession()
  }
}

export function notifyAuthLogout(reason: string) {
  clearSession()
  if (!isBrowser()) return

  window.dispatchEvent(new CustomEvent("auth:logout", { detail: { reason } }))
}

export async function refreshAccessToken(): Promise<string | null> {
  if (refreshPromise) return refreshPromise

  refreshPromise = fetch(API_ENDPOINTS.AUTH.REFRESH, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  })
    .then(async (response) => {
      if (!response.ok) return null

      const data = await response.json()
      const nextAccess = data.access || COOKIE_SESSION_TOKEN

      if (isBrowser()) {
        window.dispatchEvent(new CustomEvent("auth:token-refreshed", { detail: { access: nextAccess } }))
      }
      return nextAccess as string
    })
    .catch(() => null)
    .finally(() => {
      refreshPromise = null
    })

  return refreshPromise
}

export async function getValidAccessToken(thresholdSeconds = 60): Promise<string> {
  const access = getAccessToken()
  const storedUser = getStoredUser()

  if (!access && !storedUser) {
    throw new AuthSessionError("Nenhum token disponivel", "missing_token")
  }


  if (access && isTokenValid(access) && !tokenExpiringSoon(access, thresholdSeconds)) {
    return access
  }


  if (storedUser && !access) {
    return COOKIE_SESSION_TOKEN
  }


  if (access && isTokenValid(access)) {
    return access
  }


  const refreshed = await refreshAccessToken()
  if (refreshed) return refreshed

  throw new AuthSessionError("Sessao expirada", "expired_token")
}
