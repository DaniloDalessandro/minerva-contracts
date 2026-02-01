from django.contrib import admin
from django.contrib.auth.models import Group, Permission
from django.contrib.auth.admin import GroupAdmin
from django.utils.html import format_html
from django.urls import reverse
from django.utils.safestring import mark_safe
from django import forms
from .models import User, BlacklistedToken


class UserAdminForm(forms.ModelForm):
    """Formulário customizado para criação de usuários"""
    
    class Meta:
        model = User
        fields = '__all__'
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        
        # Melhorar a exibição do campo employee
        if 'employee' in self.fields:
            self.fields['employee'].empty_label = "Selecione um funcionário..."
            self.fields['employee'].help_text = (
                "Escolha o funcionário que terá acesso ao sistema. "
                "O formato é: Nome Completo - CPF. "
                "O email será automaticamente sincronizado."
            )
        
        # Melhorar a exibição do campo groups
        if 'groups' in self.fields:
            self.fields['groups'].help_text = (
                "🔴 OBRIGATÓRIO: Selecione pelo menos um grupo hierárquico. "
                "Presidente (acesso total), Diretor (direção), Gerente (gerência), Coordenador (coordenação)."
            )
            # Filtrar apenas grupos hierárquicos relevantes
            hierarchical_groups = Group.objects.filter(
                name__in=['Presidente', 'Diretor', 'Gerente', 'Coordenador']
            )
            self.fields['groups'].queryset = hierarchical_groups
    
    def clean(self):
        cleaned_data = super().clean()
        employee = cleaned_data.get('employee')
        groups = cleaned_data.get('groups')
        
        # Validar se employee foi selecionado
        if not employee:
            raise forms.ValidationError({
                'employee': 'É obrigatório selecionar um funcionário.'
            })
        
        # Validar se pelo menos um grupo foi selecionado
        if not groups or not groups.exists():
            raise forms.ValidationError({
                'groups': 'É obrigatório selecionar pelo menos um grupo hierárquico.'
            })
        
        # Validar se o funcionário já possui usuário
        if employee and hasattr(employee, 'user') and employee.user and employee.user != self.instance:
            raise forms.ValidationError({
                'employee': f'O funcionário {employee.full_name} já possui um usuário associado.'
            })
        
        return cleaned_data


