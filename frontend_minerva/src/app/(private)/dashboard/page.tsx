"use client"

import { useEffect, useState, useCallback, useMemo } from "react"
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog"
import {
  PieChart, Pie, Cell, BarChart, Bar,
  XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
} from "recharts"
import {
  Users, FileText, DollarSign, Heart,
  Clock, CheckCircle, AlertTriangle, RefreshCw,
  Globe, ArrowUpRight, LayoutDashboard, Layers, Loader2, Maximize2,
} from "lucide-react"
import { useTheme } from "@/context/ThemeContext"
import { Skeleton } from "@/components/ui/skeleton"
import { fetchDashboardStats } from "@/lib/api/notifications"
import {
  getOrcamentoGraficos,
  type OrcamentoGraficos,
} from "@/lib/api/dashboard-orcamento"
import {
  fetchDirectionsAPI,
  fetchManagementsAPI,
  fetchCoordinationsAPI,
} from "@/lib/api/colaboradores"

// ── Palette ───────────────────────────────────────────────────────────────────
const C = { primary: 'oklch(0.52 0.265 285)', success: '#10b981', danger: '#ef4444', muted: '#8e8e93' }

// ── Formatters ────────────────────────────────────────────────────────────────
const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 }).format(v)
const fmtShort = (v: number) => {
  if (v >= 1_000_000) return `R$ ${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000)     return `R$ ${(v / 1_000).toFixed(0)}K`
  return fmt(v)
}

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })

// ── KPI Card ──────────────────────────────────────────────────────────────────
function KpiCard({ title, value, subtitle, icon, accent }: {
  title: string; value: string | number; subtitle: string; icon: React.ReactNode; accent: string
}) {
  return (
    <Card className="relative overflow-hidden hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 group">
      <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: accent }} />
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1.5 flex-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
            <h3 className="text-xl font-bold text-foreground tracking-tight">{value}</h3>
            <p className="text-xs text-muted-foreground/70">{subtitle}</p>
          </div>
          <div className="p-2 rounded-xl bg-primary/8 group-hover:bg-primary/12 transition-colors shrink-0">{icon}</div>
        </div>
      </CardContent>
    </Card>
  )
}

// ── Tooltip ───────────────────────────────────────────────────────────────────
const Tip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="glass rounded-xl px-3 py-2 shadow-lg border border-border/50 text-xs">
      {label && <p className="font-semibold mb-1 pb-1 border-b border-border/50">{label}</p>}
      {payload.map((e: any, i: number) => (
        <div key={i} className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: e.color }} />
            <span className="text-muted-foreground">{e.name}</span>
          </div>
          <span className="font-semibold">{typeof e.value === 'number' && e.value > 1000 ? fmtShort(e.value) : e.value}</span>
        </div>
      ))}
    </div>
  )
}

// ── Orçamento por Categoria (com seletor de Ano + Hierarquia) ─────────────────
function BudgetByCategoryCard({ chartText }: { chartText: string }) {
  const currentYear = new Date().getFullYear()
  const years = [currentYear + 1, currentYear, currentYear - 1, currentYear - 2]

  const [ano, setAno] = useState(currentYear)
  const [nivel, setNivel] = useState<"geral" | "direcao" | "gerencia" | "coordenacao">("geral")
  const [direcoes, setDirecoes] = useState<{ id: number; name: string }[]>([])
  const [gerencias, setGerencias] = useState<{ id: number; name: string; direction: number }[]>([])
  const [coordenacoes, setCoordenacoes] = useState<{ id: number; name: string; management: number }[]>([])
  const [selectedEntity, setSelectedEntity] = useState("0")
  const [graficos, setGraficos] = useState<OrcamentoGraficos | null>(null)
  const [loadingRef, setLoadingRef] = useState(true)
  const [loadingData, setLoadingData] = useState(false)
  const [expanded, setExpanded] = useState(false)

  // Carrega listas de direção/gerência/coordenação do sistema
  const loadRefData = useCallback(async () => {
    setLoadingRef(true)
    try {
      const [dirs, Mgmt, Coords] = await Promise.all([
        fetchDirectionsAPI(),
        fetchManagementsAPI(),
        fetchCoordinationsAPI(),
      ])
      setDirecoes(dirs.map((d: any) => ({ id: d.id, name: d.name })))
      setGerencias(Mgmt.map((m: any) => ({
        id: m.id, name: m.name,
        direction: typeof m.direction === "object" ? m.direction.id : m.direction,
      })))
      setCoordenacoes(Coords.map((c: any) => ({
        id: c.id, name: c.name,
        management: typeof c.management === "object" ? c.management.id : c.management,
      })))
    } catch {
      setDirecoes([]); setGerencias([]); setCoordenacoes([])
    } finally {
      setLoadingRef(false)
    }
  }, [])

  useEffect(() => { loadRefData() }, [loadRefData])

  // Lista de entidades disponíveis conforme o nível selecionado
  const entityOptions = useMemo<{ id: number; name: string }[]>(() => {
    if (nivel === "direcao") return direcoes
    if (nivel === "gerencia") return gerencias
    if (nivel === "coordenacao") return coordenacoes
    return []
  }, [nivel, direcoes, gerencias, coordenacoes])

  // Ao mudar o nível, resetar entidade
  useEffect(() => { setSelectedEntity("0") }, [nivel])

  // Carrega gráficos sempre que filtros mudam
  const loadGraficos = useCallback(async () => {
    setLoadingData(true)
    try {
      let direcaoId = 0, managementId = 0, coordinationId = 0
      const entId = parseInt(selectedEntity)
      if (nivel === "direcao" && entId > 0) direcaoId = entId
      else if (nivel === "gerencia" && entId > 0) managementId = entId
      else if (nivel === "coordenacao" && entId > 0) coordinationId = entId
      const g = await getOrcamentoGraficos(direcaoId, ano, managementId, coordinationId)
      setGraficos(g)
    } catch {
      setGraficos(null)
    } finally {
      setLoadingData(false)
    }
  }, [nivel, selectedEntity, ano])

  useEffect(() => { loadGraficos() }, [loadGraficos])

  const chartData = (graficos?.distribuicao_financeira ?? []).map((d) => ({
    name: d.category,
    Total: d.total,
    Disponível: d.disponivel,
  }))

  const chartBody = loadingData ? (
    <div className="flex items-center justify-center h-full text-muted-foreground text-sm gap-2">
      <Loader2 className="h-4 w-4 animate-spin" /> Carregando...
    </div>
  ) : chartData.length > 0 ? (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
        <XAxis dataKey="name" tick={{ fontSize: 11, fill: chartText }} />
        <YAxis tick={{ fontSize: 10, fill: chartText }} tickFormatter={v => fmtShort(v)} />
        <Tooltip content={<Tip />} />
        <Legend formatter={(v) => <span className="text-xs text-muted-foreground">{v}</span>} />
        <Bar dataKey="Total"      fill={C.primary} radius={[4,4,0,0]} maxBarSize={60} />
        <Bar dataKey="Disponível" fill={C.success} radius={[4,4,0,0]} maxBarSize={60} />
      </BarChart>
    </ResponsiveContainer>
  ) : (
    <div className="flex items-center justify-center h-full text-muted-foreground text-sm">Sem dados</div>
  )

  const renderControls = (inModal: boolean) => (
    <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
      <Select value={String(ano)} onValueChange={(v) => setAno(parseInt(v))}>
        <SelectTrigger className="h-8 w-[80px] text-xs rounded-[10px]">
          <SelectValue placeholder="Ano" />
        </SelectTrigger>
        <SelectContent>
          {years.map((y) => (
            <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={nivel} onValueChange={(v) => setNivel(v as typeof nivel)} disabled={loadingRef}>
        <SelectTrigger className="h-8 w-[140px] text-xs rounded-[10px]">
          <SelectValue placeholder={loadingRef ? "Carregando..." : "Nível"} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="geral">Geral</SelectItem>
          <SelectItem value="direcao">Direção</SelectItem>
          <SelectItem value="gerencia">Gerência</SelectItem>
          <SelectItem value="coordenacao">Coordenação</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={selectedEntity}
        onValueChange={setSelectedEntity}
        disabled={loadingRef || nivel === "geral"}
      >
        <SelectTrigger className="h-8 w-[180px] text-xs rounded-[10px]">
          <SelectValue placeholder={
            nivel === "geral" ? "Todos"
              : loadingRef ? "Carregando..."
                : entityOptions.length === 0 ? "Nenhum"
                  : "Selecione"
          } />
        </SelectTrigger>
        <SelectContent>
          {nivel !== "geral" && (
            <SelectItem value="0">Todas</SelectItem>
          )}
          {entityOptions.map((e) => (
            <SelectItem key={e.id} value={e.id.toString()}>{e.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {!inModal && (
        <Button
          variant="ghost" size="icon"
          className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
          onClick={() => setExpanded(true)}
        >
          <Maximize2 className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  )

  return (
    <Card className="flex flex-col overflow-hidden">
      <CardHeader className="pb-1 shrink-0">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div className="min-w-0">
            <CardTitle className="text-sm font-semibold">Orçamento por Categoria</CardTitle>
            <CardDescription className="text-xs">Total vs Disponível (CAPEX/OPEX)</CardDescription>
          </div>
          {renderControls(false)}
        </div>
      </CardHeader>
      <CardContent className="flex-1 min-h-0 pt-0">{chartBody}</CardContent>

      {expanded && (
        <Dialog open onOpenChange={(v) => { if (!v) setExpanded(false) }}>
          <DialogContent
            className="flex flex-col gap-0 p-0 sm:max-w-[96vw] max-w-[96vw] max-h-[94vh] h-[94vh] overflow-hidden"
            onInteractOutside={(e) => {
              const target = e.target as HTMLElement | null
              if (target?.closest("[data-radix-select-content]")) e.preventDefault()
            }}
          >
            <DialogHeader className="px-4 py-2 border-b border-border shrink-0">
              <div className="flex items-center justify-between gap-2 pr-9">
                <div className="min-w-0">
                  <DialogTitle className="text-sm font-semibold">Orçamento por Categoria</DialogTitle>
                  <DialogDescription className="text-xs">Total vs Disponível (CAPEX/OPEX)</DialogDescription>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {renderControls(true)}
                </div>
              </div>
            </DialogHeader>
            <div className="flex-1 min-h-0 p-2">{chartBody}</div>
          </DialogContent>
        </Dialog>
      )}
    </Card>
  )
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function DashboardSkeleton() {
  return (
    <div className="h-full flex flex-col gap-3 overflow-hidden">
      <div className="flex items-center justify-between shrink-0">
        <div className="space-y-1"><Skeleton className="h-5 w-44" /><Skeleton className="h-3 w-52" /></div>
      </div>
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4 shrink-0">
        {[1,2,3,4].map(i => <Card key={i} className="p-4"><div className="space-y-2"><Skeleton className="h-3 w-24" /><Skeleton className="h-6 w-16" /></div></Card>)}
      </div>
      <Card className="flex-1 min-h-0"><CardContent className="pt-6 h-full"><Skeleton className="h-full w-full" /></CardContent></Card>
    </div>
  )
}

// ── Lists ─────────────────────────────────────────────────────────────────────
function ExpiringList({ items }: { items: any[] }) {
  if (!items.length) return <p className="text-sm text-muted-foreground text-center py-8">Nenhum contrato vence nos próximos 30 dias</p>
  return (
    <div className="space-y-2">
      {items.map((c: any) => {
        const days = c.expiration_date ? Math.ceil((new Date(c.expiration_date).getTime() - Date.now()) / 86400000) : null
        return (
          <div key={c.protocol_number} className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-amber-50/60 dark:bg-amber-500/8 border border-amber-100 dark:border-amber-500/15 hover:bg-amber-50 dark:hover:bg-amber-500/12 transition-colors">
            <div className="flex items-center gap-3">
              <Clock className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
              <div>
                <p className="text-sm font-semibold">{c.protocol_number}</p>
                <p className="text-xs text-muted-foreground">{days !== null ? `${days} dia(s)` : '—'}{c.main_inspector__full_name ? ` · ${c.main_inspector__full_name}` : ''}</p>
              </div>
            </div>
            <span className="text-sm font-bold text-amber-700 dark:text-amber-400 shrink-0">{fmtShort(parseFloat(c.current_value ?? 0))}</span>
          </div>
        )
      })}
    </div>
  )
}

function RecentList({ items }: { items: any[] }) {
  if (!items.length) return <p className="text-sm text-muted-foreground text-center py-8">Nenhum contrato criado nos últimos 7 dias</p>
  return (
    <div className="space-y-2">
      {items.map((c: any) => (
        <div key={c.protocol_number} className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-500/8 border border-emerald-100 dark:border-emerald-500/15 hover:bg-emerald-50 dark:hover:bg-emerald-500/12 transition-colors group">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <div>
              <p className="text-sm font-semibold">{c.protocol_number}</p>
              <p className="text-xs text-muted-foreground">{c.created_at ? fmtDate(c.created_at) : '—'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400">{fmtShort(parseFloat(c.original_value ?? 0))}</span>
            <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Main Page — único componente, dados já filtrados pelo backend ──────────────
export default function DashboardPage() {
  const { theme } = useTheme()
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)
  const [stats, setStats]     = useState<any>(null)

  const chartBg   = theme === 'dark' ? '#181e25' : '#ffffff'
  const chartText = theme === 'dark' ? '#8e8e93' : '#45515e'

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try { setStats(await fetchDashboardStats()) }
    catch { setError('Não foi possível carregar as métricas. Tente novamente.') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  if (loading) return <DashboardSkeleton />

  if (error) return (
    <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
      <AlertTriangle className="h-8 w-8 text-destructive" />
      <p className="text-sm">{error}</p>
      <Button variant="outline" size="sm" onClick={load}><RefreshCw className="h-3.5 w-3.5 mr-2" />Tentar novamente</Button>
    </div>
  )

  const contracts  = stats?.contracts  ?? {}
  const admin      = stats?.admin_stats ?? {}
  const expiring   = stats?.expiring_contracts ?? []
  const recent     = stats?.recent_contracts ?? []
  const aids       = stats?.aids ?? {}
  const isFullAccess = !!stats?.full_access
  const scopeName  = stats?.scope_name ?? 'Sistema'
  const scopeLevel = stats?.scope_level ?? 'funcionario'

  // Admin-only tabs (KPI cards)
  const showAdminTabs = isFullAccess

  // Scope badge label
  const scopeBadgeLabel: Record<string, string> = {
    admin: 'Visão Global', presidente: 'Visão Global',
    diretor: `Direção: ${scopeName}`, gerente: `Gerência: ${scopeName}`,
    coordenador: `Coordenação: ${scopeName}`, analista: `Coordenação: ${scopeName}`,
    funcionario: `Coordenação: ${scopeName}`,
  }

  const statusData = (stats?.status_breakdown ?? []).map((s: any, i: number) => ({
    ...s, color: [C.success, C.muted, C.danger][i] ?? C.muted,
  }))

  return (
    <div className="h-full flex flex-col gap-3 overflow-hidden pb-1">

      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-xl font-bold tracking-tight">
            Dashboard
          </h1>
          <p className="text-xs text-muted-foreground">
            {isFullAccess ? 'Visão global do sistema' : `Dados filtrados por: ${scopeName}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={`gap-1.5 px-2.5 py-1 text-xs ${isFullAccess ? 'bg-primary/10 text-primary border-primary/20' : 'bg-muted/60 text-foreground border-border/50'}`}>
            {isFullAccess && <Globe className="h-3 w-3" />}
            {scopeBadgeLabel[scopeLevel] ?? scopeName}
          </Badge>
          {(contracts.expiring_30_days ?? 0) > 0 && (
            <Badge className="gap-1.5 px-2.5 py-1 text-xs bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-300/40">
              <AlertTriangle className="h-3 w-3" /> {contracts.expiring_30_days} vencendo
            </Badge>
          )}
          <Badge variant="outline" className="gap-1.5 px-2.5 py-1 text-xs">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Ao vivo
          </Badge>
          <Button variant="ghost" size="icon" onClick={load} className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground">
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Tabs (menu de navegação da Dashboard) */}
      <Tabs defaultValue="overview" className="flex-1 min-h-0 flex flex-col">
        <TabsList className="shrink-0 w-fit h-8">
          <TabsTrigger value="overview"  className="text-xs h-7 px-3"><LayoutDashboard className="h-3 w-3 mr-1" />Visão Geral</TabsTrigger>
          <TabsTrigger value="orcamentos" className="text-xs h-7 px-3"><Layers className="h-3 w-3 mr-1" />Orçamentos</TabsTrigger>
          <TabsTrigger value="linhas" className="text-xs h-7 px-3"><Layers className="h-3 w-3 mr-1" />Linhas Orçamentárias</TabsTrigger>
          <TabsTrigger value="contratos" className="text-xs h-7 px-3"><FileText className="h-3 w-3 mr-1" />Contratos</TabsTrigger>
          <TabsTrigger value="auxilios" className="text-xs h-7 px-3"><Heart className="h-3 w-3 mr-1" />Auxílios</TabsTrigger>
        </TabsList>

      {/* KPI row — admin gets 5 cards, others get 4 */}
      <div className={`grid gap-3 grid-cols-2 shrink-0 mt-1 ${showAdminTabs ? 'lg:grid-cols-5' : 'lg:grid-cols-4'}`}>
        <KpiCard title="Contratos Ativos" value={contracts.active ?? 0}
          subtitle={`${contracts.expiring_30_days ?? 0} vencem em 30 dias`}
          icon={<FileText className="h-4 w-4 text-primary" />}
          accent="linear-gradient(90deg,#818cf8,#6366f1)" />

        <KpiCard title="Colaboradores" value={stats?.employees?.active ?? 0}
          subtitle={isFullAccess ? 'ativos no sistema' : 'ativos no escopo'}
          icon={<Users className="h-4 w-4 text-primary" />}
          accent="linear-gradient(90deg,#a78bfa,#8b5cf6)" />

        <KpiCard title="Orçamento" value={fmtShort(showAdminTabs ? (admin.budget_total ?? 0) : (stats?.budget?.total ?? 0))}
          subtitle={showAdminTabs ? `${fmtShort(admin.budget_available ?? 0)} disponível` : 'valor orçado'}
          icon={<DollarSign className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />}
          accent="linear-gradient(90deg,#10b981,#059669)" />

        <KpiCard title="Auxílios" value={stats?.aids?.total ?? 0}
          subtitle="cadastrados"
          icon={<Heart className="h-4 w-4 text-rose-500" />}
          accent="linear-gradient(90deg,#f43f5e,#e11d48)" />

        {/* Admin-only 5th card */}
        {showAdminTabs && (
          <KpiCard title="Linhas Ativas" value={admin.lines_active ?? 0}
            subtitle={`de ${admin.lines_total ?? 0} no total`}
            icon={<Layers className="h-4 w-4 text-blue-500" />}
            accent="linear-gradient(90deg,#3b82f6,#2563eb)" />
        )}
      </div>

        {/* ── Visão Geral ──────────────────────────────────────────────────── */}
        <TabsContent value="overview" className="flex-1 min-h-0 mt-3">
          <div className="h-full grid gap-3 lg:grid-cols-2">
            <BudgetByCategoryCard chartText={chartText} />

            <div className="grid gap-3 grid-rows-3">
              {[
                { label: 'Total de Contratos',    value: contracts.total ?? 0,   color: 'text-foreground',  bg: 'bg-muted/30' },
                { label: 'Contratos Vencidos',     value: contracts.expired ?? 0, color: 'text-destructive', bg: 'bg-destructive/5' },
                { label: 'Contratos Encerrados',   value: contracts.closed ?? 0,  color: 'text-muted-foreground', bg: '' },
              ].map(({ label, value, color, bg }) => (
                <Card key={label} className={`flex items-center px-5 py-3 ${bg}`}>
                  <div><p className="text-xs text-muted-foreground">{label}</p><p className={`text-2xl font-bold ${color}`}>{value}</p></div>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* ── Orçamentos ──────────────────────────────────────────────────── */}
        <TabsContent value="orcamentos" className="flex-1 min-h-0 mt-3 overflow-hidden">
          <BudgetByCategoryCard chartText={chartText} />
        </TabsContent>

        {/* ── Linhas Orçamentárias ───────────────────────────────────────── */}
        <TabsContent value="linhas" className="flex-1 min-h-0 mt-3 overflow-y-auto">
          {showAdminTabs ? (
            <div className="h-full grid gap-3 lg:grid-cols-3">
              {[
                { label: 'Linhas Totais',     value: admin.lines_total ?? 0,    color: 'text-foreground',  bg: 'bg-muted/30' },
                { label: 'Linhas Ativas',     value: admin.lines_active ?? 0,    color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50/60 dark:bg-emerald-500/8' },
                { label: 'Linhas Inativas',   value: Math.max(0, (admin.lines_total ?? 0) - (admin.lines_active ?? 0)), color: 'text-muted-foreground', bg: 'bg-muted/10' },
              ].map(({ label, value, color, bg }) => (
                <Card key={label} className={`flex flex-col items-center justify-center gap-2 py-10 ${bg}`}>
                  <Layers className="h-8 w-8 text-primary/60" />
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
                    <p className={`text-3xl font-bold ${color}`}>{value}</p>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
              Visualização disponível apenas para administradores.
            </div>
          )}
        </TabsContent>

        {/* ── Contratos ─────────────────────────────────────────────────── */}
        <TabsContent value="contratos" className="flex-1 min-h-0 mt-3 overflow-hidden">
          <div className="h-full grid gap-3 lg:grid-cols-2">
            <Card className="flex flex-col overflow-hidden">
              <CardHeader className="pb-1 shrink-0">
                <CardTitle className="text-sm font-semibold">Status dos Contratos</CardTitle>
                <CardDescription className="text-xs">
                  {isFullAccess ? `Total global: ${contracts.total ?? 0}` : `Total no escopo: ${contracts.total ?? 0}`}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 min-h-0 pt-0">
                {statusData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={statusData} cx="50%" cy="45%" innerRadius="30%" outerRadius="55%" paddingAngle={4} dataKey="value" animationDuration={600}>
                        {statusData.map((e: any, i: number) => <Cell key={i} fill={e.color} stroke={chartBg} strokeWidth={2} />)}
                      </Pie>
                      <Tooltip content={<Tip />} />
                      <Legend verticalAlign="bottom" height={32} formatter={(v) => <span className="text-xs text-muted-foreground">{v}</span>} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground text-sm">Sem dados</div>
                )}
              </CardContent>
            </Card>

            <div className="grid gap-3 grid-rows-2 min-h-0">
              <Card className="flex flex-col overflow-hidden min-h-0">
                <CardHeader className="pb-3 shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-amber-500/10"><AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" /></div>
                    <div>
                      <CardTitle className="text-sm font-semibold">Vencendo nos próximos 30 dias</CardTitle>
                      <CardDescription className="text-xs">{expiring.length} encontrado(s)</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 overflow-y-auto flex-1 min-h-0"><ExpiringList items={expiring} /></CardContent>
              </Card>

              <Card className="flex flex-col overflow-hidden min-h-0">
                <CardHeader className="pb-3 shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-emerald-500/10"><CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /></div>
                    <div>
                      <CardTitle className="text-sm font-semibold">Contratos recentes (últimos 7 dias)</CardTitle>
                      <CardDescription className="text-xs">{recent.length} novo(s)</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 overflow-y-auto flex-1 min-h-0"><RecentList items={recent} /></CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* ── Auxílios ──────────────────────────────────────────────────── */}
        <TabsContent value="auxilios" className="flex-1 min-h-0 mt-3 overflow-y-auto">
          <div className="h-full grid gap-3 lg:grid-cols-3">
            {[
              { label: 'Auxílios Cadastrados', value: aids.total ?? 0, color: 'text-rose-500', bg: 'bg-rose-50/60 dark:bg-rose-500/8', icon: <Heart className="h-8 w-8 text-rose-400/60" /> },
              { label: 'Contratos Ativos',     value: contracts.active ?? 0, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50/60 dark:bg-emerald-500/8', icon: <FileText className="h-8 w-8 text-emerald-500/60" /> },
              { label: 'Colaboradores Ativos', value: stats?.employees?.active ?? 0, color: 'text-primary', bg: 'bg-primary/5', icon: <Users className="h-8 w-8 text-primary/60" /> },
            ].map(({ label, value, color, bg, icon }) => (
              <Card key={label} className={`flex flex-col items-center justify-center gap-2 py-10 ${bg}`}>
                {icon}
                <div className="text-center">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
                  <p className={`text-3xl font-bold ${color}`}>{value}</p>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* ── Top Fiscais (admin global ou diretor/gerente scoped) ─────────── */}
        {/* (removido) */}

        {/* ── Vencimentos ──────────────────────────────────────────────────── */}
        {/* (removido) */}

        {/* ── Recentes ─────────────────────────────────────────────────────── */}
        {/* (removido) */}

        {/* ── Maiores Contratos (admin only) ───────────────────────────────── */}
        {/* (removido) */}

        {/* ── Financeiro (admin only) ──────────────────────────────────────── */}
        {/* (removido) */}
      </Tabs>
    </div>
  )
}
