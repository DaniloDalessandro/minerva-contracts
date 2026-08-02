from drf_spectacular.utils import extend_schema
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser, IsAuthenticated
from accounts.permissions import IsManagerOrAbove
from core.pagination import CustomPageNumberPagination
from .models import Employee
from .utils.access_control import get_employee_queryset
from .serializers import EmployeeSerializer, EmployeeWriteSerializer
from .utils.messages import EMPLOYEE_MESSAGES

@extend_schema(tags=['Colaboradores'])
class EmployeeListView(generics.ListAPIView):
    queryset = Employee.objects.all()
    serializer_class = EmployeeSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = CustomPageNumberPagination

    def get_queryset(self):
        import logging
        logger = logging.getLogger(__name__)
        logger.info(f"Usuario fazendo requisicao: {self.request.user.email}")

        queryset = Employee.objects.select_related('direction', 'management', 'coordination').all()


        from accounts.models import User
        superuser_emails = User.objects.filter(is_superuser=True).values('email')
        queryset = queryset.exclude(email__in=superuser_emails)


        queryset = get_employee_queryset(self.request.user, queryset)



        status_filter = self.request.query_params.get('status', None)
        if status_filter and status_filter.upper() != 'ALL' and status_filter.strip() != '':
            queryset = queryset.filter(status=status_filter)


        search = self.request.query_params.get('search', None)
        if search:
            from django.db.models import Q
            queryset = queryset.filter(
                Q(full_name__icontains=search) |
                Q(cpf__icontains=search) |
                Q(email__icontains=search) |
                Q(employee_id__icontains=search) |
                Q(direction__name__icontains=search) |
                Q(management__name__icontains=search) |
                Q(coordination__name__icontains=search)
            )

        logger.info(f"Total employees retornados: {queryset.count()}")
        return queryset


@extend_schema(tags=['Colaboradores'])
class EmployeeCreateView(generics.CreateAPIView):
    queryset = Employee.objects.all()
    serializer_class = EmployeeWriteSerializer
    permission_classes = [IsAuthenticated, IsManagerOrAbove]

    def perform_create(self, serializer):
        serializer.save(
            created_by=self.request.user,
            updated_by=self.request.user
        )

    def create(self, request, *args, **kwargs):
        write_serializer = self.get_serializer(data=request.data)
        write_serializer.is_valid(raise_exception=True)
        instance = write_serializer.save(
            created_by=self.request.user,
            updated_by=self.request.user
        )
        read_serializer = EmployeeSerializer(instance)
        return Response({
            'message': EMPLOYEE_MESSAGES['created'],
            'data': read_serializer.data
        }, status=status.HTTP_201_CREATED)



@extend_schema(tags=['Colaboradores'])
class EmployeeRetrieveView(generics.RetrieveAPIView):
    queryset = Employee.objects.all()
    serializer_class = EmployeeSerializer
    permission_classes = [IsAuthenticated]


@extend_schema(tags=['Colaboradores'])
class EmployeeUpdateView(generics.UpdateAPIView):
    queryset = Employee.objects.all()
    serializer_class = EmployeeWriteSerializer
    permission_classes = [IsAuthenticated, IsManagerOrAbove]

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        write_serializer = self.get_serializer(instance, data=request.data, partial=kwargs.get('partial', False))
        write_serializer.is_valid(raise_exception=True)
        updated_instance = write_serializer.save(updated_by=request.user)
        read_serializer = EmployeeSerializer(updated_instance)
        return Response({
            'message': EMPLOYEE_MESSAGES['updated'],
            **read_serializer.data
        })


@extend_schema(tags=['Colaboradores'])
class EmployeeToggleStatusView(generics.UpdateAPIView):
    queryset = Employee.objects.all()
    serializer_class = EmployeeSerializer
    permission_classes = [IsAuthenticated, IsManagerOrAbove]

    def patch(self, request, *args, **kwargs):
        instance = self.get_object()
        new_status = 'INATIVO' if instance.status == 'ATIVO' else 'ATIVO'

        instance.status = new_status
        instance.updated_by = request.user
        instance.save()

        read_serializer = EmployeeSerializer(instance)
        action = 'ativado' if new_status == 'ATIVO' else 'inativado'

        return Response({
            'message': f'Colaborador {action} com sucesso.',
            **read_serializer.data
        })
