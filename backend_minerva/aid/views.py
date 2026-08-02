from drf_spectacular.utils import extend_schema
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from accounts.permissions import IsCoordinatorOrAbove
from django.db.models import Q

from core.pagination import CustomPageNumberPagination
from .models import Assistance
from .serializers import AidSerializer
from .utils.exceptions import AidNotFound
from .utils.messages import AID_MESSAGES



@extend_schema(tags=['Auxílios'])
class AidListAPIView(generics.ListAPIView):
    queryset = Assistance.objects.all()
    serializer_class = AidSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = CustomPageNumberPagination

    def get_queryset(self):
        import logging
        logger = logging.getLogger(__name__)

        queryset = Assistance.objects.select_related(
            'employee', 'budget_line', 'created_by', 'updated_by'
        ).all()

        logger.info(f"[AID] Total antes do filtro: {queryset.count()}")



        status_filter = self.request.query_params.get('status', None)
        logger.info(f"[AID] Status filter recebido: '{status_filter}'")

        if status_filter and status_filter.upper() != 'ALL' and status_filter.strip() != '':
            queryset = queryset.filter(status=status_filter)
            logger.info(f"[AID] Após filtro status={status_filter}: {queryset.count()} registros")


        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(employee__full_name__icontains=search) |
                Q(employee__cpf__icontains=search) |
                Q(budget_line__name__icontains=search) |
                Q(type__icontains=search) |
                Q(notes__icontains=search)
            )


        ordering = self.request.query_params.get('ordering', None)
        if ordering:
            queryset = queryset.order_by(ordering)

        logger.info(f"[AID] Total final retornado: {queryset.count()}")
        return queryset



@extend_schema(tags=['Auxílios'])
class AidCreateAPIView(generics.CreateAPIView):
    queryset = Assistance.objects.all()
    serializer_class = AidSerializer
    permission_classes = [IsAuthenticated, IsCoordinatorOrAbove]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user, updated_by=self.request.user)

    def create(self, request, *args, **kwargs):
        response = super().create(request, *args, **kwargs)
        response.data = {
            'message': AID_MESSAGES['success_created'],
            'data': response.data
        }
        return response



@extend_schema(tags=['Auxílios'])
class AidRetrieveAPIView(generics.RetrieveAPIView):
    queryset = Assistance.objects.select_related('employee', 'budget', 'budget_line', 'created_by', 'updated_by')
    serializer_class = AidSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        try:
            return self.get_queryset().get(pk=self.kwargs['pk'])
        except Assistance.DoesNotExist:
            raise AidNotFound



@extend_schema(tags=['Auxílios'])
class AidUpdateAPIView(generics.UpdateAPIView):
    queryset = Assistance.objects.all()
    serializer_class = AidSerializer
    permission_classes = [IsAuthenticated, IsCoordinatorOrAbove]

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)

    def update(self, request, *args, **kwargs):
        response = super().update(request, *args, **kwargs)
        response.data = {
            'message': AID_MESSAGES['success_updated'],
            'data': response.data
        }
        return response



@extend_schema(tags=['Auxílios'])
class AidDestroyAPIView(generics.DestroyAPIView):
    queryset = Assistance.objects.all()
    serializer_class = AidSerializer
    permission_classes = [IsAuthenticated, IsCoordinatorOrAbove]

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        self.perform_destroy(instance)
        return Response({'message': AID_MESSAGES['success_deleted']}, status=status.HTTP_204_NO_CONTENT)
