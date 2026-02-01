from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, DjangoModelPermissions
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.throttling import UserRateThrottle
from rest_framework import filters
from django_filters.rest_framework import DjangoFilterBackend
from django.db import IntegrityError
from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from django.conf import settings
import logging

from .models import Budget, BudgetMovement
from .serializers import BudgetSerializer, BudgetDetailSerializer, BudgetMovementSerializer
from .utils.messages import BUDGET_MSGS, BUDGET_MOVEMENT_MSGS
from .utils.pdf_generator import generate_budget_pdf, generate_budget_summary_pdf
from center.models import ManagementCenter
from center.serializers import ManagementCenterSerializer
from accounts.mixins import HierarchicalFilterMixin


# Helper function for secure error responses
def get_error_details(exception):
    """
    Returns exception details only if DEBUG is enabled.
    In production, returns a generic message to avoid information leakage.
    """
    if settings.DEBUG:
        return str(exception)
    return "Contact support for more information"


# Custom throttle class for PDF export
class PDFExportRateThrottle(UserRateThrottle):
    scope = 'pdf_export'


# Budget Views
class BudgetListView(generics.ListAPIView, HierarchicalFilterMixin):
    queryset = Budget.objects.select_related('management_center', 'created_by', 'updated_by').prefetch_related('budget_lines')
    serializer_class = BudgetSerializer
    permission_classes = [IsAuthenticated, DjangoModelPermissions]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['year', 'category', 'management_center__name']
    ordering_fields = ['year', 'category', 'total_amount', 'management_center__name', 'created_at', 'updated_at']
    ordering = ['-created_at']
    
    def get_queryset(self):
        """Aplicar filtro hierárquico baseado no usuário"""
        queryset = super().get_queryset()
        return self.filter_queryset_by_hierarchy(queryset, self.request.user, 'management_center')


