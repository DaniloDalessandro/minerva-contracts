import { ColumnDef } from "@tanstack/react-table";
import { Colaborador } from "@/lib/api/colaboradores";
import { STATUS_FILTER_OPTIONS, getStatusLabel } from "@/constants/status";

export const columns: ColumnDef<Colaborador>[] = [
  {
    accessorKey: "full_name",
    header: "Nome",
    enableSorting: true,
    cell: ({ row }) => {
      const name = row.original.full_name;
      return <span>{name}</span>;
    },
    meta: {
      showFilterIcon: true,
    },
  },
  {
    accessorKey: "cpf",
    header: "CPF",
    enableSorting: true,
    cell: ({ row }) => {
      const cpf = row.original.cpf;
      return <span>{cpf}</span>;
    },
    meta: {
      showFilterIcon: true,
    },
  },
  {
    accessorKey: "phone",
    header: "Telefone",
    enableSorting: false,
    cell: ({ row }) => {
      const phone = row.original.phone;
      return <span>{phone || "-"}</span>;
    },
    meta: {
      showFilterIcon: true,
    },
  },
  {
    accessorKey: "direction",
    header: "Direção",
    enableSorting: false,
    cell: ({ row }) => {
      const directionName = row.original.direction?.name;
      return <span>{directionName || "-"}</span>;
    },
    meta: {
      showFilterIcon: true,
    },
  },
  {
    accessorKey: "management",
    header: "Gerência",
    enableSorting: false,
    cell: ({ row }) => {
      const managementName = row.original.management?.name;
      return <span>{managementName || "-"}</span>;
    },
    meta: {
      showFilterIcon: true,
    },
  },
  {
    accessorKey: "coordination",
    header: "Coordenação",
    enableSorting: false,
    cell: ({ row }) => {
      const coordinationName = row.original.coordination?.name;
      return <span>{coordinationName || "-"}</span>;
    },
    meta: {
      showFilterIcon: true,
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    enableSorting: true,
    cell: ({ row }) => {
      const status = row.original.status;
      return <span>{getStatusLabel(status)}</span>;
    },
    meta: {
      showFilterIcon: true,
      filterType: 'select',
      filterOptions: STATUS_FILTER_OPTIONS
    },
  },
  {
    accessorKey: "created_by",
    header: "Criado por",
    enableSorting: false,
    cell: ({ row }) => {
      const createdBy = row.original.created_by;
      if (!createdBy) return <span>-</span>;
      return <span>{createdBy.first_name || createdBy.email}</span>;
    },
  },
  {
    accessorKey: "created_at",
    header: "Data de Criação",
    enableSorting: true,
    cell: ({ row }) => {
      const date = row.original.created_at;
      if (!date) return <span>-</span>;
      return <span>{new Date(date).toLocaleDateString('pt-BR')}</span>;
    },
  },
  {
    accessorKey: "updated_by",
    header: "Atualizado por",
    enableSorting: false,
    cell: ({ row }) => {
      const updatedBy = row.original.updated_by;
      if (!updatedBy) return <span>-</span>;
      return <span>{updatedBy.first_name || updatedBy.email}</span>;
    },
  },
  {
    accessorKey: "updated_at",
    header: "Data de Atualização",
    enableSorting: true,
    cell: ({ row }) => {
      const date = row.original.updated_at;
      if (!date) return <span>-</span>;
      return <span>{new Date(date).toLocaleDateString('pt-BR')}</span>;
    },
  },
];