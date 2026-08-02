"use client"

import { useState, useEffect, useCallback } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Loader2, Trash2, ArrowUp, ArrowDown, Users, Share2, RefreshCw, Plus } from "lucide-react"
import { SharingService } from "@/services"
import { toast } from "@/hooks/use-toast"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import type { ResourceShare, ResourceType } from "@/lib/api/sharing"
import { cn } from "@/lib/utils"
import { ShareModal } from "./ShareModal"
import { useAuthContext } from "@/context/AuthContext"

const STATUS_BADGE: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "success" | "warning" }> = {
  PENDING: { label: 'Pendente', variant: 'warning' },
  ACCEPTED: { label: 'Aceito', variant: 'success' },
  REVOKED: { label: 'Revogado', variant: 'destructive' },
  EXPIRED: { label: 'Expirado', variant: 'secondary' },
}

const PERMISSION_BADGE: Record<string, string> = {
  VIEW: 'Visualização',
  CREATE_BUDGET_LINES: 'Cria Linhas',
  CREATE_CONTRACTS: 'Cria Contratos',
}

interface SharesTableProps {
  resourceType: ResourceType
  resourceLabel: string
}

export function SharesTable({ resourceType, resourceLabel }: SharesTableProps) {
  const { user } = useAuthContext()
  const [direction, setDirection] = useState<'given' | 'received'>('received')
  const [shares, setShares] = useState<ResourceShare[]>([])
  const [loading, setLoading] = useState(true)
  const [revoking, setRevoking] = useState<number | null>(null)
  const [toRevoke, setToRevoke] = useState<ResourceShare | null>(null)
  const [shareModal, setShareModal] = useState<{ resourceId?: number; resourceName?: string } | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await SharingService.fetchShares({ resource_type: resourceType, direction, page_size: 50 })
      setShares(data.results)
    } catch {
      toast({ title: 'Erro ao carregar compartilhamentos', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [resourceType, direction])

  useEffect(() => { load() }, [load])

  const handleRevoke = async () => {
    if (!toRevoke) return
    setRevoking(toRevoke.id)
    try {
      await SharingService.revokeShare(toRevoke.id)
      toast({ title: 'Compartilhamento revogado' })
      load()
    } catch (err: any) {
      toast({ title: 'Erro ao revogar', description: err.message, variant: 'destructive' })
    } finally {
      setRevoking(null)
      setToRevoke(null)
    }
  }

  const formatDate = (d: string) => {
    try {
      return formatDistanceToNow(new Date(d), { addSuffix: true, locale: ptBR })
    } catch { return '-' }
  }

  return (
    <div className="space-y-4">
      {/* Controles */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-1 rounded-xl border border-border p-1 bg-muted/30">
          <button
            onClick={() => setDirection('received')}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
              direction === 'received' ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <ArrowDown className="h-3.5 w-3.5" />
            Compartilhados comigo
          </button>
          <button
            onClick={() => setDirection('given')}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
              direction === 'given' ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <ArrowUp className="h-3.5 w-3.5" />
            Compartilhados por mim
          </button>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={cn("h-3.5 w-3.5 mr-1.5", loading && "animate-spin")} />
            Atualizar
          </Button>
          <Button size="sm" onClick={() => setShareModal({})}>
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Enviar Convite
          </Button>
        </div>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
        </div>
      ) : shares.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-14 text-muted-foreground">
          <Share2 className="h-10 w-10 opacity-25" />
          <p className="text-sm font-medium">
            {direction === 'received' ? `Nenhum ${resourceLabel.toLowerCase()} foi compartilhado com você` : `Você não compartilhou nenhum ${resourceLabel.toLowerCase()} ainda`}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {shares.map((share) => {
            const isOwner = share.owner === Number(user?.id)
            const statusInfo = STATUS_BADGE[share.status] || { label: share.status, variant: 'secondary' as const }

            return (
              <Card key={share.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div className="bg-primary/10 text-primary p-2 rounded-lg shrink-0 mt-0.5">
                        <Share2 className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-sm truncate">{share.resource_name}</p>
                        <div className="flex flex-wrap items-center gap-2 mt-1.5">
                          <Badge variant={statusInfo.variant as any} className="text-[11px] h-5">
                            {statusInfo.label}
                          </Badge>
                          <Badge variant="secondary" className="text-[11px] h-5">
                            {PERMISSION_BADGE[share.permission_type] || share.permission_label}
                          </Badge>
                        </div>
                        <div className="mt-2 text-xs text-muted-foreground flex flex-wrap gap-x-4 gap-y-0.5">
                          {isOwner ? (
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              Para: {share.invited_user_name || share.invited_email}
                            </span>
                          ) : (
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              De: {share.owner_name}
                            </span>
                          )}
                          <span>{formatDate(share.created_at)}</span>
                        </div>
                        {share.message && (
                          <p className="mt-1.5 text-xs text-muted-foreground italic">"{share.message}"</p>
                        )}
                      </div>
                    </div>

                    {isOwner && share.status !== 'REVOKED' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="shrink-0 text-muted-foreground hover:text-destructive"
                        disabled={revoking === share.id}
                        onClick={() => setToRevoke(share)}
                        title="Revogar acesso"
                      >
                        {revoking === share.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Confirmação de revogação */}
      <AlertDialog open={!!toRevoke} onOpenChange={(o) => !o && setToRevoke(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revogar compartilhamento</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja revogar o acesso de <strong>{toRevoke?.invited_email}</strong> ao {resourceLabel.toLowerCase()} <strong>"{toRevoke?.resource_name}"</strong>?
              O usuário perderá o acesso imediatamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleRevoke} className="bg-red-600 hover:bg-red-700">
              Revogar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {shareModal && (
        <ShareModal
          open={!!shareModal}
          onClose={() => setShareModal(null)}
          resourceType={resourceType}
          resourceId={shareModal.resourceId}
          resourceName={shareModal.resourceName}
          onSuccess={load}
        />
      )}

    </div>
  )
}
