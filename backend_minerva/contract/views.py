from drf_spectacular.utils import extend_schema
from rest_framework import generics
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import api_view, permission_classes
from django.utils import timezone
from datetime import timedelta
from django.db.models import Sum, Count, Q
from accounts.permissions import IsCoordinatorOrAbove
from .models import ContractInstallment, ContractAmendment, Contract
from employee.utils.access_control import get_employee_queryset
from employee.models import Employee
from .serializers import (
    ContractInstallmentSerializer,
    ContractAmendmentSerializer,
    ContractSerializer,
)
from .utils.messages import (
    CONTRACTS_MESSAGES,
    CONTRACT_INSTALLMENTS_MESSAGES,
    CONTRACT_AMENDMENTS_MESSAGES,
)



@extend_schema(tags=['Contratos'])
class ContractListAPIView(generics.ListAPIView):
    queryset = Contract.objects.all()
    serializer_class = ContractSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        from django.db.models import Q
        employee_qs = get_employee_queryset(self.request.user, Employee.objects.all())

        queryset = (Contract.objects
            .select_related(
                'budget_line__budget__management_center',
                'main_inspector__direction',
                'main_inspector__management',
                'main_inspector__coordination',
                'substitute_inspector__direction',
                'substitute_inspector__management',
                'substitute_inspector__coordination',
                'created_by',
                'updated_by',
            )
            .prefetch_related('installments', 'amendments')
            .filter(
                Q(main_inspector__in=employee_qs) | Q(substitute_inspector__in=employee_qs)
            )
            .distinct()
        )

        status_filter = self.request.query_params.get('status', None)
        if status_filter:
            queryset = queryset.filter(status=status_filter)

        budget_line_filter = self.request.query_params.get('budget_line', None)
        if budget_line_filter:
            queryset = queryset.filter(budget_line_id=budget_line_filter)

        return queryset


@extend_schema(tags=['Contratos'])
class ContractCreateAPIView(generics.CreateAPIView):
    queryset = Contract.objects.all()
    serializer_class = ContractSerializer
    permission_classes = [IsAuthenticated, IsCoordinatorOrAbove]

    def perform_create(self, serializer):
        user = self.request.user


        if user.is_authenticated and not user.is_superuser:
            employee_qs = get_employee_queryset(user, Employee.objects.all())
            main_inspector = serializer.validated_data.get('main_inspector')
            substitute_inspector = serializer.validated_data.get('substitute_inspector')


            if main_inspector and main_inspector not in employee_qs:
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied("Você não tem permissão para criar contratos com este fiscal principal.")

            if substitute_inspector and substitute_inspector not in employee_qs:
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied("Você não tem permissão para criar contratos com este fiscal substituto.")

        serializer.save(created_by=user, updated_by=user)

    def create(self, request, *args, **kwargs):
        response = super().create(request, *args, **kwargs)
        response.data['message'] = CONTRACTS_MESSAGES['CREATE_SUCCESS']
        return response

    def get_queryset(self):

        employee_qs = get_employee_queryset(self.request.user, Employee.objects.all())
        return Contract.objects.filter(main_inspector__in=employee_qs) | Contract.objects.filter(substitute_inspector__in=employee_qs)


@extend_schema(tags=['Contratos'])
class ContractRetrieveAPIView(generics.RetrieveAPIView):
    queryset = Contract.objects.all()
    serializer_class = ContractSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):

        employee_qs = get_employee_queryset(self.request.user, Employee.objects.all())
        return Contract.objects.filter(main_inspector__in=employee_qs) | Contract.objects.filter(substitute_inspector__in=employee_qs)


@extend_schema(tags=['Contratos'])
class ContractUpdateAPIView(generics.UpdateAPIView):
    queryset = Contract.objects.all()
    serializer_class = ContractSerializer
    permission_classes = [IsAuthenticated, IsCoordinatorOrAbove]

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)

    def update(self, request, *args, **kwargs):
        response = super().update(request, *args, **kwargs)
        response.data['message'] = CONTRACTS_MESSAGES['UPDATE_SUCCESS']
        return response


