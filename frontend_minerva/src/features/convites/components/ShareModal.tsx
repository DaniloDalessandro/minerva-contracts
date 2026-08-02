"use client"

import { useState, useEffect, useRef } from "react"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Loader2, Share2, Users, Mail, Hash, Search, ChevronRight, X, Plus, CheckCircle2, AlertCircle } from "lucide-react"
import { SharingService } from "@/services"
import { toast } from "@/hooks/use-toast"
import type { ResourceType, PermissionType, UserSuggestion, ResourceResult } from "@/lib/api/sharing"
import { cn } from "@/lib/utils"

const PERMISSION_OPTIONS: Record<ResourceType, { value: PermissionType; label: string; description: string }[]> = {
  BUDGET: [
    { value: 'VIEW', label: 'Somente Visualização', description: 'Visualiza orçamento, linhas e contratos' },
    { value: 'CREATE_BUDGET_LINES', label: 'Pode Criar Linhas', description: 'Visualiza e cria linhas orçamentárias neste orçamento' },
  ],
  BUDGET_LINE: [
    { value: 'VIEW', label: 'Somente Visualização', description: 'Visualiza a linha e seus contratos' },
    { value: 'CREATE_CONTRACTS', label: 'Pode Criar Contratos', description: 'Visualiza e cria contratos nesta linha' },
  ],
  CONTRACT: [
    { value: 'VIEW', label: 'Somente Visualização', description: 'Apenas visualiza o contrato' },
  ],
}

const RESOURCE_LABELS: Record<ResourceType, string> = {
  BUDGET: 'Orçamento',
  BUDGET_LINE: 'Linha Orçamentária',
  CONTRACT: 'Contrato',
}

type RecipientMode = 'email' | 'matricula'

interface Recipient {
  email: string
  display: string   // e-mail ou matrícula mostrada no chip
  name?: string
  matricula?: string
}

interface ShareModalProps {
  open: boolean
  onClose: () => void
  resourceType: ResourceType
  resourceId?: number
  resourceName?: string
  onSuccess?: () => void
}

