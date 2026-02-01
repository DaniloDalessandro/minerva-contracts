"use client"

import { useEffect, useState } from "react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts"
import {
  Users,
  FileText,
  DollarSign,
  Heart,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  Maximize2,
  X,
  AlertTriangle
} from "lucide-react"
import { useTheme } from "@/context/ThemeContext"

// Paleta de cores harmônica e consistente
const COLORS = {
  primary: '#3b82f6',      // Azul
  secondary: '#8b5cf6',    // Roxo
  success: '#10b981',      // Verde
  warning: '#f59e0b',      // Amarelo
  danger: '#ef4444',       // Vermelho
  muted: '#94a3b8',        // Cinza
  // Gradientes para gráficos
  chart: {
    blue: ['#3b82f6', '#60a5fa'],
    purple: ['#8b5cf6', '#a78bfa'],
    green: ['#10b981', '#34d399'],
    amber: ['#f59e0b', '#fbbf24'],
    red: ['#ef4444', '#f87171'],
  }
}

// Dados dos gráficos
const contractStatusData = [
  { name: 'Ativos', value: 45, color: COLORS.success },
  { name: 'Em Análise', value: 8, color: COLORS.warning },
  { name: 'Expirados', value: 12, color: COLORS.danger },
  { name: 'Suspensos', value: 3, color: COLORS.muted },
]

const monthlyContractValues = [
  { month: 'Jan', valor: 2450000, contratos: 12 },
  { month: 'Fev', valor: 2800000, contratos: 15 },
  { month: 'Mar', valor: 3200000, contratos: 18 },
  { month: 'Abr', valor: 2900000, contratos: 14 },
  { month: 'Mai', valor: 3500000, contratos: 21 },
  { month: 'Jun', valor: 4200000, contratos: 25 },
]

const budgetUtilizationData = [
  { categoria: 'Obras', utilizado: 2800000, disponivel: 1200000 },
  { categoria: 'Serviços', utilizado: 1500000, disponivel: 700000 },
  { categoria: 'Equipamentos', utilizado: 800000, disponivel: 400000 },
  { categoria: 'Consultoria', utilizado: 600000, disponivel: 400000 },
  { categoria: 'Manutenção', utilizado: 400000, disponivel: 400000 },
]

// Formatar moeda
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

// Formatar moeda abreviada (K, M)
const formatCurrencyShort = (value: number) => {
  if (value >= 1000000) {
    return `R$ ${(value / 1000000).toFixed(1)}M`
  }
  if (value >= 1000) {
    return `R$ ${(value / 1000).toFixed(0)}K`
  }
  return formatCurrency(value)
}

