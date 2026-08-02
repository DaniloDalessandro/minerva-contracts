from drf_spectacular.utils import extend_schema
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from accounts.permissions import IsManagerOrAbove
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

            formatted_errors[field] = {
                'field': field,
                'code': 'validation_error',
                'message': field_errors[0] if field_errors else 'Erro de validação'
            }
        elif isinstance(field_errors, dict):

            formatted_errors[field] = field_errors
        else:

            formatted_errors[field] = {
                'field': field,
                'code': 'validation_error',
                'message': str(field_errors)
            }

    return formatted_errors






@extend_schema(tags=['Centro'])
class ManagementCenterListView(generics.ListAPIView):
    queryset = ManagementCenter.objects.all()
    serializer_class = ManagementCenterSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = CustomPageNumberPagination
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name']
    filterset_fields = ['is_active']
    ordering_fields = ['name', 'created_at', 'updated_at']
    ordering = ['-created_at']

    def get_queryset(self):
        queryset = super().get_queryset()

        is_active = self.request.query_params.get('is_active', None)
        if is_active is None:

            queryset = queryset.filter(is_active=True)
        return queryset


@extend_schema(tags=['Centro'])
class ManagementCenterCreateView(generics.CreateAPIView):
    queryset = ManagementCenter.objects.all()
    serializer_class = ManagementCenterSerializer
    permission_classes = [IsAuthenticated, IsManagerOrAbove]

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


@extend_schema(tags=['Centro'])
class ManagementCenterDetailView(generics.RetrieveAPIView):
    queryset = ManagementCenter.objects.all()
    serializer_class = ManagementCenterSerializer
    permission_classes = [IsAuthenticated]


@extend_schema(tags=['Centro'])
class ManagementCenterUpdateView(generics.UpdateAPIView):
    queryset = ManagementCenter.objects.all()
    serializer_class = ManagementCenterSerializer
    permission_classes = [IsAuthenticated, IsManagerOrAbove]

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


@extend_schema(tags=['Centro'])
class ManagementCenterDeleteView(generics.UpdateAPIView):
    queryset = ManagementCenter.objects.all()
    serializer_class = ManagementCenterSerializer
    permission_classes = [IsAuthenticated, IsManagerOrAbove]

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






@extend_schema(tags=['Centro'])
class RequestingCenterListView(generics.ListAPIView):
    queryset = RequestingCenter.objects.select_related('management_center')
    serializer_class = RequestingCenterSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = CustomPageNumberPagination
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'management_center__name']
    filterset_fields = ['is_active']
    ordering_fields = ['name', 'created_at', 'updated_at', 'management_center__name']
    ordering = ['-created_at']

    def get_queryset(self):
        queryset = super().get_queryset()

        is_active = self.request.query_params.get('is_active', None)
        if is_active is None:

            queryset = queryset.filter(is_active=True)
        return queryset


@extend_schema(tags=['Centro'])
class RequestingCenterCreateView(generics.CreateAPIView):
    queryset = RequestingCenter.objects.all()
    serializer_class = RequestingCenterSerializer
    permission_classes = [IsAuthenticated, IsManagerOrAbove]

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


@extend_schema(tags=['Centro'])
class RequestingCenterDetailView(generics.RetrieveAPIView):
    queryset = RequestingCenter.objects.all()
    serializer_class = RequestingCenterSerializer
    permission_classes = [IsAuthenticated]


@extend_schema(tags=['Centro'])
class RequestingCenterUpdateView(generics.UpdateAPIView):
    queryset = RequestingCenter.objects.all()
    serializer_class = RequestingCenterSerializer
    permission_classes = [IsAuthenticated, IsManagerOrAbove]

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


@extend_schema(tags=['Centro'])
class RequestingCenterDeleteView(generics.UpdateAPIView):
    queryset = RequestingCenter.objects.all()
    serializer_class = RequestingCenterSerializer
    permission_classes = [IsAuthenticated, IsManagerOrAbove]

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
