from django.db import models
from django.contrib.auth.models import User
import uuid
import os

class Document(models.Model):
    """Model for uploaded documents"""
    
    STATUS_CHOICES = [
        ('uploading', 'Uploading'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    filename = models.CharField(max_length=255)
    file_path = models.CharField(max_length=500)
    file_size = models.PositiveIntegerField()
    content_type = models.CharField(max_length=100)
    
    # Processing status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='uploading')
    processing_error = models.TextField(blank=True, null=True)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Embedding info
    total_chunks = models.PositiveIntegerField(default=0)
    embedding_model = models.CharField(max_length=100, blank=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return self.filename

class DocumentChunk(models.Model):
    """Model for document text chunks with embeddings"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    document = models.ForeignKey(Document, on_delete=models.CASCADE, related_name='chunks')
    
    # Text content
    content = models.TextField()
    chunk_index = models.PositiveIntegerField()
    
    # Metadata
    page_number = models.PositiveIntegerField(null=True, blank=True)
    start_char = models.PositiveIntegerField(null=True, blank=True)
    end_char = models.PositiveIntegerField(null=True, blank=True)
    
    # Embedding data (stored as JSON or reference to vector store)
    embedding_id = models.CharField(max_length=100, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['document', 'chunk_index']
        unique_together = ['document', 'chunk_index']
    
    def __str__(self):
        return f"{self.document.filename} - Chunk {self.chunk_index}"

class VectorStore(models.Model):
    """Model for tracking FAISS vector store indices"""
    
    name = models.CharField(max_length=100, unique=True)
    index_path = models.CharField(max_length=500)
    embedding_model = models.CharField(max_length=100)
    
    # Statistics
    total_vectors = models.PositiveIntegerField(default=0)
    dimension = models.PositiveIntegerField(default=384)  # Default for all-MiniLM-L6-v2
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-updated_at']
    
    def __str__(self):
        return f"VectorStore: {self.name} ({self.total_vectors} vectors)"