class CustomUserAdmin(admin.ModelAdmin):
    form = UserAdminForm
    list_display = ['get_employee_name_cpf', 'get_coordination', 'get_groups', 'get_hierarchy_level', 'is_active', 'last_login']
    search_fields = ['employee__full_name', 'employee__cpf', 'email']
    list_filter = ['is_active', 'groups', 'employee__coordination', 'employee__management', 'employee__direction']
    
    # Campos exibidos no formulário
    fieldsets = (
        ('✅ OBRIGATÓRIO - Seleção do Funcionário', {
            'fields': ('employee', 'is_active'),
            'description': '🔴 OBRIGATÓRIO: Selecione o funcionário pelo nome e CPF. O email será definido automaticamente.',
            'classes': ('wide',)
        }),
        ('✅ OBRIGATÓRIO - Grupo Hierárquico', {
            'fields': ('groups',),
            'description': '🔴 OBRIGATÓRIO: Selecione pelo menos um grupo hierárquico (Presidente, Diretor, Gerente ou Coordenador). Define o nível de acesso no sistema.',
            'classes': ('wide',)
        }),
        ('📋 Informações do Sistema', {
            'fields': ('email', 'last_login', 'date_joined'),
            'classes': ('collapse',)
        }),
    )
    
    readonly_fields = ['email', 'last_login', 'date_joined']
    filter_horizontal = ['groups']
    
    def get_employee_name_cpf(self, obj):
        """Exibe o nome e CPF do funcionário"""
        if obj.employee:
            return format_html('<strong>{}</strong><br><span style="color: #666; font-size: 11px;">CPF: {}</span>', 
                             obj.employee.full_name, obj.employee.cpf)
        return format_html('<span style="color: red;">Sem funcionário associado</span>')
    get_employee_name_cpf.short_description = 'Funcionário'
    
    def get_coordination(self, obj):
        """Exibe a coordenação do funcionário"""
        if obj.employee and obj.employee.coordination:
            return format_html('<span style="background: #17a2b8; color: white; padding: 2px 6px; border-radius: 3px; font-size: 11px;">{}</span>', 
                             obj.employee.coordination.name)
        elif obj.employee and obj.employee.management:
            return format_html('<span style="background: #28a745; color: white; padding: 2px 6px; border-radius: 3px; font-size: 11px;">Gerência: {}</span>', 
                             obj.employee.management.name)
        elif obj.employee and obj.employee.direction:
            return format_html('<span style="background: #007bff; color: white; padding: 2px 6px; border-radius: 3px; font-size: 11px;">Direção: {}</span>', 
                             obj.employee.direction.name)
        return format_html('<span style="color: #999;">Sem setor definido</span>')
    get_coordination.short_description = 'Setor'
    
    def get_groups(self, obj):
        """Exibe os grupos do usuário de forma mais legível"""
        if obj.groups.exists():
            groups = []
            for group in obj.groups.all():
                color = self.get_group_color(group.name)
                groups.append(f'<span style="background-color: {color}; color: white; padding: 2px 6px; border-radius: 3px; font-size: 11px; margin-right: 3px;">{group.name}</span>')
            return format_html(' '.join(groups))
        return format_html('<span style="color: red; font-weight: bold;">Sem Grupos</span>')
    get_groups.short_description = 'Grupos'
    get_groups.allow_tags = True
    
    def get_hierarchy_level(self, obj):
        """Exibe o nível hierárquico baseado nos grupos"""
        if obj.is_superuser:
            return format_html('<span style="color: purple; font-weight: bold;">🏆 SUPERUSUÁRIO</span>')
        
        if not obj.groups.exists():
            return format_html('<span style="color: red;">❌ SEM ACESSO</span>')
        
        group_names = [group.name.lower() for group in obj.groups.all()]
        
        if any('presidente' in name for name in group_names):
            return format_html('<span style="color: gold; font-weight: bold;">👑 PRESIDENTE</span>')
        elif any('diretor' in name for name in group_names):
            return format_html('<span style="color: blue; font-weight: bold;">🎯 DIRETOR</span>')
        elif any('gerente' in name for name in group_names):
            return format_html('<span style="color: green; font-weight: bold;">📋 GERENTE</span>')
        elif any('coordenador' in name for name in group_names):
            return format_html('<span style="color: orange; font-weight: bold;">📌 COORDENADOR</span>')
        else:
            return format_html('<span style="color: gray;">👤 FUNCIONÁRIO</span>')
    
    get_hierarchy_level.short_description = 'Nível Hierárquico'
    
    def get_group_color(self, group_name):
        """Retorna cor baseada no tipo de grupo"""
        name_lower = group_name.lower()
        if 'presidente' in name_lower:
            return '#FFD700'  # Gold
        elif 'diretor' in name_lower:
            return '#007bff'  # Blue
        elif 'gerente' in name_lower:
            return '#28a745'  # Green
        elif 'coordenador' in name_lower:
            return '#fd7e14'  # Orange
        else:
            return '#6c757d'  # Gray
    
    def save_model(self, request, obj, form, change):
        """Validação customizada antes de salvar"""
        # Validar se pelo menos um grupo foi selecionado
        if 'groups' in form.cleaned_data and not form.cleaned_data['groups']:
            from django.core.exceptions import ValidationError
            raise ValidationError('É obrigatório selecionar pelo menos um grupo hierárquico.')
        
        super().save_model(request, obj, form, change)
    
    def save_related(self, request, form, formsets, change):
        """Salva relações e valida grupos"""
        super().save_related(request, form, formsets, change)
        
        # Verificar se grupos foram atribuídos após salvar
        if not form.instance.groups.exists():
            from django.contrib import messages
            messages.error(request, '⚠️ ATENÇÃO: Usuário criado sem grupos! É obrigatório atribuir pelo menos um grupo hierárquico.')
    
    def has_change_permission(self, request, obj=None):
        # Superusuários podem editar qualquer usuário
        if request.user.is_superuser:
            return True
        
        # Usuários não podem editar outros usuários
        return False


