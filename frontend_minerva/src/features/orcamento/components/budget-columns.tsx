import { ColumnDef } from "@tanstack/react-table";
import { Budget } from "@/lib/api/budgets";
import { Badge } from "@/components/ui/badge";

export const columns: ColumnDef<Budget>[] = [
  {
    accessorKey: "year",
    header: "Ano",
    enableSorting: true,
    meta: {
      showFilterIcon: true,
    },
  },
  {
    accessorKey: "management_center",
    header: "Centro Gestor",
    enableSorting: true,
    cell: ({ row }) => {
      const isOptimistic = row.original.isOptimistic;
      const centerName = row.original.management_center?.name;

      if (isOptimistic && !centerName) {
        return <span className="text-muted-foreground italic">Carregando...</span>;
      }

      return centerName ?? "-";
    },
    meta: {
      showFilterIcon: true,
    },
  },
  {
    accessorKey: "category",
    header: "Categoria",
    cell: ({ row }) => row.original.category,
    meta: {
      showFilterIcon: true,
    },
  },
  {
    accessorKey: "total_amount",
    header: "Valor Total",
    cell: ({ row }) => {
      const amount = parseFloat(row.original.total_amount);
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(amount);
    },
  },
  {
    accessorKey: "available_amount",
    header: "Valor Disponível",
    cell: ({ row }) => {
      const amount = parseFloat(row.original.available_amount);
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(amount);
    },
  },
  {
    id: "used_amount",
    header: "Valor Utilizado",
    cell: ({ row }) => {
      const total = parseFloat(row.original.total_amount);
      const available = parseFloat(row.original.available_amount);
      const used = total - available;
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(used);
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const isOptimistic = row.original.isOptimistic;
      return (
        <div className="flex items-center gap-2">
          {row.original.status}
          {isOptimistic && (
            <Badge variant="outline" className="text-primary border-primary/30 bg-primary/5">
              Salvando...
            </Badge>
          )}
        </div>
      );
    },
    meta: {
      showFilterIcon: true,
    },
  },
  {
    accessorKey: "created_by",
    header: "Criado por",
    enableSorting: false,
    enableHiding: true,
    cell: ({ row }) => {
      const createdBy = row.original.created_by;
      if (createdBy) {
        return createdBy.first_name && createdBy.last_name
          ? `${createdBy.first_name} ${createdBy.last_name}`
          : createdBy.email;
      }
      return "N/A";
    },
  },
  {
    accessorKey: "created_at",
    header: "Criado em",
    enableSorting: true,
    enableHiding: true,
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
    accessorKey: "updated_by",
    header: "Atualizado por",
    enableSorting: false,
    enableHiding: true,
    cell: ({ row }) => {
      const updatedBy = row.original.updated_by;
      if (updatedBy) {
        return updatedBy.first_name && updatedBy.last_name
          ? `${updatedBy.first_name} ${updatedBy.last_name}`
          : updatedBy.email;
      }
      return "N/A";
    },
  },
  {
    accessorKey: "updated_at",
    header: "Atualizado em",
    enableSorting: true,
    enableHiding: true,
    cell: ({ row }) =>
      new Date(row.original.updated_at).toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).replace(",", ""),
  },
];