class BudgetCreateView(generics.CreateAPIView, HierarchicalFilterMixin):
    queryset = Budget.objects.all()
    serializer_class = BudgetSerializer
    permission_classes = [IsAuthenticated, DjangoModelPermissions]

    def perform_create(self, serializer):
        logger = logging.getLogger(__name__)
        
        # Verificar se o usuário pode criar budget para o centro especificado
        management_center = serializer.validated_data.get('management_center')
        management_center_id = serializer.validated_data.get('management_center_id')
        
        logger.info(f"Budget creation by user {self.request.user.email}")
        logger.info(f"Management center from serializer: {management_center}")
        logger.info(f"Management center ID from serializer: {management_center_id}")
        
        # Se management_center não foi processado, buscar pelo ID
        if not management_center and management_center_id:
            from center.models import ManagementCenter
            try:
                management_center = ManagementCenter.objects.get(id=management_center_id)
                logger.info(f"Found management center by ID: {management_center}")
                # Atualizar o validated_data para incluir o objeto management_center
                serializer.validated_data['management_center'] = management_center
            except ManagementCenter.DoesNotExist:
                logger.error(f"Management center with ID {management_center_id} not found")
                from rest_framework.exceptions import ValidationError
                raise ValidationError("Centro gestor não encontrado.")
        
        # Se ainda não tem management_center, tentar obter do validated_data diretamente
        if not management_center and 'management_center_id' in serializer.validated_data:
            from center.models import ManagementCenter
            try:
                management_center = ManagementCenter.objects.get(id=serializer.validated_data['management_center_id'])
                logger.info(f"Found management center by validated_data ID: {management_center}")
                serializer.validated_data['management_center'] = management_center
            except ManagementCenter.DoesNotExist:
                logger.error(f"Management center with ID {serializer.validated_data['management_center_id']} not found")
                from rest_framework.exceptions import ValidationError
                raise ValidationError("Centro gestor não encontrado.")
        
        # Verificar hierarquia apenas se management_center foi especificado
        if management_center:
            accessible_centers = self.get_accessible_management_centers(self.request.user)
            logger.info(f"User {self.request.user.email} has access to {accessible_centers.count()} centers")
            
            if accessible_centers.count() == 0:
                logger.warning(f"User {self.request.user.email} has no accessible centers - checking if is superuser")
                
                # Se é superuser mas não tem centros acessíveis, verificar se tem employee e grupos
                if self.request.user.is_superuser:
                    if not hasattr(self.request.user, 'employee') or not self.request.user.employee:
                        logger.error(f"Superuser {self.request.user.email} has no employee associated")
                    
                    if not self.request.user.groups.filter(name='Presidente').exists():
                        logger.error(f"Superuser {self.request.user.email} is not in 'Presidente' group")
            
            if management_center not in accessible_centers:
                logger.error(f"User {self.request.user.email} cannot access center {management_center.name}")
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied("Você não tem permissão para criar budgets para este centro gestor.")
        else:
            logger.warning("No management center specified for budget creation")
            
        serializer.save(created_by=self.request.user, updated_by=self.request.user)
        logger.info(f"Budget created successfully by user {self.request.user.email}")

    def create(self, request, *args, **kwargs):
        logger = logging.getLogger(__name__)
        logger.info(f"Budget creation attempt with data: {request.data}")
        
        try:
            serializer = self.get_serializer(data=request.data)
            if not serializer.is_valid():
                logger.error(f"Budget creation validation errors: {serializer.errors}")
                
                # Verificar se há erro de duplicata
                non_field_errors = serializer.errors.get('non_field_errors', [])
                if non_field_errors and any('Já existe um orçamento' in str(error) for error in non_field_errors):
                    return Response({
                        'error': 'Orçamento duplicado',
                        'message': str(non_field_errors[0]),
                        'validation_errors': serializer.errors
                    }, status=status.HTTP_400_BAD_REQUEST)
                
                return Response({
                    'error': 'Dados inválidos fornecidos',
                    'validation_errors': serializer.errors,
                    'message': 'Por favor, verifique os dados e tente novamente.'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            self.perform_create(serializer)
            logger.info(f"Budget created successfully with ID: {serializer.data.get('id')}")
            
            return Response({
                'message': BUDGET_MSGS['success_created'],
                'data': serializer.data
            }, status=status.HTTP_201_CREATED)
            
        except IntegrityError as e:
            logger.error(f"Database integrity error during budget creation: {str(e)}")
            return Response({
                'error': 'Erro de integridade dos dados',
                'message': 'Já existe um orçamento com essas características. Verifique ano, categoria e centro gestor.',
                'details': get_error_details(e)
            }, status=status.HTTP_400_BAD_REQUEST)
            
        except Exception as e:
            logger.error(f"Unexpected error during budget creation: {str(e)}")
            from rest_framework.exceptions import PermissionDenied, ValidationError
            
            # Se for erro de permissão, retornar 403
            if isinstance(e, PermissionDenied):
                return Response({
                    'error': 'Permissão negada',
                    'message': str(e),
                }, status=status.HTTP_403_FORBIDDEN)
            
            # Se for erro de validação, retornar 400
            if isinstance(e, ValidationError):
                return Response({
                    'error': 'Erro de validação',
                    'message': str(e),
                }, status=status.HTTP_400_BAD_REQUEST)
            
            return Response({
                'error': 'Erro interno do servidor',
                'message': 'Ocorreu um erro inesperado. Tente novamente mais tarde.',
                'details': get_error_details(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class BudgetDetailView(generics.RetrieveAPIView):
    serializer_class = BudgetDetailSerializer
    permission_classes = [IsAuthenticated, DjangoModelPermissions]
    
    def get_queryset(self):
        """
        Otimiza a query para incluir todas as informações relacionadas necessárias
        """
        return Budget.objects.select_related(
            'management_center', 'created_by', 'updated_by'
        ).prefetch_related(
            # Prefetch linhas orçamentárias com seus relacionamentos
            'budget_lines__management_center',
            'budget_lines__requesting_center', 
            'budget_lines__main_fiscal',
            'budget_lines__secondary_fiscal',
            'budget_lines__created_by',
            'budget_lines__updated_by',
            'budget_lines__versions',
            # Prefetch movimentações
            'outgoing_movements__destination__management_center',
            'incoming_movements__source__management_center',
            'outgoing_movements__created_by',
            'incoming_movements__created_by'
        )
    
    def get_object(self):
        logger = logging.getLogger(__name__)
        pk = self.kwargs.get('pk')
        logger.info(f"Trying to retrieve budget with ID: {pk}")
        
        try:
            obj = super().get_object()
            logger.info(f"Budget found: {obj}")
            logger.info(f"Budget has {obj.budget_lines.count()} budget lines")
            return obj
        except Exception as e:
            logger.error(f"Budget with ID {pk} not found: {str(e)}")
            all_budgets = Budget.objects.all()
            logger.info(f"Available budgets: {[budget.id for budget in all_budgets]}")
            raise


class BudgetUpdateView(generics.UpdateAPIView):
    queryset = Budget.objects.all()
    serializer_class = BudgetSerializer
    permission_classes = [IsAuthenticated, DjangoModelPermissions]

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)

    def update(self, request, *args, **kwargs):
        logger = logging.getLogger(__name__)
        logger.info(f"Budget update attempt with data: {request.data}")
        
        try:
            partial = kwargs.pop('partial', False)
            instance = self.get_object()
            serializer = self.get_serializer(instance, data=request.data, partial=partial)
            
            if not serializer.is_valid():
                logger.error(f"Budget update validation errors: {serializer.errors}")
                
                # Verificar se há erro de duplicata
                non_field_errors = serializer.errors.get('non_field_errors', [])
                if non_field_errors and any('Já existe um orçamento' in str(error) for error in non_field_errors):
                    return Response({
                        'error': 'Orçamento duplicado',
                        'message': str(non_field_errors[0]),
                        'validation_errors': serializer.errors
                    }, status=status.HTTP_400_BAD_REQUEST)
                
                return Response({
                    'error': 'Dados inválidos fornecidos',
                    'validation_errors': serializer.errors,
                    'message': 'Por favor, verifique os dados e tente novamente.'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            self.perform_update(serializer)
            logger.info(f"Budget updated successfully with ID: {instance.id}")
            
            return Response({
                'message': BUDGET_MSGS['success_updated'],
                'data': serializer.data
            }, status=status.HTTP_200_OK)
            
        except IntegrityError as e:
            logger.error(f"Database integrity error during budget update: {str(e)}")
            return Response({
                'error': 'Erro de integridade dos dados',
                'message': 'Já existe um orçamento com essas características. Verifique ano, categoria e centro gestor.',
                'details': get_error_details(e)
            }, status=status.HTTP_400_BAD_REQUEST)
            
        except Exception as e:
            logger.error(f"Unexpected error during budget update: {str(e)}")
            return Response({
                'error': 'Erro interno do servidor',
                'message': 'Ocorreu um erro inesperado. Tente novamente mais tarde.',
                'details': get_error_details(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class BudgetDeleteView(generics.DestroyAPIView):
    queryset = Budget.objects.all()
    serializer_class = BudgetSerializer
    permission_classes = [IsAuthenticated, DjangoModelPermissions]

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        self.perform_destroy(instance)
        return Response({'message': BUDGET_MSGS['success_deleted']}, status=status.HTTP_204_NO_CONTENT)


# Budget Movement Views
class BudgetMovementListView(generics.ListAPIView):
    queryset = BudgetMovement.objects.select_related('source', 'destination', 'created_by', 'updated_by')
    serializer_class = BudgetMovementSerializer
    permission_classes = [IsAuthenticated, DjangoModelPermissions]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['notes']
    ordering_fields = ['amount', 'movement_date', 'created_at', 'updated_at']
    ordering = ['-created_at']


class BudgetMovementCreateView(generics.CreateAPIView):
    queryset = BudgetMovement.objects.all()
    serializer_class = BudgetMovementSerializer
    permission_classes = [IsAuthenticated, DjangoModelPermissions]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user, updated_by=self.request.user)

    def create(self, request, *args, **kwargs):
        response = super().create(request, *args, **kwargs)
        response.data = {
            'message': BUDGET_MOVEMENT_MSGS['success_created'],
            'data': response.data
        }
        return response


class BudgetMovementDetailView(generics.RetrieveAPIView):
    queryset = BudgetMovement.objects.all()
    serializer_class = BudgetMovementSerializer
    permission_classes = [IsAuthenticated, DjangoModelPermissions]


class BudgetMovementUpdateView(generics.UpdateAPIView):
    queryset = BudgetMovement.objects.all()
    serializer_class = BudgetMovementSerializer
    permission_classes = [IsAuthenticated, DjangoModelPermissions]

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)

    def update(self, request, *args, **kwargs):
        response = super().update(request, *args, **kwargs)
        response.data = {
            'message': BUDGET_MOVEMENT_MSGS['success_updated'],
            'data': response.data
        }
        return response


class BudgetMovementDeleteView(generics.DestroyAPIView):
    queryset = BudgetMovement.objects.all()
    serializer_class = BudgetMovementSerializer
    permission_classes = [IsAuthenticated, DjangoModelPermissions]

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        self.perform_destroy(instance)
        return Response({'message': BUDGET_MOVEMENT_MSGS['success_deleted']}, status=status.HTTP_204_NO_CONTENT)


# Utility API for Budget Forms
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def budget_form_metadata(request):
    """
    API endpoint to provide metadata for budget forms including available management centers.
    This endpoint helps populate dropdown fields in frontend forms.
    """
    try:
        # Obtém all active management centers
        management_centers = ManagementCenter.objects.all().order_by('name')
        centers_serializer = ManagementCenterSerializer(management_centers, many=True)
        
        # Budget categories choices
        budget_categories = Budget.BUDGET_CLASSES
        
        # Budget status choices  
        budget_status = Budget.STATUS
        
        metadata = {
            'management_centers': centers_serializer.data,
            'budget_categories': [{'value': choice[0], 'label': choice[1]} for choice in budget_categories],
            'budget_status_choices': [{'value': choice[0], 'label': choice[1]} for choice in budget_status],
            'message': 'Metadata para formulário de orçamento carregada com sucesso.'
        }
        
        return Response(metadata, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response(
            {'error': 'Erro ao carregar metadata do formulário', 'details': get_error_details(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# PDF Report Views
@api_view(['GET'])
@permission_classes([IsAuthenticated])
@throttle_classes([PDFExportRateThrottle])
def generate_budget_report_pdf(request, budget_id):
    """
    Gera e retorna um relatório PDF completo para um orçamento específico.
    Inclui dados básicos, linhas orçamentárias e histórico de movimentações.
    """
    logger = logging.getLogger(__name__)
    
    try:
        # Buscar o orçamento com otimizações de query
        budget = get_object_or_404(
            Budget.objects.select_related(
                'management_center', 'created_by', 'updated_by'
            ).prefetch_related(
                'budget_lines__management_center',
                'budget_lines__requesting_center', 
                'budget_lines__main_fiscal',
                'budget_lines__secondary_fiscal',
                'budget_lines__created_by',
                'budget_lines__updated_by',
                'outgoing_movements__destination__management_center',
                'incoming_movements__source__management_center',
                'outgoing_movements__created_by',
                'incoming_movements__created_by'
            ),
            pk=budget_id
        )
        
        logger.info(f"Generating PDF report for budget ID: {budget_id}")
        
        # Gerar o PDF
        pdf_buffer = generate_budget_pdf(budget)
        
        # Preparar a resposta HTTP com o PDF
        response = HttpResponse(pdf_buffer.read(), content_type='application/pdf')
        filename = f"relatorio_orcamento_{budget.year}_{budget.category}_{budget.management_center.name.replace(' ', '_')}.pdf"
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        
        logger.info(f"PDF report generated successfully for budget ID: {budget_id}")
        return response
        
    except Budget.DoesNotExist:
        logger.error(f"Budget with ID {budget_id} not found")
        return Response(
            {'error': 'Orçamento não encontrado', 'message': 'O orçamento especificado não existe.'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        logger.error(f"Error generating PDF report for budget ID {budget_id}: {str(e)}")
        return Response(
            {
                'error': 'Erro ao gerar relatório PDF',
                'message': 'Ocorreu um erro interno durante a geração do relatório. Tente novamente mais tarde.',
                'details': get_error_details(e)
            }, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
@throttle_classes([PDFExportRateThrottle])
def generate_budget_summary_report_pdf(request):
    """
    Gera e retorna um relatório PDF resumido com múltiplos orçamentos.
    Aceita parâmetros de filtro via query string (year, category, management_center, status).
    """
    logger = logging.getLogger(__name__)
    
    try:
        # Construir queryset com base nos filtros fornecidos
        budgets_queryset = Budget.objects.select_related(
            'management_center', 'created_by', 'updated_by'
        )
        
        # Aplicar filtros baseados nos parâmetros da query string
        year_filter = request.GET.get('year')
        if year_filter:
            budgets_queryset = budgets_queryset.filter(year=year_filter)
        
        category_filter = request.GET.get('category')
        if category_filter:
            budgets_queryset = budgets_queryset.filter(category=category_filter)
        
        management_center_filter = request.GET.get('management_center')
        if management_center_filter:
            budgets_queryset = budgets_queryset.filter(management_center_id=management_center_filter)
        
        status_filter = request.GET.get('status')
        if status_filter:
            budgets_queryset = budgets_queryset.filter(status=status_filter)
        
        # Ordenar resultados
        budgets_queryset = budgets_queryset.order_by('-year', 'category', 'management_center__name')
        
        logger.info(f"Generating summary PDF report for {budgets_queryset.count()} budgets")
        
        if not budgets_queryset.exists():
            return Response(
                {'error': 'Nenhum orçamento encontrado', 'message': 'Não há orçamentos que correspondam aos filtros aplicados.'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Gerar o PDF
        pdf_buffer = generate_budget_summary_pdf(budgets_queryset)
        
        # Preparar a resposta HTTP com o PDF
        response = HttpResponse(pdf_buffer.read(), content_type='application/pdf')
        filename_parts = []
        if year_filter:
            filename_parts.append(f"ano_{year_filter}")
        if category_filter:
            filename_parts.append(f"{category_filter.lower()}")
        
        filename_suffix = "_".join(filename_parts) if filename_parts else "todos"
        filename = f"relatorio_resumo_orcamentos_{filename_suffix}.pdf"
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        
        logger.info(f"Summary PDF report generated successfully for {budgets_queryset.count()} budgets")
        return response
        
    except Exception as e:
        logger.error(f"Error generating summary PDF report: {str(e)}")
        return Response(
            {
                'error': 'Erro ao gerar relatório resumo PDF',
                'message': 'Ocorreu um erro interno durante a geração do relatório. Tente novamente mais tarde.',
                'details': get_error_details(e)
            }, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
