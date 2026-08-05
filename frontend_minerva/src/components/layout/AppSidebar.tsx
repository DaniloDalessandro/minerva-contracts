"use client"

import * as React from "react"
import {
  Users,
  HandCoins,
  FileText,
  Landmark,
  Wallet,
  Building2,
  Layers,
  Bot,
  BarChart3,
  HelpCircle,
  UserCog,
  Share2,
  type LucideIcon,
} from "lucide-react"
import { useAuthContext } from "@/context/AuthContext"
import { usePermissions } from "@/hooks/usePermissions"
import { useDataRefresh } from "@/context"
import { toast } from "@/hooks/use-toast"

import { createColaboradorAPI as createColaborador } from "@/lib/api/colaboradores"
import { createAuxilio } from "@/lib/api/auxilios"
import { createContract } from "@/lib/api/contratos"
import { createBudgetLine } from "@/lib/api/budgetlines"
import { createBudget } from "@/lib/api/budgets"
import { createDirection } from "@/lib/api/directions"
import { createManagement } from "@/lib/api/managements"
import { createCoordination } from "@/lib/api/coordinations"
import { createManagementCenter, createRequestingCenter } from "@/lib/api/centers"
import { NavMain, NavUser } from "@/components/layout"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { usePathname } from "next/navigation"

import { useRouter } from "next/navigation"
import { ColaboradorForm } from "@/features/colaboradores"
import { AuxilioForm } from "@/features/auxilios"
import { ContractForm } from "@/features/contratos"
import { BudgetLineForm, BudgetForm } from "@/features/orcamento"
import { DirectionForm, ManagementForm, CoordinationForm } from "@/features/setor"
import { ManagementCenterForm, RequestingCenterForm } from "@/features/centro"

interface NavItem {
  title: string
  url: string
  icon: LucideIcon
  isActive?: boolean
  items?: {
    title: string
    url: string
    action?: string
  }[]
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuthContext()
  const {
    isSuperuser,
    canManageSetor,
    canManageCentro,
    canManageColaboradores,
    canManageOrcamento,
    canManageLinhas,
    canManageContratos,
    canManageAuxilios,
  } = usePermissions()
  const { refreshData: triggerRefresh } = useDataRefresh()
  const pathname = usePathname()
  const router = useRouter()

  // GERENTE+ can view all modules even if they can't add everything
  const canViewOperacional = canManageColaboradores || canManageContratos

  const [dialogState, setDialogState] = React.useState({
    colaborador: false,
    auxilio: false,
    contrato: false,
    linhaOrcamentaria: false,
    orcamento: false,
    centro: false,
    centroSolicitante: false,
    direcao: false,
    gerencia: false,
    coordenacao: false,
  })

  const openFormDialog = (formType: string) => {
    if (formType === 'convidarUsuario') {
      router.push('/usuarios?invite=1')
      return
    }
    setDialogState(prev => ({ ...prev, [formType]: true }))
  }

  const closeFormDialog = (formType: keyof typeof dialogState) => {
    setDialogState(prev => ({ ...prev, [formType]: false }))
  }

