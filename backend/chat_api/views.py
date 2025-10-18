from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from .huggingface_service import huggingface_service
import json
import logging

logger = logging.getLogger(__name__)

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
            'faiss': 'ready for setup',
            'huggingface': 'configured' if huggingface_service.api_token else 'not configured'
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
            'huggingface': '/api/huggingface/chat/',
            'documents': '/api/documents/',
            'rag': '/api/rag/'
        },
        'features': [
            'FAISS Vector Store',
            'LangChain RAG',
            'Document Processing',
            'Multi-provider LLM Support',
            'Hugging Face Fine-tuned Models'
        ]
    })

@api_view(['POST'])
@permission_classes([AllowAny])
def huggingface_chat(request):
    """
    Chat endpoint for Hugging Face fine-tuned model
    
    Expected JSON payload:
    {
        "message": "User message",
        "temperature": 0.7,  // optional
        "max_tokens": 500,   // optional
        "system_prompt": "System prompt"  // optional
    }
    """
    try:
        data = request.data
        message = data.get('message', '')
        
        if not message:
            return Response({
                'error': 'Message is required',
                'success': False
            }, status=400)
        
        # Extract parameters
        temperature = float(data.get('temperature', 0.7))
        max_tokens = int(data.get('max_tokens', 500))
        system_prompt = data.get('system_prompt', 'You are a helpful AI assistant specializing in electric vehicles and sustainability.')
        
        logger.info(f"Hugging Face chat request - Message length: {len(message)}")
        
        # Call the Hugging Face service
        result = huggingface_service.chat(
            message=message,
            system_prompt=system_prompt,
            temperature=temperature,
            max_tokens=max_tokens
        )
        
        if result.get('success'):
            return Response({
                'response': result.get('response', ''),
                'model': result.get('model'),
                'provider': 'huggingface',
                'success': True
            })
        else:
            # Return error with appropriate status code
            status_code = 503 if result.get('error') == 'Model is loading' else 500
            return Response(result, status=status_code)
            
    except ValueError as e:
        logger.error(f"Invalid parameter value: {str(e)}")
        return Response({
            'error': 'Invalid parameter',
            'message': str(e),
            'success': False
        }, status=400)
    
    except Exception as e:
        logger.error(f"Error in huggingface_chat view: {str(e)}")
        return Response({
            'error': 'Internal server error',
            'message': str(e),
            'success': False
        }, status=500)

@api_view(['GET'])
@permission_classes([AllowAny])
def huggingface_status(request):
    """Check Hugging Face model status"""
    status = huggingface_service.check_model_status()
    return Response(status)
