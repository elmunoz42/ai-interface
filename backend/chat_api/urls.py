from django.urls import path
from . import views

urlpatterns = [
    path('health/', views.health_check, name='health_check'),
    path('info/', views.api_info, name='api_info'),
    path('huggingface/chat/', views.huggingface_chat, name='huggingface_chat'),
    path('huggingface/status/', views.huggingface_status, name='huggingface_status'),
]
