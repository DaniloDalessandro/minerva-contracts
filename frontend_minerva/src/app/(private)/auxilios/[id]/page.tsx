"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { type Auxilio } from "@/features/auxilios";
import { AuxilioService } from "@/services";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Edit, Calendar, DollarSign, User, FileText, AlertTriangle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function AuxilioDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [auxilio, setAuxilio] = useState<Auxilio | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadAuxilioDetails();
    }
  }, [id]);

  const loadAuxilioDetails = async () => {
    try {
      setLoading(true);
      const auxilioData = await AuxilioService.fetchAuxilioById(parseInt(id));
      setAuxilio(auxilioData);
    } catch (error) {
      setError("Erro ao carregar os detalhes do auxílio");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    // Armazena o ID do auxílio no session storage para acionar o modo de edição
    window.sessionStorage.setItem('editAuxilioId', id);
    router.push('/auxilios');
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'GRADUACAO':
        return 'Graduação';
      case 'POS_GRADUACAO':
        return 'Pós-Graduação';
      case 'AUXILIO_CRECHE_ESCOLA':
        return 'Creche/Escola';
      case 'LINGUA_ESTRANGEIRA':
        return 'Língua Estrangeira';
      default:
        return type;
    }
  };

  const getTypeVariant = (type: string) => {
    switch (type) {
      case 'GRADUACAO':
        return 'default';
      case 'POS_GRADUACAO':
        return 'secondary';
      case 'AUXILIO_CRECHE_ESCOLA':
        return 'outline';
      case 'LINGUA_ESTRANGEIRA':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'AGUARDANDO':
        return 'Aguardando';
      case 'ATIVO':
        return 'Ativo';
      case 'CONCLUIDO':
        return 'Concluído';
      case 'CANCELADO':
        return 'Cancelado';
      default:
        return status;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'AGUARDANDO':
        return 'outline';
      case 'ATIVO':
        return 'default';
      case 'CONCLUIDO':
        return 'secondary';
      case 'CANCELADO':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const checkExpirationStatus = (endDate?: string) => {
    if (!endDate) return { isExpiring: false, isExpired: false, daysDiff: 0 };
    
    const expDate = new Date(endDate);
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

  if (error || !auxilio) {
    return (
      <div className="container mx-auto py-6 px-4">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-red-600">Erro</h1>
          <p className="text-gray-600">{error || "Auxílio não encontrado"}</p>
          <Button onClick={() => router.push('/auxilios')} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para Auxílios
          </Button>
        </div>
      </div>
    );
  }

  const expirationStatus = checkExpirationStatus(auxilio.end_date);

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="space-y-6">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => router.push('/auxilios')}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Detalhes do Auxílio #{auxilio.id}</h1>
              <p className="text-gray-600">
                {auxilio.employee?.full_name} - {getTypeLabel(auxilio.type)}
              </p>
            </div>
          </div>
          <Button onClick={handleEdit}>
            <Edit className="w-4 h-4 mr-2" />
            Editar
          </Button>
        </div>

        {/* Aviso de Expiração */}
        {(expirationStatus.isExpiring || expirationStatus.isExpired) && (
          <Card className={`border-l-4 ${expirationStatus.isExpired ? 'border-l-red-500 bg-red-50' : 'border-l-yellow-500 bg-yellow-50'}`}>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className={`w-5 h-5 ${expirationStatus.isExpired ? 'text-red-500' : 'text-yellow-500'}`} />
                <span className={`font-semibold ${expirationStatus.isExpired ? 'text-red-700' : 'text-yellow-700'}`}>
                  {expirationStatus.isExpired 
                    ? `Auxílio vencido há ${Math.abs(expirationStatus.daysDiff)} dias` 
                    : `Auxílio vence em ${expirationStatus.daysDiff} dias`}
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Conteúdo Principal */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Dados do Colaborador */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Colaborador
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-sm text-gray-600">Nome</p>
                <p className="font-medium">{auxilio.employee?.full_name}</p>
              </div>
              {auxilio.employee?.employee_id && (
                <div>
                  <p className="text-sm text-gray-600">Matrícula</p>
                  <p className="font-mono">{auxilio.employee.employee_id}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tipo e Status */}
          <Card>
            <CardHeader>
              <CardTitle>Tipo e Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-2">Tipo de Auxílio</p>
                <Badge variant={getTypeVariant(auxilio.type)} className="text-sm">
                  {getTypeLabel(auxilio.type)}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-2">Status</p>
                <Badge variant={getStatusVariant(auxilio.status)} className="text-sm">
                  {getStatusLabel(auxilio.status)}
                </Badge>
              </div>
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
            <CardContent className="space-y-2">
              <div>
                <p className="text-sm text-gray-600">Valor Total</p>
                <p className="font-semibold text-green-600 text-lg">
                  R$ {parseFloat(auxilio.total_amount).toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Parcelas</p>
                <p className="font-medium">{auxilio.installment_count}x</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Valor por Parcela</p>
                <p className="font-semibold text-blue-600">
                  R$ {parseFloat(auxilio.amount_per_installment).toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Datas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Período
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Data Início</p>
                <p className="font-medium">
                  {new Date(auxilio.start_date).toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  })}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Data Fim (Vencimento)</p>
                <div className="flex items-center gap-2">
                  <p className={`font-medium ${expirationStatus.isExpired ? 'text-red-600' : expirationStatus.isExpiring ? 'text-yellow-600' : ''}`}>
                    {new Date(auxilio.end_date).toLocaleDateString("pt-BR", {
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
            </CardContent>
          </Card>

          {/* Linha Orçamentária */}
          <Card>
            <CardHeader>
              <CardTitle>Linha Orçamentária</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-medium">{auxilio.budget_line?.name || "Não informado"}</p>
            </CardContent>
          </Card>

          {/* Observações */}
          {auxilio.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Observações
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 whitespace-pre-wrap">{auxilio.notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Auditoria */}
          <Card className={auxilio.notes ? "" : "md:col-span-2 lg:col-span-1"}>
            <CardHeader>
              <CardTitle>Informações de Auditoria</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-sm text-gray-600">Criado em</p>
                <p className="font-medium">
                  {new Date(auxilio.created_at).toLocaleString("pt-BR", {
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
                  {auxilio.created_by?.first_name && auxilio.created_by?.last_name 
                    ? `${auxilio.created_by.first_name} ${auxilio.created_by.last_name}` 
                    : auxilio.created_by?.email || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Última atualização</p>
                <p className="font-medium">
                  {new Date(auxilio.updated_at).toLocaleString("pt-BR", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  }).replace(",", "")}
                </p>
              </div>
              {auxilio.updated_by && (
                <div>
                  <p className="text-sm text-gray-600">Atualizado por</p>
                  <p className="font-medium">
                    {auxilio.updated_by.first_name && auxilio.updated_by.last_name 
                      ? `${auxilio.updated_by.first_name} ${auxilio.updated_by.last_name}` 
                      : auxilio.updated_by.email}
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