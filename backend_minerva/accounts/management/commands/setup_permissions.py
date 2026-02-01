from django.core.management.base import BaseCommand
from accounts.permissions import create_custom_permissions, create_default_groups


class Command(BaseCommand):
    help = 'Configura permissões personalizadas e grupos hierárquicos'

    def add_arguments(self, parser):
        parser.add_argument(
            '--reset',
            action='store_true',
            help='Remove todos os grupos existentes e recria',
        )

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Iniciando configuração de permissões...'))
        
        # Criar permissões personalizadas
        self.stdout.write('Criando permissões personalizadas...')
        created_permissions = create_custom_permissions()
        
        if created_permissions:
            self.stdout.write(
                self.style.SUCCESS(
                    f'Criadas {len(created_permissions)} permissões personalizadas'
                )
            )
        else:
            self.stdout.write('Nenhuma nova permissão foi criada (já existem)')
        
        # Resetar grupos se solicitado
        if options['reset']:
            from django.contrib.auth.models import Group
            self.stdout.write('Removendo grupos existentes...')
            Group.objects.all().delete()
        
        # Criar grupos padrão
        self.stdout.write('Criando grupos hierárquicos...')
        created_groups = create_default_groups()
        
        if created_groups:
            self.stdout.write(
                self.style.SUCCESS(
                    f'Criados/atualizados {len(created_groups)} grupos'
                )
            )
            
            for group in created_groups:
                permissions_count = group.permissions.count()
                self.stdout.write(
                    f'  - {group.name}: {permissions_count} permissões'
                )
        else:
            self.stdout.write('Nenhum novo grupo foi criado')
        
        self.stdout.write(
            self.style.SUCCESS('Configuração de permissões concluída com sucesso!')
        )
        
        # Mostrar resumo dos grupos
        from django.contrib.auth.models import Group
        from sector.models import Coordination
        
        self.stdout.write('\n' + self.style.WARNING('Resumo dos grupos disponíveis:'))
        
        # Grupos administrativos
        admin_groups = ['Presidente', 'Diretor Financeiro', 'Diretor Administrativo', 'Gerente']
        self.stdout.write('\n📋 GRUPOS ADMINISTRATIVOS:')
        for group in Group.objects.filter(name__in=admin_groups).order_by('name'):
            self.stdout.write(f'  • {group.name} ({group.permissions.count()} permissões)')
        
        # Grupos de coordenação
        self.stdout.write('\n🏢 GRUPOS POR COORDENAÇÃO:')
        coordination_groups = Group.objects.filter(name__startswith='Coordenação - ').order_by('name')
        
        if coordination_groups.exists():
            for group in coordination_groups:
                coordination_name = group.name.replace('Coordenação - ', '')
                user_count = group.user_set.count()
                self.stdout.write(f'  🎯 {coordination_name} ({group.permissions.count()} permissões, {user_count} usuários)')
        else:
            self.stdout.write('  ⚠️  Nenhum grupo de coordenação encontrado')
        
        # Mostrar coordenações disponíveis no sistema
        total_coordinations = Coordination.objects.count()
        self.stdout.write(f'\n📊 COORDENAÇÕES CADASTRADAS NO SISTEMA: {total_coordinations}')
        
        if total_coordinations > 0:
            for coord in Coordination.objects.all().order_by('name'):
                group_exists = Group.objects.filter(name=f'Coordenação - {coord.name}').exists()
                status = "✅ Grupo criado" if group_exists else "❌ Grupo não criado"
                self.stdout.write(f'  • {coord.name} - {status}')
        
        self.stdout.write('\n' + self.style.SUCCESS('🎯 COMO USAR:'))
        self.stdout.write('1. Vá para Django Admin → Usuários')
        self.stdout.write('2. Selecione o funcionário pelo nome-CPF')
        self.stdout.write('3. Atribua ao grupo "Coordenação - [Nome]" correspondente')
        self.stdout.write('4. Funcionários só verão dados de sua coordenação!')
        
        self.stdout.write('\n' + self.style.WARNING('📋 EXEMPLOS DE ACESSO:'))
        self.stdout.write('• Coordenação - LOGÍSTICA → Só vê contratos/orçamentos de Logística')
        self.stdout.write('• Coordenação - TI → Só vê contratos/orçamentos de TI')
        self.stdout.write('• Coordenação - RH → Só vê contratos/orçamentos de RH')