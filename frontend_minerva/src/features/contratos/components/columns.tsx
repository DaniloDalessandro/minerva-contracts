import { ColumnDef } from "@tanstack/react-table";
import { Contract } from "@/lib/api/contratos";
import {
  CONTRACT_STATUS_FILTER_OPTIONS,
  getContractStatusLabel,
  getPaymentNatureLabel,
} from "@/constants/status";

export const columns: ColumnDef<Contract>[] = [
  // COLUNAS PRINCIPAIS
  {
    accessorKey: "protocol_number",
    header: "Protocolo",
    enableSorting: true,
    cell: ({ row }) => {
      const isOptimistic = row.original.isOptimistic;
      const protocolNumber = row.original.protocol_number;

      if (isOptimistic && protocolNumber === 'Aguardando...') {
        return <span className="text-gray-400 italic">Gerando...</span>;
      }

      return <span>{protocolNumber}</span>;
    },
    meta: {
      showFilterIcon: true,
    },
  },
  {
    accessorKey: "main_inspector.full_name",
    header: "Fiscal Principal",
    enableSorting: true,
    cell: ({ row }) => {
      const isOptimistic = row.original.isOptimistic;
      const inspectorName = row.original.main_inspector?.full_name;

      if (isOptimistic && !inspectorName) {
        return <span className="text-gray-400 italic">Carregando...</span>;
      }

      return <span>{inspectorName || "-"}</span>;
    },
    meta: {
      showFilterIcon: true,
    },
  },
  {
    accessorKey: "payment_nature",
    header: "Natureza Pagamento",
    enableSorting: true,
    cell: ({ row }) => {
      const paymentNature = row.original.payment_nature;
      return <span>{getPaymentNatureLabel(paymentNature)}</span>;
    },
    meta: {
      showFilterIcon: true,
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
    accessorKey: "substitute_inspector.full_name",
    header: "Fiscal Substituto",
    enableSorting: true,
    enableHiding: true,
    cell: ({ row }) => {
      const isOptimistic = row.original.isOptimistic;
      const inspectorName = row.original.substitute_inspector?.full_name;

      if (isOptimistic && !inspectorName) {
        return <span className="text-gray-400 italic">Carregando...</span>;
      }

      return <span>{inspectorName || "-"}</span>;
    },
    meta: {
      showFilterIcon: true,
    },
  },
  {
    accessorKey: "original_value",
    header: "Valor Original",
    enableSorting: true,
    enableHiding: true,
    cell: ({ row }) => {
      const originalValue = row.original.original_value;
      return (
        <span>
          R$ {parseFloat(originalValue).toLocaleString("pt-BR", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </span>
      );
    },
  },
  {
    accessorKey: "current_value",
    header: "Valor Atual",
    enableSorting: true,
    enableHiding: true,
    cell: ({ row }) => {
      const originalValue = parseFloat(row.original.original_value);
      const currentValue = parseFloat(row.original.current_value);
      const hasChanged = originalValue !== currentValue;

      return (
        <div className="flex flex-col">
          <span>
            R$ {currentValue.toLocaleString("pt-BR", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
          {hasChanged && (
            <span className="text-xs text-gray-500">
              {currentValue > originalValue ? 'Acréscimo' : 'Redução'}
            </span>
          )}
        </div>
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
    accessorKey: "expiration_date",
    header: "Vencimento",
    enableSorting: true,
    enableHiding: true,
    cell: ({ row }) => {
      const expirationDate = row.original.expiration_date;
      if (!expirationDate) return <span>-</span>;

      return (
        <span>
          {new Date(expirationDate).toLocaleDateString("pt-BR", {
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
      const isOptimistic = row.original.isOptimistic;
      const budgetLineName = row.original.budget_line?.name;

      if (isOptimistic && !budgetLineName) {
        return <span className="text-gray-400 italic">Carregando...</span>;
      }

      return <span>{budgetLineName || "-"}</span>;
    },
  },
  {
    accessorKey: "description",
    header: "Descrição",
    enableSorting: false,
    enableHiding: true,
    cell: ({ row }) => {
      const description = row.original.description;
      if (!description) return <span>-</span>;

      return (
        <span className="max-w-xs truncate" title={description}>
          {description}
        </span>
      );
    },
  },
  {
    accessorKey: "signing_date",
    header: "Data Assinatura",
    enableSorting: true,
    enableHiding: true,
    cell: ({ row }) => {
      const signingDate = row.original.signing_date;
      if (!signingDate) return <span>-</span>;

      return (
        <span>
          {new Date(signingDate).toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          })}
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
      const isOptimistic = row.original.isOptimistic;
      const status = row.original.status;

      return (
        <span>
          {getContractStatusLabel(status)}
          {isOptimistic && <span className="text-gray-400 italic"> (Salvando...)</span>}
        </span>
      );
    },
    meta: {
      showFilterIcon: true,
      filterType: 'select',
      filterOptions: CONTRACT_STATUS_FILTER_OPTIONS,
    },
  },
];
