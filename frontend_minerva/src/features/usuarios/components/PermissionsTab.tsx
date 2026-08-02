"use client"

import { useState, useEffect, useCallback } from "react"
import { Loader2, Save, ShieldCheck, ChevronRight, CheckSquare, Square } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { PermissionService } from "@/services"
import type { PermissionModule, GroupPermissions } from "@/lib/api/permissions"

const ACTIONS = ["view", "add", "change", "delete"] as const
const ACTION_LABELS: Record<string, string> = {
  view: "Visualizar",
  add: "Criar",
  change: "Editar",
  delete: "Excluir",
}

const GROUP_ORDER = ["PRESIDENTE", "DIRETOR", "GERENTE", "COORDENADOR", "ANALISTA", "FUNCIONARIO"]

export default function PermissionsTab() {
  const [modules, setModules] = useState<PermissionModule[]>([])
  const [groups, setGroups] = useState<GroupPermissions[]>([])
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null)
  const [pendingIds, setPendingIds] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [permRes, groupRes] = await Promise.all([PermissionService.fetchPermissions(), PermissionService.fetchGroups()])
      setModules(permRes.modules)
      const sorted = [...groupRes].sort(
        (a, b) => GROUP_ORDER.indexOf(a.name) - GROUP_ORDER.indexOf(b.name)
      )
      setGroups(sorted)
      if (sorted.length > 0 && selectedGroupId === null) {
        setSelectedGroupId(sorted[0].id)
        setPendingIds(new Set(sorted[0].permission_ids))
      }
    } catch {
      toast({ title: "Erro ao carregar permissões", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }, [selectedGroupId])

  useEffect(() => {
    load()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const selectGroup = (group: GroupPermissions) => {
    if (dirty) {
      // descarta alterações não salvas ao trocar de grupo
    }
    setSelectedGroupId(group.id)
    setPendingIds(new Set(group.permission_ids))
    setDirty(false)
  }

  const togglePerm = (id: number) => {
    setPendingIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
    setDirty(true)
  }

  const toggleModule = (mod: PermissionModule, check: boolean) => {
    const ids = mod.permissions.map((p) => p.id)
    setPendingIds((prev) => {
      const next = new Set(prev)
      ids.forEach((id) => (check ? next.add(id) : next.delete(id)))
      return next
    })
    setDirty(true)
  }

  const toggleAction = (action: string, check: boolean) => {
    const ids = modules
      .flatMap((m) => m.permissions)
      .filter((p) => p.action === action)
      .map((p) => p.id)
    setPendingIds((prev) => {
      const next = new Set(prev)
      ids.forEach((id) => (check ? next.add(id) : next.delete(id)))
      return next
    })
    setDirty(true)
  }

  const handleSave = async () => {
    if (!selectedGroupId) return
    setSaving(true)
    try {
      const updated = await PermissionService.updateGroupPermissions(selectedGroupId, Array.from(pendingIds))
      setGroups((prev) =>
        prev.map((g) => (g.id === updated.id ? { ...g, permission_ids: updated.permission_ids } : g))
      )
      setPendingIds(new Set(updated.permission_ids))
      setDirty(false)
      toast({ title: "Permissões salvas com sucesso!" })
    } catch (err: any) {
      toast({ title: "Erro ao salvar", description: err.message, variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const selectedGroup = groups.find((g) => g.id === selectedGroupId)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // calcula estado de cada coluna de ação
  const actionColState = (action: string) => {
    const allIds = modules
      .flatMap((m) => m.permissions)
      .filter((p) => p.action === action)
      .map((p) => p.id)
    const checkedCount = allIds.filter((id) => pendingIds.has(id)).length
    if (checkedCount === 0) return "none"
    if (checkedCount === allIds.length) return "all"
    return "partial"
  }

  return (
    <div className="flex gap-4 h-full min-h-[520px]">
      {/* ---- Painel esquerdo: grupos ---- */}
      <aside className="w-52 shrink-0 flex flex-col gap-1">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-1 mb-1">
          Perfis de acesso
        </p>
        {groups.map((group) => {
          const isSelected = group.id === selectedGroupId
          const savedIds = group.permission_ids
          const totalPerms = modules.flatMap((m) => m.permissions).length
          const count = savedIds.length
          return (
            <button
              key={group.id}
              onClick={() => selectGroup(group)}
              className={cn(
                "w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all duration-150 group",
                isSelected
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "hover:bg-muted text-foreground"
              )}
            >
              <div>
                <p className={cn("text-sm font-semibold leading-none", isSelected ? "text-primary-foreground" : "text-foreground")}>
                  {group.label}
                </p>
                <p className={cn("text-[11px] mt-1", isSelected ? "text-primary-foreground/70" : "text-muted-foreground")}>
                  {count} de {totalPerms} permissões
                </p>
              </div>
              <ChevronRight className={cn("w-4 h-4 shrink-0 transition-transform", isSelected ? "text-primary-foreground rotate-90" : "text-muted-foreground group-hover:translate-x-0.5")} />
            </button>
          )
        })}
      </aside>

      {/* ---- Painel direito: matriz de permissões ---- */}
      <div className="flex-1 flex flex-col min-w-0">
        {selectedGroup && (
          <>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-primary" />
                <span className="font-semibold text-[15px]">{selectedGroup.label}</span>
                {dirty && (
                  <span className="text-[11px] bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-2 py-0.5 rounded-full font-medium">
                    Alterações não salvas
                  </span>
                )}
              </div>
              <Button
                onClick={handleSave}
                disabled={saving || !dirty}
                className="h-8 gap-1.5 text-sm font-semibold rounded-lg"
              >
                {saving ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                {saving ? "Salvando..." : "Salvar alterações"}
              </Button>
            </div>

            <div className="rounded-xl border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/60 border-b border-border">
                    <th className="text-left px-4 py-2.5 font-semibold text-foreground w-[40%]">
                      Módulo
                    </th>
                    {ACTIONS.map((action) => {
                      const state = actionColState(action)
                      const isAll = state === "all"
                      const isPartial = state === "partial"
                      return (
                        <th key={action} className="text-center px-3 py-2.5 font-semibold text-foreground">
                          <button
                            type="button"
                            onClick={() => toggleAction(action, !isAll)}
                            className="flex flex-col items-center gap-1 mx-auto hover:text-primary transition-colors group"
                            title={`${isAll ? "Desmarcar" : "Marcar"} todos: ${ACTION_LABELS[action]}`}
                          >
                            <span className="text-xs">{ACTION_LABELS[action]}</span>
                            <span className={cn(
                              "w-4 h-4 rounded border-2 flex items-center justify-center transition-all",
                              isAll
                                ? "border-primary bg-primary"
                                : isPartial
                                  ? "border-primary bg-primary/20"
                                  : "border-border bg-background group-hover:border-primary/50"
                            )}>
                              {isAll && <span className="w-2 h-2 bg-white rounded-sm block" />}
                              {isPartial && <span className="w-2 h-0.5 bg-primary block" />}
                            </span>
                          </button>
                        </th>
                      )
                    })}
                  </tr>
                </thead>
                <tbody>
                  {modules.map((mod, i) => {
                    const modPermIds = mod.permissions.map((p) => p.id)
                    const checkedInMod = modPermIds.filter((id) => pendingIds.has(id)).length
                    const allChecked = checkedInMod === modPermIds.length
                    const someChecked = checkedInMod > 0 && !allChecked

                    return (
                      <tr
                        key={`${mod.app_label}.${mod.model}`}
                        className={cn(
                          "border-b border-border/60 last:border-0 transition-colors",
                          i % 2 === 0 ? "bg-background" : "bg-muted/20"
                        )}
                      >
                        {/* Nome do módulo + toggle all */}
                        <td className="px-4 py-2.5">
                          <button
                            type="button"
                            onClick={() => toggleModule(mod, !allChecked)}
                            className="flex items-center gap-2 text-left hover:text-primary transition-colors group"
                          >
                            <span className={cn(
                              "w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-all",
                              allChecked
                                ? "border-primary bg-primary"
                                : someChecked
                                  ? "border-primary bg-primary/20"
                                  : "border-border bg-background group-hover:border-primary/50"
                            )}>
                              {allChecked && <span className="w-2 h-2 bg-white rounded-sm block" />}
                              {someChecked && <span className="w-2 h-0.5 bg-primary block" />}
                            </span>
                            <span className="font-medium text-[13px]">{mod.label}</span>
                          </button>
                        </td>

                        {/* Checkboxes por ação */}
                        {ACTIONS.map((action) => {
                          const perm = mod.permissions.find((p) => p.action === action)
                          const checked = perm ? pendingIds.has(perm.id) : false
                          return (
                            <td key={action} className="text-center px-3 py-2.5">
                              {perm ? (
                                <button
                                  type="button"
                                  onClick={() => togglePerm(perm.id)}
                                  className="mx-auto flex items-center justify-center"
                                  title={`${ACTION_LABELS[action]} - ${mod.label}`}
                                >
                                  {checked ? (
                                    <CheckSquare className="w-4 h-4 text-primary" />
                                  ) : (
                                    <Square className="w-4 h-4 text-border hover:text-primary/50 transition-colors" />
                                  )}
                                </button>
                              ) : (
                                <span className="w-4 h-0.5 bg-border/40 rounded block mx-auto" />
                              )}
                            </td>
                          )
                        })}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <p className="text-[11px] text-muted-foreground mt-2">
              Clique no nome de um módulo ou na ação do cabeçalho para selecionar/desselecionar em bloco.
              Alterações só são aplicadas ao clicar em <strong>Salvar alterações</strong>.
            </p>
          </>
        )}
      </div>
    </div>
  )
}
