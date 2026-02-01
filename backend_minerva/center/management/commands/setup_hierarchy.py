from django.core.management.base import BaseCommand
from django.contrib.auth.models import Group, Permission
from django.db import transaction
from django.contrib.contenttypes.models import ContentType

class Command(BaseCommand):
    help = 'Configurar grupos hierárquicos e permissões'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--create-groups',
            action='store_true',
            help='Criar grupos hierárquicos',
        )
        parser.add_argument(
            '--assign-permissions',
            action='store_true', 
            help='Atribuir permissões aos grupos',
        )
    
    @transaction.atomic
    def handle(self, *args, **options):
        if options['create_groups']:
            self.create_hierarchical_groups()
            
        if options['assign_permissions']:
            self.assign_group_permissions()
            
        if not any([options['create_groups'], options['assign_permissions']]):
            # Executar tudo se nenhuma opção específica for dada
            self.create_hierarchical_groups()
            self.assign_group_permissions()
        
        self.stdout.write(
            self.style.SUCCESS('Configuração hierárquica concluída com sucesso!')
        )
    
    def create_hierarchical_groups(self):
        """Criar grupos para cada nível hierárquico"""
        groups = [
            ('Presidente', 'Acesso total ao sistema'),
            ('Diretor', 'Acesso aos dados da sua direção'),
            ('Gerente', 'Acesso aos dados da sua gerência'),
            ('Coordenador', 'Acesso aos dados da sua coordenação'),
        ]
        
        created_count = 0
        for group_name, description in groups:
            group, created = Group.objects.get_or_create(name=group_name)
            if created:
                created_count += 1
                self.stdout.write(
                    self.style.SUCCESS(f'Grupo criado: {group_name}')
                )
            else:
                self.stdout.write(
                    self.style.WARNING(f'Grupo já existe: {group_name}')
                )
        
        self.stdout.write(f'Total de grupos criados: {created_count}')
    
    def assign_group_permissions(self):
        """Atribuir permissões baseadas na hierarquia"""
        
        # Obter todas as permissões relevantes
        budget_ct = ContentType.objects.get(app_label='budget', model='budget')
        contract_ct = ContentType.objects.get(app_label='contract', model='contract')
        budgetline_ct = ContentType.objects.get(app_label='budgetline', model='budgetline')
        employee_ct = ContentType.objects.get(app_label='employee', model='employee')
        center_ct = ContentType.objects.get(app_label='center', model='managementcenter')
        
        # Presidente - acesso total
        try:
            presidente = Group.objects.get(name='Presidente')
            permissions = Permission.objects.filter(
                content_type__in=[budget_ct, contract_ct, budgetline_ct, employee_ct, center_ct]
            )
            presidente.permissions.set(permissions)
            self.stdout.write(f'Permissões atribuídas ao Presidente: {permissions.count()}')
        except Group.DoesNotExist:
            self.stdout.write(self.style.ERROR('Grupo Presidente não encontrado'))
        
        # Diretor - permissões de visualização e edição
        try:
            diretor = Group.objects.get(name='Diretor')
            director_permissions = Permission.objects.filter(
                content_type__in=[budget_ct, contract_ct, budgetline_ct, employee_ct],
                codename__in=[
                    'view_budget', 'add_budget', 'change_budget',
                    'view_contract', 'add_contract', 'change_contract', 
                    'view_budgetline', 'add_budgetline', 'change_budgetline',
                    'view_employee', 'add_employee', 'change_employee',
                ]
            )
            diretor.permissions.set(director_permissions)
            self.stdout.write(f'Permissões atribuídas ao Diretor: {director_permissions.count()}')
        except Group.DoesNotExist:
            self.stdout.write(self.style.ERROR('Grupo Diretor não encontrado'))
            
        # Gerente - permissões similares mas limitadas à gerência
        try:
            gerente = Group.objects.get(name='Gerente')
            manager_permissions = Permission.objects.filter(
                content_type__in=[budget_ct, contract_ct, budgetline_ct, employee_ct],
                codename__in=[
                    'view_budget', 'add_budget', 'change_budget',
                    'view_contract', 'add_contract', 'change_contract',
                    'view_budgetline', 'add_budgetline', 'change_budgetline', 
                    'view_employee', 'change_employee',
                ]
            )
            gerente.permissions.set(manager_permissions)
            self.stdout.write(f'Permissões atribuídas ao Gerente: {manager_permissions.count()}')
        except Group.DoesNotExist:
            self.stdout.write(self.style.ERROR('Grupo Gerente não encontrado'))
            
        # Coordenador - permissões mais limitadas
        try:
            coordenador = Group.objects.get(name='Coordenador')
            coord_permissions = Permission.objects.filter(
                content_type__in=[budget_ct, contract_ct, budgetline_ct, employee_ct],
                codename__in=[
                    'view_budget', 'view_contract', 'view_budgetline',
                    'view_employee',
                ]
            )
            coordenador.permissions.set(coord_permissions)
            self.stdout.write(f'Permissões atribuídas ao Coordenador: {coord_permissions.count()}')
        except Group.DoesNotExist:
            self.stdout.write(self.style.ERROR('Grupo Coordenador não encontrado'))
        
        self.stdout.write(
            self.style.SUCCESS('Todas as permissões foram atribuídas aos grupos!')
        )