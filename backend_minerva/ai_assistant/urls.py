from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

# Configuração do router para ViewSets
router = DefaultRouter()
router.register(r'sessions', views.ConversationSessionViewSet, basename='session')
router.register(r'queries', views.QueryLogViewSet, basename='query')
router.register(r'schema', views.DatabaseSchemaViewSet, basename='schema')

urlpatterns = [
    # URLs do router (ViewSets)
    path('', include(router.urls)),
    
    # Endpoint principal do chat
    path('chat/', views.AliceChatView.as_view(), name='alice-chat'),
    
    # Endpoints de estatísticas e utilidades
    path('stats/', views.alice_stats, name='alice-stats'),
    path('quick/', views.quick_question, name='alice-quick'),
    
    # URLs específicas para funcionalidades avançadas
    path('sessions/<int:pk>/messages/', views.ConversationSessionViewSet.as_view({'get': 'retrieve'}), name='session-messages'),
    path('sessions/<int:pk>/send/', views.ConversationSessionViewSet.as_view({'post': 'send_message'}), name='session-send'),
    path('sessions/<int:pk>/clear/', views.ConversationSessionViewSet.as_view({'post': 'clear_session'}), name='session-clear'),
    
    # URL para listar tabelas disponíveis
    path('schema/tables/', views.DatabaseSchemaViewSet.as_view({'get': 'tables'}), name='schema-tables'),
]