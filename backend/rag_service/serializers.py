from rest_framework import serializers
from .models import Document, DocumentChunk, VectorStore

class DocumentSerializer(serializers.ModelSerializer):
    """Serializer for Document model"""
    
    class Meta:
        model = Document
        fields = [
            'id', 'filename', 'file_size', 'content_type',
            'status', 'processing_error', 'created_at', 'updated_at',
            'total_chunks', 'embedding_model'
        ]
        read_only_fields = [
            'id', 'created_at', 'updated_at', 'total_chunks', 
            'embedding_model', 'status', 'processing_error'
        ]

class DocumentChunkSerializer(serializers.ModelSerializer):
    """Serializer for DocumentChunk model"""
    
    class Meta:
        model = DocumentChunk
        fields = [
            'id', 'content', 'chunk_index', 'page_number',
            'start_char', 'end_char', 'embedding_id', 'created_at'
        ]
        read_only_fields = ['id', 'created_at', 'embedding_id']

class VectorStoreSerializer(serializers.ModelSerializer):
    """Serializer for VectorStore model"""
    
    class Meta:
        model = VectorStore
        fields = [
            'name', 'embedding_model', 'total_vectors', 
            'dimension', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']

class DocumentUploadSerializer(serializers.Serializer):
    """Serializer for document upload"""
    
    file = serializers.FileField()
    
    def validate_file(self, value):
        """Validate uploaded file"""
        # Check file size (max 10MB)
        if value.size > 10 * 1024 * 1024:
            raise serializers.ValidationError("File size must be less than 10MB")
        
        # Check file extension
        allowed_extensions = ['.pdf', '.txt', '.md', '.docx']
        file_extension = value.name.lower().split('.')[-1]
        if f'.{file_extension}' not in allowed_extensions:
            raise serializers.ValidationError(
                f"File type not supported. Allowed types: {', '.join(allowed_extensions)}"
            )
        
        return value

class RAGSearchSerializer(serializers.Serializer):
    """Serializer for RAG search requests"""
    
    query = serializers.CharField(max_length=1000)
    num_results = serializers.IntegerField(default=5, min_value=1, max_value=20)

class RAGChatSerializer(serializers.Serializer):
    """Serializer for RAG chat requests"""
    
    message = serializers.CharField(max_length=2000)
    conversation_id = serializers.CharField(max_length=100, required=False)
    num_context_docs = serializers.IntegerField(default=4, min_value=1, max_value=10)
