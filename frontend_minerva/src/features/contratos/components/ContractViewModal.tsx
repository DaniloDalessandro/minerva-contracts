"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Budget, Contract, fetchBudgetContracts } from "@/lib/api/budgets";
import { Loader } from "@/components/ui/loader";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ContractViewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  budget: Budget | null;
}

export default function ContractViewModal({
  open,
  onOpenChange,
  budget,
}: ContractViewModalProps) {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(false);

  const loadContracts = useCallback(async () => {
    if (!budget) return;
    
    setLoading(true);
    try {
      const contractsData = await fetchBudgetContracts(budget.id);
      setContracts(contractsData);
    } catch (error) {
      console.error("Erro ao carregar contratos:", error);
      setContracts([]);
    } finally {
      setLoading(false);
    }
  }, [budget]);

  useEffect(() => {
    if (open && budget) {
      loadContracts();
    }
  }, [open, budget, loadContracts]);

  const formatCurrency = (value: string) => {
    const amount = parseFloat(value);
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("pt-BR");
  };

  const getBudgetTitle = () => {
    if (!budget) return "";
    return `${budget.category} ${budget.year} - ${budget.management_center?.name}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            Contratos do Orçamento: {getBudgetTitle()}
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4">
          {budget && (
            <div className="flex flex-wrap gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-600">Valor Total</span>
                <span className="text-lg font-semibold text-gray-900">
                  {formatCurrency(budget.total_amount)}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-600">Valor Disponível</span>
                <span className="text-lg font-semibold text-green-600">
                  {formatCurrency(budget.available_amount)}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-600">Valor Utilizado</span>
                <span className="text-lg font-semibold text-blue-600">
                  {formatCurrency((parseFloat(budget.total_amount) - parseFloat(budget.available_amount)).toString())}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-600">Status</span>
                <Badge variant={budget.status === 'ATIVO' ? 'default' : 'secondary'}>
                  {budget.status}
                </Badge>
              </div>
            </div>
          )}

          <Separator className="mb-4" />

          {loading ? (
            <div className="flex justify-center items-center py-8">
              <Loader />
              <span className="ml-2">Carregando contratos...</span>
            </div>
          ) : contracts.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 text-lg">
                Nenhum contrato encontrado para este orçamento.
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[60vh]">
              <div className="space-y-4">
                {contracts.map((contract) => (
                  <Card key={contract.id} className="border border-gray-200">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg font-semibold text-gray-900">
                          {contract.protocol_number}
                        </CardTitle>
                        <Badge variant={contract.status === 'ATIVO' ? 'default' : 'secondary'}>
                          {contract.status}
                        </Badge>
                      </div>
                      <p className="text-gray-600">{contract.description}</p>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <h4 className="font-medium text-sm text-gray-700 uppercase tracking-wider">
                            Valores
                          </h4>
                          <div className="space-y-1">
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Valor Original:</span>
                              <span className="text-sm font-medium">
                                {formatCurrency(contract.original_value)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Valor Atual:</span>
                              <span className="text-sm font-medium">
                                {formatCurrency(contract.current_value)}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <h4 className="font-medium text-sm text-gray-700 uppercase tracking-wider">
                            Datas
                          </h4>
                          <div className="space-y-1">
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Início:</span>
                              <span className="text-sm font-medium">
                                {formatDate(contract.start_date)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Término:</span>
                              <span className="text-sm font-medium">
                                {formatDate(contract.end_date)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Assinatura:</span>
                              <span className="text-sm font-medium">
                                {formatDate(contract.signing_date)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Expiração:</span>
                              <span className="text-sm font-medium">
                                {formatDate(contract.expiration_date)}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <h4 className="font-medium text-sm text-gray-700 uppercase tracking-wider">
                            Fiscalização
                          </h4>
                          <div className="space-y-1">
                            <div>
                              <span className="text-sm text-gray-600">Fiscal Principal:</span>
                              <p className="text-sm font-medium">
                                {contract.main_inspector?.name}
                              </p>
                            </div>
                            <div>
                              <span className="text-sm text-gray-600">Fiscal Substituto:</span>
                              <p className="text-sm font-medium">
                                {contract.substitute_inspector?.name}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2 md:col-span-2 lg:col-span-1">
                          <h4 className="font-medium text-sm text-gray-700 uppercase tracking-wider">
                            Detalhes
                          </h4>
                          <div className="space-y-1">
                            <div>
                              <span className="text-sm text-gray-600">Natureza do Pagamento:</span>
                              <p className="text-sm font-medium">
                                {contract.payment_nature}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}