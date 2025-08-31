"""
FAISS Vector Store and RAG Implementation
"""
import os
import uuid
import logging
from typing import List, Dict, Any, Optional
from pathlib import Path

import faiss
import numpy as np
from sentence_transformers import SentenceTransformer
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.schema import Document
from langchain_community.document_loaders import PyPDFLoader, TextLoader
from langchain_community.vectorstores import FAISS as LangChainFAISS
from langchain_community.embeddings import SentenceTransformerEmbeddings
from langchain_community.llms import OpenAI
from langchain.chains import RetrievalQA
from langchain.prompts import PromptTemplate

from django.conf import settings

logger = logging.getLogger(__name__)

class DocumentProcessor:
    """Handles document loading and text extraction"""
    
    def __init__(self):
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            length_function=len,
        )
    
    def load_document(self, file_path: str) -> List[Document]:
        """Load and split a document into chunks"""
        try:
            file_extension = Path(file_path).suffix.lower()
            
            if file_extension == '.pdf':
                loader = PyPDFLoader(file_path)
            elif file_extension in ['.txt', '.md']:
                loader = TextLoader(file_path)
            else:
                raise ValueError(f"Unsupported file format: {file_extension}")
            
            documents = loader.load()
            chunks = self.text_splitter.split_documents(documents)
            
            logger.info(f"Loaded {len(chunks)} chunks from {file_path}")
            return chunks
            
        except Exception as e:
            logger.error(f"Error loading document {file_path}: {str(e)}")
            raise

class FAISSVectorStore:
    """FAISS vector store for document embeddings and similarity search"""
    
    def __init__(self, index_path: Optional[str] = None):
        self.embedding_model = SentenceTransformerEmbeddings(
            model_name="all-MiniLM-L6-v2"
        )
        self.index_path = index_path or settings.FAISS_INDEX_PATH
        self.vector_store = None
        self.document_processor = DocumentProcessor()
        
        # Initialize or load existing index
        self._initialize_vector_store()
    
    def _initialize_vector_store(self):
        """Initialize or load existing FAISS index"""
        try:
            if os.path.exists(self.index_path):
                logger.info(f"Loading existing FAISS index from {self.index_path}")
                self.vector_store = LangChainFAISS.load_local(
                    self.index_path, 
                    self.embedding_model
                )
            else:
                logger.info("Creating new FAISS index")
                # Create empty vector store with sample document
                sample_doc = Document(page_content="Sample document for initialization")
                self.vector_store = LangChainFAISS.from_documents(
                    [sample_doc], 
                    self.embedding_model
                )
                self.save_index()
        except Exception as e:
            logger.error(f"Error initializing vector store: {str(e)}")
            raise
    
    def add_documents(self, file_paths: List[str]) -> Dict[str, Any]:
        """Add documents to the vector store"""
        results = {
            'processed_files': [],
            'failed_files': [],
            'total_chunks': 0
        }
        
        for file_path in file_paths:
            try:
                chunks = self.document_processor.load_document(file_path)
                
                # Add chunks to vector store
                self.vector_store.add_documents(chunks)
                
                results['processed_files'].append({
                    'file': file_path,
                    'chunks': len(chunks)
                })
                results['total_chunks'] += len(chunks)
                
                logger.info(f"Added {len(chunks)} chunks from {file_path}")
                
            except Exception as e:
                logger.error(f"Failed to process {file_path}: {str(e)}")
                results['failed_files'].append({
                    'file': file_path,
                    'error': str(e)
                })
        
        # Save updated index
        if results['processed_files']:
            self.save_index()
        
        return results
    
    def similarity_search(self, query: str, k: int = 4) -> List[Document]:
        """Perform similarity search in the vector store"""
        try:
            results = self.vector_store.similarity_search(query, k=k)
            logger.info(f"Found {len(results)} similar documents for query")
            return results
        except Exception as e:
            logger.error(f"Error in similarity search: {str(e)}")
            raise
    
    def save_index(self):
        """Save the FAISS index to disk"""
        try:
            os.makedirs(os.path.dirname(self.index_path), exist_ok=True)
            self.vector_store.save_local(self.index_path)
            logger.info(f"FAISS index saved to {self.index_path}")
        except Exception as e:
            logger.error(f"Error saving index: {str(e)}")
            raise
    
    def get_stats(self) -> Dict[str, Any]:
        """Get vector store statistics"""
        try:
            # Access the underlying FAISS index
            faiss_index = self.vector_store.index
            return {
                'total_vectors': faiss_index.ntotal,
                'dimension': faiss_index.d,
                'index_type': type(faiss_index).__name__,
                'is_trained': faiss_index.is_trained if hasattr(faiss_index, 'is_trained') else True
            }
        except Exception as e:
            logger.error(f"Error getting stats: {str(e)}")
            return {'error': str(e)}

class RAGChain:
    """RAG (Retrieval-Augmented Generation) chain using LangChain"""
    
    def __init__(self, vector_store: FAISSVectorStore, llm_provider: str = "openai"):
        self.vector_store = vector_store
        self.llm_provider = llm_provider
        
        # Initialize LLM based on provider
        self._initialize_llm()
        
        # Create retrieval chain
        self._create_chain()
    
    def _initialize_llm(self):
        """Initialize the language model"""
        if self.llm_provider == "openai":
            self.llm = OpenAI(
                openai_api_key=os.getenv('OPENAI_API_KEY'),
                temperature=0.7,
                max_tokens=512
            )
        else:
            raise ValueError(f"Unsupported LLM provider: {self.llm_provider}")
    
    def _create_chain(self):
        """Create the RAG chain"""
        # Custom prompt template
        template = """Use the following pieces of context to answer the question at the end. 
        If you don't know the answer, just say that you don't know, don't try to make up an answer.

        Context:
        {context}

        Question: {question}
        
        Answer:"""
        
        prompt = PromptTemplate(
            template=template,
            input_variables=["context", "question"]
        )
        
        # Create retrieval chain
        self.chain = RetrievalQA.from_chain_type(
            llm=self.llm,
            chain_type="stuff",
            retriever=self.vector_store.vector_store.as_retriever(search_kwargs={"k": 4}),
            chain_type_kwargs={"prompt": prompt},
            return_source_documents=True
        )
    
    def query(self, question: str) -> Dict[str, Any]:
        """Query the RAG chain"""
        try:
            response = self.chain({"query": question})
            
            return {
                'answer': response['result'],
                'source_documents': [
                    {
                        'content': doc.page_content,
                        'metadata': doc.metadata
                    }
                    for doc in response['source_documents']
                ],
                'question': question
            }
        except Exception as e:
            logger.error(f"Error in RAG query: {str(e)}")
            raise

# Global instances (singleton pattern)
_vector_store = None
_rag_chain = None

def get_vector_store() -> FAISSVectorStore:
    """Get or create the global vector store instance"""
    global _vector_store
    if _vector_store is None:
        _vector_store = FAISSVectorStore()
    return _vector_store

def get_rag_chain(llm_provider: str = "openai") -> RAGChain:
    """Get or create the global RAG chain instance"""
    global _rag_chain
    if _rag_chain is None:
        vector_store = get_vector_store()
        _rag_chain = RAGChain(vector_store, llm_provider)
    return _rag_chain
