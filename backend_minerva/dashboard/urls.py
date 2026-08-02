from django.urls import path
from . import views

urlpatterns = [
    path('orcamento/direcoes/', views.orcamento_direcoes, name='dashboard-orcamento-direcoes'),
    path('orcamento/resumo/', views.orcamento_resumo, name='dashboard-orcamento-resumo'),
    path('orcamento/graficos/', views.orcamento_graficos, name='dashboard-orcamento-graficos'),
]
