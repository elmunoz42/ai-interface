from django.contrib import admin
from .models import Document, DocumentChunk, VectorStore

@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    list_display = ['filename', 'status', 'file_size', 'total_chunks', 'created_at']
    list_filter = ['status', 'content_type', 'created_at']
    search_fields = ['filename']
    readonly_fields = ['id', 'created_at', 'updated_at']

@admin.register(DocumentChunk)
class DocumentChunkAdmin(admin.ModelAdmin):
    list_display = ['document', 'chunk_index', 'page_number', 'created_at']
    list_filter = ['document', 'created_at']
    search_fields = ['content', 'document__filename']
    readonly_fields = ['id', 'created_at']

@admin.register(VectorStore)
class VectorStoreAdmin(admin.ModelAdmin):
    list_display = ['name', 'embedding_model', 'total_vectors', 'dimension', 'updated_at']
    list_filter = ['embedding_model', 'created_at']
    search_fields = ['name']
    readonly_fields = ['created_at', 'updated_at']
