"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Mail, Shield } from "lucide-react"

const GROUP_OPTIONS = [
  { value: "PRESIDENTE", label: "Presidente" },
  { value: "DIRETOR", label: "Diretor" },
  { value: "GERENTE", label: "Gerente" },
  { value: "COORDENADOR", label: "Coordenador" },
  { value: "ANALISTA", label: "Analista" },
  { value: "FUNCIONARIO", label: "Funcionário" },
]

interface InviteFormProps {
  open: boolean
  handleClose: () => void
  initialData: null
  onSubmit: (data: { email: string; group: string }) => Promise<void>
  isSubmitting?: boolean
}

export default function InviteForm({
  open,
  handleClose,
  onSubmit,
  isSubmitting = false,
}: InviteFormProps) {
  const [email, setEmail] = useState("")
  const [group, setGroup] = useState("FUNCIONARIO")

  useEffect(() => {
    if (open) {
      setEmail("")
      setGroup("FUNCIONARIO")
    }
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    await onSubmit({ email, group })
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-semibold text-primary">
              <Mail className="h-5 w-5" />
              Convidar por e-mail
            </DialogTitle>
            <DialogDescription>
              O usuário receberá um link seguro para completar o cadastro.
              O link expira em 48 horas.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-1.5">
              <Label htmlFor="invite-email">
                E-mail <span className="text-destructive">*</span>
              </Label>
              <Input
                id="invite-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="usuario@empresa.com"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label>Perfil que será atribuído</Label>
              <Select value={group} onValueChange={setGroup}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GROUP_OPTIONS.map((g) => (
                    <SelectItem key={g.value} value={g.value}>
                      {g.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-start gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2.5 text-xs text-muted-foreground">
              <Shield className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
              <span>
                O link gerado é único e de uso único. Após o cadastro ser concluído,
                o link é invalidado automaticamente.
              </span>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Enviando...
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4 mr-2" />
                  Enviar convite
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
