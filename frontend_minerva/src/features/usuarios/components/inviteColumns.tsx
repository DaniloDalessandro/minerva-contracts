import { ColumnDef } from "@tanstack/react-table"
import { RefreshCw, X, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { type UserInvitation } from "@/lib/api/users"

const GROUP_LABELS: Record<string, string> = {
  PRESIDENTE: "Presidente",
  DIRETOR: "Diretor",
  GERENTE: "Gerente",
  COORDENADOR: "Coordenador",
  FUNCIONARIO: "Funcionário",
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pendente",
  ACCEPTED: "Aceito",
  EXPIRED: "Expirado",
  CANCELLED: "Cancelado",
}

const STATUS_CLASSES: Record<string, string> = {
  PENDING: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20",
  ACCEPTED: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20",
  EXPIRED: "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20",
  CANCELLED: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20",
}

const STATUS_FILTER_OPTIONS = [
  { value: "ALL", label: "Todos" },
  { value: "PENDING", label: "Pendente" },
  { value: "ACCEPTED", label: "Aceito" },
  { value: "EXPIRED", label: "Expirado" },
  { value: "CANCELLED", label: "Cancelado" },
]

const GROUP_FILTER_OPTIONS = [
  { value: "ALL", label: "Todos" },
  { value: "PRESIDENTE", label: "Presidente" },
  { value: "DIRETOR", label: "Diretor" },
  { value: "GERENTE", label: "Gerente" },
  { value: "COORDENADOR", label: "Coordenador" },
  { value: "FUNCIONARIO", label: "Funcionário" },
]

export interface InviteColumnHandlers {
  onResend: (invite: UserInvitation) => void
  onCancel: (invite: UserInvitation) => void
  resendingId: number | null
  cancellingId: number | null
}

export function makeInviteColumns(handlers: InviteColumnHandlers): ColumnDef<UserInvitation>[] {
  return [
    {
      accessorKey: "email",
      header: "E-mail",
      enableSorting: true,
      cell: ({ row }) => {
        const { email, invited_by_name } = row.original
        return (
          <div>
            <span className="font-medium">{email}</span>
            {invited_by_name && (
              <p className="text-xs text-muted-foreground">por {invited_by_name}</p>
            )}
          </div>
        )
      },
      meta: { showFilterIcon: true },
    },
    {
      accessorKey: "group",
      header: "Perfil",
      enableSorting: false,
      cell: ({ row }) => {
        const group = row.original.group
        return <span>{GROUP_LABELS[group] ?? group}</span>
      },
      meta: {
        showFilterIcon: true,
        filterType: "select",
        filterOptions: GROUP_FILTER_OPTIONS,
      },
    },
    {
      accessorKey: "created_at",
      header: "Enviado em",
      enableSorting: true,
      cell: ({ row }) => {
        const date = row.original.created_at
        if (!date) return <span>—</span>
        return (
          <span>
            {new Date(date).toLocaleString("pt-BR", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        )
      },
    },
    {
      accessorKey: "updated_at",
      header: "Atualizado em",
      enableSorting: true,
      enableHiding: true,
      cell: ({ row }) => {
        const date = row.original.updated_at
        if (!date) return <span>—</span>
        return (
          <span>
            {new Date(date).toLocaleString("pt-BR", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        )
      },
    },
    {
      accessorKey: "expires_at",
      header: "Expira em",
      enableSorting: false,
      cell: ({ row }) => {
        const { expires_at, is_expired, status } = row.original
        if (!expires_at) return <span>—</span>
        return (
          <span className={is_expired && status === "PENDING" ? "text-xs text-rose-500" : "text-xs"}>
            {new Date(expires_at).toLocaleDateString("pt-BR")}
          </span>
        )
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      enableSorting: false,
      cell: ({ row }) => {
        const status = row.original.status
        return (
          <span
            className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${STATUS_CLASSES[status] ?? ""}`}
          >
            {STATUS_LABELS[status] ?? status}
          </span>
        )
      },
      meta: {
        showFilterIcon: true,
        filterType: "select",
        filterOptions: STATUS_FILTER_OPTIONS,
      },
    },
    {
      id: "invite_actions",
      header: "",
      enableSorting: false,
      cell: ({ row }) => {
        const invite = row.original
        const isResending = handlers.resendingId === invite.id
        const isCancelling = handlers.cancellingId === invite.id
        const isProcessing = isResending || isCancelling

        return (
          <div className="flex items-center gap-1">
            {invite.status !== "ACCEPTED" && (
              <Button
                variant="ghost"
                size="icon-sm"
                disabled={isProcessing}
                onClick={(e) => { e.stopPropagation(); handlers.onResend(invite) }}
                title="Reenviar convite"
                className="h-7 w-7 rounded-md text-muted-foreground hover:text-foreground"
              >
                {isResending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="h-3.5 w-3.5" />
                )}
              </Button>
            )}
            {invite.status === "PENDING" && (
              <Button
                variant="ghost"
                size="icon-sm"
                disabled={isProcessing}
                onClick={(e) => { e.stopPropagation(); handlers.onCancel(invite) }}
                title="Cancelar convite"
                className="h-7 w-7 rounded-md text-muted-foreground hover:text-destructive"
              >
                {isCancelling ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <X className="h-3.5 w-3.5" />
                )}
              </Button>
            )}
          </div>
        )
      },
    },
  ]
}
