import { ColumnDef } from "@tanstack/react-table";
import { Auxilio } from "@/lib/api/auxilios";
import {
  AUXILIO_STATUS_FILTER_OPTIONS,
  getAuxilioStatusLabel,
  getAuxilioTypeLabel,
} from "@/constants/status";

export const columns: ColumnDef<Auxilio>[] = [
  // COLUNAS PRINCIPAIS
  {
    accessorKey: "employee.full_name",
    header: "Colaborador",
    enableSorting: true,
    cell: ({ row }) => {
      const employeeName = row.original.employee?.full_name;
      return <span>{employeeName || "-"}</span>;
    },
    meta: {
      showFilterIcon: true,
    },
  },
  {
    accessorKey: "type",
    header: "Tipo",
    enableSorting: true,
    cell: ({ row }) => {
      const type = row.original.type;
      return <span>{getAuxilioTypeLabel(type)}</span>;
    },
    meta: {
      showFilterIcon: true,
    },
  },
  {
    accessorKey: "total_amount",
    header: "Valor Total",
    enableSorting: true,
    cell: ({ row }) => {
      const totalAmount = row.original.total_amount;
      return (
        <span>
          R$ {parseFloat(totalAmount).toLocaleString("pt-BR", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </span>
      );
    },
  },

  // COLUNAS SECUNDÁRIAS - DISPONÍVEIS NA ENGRENAGEM
  {
    accessorKey: "id",
    header: "ID",
    enableSorting: true,
    enableHiding: true,
    cell: ({ row }) => {
      const id = row.original.id;
      return <span>#{id}</span>;
    },
    meta: {
      showFilterIcon: true,
    },
  },
  {
    accessorKey: "installment_count",
    header: "Parcelas",
    enableSorting: true,
    enableHiding: true,
    cell: ({ row }) => {
      const installmentCount = row.original.installment_count;
      return <span>{installmentCount}x</span>;
    },
  },
  {
    accessorKey: "amount_per_installment",
    header: "Valor por Parcela",
    enableSorting: true,
    enableHiding: true,
    cell: ({ row }) => {
      const amountPerInstallment = row.original.amount_per_installment;
      return (
        <span>
          R$ {parseFloat(amountPerInstallment).toLocaleString("pt-BR", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </span>
      );
    },
  },
  {
    accessorKey: "start_date",
    header: "Data Início",
    enableSorting: true,
    enableHiding: true,
    cell: ({ row }) => {
      const startDate = row.original.start_date;
      if (!startDate) return <span>-</span>;
      return (
        <span>
          {new Date(startDate).toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          })}
        </span>
      );
    },
  },
  {
    accessorKey: "end_date",
    header: "Data Fim",
    enableSorting: true,
    enableHiding: true,
    cell: ({ row }) => {
      const endDate = row.original.end_date;
      if (!endDate) return <span>-</span>;
      return (
        <span>
          {new Date(endDate).toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          })}
        </span>
      );
    },
  },
  {
    accessorKey: "budget_line.name",
    header: "Linha Orçamentária",
    enableSorting: false,
    enableHiding: true,
    cell: ({ row }) => {
      const budgetLineName = row.original.budget_line?.name;
      return <span>{budgetLineName || "-"}</span>;
    },
  },
  {
    accessorKey: "notes",
    header: "Observações",
    enableSorting: false,
    enableHiding: true,
    cell: ({ row }) => {
      const notes = row.original.notes;
      if (!notes) return <span>-</span>;
      return (
        <span className="max-w-xs truncate" title={notes}>
          {notes}
        </span>
      );
    },
  },
  {
    accessorKey: "created_at",
    header: "Criado em",
    enableSorting: true,
    enableHiding: true,
    cell: ({ row }) => (
      <span>
        {new Date(row.original.created_at).toLocaleString("pt-BR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }).replace(",", "")}
      </span>
    ),
  },
  {
    accessorKey: "created_by",
    header: "Criado por",
    enableSorting: false,
    enableHiding: true,
    cell: ({ row }) => {
      const createdBy = row.original.created_by;
      if (createdBy) {
        return (
          <span>
            {createdBy.first_name && createdBy.last_name
              ? `${createdBy.first_name} ${createdBy.last_name}`
              : createdBy.email}
          </span>
        );
      }
      return <span>-</span>;
    },
  },

  // STATUS - ÚLTIMO CAMPO VISÍVEL
  {
    accessorKey: "status",
    header: "Status",
    enableSorting: true,
    cell: ({ row }) => {
      const status = row.original.status;
      return <span>{getAuxilioStatusLabel(status)}</span>;
    },
    meta: {
      showFilterIcon: true,
      filterType: 'select',
      filterOptions: AUXILIO_STATUS_FILTER_OPTIONS,
    },
  },
];
