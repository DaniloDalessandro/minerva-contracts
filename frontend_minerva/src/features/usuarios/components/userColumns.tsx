import { ColumnDef } from "@tanstack/react-table"
import { Crown } from "lucide-react"
import { type AdminUser } from "@/lib/api/users"
import { IS_ACTIVE_FILTER_OPTIONS } from "@/constants/status"
import { AvatarDisplay } from "@/components/ui/AvatarPicker"

const GROUP_LABELS: Record<string, string> = {
  PRESIDENTE: "Presidente",
  DIRETOR: "Diretor",
  GERENTE: "Gerente",
  COORDENADOR: "Coordenador",
  FUNCIONARIO: "Funcionário",
}

const GROUP_FILTER_OPTIONS = [
  { value: "ALL", label: "Todos" },
  { value: "PRESIDENTE", label: "Presidente" },
  { value: "DIRETOR", label: "Diretor" },
  { value: "GERENTE", label: "Gerente" },
  { value: "COORDENADOR", label: "Coordenador" },
  { value: "FUNCIONARIO", label: "Funcionário" },
]

export const userColumns: ColumnDef<AdminUser>[] = [
  {
    accessorKey: "name",
    header: "Nome",
    enableSorting: true,
    cell: ({ row }) => {
      const { name, is_superuser, avatar } = row.original
      return (
        <span className="flex items-center gap-2">
          <AvatarDisplay avatarId={avatar || "av_1"} size={28} />
          <span className="flex items-center gap-1.5">
            {name}
            {is_superuser && (
              <Crown className="h-3.5 w-3.5 shrink-0 text-amber-500" aria-label="Administrador" />
            )}
          </span>
        </span>
      )
    },
    meta: { showFilterIcon: true },
  },
  {
    accessorKey: "email",
    header: "E-mail",
    enableSorting: true,
    cell: ({ row }) => <span>{row.original.email}</span>,
    meta: { showFilterIcon: true },
  },
  {
    accessorKey: "groups",
    header: "Perfil",
    enableSorting: false,
    cell: ({ row }) => {
      const group = row.original.groups[0]
      return <span>{group ? (GROUP_LABELS[group] ?? group) : "—"}</span>
    },
    meta: {
      showFilterIcon: true,
      filterType: "select",
      filterOptions: GROUP_FILTER_OPTIONS,
    },
  },
  {
    accessorKey: "is_active",
    header: "Status",
    enableSorting: false,
    cell: ({ row }) => {
      const active = row.original.is_active
      return <span>{active ? "Ativo" : "Inativo"}</span>
    },
    meta: {
      showFilterIcon: true,
      filterType: "select",
      filterOptions: IS_ACTIVE_FILTER_OPTIONS,
    },
  },
  {
    accessorKey: "last_login",
    header: "Último acesso",
    enableSorting: true,
    enableHiding: true,
    cell: ({ row }) => {
      const date = row.original.last_login
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
    accessorKey: "date_joined",
    header: "Cadastrado em",
    enableSorting: true,
    enableHiding: true,
    cell: ({ row }) => {
      const date = row.original.date_joined
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
    meta: { hiddenByDefault: true },
  },
]
