"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuthContext } from "@/context/AuthContext"
import { API_ENDPOINTS } from "@/constants/api-endpoints"
import { Eye, EyeOff, Loader2, AlertCircle } from "lucide-react"

export function LoginForm({ className, ...props }: React.ComponentProps<"div">) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { login } = useAuthContext()

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const response = await fetch(API_ENDPOINTS.AUTH.LOGIN, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (response.ok) {
        login({ access: data.access, refresh: data.refresh, user: data.user })
        router.push("/dashboard")
      } else {
        setError(data?.detail || data?.non_field_errors?.[0] || "Credenciais inválidas")
      }
    } catch {
      setError("Erro de conexão com o servidor. Tente novamente.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={cn("w-full max-w-md mx-auto px-4", className)} {...props}>

      <div className="text-center mb-8 animate-fade-in">

        <div className="mx-auto mb-6 relative w-fit">
          <div className="absolute inset-0 rounded-2xl bg-primary/30 blur-xl" />
          <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-[#3daeff] flex items-center justify-center shadow-lg">
            <svg
              className="w-8 h-8 text-white"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 22V8M5 12H2a10 10 0 0 0 20 0h-3M12 8a4 4 0 0 0-4 4v0a4 4 0 0 0 4 4v0a4 4 0 0 0 4-4v0a4 4 0 0 0-4-4Z" />
            </svg>
          </div>
        </div>

        <h1 className="text-3xl font-bold tracking-tight gradient-text">
          Minerva
        </h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Sistema de Gestão de Contratos
        </p>
      </div>


      <div
        className="glass rounded-2xl p-8 animate-fade-in-scale"
        style={{ animationDelay: "0.1s" }}
      >
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-foreground">Bem-vindo de volta</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Entre com suas credenciais para continuar
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          {error && (
            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-destructive/8 border border-destructive/20 text-destructive animate-fade-in">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span className="text-sm leading-relaxed">{error}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <Label
              htmlFor="email"
              className="text-sm font-medium text-foreground/80"
            >
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="seu.email@exemplo.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              className="h-11 bg-background/60"
              autoComplete="email"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label
                htmlFor="password"
                className="text-sm font-medium text-foreground/80"
              >
                Senha
              </Label>
              <Link
                href="/forgot-password"
                className="text-xs text-primary hover:text-primary/80 font-medium transition-colors"
              >
                Esqueceu a senha?
              </Link>
            </div>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Sua senha"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                className="h-11 pr-11 bg-background/60"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-11 text-sm font-semibold"
            variant="premium"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Entrando...
              </>
            ) : (
              "Entrar na plataforma"
            )}
          </Button>
        </form>
      </div>


      <p
        className="text-center text-xs text-muted-foreground mt-6 animate-fade-in"
        style={{ animationDelay: "0.2s" }}
      >
        © {new Date().getFullYear()} Minerva · EMAP. Todos os direitos reservados.
      </p>
    </div>
  )
}
