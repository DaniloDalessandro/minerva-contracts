import { ColumnDef } from "@tanstack/react-table";
import { BudgetLine } from "@/lib/api/budgetlines";
import { Badge } from "@/components/ui/badge";
import {
  BUDGET_LINE_STATUS_FILTER_OPTIONS,
  getBudgetLineStatusLabel,
  getContractTypeLabel,
  getProcurementTypeLabel,
} from "@/constants/status";

export const columns: ColumnDef<BudgetLine>[] = [
  // COLUNAS PRINCIPAIS
  {
    accessorKey: "budget.name",
    header: "Orçamento",
    enableSorting: true,
    cell: ({ row }) => {
      const isOptimistic = row.original.isOptimistic;
      const budgetName = row.original.budget?.name;

      if (isOptimistic && !budgetName) {
        return <span className="text-gray-400 italic">Carregando...</span>;
      }

      return budgetName || "-";
    },
    meta: {
      showFilterIcon: true,
    },
  },
  {
    accessorKey: "category",
    header: "Categoria",
    enableSorting: true,
    cell: ({ row }) => row.original.category,
    meta: {
      showFilterIcon: true,
    },
  },
  {
    accessorKey: "summary_description",
    header: "Descrição",
    enableSorting: false,
    cell: ({ row }) => {
      const description = row.original.summary_description;
      if (!description) return "-";

      return (
        <span className="max-w-xs truncate" title={description}>
          {description}
        </span>
      );
    },
  },
  {
    accessorKey: "budgeted_amount",
    header: "Valor Orçado",
    enableSorting: true,
    cell: ({ row }) => {
      const amount = parseFloat(row.original.budgeted_amount);
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(amount);
    },
  },

  // COLUNAS SECUNDÁRIAS - DISPONÍVEIS NA ENGRENAGEM
  {
    accessorKey: "management_center.name",
    header: "Centro Gestor",
    enableSorting: true,
    enableHiding: true,
    cell: ({ row }) => {
      const isOptimistic = row.original.isOptimistic;
      const centerName = row.original.management_center?.name;

      if (isOptimistic && !centerName) {
        return <span className="text-gray-400 italic">Carregando...</span>;
      }

      return centerName || "-";
    },
    meta: {
      showFilterIcon: true,
    },
  },
  {
    accessorKey: "requesting_center.name",
    header: "Centro Solicitante",
    enableSorting: true,
    enableHiding: true,
    cell: ({ row }) => {
      const isOptimistic = row.original.isOptimistic;
      const centerName = row.original.requesting_center?.name;

      if (isOptimistic && !centerName) {
        return <span className="text-gray-400 italic">Carregando...</span>;
      }

      return centerName || "-";
    },
    meta: {
      showFilterIcon: true,
    },
  },
  {
    accessorKey: "expense_type",
    header: "Tipo de Despesa",
    enableSorting: true,
    enableHiding: true,
    cell: ({ row }) => row.original.expense_type,
    meta: {
      showFilterIcon: true,
    },
  },
  {
    accessorKey: "contract_type",
    header: "Tipo de Contrato",
    enableSorting: true,
    enableHiding: true,
    cell: ({ row }) => {
      const contractType = row.original.contract_type;
      return getContractTypeLabel(contractType);
    },
    meta: {
      showFilterIcon: true,
    },
  },
  {
    accessorKey: "probable_procurement_type",
    header: "Tipo de Aquisição",
    enableSorting: true,
    enableHiding: true,
    cell: ({ row }) => {
      const procurementType = row.original.probable_procurement_type;
      return getProcurementTypeLabel(procurementType);
    },
    meta: {
      showFilterIcon: true,
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
      return "-";
    },
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
      return "-";
    },
  },

  // STATUS - ÚLTIMO CAMPO VISÍVEL
  {
    accessorKey: "status",
    header: "Status",
    enableSorting: true,
    cell: ({ row }) => {
      const isOptimistic = row.original.isOptimistic;
      const status = row.original.status;

      if (!status) return "-";

      return (
        <div className="flex items-center gap-2">
          {getBudgetLineStatusLabel(status)}
          {isOptimistic && (
            <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50">
              Salvando...
            </Badge>
          )}
        </div>
      );
    },
    meta: {
      showFilterIcon: true,
      filterType: 'select',
      filterOptions: BUDGET_LINE_STATUS_FILTER_OPTIONS,
    },
  },
];
