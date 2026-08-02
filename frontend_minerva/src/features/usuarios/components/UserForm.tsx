"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
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
import { Loader2, ImageOff } from "lucide-react"
import { AvatarPicker } from "@/components/ui/AvatarPicker"
import { type AdminUser } from "@/lib/api/users"

const GROUP_OPTIONS = [
  { value: "PRESIDENTE", label: "Presidente" },
  { value: "DIRETOR", label: "Diretor" },
  { value: "GERENTE", label: "Gerente" },
  { value: "COORDENADOR", label: "Coordenador" },
  { value: "ANALISTA", label: "Analista" },
  { value: "FUNCIONARIO", label: "Funcionário" },
]

interface UserFormProps {
  open: boolean
  handleClose: () => void
  initialData: AdminUser | null
  onSubmit: (data: any) => Promise<void>
  isSubmitting?: boolean
}

export default function UserForm({
  open,
  handleClose,
  initialData,
  onSubmit,
  isSubmitting = false,
}: UserFormProps) {
  const isEditing = !!initialData

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    group: "FUNCIONARIO",
    is_active: true,
    avatar: "av_1",
  })

  useEffect(() => {
    if (open) {
      if (initialData) {
        const parts = (initialData.name || "").split(" ")
        setForm({
          first_name: parts[0] || "",
          last_name: parts.slice(1).join(" ") || "",
          email: initialData.email,
          password: "",
          group: initialData.groups[0] || "FUNCIONARIO",
          is_active: initialData.is_active,
          avatar: initialData.avatar || "av_1",
        })
      } else {
        setForm({
          first_name: "",
          last_name: "",
          email: "",
          password: "",
          group: "FUNCIONARIO",
          is_active: true,
          avatar: "av_1",
        })
      }
    }
  }, [open, initialData])

  const set = (key: string, value: unknown) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.first_name.trim() || (!isEditing && (!form.email.trim() || !form.password.trim()))) {
      return
    }
    const payload = isEditing
      ? {
          id: initialData!.id,
          first_name: form.first_name,
          last_name: form.last_name,
          group: form.group,
          avatar: form.avatar,
        }
      : {
          first_name: form.first_name,
          last_name: form.last_name,
          email: form.email,
          password: form.password,
          group: form.group,
          is_active: form.is_active,
          avatar: form.avatar,
        }
    await onSubmit(payload)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="flex flex-col gap-0 p-0 sm:max-w-[520px] max-w-[92vw] max-h-[90vh] overflow-hidden">
        <form onSubmit={handleSubmit} className="flex flex-col min-h-0 flex-1 overflow-hidden">
          <DialogHeader className="shrink-0 px-6 pt-5 pb-3">
            <DialogTitle className="text-[16px] font-semibold text-primary">
              {isEditing ? "Editar usuário" : "Novo usuário"}
            </DialogTitle>
          </DialogHeader>

          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-3 space-y-5">
            {/* Avatar */}
            <div className="space-y-2">
              <p className="text-[13px] font-semibold text-foreground border-b border-primary/25 pb-1.5 flex items-center gap-2">
                <span className="w-1 h-[16px] rounded-full bg-primary/70 inline-block" />
                Avatar
              </p>
              <AvatarPicker value={form.avatar} onChange={(id) => set("avatar", id)} />
              <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                <ImageOff className="w-3 h-3" />
                Apenas avatares são permitidos — upload de fotos não é suportado.
              </p>
            </div>

            {/* Nome */}
            <div className="space-y-2">
              <p className="text-[13px] font-semibold text-foreground border-b border-primary/25 pb-1.5 flex items-center gap-2">
                <span className="w-1 h-[16px] rounded-full bg-primary/70 inline-block" />
                Dados pessoais
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="first_name">
                    Nome<span className="ml-px text-destructive">*</span>
                  </Label>
                  <Input
                    id="first_name"
                    value={form.first_name}
                    onChange={(e) => set("first_name", e.target.value)}
                    placeholder="João"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="last_name">Sobrenome</Label>
                  <Input
                    id="last_name"
                    value={form.last_name}
                    onChange={(e) => set("last_name", e.target.value)}
                    placeholder="Silva"
                  />
                </div>
              </div>
            </div>

            {/* Acesso */}
            {!isEditing && (
              <div className="space-y-2">
                <p className="text-[13px] font-semibold text-foreground border-b border-primary/25 pb-1.5 flex items-center gap-2">
                  <span className="w-1 h-[16px] rounded-full bg-primary/70 inline-block" />
                  Acesso
                </p>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="email">
                      E-mail<span className="ml-px text-destructive">*</span>
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={form.email}
                      onChange={(e) => set("email", e.target.value)}
                      placeholder="joao@empresa.com"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="password">
                      Senha<span className="ml-px text-destructive">*</span>
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      value={form.password}
                      onChange={(e) => set("password", e.target.value)}
                      placeholder="Mínimo 8 caracteres"
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Perfil */}
            <div className="space-y-2">
              <p className="text-[13px] font-semibold text-foreground border-b border-primary/25 pb-1.5 flex items-center gap-2">
                <span className="w-1 h-[16px] rounded-full bg-primary/70 inline-block" />
                Configurações
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Perfil</Label>
                  <Select value={form.group} onValueChange={(v) => set("group", v)}>
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

                {!isEditing && (
                  <div className="space-y-1.5">
                    <Label>Status inicial</Label>
                    <Select
                      value={form.is_active ? "true" : "false"}
                      onValueChange={(v) => set("is_active", v === "true")}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Ativo</SelectItem>
                        <SelectItem value="false">Inativo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="shrink-0 flex-col-reverse sm:flex-row sm:justify-end gap-2 border-t border-border/70 px-6 py-4 bg-muted/20">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-9 w-full rounded-[10px] sm:w-auto gap-2 font-semibold"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {isEditing ? "Salvando..." : "Criando..."}
                </>
              ) : isEditing ? (
                "Salvar alterações"
              ) : (
                "Criar usuário"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