@extend_schema(tags=['Contratos'])
class ContractDestroyAPIView(generics.DestroyAPIView):
    queryset = Contract.objects.all()
    serializer_class = ContractSerializer
    permission_classes = [IsAuthenticated, IsCoordinatorOrAbove]

    def destroy(self, request, *args, **kwargs):
        response = super().destroy(request, *args, **kwargs)
        response.data = {'message': CONTRACTS_MESSAGES['DELETE_SUCCESS']}
        return response


@extend_schema(tags=['Contratos'])
class ContractToggleStatusAPIView(generics.UpdateAPIView):
    queryset = Contract.objects.all()
    serializer_class = ContractSerializer
    permission_classes = [IsAuthenticated, IsCoordinatorOrAbove]

    def patch(self, request, *args, **kwargs):
        instance = self.get_object()
        new_status = 'ENCERRADO' if instance.status == 'ATIVO' else 'ATIVO'

        instance.status = new_status
        instance.updated_by = request.user
        instance.save()

        serializer = ContractSerializer(instance)
        action = 'ativado' if new_status == 'ATIVO' else 'encerrado'

        return Response({
            'message': f'Contrato {action} com sucesso.',
            **serializer.data
        })



@extend_schema(tags=['Contratos'])
class ContractInstallmentListAPIView(generics.ListAPIView):
    queryset = ContractInstallment.objects.select_related('contract', 'created_by', 'updated_by')
    serializer_class = ContractInstallmentSerializer
    permission_classes = [IsAuthenticated]


@extend_schema(tags=['Contratos'])
class ContractInstallmentCreateAPIView(generics.CreateAPIView):
    queryset = ContractInstallment.objects.all()
    serializer_class = ContractInstallmentSerializer
    permission_classes = [IsAuthenticated, IsCoordinatorOrAbove]

    def perform_create(self, serializer):
        user = self.request.user
        serializer.save(created_by=user, updated_by=user)

    def create(self, request, *args, **kwargs):
        response = super().create(request, *args, **kwargs)
        response.data['message'] = CONTRACT_INSTALLMENTS_MESSAGES['CREATE_SUCCESS']
        return response


@extend_schema(tags=['Contratos'])
class ContractInstallmentRetrieveAPIView(generics.RetrieveAPIView):
    queryset = ContractInstallment.objects.all()
    serializer_class = ContractInstallmentSerializer
    permission_classes = [IsAuthenticated]


@extend_schema(tags=['Contratos'])
class ContractInstallmentUpdateAPIView(generics.UpdateAPIView):
    queryset = ContractInstallment.objects.all()
    serializer_class = ContractInstallmentSerializer
    permission_classes = [IsAuthenticated, IsCoordinatorOrAbove]

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)

    def update(self, request, *args, **kwargs):
        response = super().update(request, *args, **kwargs)
        response.data['message'] = CONTRACT_INSTALLMENTS_MESSAGES['UPDATE_SUCCESS']
        return response


@extend_schema(tags=['Contratos'])
class ContractInstallmentDestroyAPIView(generics.DestroyAPIView):
    queryset = ContractInstallment.objects.all()
    serializer_class = ContractInstallmentSerializer
    permission_classes = [IsAuthenticated, IsCoordinatorOrAbove]

    def destroy(self, request, *args, **kwargs):
        response = super().destroy(request, *args, **kwargs)
        response.data = {'message': CONTRACT_INSTALLMENTS_MESSAGES['DELETE_SUCCESS']}
        return response



@extend_schema(tags=['Contratos'])
class ContractAmendmentListAPIView(generics.ListAPIView):
    queryset = ContractAmendment.objects.select_related('contract', 'created_by', 'updated_by')
    serializer_class = ContractAmendmentSerializer
    permission_classes = [IsAuthenticated]


@extend_schema(tags=['Contratos'])
class ContractAmendmentCreateAPIView(generics.CreateAPIView):
    queryset = ContractAmendment.objects.all()
    serializer_class = ContractAmendmentSerializer
    permission_classes = [IsAuthenticated, IsCoordinatorOrAbove]

    def perform_create(self, serializer):
        user = self.request.user
        serializer.save(created_by=user, updated_by=user)

    def create(self, request, *args, **kwargs):
        response = super().create(request, *args, **kwargs)
        response.data['message'] = CONTRACT_AMENDMENTS_MESSAGES['CREATE_SUCCESS']
        return response