export function ShareModal({ open, onClose, resourceType, resourceId, resourceName, onSuccess }: ShareModalProps) {
  // Recurso
  const [selectedResource, setSelectedResource] = useState<ResourceResult | null>(
    resourceId && resourceName ? { id: resourceId, name: resourceName } : null
  )
  const [resourceQuery, setResourceQuery] = useState('')
  const [resourceResults, setResourceResults] = useState<ResourceResult[]>([])
  const [searchingResource, setSearchingResource] = useState(false)
  const [showResourceResults, setShowResourceResults] = useState(false)
  const resourceTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Destinatários (lista)
  const [recipients, setRecipients] = useState<Recipient[]>([])
  const [recipientMode, setRecipientMode] = useState<RecipientMode>('email')
  const [recipientQuery, setRecipientQuery] = useState('')
  const [suggestions, setSuggestions] = useState<UserSuggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [searching, setSearching] = useState(false)
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Permissão e mensagem
  const [permission, setPermission] = useState<PermissionType>('VIEW')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const permOptions = PERMISSION_OPTIONS[resourceType]
  const hasResourceFromProps = !!(resourceId && resourceName)
  const canSubmit = !!selectedResource && recipients.length > 0 && !submitting

  useEffect(() => {
    if (open) {
      setSelectedResource(hasResourceFromProps ? { id: resourceId!, name: resourceName! } : null)
      setResourceQuery('')
      setResourceResults([])
      setRecipients([])
      setRecipientMode('email')
      setRecipientQuery('')
      setSuggestions([])
      setPermission('VIEW')
      setMessage('')
    }
  }, [open])

  // ── Recurso ────────────────────────────────────────────────
  const handleResourceQueryChange = (value: string) => {
    setResourceQuery(value)
    setSelectedResource(null)
    if (resourceTimeout.current) clearTimeout(resourceTimeout.current)
    if (value.length >= 2) {
      setSearchingResource(true)
      resourceTimeout.current = setTimeout(async () => {
        try {
          const results = await SharingService.searchResources(resourceType, value)
          setResourceResults(results)
          setShowResourceResults(results.length > 0)
        } finally {
          setSearchingResource(false)
        }
      }, 300)
    } else {
      setResourceResults([])
      setShowResourceResults(false)
      setSearchingResource(false)
    }
  }

  const selectResource = (r: ResourceResult) => {
    setSelectedResource(r)
    setResourceQuery(r.name)
    setShowResourceResults(false)
  }

  // ── Destinatários ──────────────────────────────────────────
  const addRecipient = (r: Recipient) => {
    if (recipients.some((x) => x.email === r.email)) return // sem duplicatas
    setRecipients((prev) => [...prev, r])
    setRecipientQuery('')
    setSuggestions([])
    setShowSuggestions(false)
    inputRef.current?.focus()
  }

  const removeRecipient = (email: string) => {
    setRecipients((prev) => prev.filter((r) => r.email !== email))
  }

  const handleRecipientChange = (value: string) => {
    setRecipientQuery(value)
    if (searchTimeout.current) clearTimeout(searchTimeout.current)
    if (value.length >= 2) {
      setSearching(true)
      searchTimeout.current = setTimeout(async () => {
        try {
          const results = await SharingService.searchUsersByQuery(value)
          setSuggestions(results)
          setShowSuggestions(results.length > 0)
        } finally {
          setSearching(false)
        }
      }, 300)
    } else {
      setSuggestions([])
      setShowSuggestions(false)
      setSearching(false)
    }
  }

  const handleRecipientKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      tryAddFromInput()
    }
  }

  const tryAddFromInput = () => {
    const q = recipientQuery.trim()
    if (!q) return
    if (recipientMode === 'email' && q.includes('@')) {
      addRecipient({ email: q, display: q })
    }
    // matrícula sem seleção de sugestão — não adiciona (precisa selecionar da lista)
  }

  const selectSuggestion = (s: UserSuggestion) => {
    addRecipient({
      email: s.email,
      display: recipientMode === 'matricula' ? (s.matricula || s.email) : s.email,
      name: s.name,
      matricula: s.matricula,
    })
  }

  // ── Submit ─────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    setSubmitting(true)

    const results = await Promise.allSettled(
      recipients.map((r) =>
        SharingService.createShare({
          resource_type: resourceType,
          resource_id: selectedResource!.id,
          invited_email: r.email,
          permission_type: permission,
          message: message.trim(),
        })
      )
    )

    const succeeded = results.filter((r) => r.status === 'fulfilled').length
    const failed = results.filter((r) => r.status === 'rejected')

    if (succeeded > 0) {
      toast({
        title: succeeded === recipients.length
          ? `${succeeded} convite${succeeded > 1 ? 's' : ''} enviado${succeeded > 1 ? 's' : ''} com sucesso!`
          : `${succeeded} de ${recipients.length} convites enviados`,
        variant: 'default',
      })
      onSuccess?.()
    }

    if (failed.length > 0) {
      const msgs = failed.map((f) => {
        if (f.status === 'rejected') {
          let msg = f.reason?.message || 'Erro desconhecido'
          try { msg = JSON.parse(msg)?.invited_email?.[0] || msg } catch {}
          return msg
        }
        return ''
      }).filter(Boolean)
      toast({
        title: `${failed.length} convite${failed.length > 1 ? 's' : ''} não enviado${failed.length > 1 ? 's' : ''}`,
        description: msgs[0],
        variant: 'destructive',
      })
    }

    setSubmitting(false)
    if (succeeded > 0) onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="flex flex-col gap-0 p-0 sm:max-w-[520px] max-w-[92vw] max-h-[90vh] overflow-hidden">
        <form onSubmit={handleSubmit} className="flex flex-col min-h-0 flex-1 overflow-hidden">
          <DialogHeader className="shrink-0 px-6 pt-5 pb-3 border-b border-border/60">
            <DialogTitle className="flex items-center gap-2 text-[16px] font-semibold text-primary">
              <Share2 className="h-4 w-4" />
              Enviar Convite — {RESOURCE_LABELS[resourceType]}
            </DialogTitle>
          </DialogHeader>

          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4 space-y-5">

            {/* Recurso — busca quando não vem via props */}
            {!hasResourceFromProps && (
              <div className="space-y-2">
                <p className="text-[13px] font-semibold text-foreground border-b border-primary/25 pb-1.5 flex items-center gap-2">
                  <span className="w-1 h-[16px] rounded-full bg-primary/70 inline-block" />
                  {RESOURCE_LABELS[resourceType]}
                  <span className="ml-px text-destructive">*</span>
                </p>
                <div className="relative">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      value={resourceQuery}
                      onChange={(e) => handleResourceQueryChange(e.target.value)}
                      onFocus={() => resourceResults.length > 0 && setShowResourceResults(true)}
                      onBlur={() => setTimeout(() => setShowResourceResults(false), 150)}
                      placeholder={`Buscar ${RESOURCE_LABELS[resourceType].toLowerCase()}...`}
                      className="pl-9"
                      autoComplete="off"
                    />
                    {searchingResource && (
                      <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 animate-spin text-muted-foreground" />
                    )}
                  </div>
                  {selectedResource && (
                    <div className="mt-1.5 flex items-center gap-2 rounded-lg bg-primary/5 border border-primary/20 px-3 py-2">
                      <Share2 className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span className="text-sm font-medium text-primary truncate">{selectedResource.name}</span>
                    </div>
                  )}
                  {showResourceResults && resourceResults.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-xl shadow-lg overflow-hidden">
                      {resourceResults.map((r) => (
                        <button
                          key={r.id}
                          type="button"
                          onMouseDown={() => selectResource(r)}
                          className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-muted/60 transition-colors"
                        >
                          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <span className="text-sm truncate">{r.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Recurso fixo (quando vem via props) */}
            {hasResourceFromProps && (
              <div className="flex items-center gap-2 rounded-xl bg-primary/5 border border-primary/20 px-3 py-2.5">
                <Share2 className="h-3.5 w-3.5 text-primary shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">{RESOURCE_LABELS[resourceType]}</p>
                  <p className="text-sm font-medium text-foreground truncate">{resourceName}</p>
                </div>
              </div>
            )}

            {/* Destinatários */}
            <div className="space-y-2">
              <p className="text-[13px] font-semibold text-foreground border-b border-primary/25 pb-1.5 flex items-center gap-2">
                <span className="w-1 h-[16px] rounded-full bg-primary/70 inline-block" />
                Destinatários
                <span className="ml-px text-destructive">*</span>
                {recipients.length > 0 && (
                  <Badge variant="secondary" className="ml-auto text-[11px] h-5">
                    {recipients.length} pessoa{recipients.length > 1 ? 's' : ''}
                  </Badge>
                )}
              </p>

              {/* Chips dos destinatários adicionados */}
              {recipients.length > 0 && (
                <div className="flex flex-wrap gap-1.5 p-2.5 rounded-xl bg-muted/30 border border-border/60 min-h-[40px]">
                  {recipients.map((r) => (
                    <div
                      key={r.email}
                      className="flex items-center gap-1.5 bg-primary/10 text-primary rounded-lg px-2.5 py-1 text-xs font-medium"
                    >
                      <Users className="h-3 w-3 shrink-0" />
                      <span className="max-w-[160px] truncate" title={r.name || r.email}>
                        {r.name || r.display}
                      </span>
                      {r.matricula && (
                        <span className="text-primary/60 font-normal">· {r.matricula}</span>
                      )}
                      <button
                        type="button"
                        onClick={() => removeRecipient(r.email)}
                        className="ml-0.5 rounded hover:bg-primary/20 p-0.5 transition-colors"
                        title="Remover"
                      >
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Toggle E-mail / Matrícula */}
              <div className="flex items-center gap-1 rounded-lg border border-border p-0.5 bg-muted/30 w-fit">
                <button
                  type="button"
                  onClick={() => { setRecipientMode('email'); setRecipientQuery(''); setSuggestions([]) }}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all",
                    recipientMode === 'email'
                      ? "bg-background shadow-sm text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Mail className="h-3 w-3" />
                  E-mail
                </button>
                <button
                  type="button"
                  onClick={() => { setRecipientMode('matricula'); setRecipientQuery(''); setSuggestions([]) }}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all",
                    recipientMode === 'matricula'
                      ? "bg-background shadow-sm text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Hash className="h-3 w-3" />
                  Matrícula
                </button>
              </div>

              {/* Campo de busca */}
              <div className="relative">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      ref={inputRef}
                      type={recipientMode === 'email' ? 'email' : 'text'}
                      value={recipientQuery}
                      onChange={(e) => handleRecipientChange(e.target.value)}
                      onKeyDown={handleRecipientKeyDown}
                      onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                      placeholder={recipientMode === 'email' ? 'usuario@empresa.com' : 'Ex: 12345'}
                      autoComplete="off"
                    />
                    {searching && (
                      <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 animate-spin text-muted-foreground" />
                    )}
                  </div>
                  {recipientMode === 'email' && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={tryAddFromInput}
                      disabled={!recipientQuery.trim().includes('@')}
                      className="shrink-0 h-9"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>

                {recipientMode === 'email' && (
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Digite e pressione Enter ou clique <Plus className="inline h-2.5 w-2.5" /> para adicionar
                  </p>
                )}
                {recipientMode === 'matricula' && (
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Digite a matrícula e selecione da lista
                  </p>
                )}

                {/* Autocomplete */}
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-xl shadow-lg overflow-hidden">
                    {suggestions.map((s) => {
                      const alreadyAdded = recipients.some((r) => r.email === s.email)
                      return (
                        <button
                          key={s.email}
                          type="button"
                          onMouseDown={() => !alreadyAdded && selectSuggestion(s)}
                          disabled={alreadyAdded}
                          className={cn(
                            "w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors",
                            alreadyAdded
                              ? "opacity-50 cursor-not-allowed bg-muted/30"
                              : "hover:bg-muted/60"
                          )}
                        >
                          <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            {alreadyAdded
                              ? <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                              : <Users className="h-3.5 w-3.5 text-primary" />
                            }
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium truncate">{s.name}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs text-muted-foreground truncate">{s.email}</span>
                              {s.matricula && (
                                <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
                                  {s.matricula}
                                </Badge>
                              )}
                            </div>
                          </div>
                          {alreadyAdded && (
                            <span className="text-[10px] text-muted-foreground shrink-0">Adicionado</span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Tipo de Acesso */}
            <div className="space-y-2">
              <p className="text-[13px] font-semibold text-foreground border-b border-primary/25 pb-1.5 flex items-center gap-2">
                <span className="w-1 h-[16px] rounded-full bg-primary/70 inline-block" />
                Tipo de Acesso
              </p>
              <div className="space-y-2">
                {permOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setPermission(opt.value)}
                    className={cn(
                      "w-full flex items-start gap-3 rounded-xl border px-4 py-3 text-left transition-all",
                      permission === opt.value
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-border hover:bg-muted/40"
                    )}
                  >
                    <div className={cn(
                      "mt-0.5 h-4 w-4 rounded-full border-2 shrink-0 flex items-center justify-center",
                      permission === opt.value ? "border-primary bg-primary" : "border-border"
                    )}>
                      {permission === opt.value && <span className="h-1.5 w-1.5 rounded-full bg-white block" />}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{opt.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{opt.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Mensagem */}
            <div className="space-y-2">
              <p className="text-[13px] font-semibold text-foreground border-b border-primary/25 pb-1.5 flex items-center gap-2">
                <span className="w-1 h-[16px] rounded-full bg-primary/70 inline-block" />
                Mensagem <span className="text-xs font-normal text-muted-foreground">(opcional)</span>
              </p>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Adicione uma mensagem personalizada..."
                rows={3}
                className="resize-none text-sm"
                maxLength={500}
              />
            </div>
          </div>

          <DialogFooter className="shrink-0 flex-col-reverse sm:flex-row sm:justify-end gap-2 border-t border-border/70 px-6 py-4 bg-muted/20">
            <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={!canSubmit}
              className="h-9 w-full rounded-[10px] sm:w-auto gap-2 font-semibold"
            >
              {submitting ? (
                <><Loader2 className="h-4 w-4 animate-spin" />Enviando...</>
              ) : (
                <>
                  <Share2 className="h-4 w-4" />
                  {recipients.length > 1
                    ? `Enviar ${recipients.length} Convites`
                    : 'Enviar Convite'}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
