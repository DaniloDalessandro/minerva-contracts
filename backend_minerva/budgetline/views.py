from rest_framework import generics, status
from rest_framework.response import Response

from .models import BudgetLine, BudgetLineMovement, BudgetLineVersion
from .serializers import BudgetLineSerializer, BudgetLineMovementSerializer, BudgetLineVersionSerializer
from .utils.message import BUDGETSLINE_MESSAGES


# Budget Line Views


class BudgetLineListAPIView(generics.ListAPIView):
    queryset = BudgetLine.objects.all()
    serializer_class = BudgetLineSerializer


class BudgetLineCreateAPIView(generics.CreateAPIView):
    queryset = BudgetLine.objects.all()
    serializer_class = BudgetLineSerializer

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


class BudgetLineRetrieveAPIView(generics.RetrieveAPIView):
    queryset = BudgetLine.objects.all()
    serializer_class = BudgetLineSerializer


class BudgetLineUpdateAPIView(generics.UpdateAPIView):
    queryset = BudgetLine.objects.all()
    serializer_class = BudgetLineSerializer

    def perform_update(self, serializer):
        serializer.save()

    def update(self, request, *args, **kwargs):
        response = super().update(request, *args, **kwargs)
        response.data = {
            'message': BUDGETSLINE_MESSAGES['UPDATE_SUCCESS'],
            'data': response.data
        }
        return response


class BudgetLineDestroyAPIView(generics.DestroyAPIView):
    queryset = BudgetLine.objects.all()
    serializer_class = BudgetLineSerializer

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        self.perform_destroy(instance)
        return Response(
            {'message': BUDGETSLINE_MESSAGES['DELETE_SUCCESS']},
            status=status.HTTP_204_NO_CONTENT
        )

    def perform_destroy(self, instance):
        instance.delete()


# Budget Line Movement Views


class BudgetLineMovementListAPIView(generics.ListAPIView):
    queryset = BudgetLineMovement.objects.all()
    serializer_class = BudgetLineMovementSerializer


class BudgetLineMovementCreateAPIView(generics.CreateAPIView):
    queryset = BudgetLineMovement.objects.all()
    serializer_class = BudgetLineMovementSerializer

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


class BudgetLineMovementRetrieveAPIView(generics.RetrieveAPIView):
    queryset = BudgetLineMovement.objects.all()
    serializer_class = BudgetLineMovementSerializer


class BudgetLineMovementUpdateAPIView(generics.UpdateAPIView):
    queryset = BudgetLineMovement.objects.all()
    serializer_class = BudgetLineMovementSerializer

    def perform_update(self, serializer):
        serializer.save()

    def update(self, request, *args, **kwargs):
        response = super().update(request, *args, **kwargs)
        response.data = {
            'message': BUDGETSLINE_MESSAGES['UPDATE_SUCCESS'],
            'data': response.data
        }
        return response


class BudgetLineMovementDestroyAPIView(generics.DestroyAPIView):
    queryset = BudgetLineMovement.objects.all()
    serializer_class = BudgetLineMovementSerializer

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        self.perform_destroy(instance)
        return Response(
            {'message': BUDGETSLINE_MESSAGES['DELETE_SUCCESS']},
            status=status.HTTP_204_NO_CONTENT
        )

    def perform_destroy(self, instance):
        instance.delete()



# Budget Line Version Views


class BudgetLineVersionListAPIView(generics.ListAPIView):
    serializer_class = BudgetLineVersionSerializer
    
    def get_queryset(self):
        budget_line_id = self.kwargs.get('budget_line_id')
        if budget_line_id:
            return BudgetLineVersion.objects.filter(budget_line_id=budget_line_id).select_related(
                'created_by', 'management_center', 'requesting_center', 'main_fiscal', 'secondary_fiscal'
            ).order_by('-version_number')
        return BudgetLineVersion.objects.all().select_related(
            'budget_line', 'created_by', 'management_center', 'requesting_center', 'main_fiscal', 'secondary_fiscal'
        ).order_by('-created_at')


class BudgetLineVersionRetrieveAPIView(generics.RetrieveAPIView):
    queryset = BudgetLineVersion.objects.select_related(
        'budget_line', 'created_by', 'management_center', 'requesting_center', 'main_fiscal', 'secondary_fiscal'
    )
    serializer_class = BudgetLineVersionSerializer


class BudgetLineVersionCreateAPIView(generics.CreateAPIView):
    queryset = BudgetLineVersion.objects.all()
    serializer_class = BudgetLineVersionSerializer
    
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
