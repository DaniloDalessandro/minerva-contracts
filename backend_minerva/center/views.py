from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, DjangoModelPermissions
from rest_framework import filters
from rest_framework.exceptions import ValidationError
from django.core.exceptions import ValidationError as DjangoValidationError
from django_filters.rest_framework import DjangoFilterBackend

from core.pagination import CustomPageNumberPagination
from .models import ManagementCenter, RequestingCenter
from .serializers import ManagementCenterSerializer, RequestingCenterSerializer
from .utils.messages import CENTRO_GESTOR_MSGS, CENTRO_SOLICITANTE_MSGS


def format_validation_errors(errors):
    """
    Format validation errors in a Zod-like structure for consistent frontend handling
    """
    formatted_errors = {}
    
    for field, field_errors in errors.items():
        if isinstance(field_errors, list):
            # Trata simple list of error messages
            formatted_errors[field] = {
                'field': field,
                'code': 'validation_error',
                'message': field_errors[0] if field_errors else 'Erro de validação'
            }
        elif isinstance(field_errors, dict):
            # Trata structured error dict
            formatted_errors[field] = field_errors
        else:
            # Trata string error
            formatted_errors[field] = {
                'field': field,
                'code': 'validation_error',
                'message': str(field_errors)
            }
    
    return formatted_errors


# --------------------------------------------------------------------------------------------------------------------
# Management Center (antes CentroDeCustoGestor)
# --------------------------------------------------------------------------------------------------------------------

class ManagementCenterListView(generics.ListAPIView):
    queryset = ManagementCenter.objects.all()
    serializer_class = ManagementCenterSerializer
    permission_classes = [IsAuthenticated, DjangoModelPermissions]
    pagination_class = CustomPageNumberPagination
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name']
    filterset_fields = ['is_active']
    ordering_fields = ['name', 'created_at', 'updated_at']
    ordering = ['-created_at']

    def get_queryset(self):
        queryset = super().get_queryset()
        # Aplica is_active filter - show only active by default unless specified
        is_active = self.request.query_params.get('is_active', None)
        if is_active is None:
            # Default to showing only active centers
            queryset = queryset.filter(is_active=True)
        return queryset


class ManagementCenterCreateView(generics.CreateAPIView):
    queryset = ManagementCenter.objects.all()
    serializer_class = ManagementCenterSerializer
    permission_classes = [IsAuthenticated, DjangoModelPermissions]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user, updated_by=self.request.user)

    def create(self, request, *args, **kwargs):
        try:
            resp = super().create(request, *args, **kwargs)
            resp.data = {
                'success': True,
                'message': CENTRO_GESTOR_MSGS['success_created'],
                'data': resp.data
            }
            return resp
        except ValidationError as e:
            return Response({
                'success': False,
                'message': 'Erro de validação',
                'errors': format_validation_errors(e.detail)
            }, status=status.HTTP_400_BAD_REQUEST)
        except DjangoValidationError as e:
            errors = e.message_dict if hasattr(e, 'message_dict') else {'non_field_errors': [str(e)]}
            return Response({
                'success': False,
                'message': 'Erro de validação',
                'errors': format_validation_errors(errors)
            }, status=status.HTTP_400_BAD_REQUEST)


class ManagementCenterDetailView(generics.RetrieveAPIView):
    queryset = ManagementCenter.objects.all()
    serializer_class = ManagementCenterSerializer
    permission_classes = [IsAuthenticated, DjangoModelPermissions]


class ManagementCenterUpdateView(generics.UpdateAPIView):
    queryset = ManagementCenter.objects.all()
    serializer_class = ManagementCenterSerializer
    permission_classes = [IsAuthenticated, DjangoModelPermissions]

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)

    def update(self, request, *args, **kwargs):
        try:
            resp = super().update(request, *args, **kwargs)
            resp.data = {
                'success': True,
                'message': CENTRO_GESTOR_MSGS['success_updated'],
                'data': resp.data
            }
            return resp
        except ValidationError as e:
            return Response({
                'success': False,
                'message': 'Erro de validação',
                'errors': format_validation_errors(e.detail)
            }, status=status.HTTP_400_BAD_REQUEST)
        except DjangoValidationError as e:
            errors = e.message_dict if hasattr(e, 'message_dict') else {'non_field_errors': [str(e)]}
            return Response({
                'success': False,
                'message': 'Erro de validação',
                'errors': format_validation_errors(errors)
            }, status=status.HTTP_400_BAD_REQUEST)


