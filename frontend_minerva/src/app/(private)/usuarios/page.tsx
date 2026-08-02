"use client"

import { useCallback, useEffect, useMemo, useRef, useState, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Mail, Shield, Users, ShieldCheck } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CrudTablePage } from "@/components/common/CrudTablePage"
import { DataTable } from "@/components/ui/data-table"
import { useAuthContext } from "@/context/AuthContext"
import { toast } from "@/hooks/use-toast"
import { useCrudTable } from "@/hooks/useCrudTable"
import { UserService, InviteService } from "@/services"
import {
  UserForm,
  InviteForm,
  PermissionsTab,
  userColumns,
  makeInviteColumns,
} from "@/features/usuarios"
import { type AdminUser, type UserInvitation } from "@/lib/api/users"



const userServiceAdapter = {
  fetch: UserService.fetchUsers,
  create: UserService.createUser,
  update: UserService.updateUser,
  toggleStatus: UserService.toggleUserStatus,
}

const inviteServiceAdapter = {
  fetch: InviteService.fetchInvites,
  create: InviteService.createInvite,
}



function InvitesSection({ autoOpenForm }: { autoOpenForm: boolean }) {
  const {
    items, page, pageSize, totalCount, initialFilters,
    formOpen, handleAdd, handleCloseForm,
    handleFilterChange, handleSortingChange, handlePageChange, handlePageSizeChange,
    loadItems,
  } = useCrudTable<UserInvitation>({ service: inviteServiceAdapter })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [resendingId, setResendingId] = useState<number | null>(null)
  const [cancellingId, setCancellingId] = useState<number | null>(null)
  const autoOpenDone = useRef(false)

  useEffect(() => {
    if (autoOpenForm && !autoOpenDone.current) {
      autoOpenDone.current = true
      handleAdd()
    }
  }, [autoOpenForm, handleAdd])

  const handleResend = useCallback(async (invite: UserInvitation) => {
    setResendingId(invite.id)
    try {
      await InviteService.resendInvite(invite.id)
      toast({ title: "Convite reenviado!", description: `Novo link enviado para ${invite.email}` })
      loadItems()
    } catch (err: any) {
      toast({ title: "Erro ao reenviar", description: err.message, variant: "destructive" })
    } finally {
      setResendingId(null)
    }
  }, [loadItems])

  const handleCancel = useCallback(async (invite: UserInvitation) => {
    setCancellingId(invite.id)
    try {
      await InviteService.cancelInvite(invite.id)
      toast({ title: "Convite cancelado." })
      loadItems()
    } catch (err: any) {
      toast({ title: "Erro ao cancelar", description: err.message, variant: "destructive" })
    } finally {
      setCancellingId(null)
    }
  }, [loadItems])

  const handleFormSubmit = async (data: { email: string; group: string }) => {
    setIsSubmitting(true)
    try {
      await InviteService.createInvite(data)
      toast({ title: "Convite enviado!", description: `Link enviado para ${data.email}` })
      loadItems()
      handleCloseForm()
    } catch (err: any) {
      toast({ title: "Erro ao enviar convite", description: err.message, variant: "destructive" })
      throw err
    } finally {
      setIsSubmitting(false)
    }
  }

  const columns = useMemo(
    () => makeInviteColumns({ onResend: handleResend, onCancel: handleCancel, resendingId, cancellingId }),
    [handleResend, handleCancel, resendingId, cancellingId]
  )

  return (
    <div className="w-full py-1">
      <div className="space-y-2">
        <DataTable
          columns={columns}
          data={items}
          title="Convites"
          subtitle="Gerencie os convites de acesso enviados por e-mail."
          pageSize={pageSize}
          pageIndex={page - 1}
          totalCount={totalCount}
          initialFilters={initialFilters}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          onAdd={handleAdd}
          addLabel="Convidar"
          onFilterChange={handleFilterChange}
          onSortingChange={handleSortingChange}
        />

        <InviteForm
          open={formOpen}
          handleClose={handleCloseForm}
          initialData={null}
          onSubmit={handleFormSubmit}
          isSubmitting={isSubmitting}
        />
      </div>
    </div>
  )
}



function UsuariosPageContent() {
  const { user } = useAuthContext()
  const searchParams = useSearchParams()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("users")
  const [autoOpenInvite, setAutoOpenInvite] = useState(false)

  useEffect(() => {
    if (searchParams.get("invite") === "1") {
      setActiveTab("invites")
      setAutoOpenInvite(true)
      router.replace("/usuarios")
    }
  }, [searchParams, router])

  if (!user?.is_superuser) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="space-y-2 text-center">
          <Shield className="mx-auto h-12 w-12 text-muted-foreground/30" />
          <p className="font-medium">Acesso restrito</p>
          <p className="text-sm text-muted-foreground">Apenas administradores podem acessar esta página.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full px-2 py-1">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-2">
        <TabsList className="mb-1">
          <TabsTrigger value="users" className="gap-2">
            <Users className="h-4 w-4" />
            Usuários
          </TabsTrigger>
          <TabsTrigger value="invites" className="gap-2">
            <Mail className="h-4 w-4" />
            Convites
          </TabsTrigger>
          <TabsTrigger value="permissions" className="gap-2">
            <ShieldCheck className="h-4 w-4" />
            Permissões
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="mt-0">
          <CrudTablePage<AdminUser>
            columns={userColumns}
            service={userServiceAdapter}
            entityName="usuário"
            entityNamePlural="usuários"
            title="Usuários"
            subtitle="Gerencie as contas de acesso ao sistema."
            FormComponent={UserForm}
            refreshKey="usuarios"
            hideRowActionsUntilSelected
            deleteDialogTitle={(u) => (u.is_active ? "Desativar usuário" : "Ativar usuário")}
            deleteDialogDescription={(u) =>
              u.is_active
                ? `O usuário ${u.name} perderá acesso ao sistema imediatamente.`
                : `O usuário ${u.name} voltará a ter acesso ao sistema.`
            }
            deleteDialogConfirmText="Confirmar"
          />
        </TabsContent>

        <TabsContent value="invites" className="mt-0">
          <InvitesSection autoOpenForm={autoOpenInvite} />
        </TabsContent>

        <TabsContent value="permissions" className="mt-0">
          <div className="w-full py-1">
            <PermissionsTab />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default function UsuariosPage() {
  return (
    <Suspense>
      <UsuariosPageContent />
    </Suspense>
  )
}
