from drf_spectacular.utils import extend_schema
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from accounts.permissions import IsManagerOrAbove

from .models import BudgetLine, BudgetLineMovement, BudgetLineVersion
from .serializers import BudgetLineSerializer, BudgetLineMovementSerializer, BudgetLineVersionSerializer
from .utils.message import BUDGETSLINE_MESSAGES


_BUDGETLINE_SELECT = (
    'budget__management_center',
    'management_center',
    'requesting_center',
    'main_fiscal',
    'secondary_fiscal',
    'created_by',
    'updated_by',
)

_MOVEMENT_SELECT = (
    'source_line__budget',
    'destination_line__budget',
    'created_by',
    'updated_by',
)



@extend_schema(tags=['Linhas Orçamentárias'])
class BudgetLineListAPIView(generics.ListAPIView):
    queryset = BudgetLine.objects.select_related(*_BUDGETLINE_SELECT)
    serializer_class = BudgetLineSerializer
    permission_classes = [IsAuthenticated]


@extend_schema(tags=['Linhas Orçamentárias'])
class BudgetLineCreateAPIView(generics.CreateAPIView):
    queryset = BudgetLine.objects.all()
    serializer_class = BudgetLineSerializer
    permission_classes = [IsAuthenticated, IsManagerOrAbove]

    def perform_create(self, serializer):
        user = self.request.user
        serializer.save(
            created_by=user if user.is_authenticated else None,
            updated_by=user if user.is_authenticated else None
        )

    def create(self, request, *args, **kwargs):
        response = super().create(request, *args, **kwargs)
        response.data = {
            'message': BUDGETSLINE_MESSAGES['CREATE_SUCCESS'],
            'data': response.data
        }
        return response


@extend_schema(tags=['Linhas Orçamentárias'])
class BudgetLineRetrieveAPIView(generics.RetrieveAPIView):
    queryset = BudgetLine.objects.select_related(*_BUDGETLINE_SELECT)
    serializer_class = BudgetLineSerializer
    permission_classes = [IsAuthenticated]


@extend_schema(tags=['Linhas Orçamentárias'])
class BudgetLineUpdateAPIView(generics.UpdateAPIView):
    queryset = BudgetLine.objects.select_related(*_BUDGETLINE_SELECT)
    serializer_class = BudgetLineSerializer
    permission_classes = [IsAuthenticated, IsManagerOrAbove]

    def perform_update(self, serializer):
        serializer.save()

    def update(self, request, *args, **kwargs):
        response = super().update(request, *args, **kwargs)
        response.data = {
            'message': BUDGETSLINE_MESSAGES['UPDATE_SUCCESS'],
            'data': response.data
        }
        return response


@extend_schema(tags=['Linhas Orçamentárias'])
class BudgetLineDestroyAPIView(generics.DestroyAPIView):
    queryset = BudgetLine.objects.all()
    serializer_class = BudgetLineSerializer
    permission_classes = [IsAuthenticated, IsManagerOrAbove]

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        self.perform_destroy(instance)
        return Response(
            {'message': BUDGETSLINE_MESSAGES['DELETE_SUCCESS']},
            status=status.HTTP_204_NO_CONTENT
        )

    def perform_destroy(self, instance):
        instance.delete()



@extend_schema(tags=['Linhas Orçamentárias'])
class BudgetLineMovementListAPIView(generics.ListAPIView):
    queryset = BudgetLineMovement.objects.select_related(*_MOVEMENT_SELECT)
    serializer_class = BudgetLineMovementSerializer
    permission_classes = [IsAuthenticated]


@extend_schema(tags=['Linhas Orçamentárias'])
class BudgetLineMovementCreateAPIView(generics.CreateAPIView):
    queryset = BudgetLineMovement.objects.all()
    serializer_class = BudgetLineMovementSerializer
    permission_classes = [IsAuthenticated, IsManagerOrAbove]

    def perform_create(self, serializer):
        user = self.request.user
        serializer.save(
            created_by=user if user.is_authenticated else None,
            updated_by=user if user.is_authenticated else None
        )

    def create(self, request, *args, **kwargs):
        response = super().create(request, *args, **kwargs)
        response.data = {
            'message': BUDGETSLINE_MESSAGES['CREATE_SUCCESS'],
            'data': response.data
        }
        return response


