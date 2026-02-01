'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Clock, User, Eye, GitBranch, DollarSign, FileText } from "lucide-react"

interface BudgetLineVersion {
  id: number
  version_number: number
  budget_line: number
  change_reason: string
  category: string
  expense_type: string
  summary_description: string
  budgeted_amount: number
  contract_status: string
  process_status: string
  management_center_name?: string
  requesting_center_name?: string
  main_fiscal_name?: string
  secondary_fiscal_name?: string
  created_by_name?: string
  created_at: string
  contract_notes?: string
  object?: string
  budget_classification?: string
  contract_type?: string
  probable_procurement_type?: string
}

interface BudgetLineVersionHistoryProps {
  budgetLineId: number
  isOpen?: boolean
}

export default function BudgetLineVersionHistory({ budgetLineId, isOpen = false }: BudgetLineVersionHistoryProps) {
  const [versions, setVersions] = useState<BudgetLineVersion[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedVersion, setSelectedVersion] = useState<BudgetLineVersion | null>(null)

  const fetchVersions = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/budgetslines/${budgetLineId}/versions/`)
      if (!response.ok) {
        throw new Error('Erro ao buscar versões')
      }
      const data = await response.json()
      setVersions(data.results || data)
    } catch (error) {
      console.error('Erro ao carregar histórico de versões')
      console.error('Erro ao buscar versões:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen && budgetLineId) {
      fetchVersions()
    }
  }, [budgetLineId, isOpen])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR')
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const getStatusColor = (status: string) => {
    const statusColors: { [key: string]: string } = {
      'DENTRO DO PRAZO': 'bg-green-100 text-green-800',
      'CONTRATADO NO PRAZO': 'bg-green-100 text-green-800',
      'CONTRATADO COM ATRASO': 'bg-yellow-100 text-yellow-800',
      'PRAZO VENCIDO': 'bg-red-100 text-red-800',
      'VENCIDO': 'bg-red-100 text-red-800',
      'ELABORADO COM ATRASO': 'bg-yellow-100 text-yellow-800',
      'ELABORADO NO PRAZO': 'bg-green-100 text-green-800',
    }
    return statusColors[status] || 'bg-gray-100 text-gray-800'
  }

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GitBranch className="h-5 w-5" />
          Histórico de Versões da Linha Orçamentária
        </CardTitle>
        <CardDescription>
          Visualize todas as alterações realizadas nesta linha orçamentária
        </CardDescription>
      </CardHeader>
      <CardContent>
        {versions.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-semibold text-gray-900">Nenhuma versão encontrada</h3>
            <p className="mt-1 text-sm text-gray-500">
              Esta linha orçamentária ainda não possui histórico de versões.
            </p>
          </div>
        ) : (
          <Tabs defaultValue="timeline" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
              <TabsTrigger value="comparison">Detalhes</TabsTrigger>
            </TabsList>
            
            <TabsContent value="timeline" className="space-y-4">
              <ScrollArea className="h-96">
                <div className="space-y-4">
                  {versions.map((version, index) => (
                    <div key={version.id} className="relative">
                      {index !== versions.length - 1 && (
                        <div className="absolute left-4 top-10 h-full w-px bg-gray-200" />
                      )}
                      <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                            index === 0 ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'
                          }`}>
                            v{version.version_number}
                          </div>
                        </div>
                        <Card className="flex-1">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <Badge variant={index === 0 ? "default" : "secondary"}>
                                  Versão {version.version_number}
                                </Badge>
                                {index === 0 && (
                                  <Badge variant="outline" className="bg-green-50 text-green-700">
                                    Atual
                                  </Badge>
                                )}
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedVersion(version)}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                Ver detalhes
                              </Button>
                            </div>
                            
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Clock className="h-4 w-4" />
                                {formatDate(version.created_at)}
                                {version.created_by_name && (
                                  <>
                                    <Separator orientation="vertical" className="h-4" />
                                    <User className="h-4 w-4" />
                                    {version.created_by_name}
                                  </>
                                )}
                              </div>
                              
                              <div className="text-sm font-medium">
                                {version.change_reason}
                              </div>
                              
                              <div className="flex items-center gap-4 text-sm">
                                <div className="flex items-center gap-1">
                                  <DollarSign className="h-4 w-4" />
                                  {formatCurrency(version.budgeted_amount)}
                                </div>
                                {version.contract_status && (
                                  <Badge className={getStatusColor(version.contract_status)}>
                                    {version.contract_status}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
            
            <TabsContent value="comparison">
              {selectedVersion ? (
                <ScrollArea className="h-96">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">
                        Versão {selectedVersion.version_number}
                      </h3>
                      <Button
                        variant="outline"
                        onClick={() => setSelectedVersion(null)}
                      >
                        Voltar à lista
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Categoria:</label>
                        <p className="text-sm">{selectedVersion.category || '-'}</p>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Tipo de Despesa:</label>
                        <p className="text-sm">{selectedVersion.expense_type}</p>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Centro Gestor:</label>
                        <p className="text-sm">{selectedVersion.management_center_name || '-'}</p>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Centro Solicitante:</label>
                        <p className="text-sm">{selectedVersion.requesting_center_name || '-'}</p>
                      </div>
                      
                      <div className="space-y-2 col-span-full">
                        <label className="text-sm font-medium text-gray-700">Descrição:</label>
                        <p className="text-sm">{selectedVersion.summary_description || '-'}</p>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Objeto:</label>
                        <p className="text-sm">{selectedVersion.object || '-'}</p>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Valor Orçado:</label>
                        <p className="text-sm font-semibold text-green-600">
                          {formatCurrency(selectedVersion.budgeted_amount)}
                        </p>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Status do Processo:</label>
                        {selectedVersion.process_status ? (
                          <Badge className={getStatusColor(selectedVersion.process_status)}>
                            {selectedVersion.process_status}
                          </Badge>
                        ) : (
                          <p className="text-sm">-</p>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Status do Contrato:</label>
                        {selectedVersion.contract_status ? (
                          <Badge className={getStatusColor(selectedVersion.contract_status)}>
                            {selectedVersion.contract_status}
                          </Badge>
                        ) : (
                          <p className="text-sm">-</p>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Fiscal Principal:</label>
                        <p className="text-sm">{selectedVersion.main_fiscal_name || '-'}</p>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Fiscal Substituto:</label>
                        <p className="text-sm">{selectedVersion.secondary_fiscal_name || '-'}</p>
                      </div>
                      
                      {selectedVersion.contract_notes && (
                        <div className="space-y-2 col-span-full">
                          <label className="text-sm font-medium text-gray-700">Observações:</label>
                          <p className="text-sm">{selectedVersion.contract_notes}</p>
                        </div>
                      )}
                      
                      <div className="space-y-2 col-span-full">
                        <label className="text-sm font-medium text-gray-700">Motivo da Alteração:</label>
                        <p className="text-sm bg-blue-50 p-2 rounded">{selectedVersion.change_reason}</p>
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              ) : (
                <div className="text-center py-8">
                  <Eye className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-semibold text-gray-900">Selecione uma versão</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Clique em "Ver detalhes" em uma das versões na timeline para visualizar informações completas.
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  )
}