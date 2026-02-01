from rest_framework import generics
from rest_framework.response import Response
from rest_framework import status
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

#==================================== CONTRATOS ====================================

class ContractListAPIView(generics.ListAPIView):
    queryset = Contract.objects.all()
    serializer_class = ContractSerializer

    def get_queryset(self):
        # Contratos que o fiscal principal ou substituto esteja dentro do escopo
        employee_qs = get_employee_queryset(self.request.user, Employee.objects.all())

        queryset = (Contract.objects
                .select_related(
                    'budget_line__budget__management_center',
                    'main_inspector__direction',
                    'main_inspector__management',
                    'main_inspector__coordination',
                    'substitute_inspector__direction',
                    'substitute_inspector__management',
                    'substitute_inspector__coordination'
                )
                .prefetch_related('installments', 'amendments')
                .filter(main_inspector__in=employee_qs) |
                Contract.objects
                .select_related(
                    'budget_line__budget__management_center',
                    'main_inspector__direction',
                    'main_inspector__management',
                    'main_inspector__coordination',
                    'substitute_inspector__direction',
                    'substitute_inspector__management',
                    'substitute_inspector__coordination'
                )
                .prefetch_related('installments', 'amendments')
                .filter(substitute_inspector__in=employee_qs))

        # Filtro por status
        status_filter = self.request.query_params.get('status', None)
        if status_filter:
            queryset = queryset.filter(status=status_filter)

        return queryset


class ContractCreateAPIView(generics.CreateAPIView):
    queryset = Contract.objects.all()
    serializer_class = ContractSerializer

    def perform_create(self, serializer):
        user = self.request.user

        # Validação hierárquica: verifica se o usuário tem permissão para criar contrato
        if user.is_authenticated and not user.is_superuser:
            employee_qs = get_employee_queryset(user, Employee.objects.all())
            main_inspector = serializer.validated_data.get('main_inspector')
            substitute_inspector = serializer.validated_data.get('substitute_inspector')

            # Verifica se os fiscais estão na hierarquia do usuário
            if main_inspector and main_inspector not in employee_qs:
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied("Você não tem permissão para criar contratos com este fiscal principal.")

            if substitute_inspector and substitute_inspector not in employee_qs:
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied("Você não tem permissão para criar contratos com este fiscal substituto.")

        serializer.save(user=user) if user.is_authenticated else serializer.save()

    def create(self, request, *args, **kwargs):
        response = super().create(request, *args, **kwargs)
        response.data['message'] = CONTRACTS_MESSAGES['CREATE_SUCCESS']
        return response
    
    def get_queryset(self):
        # contratos que o fiscal principal ou substituto esteja dentro do escopo
        employee_qs = get_employee_queryset(self.request.user, Employee.objects.all())
        return Contract.objects.filter(main_inspector__in=employee_qs) | Contract.objects.filter(substitute_inspector__in=employee_qs)


class ContractRetrieveAPIView(generics.RetrieveAPIView):
    queryset = Contract.objects.all()
    serializer_class = ContractSerializer

    def get_queryset(self):
        # contratos que o fiscal principal ou substituto esteja dentro do escopo
        employee_qs = get_employee_queryset(self.request.user, Employee.objects.all())
        return Contract.objects.filter(main_inspector__in=employee_qs) | Contract.objects.filter(substitute_inspector__in=employee_qs)


class ContractUpdateAPIView(generics.UpdateAPIView):
    queryset = Contract.objects.all()
    serializer_class = ContractSerializer

    def update(self, request, *args, **kwargs):
        response = super().update(request, *args, **kwargs)
        response.data['message'] = CONTRACTS_MESSAGES['UPDATE_SUCCESS']
        return response


class ContractDestroyAPIView(generics.DestroyAPIView):
    queryset = Contract.objects.all()
    serializer_class = ContractSerializer

    def destroy(self, request, *args, **kwargs):
        response = super().destroy(request, *args, **kwargs)
        response.data = {'message': CONTRACTS_MESSAGES['DELETE_SUCCESS']}
        return response


class ContractToggleStatusAPIView(generics.UpdateAPIView):
    queryset = Contract.objects.all()
    serializer_class = ContractSerializer

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

#============================== PARCELAS DO CONTRATO ==============================

class ContractInstallmentListAPIView(generics.ListAPIView):
    queryset = ContractInstallment.objects.all()
    serializer_class = ContractInstallmentSerializer


class ContractInstallmentCreateAPIView(generics.CreateAPIView):
    queryset = ContractInstallment.objects.all()
    serializer_class = ContractInstallmentSerializer

    def perform_create(self, serializer):
        user = self.request.user
        serializer.save(user=user) if user.is_authenticated else serializer.save()

    def create(self, request, *args, **kwargs):
        response = super().create(request, *args, **kwargs)
        response.data['message'] = CONTRACT_INSTALLMENTS_MESSAGES['CREATE_SUCCESS']
        return response


class ContractInstallmentRetrieveAPIView(generics.RetrieveAPIView):
    queryset = ContractInstallment.objects.all()
    serializer_class = ContractInstallmentSerializer


class ContractInstallmentUpdateAPIView(generics.UpdateAPIView):
    queryset = ContractInstallment.objects.all()
    serializer_class = ContractInstallmentSerializer

    def update(self, request, *args, **kwargs):
        response = super().update(request, *args, **kwargs)
        response.data['message'] = CONTRACT_INSTALLMENTS_MESSAGES['UPDATE_SUCCESS']
        return response


class ContractInstallmentDestroyAPIView(generics.DestroyAPIView):
    queryset = ContractInstallment.objects.all()
    serializer_class = ContractInstallmentSerializer

    def destroy(self, request, *args, **kwargs):
        response = super().destroy(request, *args, **kwargs)
        response.data = {'message': CONTRACT_INSTALLMENTS_MESSAGES['DELETE_SUCCESS']}
        return response

#============================= ADITIVOS DO CONTRATO ===============================

class ContractAmendmentListAPIView(generics.ListAPIView):
    queryset = ContractAmendment.objects.all()
    serializer_class = ContractAmendmentSerializer


class ContractAmendmentCreateAPIView(generics.CreateAPIView):
    queryset = ContractAmendment.objects.all()
    serializer_class = ContractAmendmentSerializer

    def perform_create(self, serializer):
        user = self.request.user
        serializer.save(user=user) if user.is_authenticated else serializer.save()

    def create(self, request, *args, **kwargs):
        response = super().create(request, *args, **kwargs)
        response.data['message'] = CONTRACT_AMENDMENTS_MESSAGES['CREATE_SUCCESS']
        return response


class ContractAmendmentRetrieveAPIView(generics.RetrieveAPIView):
    queryset = ContractAmendment.objects.all()
    serializer_class = ContractAmendmentSerializer


class ContractAmendmentUpdateAPIView(generics.UpdateAPIView):
    queryset = ContractAmendment.objects.all()
    serializer_class = ContractAmendmentSerializer

    def update(self, request, *args, **kwargs):
        response = super().update(request, *args, **kwargs)
        response.data['message'] = CONTRACT_AMENDMENTS_MESSAGES['UPDATE_SUCCESS']
        return response


class ContractAmendmentDestroyAPIView(generics.DestroyAPIView):
    queryset = ContractAmendment.objects.all()
    serializer_class = ContractAmendmentSerializer

    def destroy(self, request, *args, **kwargs):
        response = super().destroy(request, *args, **kwargs)
        response.data = {'message': CONTRACT_AMENDMENTS_MESSAGES['DELETE_SUCCESS']}
        return response