@extend_schema(tags=['Contratos'])
class ContractAmendmentRetrieveAPIView(generics.RetrieveAPIView):
    queryset = ContractAmendment.objects.all()
    serializer_class = ContractAmendmentSerializer
    permission_classes = [IsAuthenticated]


@extend_schema(tags=['Contratos'])
class ContractAmendmentUpdateAPIView(generics.UpdateAPIView):
    queryset = ContractAmendment.objects.all()
    serializer_class = ContractAmendmentSerializer
    permission_classes = [IsAuthenticated, IsCoordinatorOrAbove]

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)

    def update(self, request, *args, **kwargs):
        response = super().update(request, *args, **kwargs)
        response.data['message'] = CONTRACT_AMENDMENTS_MESSAGES['UPDATE_SUCCESS']
        return response


@extend_schema(tags=['Contratos'])
class ContractAmendmentDestroyAPIView(generics.DestroyAPIView):
    queryset = ContractAmendment.objects.all()
    serializer_class = ContractAmendmentSerializer
    permission_classes = [IsAuthenticated, IsCoordinatorOrAbove]

    def destroy(self, request, *args, **kwargs):
        response = super().destroy(request, *args, **kwargs)
        response.data = {'message': CONTRACT_AMENDMENTS_MESSAGES['DELETE_SUCCESS']}
        return response




