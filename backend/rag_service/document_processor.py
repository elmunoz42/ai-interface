"""
Document Processing Utilities
Handles text extraction from various file formats
"""
import os
import logging
from typing import List, Dict, Any
from pathlib import Path

try:
    import PyPDF2
    from docx import Document as DocxDocument
except ImportError:
    PyPDF2 = None
    DocxDocument = None

logger = logging.getLogger(__name__)

class DocumentProcessor:
    """Handles document loading and text extraction"""
    
    SUPPORTED_FORMATS = ['.pdf', '.txt', '.md', '.docx']
    
    def __init__(self):
        self.chunk_size = 1000
        self.chunk_overlap = 200
    
    def extract_text(self, file_path: str) -> str:
        """Extract text from a document file"""
        try:
            file_extension = Path(file_path).suffix.lower()
            
            if file_extension == '.pdf':
                return self._extract_pdf_text(file_path)
            elif file_extension == '.docx':
                return self._extract_docx_text(file_path)
            elif file_extension in ['.txt', '.md']:
                return self._extract_text_file(file_path)
            else:
                raise ValueError(f"Unsupported file format: {file_extension}")
        
        except Exception as e:
            logger.error(f"Error extracting text from {file_path}: {str(e)}")
            raise
    
    def _extract_pdf_text(self, file_path: str) -> str:
        """Extract text from PDF file"""
        if PyPDF2 is None:
            raise ImportError("PyPDF2 is required for PDF processing")
        
        text = ""
        try:
            with open(file_path, 'rb') as file:
                pdf_reader = PyPDF2.PdfReader(file)
                for page in pdf_reader.pages:
                    text += page.extract_text() + "\n"
        except Exception as e:
            logger.error(f"Error reading PDF {file_path}: {str(e)}")
            raise
        
        return text.strip()
    
    def _extract_docx_text(self, file_path: str) -> str:
        """Extract text from DOCX file"""
        if DocxDocument is None:
            raise ImportError("python-docx is required for DOCX processing")
        
        try:
            doc = DocxDocument(file_path)
            text = "\n".join([paragraph.text for paragraph in doc.paragraphs])
            return text.strip()
        except Exception as e:
            logger.error(f"Error reading DOCX {file_path}: {str(e)}")
            raise
    
    def _extract_text_file(self, file_path: str) -> str:
        """Extract text from plain text file"""
        try:
            with open(file_path, 'r', encoding='utf-8') as file:
                return file.read().strip()
        except UnicodeDecodeError:
            # Try with different encoding
            try:
                with open(file_path, 'r', encoding='latin-1') as file:
                    return file.read().strip()
            except Exception as e:
                logger.error(f"Error reading text file {file_path}: {str(e)}")
                raise
        except Exception as e:
            logger.error(f"Error reading text file {file_path}: {str(e)}")
            raise
    
    def chunk_text(self, text: str) -> List[Dict[str, Any]]:
        """Split text into overlapping chunks"""
        if not text:
            return []
        
        chunks = []
        words = text.split()
        
        if len(words) <= self.chunk_size:
            return [{
                'content': text,
                'start_char': 0,
                'end_char': len(text),
                'chunk_index': 0
            }]
        
        chunk_index = 0
        start_word = 0
        
        while start_word < len(words):
            end_word = min(start_word + self.chunk_size, len(words))
            chunk_words = words[start_word:end_word]
            chunk_text = ' '.join(chunk_words)
            
            # Calculate character positions
            start_char = len(' '.join(words[:start_word]))
            if start_word > 0:
                start_char += 1  # Account for space
            
            end_char = start_char + len(chunk_text)
            
            chunks.append({
                'content': chunk_text,
                'start_char': start_char,
                'end_char': end_char,
                'chunk_index': chunk_index
            })
            
            chunk_index += 1
            
            # Move start position considering overlap
            if end_word >= len(words):
                break
            
            start_word = max(start_word + self.chunk_size - self.chunk_overlap, start_word + 1)
        
        return chunks
    
    def process_document(self, file_path: str) -> Dict[str, Any]:
        """Process a document and return metadata and chunks"""
        try:
            # Extract text
            text = self.extract_text(file_path)
            
            # Create chunks
            chunks = self.chunk_text(text)
            
            # Get file metadata
            file_stats = os.stat(file_path)
            
            return {
                'file_path': file_path,
                'filename': os.path.basename(file_path),
                'file_size': file_stats.st_size,
                'text_length': len(text),
                'total_chunks': len(chunks),
                'chunks': chunks,
                'status': 'completed'
            }
        
        except Exception as e:
            logger.error(f"Error processing document {file_path}: {str(e)}")
            return {
                'file_path': file_path,
                'filename': os.path.basename(file_path),
                'error': str(e),
                'status': 'failed'
            }
