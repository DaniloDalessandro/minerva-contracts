import { ColumnDef } from "@tanstack/react-table";
import { ManagementCenter } from "@/lib/api/centers";
import { IS_ACTIVE_FILTER_OPTIONS } from "@/constants/status";

export const columns = (): ColumnDef<ManagementCenter>[] => [
  {
    accessorKey: "name",
    header: "Nome",
    enableSorting: true,
    meta: {
      showFilterIcon: true,
    },
  },
  {
    accessorKey: "is_active",
    header: "Status",
    enableSorting: false,
    cell: ({ row }) => {
      const isActive = row.original.is_active;
      return isActive ? "Ativo" : "Inativo";
    },
    meta: {
      showFilterIcon: true,
      filterType: "select",
      filterOptions: IS_ACTIVE_FILTER_OPTIONS,
    },
  },
  {
    accessorKey: "created_at",
    header: "Criado em",
    enableSorting: true,
    cell: ({ row }) =>
      new Date(row.original.created_at).toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).replace(",", ""),
  },
  {
    accessorKey: "updated_at",
    header: "Atualizado em",
    cell: ({ row }) =>
      new Date(row.original.updated_at).toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).replace(",", ""),
  },
  {
    accessorKey: "created_by",
    header: "Criado por",
    cell: ({ row }) => row.original.created_by?.email ?? "-",
  },
  {
    accessorKey: "updated_by",
    header: "Atualizado por",
    cell: ({ row }) => row.original.updated_by?.email ?? "-",
  },
];