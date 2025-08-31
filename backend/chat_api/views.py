from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
import json

@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    """Simple health check endpoint"""
    return Response({
        'status': 'healthy',
        'message': 'Django backend is running',
        'version': '1.0.0',
        'services': {
            'django': 'running',
            'database': 'connected',
            'faiss': 'ready for setup'
        }
    })

@api_view(['GET'])
@permission_classes([AllowAny])
def api_info(request):
    """API information endpoint"""
    return Response({
        'api_name': 'AI Chat Backend',
        'version': '1.0.0',
        'endpoints': {
            'health': '/api/health/',
            'chat': '/api/chat/',
            'documents': '/api/documents/',
            'rag': '/api/rag/'
        },
        'features': [
            'FAISS Vector Store',
            'LangChain RAG',
            'Document Processing',
            'Multi-provider LLM Support'
        ]
    })
