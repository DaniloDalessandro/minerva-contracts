"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  HelpCircle,
  BookOpen,
  Users,
  FileText,
  HandCoins,
  Wallet,
  Building2,
  Bot,
  Search,
  ChevronRight,
  BarChart3,
  PlayCircle,
  CheckCircle,
  Clock,
  AlertCircle,
  Lightbulb
} from "lucide-react"

interface Tutorial {
  id: string
  title: string
  description: string
  category: string
  level: 'Básico' | 'Intermediário' | 'Avançado'
  duration: string
  icon: React.ComponentType<{ className?: string }>
  steps: string[]
  tips?: string[]
}

interface FAQ {
  question: string
  answer: string
  category: string
}

export default function AjudaPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("Todos")
  const [expandedTutorial, setExpandedTutorial] = useState<string | null>(null)
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null)

  const tutorials: Tutorial[] = [
    {
      id: "dashboard-overview",
      title: "Visão Geral do Dashboard",
      description: "Aprenda a navegar e interpretar as informações do painel principal",
      category: "Dashboard",
      level: "Básico",
      duration: "5 min",
      icon: BarChart3,
      steps: [
        "Acesse o Dashboard através do menu lateral esquerdo",
        "Observe os cartões de resumo na parte superior com métricas principais",
        "Navegue pelos diferentes gráficos e visualizações",
        "Use os filtros de data para personalizar a visualização",
        "Explore os links rápidos para acessar módulos específicos"
      ],
      tips: [
        "O Dashboard é atualizado em tempo real",
        "Use Ctrl+R para atualizar os dados manualmente",
        "Clique nos gráficos para ver detalhes adicionais"
      ]
    },
    {
      id: "colaboradores-management",
      title: "Gestão de Colaboradores",
      description: "Como cadastrar, editar e gerenciar informações de funcionários",
      category: "Colaboradores",
      level: "Básico",
      duration: "10 min",
      icon: Users,
      steps: [
        "Navegue para o módulo 'Colaboradores' no menu lateral",
        "Use a barra de pesquisa para encontrar colaboradores específicos",
        "Clique em 'Adicionar Novo' para cadastrar um funcionário",
        "Preencha todos os campos obrigatórios marcados com *",
        "Para editar, clique no nome do colaborador na lista",
        "Use os filtros para organizar por setor, cargo ou status"
      ],
      tips: [
        "CPF deve ser único no sistema",
        "Campos de data usam formato DD/MM/AAAA",
        "Mantenha sempre os dados de contato atualizados"
      ]
    },
    {
      id: "contratos-workflow",
      title: "Fluxo de Trabalho de Contratos",
      description: "Processo completo de criação e gestão de contratos",
      category: "Contratos",
      level: "Intermediário",
      duration: "15 min",
      icon: FileText,
      steps: [
        "Acesse o módulo 'Contratos' no menu principal",
        "Clique em 'Novo Contrato' para iniciar o processo",
        "Selecione o tipo de contrato apropriado",
        "Associe colaboradores e definir valores",
        "Configure as datas de início e vencimento",
        "Anexe documentos necessários",
        "Revise todas as informações antes de salvar",
        "Monitore o status através da lista de contratos"
      ],
      tips: [
        "Contratos podem ser editados até serem aprovados",
        "Use alertas de vencimento para renovações",
        "Mantenha histórico de versões dos documentos"
      ]
    },
    {
      id: "auxilios-management",
      title: "Administração de Auxílios",
      description: "Como configurar e gerenciar diferentes tipos de benefícios",
      category: "Auxílios",
      level: "Básico",
      duration: "8 min",
      icon: HandCoins,
      steps: [
        "Entre no módulo 'Auxílios' via menu lateral",
        "Visualize todos os auxílios cadastrados na lista principal",
        "Para criar novo auxílio, clique em 'Adicionar'",
        "Defina o tipo de auxílio (alimentação, transporte, etc.)",
        "Configure valores e critérios de elegibilidade",
        "Associe aos colaboradores elegíveis",
        "Monitore pagamentos através dos relatórios"
      ]
    },
    {
      id: "budget-planning",
      title: "Planejamento Orçamentário",
      description: "Criar e monitorar orçamentos e movimentações financeiras",
      category: "Orçamento",
      level: "Avançado",
      duration: "20 min",
      icon: Wallet,
      steps: [
        "Acesse a aba 'Orçamentos' no Dashboard",
        "Use os filtros de Ano e Nível (Geral/Direção/Gerência/Coordenação) para refinar a visualização",
        "Observe o gráfico Total vs Disponível (CAPEX/OPEX)",
        "Clique no ícone de expandir para ver o gráfico em tela cheia",
        "Para criar novo orçamento, acesse o módulo 'Orçamento' no menu lateral",
        "Configure categorias (CAPEX/OPEX) e valores",
        "Use relatórios para acompanhar a execução",
        "Exporte PDFs para apresentações"
      ],
      tips: [
        "Orçamentos podem ser organizados por centro de custo",
        "Use os filtros hierárquicos para análises detalhadas",
        "Clique em expandir para apresentações em tela cheia"
      ]
    },
    {
      id: "budget-lines",
      title: "Linhas Orçamentárias",
      description: "Gerenciar linhas detalhadas e versionamento de orçamentos",
      category: "Orçamento",
      level: "Intermediário",
      duration: "12 min",
      icon: BarChart3,
      steps: [
        "Acesse a aba 'Linhas Orçamentárias' no Dashboard",
        "Visualize os KPIs: totais, ativas e inativas (admin only)",
        "Para detalhar, acesse o módulo 'Linhas Orçamentárias' no menu lateral",
        "Clique em uma linha para ver detalhes e versões",
        "Crie novas linhas vinculadas a um orçamento",
        "Use o histórico de versões para auditoria",
        "Registre movimentações de entrada e saída"
      ],
      tips: [
        "Cada alteração em uma linha cria uma nova versão",
        "Use categorias e tipos de despesa para melhor controle",
        "Visualize o histórico completo antes de alterar"
      ]
    },
    {
      id: "centers-sectors",
      title: "Configuração de Centros e Setores",
      description: "Estruturação organizacional da empresa no sistema",
      category: "Estrutura",
      level: "Intermediário",
      duration: "12 min",
      icon: Building2,
      steps: [
        "Acesse 'Centros' ou 'Setores' no menu lateral",
        "Visualize a estrutura organizacional atual",
        "Para criar novo centro/setor, clique em 'Adicionar'",
        "Defina hierarquia e responsáveis",
        "Configure permissões de acesso por setor",
        "Associe colaboradores aos respectivos setores",
        "Teste a estrutura com usuários de diferentes níveis"
      ]
    },
    {
      id: "alice-assistant",
      title: "Usando a Alice - Assistente IA",
      description: "Como interagir efetivamente com a assistente virtual",
      category: "Alice",
      level: "Básico",
      duration: "7 min",
      icon: Bot,
      steps: [
        "Clique em 'Fale com Alice' no menu lateral",
        "Digite perguntas em linguagem natural",
        "Use as sugestões rápidas para começar",
        "Especifique períodos de tempo quando necessário",
        "Revise as consultas SQL geradas pela Alice",
        "Use 'Nova Conversa' para contextos diferentes",
        "Salve respostas importantes para referência"
      ],
      tips: [
        "Seja específico nas perguntas",
        "Alice pode consultar todos os dados do sistema",
        "Use filtros de data para consultas mais precisas"
      ]
    }
  ]

  const faqs: FAQ[] = [
    {
      question: "Como posso alterar minha senha?",
      answer: "Clique no seu avatar no canto inferior esquerdo da barra lateral e selecione 'Perfil'. Na seção de segurança, você encontrará a opção para alterar sua senha.",
      category: "Conta"
    },
    {
      question: "Por que alguns dados não aparecem na busca?",
      answer: "Verifique suas permissões de acesso. Alguns dados podem estar restritos por setor ou nível de usuário. Entre em contato com o administrador se necessário.",
      category: "Permissões"
    },
    {
      question: "Como exportar relatórios?",
      answer: "Na maioria das telas de listagem, você encontrará botões de exportação (PDF, Excel). Para relatórios personalizados, use a Alice para consultas específicas.",
      category: "Relatórios"
    },
    {
      question: "O sistema funciona offline?",
      answer: "Não, o Minerva é um sistema web que requer conexão com internet. Dados são salvos automaticamente quando há conexão.",
      category: "Técnico"
    },
    {
      question: "Como recuperar dados excluídos acidentalmente?",
      answer: "O sistema mantém logs de todas as operações. Entre em contato com o suporte imediatamente. Dados podem ser recuperados dentro de 30 dias.",
      category: "Recuperação"
    },
    {
      question: "Posso usar o sistema no celular?",
      answer: "Sim, o Minerva é responsivo e funciona bem em dispositivos móveis. Recomendamos usar navegadores atualizados para melhor experiência.",
      category: "Técnico"
    },
    {
      question: "Como funcionam as notificações?",
      answer: "O sistema envia notificações para contratos vencendo, orçamentos próximos do limite e outras situações importantes. Configure suas preferências no perfil.",
      category: "Notificações"
    },
    {
      question: "Alice não entende minha pergunta, o que fazer?",
      answer: "Tente reformular a pergunta de forma mais específica. A Alice funciona melhor com perguntas diretas sobre dados. Use as sugestões como exemplo.",
      category: "Alice"
    }
  ]

  const categories = ["Todos", "Dashboard", "Colaboradores", "Contratos", "Auxílios", "Orçamento", "Estrutura", "Alice"]

  const filteredTutorials = tutorials.filter(tutorial => {
    const matchesSearch = tutorial.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tutorial.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "Todos" || tutorial.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const filteredFAQs = faqs.filter(faq =>
    faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getLevelBadge = (level: string) => {
    switch (level) {
      case 'Básico': return <Badge variant="success">{level}</Badge>
      case 'Intermediário': return <Badge variant="warning">{level}</Badge>
      case 'Avançado': return <Badge variant="destructive">{level}</Badge>
      default: return <Badge variant="outline">{level}</Badge>
    }
  }

  return (
    <div className="h-full overflow-y-auto animate-fade-in">
    <div className="space-y-6 pb-8">

      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-primary/10">
          <HelpCircle className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Central de Ajuda</h1>
          <p className="text-sm text-muted-foreground">Tutoriais, FAQ e suporte para o Sistema Minerva</p>
        </div>
      </div>


      <Card>
        <CardContent className="p-5">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
              <Input
                placeholder="Buscar tutoriais, FAQ ou tópicos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className={selectedCategory === category ? "" : "text-muted-foreground"}
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>


      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <PlayCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            Guia de Início Rápido
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-medium flex items-center gap-2 text-foreground text-sm">
                <CheckCircle className="h-4 w-4 text-emerald-500" />
                Primeiros Passos
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1.5 ml-6">
                <li>• Faça login com suas credenciais fornecidas</li>
                <li>• Explore o dashboard para visão geral</li>
                <li>• Configure seu perfil e preferências</li>
                <li>• Teste a Alice com perguntas simples</li>
              </ul>
            </div>
            <div className="space-y-3">
              <h4 className="font-medium flex items-center gap-2 text-foreground text-sm">
                <Lightbulb className="h-4 w-4 text-amber-500" />
                Dicas Importantes
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1.5 ml-6">
                <li>• Dados são salvos automaticamente</li>
                <li>• Use filtros para encontrar informações rapidamente</li>
                <li>• Mantenha sempre os dados atualizados</li>
                <li>• Entre em contato com suporte quando necessário</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-3 gap-6">

        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2 text-foreground">
            <BookOpen className="h-5 w-5 text-primary" />
            Tutoriais por Módulo
          </h2>

          {filteredTutorials.map((tutorial) => (
            <Card key={tutorial.id} className="hover:shadow-[rgba(0,0,0,0.12)_0px_8px_16px] transition-all duration-200">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="p-2 rounded-xl bg-primary/10 mt-0.5 flex-shrink-0">
                      <tutorial.icon className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground mb-1">{tutorial.title}</h3>
                      <p className="text-sm text-muted-foreground mb-2.5">{tutorial.description}</p>
                      <div className="flex flex-wrap items-center gap-2">
                        {getLevelBadge(tutorial.level)}
                        <Badge variant="outline" className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {tutorial.duration}
                        </Badge>
                        <Badge variant="outline">{tutorial.category}</Badge>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setExpandedTutorial(
                      expandedTutorial === tutorial.id ? null : tutorial.id
                    )}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <ChevronRight className={`h-4 w-4 transition-transform duration-200 ${
                      expandedTutorial === tutorial.id ? 'rotate-90' : ''
                    }`} />
                  </Button>
                </div>

                {expandedTutorial === tutorial.id && (
                  <div className="mt-4 pt-4 border-t border-border animate-fade-in">
                    <h4 className="font-medium mb-3 text-foreground text-sm">Passo a passo:</h4>
                    <ol className="space-y-2.5">
                      {tutorial.steps.map((step, index) => (
                        <li key={index} className="flex gap-3 text-sm">
                          <span className="flex-shrink-0 w-6 h-6 bg-primary/10 text-primary rounded-full flex items-center justify-center text-xs font-semibold">
                            {index + 1}
                          </span>
                          <span className="text-foreground/80 leading-relaxed">{step}</span>
                        </li>
                      ))}
                    </ol>

                    {tutorial.tips && (
                      <div className="mt-4 p-4 bg-amber-50/60 dark:bg-amber-500/8 rounded-xl border border-amber-100/80 dark:border-amber-500/15">
                        <h5 className="font-medium text-sm mb-2 flex items-center gap-2 text-foreground">
                          <Lightbulb className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                          Dicas úteis:
                        </h5>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          {tutorial.tips.map((tip, index) => (
                            <li key={index}>• {tip}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          {filteredTutorials.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="w-12 h-12 rounded-full bg-muted/60 flex items-center justify-center mx-auto mb-4">
                  <Search className="h-5 w-5 text-muted-foreground/50" />
                </div>
                <p className="text-sm font-medium text-foreground/70">Nenhum tutorial encontrado</p>
                <p className="text-xs text-muted-foreground mt-1">Tente ajustar os filtros aplicados</p>
              </CardContent>
            </Card>
          )}
        </div>


        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2 text-foreground">
            <AlertCircle className="h-5 w-5 text-primary" />
            Perguntas Frequentes
          </h2>

          <Card>
            <CardContent className="p-4 space-y-2">
                {filteredFAQs.map((faq, index) => (
                  <div key={index} className="border-b border-border last:border-0 pb-3 last:pb-0">
                    <button
                      className="w-full text-left py-2 hover:bg-transparent"
                      onClick={() => setExpandedFAQ(
                        expandedFAQ === `faq-${index}` ? null : `faq-${index}`
                      )}
                    >
                      <div className="flex items-start gap-2 w-full">
                        <ChevronRight className={`h-4 w-4 mt-0.5 flex-shrink-0 transition-transform duration-200 text-muted-foreground ${
                          expandedFAQ === `faq-${index}` ? 'rotate-90 text-primary' : ''
                        }`} />
                        <span className="text-sm font-medium text-left text-foreground">{faq.question}</span>
                      </div>
                    </button>

                    {expandedFAQ === `faq-${index}` && (
                      <div className="ml-6 mt-1 animate-fade-in">
                        <p className="text-sm text-muted-foreground leading-relaxed">{faq.answer}</p>
                        <Badge variant="outline" className="mt-2 text-xs">
                          {faq.category}
                        </Badge>
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
          </Card>
        </div>
      </div>
    </div>
    </div>
  )
}
