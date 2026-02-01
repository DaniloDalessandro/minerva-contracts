import logging
from django.contrib.auth.models import Permission
from django.contrib.contenttypes.models import ContentType
from django.db import models

logger = logging.getLogger(__name__)

# DEPRECATED: This mixin has been moved to accounts.mixins.HierarchicalQuerysetMixin
# This placeholder is kept for backwards compatibility during migration
# TODO: Remove this after all imports are updated to use accounts.mixins

class HierarchicalPermissionMixin:
    """
    DEPRECATED: Use accounts.mixins.HierarchicalQuerysetMixin instead.

    This mixin has been consolidated into accounts.mixins to avoid confusion
    between queryset-level and instance-level permission mixins.
    """

    @classmethod
    def get_user_accessible_objects(cls, user):
        """DEPRECATED: Import from accounts.mixins.HierarchicalQuerysetMixin"""
        from .mixins import HierarchicalQuerysetMixin
        return HierarchicalQuerysetMixin.get_user_accessible_objects(cls, user)

    @classmethod
    def get_objects_by_direction(cls, direction):
        """Implementar em cada modelo específico"""
        return cls.objects.none()

    @classmethod
    def get_objects_by_management(cls, management):
        """Implementar em cada modelo específico"""
        return cls.objects.none()

    @classmethod
    def get_objects_by_coordination(cls, coordination):
        """Implementar em cada modelo específico"""
        return cls.objects.none()

    @classmethod
    def get_objects_by_user(cls, user):
        """Implementar em cada modelo específico"""
        return cls.objects.none()


def create_custom_permissions():
    """
    Cria permissões personalizadas para o sistema hierárquico
    """
    custom_permissions = [
        # Permissões de Budget
        ('view_all_budgets', 'Pode ver todos os orçamentos'),
        ('view_direction_budgets', 'Pode ver orçamentos da direção'),
        ('view_management_budgets', 'Pode ver orçamentos da gerência'),
        ('view_coordination_budgets', 'Pode ver orçamentos da coordenação'),
        
        # Permissões de Contract
        ('view_all_contracts', 'Pode ver todos os contratos'),
        ('view_direction_contracts', 'Pode ver contratos da direção'),
        ('view_management_contracts', 'Pode ver contratos da gerência'),
        ('view_coordination_contracts', 'Pode ver contratos da coordenação'),
        
        # Permissões de BudgetLine
        ('view_all_budgetlines', 'Pode ver todas as linhas orçamentárias'),
        ('view_direction_budgetlines', 'Pode ver linhas orçamentárias da direção'),
        ('view_management_budgetlines', 'Pode ver linhas orçamentárias da gerência'),
        ('view_coordination_budgetlines', 'Pode ver linhas orçamentárias da coordenação'),
        
        # Permissões de Aid
        ('view_all_aids', 'Pode ver todos os auxílios'),
        ('view_direction_aids', 'Pode ver auxílios da direção'),
        ('view_management_aids', 'Pode ver auxílios da gerência'),
        ('view_coordination_aids', 'Pode ver auxílios da coordenação'),
    ]
    
    # Buscar content types para cada app
    apps_content_types = {
        'budget': ContentType.objects.filter(app_label='budget').first(),
        'contract': ContentType.objects.filter(app_label='contract').first(),
        'budgetline': ContentType.objects.filter(app_label='budgetline').first(),
        'aid': ContentType.objects.filter(app_label='aid').first(),
    }
    
    created_permissions = []
    
    for codename, name in custom_permissions:
        # Determinar qual app baseado no codename
        app_name = None
        if 'budget' in codename and 'budgetline' not in codename:
            app_name = 'budget'
        elif 'contract' in codename:
            app_name = 'contract'
        elif 'budgetline' in codename:
            app_name = 'budgetline'
        elif 'aid' in codename:
            app_name = 'aid'
        
        if app_name and apps_content_types[app_name]:
            permission, created = Permission.objects.get_or_create(
                codename=codename,
                name=name,
                content_type=apps_content_types[app_name]
            )
            if created:
                created_permissions.append(permission)
    
    return created_permissions


def create_coordination_groups():
    """
    Cria um grupo para cada coordenação existente no sistema
    """
    from django.contrib.auth.models import Group, Permission
    from sector.models import Coordination
    
    created_groups = []
    
    # Permissões básicas para membros de coordenação
    coordination_permissions = [
        'view_coordination_budgets', 'change_budget',
        'view_coordination_contracts', 'change_contract', 
        'view_coordination_budgetlines', 'change_budgetline',
        'view_coordination_aids', 'change_assistance',
    ]
    
    # Criar grupo para cada coordenação
    for coordination in Coordination.objects.all():
        group_name = f"Coordenação - {coordination.name}"
        group, created = Group.objects.get_or_create(name=group_name)
        
        if created or not group.permissions.exists():
            # Limpar permissões existentes se grupo já existe
            group.permissions.clear()
            
            # Adicionar permissões específicas de coordenação
            for codename in coordination_permissions:
                try:
                    permission = Permission.objects.get(codename=codename)
                    group.permissions.add(permission)
                except Permission.DoesNotExist:
                    logger.warning(f"Permissão {codename} não encontrada")
            
            created_groups.append(group)
    
    return created_groups


def create_default_groups():
    """
    Cria grupos padrão com permissões hierárquicas + grupos por coordenação
    """
    from django.contrib.auth.models import Group, Permission
    
    # Definir grupos administrativos
    admin_groups_permissions = {
        'Presidente': [
            # Presidente pode ver tudo
            'view_all_budgets', 'add_budget', 'change_budget', 'delete_budget',
            'view_all_contracts', 'add_contract', 'change_contract', 'delete_contract',
            'view_all_budgetlines', 'add_budgetline', 'change_budgetline', 'delete_budgetline',
            'view_all_aids', 'add_assistance', 'change_assistance', 'delete_assistance',
            'view_employee', 'add_employee', 'change_employee', 'delete_employee',
        ],
        'Diretor Financeiro': [
            'view_direction_budgets', 'add_budget', 'change_budget',
            'view_direction_contracts', 'add_contract', 'change_contract',
            'view_direction_budgetlines', 'add_budgetline', 'change_budgetline',
            'view_direction_aids',
        ],
        'Diretor Administrativo': [
            'view_direction_contracts', 'add_contract', 'change_contract',
            'view_direction_aids', 'add_assistance', 'change_assistance',
            'view_employee', 'add_employee', 'change_employee',
        ],
        'Gerente': [
            'view_management_budgets', 'add_budget', 'change_budget',
            'view_management_contracts', 'add_contract', 'change_contract',
            'view_management_budgetlines', 'add_budgetline', 'change_budgetline',
            'view_management_aids',
        ],
    }
    
    created_groups = []
    
    # Criar grupos administrativos
    for group_name, permission_codenames in admin_groups_permissions.items():
        group, created = Group.objects.get_or_create(name=group_name)
        
        if created or not group.permissions.exists():
            # Limpar permissões existentes se grupo já existe
            group.permissions.clear()
            
            # Adicionar permissões
            for codename in permission_codenames:
                try:
                    permission = Permission.objects.get(codename=codename)
                    group.permissions.add(permission)
                except Permission.DoesNotExist:
                    logger.warning(f"Permissão {codename} não encontrada")
            
            created_groups.append(group)
    
    # Criar grupos específicos para cada coordenação
    coordination_groups = create_coordination_groups()
    created_groups.extend(coordination_groups)
    
    return created_groups