"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Eye,
  EyeOff,
  Loader2,
  Shield,
  UserPlus,
  XCircle,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { acceptInvite, validateInviteToken, type InviteValidateResponse } from "@/lib/api/users"
import { cn } from "@/lib/utils"

const GROUP_LABELS: Record<string, string> = {
  PRESIDENTE: "Presidente",
  DIRETOR: "Diretor",
  GERENTE: "Gerente",
  COORDENADOR: "Coordenador",
  FUNCIONARIO: "Funcionário",
}

type PageState = "loading" | "valid" | "invalid" | "success"

export default function ConvitePage() {
  const params = useParams()
  const router = useRouter()
  const token = params.token as string

  const [pageState, setPageState] = useState<PageState>("loading")
  const [inviteInfo, setInviteInfo] = useState<InviteValidateResponse | null>(null)
  const [invalidReason, setInvalidReason] = useState("")

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    password: "",
    password2: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showPassword2, setShowPassword2] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState("")

  useEffect(() => {
    if (!token) return
    validateInviteToken(token).then((res) => {
      if (res.valid) {
        setInviteInfo(res)
        setPageState("valid")
      } else {
        setInvalidReason(res.error || "Este link não é válido.")
        setPageState("invalid")
      }
    })
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError("")

    if (!form.first_name.trim()) {
      setFormError("Informe seu nome.")
      return
    }
    if (form.password.length < 8) {
      setFormError("A senha deve ter pelo menos 8 caracteres.")
      return
    }
    if (form.password !== form.password2) {
      setFormError("As senhas não coincidem.")
      return
    }

    setSubmitting(true)
    try {
      await acceptInvite({
        token,
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        password: form.password,
        password2: form.password2,
      })
      setPageState("success")
    } catch (err: any) {
      setFormError(err.message || "Ocorreu um erro. Tente novamente.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">

      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-primary/8 blur-3xl" />
      </div>

      <div className="relative flex min-h-screen flex-col items-center justify-center px-4 py-12">

        <Link href="/login" className="mb-8 flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 rounded-xl bg-primary/30 blur-md" />
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-[#3daeff] text-white shadow-sm">
              <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22V8M5 12H2a10 10 0 0 0 20 0h-3M12 8a4 4 0 0 0-4 4v0a4 4 0 0 0 4 4v0a4 4 0 0 0 4-4v0a4 4 0 0 0-4-4Z" />
              </svg>
            </div>
          </div>
          <span className="text-xl font-bold tracking-tight">Minerva</span>
        </Link>

        <div className="w-full max-w-md">

          {pageState === "loading" && (
            <div className="flex flex-col items-center gap-4 rounded-2xl border border-border/70 bg-card p-10 shadow-premium text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
              <div>
                <p className="font-semibold">Validando convite…</p>
                <p className="text-sm text-muted-foreground">Aguarde um momento.</p>
              </div>
            </div>
          )}


          {pageState === "invalid" && (
            <div className="flex flex-col items-center gap-5 rounded-2xl border border-border/70 bg-card p-10 shadow-premium text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/10">
                <XCircle className="h-7 w-7 text-rose-500" />
              </div>
              <div>
                <p className="text-lg font-semibold">Link inválido</p>
                <p className="mt-1 text-sm text-muted-foreground">{invalidReason}</p>
              </div>
              <div className="flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/8 px-3 py-2.5 text-xs text-amber-700 dark:text-amber-300 text-left w-full">
                <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>Links de convite expiram em 48 horas e podem ser usados apenas uma vez. Solicite um novo convite ao administrador.</span>
              </div>
              <Button asChild variant="outline" className="w-full">
                <Link href="/login">Ir para o login</Link>
              </Button>
            </div>
          )}


          {pageState === "valid" && inviteInfo && (
            <div className="rounded-2xl border border-border/70 bg-card shadow-premium overflow-hidden">

              <div className="border-b border-border/70 bg-primary/5 px-6 py-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                    <UserPlus className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h1 className="font-semibold">Criar sua conta</h1>
                    <p className="text-xs text-muted-foreground">
                      Convite para <span className="font-medium text-foreground">{inviteInfo.email}</span>
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/8 px-2 py-0.5 text-xs font-medium text-primary">
                    <Shield className="h-3 w-3" />
                    Perfil: {inviteInfo.group_display || GROUP_LABELS[inviteInfo.group || ""] || inviteInfo.group}
                  </span>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="first_name">Nome <span className="text-destructive">*</span></Label>
                    <Input
                      id="first_name"
                      value={form.first_name}
                      onChange={(e) => setForm((p) => ({ ...p, first_name: e.target.value }))}
                      placeholder="João"
                      autoFocus
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="last_name">Sobrenome</Label>
                    <Input
                      id="last_name"
                      value={form.last_name}
                      onChange={(e) => setForm((p) => ({ ...p, last_name: e.target.value }))}
                      placeholder="Silva"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="email-readonly">E-mail</Label>
                  <Input id="email-readonly" value={inviteInfo.email} readOnly className="bg-muted/50 cursor-not-allowed" />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="password">Senha <span className="text-destructive">*</span></Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={form.password}
                      onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                      placeholder="Mínimo 8 caracteres"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="password2">Confirmar senha <span className="text-destructive">*</span></Label>
                  <div className="relative">
                    <Input
                      id="password2"
                      type={showPassword2 ? "text" : "password"}
                      value={form.password2}
                      onChange={(e) => setForm((p) => ({ ...p, password2: e.target.value }))}
                      placeholder="Repita a senha"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword2((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword2 ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {formError && (
                  <div className="flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/8 px-3 py-2.5 text-xs text-destructive">
                    <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    {formError}
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  Criar minha conta
                </Button>
              </form>
            </div>
          )}


          {pageState === "success" && (
            <div className="flex flex-col items-center gap-5 rounded-2xl border border-border/70 bg-card p-10 shadow-premium text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10">
                <CheckCircle2 className="h-7 w-7 text-emerald-500" />
              </div>
              <div>
                <p className="text-lg font-semibold">Conta criada com sucesso!</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Seu acesso ao Sistema Minerva está pronto.
                  Faça login para começar.
                </p>
              </div>
              <Button asChild className="w-full">
                <Link href="/login">Ir para o login</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