// Tooltip customizado para gráficos
const CustomTooltip = ({ active, payload, label, type }: any) => {
  if (!active || !payload || !payload.length) return null

  return (
    <div className="bg-white dark:bg-gray-800 px-4 py-3 shadow-lg rounded-lg border border-gray-100 dark:border-gray-700">
      {label && (
        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2 border-b border-gray-100 dark:border-gray-700 pb-2">
          {label}
        </p>
      )}
      <div className="space-y-1">
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-sm text-gray-600 dark:text-gray-300">
                {entry.name === 'valor' ? 'Valor Total' :
                 entry.name === 'contratos' ? 'Contratos' :
                 entry.name === 'utilizado' ? 'Utilizado' :
                 entry.name === 'disponivel' ? 'Disponível' :
                 entry.name}
              </span>
            </div>
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100 dark:text-gray-100">
              {type === 'currency' || entry.name === 'valor' || entry.name === 'utilizado' || entry.name === 'disponivel'
                ? formatCurrency(entry.value)
                : entry.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// Tooltip customizado para o PieChart
const PieTooltip = ({ active, payload }: any) => {
  if (!active || !payload || !payload.length) return null
  const data = payload[0]
  const total = contractStatusData.reduce((acc, item) => acc + item.value, 0)
  const percentage = ((data.value / total) * 100).toFixed(1)

  return (
    <div className="bg-white dark:bg-gray-800 px-4 py-3 shadow-lg rounded-lg border border-gray-100 dark:border-gray-700">
      <div className="flex items-center gap-2 mb-1">
        <div
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: data.payload.color }}
        />
        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{data.name}</span>
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-300">
        <span className="font-medium">{data.value}</span> contratos ({percentage}%)
      </p>
    </div>
  )
}

// Componente de Card de Métrica
interface MetricCardProps {
  title: string
  value: string | number
  subtitle: string
  icon: React.ReactNode
  trend?: { value: number; positive: boolean }
  iconColor: string
}

function MetricCard({ title, value, subtitle, icon, trend, iconColor }: MetricCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</h3>
              {trend && (
                <div className={`flex items-center text-xs font-medium ${trend.positive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
                  {trend.positive ? <TrendingUp className="h-3 w-3 mr-0.5" /> : <TrendingDown className="h-3 w-3 mr-0.5" />}
                  {trend.positive ? '+' : ''}{trend.value}%
                </div>
              )}
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500">{subtitle}</p>
          </div>
          <div className={`p-3 rounded-xl ${iconColor}`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Tipo para estado de fullscreen
type ChartKey = 'status' | 'valores' | 'orcamento'

export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [fullscreenChart, setFullscreenChart] = useState<ChartKey | null>(null)
  const { theme } = useTheme()

  // Cores para os gráficos baseadas no tema
  const chartColors = {
    text: theme === 'dark' ? '#e2e8f0' : '#64748b',
    grid: theme === 'dark' ? '#334155' : '#f1f5f9',
    background: theme === 'dark' ? '#1e293b' : '#ffffff',
    border: theme === 'dark' ? '#334155' : '#e2e8f0',
  }

  // Contratos próximos ao vencimento
  const expiringContracts = [
    { id: '2024-001', days: 15, value: 85000 },
    { id: '2024-003', days: 22, value: 120000 },
    { id: '2024-007', days: 28, value: 95500 },
  ]

  // Contratos recém aprovados
  const recentContracts = [
    { id: '2024-015', date: 'Hoje', value: 275000 },
    { id: '2024-016', date: 'Ontem', value: 150000 },
    { id: '2024-017', date: 'Há 2 dias', value: 89000 },
  ]

  useEffect(() => {
    // Simula carregamento inicial
    const timer = setTimeout(() => setIsLoading(false), 800)
    return () => clearTimeout(timer)
  }, [])

  // Renderizar gráfico em fullscreen
  const renderFullscreenChart = () => {
    if (!fullscreenChart) return null

    const charts: Record<ChartKey, { title: string; chart: React.ReactElement }> = {
      status: {
        title: 'Distribuição de Status dos Contratos',
        chart: (
          <PieChart>
            <Pie
              data={contractStatusData}
              cx="50%"
              cy="50%"
              innerRadius="40%"
              outerRadius="70%"
              paddingAngle={3}
              dataKey="value"
              animationBegin={0}
              animationDuration={800}
            >
              {contractStatusData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color}
                  stroke={chartColors.background}
                  strokeWidth={2}
                />
              ))}
            </Pie>
            <Tooltip content={<PieTooltip />} />
            <Legend
              verticalAlign="bottom"
              height={36}
              formatter={(value) => <span className="text-sm text-gray-600 dark:text-gray-300">{value}</span>}
            />
          </PieChart>
        )
      },
      valores: {
        title: 'Evolução Mensal de Contratos',
        chart: (
          <AreaChart data={monthlyContractValues}>
            <defs>
              <linearGradient id="colorValorFull" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} vertical={false} />
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fill: chartColors.text, fontSize: 12 }}
            />
            <YAxis
              tickFormatter={formatCurrencyShort}
              axisLine={false}
              tickLine={false}
              tick={{ fill: chartColors.text, fontSize: 12 }}
              width={80}
            />
            <Tooltip content={<CustomTooltip type="currency" />} />
            <Area
              type="monotone"
              dataKey="valor"
              stroke={COLORS.primary}
              strokeWidth={3}
              fill="url(#colorValorFull)"
              animationBegin={0}
              animationDuration={800}
            />
          </AreaChart>
        )
      },
      orcamento: {
        title: 'Utilização de Orçamento por Categoria',
        chart: (
          <BarChart data={budgetUtilizationData} layout="vertical" barGap={0}>
            <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} horizontal={true} vertical={false} />
            <XAxis
              type="number"
              tickFormatter={formatCurrencyShort}
              axisLine={false}
              tickLine={false}
              tick={{ fill: chartColors.text, fontSize: 12 }}
            />
            <YAxis
              dataKey="categoria"
              type="category"
              width={100}
              axisLine={false}
              tickLine={false}
              tick={{ fill: chartColors.text, fontSize: 12 }}
            />
            <Tooltip content={<CustomTooltip type="currency" />} />
            <Legend
              verticalAlign="top"
              height={36}
              formatter={(value) => (
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  {value === 'utilizado' ? 'Utilizado' : 'Disponível'}
                </span>
              )}
            />
            <Bar
              dataKey="utilizado"
              stackId="a"
              fill={COLORS.primary}
              radius={[0, 0, 0, 0]}
              animationBegin={0}
              animationDuration={800}
            />
            <Bar
              dataKey="disponivel"
              stackId="a"
              fill={chartColors.border}
              radius={[0, 4, 4, 0]}
              animationBegin={0}
              animationDuration={800}
            />
          </BarChart>
        )
      }
    }

    const chart = charts[fullscreenChart]

    return (
      <Dialog open={!!fullscreenChart} onOpenChange={() => setFullscreenChart(null)}>
        <DialogContent className="!max-w-none !w-screen !h-screen !p-0 !m-0 !rounded-none !border-0 !bg-white dark:!bg-gray-900 !top-0 !left-0 !translate-x-0 !translate-y-0 !fixed !inset-0 !z-50" hideClose>
          <div className="h-screen w-screen flex flex-col bg-white dark:bg-gray-900">
            <div className="flex-shrink-0 px-8 py-6 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
              <div className="flex items-center justify-between">
                <DialogTitle className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                  {chart.title}
                </DialogTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setFullscreenChart(null)}
                  className="h-10 w-10 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>
            <div className="flex-1 p-8 bg-gray-50 dark:bg-gray-800">
              <div className="h-full bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-8">
                <ResponsiveContainer width="100%" height="100%">
                  {chart.chart}
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col gap-6 p-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-3">
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                  <div className="h-7 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          {[1, 2].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-6"></div>
                  <div className="h-64 bg-gray-100 dark:bg-gray-800 rounded-lg"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  const totalContratos = contractStatusData.reduce((acc, item) => acc + item.value, 0)

  return (
    <div className="flex flex-col gap-6 p-6 pb-8">
      {/* KPIs */}
      <section>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Total de Contratos"
            value={totalContratos}
            subtitle="vs. mês anterior"
            icon={<FileText className="h-5 w-5 text-blue-600" />}
            iconColor="bg-blue-50"
            trend={{ value: 12, positive: true }}
          />
          <MetricCard
            title="Colaboradores"
            value={156}
            subtitle="ativos no sistema"
            icon={<Users className="h-5 w-5 text-purple-600" />}
            iconColor="bg-purple-50"
            trend={{ value: 5, positive: true }}
          />
          <MetricCard
            title="Orçamento Total"
            value={formatCurrencyShort(18750000)}
            subtitle="valor disponível"
            icon={<DollarSign className="h-5 w-5 text-emerald-600" />}
            iconColor="bg-emerald-50"
            trend={{ value: 8, positive: true }}
          />
          <MetricCard
            title="Auxílios Ativos"
            value={42}
            subtitle="em andamento"
            icon={<Heart className="h-5 w-5 text-rose-600" />}
            iconColor="bg-rose-50"
            trend={{ value: 3, positive: false }}
          />
        </div>
      </section>

      {/* Gráficos Principais - Linha 1 */}
      <section>
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Status dos Contratos - PieChart */}
          <Card className="hover:shadow-md transition-shadow duration-200">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Status dos Contratos
                  </CardTitle>
                  <CardDescription className="text-sm text-gray-500 dark:text-gray-400">
                    Distribuição atual por situação
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setFullscreenChart('status')}
                  className="h-8 w-8 text-gray-400 hover:text-gray-600"
                >
                  <Maximize2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={contractStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={95}
                    paddingAngle={3}
                    dataKey="value"
                    animationBegin={0}
                    animationDuration={800}
                  >
                    {contractStatusData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color}
                        stroke={chartColors.background}
                        strokeWidth={2}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    formatter={(value) => <span className="text-sm text-gray-600 dark:text-gray-300">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Evolução Mensal - AreaChart */}
          <Card className="hover:shadow-md transition-shadow duration-200">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Evolução Mensal
                  </CardTitle>
                  <CardDescription className="text-sm text-gray-500 dark:text-gray-400">
                    Valor total de contratos por mês
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setFullscreenChart('valores')}
                  className="h-8 w-8 text-gray-400 hover:text-gray-600"
                >
                  <Maximize2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={monthlyContractValues}>
                  <defs>
                    <linearGradient id="colorValor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} vertical={false} />
                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: chartColors.text, fontSize: 12 }}
                  />
                  <YAxis
                    tickFormatter={formatCurrencyShort}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: chartColors.text, fontSize: 12 }}
                    width={70}
                  />
                  <Tooltip content={<CustomTooltip type="currency" />} />
                  <Area
                    type="monotone"
                    dataKey="valor"
                    stroke={COLORS.primary}
                    strokeWidth={2}
                    fill="url(#colorValor)"
                    animationBegin={0}
                    animationDuration={800}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Gráfico de Orçamento - Full Width */}
      <section>
        <Card className="hover:shadow-md transition-shadow duration-200">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Utilização de Orçamento
                </CardTitle>
                <CardDescription className="text-sm text-gray-500 dark:text-gray-400">
                  Comparativo entre valor utilizado e disponível por categoria
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setFullscreenChart('orcamento')}
                className="h-8 w-8 text-gray-400 hover:text-gray-600"
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={budgetUtilizationData} layout="vertical" barGap={0}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} horizontal={true} vertical={false} />
                <XAxis
                  type="number"
                  tickFormatter={formatCurrencyShort}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: chartColors.text, fontSize: 12 }}
                />
                <YAxis
                  dataKey="categoria"
                  type="category"
                  width={90}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: chartColors.text, fontSize: 12 }}
                />
                <Tooltip content={<CustomTooltip type="currency" />} />
                <Legend
                  verticalAlign="top"
                  align="right"
                  height={36}
                  formatter={(value) => (
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                      {value === 'utilizado' ? 'Utilizado' : 'Disponível'}
                    </span>
                  )}
                />
                <Bar
                  dataKey="utilizado"
                  stackId="a"
                  fill={COLORS.primary}
                  radius={[0, 0, 0, 0]}
                  animationBegin={0}
                  animationDuration={800}
                />
                <Bar
                  dataKey="disponivel"
                  stackId="a"
                  fill={chartColors.border}
                  radius={[0, 4, 4, 0]}
                  animationBegin={0}
                  animationDuration={800}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </section>

      {/* Cards Informativos */}
      <section>
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Contratos Próximos ao Vencimento */}
          <Card className="hover:shadow-md transition-shadow duration-200">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-900/30">
                  <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Próximos ao Vencimento
                  </CardTitle>
                  <CardDescription className="text-sm text-gray-500 dark:text-gray-400">
                    Contratos que expiram em breve
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                {expiringContracts.map((contract) => (
                  <div
                    key={contract.id}
                    className="flex items-center justify-between p-4 bg-amber-50/50 dark:bg-amber-900/20 rounded-xl border border-amber-100 dark:border-amber-800 hover:bg-amber-50 dark:hover:bg-amber-900/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          Contrato #{contract.id}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Vence em {contract.days} dias
                        </p>
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-amber-700 dark:text-amber-400">
                      {formatCurrency(contract.value)}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Contratos Recém Aprovados */}
          <Card className="hover:shadow-md transition-shadow duration-200">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/30">
                  <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Recém Aprovados
                  </CardTitle>
                  <CardDescription className="text-sm text-gray-500 dark:text-gray-400">
                    Últimos contratos aprovados
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                {recentContracts.map((contract) => (
                  <div
                    key={contract.id}
                    className="flex items-center justify-between p-4 bg-emerald-50/50 dark:bg-emerald-900/20 rounded-xl border border-emerald-100 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          Contrato #{contract.id}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Aprovado {contract.date.toLowerCase()}
                        </p>
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                      {formatCurrency(contract.value)}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Fullscreen Chart Modal */}
      {renderFullscreenChart()}
    </div>
  )
}
