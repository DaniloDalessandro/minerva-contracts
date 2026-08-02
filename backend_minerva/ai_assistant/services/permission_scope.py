"""
PermissionScope — escopo de permissões para o agente Alice.

Garante que o agente somente consulte dados que o usuário tem permissão de ver,
seguindo o mesmo modelo RBAC do restante do sistema:

  PRESIDENTE / DIRETOR → vê tudo
  GERENTE              → vê apenas sua gerência
  COORDENADOR          → vê apenas sua coordenação
  FUNCIONARIO          → vê apenas sua coordenação

Cada método retorna um QuerySet já filtrado pelo escopo do usuário.
"""
import logging
from typing import Optional

logger = logging.getLogger(__name__)


class PermissionScope:
    """
    Centraliza a lógica de escopo de acesso para os agentes Alice.

    Uso:
        scope = PermissionScope(user)
        contracts = scope.contracts()
        employees = scope.employees()
    """

    FULL_ACCESS_ROLES = {'PRESIDENTE', 'DIRETOR'}
    MANAGEMENT_ROLES = {'GERENTE'}
    COORDINATION_ROLES = {'COORDENADOR', 'FUNCIONARIO'}

    def __init__(self, user=None):
        self.user = user
        self._employee = getattr(user, 'employee', None) if user else None

        if user is None:
            self._group = None
        elif getattr(user, 'is_superuser', False):
            # Superusuário (admin) tem acesso total independentemente de perfil
            self._group = 'PRESIDENTE'
        else:
            # Lê o primeiro grupo do usuário (ex: 'PRESIDENTE', 'GERENTE', etc.)
            try:
                self._group = user.groups.values_list('name', flat=True).first()
            except Exception:
                self._group = getattr(user, 'group', None)

    @property
    def is_full_access(self) -> bool:
        # Sem usuário autenticado → acesso total (backward compat / testes internos)
        if self.user is None:
            return True
        # Superusuário sempre tem acesso total
        if getattr(self.user, 'is_superuser', False):
            return True
        return self._group in self.FULL_ACCESS_ROLES

    @property
    def _direction(self):
        if self._employee:
            return getattr(self._employee, 'direction', None)
        return None

    @property
    def _management(self):
        if self._employee:
            return getattr(self._employee, 'management', None)
        return None

    @property
    def _coordination(self):
        if self._employee:
            return getattr(self._employee, 'coordination', None)
        return None

    # ------------------------------------------------------------------
    # Contratos
    # ------------------------------------------------------------------
    def contracts(self):
        from contract.models import Contract
        if not self.user or self.is_full_access:
            return Contract.objects.all()
        if self._group in self.MANAGEMENT_ROLES and self._management:
            return Contract.get_objects_by_management(self._management)
        if self._coordination:
            return Contract.get_objects_by_coordination(self._coordination)
        return Contract.objects.none()

    # ------------------------------------------------------------------
    # Funcionários
    # ------------------------------------------------------------------
    def employees(self):
        from employee.models import Employee
        if not self.user or self.is_full_access:
            return Employee.objects.all()
        if self._group in self.MANAGEMENT_ROLES and self._management:
            return Employee.objects.filter(management=self._management)
        if self._coordination:
            return Employee.objects.filter(coordination=self._coordination)
        return Employee.objects.none()

    # ------------------------------------------------------------------
    # Orçamentos
    # ------------------------------------------------------------------
    def budgets(self):
        from budget.models import Budget
        if not self.user or self.is_full_access:
            return Budget.objects.all()
        # Orçamentos vinculados ao centro de custo da coordenação/gerência do usuário
        if self._group in self.MANAGEMENT_ROLES and self._management:
            return Budget.objects.filter(management_center__management=self._management)
        if self._coordination:
            return Budget.objects.filter(management_center__coordination=self._coordination)
        return Budget.objects.none()

    # ------------------------------------------------------------------
    # Auxílios
    # ------------------------------------------------------------------
    def aids(self):
        from aid.models import Aid
        if not self.user or self.is_full_access:
            return Aid.objects.all()
        if self._coordination:
            return Aid.objects.filter(employee__coordination=self._coordination)
        return Aid.objects.none()

    # ------------------------------------------------------------------
    # Notificações
    # ------------------------------------------------------------------
    def notifications(self):
        from notifications.models import ContractNotification
        if not self.user or self.is_full_access:
            return ContractNotification.objects.all()
        contracts_qs = self.contracts()
        return ContractNotification.objects.filter(contract__in=contracts_qs)

    # ------------------------------------------------------------------
    # Descrição textual do escopo (para logs / debug)
    # ------------------------------------------------------------------
    def describe(self) -> str:
        if not self.user:
            return "sem autenticação (escopo total)"
        if self.is_full_access:
            return f"{self.user.username} ({self._group}) — acesso total"
        if self._group in self.MANAGEMENT_ROLES and self._management:
            return f"{self.user.username} ({self._group}) — gerência: {self._management}"
        if self._coordination:
            return f"{self.user.username} ({self._group}) — coordenação: {self._coordination}"
        return f"{self.user.username} ({self._group}) — escopo vazio"
