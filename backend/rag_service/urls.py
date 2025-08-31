from django.urls import path
from . import views

urlpatterns = [
    path('status/', views.rag_status, name='rag_status'),
    path('upload/', views.upload_documents, name='upload_documents'),
    path('search/', views.similarity_search, name='similarity_search'),
    path('query/', views.rag_query, name='rag_query'),
    path('clear/', views.clear_vector_store, name='clear_vector_store'),
]
