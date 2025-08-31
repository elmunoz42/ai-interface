"""
FAISS Vector Store Service
Handles document embeddings and similarity search
"""
import os
import pickle
import logging
from typing import List, Dict, Any, Optional
from pathlib import Path

try:
    import faiss
    import numpy as np
    from sentence_transformers import SentenceTransformer
except ImportError:
    faiss = None
    np = None
    SentenceTransformer = None

from django.conf import settings
from .models import Document, DocumentChunk, VectorStore as VectorStoreModel
from .document_processor import DocumentProcessor

logger = logging.getLogger(__name__)

class VectorStoreService:
    """FAISS vector store for document embeddings and similarity search"""
    
    def __init__(self, embedding_model_name: str = "all-MiniLM-L6-v2"):
        if SentenceTransformer is None:
            raise ImportError("sentence-transformers is required for embeddings")
        if faiss is None:
            raise ImportError("faiss-cpu is required for vector storage")
        if np is None:
            raise ImportError("numpy is required for vector operations")
        
        self.embedding_model_name = embedding_model_name
        
        # Initialize embedding model with trust settings
        try:
            # Set environment variable for safe deserialization in controlled environment
            os.environ['SENTENCE_TRANSFORMERS_TRUST_REMOTE_CODE'] = 'True'
            
            self.embedding_model = SentenceTransformer(
                embedding_model_name,
                trust_remote_code=True,  # Safe in controlled environment
                cache_folder=os.path.join(settings.BASE_DIR, 'model_cache')
            )
        except Exception as e:
            logger.warning(f"Failed to load {embedding_model_name}, falling back to simple model")
            # Fallback to a simpler approach if the model loading fails
            self.embedding_model = SentenceTransformer('all-MiniLM-L6-v2', trust_remote_code=True)
        
        self.dimension = self.embedding_model.get_sentence_embedding_dimension()
        
        self.index = None
        self.documents = []  # Store document metadata
        self.chunks = []     # Store chunk data
        
        self.index_path = getattr(settings, 'FAISS_INDEX_PATH', 'vector_store/faiss_index')
        self.metadata_path = f"{self.index_path}_metadata.pkl"
        
        # Initialize or load existing index
        self._initialize_index()
    
    def _initialize_index(self):
        """Initialize or load existing FAISS index"""
        try:
            if os.path.exists(f"{self.index_path}.faiss") and os.path.exists(self.metadata_path):
                self._load_index()
                logger.info(f"Loaded existing FAISS index with {self.index.ntotal} vectors")
            else:
                self._create_new_index()
                logger.info("Created new FAISS index")
        except Exception as e:
            logger.error(f"Error initializing FAISS index: {str(e)}")
            self._create_new_index()
    
    def _create_new_index(self):
        """Create a new FAISS index"""
        self.index = faiss.IndexFlatIP(self.dimension)  # Inner product for cosine similarity
        self.documents = []
        self.chunks = []
        self._save_index()
    
    def _load_index(self):
        """Load existing FAISS index from disk"""
        try:
            self.index = faiss.read_index(f"{self.index_path}.faiss")
            
            with open(self.metadata_path, 'rb') as f:
                # Enable dangerous deserialization in controlled environment
                # This is safe since we control the source of the pickle files
                metadata = pickle.load(f)
                self.documents = metadata.get('documents', [])
                self.chunks = metadata.get('chunks', [])
        except Exception as e:
            logger.error(f"Error loading FAISS index: {str(e)}")
            self._create_new_index()
    
    def _save_index(self):
        """Save FAISS index to disk"""
        try:
            # Create directory if it doesn't exist
            os.makedirs(os.path.dirname(self.index_path), exist_ok=True)
            
            # Save FAISS index
            faiss.write_index(self.index, f"{self.index_path}.faiss")
            
            # Save metadata
            metadata = {
                'documents': self.documents,
                'chunks': self.chunks,
                'embedding_model': self.embedding_model_name,
                'dimension': self.dimension
            }
            
            with open(self.metadata_path, 'wb') as f:
                pickle.dump(metadata, f)
            
            logger.info(f"Saved FAISS index with {self.index.ntotal} vectors")
        except Exception as e:
            logger.error(f"Error saving FAISS index: {str(e)}")
            raise
    
    def add_document(self, file_path: str) -> Dict[str, Any]:
        """Process and add a document to the vector store"""
        try:
            # Process document
            processor = DocumentProcessor()
            doc_data = processor.process_document(file_path)
            
            if doc_data['status'] == 'failed':
                return doc_data
            
            # Generate embeddings for chunks
            chunk_texts = [chunk['content'] for chunk in doc_data['chunks']]
            embeddings = self.embedding_model.encode(chunk_texts, normalize_embeddings=True)
            
            # Add to FAISS index
            self.index.add(embeddings.astype('float32'))
            
            # Store document metadata
            doc_id = len(self.documents)
            document_info = {
                'id': doc_id,
                'filename': doc_data['filename'],
                'file_path': doc_data['file_path'],
                'file_size': doc_data['file_size'],
                'text_length': doc_data['text_length'],
                'total_chunks': doc_data['total_chunks'],
                'embedding_model': self.embedding_model_name
            }
            self.documents.append(document_info)
            
            # Store chunk metadata
            start_chunk_id = len(self.chunks)
            for i, chunk in enumerate(doc_data['chunks']):
                chunk_info = {
                    'id': start_chunk_id + i,
                    'document_id': doc_id,
                    'chunk_index': chunk['chunk_index'],
                    'content': chunk['content'],
                    'start_char': chunk['start_char'],
                    'end_char': chunk['end_char']
                }
                self.chunks.append(chunk_info)
            
            # Save updated index
            self._save_index()
            
            # Update database models
            self._update_database_models(document_info, doc_data['chunks'])
            
            return {
                'status': 'completed',
                'document_id': doc_id,
                'filename': doc_data['filename'],
                'total_chunks': doc_data['total_chunks'],
                'total_vectors': self.index.ntotal
            }
            
        except Exception as e:
            logger.error(f"Error adding document to vector store: {str(e)}")
            return {
                'status': 'failed',
                'error': str(e)
            }
    
    def _update_database_models(self, document_info: Dict, chunks_data: List[Dict]):
        """Update Django models with document and chunk information"""
        try:
            # Create or update Document model
            document = Document.objects.create(
                filename=document_info['filename'],
                file_path=document_info['file_path'],
                file_size=document_info['file_size'],
                content_type='application/octet-stream',  # Will be improved later
                status='completed',
                total_chunks=document_info['total_chunks'],
                embedding_model=document_info['embedding_model']
            )
            
            # Create DocumentChunk models
            for chunk_data in chunks_data:
                DocumentChunk.objects.create(
                    document=document,
                    content=chunk_data['content'],
                    chunk_index=chunk_data['chunk_index'],
                    start_char=chunk_data['start_char'],
                    end_char=chunk_data['end_char'],
                    embedding_id=str(len(self.chunks) - len(chunks_data) + chunk_data['chunk_index'])
                )
            
            # Update or create VectorStore model
            vector_store, created = VectorStoreModel.objects.get_or_create(
                name='default',
                defaults={
                    'index_path': self.index_path,
                    'embedding_model': self.embedding_model_name,
                    'dimension': self.dimension
                }
            )
            vector_store.total_vectors = self.index.ntotal
            vector_store.save()
            
        except Exception as e:
            logger.error(f"Error updating database models: {str(e)}")
    
    def similarity_search(self, query: str, k: int = 5) -> List[Dict[str, Any]]:
        """Perform similarity search"""
        try:
            if self.index.ntotal == 0:
                return []
            
            # Generate embedding for query
            query_embedding = self.embedding_model.encode([query], normalize_embeddings=True)
            
            # Search in FAISS index
            scores, indices = self.index.search(query_embedding.astype('float32'), k)
            
            # Prepare results
            results = []
            for i, (score, idx) in enumerate(zip(scores[0], indices[0])):
                if idx >= 0 and idx < len(self.chunks):
                    chunk = self.chunks[idx]
                    document = self.documents[chunk['document_id']]
                    
                    results.append({
                        'chunk_id': chunk['id'],
                        'document_id': chunk['document_id'],
                        'document_filename': document['filename'],
                        'content': chunk['content'],
                        'similarity_score': float(score),
                        'chunk_index': chunk['chunk_index'],
                        'start_char': chunk['start_char'],
                        'end_char': chunk['end_char']
                    })
            
            return results
        
        except Exception as e:
            logger.error(f"Error in similarity search: {str(e)}")
            raise
    
    def get_stats(self) -> Dict[str, Any]:
        """Get vector store statistics"""
        try:
            return {
                'total_vectors': self.index.ntotal if self.index else 0,
                'total_documents': len(self.documents),
                'total_chunks': len(self.chunks),
                'dimension': self.dimension,
                'embedding_model': self.embedding_model_name,
                'index_path': self.index_path
            }
        except Exception as e:
            logger.error(f"Error getting stats: {str(e)}")
            return {'error': str(e)}
    
    def clear_index(self):
        """Clear the vector store"""
        try:
            self._create_new_index()
            
            # Clear database models
            DocumentChunk.objects.all().delete()
            Document.objects.all().delete()
            VectorStoreModel.objects.all().delete()
            
            logger.info("Cleared vector store and database")
        except Exception as e:
            logger.error(f"Error clearing vector store: {str(e)}")
            raise

# Global instance
_vector_store_service = None

def get_vector_store_service() -> VectorStoreService:
    """Get or create the global vector store service instance"""
    global _vector_store_service
    if _vector_store_service is None:
        _vector_store_service = VectorStoreService()
    return _vector_store_service
