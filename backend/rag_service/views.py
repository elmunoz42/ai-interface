from rest_framework import status, viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.core.files.storage import default_storage
from django.conf import settings
import os
import logging

from .models import Document, DocumentChunk, VectorStore
from .serializers import (
    DocumentSerializer, DocumentUploadSerializer, 
    RAGSearchSerializer, RAGChatSerializer
)
from .vector_store import get_vector_store_service

logger = logging.getLogger(__name__)

class DocumentViewSet(viewsets.ModelViewSet):
    """ViewSet for Document model"""
    
    queryset = Document.objects.all()
    serializer_class = DocumentSerializer
    permission_classes = [AllowAny]

@api_view(['POST'])
@permission_classes([AllowAny])
def upload_document(request):
    """Upload and process a document"""
    
    serializer = DocumentUploadSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        uploaded_file = serializer.validated_data['file']
        
        # Save file to media directory
        file_path = default_storage.save(
            f"documents/{uploaded_file.name}",
            uploaded_file
        )
        full_path = os.path.join(settings.MEDIA_ROOT, file_path)
        
        # Process with vector store
        vector_store = get_vector_store_service()
        result = vector_store.add_document(full_path)
        
        # Clean up temporary file
        try:
            if os.path.exists(full_path):
                os.remove(full_path)
        except Exception as e:
            logger.warning(f"Could not remove temporary file {full_path}: {str(e)}")
        
        if result['status'] == 'completed':
            return Response({
                'message': 'Document processed successfully',
                'result': result
            }, status=status.HTTP_201_CREATED)
        else:
            return Response({
                'error': 'Document processing failed',
                'details': result
            }, status=status.HTTP_400_BAD_REQUEST)
        
    except Exception as e:
        logger.error(f"Error uploading document: {str(e)}")
        return Response(
            {'error': 'Failed to upload document', 'details': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([AllowAny])
def rag_status(request):
    """Get RAG service status"""
    
    try:
        # Get database statistics
        total_documents = Document.objects.count()
        processed_documents = Document.objects.filter(status='completed').count()
        total_chunks = DocumentChunk.objects.count()
        vector_stores = VectorStore.objects.count()
        
        # Get vector store statistics
        try:
            vector_store = get_vector_store_service()
            vector_stats = vector_store.get_stats()
        except Exception as e:
            vector_stats = {'error': str(e)}
        
        return Response({
            'status': 'operational',
            'database_statistics': {
                'total_documents': total_documents,
                'processed_documents': processed_documents,
                'total_chunks': total_chunks,
                'vector_stores': vector_stores
            },
            'vector_store_statistics': vector_stats,
            'features': {
                'document_upload': True,
                'text_extraction': True,
                'vector_search': True,
                'rag_chat': True,
                'supported_formats': ['.pdf', '.txt', '.md', '.docx']
            }
        })
        
    except Exception as e:
        logger.error(f"Error getting RAG status: {str(e)}")
        return Response(
            {'error': 'Failed to get status'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([AllowAny])
def search_documents(request):
    """Search documents using vector similarity"""
    
    serializer = RAGSearchSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        query = serializer.validated_data['query']
        num_results = serializer.validated_data['num_results']
        
        # Perform vector search
        vector_store = get_vector_store_service()
        results = vector_store.similarity_search(query, k=num_results)
        
        return Response({
            'query': query,
            'results': results,
            'total_results': len(results)
        })
        
    except Exception as e:
        logger.error(f"Error searching documents: {str(e)}")
        return Response(
            {'error': 'Search failed', 'details': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([AllowAny])
def rag_chat(request):
    """Chat using RAG (Retrieval-Augmented Generation)"""
    
    serializer = RAGChatSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        message = serializer.validated_data['message']
        conversation_id = serializer.validated_data.get('conversation_id')
        num_context_docs = serializer.validated_data['num_context_docs']
        similarity_threshold = serializer.validated_data.get('similarity_threshold', 0.0)
        
        # Get relevant documents
        vector_store = get_vector_store_service()
        context_docs = vector_store.similarity_search(message, k=num_context_docs)
        
        # Filter by similarity threshold if provided
        if similarity_threshold > 0:
            context_docs = [doc for doc in context_docs if doc.get('similarity_score', 0) >= similarity_threshold]
        
        # Create context string from relevant documents
        context_text = ""
        if context_docs:
            context_text = "\n\n".join([
                f"Document: {doc.get('document_filename', 'Unknown')}\nContent: {doc.get('content', '')}" 
                for doc in context_docs
            ])
        
        # Create RAG prompt
        rag_prompt = f"""Use the following context to answer the question. If the context doesn't contain relevant information, say so.

Context:
{context_text}

Question: {message}

Answer based on the context provided:"""

        # For now, return a formatted response with context
        # TODO: Integrate with actual LLM (OpenAI, Anthropic, etc.)
        if context_docs:
            response_text = f"""Based on the uploaded documents, I found {len(context_docs)} relevant pieces of information:

{context_text}

This information is related to your question about: "{message}"

Note: Full LLM integration is coming soon. Currently showing retrieved context from your uploaded documents."""
        else:
            response_text = f"""I couldn't find relevant information in the uploaded documents to answer your question: "{message}"

You may need to:
1. Upload more documents that contain relevant information
2. Try rephrasing your question
3. Lower the similarity threshold in the RAG parameters"""

        return Response({
            'message': message,
            'response': response_text,
            'conversation_id': conversation_id or 'new_conversation',
            'context_documents': context_docs,
            'num_context_docs_found': len(context_docs),
            'similarity_threshold_used': similarity_threshold
        })
        
    except Exception as e:
        logger.error(f"Error in RAG chat: {str(e)}")
        return Response(
            {'error': 'Chat failed', 'details': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['DELETE'])
@permission_classes([AllowAny])
def clear_vector_store(request):
    """Clear the vector store (for development/testing)"""
    try:
        vector_store = get_vector_store_service()
        vector_store.clear_index()
        
        return Response({
            'message': 'Vector store cleared successfully'
        })
        
    except Exception as e:
        logger.error(f"Error clearing vector store: {str(e)}")
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
import os
import json
import logging
from typing import Dict, Any

from django.http import JsonResponse, HttpRequest
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from django.conf import settings
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status

from .faiss_rag import get_vector_store, get_rag_chain

logger = logging.getLogger(__name__)

@api_view(['GET'])
@permission_classes([AllowAny])
def rag_status(request):
    """Get RAG service status"""
    try:
        vector_store = get_vector_store()
        stats = vector_store.get_stats()
        
        return Response({
            'status': 'operational',
            'vector_store': stats,
            'features': {
                'document_upload': True,
                'similarity_search': True,
                'rag_query': True,
                'supported_formats': ['.pdf', '.txt', '.md']
            }
        })
    except Exception as e:
        logger.error(f"Error getting RAG status: {str(e)}")
        return Response({
            'status': 'error',
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([AllowAny])
@csrf_exempt
def upload_documents(request):
    """Upload and process documents for RAG"""
    try:
        if 'files' not in request.FILES:
            return Response({
                'error': 'No files provided'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        files = request.FILES.getlist('files')
        if not files:
            return Response({
                'error': 'No files provided'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Save uploaded files and get their paths
        file_paths = []
        for file in files:
            # Validate file type
            file_extension = os.path.splitext(file.name)[1].lower()
            if file_extension not in ['.pdf', '.txt', '.md']:
                continue
            
            # Save file
            file_path = default_storage.save(
                f"documents/{file.name}",
                ContentFile(file.read())
            )
            full_path = os.path.join(settings.MEDIA_ROOT, file_path)
            file_paths.append(full_path)
        
        if not file_paths:
            return Response({
                'error': 'No valid files to process'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Process files with vector store
        vector_store = get_vector_store()
        results = vector_store.add_documents(file_paths)
        
        # Clean up temporary files
        for file_path in file_paths:
            try:
                if os.path.exists(file_path):
                    os.remove(file_path)
            except Exception as e:
                logger.warning(f"Could not remove temporary file {file_path}: {str(e)}")
        
        return Response({
            'message': 'Documents processed successfully',
            'results': results
        })
        
    except Exception as e:
        logger.error(f"Error uploading documents: {str(e)}")
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([AllowAny])
def similarity_search(request):
    """Perform similarity search in the vector store"""
    try:
        data = json.loads(request.body)
        query = data.get('query', '').strip()
        k = min(int(data.get('k', 4)), 10)  # Limit to max 10 results
        
        if not query:
            return Response({
                'error': 'Query is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        vector_store = get_vector_store()
        results = vector_store.similarity_search(query, k=k)
        
        return Response({
            'query': query,
            'results': [
                {
                    'content': doc.page_content,
                    'metadata': doc.metadata,
                    'similarity_score': getattr(doc, 'similarity_score', None)
                }
                for doc in results
            ]
        })
        
    except json.JSONDecodeError:
        return Response({
            'error': 'Invalid JSON in request body'
        }, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        logger.error(f"Error in similarity search: {str(e)}")
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([AllowAny])
def rag_query(request):
    """Perform RAG (Retrieval-Augmented Generation) query"""
    try:
        data = json.loads(request.body)
        question = data.get('question', '').strip()
        llm_provider = data.get('llm_provider', 'openai')
        
        if not question:
            return Response({
                'error': 'Question is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate LLM provider
        if llm_provider not in ['openai']:
            return Response({
                'error': f'Unsupported LLM provider: {llm_provider}'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if OpenAI API key is configured
        if llm_provider == 'openai' and not os.getenv('OPENAI_API_KEY'):
            return Response({
                'error': 'OpenAI API key not configured'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        rag_chain = get_rag_chain(llm_provider)
        result = rag_chain.query(question)
        
        return Response(result)
        
    except json.JSONDecodeError:
        return Response({
            'error': 'Invalid JSON in request body'
        }, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        logger.error(f"Error in RAG query: {str(e)}")
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['DELETE'])
@permission_classes([AllowAny])
def clear_vector_store(request):
    """Clear the vector store (for development/testing)"""
    try:
        vector_store = get_vector_store()
        
        # Remove the index file
        if os.path.exists(settings.FAISS_INDEX_PATH):
            import shutil
            shutil.rmtree(settings.FAISS_INDEX_PATH)
        
        # Reset global instances
        global _vector_store, _rag_chain
        _vector_store = None
        _rag_chain = None
        
        return Response({
            'message': 'Vector store cleared successfully'
        })
        
    except Exception as e:
        logger.error(f"Error clearing vector store: {str(e)}")
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