class ManagementCenterDeleteView(generics.UpdateAPIView):
    queryset = ManagementCenter.objects.all()
    serializer_class = ManagementCenterSerializer
    permission_classes = [IsAuthenticated, DjangoModelPermissions]

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.is_active = False
        instance.updated_by = request.user
        instance.save()
        return Response(
            {
                'success': True,
                'message': 'Centro gestor inativado com sucesso.'
            },
            status=status.HTTP_200_OK
        )


# --------------------------------------------------------------------------------------------------------------------
# Requesting Center (antes CentroDeCustoSolicitante)
# --------------------------------------------------------------------------------------------------------------------

class RequestingCenterListView(generics.ListAPIView):
    queryset = RequestingCenter.objects.select_related('management_center')
    serializer_class = RequestingCenterSerializer
    permission_classes = [IsAuthenticated, DjangoModelPermissions]
    pagination_class = CustomPageNumberPagination
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'management_center__name']
    filterset_fields = ['is_active']
    ordering_fields = ['name', 'created_at', 'updated_at', 'management_center__name']
    ordering = ['-created_at']

    def get_queryset(self):
        queryset = super().get_queryset()
        # Aplica is_active filter - show only active by default unless specified
        is_active = self.request.query_params.get('is_active', None)
        if is_active is None:
            # Default to showing only active centers
            queryset = queryset.filter(is_active=True)
        return queryset


class RequestingCenterCreateView(generics.CreateAPIView):
    queryset = RequestingCenter.objects.all()
    serializer_class = RequestingCenterSerializer
    permission_classes = [IsAuthenticated, DjangoModelPermissions]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user, updated_by=self.request.user)

    def create(self, request, *args, **kwargs):
        try:
            resp = super().create(request, *args, **kwargs)
            resp.data = {
                'success': True,
                'message': CENTRO_SOLICITANTE_MSGS['success_created'],
                'data': resp.data
            }
            return resp
        except ValidationError as e:
            return Response({
                'success': False,
                'message': 'Erro de validação',
                'errors': format_validation_errors(e.detail)
            }, status=status.HTTP_400_BAD_REQUEST)
        except DjangoValidationError as e:
            errors = e.message_dict if hasattr(e, 'message_dict') else {'non_field_errors': [str(e)]}
            return Response({
                'success': False,
                'message': 'Erro de validação',
                'errors': format_validation_errors(errors)
            }, status=status.HTTP_400_BAD_REQUEST)


class RequestingCenterDetailView(generics.RetrieveAPIView):
    queryset = RequestingCenter.objects.all()
    serializer_class = RequestingCenterSerializer
    permission_classes = [IsAuthenticated, DjangoModelPermissions]


class RequestingCenterUpdateView(generics.UpdateAPIView):
    queryset = RequestingCenter.objects.all()
    serializer_class = RequestingCenterSerializer
    permission_classes = [IsAuthenticated, DjangoModelPermissions]

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)

    def update(self, request, *args, **kwargs):
        try:
            resp = super().update(request, *args, **kwargs)
            resp.data = {
                'success': True,
                'message': CENTRO_SOLICITANTE_MSGS['success_updated'],
                'data': resp.data
            }
            return resp
        except ValidationError as e:
            return Response({
                'success': False,
                'message': 'Erro de validação',
                'errors': format_validation_errors(e.detail)
            }, status=status.HTTP_400_BAD_REQUEST)
        except DjangoValidationError as e:
            errors = e.message_dict if hasattr(e, 'message_dict') else {'non_field_errors': [str(e)]}
            return Response({
                'success': False,
                'message': 'Erro de validação',
                'errors': format_validation_errors(errors)
            }, status=status.HTTP_400_BAD_REQUEST)


class RequestingCenterDeleteView(generics.UpdateAPIView):
    queryset = RequestingCenter.objects.all()
    serializer_class = RequestingCenterSerializer
    permission_classes = [IsAuthenticated, DjangoModelPermissions]

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.is_active = False
        instance.updated_by = request.user
        instance.save()
        return Response(
            {
                'success': True,
                'message': 'Centro solicitante inativado com sucesso.'
            },
            status=status.HTTP_200_OK
        )