  const navItems: NavItem[] = [
    // ── Visible to everyone ────────────────────────────────────────────────
    {
      title: "Dashboards",
      url: "/dashboard",
      icon: BarChart3,
      items: [{ title: "Visão Geral", url: "/dashboard" }],
    },
    {
      title: "Convites",
      url: "/convites",
      icon: Share2,
      items: [
        { title: "Orçamentos", url: "/convites?tab=budgets" },
        { title: "Linhas Orçamentárias", url: "/convites?tab=budget-lines" },
        { title: "Contratos", url: "/convites?tab=contracts" },
      ],
    },

    // ── Admin (superuser) only ─────────────────────────────────────────────
    ...(isSuperuser ? [{
      title: "Usuários",
      url: "/usuarios",
      icon: UserCog,
      items: [
        { title: "Gerenciar usuários", url: "/usuarios" },
        { title: "Convidar por e-mail", url: "/usuarios", action: "convidarUsuario" },
      ],
    } as NavItem] : []),

    // ── Colaboradores — GERENTE+ ───────────────────────────────────────────
    ...(canManageColaboradores ? [{
      title: "Colaboradores",
      url: "/colaboradores",
      icon: Users,
      items: [
        { title: "Buscar", url: "/colaboradores" },
        { title: "Adicionar", url: "/colaboradores", action: "colaborador" },
      ],
    } as NavItem] : []),

    // ── Auxílios — COORDENADOR+ ────────────────────────────────────────────
    ...(canManageAuxilios ? [{
      title: "Auxílios",
      url: "/auxilios",
      icon: HandCoins,
      items: [
        { title: "Buscar", url: "/auxilios" },
        { title: "Adicionar", url: "/auxilios", action: "auxilio" },
      ],
    } as NavItem] : []),

    // ── Contratos — COORDENADOR / ANALISTA+ ───────────────────────────────
    ...(canManageContratos ? [{
      title: "Contratos",
      url: "/contratos",
      icon: FileText,
      items: [
        { title: "Buscar", url: "/contratos" },
        { title: "Adicionar", url: "/contratos", action: "contrato" },
      ],
    } as NavItem] : []),

    // ── Linhas Orçamentárias — GERENTE+ ───────────────────────────────────
    ...(canManageLinhas ? [{
      title: "Linhas Orçamentárias",
      url: "/linhas-orcamentarias",
      icon: Landmark,
      items: [
        { title: "Buscar", url: "/linhas-orcamentarias" },
        { title: "Adicionar", url: "/linhas-orcamentarias", action: "linhaOrcamentaria" },
      ],
    } as NavItem] : []),

    // ── Orçamentos — DIRETOR+ (isAdmin) ───────────────────────────────────
    ...(canManageOrcamento ? [{
      title: "Orçamentos",
      url: "/orcamento",
      icon: Wallet,
      items: [
        { title: "Buscar", url: "/orcamento" },
        { title: "Adicionar", url: "/orcamento", action: "orcamento" },
      ],
    } as NavItem] : []),

    // ── Setores — DIRETOR+ (isAdmin) ──────────────────────────────────────
    ...(canManageSetor ? [{
      title: "Setores",
      url: "/setor",
      icon: Building2,
      items: [
        { title: "Buscar", url: "/setor" },
        { title: "Adicionar Direção", url: "/setor", action: "direcao" },
        { title: "Adicionar Gerência", url: "/setor", action: "gerencia" },
        { title: "Adicionar Coordenação", url: "/setor", action: "coordenacao" },
      ],
    } as NavItem] : []),

    // ── Centros — GERENTE+ ────────────────────────────────────────────────
    ...(canManageCentro ? [{
      title: "Centros",
      url: "/centro",
      icon: Layers,
      items: [
        { title: "Buscar", url: "/centro" },
        { title: "Adicionar Centro Gestor", url: "/centro", action: "centro" },
        { title: "Adicionar Centro Solicitante", url: "/centro", action: "centroSolicitante" },
      ],
    } as NavItem] : []),

    // ── Visible to everyone ────────────────────────────────────────────────
    {
      title: "Fale com Alice",
      url: "/alice",
      icon: Bot,
      items: [
        { title: "Nova Conversa", url: "/alice" },
        { title: "Histórico", url: "/alice/historico" },
      ],
    },
    {
      title: "Ajuda",
      url: "/ajuda",
      icon: HelpCircle,
    },
  ]

  if (!user) return null

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="group-data-[collapsible=icon]:p-0 border-b border-sidebar-border/60">
        <div className="flex h-14 items-center px-4 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
          <div className="flex items-center gap-3 group-data-[collapsible=icon]:gap-0">

            <div className="relative shrink-0">
              <div className="absolute inset-0 rounded-xl bg-primary/40 blur-md" />
              <div className="relative bg-gradient-to-br from-primary to-[#3daeff] text-white flex aspect-square size-10 items-center justify-center rounded-xl shadow-sm">
                <svg
                  className="size-6"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 22V8M5 12H2a10 10 0 0 0 20 0h-3M12 8a4 4 0 0 0-4 4v0a4 4 0 0 0 4 4v0a4 4 0 0 0 4-4v0a4 4 0 0 0-4-4Z" />
                </svg>
              </div>
            </div>

            <div className="grid flex-1 text-left leading-tight group-data-[collapsible=icon]:hidden">
              <span className="truncate font-semibold text-sm tracking-tight">Minerva</span>
              <span className="truncate text-xs text-muted-foreground">Gestão de Contratos</span>
            </div>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <NavMain
          items={navItems.map((item) => ({
            title: item.title,
            url: item.url,
            icon: item.icon,
            isActive: item.isActive,
          }))}
          onFormAction={openFormDialog}
        />
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border/60">
        <NavUser
          user={{
            name: (() => {
              const raw = (user.name || "").replace(/^Employee\s+/i, "")
              return raw && !raw.includes("@") ? raw : user.email.split("@")[0]
            })(),
            email: user.email,
            avatar: user.avatar || "/avatars/default.svg",
          }}
        />
      </SidebarFooter>

      <SidebarRail />


      {dialogState.colaborador && (
        <ColaboradorForm
          open={dialogState.colaborador}
          handleClose={() => closeFormDialog('colaborador')}
          initialData={null}
          onSubmit={async (data) => {
            try {
              await createColaborador(data)
              toast({ title: "Sucesso", description: "Colaborador criado com sucesso!" })
              closeFormDialog('colaborador')
              triggerRefresh('colaboradores')
            } catch (error: any) {
              toast({ title: "Erro", description: error.message || "Erro ao criar colaborador", variant: "destructive" })
            }
          }}
        />
      )}

      {dialogState.auxilio && (
        <AuxilioForm
          open={dialogState.auxilio}
          handleClose={() => closeFormDialog('auxilio')}
          initialData={null}
          onSubmit={async (data) => {
            try {
              await createAuxilio(data)
              toast({ title: "Sucesso", description: "Auxílio criado com sucesso!" })
              closeFormDialog('auxilio')
              triggerRefresh('auxilios')
            } catch (error: any) {
              toast({ title: "Erro", description: error.message || "Erro ao criar auxílio", variant: "destructive" })
            }
          }}
        />
      )}

