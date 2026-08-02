import { useAuthContext } from "@/context/AuthContext"

type Role = 'PRESIDENTE' | 'DIRETOR' | 'GERENTE' | 'COORDENADOR' | 'ANALISTA' | 'FUNCIONARIO'

const ROLE_LEVEL: Record<Role, number> = {
  PRESIDENTE: 5,
  DIRETOR: 4,
  GERENTE: 3,
  COORDENADOR: 2,
  ANALISTA: 1,
  FUNCIONARIO: 1,
}

function getHighestRole(groups: string[]): Role {
  if (!groups?.length) return 'FUNCIONARIO'
  return groups.reduce<Role>((highest, g) => {
    const level = ROLE_LEVEL[g as Role] ?? 0
    return level > (ROLE_LEVEL[highest] ?? 0) ? (g as Role) : highest
  }, 'FUNCIONARIO')
}

export function usePermissions() {
  const { user } = useAuthContext()
  const isSuperuser = user?.is_superuser ?? false
  const role = getHighestRole(user?.groups ?? [])
  const level = ROLE_LEVEL[role] ?? 1
  const isAnalista = role === 'ANALISTA'

  const isAdmin        = isSuperuser || level >= ROLE_LEVEL.DIRETOR
  const isManager      = isSuperuser || level >= ROLE_LEVEL.GERENTE
  const isCoordinator  = isSuperuser || level >= ROLE_LEVEL.COORDENADOR

  return {
    role,
    isSuperuser,
    canManageSetor: isAdmin,
    canManageCentro: isManager,
    canManageColaboradores: isManager,
    canManageOrcamento: isAdmin,
    canManageLinhas: isManager,
    canManageContratos: isCoordinator || isAnalista,
    canManageAuxilios: isCoordinator,
  }
}