class CustomGroupAdmin(GroupAdmin):
    list_display = ['name', 'get_permission_count', 'get_user_count', 'get_group_description']
    search_fields = ['name']
    filter_horizontal = ['permissions']
    
    fieldsets = (
        ('Informações do Grupo', {
            'fields': ('name',)
        }),
        ('Permissões', {
            'fields': ('permissions',),
            'description': 'Selecione as permissões específicas para este grupo. '
                          'As permissões determinam o que os usuários deste grupo podem acessar.'
        }),
    )
    
    def get_permission_count(self, obj):
        """Conta as permissões do grupo"""
        count = obj.permissions.count()
        if count > 0:
            return format_html('<span style="color: green; font-weight: bold;">{} permissões</span>', count)
        return format_html('<span style="color: red;">Nenhuma permissão</span>')
    get_permission_count.short_description = 'Permissões'
    
    def get_user_count(self, obj):
        """Conta os usuários do grupo"""
        count = obj.user_set.count()
        if count > 0:
            return format_html('<span style="color: blue; font-weight: bold;">{} usuários</span>', count)
        return format_html('<span style="color: gray;">Nenhum usuário</span>')
    get_user_count.short_description = 'Usuários'
    
    def get_group_description(self, obj):
        """Descrição baseada no nome do grupo"""
        name_lower = obj.name.lower()
        descriptions = {
            'presidente': '👑 Acesso total ao sistema',
            'diretor financeiro': '💰 Acesso a dados financeiros da direção',
            'diretor administrativo': '📋 Acesso a dados administrativos da direção',
            'gerente': '📊 Acesso a dados da gerência',
            'coordenador': '📌 Acesso a dados da coordenação',
            'funcionário': '👤 Acesso básico limitado'
        }
        
        for key, desc in descriptions.items():
            if key in name_lower:
                return format_html('<span style="color: #666; font-style: italic;">{}</span>', desc)
        
        return format_html('<span style="color: #666;">Grupo personalizado</span>')
    get_group_description.short_description = 'Descrição'


# Desregistrar o GroupAdmin padrão e registrar o customizado
admin.site.unregister(Group)
admin.site.register(Group, CustomGroupAdmin)

@admin.register(BlacklistedToken)
class BlacklistedTokenAdmin(admin.ModelAdmin):
    list_display = ['get_token_preview', 'user', 'reason', 'blacklisted_at']
    list_filter = ['reason', 'blacklisted_at', 'user']
    search_fields = ['user__email', 'reason', 'jti']
    readonly_fields = ['jti', 'token', 'user', 'blacklisted_at']
    ordering = ['-blacklisted_at']
    
    def get_token_preview(self, obj):
        """Exibe uma prévia do token"""
        return format_html(
            '<span style="font-family: monospace; background: #f8f9fa; padding: 2px 4px; border-radius: 3px;">{}...{}</span>',
            obj.jti[:8],
            obj.jti[-8:] if len(obj.jti) > 16 else ''
        )
    get_token_preview.short_description = 'Token ID'
    
    def has_add_permission(self, request):
        """Não permite adicionar tokens manualmente"""
        return False
    
    def has_change_permission(self, request, obj=None):
        """Não permite editar tokens"""
        return False
    
    actions = ['cleanup_expired_tokens']
    
    def cleanup_expired_tokens(self, request, queryset):
        """Action para limpar tokens expirados"""
        deleted_count = BlacklistedToken.cleanup_expired()
        self.message_user(request, f'{deleted_count} tokens expirados foram removidos.')
    cleanup_expired_tokens.short_description = 'Limpar tokens expirados'

# Registrar o User com o CustomUserAdmin
admin.site.register(User, CustomUserAdmin)

# Customizar títulos do admin
admin.site.site_header = "⚓ Minerva - Administração"
admin.site.site_title = "Minerva Admin"
admin.site.index_title = "Painel de Administração"

