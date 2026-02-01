"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { fetchContractById, Contract } from "@/lib/api/contratos";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Edit, Calendar, DollarSign, User, FileText, AlertTriangle, Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function ContractDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadContractDetails();
    }
  }, [id]);

  const loadContractDetails = async () => {
    try {
      setLoading(true);
      const contractData = await fetchContractById(parseInt(id));
      setContract(contractData);
    } catch (error) {
      console.error("Erro ao carregar detalhes do contrato:", error);
      setError("Erro ao carregar os detalhes do contrato");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    // Store the contract ID in session storage to trigger edit mode
    window.sessionStorage.setItem('editContractId', id);
    router.push('/contratos');
  };

  const getPaymentNatureLabel = (nature: string) => {
    switch (nature) {
      case 'PAGAMENTO ÚNICO':
        return 'Pagamento Único';
      case 'PAGAMENTO ANUAL':
        return 'Pagamento Anual';
      case 'PAGAMENTO SEMANAL':
        return 'Pagamento Semanal';
      case 'PAGAMENTO MENSAL':
        return 'Pagamento Mensal';
      case 'PAGAMENTO QUINZENAL':
        return 'Pagamento Quinzenal';
      case 'PAGAMENTO TRIMESTRAL':
        return 'Pagamento Trimestral';
      case 'PAGAMENTO SEMESTRAL':
        return 'Pagamento Semestral';
      case 'PAGAMENTO SOB DEMANDA':
        return 'Pagamento Sob Demanda';
      default:
        return nature;
    }
  };

  const getPaymentNatureVariant = (nature: string) => {
    switch (nature) {
      case 'PAGAMENTO ÚNICO':
        return 'default';
      case 'PAGAMENTO MENSAL':
        return 'secondary';
      case 'PAGAMENTO ANUAL':
        return 'outline';
      case 'PAGAMENTO TRIMESTRAL':
      case 'PAGAMENTO SEMESTRAL':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ATIVO':
        return 'Ativo';
      case 'ENCERRADO':
        return 'Encerrado';
      default:
        return status;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'ATIVO':
        return 'default';
      case 'ENCERRADO':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  const checkExpirationStatus = (expirationDate?: string) => {
    if (!expirationDate) return { isExpiring: false, isExpired: false, daysDiff: 0 };
    
    const expDate = new Date(expirationDate);
    const today = new Date();
    const daysDiff = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
    const isExpiring = daysDiff <= 30 && daysDiff >= 0;
    const isExpired = daysDiff < 0;
    
    return { isExpiring, isExpired, daysDiff };
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6 px-4">
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10" />
            <Skeleton className="h-8 w-48" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Skeleton className="h-48" />
            <Skeleton className="h-48" />
            <Skeleton className="h-48" />
            <Skeleton className="h-48" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !contract) {
    return (
      <div className="container mx-auto py-6 px-4">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-red-600">Erro</h1>
          <p className="text-gray-600">{error || "Contrato não encontrado"}</p>
          <Button onClick={() => router.push('/contratos')} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para Contratos
          </Button>
        </div>
      </div>
    );
  }

  const originalValue = parseFloat(contract.original_value);
  const currentValue = parseFloat(contract.current_value);
  const hasValueChanged = originalValue !== currentValue;
  const expirationStatus = checkExpirationStatus(contract.expiration_date);

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => router.push('/contratos')}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Contrato #{contract.protocol_number}</h1>
              <p className="text-gray-600">
                Fiscal: {contract.main_inspector?.full_name}
              </p>
            </div>
          </div>
          <Button onClick={handleEdit}>
            <Edit className="w-4 h-4 mr-2" />
            Editar
          </Button>
        </div>

        {/* Expiration Warning */}
        {(expirationStatus.isExpiring || expirationStatus.isExpired) && (
          <Card className={`border-l-4 ${expirationStatus.isExpired ? 'border-l-red-500 bg-red-50' : 'border-l-yellow-500 bg-yellow-50'}`}>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className={`w-5 h-5 ${expirationStatus.isExpired ? 'text-red-500' : 'text-yellow-500'}`} />
                <span className={`font-semibold ${expirationStatus.isExpired ? 'text-red-700' : 'text-yellow-700'}`}>
                  {expirationStatus.isExpired 
                    ? `Contrato vencido há ${Math.abs(expirationStatus.daysDiff)} dias` 
                    : `Contrato vence em ${expirationStatus.daysDiff} dias`}
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Protocolo e Status */}
          <Card>
            <CardHeader>
              <CardTitle>Identificação</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-2">Número do Protocolo</p>
                <p className="font-mono font-bold text-blue-600 text-lg">
                  {contract.protocol_number}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-2">Status</p>
                <Badge variant={getStatusVariant(contract.status)} className="text-sm">
                  {getStatusLabel(contract.status)}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Fiscais */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Fiscalização
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Fiscal Principal</p>
                <p className="font-medium">{contract.main_inspector?.full_name}</p>
                {contract.main_inspector?.employee_id && (
                  <p className="text-sm text-gray-500">
                    Matrícula: {contract.main_inspector.employee_id}
                  </p>
                )}
              </div>
              <div>
                <p className="text-sm text-gray-600">Fiscal Substituto</p>
                <p className="font-medium">{contract.substitute_inspector?.full_name}</p>
                {contract.substitute_inspector?.employee_id && (
                  <p className="text-sm text-gray-500">
                    Matrícula: {contract.substitute_inspector.employee_id}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Natureza do Pagamento */}
          <Card>
            <CardHeader>
              <CardTitle>Natureza do Pagamento</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant={getPaymentNatureVariant(contract.payment_nature)} className="text-sm">
                {getPaymentNatureLabel(contract.payment_nature)}
              </Badge>
            </CardContent>
          </Card>

          {/* Valores */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Valores
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Valor Original</p>
                <p className="font-semibold text-green-600 text-lg">
                  R$ {originalValue.toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Valor Atual</p>
                <p className={`font-semibold text-lg ${hasValueChanged ? 'text-blue-600' : 'text-green-600'}`}>
                  R$ {currentValue.toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
                {hasValueChanged && (
                  <p className="text-sm text-gray-500">
                    {currentValue > originalValue 
                      ? `↗️ Acréscimo de R$ ${(currentValue - originalValue).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` 
                      : `↘️ Redução de R$ ${(originalValue - currentValue).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Datas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Período do Contrato
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Data de Início</p>
                <p className="font-medium">
                  {new Date(contract.start_date).toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  })}
                </p>
              </div>
              {contract.end_date && (
                <div>
                  <p className="text-sm text-gray-600">Data de Fim</p>
                  <p className="font-medium">
                    {new Date(contract.end_date).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Datas Administrativas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Datas Administrativas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {contract.signing_date && (
                <div>
                  <p className="text-sm text-gray-600">Data de Assinatura</p>
                  <p className="font-medium">
                    {new Date(contract.signing_date).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })}
                  </p>
                </div>
              )}
              {contract.expiration_date && (
                <div>
                  <p className="text-sm text-gray-600">Data de Vencimento</p>
                  <div className="flex items-center gap-2">
                    <p className={`font-medium ${expirationStatus.isExpired ? 'text-red-600' : expirationStatus.isExpiring ? 'text-yellow-600' : ''}`}>
                      {new Date(contract.expiration_date).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })}
                    </p>
                    {(expirationStatus.isExpiring || expirationStatus.isExpired) && (
                      <AlertTriangle className={`w-4 h-4 ${expirationStatus.isExpired ? 'text-red-500' : 'text-yellow-500'}`} />
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Linha Orçamentária */}
          <Card>
            <CardHeader>
              <CardTitle>Linha Orçamentária</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-medium">{contract.budget_line?.name || "Não informado"}</p>
            </CardContent>
          </Card>

          {/* Descrição */}
          {contract.description && (
            <Card className="md:col-span-2 lg:col-span-3">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Descrição do Contrato
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {contract.description}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Auditoria */}
          <Card className={contract.description ? "md:col-span-2 lg:col-span-3" : "md:col-span-2 lg:col-span-1"}>
            <CardHeader>
              <CardTitle>Informações de Auditoria</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Criado em</p>
                <p className="font-medium">
                  {new Date(contract.created_at).toLocaleString("pt-BR", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  }).replace(",", "")}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Criado por</p>
                <p className="font-medium">
                  {contract.created_by?.first_name && contract.created_by?.last_name 
                    ? `${contract.created_by.first_name} ${contract.created_by.last_name}` 
                    : contract.created_by?.email || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Última atualização</p>
                <p className="font-medium">
                  {new Date(contract.updated_at).toLocaleString("pt-BR", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  }).replace(",", "")}
                </p>
              </div>
              {contract.updated_by && (
                <div>
                  <p className="text-sm text-gray-600">Atualizado por</p>
                  <p className="font-medium">
                    {contract.updated_by.first_name && contract.updated_by.last_name 
                      ? `${contract.updated_by.first_name} ${contract.updated_by.last_name}` 
                      : contract.updated_by.email}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}