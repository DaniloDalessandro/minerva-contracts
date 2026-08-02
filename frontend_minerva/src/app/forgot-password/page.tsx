"use client"

import { useState } from "react"
import Link from "next/link"
import { API_ENDPOINTS } from "@/constants/api-endpoints"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle, Mail, ArrowLeft, Loader2, CheckCircle } from "lucide-react"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const response = await fetch(API_ENDPOINTS.AUTH.PASSWORD_RESET, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(true)
      } else {
        setError(data.error || "Erro ao solicitar redefinição de senha")
      }
    } catch {
      setError("Erro ao conectar com o servidor")
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-background flex items-center justify-center p-4">
        <div aria-hidden className="pointer-events-none fixed inset-0 z-0 grid-bg opacity-60" />
        <div aria-hidden className="pointer-events-none fixed inset-0 z-0">
          <div className="absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-primary/8 blur-[120px] animate-[float_8s_ease-in-out_infinite]" />
          <div className="absolute -bottom-40 -right-40 h-[400px] w-[400px] rounded-full bg-[#3daeff]/8 blur-[120px] animate-[float_10s_ease-in-out_infinite_2s]" />
        </div>
        <div className="relative z-10 w-full max-w-md mx-auto animate-fade-in-scale">

        <div className="text-center mb-8 animate-fade-in">
          <div className="mx-auto mb-6 relative w-fit">
            <div className="absolute inset-0 rounded-2xl bg-primary/30 blur-xl" />
            <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-[#3daeff] flex items-center justify-center shadow-lg">
              <svg className="w-8 h-8 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22V8M5 12H2a10 10 0 0 0 20 0h-3M12 8a4 4 0 0 0-4 4v0a4 4 0 0 0 4 4v0a4 4 0 0 0 4-4v0a4 4 0 0 0-4-4Z" />
              </svg>
            </div>
          </div>
          <h1 className="text-3xl font-bold tracking-tight gradient-text">Minerva</h1>
        </div>

        <div className="glass rounded-2xl p-8">
          <div className="text-center space-y-4">
            <div className="mx-auto w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center">
              <CheckCircle className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">Email enviado!</h2>
              <p className="text-muted-foreground text-sm mt-2 leading-relaxed">
                Se o email fornecido estiver cadastrado, você receberá um link para redefinir sua senha. Verifique sua caixa de entrada e spam.
              </p>
            </div>
          </div>

          <Link href="/login">
            <Button className="w-full h-11 mt-6 font-semibold" variant="premium">
              Voltar para login
            </Button>
          </Link>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          © {new Date().getFullYear()} Minerva · EMAP. Todos os direitos reservados.
        </p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-background flex items-center justify-center p-4">
      <div aria-hidden className="pointer-events-none fixed inset-0 z-0 grid-bg opacity-60" />
      <div aria-hidden className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-primary/8 blur-[120px] animate-[float_8s_ease-in-out_infinite]" />
        <div className="absolute -bottom-40 -right-40 h-[400px] w-[400px] rounded-full bg-[#3daeff]/8 blur-[120px] animate-[float_10s_ease-in-out_infinite_2s]" />
      </div>
      <div className="relative z-10 w-full max-w-md mx-auto px-4">

      <div className="text-center mb-8 animate-fade-in">
        <div className="mx-auto mb-6 relative w-fit">
          <div className="absolute inset-0 rounded-2xl bg-primary/30 blur-xl" />
          <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-[#3daeff] flex items-center justify-center shadow-lg">
            <svg className="w-8 h-8 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22V8M5 12H2a10 10 0 0 0 20 0h-3M12 8a4 4 0 0 0-4 4v0a4 4 0 0 0 4 4v0a4 4 0 0 0 4-4v0a4 4 0 0 0-4-4Z" />
            </svg>
          </div>
        </div>
        <h1 className="text-3xl font-bold tracking-tight gradient-text">Minerva</h1>
        <p className="text-muted-foreground mt-2 text-sm">Sistema de Gestão de Contratos</p>
      </div>


      <div className="glass rounded-2xl p-8 animate-fade-in-scale" style={{ animationDelay: "0.1s" }}>
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-foreground">Recuperação de Senha</h2>
          <p className="text-muted-foreground text-sm mt-1 leading-relaxed">
            Digite seu email e enviaremos um link para redefinir sua senha.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-destructive/8 border border-destructive/20 text-destructive animate-fade-in">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span className="text-sm leading-relaxed">{error}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-sm font-medium text-foreground/80">
              Email
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
              <Input
                id="email"
                type="email"
                placeholder="seu.email@exemplo.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className="h-11 pl-10 bg-background/60"
                autoComplete="email"
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-11 text-sm font-semibold"
            variant="premium"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              "Enviar link de recuperação"
            )}
          </Button>
        </form>
      </div>


      <div className="text-center mt-5 animate-fade-in" style={{ animationDelay: "0.2s" }}>
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Voltar para login
        </Link>
      </div>

      <p className="text-center text-xs text-muted-foreground mt-4">
        © {new Date().getFullYear()} Minerva · EMAP. Todos os direitos reservados.
      </p>
      </div>
    </div>
  )
}