@extend_schema(tags=['Contratos'])
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_stats(request):
    """
    Retorna métricas consolidadas para o dashboard principal.
    Filtra automaticamente pelo escopo hierárquico do usuário.
    Usuários com acesso total recebem estatísticas executivas adicionais (admin_stats).
    """
    today = timezone.now().date()
    user = request.user

    # --- Scope determination ---
    is_superuser = user.is_superuser
    try:
        user_group = user.groups.values_list('name', flat=True).first() if not is_superuser else 'PRESIDENTE'
    except Exception:
        user_group = None

    full_access = is_superuser or user_group == 'PRESIDENTE'
    scope_level = 'admin' if is_superuser else (user_group or 'FUNCIONARIO').lower()

    emp = getattr(user, 'employee', None)
    if full_access:
        scope_name = 'Sistema'
    elif user_group == 'DIRETOR' and emp and emp.direction:
        scope_name = str(emp.direction)
    elif user_group == 'GERENTE' and emp and emp.management:
        scope_name = str(emp.management)
    elif emp and emp.coordination:
        scope_name = str(emp.coordination)
    else:
        scope_name = 'Sem escopo'

    employee_qs = get_employee_queryset(user, Employee.objects.all())

    base_qs = Contract.objects.filter(
        Q(main_inspector__in=employee_qs) | Q(substitute_inspector__in=employee_qs)
    ).distinct()

    total = base_qs.count()
    ativos = base_qs.filter(status='ATIVO').count()
    encerrados = base_qs.filter(status='ENCERRADO').count()
    expiring_30 = base_qs.filter(
        status='ATIVO',
        expiration_date__gte=today,
        expiration_date__lte=today + timedelta(days=30),
    ).count()
    expired = base_qs.filter(
        status='ATIVO',
        expiration_date__lt=today,
    ).count()

    expiring_list = list(
        base_qs.filter(
            status='ATIVO',
            expiration_date__gte=today,
            expiration_date__lte=today + timedelta(days=30),
        )
        .select_related('main_inspector')
        .order_by('expiration_date')
        .values(
            'protocol_number', 'description', 'expiration_date',
            'current_value', 'main_inspector__full_name',
        )[:10]
    )

    recent_list = list(
        base_qs.filter(created_at__gte=today - timedelta(days=7))
        .order_by('-created_at')
        .values('protocol_number', 'description', 'original_value', 'created_at')[:5]
    )

    status_breakdown = [
        {'name': 'Ativos', 'value': ativos},
        {'name': 'Encerrados', 'value': encerrados},
        {'name': 'Vencidos', 'value': expired},
    ]

    # Scoped employee count
    total_employees = employee_qs.filter(status='ATIVO').count()

    # Scoped budget total
    from budget.models import Budget
    if full_access:
        budget_agg = Budget.objects.aggregate(total=Sum('total_amount'))
    elif user_group == 'DIRETOR' and emp and emp.direction:
        budget_agg = Budget.objects.filter(management_center__direction=emp.direction).aggregate(total=Sum('total_amount'))
    elif user_group == 'GERENTE' and emp and emp.management:
        budget_agg = Budget.objects.filter(management_center__management=emp.management).aggregate(total=Sum('total_amount'))
    elif emp and emp.coordination:
        budget_agg = Budget.objects.filter(management_center__coordination=emp.coordination).aggregate(total=Sum('total_amount'))
    else:
        budget_agg = {'total': 0}

    # Scoped aids count
    from aid.models import Assistance
    if full_access:
        total_aids = Assistance.objects.count()
    else:
        total_aids = Assistance.objects.filter(employee__in=employee_qs).count()

    response_data = {
        'scope_level': scope_level,
        'full_access': full_access,
        'scope_name': scope_name,
        'contracts': {
            'total': total,
            'active': ativos,
            'closed': encerrados,
            'expiring_30_days': expiring_30,
            'expired': expired,
        },
        'employees': {'active': total_employees},
        'budget': {'total': float(budget_agg['total'] or 0)},
        'aids': {'total': total_aids},
        'expiring_contracts': expiring_list,
        'recent_contracts': recent_list,
        'status_breakdown': status_breakdown,
    }

    # --- Extra stats for DIRETOR and GERENTE (scoped top fiscais) ---
    if not full_access and user_group in ('DIRETOR', 'GERENTE'):
        from django.db.models import Count as DbCount
        top_fiscais_scoped = list(
            employee_qs.annotate(
                contract_count=DbCount(
                    'contracts_main_inspector',
                    filter=Q(contracts_main_inspector__status='ATIVO'),
                    distinct=True,
                )
            ).filter(contract_count__gt=0)
            .order_by('-contract_count')[:5]
            .values('full_name', 'position', 'contract_count')
        )
        response_data['extra_stats'] = {'top_fiscais': top_fiscais_scoped}

    # --- Extra stats for full-access users (admin/presidente) ---
    if full_access:
        from django.db.models import Count as DbCount
        from django.contrib.auth import get_user_model
        UserModel = get_user_model()

        users_total = UserModel.objects.filter(is_active=True).count()

        # Top 10 fiscais by active contract count
        top_fiscais = list(
            Employee.objects.annotate(
                contract_count=DbCount(
                    'contracts_main_inspector',
                    filter=Q(contracts_main_inspector__status='ATIVO'),
                    distinct=True,
                )
            ).filter(contract_count__gt=0)
            .order_by('-contract_count')[:10]
            .values('full_name', 'position', 'contract_count')
        )

        # Top 10 contracts by current value (active)
        top_contracts = list(
            Contract.objects.filter(status='ATIVO')
            .order_by('-current_value')[:10]
            .values('protocol_number', 'description', 'current_value', 'main_inspector__full_name')
        )

        # Budget breakdown by category
        budget_by_category = list(
            Budget.objects.values('category').annotate(
                total=Sum('total_amount'),
                available=Sum('available_amount'),
                count=DbCount('id'),
            ).order_by('category')
        )

        budget_totals = Budget.objects.aggregate(
            total=Sum('total_amount'),
            available=Sum('available_amount'),
        )

        no_end_date = Contract.objects.filter(status='ATIVO', end_date__isnull=True).count()

        from budgetline.models import BudgetLine
        lines_agg = BudgetLine.objects.aggregate(
            total=DbCount('id'),
            active=DbCount('id', filter=Q(status='ATIVO')),
        )

        response_data['admin_stats'] = {
            'users_total': users_total,
            'top_fiscais': top_fiscais,
            'top_contracts_by_value': [
                {**c, 'current_value': float(c['current_value'])}
                for c in top_contracts
            ],
            'budget_by_category': [
                {
                    'category': b['category'],
                    'total': float(b['total'] or 0),
                    'available': float(b['available'] or 0),
                    'count': b['count'],
                }
                for b in budget_by_category
            ],
            'budget_total': float(budget_totals['total'] or 0),
            'budget_available': float(budget_totals['available'] or 0),
            'contracts_without_end_date': no_end_date,
            'lines_total': lines_agg['total'],
            'lines_active': lines_agg['active'],
        }

    return Response(response_data)
