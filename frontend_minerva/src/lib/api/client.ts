import {
  AuthSessionError,
  getValidAccessToken,
  notifyAuthLogout,
  refreshAccessToken,
} from "@/lib/auth/session"

function createAuthHeaders(accessToken: string, options: RequestInit) {
  const headers = new Headers(options.headers)

  if (accessToken !== "cookie") {
    headers.set("Authorization", `Bearer ${accessToken}`)
  }

  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData

  if (!isFormData && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json")
  }

  return headers
}

function logoutFromAuthError(error: unknown) {
  if (error instanceof AuthSessionError) {
    notifyAuthLogout(error.message)
    return
  }

  notifyAuthLogout("Falha de autenticacao")
}


export async function apiClient(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  let accessToken: string

  try {
    accessToken = await getValidAccessToken()
  } catch (error) {
    logoutFromAuthError(error)
    return Promise.reject(error)
  }

  const response = await fetch(url, {
    ...options,
    credentials: "include",
    headers: createAuthHeaders(accessToken, options),
  })

  if (response.status === 401) {
    const refreshedAccess = await refreshAccessToken()

    if (refreshedAccess) {
      return fetch(url, {
        ...options,
        credentials: "include",
        headers: createAuthHeaders(refreshedAccess, options),
      })
    }

    notifyAuthLogout("Nao autorizado - token invalido e renovacao falhou")
    return Promise.reject(new AuthSessionError("Nao autorizado", "refresh_failed"))
  }

  if (response.status === 403) {
    console.warn("Acesso negado (403) - verificar permissoes")
  }

  return response
}


export { apiClient as authFetch }