@extend_schema(tags=['Linhas Orçamentárias'])
class BudgetLineMovementRetrieveAPIView(generics.RetrieveAPIView):
    queryset = BudgetLineMovement.objects.select_related(*_MOVEMENT_SELECT)
    serializer_class = BudgetLineMovementSerializer
    permission_classes = [IsAuthenticated]


@extend_schema(tags=['Linhas Orçamentárias'])
class BudgetLineMovementUpdateAPIView(generics.UpdateAPIView):
    queryset = BudgetLineMovement.objects.select_related(*_MOVEMENT_SELECT)
    serializer_class = BudgetLineMovementSerializer
    permission_classes = [IsAuthenticated, IsManagerOrAbove]

    def perform_update(self, serializer):
        serializer.save()

    def update(self, request, *args, **kwargs):
        response = super().update(request, *args, **kwargs)
        response.data = {
            'message': BUDGETSLINE_MESSAGES['UPDATE_SUCCESS'],
            'data': response.data
        }
        return response


@extend_schema(tags=['Linhas Orçamentárias'])
class BudgetLineMovementDestroyAPIView(generics.DestroyAPIView):
    queryset = BudgetLineMovement.objects.all()
    serializer_class = BudgetLineMovementSerializer
    permission_classes = [IsAuthenticated, IsManagerOrAbove]

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        self.perform_destroy(instance)
        return Response(
            {'message': BUDGETSLINE_MESSAGES['DELETE_SUCCESS']},
            status=status.HTTP_204_NO_CONTENT
        )

    def perform_destroy(self, instance):
        instance.delete()



@extend_schema(tags=['Linhas Orçamentárias'])
class BudgetLineVersionListAPIView(generics.ListAPIView):
    serializer_class = BudgetLineVersionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        budget_line_id = self.kwargs.get('budget_line_id')
        if budget_line_id:
            return BudgetLineVersion.objects.filter(budget_line_id=budget_line_id).select_related(
                'created_by', 'management_center', 'requesting_center', 'main_fiscal', 'secondary_fiscal'
            ).order_by('-version_number')
        return BudgetLineVersion.objects.all().select_related(
            'budget_line', 'created_by', 'management_center', 'requesting_center', 'main_fiscal', 'secondary_fiscal'
        ).order_by('-created_at')


@extend_schema(tags=['Linhas Orçamentárias'])
class BudgetLineVersionRetrieveAPIView(generics.RetrieveAPIView):
    queryset = BudgetLineVersion.objects.select_related(
        'budget_line', 'created_by', 'management_center', 'requesting_center', 'main_fiscal', 'secondary_fiscal'
    )
    serializer_class = BudgetLineVersionSerializer
    permission_classes = [IsAuthenticated]


@extend_schema(tags=['Linhas Orçamentárias'])
class BudgetLineVersionCreateAPIView(generics.CreateAPIView):
    queryset = BudgetLineVersion.objects.all()
    serializer_class = BudgetLineVersionSerializer
    permission_classes = [IsAuthenticated, IsManagerOrAbove]

    def perform_create(self, serializer):
        budget_line = serializer.validated_data['budget_line']
        latest_version = budget_line.versions.first()
        version_number = (latest_version.version_number + 1) if latest_version else 1

        serializer.save(
            version_number=version_number,
            created_by=self.request.user if self.request.user.is_authenticated else None
        )

    def create(self, request, *args, **kwargs):
        response = super().create(request, *args, **kwargs)
        response.data = {
            'message': 'Versão da linha orçamentária criada com sucesso',
            'data': response.data
        }
        return response
