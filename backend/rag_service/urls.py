from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

# Create router for ViewSets
router = DefaultRouter()
router.register(r'documents', views.DocumentViewSet)

urlpatterns = [
    # Include router URLs
    path('', include(router.urls)),
    
    # Custom endpoints
    path('upload/', views.upload_document, name='upload_document'),
    path('status/', views.rag_status, name='rag_status'),
    path('search/', views.search_documents, name='search_documents'),
    path('chat/', views.rag_chat, name='rag_chat'),
    path('clear/', views.clear_vector_store, name='clear_vector_store'),
]
