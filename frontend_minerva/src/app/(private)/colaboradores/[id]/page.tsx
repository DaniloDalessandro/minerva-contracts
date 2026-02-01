"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { fetchColaboradorById, fetchColaboradorContratos, fetchColaboradorAuxilios, Colaborador, ColaboradorContrato, ColaboradorAuxilio } from "@/lib/api/colaboradores"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Calendar, User, Building, Info, Phone, Mail, MapPin, Banknote, Edit, Container, Gift } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { 
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { DataTable } from "@/components/ui/data-table"
import { ColumnDef } from "@tanstack/react-table"

export default function ColaboradorDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const colaboradorId = Number(params.id)
  
  const [colaborador, setColaborador] = useState<Colaborador | null>(null)
  const [contratos, setContratos] = useState<ColaboradorContrato[]>([])
  const [auxilios, setAuxilios] = useState<ColaboradorAuxilio[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadColaboradorDetails = async () => {
      try {
        setLoading(true)
        
        // Load colaborador details and related data
        const [colaboradorData, contratosData, auxiliosData] = await Promise.all([
          fetchColaboradorById(colaboradorId),
          fetchColaboradorContratos(colaboradorId).catch(() => []),
          fetchColaboradorAuxilios(colaboradorId).catch(() => [])
        ])
        
        setColaborador(colaboradorData)
        setContratos(contratosData)
        setAuxilios(auxiliosData)
        
      } catch (err) {
        console.error("Erro ao carregar detalhes do colaborador:", err)
        setError("Erro ao carregar detalhes do colaborador")
      } finally {
        setLoading(false)
      }
    }

    loadColaboradorDetails()
  }, [colaboradorId])

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    })
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).replace(",", "")
  }

  const formatCurrency = (amount: string) => {
    const value = parseFloat(amount)
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const handleEditColaborador = () => {
    // Navigate back to the main page and trigger edit mode
    router.push(`/colaboradores`)
    // The edit functionality will be handled by the main page
    // This could be enhanced with a state management solution or URL params
    window.sessionStorage.setItem('editColaboradorId', colaboradorId.toString())
  }


  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'ATIVO':
        return 'default';
      case 'INATIVO':
        return 'destructive';
      default:
        return 'secondary';
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ATIVO':
        return 'Ativo';
      case 'INATIVO':
        return 'Inativo';
      default:
        return status;
    }
  }

  const getAuxilioTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'GRADUACAO': 'Graduação',
      'POS_GRADUACAO': 'Pós-Graduação',
      'AUXILIO_CRECHE_ESCOLA': 'Auxílio Creche/Escola',
      'LINGUA_ESTRANGEIRA': 'Língua Estrangeira',
      'CAPACITACAO_TECNICA': 'Capacitação Técnica',
      'AUXILIO_ALIMENTACAO': 'Auxílio Alimentação',
      'AUXILIO_TRANSPORTE': 'Auxílio Transporte',
      'PLANO_SAUDE': 'Plano de Saúde',
      'OUTROS': 'Outros'
    }
    return labels[type] || type
  }

  const getAuxilioStatusVariant = (status: string) => {
    switch (status) {
      case 'ATIVO':
        return 'default';
      case 'CONCLUIDO':
        return 'outline';
      case 'CANCELADO':
        return 'destructive';
      case 'SUSPENSO':
        return 'secondary';
      case 'AGUARDANDO':
        return 'secondary';
      default:
        return 'secondary';
    }
  }

  const getAuxilioStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'AGUARDANDO': 'Aguardando',
      'ATIVO': 'Ativo',
      'CONCLUIDO': 'Concluído',
      'CANCELADO': 'Cancelado',
      'SUSPENSO': 'Suspenso'
    }
    return labels[status] || status
  }

  // Definição das colunas para a tabela de contratos
  const contratosColumns: ColumnDef<ColaboradorContrato>[] = [
    {
      accessorKey: "contract_protocol",
      header: "Protocolo do Contrato",
      cell: ({ row }) => (
        <span className="font-mono text-sm">{row.original.contract_protocol}</span>
      )
    },
    {
      accessorKey: "role",
      header: "Função",
      cell: ({ row }) => (
        <Badge variant={row.original.role === 'FISCAL_PRINCIPAL' ? 'default' : 'secondary'}>
          {row.original.role === 'FISCAL_PRINCIPAL' ? 'Fiscal Principal' : 'Fiscal Substituto'}
        </Badge>
      )
    },
    {
      accessorKey: "start_date",
      header: "Data de Início",
      cell: ({ row }) => formatDate(row.original.start_date)
    },
    {
      accessorKey: "end_date", 
      header: "Data de Término",
      cell: ({ row }) => formatDate(row.original.end_date)
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant={row.original.status === 'ATIVO' ? 'default' : 'destructive'}>
          {row.original.status}
        </Badge>
      )
    }
  ]

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Carregando detalhes do colaborador...</div>
        </div>
      </div>
    )
  }

  if (error || !colaborador) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg text-red-500">
            {error || "Colaborador não encontrado"}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 px-4">
      {/* Breadcrumb Navigation */}
      <Breadcrumb className="mb-4">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/colaboradores">Colaboradores</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{colaborador.full_name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header with Title */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {colaborador.full_name}
          </h1>
          <p className="text-sm text-muted-foreground">Detalhes completos do colaborador</p>
        </div>
        <Button onClick={handleEditColaborador} className="flex items-center gap-2">
          <Edit className="h-4 w-4" />
          Editar Colaborador
        </Button>
      </div>
      
      <div className="space-y-6">
        {/* SEÇÃO 1: Dados Pessoais do Colaborador */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Dados Pessoais
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Informações básicas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <User className="h-4 w-4" />
                  Nome Completo
                </div>
                <p className="text-base">{colaborador.full_name}</p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Info className="h-4 w-4" />
                  CPF
                </div>
                <p className="text-base">{colaborador.cpf}</p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  Email
                </div>
                <p className="text-base">{colaborador.email}</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  Telefone
                </div>
                <p className="text-base">{colaborador.phone || "Não informado"}</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Info className="h-4 w-4" />
                  Status
                </div>
                <p className="text-base">{getStatusLabel(colaborador.status)}</p>
              </div>
            </div>
            
            {/* Dados funcionais */}
            <>
              <Separator className="my-4" />
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-800">Dados Funcionais</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        <Info className="h-4 w-4" />
                        Matrícula
                      </div>
                      <p className="text-base">{colaborador.employee_id || "Não informado"}</p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        <User className="h-4 w-4" />
                        Cargo
                      </div>
                      <p className="text-base">{colaborador.position || "Não informado"}</p>
                    </div>

                    {colaborador.department && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                          <Building className="h-4 w-4" />
                          Departamento
                        </div>
                        <p className="text-base">{colaborador.department}</p>
                      </div>
                    )}

                    {colaborador.admission_date && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          Data de Admissão
                        </div>
                        <p className="text-base">{formatDate(colaborador.admission_date)}</p>
                      </div>
                    )}

                    {colaborador.birth_date && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          Data de Nascimento
                        </div>
                        <p className="text-base">{formatDate(colaborador.birth_date)}</p>
                      </div>
                    )}
                  </div>
                </div>
              </>

            {/* Hierarquia organizacional - só mostra se tem pelo menos um campo */}
            {(colaborador.direction?.name || colaborador.management?.name || colaborador.coordination?.name) && (
              <>
                <Separator className="my-4" />
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-800">Hierarquia Organizacional</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {colaborador.direction?.name && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                          <Building className="h-4 w-4" />
                          Direção
                        </div>
                        <p className="text-base">{colaborador.direction.name}</p>
                      </div>
                    )}

                    {colaborador.management?.name && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                          <Building className="h-4 w-4" />
                          Gerência
                        </div>
                        <p className="text-base">{colaborador.management.name}</p>
                      </div>
                    )}

                    {colaborador.coordination?.name && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                          <Building className="h-4 w-4" />
                          Coordenação
                        </div>
                        <p className="text-base">{colaborador.coordination.name}</p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Endereço - só mostra se tem pelo menos um campo */}
            {(colaborador.street || colaborador.city || colaborador.state || colaborador.postal_code) && (
              <>
                <Separator className="my-4" />
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-800">Endereço</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {colaborador.street && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          Logradouro
                        </div>
                        <p className="text-base">{colaborador.street}</p>
                      </div>
                    )}

                    {(colaborador.city || colaborador.state) && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          Cidade
                        </div>
                        <p className="text-base">
                          {colaborador.city}
                          {colaborador.city && colaborador.state && " - "}
                          {colaborador.state}
                        </p>
                      </div>
                    )}

                    {colaborador.postal_code && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          CEP
                        </div>
                        <p className="text-base">{colaborador.postal_code}</p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Dados bancários - só mostra se tem pelo menos um campo */}
            {(colaborador.bank_name || colaborador.bank_agency || colaborador.bank_account) && (
              <>
                <Separator className="my-4" />
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-800">Dados Bancários</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {colaborador.bank_name && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                          <Banknote className="h-4 w-4" />
                          Banco
                        </div>
                        <p className="text-base">{colaborador.bank_name}</p>
                      </div>
                    )}

                    {colaborador.bank_agency && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                          <Banknote className="h-4 w-4" />
                          Agência
                        </div>
                        <p className="text-base">{colaborador.bank_agency}</p>
                      </div>
                    )}

                    {colaborador.bank_account && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                          <Banknote className="h-4 w-4" />
                          Conta
                        </div>
                        <p className="text-base">{colaborador.bank_account}</p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Sempre mostra o separador antes da auditoria se houver pelo menos uma seção anterior */}
            <Separator className="my-4" />
            
            {/* Informações de auditoria */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <User className="h-4 w-4" />
                <span>Criado em {formatDateTime(colaborador.created_at)}</span>
                {colaborador.created_by && (
                  <span className="font-medium">
                    por {colaborador.created_by.first_name && colaborador.created_by.last_name 
                      ? `${colaborador.created_by.first_name} ${colaborador.created_by.last_name}`
                      : colaborador.created_by.email}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <User className="h-4 w-4" />
                <span>Atualizado em {formatDateTime(colaborador.updated_at)}</span>
                {colaborador.updated_by && (
                  <span className="font-medium">
                    por {colaborador.updated_by.first_name && colaborador.updated_by.last_name 
                      ? `${colaborador.updated_by.first_name} ${colaborador.updated_by.last_name}`
                      : colaborador.updated_by.email}
                  </span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* SEÇÃO 2: Contratos onde é fiscal ou fiscal substituto */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 justify-between">
              <div className="flex items-center gap-2">
                <Container className="h-5 w-5" />
                Contratos Relacionados
              </div>
              <Badge variant="outline" className="text-sm">
                {contratos.length} contrato{contratos.length !== 1 ? 's' : ''}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {contratos.length > 0 ? (
              <DataTable
                columns={contratosColumns}
                data={contratos}
                showPagination={false}
                showSearch={false}
                showFilters={false}
              />
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Container className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Este colaborador não está vinculado a nenhum contrato como fiscal.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* SEÇÃO 3: Auxílios recebidos */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 justify-between">
              <div className="flex items-center gap-2">
                <Gift className="h-5 w-5" />
                Auxílios Recebidos
              </div>
              <Badge variant="outline" className="text-sm">
                {auxilios.length} auxílio{auxilios.length !== 1 ? 's' : ''}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {auxilios.length > 0 ? (
              <div className="grid gap-4">
                {auxilios.map((auxilio) => (
                  <Card key={auxilio.id} className="border-l-4 border-l-blue-500">
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-lg">{getAuxilioTypeLabel(auxilio.type)}</h4>
                          {auxilio.description && (
                            <p className="text-sm text-muted-foreground">{auxilio.description}</p>
                          )}
                        </div>
                        <Badge variant={getAuxilioStatusVariant(auxilio.status)}>
                          {getAuxilioStatusLabel(auxilio.status)}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Valor Total</p>
                          <p className="font-semibold">{formatCurrency(auxilio.total_amount)}</p>
                        </div>
                        
                        {auxilio.monthly_amount && (
                          <div>
                            <p className="text-muted-foreground">Valor Mensal</p>
                            <p className="font-semibold">{formatCurrency(auxilio.monthly_amount)}</p>
                          </div>
                        )}
                        
                        <div>
                          <p className="text-muted-foreground">Data de Início</p>
                          <p className="font-semibold">{formatDate(auxilio.start_date)}</p>
                        </div>
                        
                        {auxilio.end_date && (
                          <div>
                            <p className="text-muted-foreground">Data de Término</p>
                            <p className="font-semibold">{formatDate(auxilio.end_date)}</p>
                          </div>
                        )}
                      </div>

                      {(auxilio.institution_name || auxilio.course_name) && (
                        <div className="mt-3 pt-3 border-t">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            {auxilio.institution_name && (
                              <div>
                                <p className="text-muted-foreground">Instituição</p>
                                <p className="font-semibold">{auxilio.institution_name}</p>
                              </div>
                            )}
                            
                            {auxilio.course_name && (
                              <div>
                                <p className="text-muted-foreground">Curso</p>
                                <p className="font-semibold">{auxilio.course_name}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {auxilio.budget_line && (
                        <div className="mt-3 pt-3 border-t">
                          <div className="text-sm">
                            <p className="text-muted-foreground">Linha Orçamentária</p>
                            <p className="font-semibold">{auxilio.budget_line.name}</p>
                          </div>
                        </div>
                      )}

                      {auxilio.notes && (
                        <div className="mt-3 pt-3 border-t">
                          <div className="text-sm">
                            <p className="text-muted-foreground">Observações</p>
                            <p>{auxilio.notes}</p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Gift className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Este colaborador não possui auxílios cadastrados.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}