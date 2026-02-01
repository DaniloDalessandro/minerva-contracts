"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { fetchBudgetLineById, BudgetLine } from "@/lib/api/budgetlines";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Edit, Calendar, DollarSign, User, FileText, Building, Settings, InfoIcon, TagIcon, CheckCircleIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function BudgetLineDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [budgetLine, setBudgetLine] = useState<BudgetLine | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadBudgetLineDetails();
    }
  }, [id]);

  const loadBudgetLineDetails = async () => {
    try {
      setLoading(true);
      const budgetLineData = await fetchBudgetLineById(parseInt(id));
      setBudgetLine(budgetLineData);
    } catch (error) {
      console.error("Erro ao carregar detalhes da linha orçamentária:", error);
      setError("Erro ao carregar os detalhes da linha orçamentária");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    window.sessionStorage.setItem('editBudgetLineId', id);
    router.push('/linhas-orcamentarias');
  };

  const formatCurrency = (amount: string) => {
    const value = parseFloat(amount);
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).replace(",", "");
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'CAPEX': return 'CAPEX';
      case 'OPEX': return 'OPEX';
      default: return category;
    }
  };

  const getCategoryVariant = (category: string) => {
    switch (category) {
      case 'CAPEX': return 'destructive';
      case 'OPEX': return 'default';
      default: return 'secondary';
    }
  };

  const getExpenseTypeLabel = (type: string) => {
    switch (type) {
      case 'Base Principal': return 'Base Principal';
      case 'Serviços Especializados': return 'Serviços Especializados';
      case 'Despesas Compartilhadas': return 'Despesas Compartilhadas';
      default: return type;
    }
  };

  const getBudgetClassificationLabel = (classification: string) => {
    switch (classification) {
      case 'NOVO': return 'Novo';
      case 'RENOVAÇÃO': return 'Renovação';
      case 'CARY OVER': return 'Cary Over';
      case 'REPLANEJAMENTO': return 'Replanejamento';
      case 'N/A': return 'N/A';
      default: return classification;
    }
  };

  const getContractTypeLabel = (type: string) => {
    switch (type) {
      case 'SERVIÇO': return 'Serviço';
      case 'FORNECIMENTO': return 'Fornecimento';
      case 'ASSINATURA': return 'Assinatura';
      case 'FORNECIMENTO/SERVIÇO': return 'Fornecimento/Serviço';
      default: return type;
    }
  };

  const getProcurementTypeLabel = (type: string) => {
    switch (type) {
      case 'LICITAÇÃO': return 'Licitação';
      case 'DISPENSA EM RAZÃO DO VALOR': return 'Dispensa em Razão do Valor';
      case 'CONVÊNIO': return 'Convênio';
      case 'FUNDO FIXO': return 'Fundo Fixo';
      case 'INEXIGIBILIDADE': return 'Inexigibilidade';
      case 'ATA DE REGISTRO DE PREÇO': return 'Ata de Registro de Preço';
      case 'ACORDO DE COOPERAÇÃO': return 'Acordo de Cooperação';
      case 'APOSTILAMENTO': return 'Apostilamento';
      default: return type;
    }
  };

  const getProcessStatusLabel = (status: string) => {
    switch (status) {
      case 'VENCIDO': return 'Vencido';
      case 'DENTRO DO PRAZO': return 'Dentro do Prazo';
      case 'ELABORADO COM ATRASO': return 'Elaborado com Atraso';
      case 'ELABORADO NO PRAZO': return 'Elaborado no Prazo';
      default: return status;
    }
  };

  const getProcessStatusVariant = (status: string) => {
    switch (status) {
      case 'VENCIDO': return 'destructive';
      case 'DENTRO DO PRAZO': return 'default';
      case 'ELABORADO COM ATRASO': return 'outline';
      case 'ELABORADO NO PRAZO': return 'secondary';
      default: return 'secondary';
    }
  };

  const getContractStatusLabel = (status: string) => {
    switch (status) {
      case 'DENTRO DO PRAZO': return 'Dentro do Prazo';
      case 'CONTRATADO NO PRAZO': return 'Contratado no Prazo';
      case 'CONTRATADO COM ATRASO': return 'Contratado com Atraso';
      case 'PRAZO VENCIDO': return 'Prazo Vencido';
      case 'LINHA TOTALMENTE REMANEJADA': return 'Totalmente Remanejada';
      case 'LINHA TOTALMENTE EXECUTADA': return 'Totalmente Executada';
      case 'LINHA DE PAGAMENTO': return 'Linha de Pagamento';
      case 'LINHA PARCIALMENTE REMANEJADA': return 'Parcialmente Remanejada';
      case 'LINHA PARCIALMENTE EXECUTADA': return 'Parcialmente Executada';
      case 'N/A': return 'N/A';
      default: return status;
    }
  };

  const getContractStatusVariant = (status: string) => {
    switch (status) {
      case 'DENTRO DO PRAZO':
      case 'CONTRATADO NO PRAZO': return 'default';
      case 'CONTRATADO COM ATRASO':
      case 'PRAZO VENCIDO': return 'destructive';
      case 'LINHA TOTALMENTE EXECUTADA':
      case 'LINHA PARCIALMENTE EXECUTADA': return 'secondary';
      case 'LINHA TOTALMENTE REMANEJADA':
      case 'LINHA PARCIALMENTE REMANEJADA': return 'outline';
      case 'LINHA DE PAGAMENTO':
      case 'N/A': return 'outline';
      default: return 'secondary';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6 px-4">
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10" />
            <Skeleton className="h-8 w-48" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Skeleton className="h-48" />
            <Skeleton className="h-48" />
            <Skeleton className="h-48" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !budgetLine) {
    return (
      <div className="container mx-auto py-6 px-4">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-red-600">Erro</h1>
          <p className="text-gray-600">{error || "Linha orçamentária não encontrada"}</p>
          <Button onClick={() => router.push('/linhas-orcamentarias')} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para Linhas Orçamentárias
          </Button>
        </div>
      </div>
    );
  }

  // Calcular porcentagem de execução (exemplo - pode ser ajustado conforme regras de negócio)
  const budgetedAmount = parseFloat(budgetLine.budgeted_amount);
  // Se houver valor executado, calcular porcentagem. Por enquanto, simulando com base no status
  let executionPercentage = 0;
  if (budgetLine.contract_status) {
    switch (budgetLine.contract_status) {
      case 'LINHA TOTALMENTE EXECUTADA': executionPercentage = 100; break;
      case 'LINHA PARCIALMENTE EXECUTADA': executionPercentage = 65; break;
      case 'CONTRATADO NO PRAZO':
      case 'CONTRATADO COM ATRASO': executionPercentage = 25; break;
      case 'DENTRO DO PRAZO': executionPercentage = 10; break;
      default: executionPercentage = 0;
    }
  }

  const executedAmount = (budgetedAmount * executionPercentage) / 100;
  const remainingAmount = budgetedAmount - executedAmount;

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="space-y-6">
        {/* Header with Title */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => router.push('/linhas-orcamentarias')}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Detalhes da Linha Orçamentária #{budgetLine.id}
              </h1>
              <p className="text-sm text-muted-foreground">
                {budgetLine.summary_description}
              </p>
            </div>
          </div>
          <Button onClick={handleEdit} className="flex items-center gap-2">
            <Edit className="w-4 h-4" />
            Editar
          </Button>
        </div>
        
        {/* Informações Principais */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <InfoIcon className="h-5 w-5" />
              Informações da Linha Orçamentária
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <DollarSign className="h-3 w-3" />
                  Orçamento
                </div>
                <p className="text-base font-semibold">{budgetLine.budget?.name}</p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <TagIcon className="h-3 w-3" />
                  Categoria
                </div>
                <Badge variant={getCategoryVariant(budgetLine.category)} className="text-sm">
                  {getCategoryLabel(budgetLine.category)}
                </Badge>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <CheckCircleIcon className="h-3 w-3" />
                  Status
                </div>
                <p className="text-base font-semibold">
                  {budgetLine.contract_status ? getContractStatusLabel(budgetLine.contract_status) : "Não definido"}
                </p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <Building className="h-3 w-3" />
                  Centro Gestor
                </div>
                <p className="text-base font-medium">{budgetLine.management_center?.name || "Não informado"}</p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <DollarSign className="h-3 w-3" />
                  Valor Orçado
                </div>
                <p className="text-base font-semibold text-blue-600">{formatCurrency(budgetLine.budgeted_amount)}</p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <DollarSign className="h-3 w-3" />
                  Valor Executado
                </div>
                <p className="text-base font-semibold text-orange-600">{formatCurrency(executedAmount.toString())}</p>
              </div>
            </div>
            
            <Separator className="my-4" />
            
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <FileText className="h-3 w-3" />
                Descrição Resumida
              </div>
              <p className="text-sm text-gray-700">{budgetLine.summary_description}</p>
            </div>
            
            {budgetLine.object && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <FileText className="h-3 w-3" />
                  Objeto
                </div>
                <p className="text-sm text-gray-700">{budgetLine.object}</p>
              </div>
            )}
            
            <Separator className="my-4" />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Criado em {formatDate(budgetLine.created_at)}</span>
                {budgetLine.created_by && (
                  <span className="font-medium">
                    por {budgetLine.created_by.first_name && budgetLine.created_by.last_name 
                      ? `${budgetLine.created_by.first_name} ${budgetLine.created_by.last_name}`
                      : budgetLine.created_by.email}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Atualizado em {formatDate(budgetLine.updated_at)}</span>
                {budgetLine.updated_by && (
                  <span className="font-medium">
                    por {budgetLine.updated_by.first_name && budgetLine.updated_by.last_name 
                      ? `${budgetLine.updated_by.first_name} ${budgetLine.updated_by.last_name}`
                      : budgetLine.updated_by.email}
                  </span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Valores da Linha Orçamentária */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Execução Orçamentária
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">Valor Total Orçado</p>
              <p className="text-3xl font-bold text-blue-600">{formatCurrency(budgetLine.budgeted_amount)}</p>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-orange-600 h-3 rounded-full transition-all duration-300" 
                style={{width: `${executionPercentage}%`}}
              />
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">{executionPercentage.toFixed(1)}% executado</span>
              <span className="text-muted-foreground">
                {formatCurrency(executedAmount.toString())} / {formatCurrency(budgetLine.budgeted_amount)}
              </span>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Fiscais */}
          {(budgetLine.main_fiscal || budgetLine.secondary_fiscal) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Fiscais
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {budgetLine.main_fiscal && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                      <User className="h-3 w-3" />
                      Fiscal Principal
                    </div>
                    <p className="text-base font-medium">{budgetLine.main_fiscal.full_name}</p>
                    {budgetLine.main_fiscal.employee_id && (
                      <p className="text-xs text-muted-foreground">Matrícula: {budgetLine.main_fiscal.employee_id}</p>
                    )}
                  </div>
                )}
                {budgetLine.secondary_fiscal && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                      <User className="h-3 w-3" />
                      Fiscal Substituto
                    </div>
                    <p className="text-base font-medium">{budgetLine.secondary_fiscal.full_name}</p>
                    {budgetLine.secondary_fiscal.employee_id && (
                      <p className="text-xs text-muted-foreground">Matrícula: {budgetLine.secondary_fiscal.employee_id}</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Status */}
          {(budgetLine.process_status || budgetLine.contract_status) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {budgetLine.process_status && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                      <Settings className="h-3 w-3" />
                      Status do Processo
                    </div>
                    <Badge variant={getProcessStatusVariant(budgetLine.process_status)} className="text-sm">
                      {getProcessStatusLabel(budgetLine.process_status)}
                    </Badge>
                  </div>
                )}
                {budgetLine.contract_status && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                      <Settings className="h-3 w-3" />
                      Status do Contrato
                    </div>
                    <Badge variant={getContractStatusVariant(budgetLine.contract_status)} className="text-sm">
                      {getContractStatusLabel(budgetLine.contract_status)}
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Observações */}
          {budgetLine.contract_notes && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Observações
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{budgetLine.contract_notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Contratos Vinculados */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Contratos Vinculados a Esta Linha
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Simulando dados de contratos - em produção viria da API */}
            <div className="text-center py-8">
              <FileText className="h-12 w-12 mx-auto text-gray-400 mb-3" />
              <p className="text-sm text-muted-foreground mb-4">Nenhum contrato vinculado a esta linha orçamentária.</p>
              <Button variant="outline" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Criar Novo Contrato
              </Button>
            </div>

            {/* Exemplo de como ficaria com contratos (comentado) */}
            {/* <div className="space-y-3">
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Contrato #2024001</h4>
                    <p className="text-sm text-muted-foreground">Fornecimento de equipamentos de TI</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span>Valor: R$ 150.000,00</span>
                      <span>Início: 15/03/2024</span>
                      <span>Fim: 15/03/2025</span>
                    </div>
                  </div>
                  <Badge variant="default">Ativo</Badge>
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <Button size="sm" variant="outline">Ver Detalhes</Button>
                  <Button size="sm" variant="outline">Editar</Button>
                </div>
              </div>
              
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Contrato #2024002</h4>
                    <p className="text-sm text-muted-foreground">Manutenção preventiva e corretiva</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span>Valor: R$ 75.000,00</span>
                      <span>Início: 01/04/2024</span>
                      <span>Fim: 31/12/2024</span>
                    </div>
                  </div>
                  <Badge variant="secondary">Em Andamento</Badge>
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <Button size="sm" variant="outline">Ver Detalhes</Button>
                  <Button size="sm" variant="outline">Editar</Button>
                </div>
              </div>
              
              <div className="pt-4 border-t">
                <div className="flex items-center justify-between">
                  <div className="text-sm">
                    <p className="font-medium">Total de Contratos: 2</p>
                    <p className="text-muted-foreground">Valor Total Contratado: R$ 225.000,00</p>
                  </div>
                  <Button className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Novo Contrato
                  </Button>
                </div>
              </div>
            </div> */}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}