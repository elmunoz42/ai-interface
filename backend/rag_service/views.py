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
from .faiss_rag import get_rag_chain, get_vector_store

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
        
        # Process with the new FAISS vector store
        vector_store = get_vector_store()
        result = vector_store.add_documents([full_path])

        # Create and save Document model instance
        doc = Document.objects.create(
            filename=uploaded_file.name,
            file_path=file_path,
            file_size=uploaded_file.size,
            content_type=uploaded_file.content_type,
            status='completed' if result['processed_files'] else 'failed',
            processing_error='' if result['processed_files'] else str(result)
        )

        if result['processed_files']:
            return Response({
                'message': 'Document processed successfully',
                'result': result,
                'document': DocumentSerializer(doc).data
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
            vector_store = get_vector_store()
            vector_stats = vector_store.get_stats()
        except Exception as e:
            vector_stats = {'error': str(e)}
        
        # Check LLM configuration
        openai_configured = bool(os.getenv('OPENAI_API_KEY'))
        
        return Response({
            'status': 'operational',
            'database_statistics': {
                'total_documents': total_documents,
                'processed_documents': processed_documents,
                'total_chunks': total_chunks,
                'vector_stores': vector_stores
            },
            'vector_store_statistics': vector_stats,
            'llm_configuration': {
                'openai_api_key_configured': openai_configured,
                'available_providers': ['openai'] if openai_configured else []
            },
            'features': {
                'document_upload': True,
                'text_extraction': True,
                'vector_search': True,
                'rag_chat': openai_configured,
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
        
        # Perform vector search using new FAISS implementation
        vector_store = get_vector_store()
        results = vector_store.similarity_search(query, k=num_results)
        
        # Format results
        formatted_results = [
            {
                'content': doc.page_content,
                'metadata': doc.metadata,
                'similarity_score': getattr(doc, 'similarity_score', None)
            }
            for doc in results
        ]
        
        return Response({
            'query': query,
            'results': formatted_results,
            'total_results': len(formatted_results)
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
    """Chat using RAG (Retrieval-Augmented Generation) with LLM integration"""
    
    serializer = RAGChatSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        message = serializer.validated_data['message']
        conversation_id = serializer.validated_data.get('conversation_id')
        num_context_docs = serializer.validated_data['num_context_docs']
        similarity_threshold = serializer.validated_data.get('similarity_threshold', 0.0)
        
        # Check if OpenAI API key is configured
        if not os.getenv('OPENAI_API_KEY'):
            # Fallback to context-only response if no LLM configured
            vector_store = get_vector_store()
            context_docs = vector_store.similarity_search(message, k=num_context_docs)
            
            # Filter by similarity threshold if provided
            if similarity_threshold > 0:
                context_docs = [doc for doc in context_docs if doc.get('similarity_score', 0) >= similarity_threshold]
            
            if context_docs:
                context_text = "\n\n".join([
                    f"Document: {doc.metadata.get('source', 'Unknown')}\nContent: {doc.page_content}" 
                    for doc in context_docs
                ])
                
                response_text = f"""Based on the uploaded documents, I found {len(context_docs)} relevant pieces of information:

{context_text}

This information is related to your question about: "{message}"

Note: OpenAI API key not configured. Install OpenAI API key for full LLM-powered responses."""
            else:
                response_text = f"""I couldn't find relevant information in the uploaded documents to answer your question: "{message}"

You may need to:
1. Upload more documents that contain relevant information
2. Try rephrasing your question
3. Lower the similarity threshold in the RAG parameters

Note: OpenAI API key not configured. Configure OpenAI API key for full LLM-powered responses."""
            
            return Response({
                'message': message,
                'response': response_text,
                'conversation_id': conversation_id or 'new_conversation',
                'context_documents': [
                    {
                        'content': doc.page_content,
                        'metadata': doc.metadata
                    }
                    for doc in context_docs
                ],
                'num_context_docs_found': len(context_docs),
                'similarity_threshold_used': similarity_threshold,
                'llm_used': False
            })
        
        # Use full RAG chain with LLM
        try:
            rag_chain = get_rag_chain(llm_provider="openai")
            result = rag_chain.query(message)
            
            return Response({
                'message': message,
                'response': result['answer'],
                'conversation_id': conversation_id or 'new_conversation',
                'context_documents': result['source_documents'],
                'num_context_docs_found': len(result['source_documents']),
                'similarity_threshold_used': similarity_threshold,
                'llm_used': True,
                'llm_provider': 'openai'
            })
            
        except Exception as llm_error:
            logger.error(f"Error with LLM RAG chain: {str(llm_error)}")
            
            # Fallback to context-only response
            vector_store = get_vector_store()
            context_docs = vector_store.similarity_search(message, k=num_context_docs)
            
            return Response({
                'message': message,
                'response': f"LLM processing failed: {str(llm_error)}. Here's the relevant context from your documents:\n\n" + 
                          "\n\n".join([f"Document: {doc.metadata.get('source', 'Unknown')}\nContent: {doc.page_content}" for doc in context_docs]),
                'conversation_id': conversation_id or 'new_conversation',
                'context_documents': [
                    {
                        'content': doc.page_content,
                        'metadata': doc.metadata
                    }
                    for doc in context_docs
                ],
                'num_context_docs_found': len(context_docs),
                'similarity_threshold_used': similarity_threshold,
                'llm_used': False,
                'error': str(llm_error)
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
        vector_store = get_vector_store()
        
        # Clear the FAISS index
        if os.path.exists(settings.FAISS_INDEX_PATH):
            import shutil
            shutil.rmtree(settings.FAISS_INDEX_PATH)
        
        # Reset global instances
        from . import faiss_rag
        faiss_rag._vector_store = None
        faiss_rag._rag_chain = None
        
        return Response({
            'message': 'Vector store cleared successfully'
        })
        
    except Exception as e:
        logger.error(f"Error clearing vector store: {str(e)}")
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