      {dialogState.contrato && (
        <ContractForm
          open={dialogState.contrato}
          handleClose={() => closeFormDialog('contrato')}
          initialData={null}
          onSubmit={async (data) => {
            try {
              await createContract(data)
              toast({ title: "Sucesso", description: "Contrato criado com sucesso!" })
              closeFormDialog('contrato')
              triggerRefresh('contratos')
            } catch (error: any) {
              toast({ title: "Erro", description: error.message || "Erro ao criar contrato", variant: "destructive" })
            }
          }}
        />
      )}

      {dialogState.linhaOrcamentaria && (
        <BudgetLineForm
          open={dialogState.linhaOrcamentaria}
          handleClose={() => closeFormDialog('linhaOrcamentaria')}
          initialData={null}
          onSubmit={async (data) => {
            try {
              await createBudgetLine(data)
              toast({ title: "Sucesso", description: "Linha Orçamentária criada com sucesso!" })
              closeFormDialog('linhaOrcamentaria')
              triggerRefresh('linhas-orcamentarias')
            } catch (error: any) {
              toast({ title: "Erro", description: error.message || "Erro ao criar linha orçamentária", variant: "destructive" })
            }
          }}
        />
      )}

      {dialogState.orcamento && (
        <BudgetForm
          open={dialogState.orcamento}
          handleClose={() => closeFormDialog('orcamento')}
          initialData={null}
          onSubmit={async (data) => {
            try {
              await createBudget(data)
              toast({ title: "Sucesso", description: "Orçamento criado com sucesso!" })
              closeFormDialog('orcamento')
              triggerRefresh('orcamentos')
            } catch (error: any) {
              toast({ title: "Erro", description: error.message || "Erro ao criar orçamento", variant: "destructive" })
            }
          }}
        />
      )}

      {dialogState.centro && (
        <ManagementCenterForm
          open={dialogState.centro}
          handleClose={() => closeFormDialog('centro')}
          initialData={null}
          onSubmit={async (data) => {
            try {
              await createManagementCenter(data)
              toast({ title: "Sucesso", description: "Centro Gestor criado com sucesso!" })
              closeFormDialog('centro')
              triggerRefresh('centros')
            } catch (error: any) {
              toast({ title: "Erro", description: error.message || "Erro ao criar centro gestor", variant: "destructive" })
            }
          }}
        />
      )}

      {dialogState.centroSolicitante && (
        <RequestingCenterForm
          open={dialogState.centroSolicitante}
          handleClose={() => closeFormDialog('centroSolicitante')}
          initialData={null}
          onSubmit={async (data) => {
            try {
              await createRequestingCenter(data)
              toast({ title: "Sucesso", description: "Centro Solicitante criado com sucesso!" })
              closeFormDialog('centroSolicitante')
              triggerRefresh('centros')
            } catch (error: any) {
              toast({ title: "Erro", description: error.message || "Erro ao criar centro solicitante", variant: "destructive" })
            }
          }}
        />
      )}

      {dialogState.direcao && (
        <DirectionForm
          open={dialogState.direcao}
          handleClose={() => closeFormDialog('direcao')}
          initialData={null}
          onSubmit={async (data) => {
            try {
              await createDirection({ name: data.name })
              toast({ title: "Sucesso", description: "Direção criada com sucesso!" })
              closeFormDialog('direcao')
              triggerRefresh('setores')
            } catch (error: any) {
              toast({ title: "Erro", description: error.message || "Erro ao criar direção", variant: "destructive" })
            }
          }}
        />
      )}

      {dialogState.gerencia && (
        <ManagementForm
          open={dialogState.gerencia}
          handleClose={() => closeFormDialog('gerencia')}
          initialData={null}
          onSubmit={async (data) => {
            try {
              await createManagement({ name: data.name, direction_id: data.direction_id })
              toast({ title: "Sucesso", description: "Gerência criada com sucesso!" })
              closeFormDialog('gerencia')
              triggerRefresh('setores')
            } catch (error: any) {
              toast({ title: "Erro", description: error.message || "Erro ao criar gerência", variant: "destructive" })
            }
          }}
        />
      )}

      {dialogState.coordenacao && (
        <CoordinationForm
          open={dialogState.coordenacao}
          handleClose={() => closeFormDialog('coordenacao')}
          initialData={null}
          onSubmit={async (data) => {
            try {
              await createCoordination({ name: data.name, management_id: data.management_id })
              toast({ title: "Sucesso", description: "Coordenação criada com sucesso!" })
              closeFormDialog('coordenacao')
              triggerRefresh('setores')
            } catch (error: any) {
              toast({ title: "Erro", description: error.message || "Erro ao criar coordenação", variant: "destructive" })
            }
          }}
        />
      )}
    </Sidebar>
  )
}
