from django.core.exceptions import PermissionDenied
from django.contrib.auth.models import AnonymousUser
from django.http import HttpResponseForbidden
from django.shortcuts import render


class HierarchicalPermissionMiddleware:
    """
    Middleware para aplicar permissões hierárquicas automaticamente
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):

        self.process_request(request)

        response = self.get_response(request)

        return response

    def process_request(self, request):
        """
        Verifica se o usuário tem permissão para acessar a página
        """

        if isinstance(request.user, AnonymousUser) or request.user.is_superuser:
            return


        if not request.path.startswith('/admin/'):
            return


        if not request.user.groups.exists():

            if request.path != '/admin/logout/':
                request.no_groups_access = True

    def process_view(self, request, view_func, view_args, view_kwargs):
        """
        Processa a view antes dela ser executada
        """
        if hasattr(request, 'no_groups_access') and request.no_groups_access:
            return HttpResponseForbidden(
                render(request, 'admin/permission_denied.html', {
                    'message': 'Você não possui permissões para acessar esta área. Entre em contato com o administrador.'
                }).content
            )


class UserPermissionContextProcessor:
    """
    Context processor para adicionar informações de permissões do usuário no template
    """

    def __init__(self, request):
        self.request = request

    def __call__(self):
        if hasattr(self.request, 'user') and self.request.user.is_authenticated:
            user = self.request.user


            hierarchy_level = self.get_user_hierarchy_level(user)


            permissions = {
                'can_view_all': user.is_superuser or self.user_has_permission(user, 'view_all'),
                'can_view_direction': self.user_has_permission(user, 'view_direction'),
                'can_view_management': self.user_has_permission(user, 'view_management'),
                'can_view_coordination': self.user_has_permission(user, 'view_coordination'),
                'hierarchy_level': hierarchy_level,
                'user_groups': [group.name for group in user.groups.all()],
            }

            return {'user_permissions': permissions}

        return {'user_permissions': {}}

    def get_user_hierarchy_level(self, user):
        """
        Determina o nível hierárquico do usuário baseado nos grupos
        """
        if user.is_superuser:
            return 'superuser'

        group_names = [group.name.lower() for group in user.groups.all()]

        if any('presidente' in name for name in group_names):
            return 'presidente'
        elif any('diretor' in name for name in group_names):
            return 'diretor'
        elif any('gerente' in name for name in group_names):
            return 'gerente'
        elif any('coordenador' in name for name in group_names):
            return 'coordenador'
        else:
            return 'funcionario'

    def user_has_permission(self, user, permission_type):
        """
        Verifica se usuário tem determinado tipo de permissão
        """
        if user.is_superuser:
            return True


        for group in user.groups.all():
            for permission in group.permissions.all():
                if permission_type in permission.codename:
                    return True

        return False


def user_permission_context(request):
    """
    Função context processor para usar em settings.py
    """
    processor = UserPermissionContextProcessor(request)
    return processor()