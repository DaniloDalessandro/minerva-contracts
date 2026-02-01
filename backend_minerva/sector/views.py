from rest_framework import generics, status, filters
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend

from .models import Direction, Management, Coordination
from .serializers import DirectionSerializer, ManagementSerializer, CoordinationSerializer
from .utils.messages import DIRECTION_MSGS, MANAGEMENT_MSGS, COORDINATION_MSGS

# ========================= DIREÇÃO =========================

class DirectionListView(generics.ListAPIView):
    queryset = Direction.objects.all()
    serializer_class = DirectionSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter, DjangoFilterBackend]
    filterset_fields = ['is_active']
    search_fields = ["name"]
    ordering_fields = ["name", "created_at"]
    ordering = ["name"]

class DirectionCreateView(generics.CreateAPIView):
    queryset = Direction.objects.all()
    serializer_class = DirectionSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user, updated_by=self.request.user)

    def create(self, request, *args, **kwargs):
        response = super().create(request, *args, **kwargs)
        response.data = {
            "message": DIRECTION_MSGS.get("success_created", "Direção criada com sucesso."),
            "data": response.data,
        }
        return response

class DirectionDetailView(generics.RetrieveAPIView):
    queryset = Direction.objects.all()
    serializer_class = DirectionSerializer
    permission_classes = [IsAuthenticated]

class DirectionUpdateView(generics.UpdateAPIView):
    queryset = Direction.objects.all()
    serializer_class = DirectionSerializer
    permission_classes = [IsAuthenticated]

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)

    def update(self, request, *args, **kwargs):
        response = super().update(request, *args, **kwargs)
        response.data = {
            "message": DIRECTION_MSGS["success_updated"],
            "data": response.data
        }
        return response

class DirectionDeleteView(generics.UpdateAPIView):
    queryset = Direction.objects.all()
    serializer_class = DirectionSerializer
    permission_classes = [IsAuthenticated]

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.is_active = False
        instance.save()
        return Response({"message": "Direção inativada com sucesso."}, status=status.HTTP_200_OK)

# ========================= GERÊNCIA =========================

class ManagementListView(generics.ListAPIView):
    queryset = Management.objects.all()
    serializer_class = ManagementSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter, DjangoFilterBackend]
    filterset_fields = ['is_active']
    search_fields = ["name"]
    ordering_fields = ["name", "created_at"]
    ordering = ["name"]

class ManagementCreateView(generics.CreateAPIView):
    queryset = Management.objects.all()
    serializer_class = ManagementSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user, updated_by=self.request.user)

    def create(self, request, *args, **kwargs):
        response = super().create(request, *args, **kwargs)
        response.data = {
            "message": MANAGEMENT_MSGS["success_created"],
            "data": response.data
        }
        return response

class ManagementDetailView(generics.RetrieveAPIView):
    queryset = Management.objects.all()
    serializer_class = ManagementSerializer
    permission_classes = [IsAuthenticated]

class ManagementUpdateView(generics.UpdateAPIView):
    queryset = Management.objects.all()
    serializer_class = ManagementSerializer
    permission_classes = [IsAuthenticated]

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)

    def update(self, request, *args, **kwargs):
        response = super().update(request, *args, **kwargs)
        response.data = {
            "message": MANAGEMENT_MSGS["success_updated"],
            "data": response.data
        }
        return response

class ManagementDeleteView(generics.UpdateAPIView):
    queryset = Management.objects.all()
    serializer_class = ManagementSerializer
    permission_classes = [IsAuthenticated]

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.is_active = False
        instance.save()
        return Response({"message": "Gerência inativada com sucesso."}, status=status.HTTP_200_OK)

# ========================= COORDENAÇÃO =========================

class CoordinationListView(generics.ListAPIView):
    queryset = Coordination.objects.all()
    serializer_class = CoordinationSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter, DjangoFilterBackend]
    filterset_fields = ['is_active']
    search_fields = ["name"]
    ordering_fields = ["name", "created_at"]
    ordering = ["name"]

class CoordinationCreateView(generics.CreateAPIView):
    queryset = Coordination.objects.all()
    serializer_class = CoordinationSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user, updated_by=self.request.user)

    def create(self, request, *args, **kwargs):
        response = super().create(request, *args, **kwargs)
        response.data = {
            "message": COORDINATION_MSGS["success_created"],
            "data": response.data
        }
        return response

class CoordinationDetailView(generics.RetrieveAPIView):
    queryset = Coordination.objects.all()
    serializer_class = CoordinationSerializer
    permission_classes = [IsAuthenticated]

class CoordinationUpdateView(generics.UpdateAPIView):
    queryset = Coordination.objects.all()
    serializer_class = CoordinationSerializer
    permission_classes = [IsAuthenticated]

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)

    def update(self, request, *args, **kwargs):
        response = super().update(request, *args, **kwargs)
        response.data = {
            "message": COORDINATION_MSGS["success_updated"],
            "data": response.data
        }
        return response

class CoordinationDeleteView(generics.UpdateAPIView):
    queryset = Coordination.objects.all()
    serializer_class = CoordinationSerializer
    permission_classes = [IsAuthenticated]

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.is_active = False
        instance.save()
        return Response({"message": "Coordenação inativada com sucesso."}, status=status.HTTP_200_OK)
