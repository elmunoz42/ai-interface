# Knowledge Base Management Guide

## Overview

This document provides comprehensive guidance on managing the RAG (Retrieval-Augmented Generation) knowledge base system, including FAISS vector database operations, maintenance procedures, and best practices.

## Table of Contents

- [About FAISS Vector Database](#about-faiss-vector-database)
- [System Architecture](#system-architecture)
- [Document Upload Process](#document-upload-process)
- [Maintenance Procedures](#maintenance-procedures)
- [Troubleshooting](#troubleshooting)
- [Best Practices](#best-practices)

---

## About FAISS Vector Database

### What is FAISS?

**FAISS** (Facebook AI Similarity Search) is a library developed by Meta AI for efficient similarity search and clustering of dense vectors. It's used in our RAG system to:

- Store document embeddings (vector representations of text chunks)
- Perform fast similarity searches to find relevant context
- Scale to millions of vectors with efficient indexing
- Enable semantic search capabilities

### Key Characteristics

- **Immutable**: Once documents are added, individual items cannot be removed
- **Index-based**: Uses specialized data structures for fast retrieval
- **Persistent**: Stores indices as files (`index.faiss` and `index.pkl`)
- **Memory-efficient**: Optimized for large-scale vector storage

### Why We Use FAISS

1. **Speed**: Lightning-fast similarity search even with large datasets
2. **Accuracy**: High-quality semantic matching using vector embeddings
3. **Scalability**: Can handle millions of document chunks
4. **Open Source**: Free and well-maintained by Meta AI
5. **LangChain Integration**: Seamless integration with our RAG pipeline

---

## System Architecture

### Components

```
┌─────────────────────────────────────────────────────────────┐
│                    AI Chat Application                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Frontend (Next.js)                                          │
│    ↓                                                         │
│  Django Backend                                              │
│    ↓                                                         │
│  RAG Service                                                 │
│    ├── Document Upload & Processing                         │
│    ├── Text Chunking & Embedding                            │
│    ├── FAISS Vector Store                                   │
│    └── LLM Integration (OpenAI GPT)                         │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Upload**: User uploads document (PDF, TXT, DOCX, MD)
2. **Processing**: Document is split into chunks (overlapping segments)
3. **Embedding**: Each chunk is converted to vector using Sentence Transformers
4. **Storage**: Vectors stored in FAISS index + metadata in Django DB
5. **Query**: User question is embedded and matched against stored vectors
6. **Retrieval**: Top-k similar chunks retrieved as context
7. **Generation**: LLM uses context to generate accurate answer

### File Structure

```
backend/
├── vector_store/              # FAISS index storage
│   ├── index.faiss           # Vector index file
│   └── index.pkl             # Metadata pickle file
├── media/documents/           # Uploaded documents
├── model_cache/               # Cached embedding models
├── rag_service/              # RAG application code
└── db.sqlite3                # Django database (metadata)
```

---

## Document Upload Process

### Supported Formats

- **PDF** (.pdf) - Text extraction from PDF documents
- **Text** (.txt) - Plain text files
- **Markdown** (.md) - Markdown formatted documents
- **Word** (.docx) - Microsoft Word documents

### Processing Pipeline

1. **Upload Validation**
   - File format check
   - Size validation
   - Content type verification

2. **Text Extraction**
   - Format-specific parsers
   - Character encoding handling
   - Metadata extraction

3. **Chunking**
   - Split into ~500-1000 character segments
   - Overlap of ~200 characters for context continuity
   - Preserve paragraph boundaries when possible

4. **Embedding Generation**
   - Model: `sentence-transformers/all-MiniLM-L6-v2`
   - Dimension: 384-dimensional vectors
   - Normalized for cosine similarity

5. **Storage**
   - FAISS: Vector embeddings
   - Django DB: Document metadata, chunk text, file info
   - Filesystem: Original uploaded files

### Embedding Model

**Model**: `sentence-transformers/all-MiniLM-L6-v2`
- **Size**: ~80MB
- **Speed**: Fast inference (~100ms per document)
- **Quality**: Good semantic understanding
- **Languages**: Optimized for English, works with others

---

## Maintenance Procedures

### Complete Knowledge Base Reset

Use this procedure when you need to:
- Clear all uploaded documents
- Remove outdated information
- Start fresh with new knowledge base
- Fix corrupted FAISS index

#### Prerequisites

1. Stop the Django development server (`CTRL+C`)
2. Ensure no active API requests
3. Backup important documents if needed

#### Reset Steps

**Step 1: Delete FAISS Index Files**
```bash
cd backend
rm -rf vector_store/*
rm -f vector_store.faiss vector_store_metadata.pkl
```

**Step 2: Delete Uploaded Documents**
```bash
rm -rf media/documents/*
```

**Step 3: Clear Django Database Records**
```bash
source ai_chat_env/bin/activate
python manage.py shell -c "
from rag_service.models import Document, DocumentChunk, VectorStore

# Delete all records
DocumentChunk.objects.all().delete()
Document.objects.all().delete()
VectorStore.objects.all().delete()

print('✅ Database cleared successfully')
"
```

**Step 4: Verify Reset**
```bash
# Check filesystem
ls -la vector_store/
ls -la media/documents/

# Check database
python manage.py shell -c "
from rag_service.models import Document, DocumentChunk, VectorStore
print(f'Documents: {Document.objects.count()}')
print(f'Chunks: {DocumentChunk.objects.count()}')
print(f'VectorStores: {VectorStore.objects.count()}')
"
```

**Step 5: Restart Server**
```bash
python manage.py runserver 8000
```

#### Post-Reset

- Fresh FAISS index will be automatically created on first document upload
- All counters reset to zero
- System ready for new knowledge base

### Partial Cleanup (Without Full Reset)

**Clear only uploaded files (keep index):**
```bash
rm -rf backend/media/documents/*
```

**Clear only vector store (keep uploaded files):**
```bash
rm -rf backend/vector_store/*
```

**Clear only database records:**
```bash
python manage.py shell -c "
from rag_service.models import Document, DocumentChunk, VectorStore
DocumentChunk.objects.all().delete()
Document.objects.all().delete()
VectorStore.objects.all().delete()
"
```

### Regular Maintenance Tasks

#### Weekly

- Monitor disk space usage
- Check error logs for upload failures
- Verify vector store integrity

#### Monthly

- Review and remove outdated documents
- Update embedding model if needed
- Optimize database (vacuum)

#### As Needed

- Reset knowledge base when changing domains
- Rebuild index after bulk deletions
- Update FAISS version for performance improvements

---

## Troubleshooting

### Common Issues

#### Issue: "Connection error" when querying RAG

**Symptoms:**
```
Error in RAG query: Connection error.
Error with LLM RAG chain: Connection error.
```

**Causes:**
- OpenAI API key missing or invalid
- Network connectivity issues
- API rate limits exceeded

**Solutions:**
1. Check `.env.local` for valid `OPENAI_API_KEY`
2. Verify API key has credits and is active
3. Check network connection
4. Review OpenAI API status page

#### Issue: "FAISS index file not found"

**Symptoms:**
```
Error: 'f' failed: could not open /path/to/index.faiss for reading
```

**Causes:**
- No documents uploaded yet
- Index files deleted manually
- Corrupted index files

**Solutions:**
1. Upload at least one document to initialize index
2. Run knowledge base reset procedure
3. Check file permissions on `vector_store/` directory

#### Issue: Deprecated LangChain warnings

**Symptoms:**
```
LangChainDeprecationWarning: The class `HuggingFaceEmbeddings` was deprecated
```

**Impact:** Low - warnings only, functionality works

**Solutions:**
1. Update to latest LangChain version
2. Migrate to `langchain-huggingface` package:
   ```bash
   pip install -U langchain-huggingface
   ```
3. Update imports in `faiss_rag.py`

#### Issue: Tokenizers parallelism warning

**Symptoms:**
```
huggingface/tokenizers: The current process just got forked
```

**Solutions:**
Add to `.env.local`:
```bash
TOKENIZERS_PARALLELISM=false
```

#### Issue: Large repository size from documents

**Symptoms:**
- Git repository size growing rapidly
- PDFs appearing in git status

**Solutions:**
1. Ensure `.gitignore` includes:
   ```
   backend/media/documents/
   backend/vector_store/
   *.pdf
   *.docx
   ```
2. Remove tracked files:
   ```bash
   git rm --cached backend/media/documents/*
   git rm --cached backend/vector_store/*
   ```

---

## Best Practices

### Document Management

1. **Organize by Topic**: Group related documents
2. **Use Descriptive Names**: Clear, searchable filenames
3. **Quality Over Quantity**: Upload relevant, accurate documents
4. **Regular Updates**: Remove outdated information periodically
5. **Version Control**: Keep track of document versions

### Query Optimization

1. **Adjust Context Documents**: Start with 3-5, increase if needed
2. **Set Similarity Threshold**: Filter out irrelevant matches (0.5-0.7 typical)
3. **Specific Questions**: More specific queries yield better results
4. **Test Queries**: Verify retrieval quality after uploads

### Performance Tuning

1. **Chunk Size**: Balance between context and precision
   - Small chunks (300-500 chars): More precise, less context
   - Large chunks (800-1200 chars): More context, less precise

2. **Overlap**: Ensure continuity between chunks
   - Recommended: 15-25% overlap
   - Too much: Redundant storage
   - Too little: Lost context

3. **Embedding Model**: Choose based on needs
   - Fast: `all-MiniLM-L6-v2` (current)
   - Better quality: `all-mpnet-base-v2`
   - Multilingual: `paraphrase-multilingual-MiniLM-L12-v2`

### Security

1. **API Keys**: Never commit to repository
2. **Document Access**: Implement authentication if needed
3. **Rate Limiting**: Protect against abuse
4. **Input Validation**: Sanitize uploaded files
5. **Backup**: Regular backups of important documents

### Cost Management

1. **OpenAI Usage**: Monitor token consumption
2. **Chunk Strategy**: Fewer, larger chunks = lower costs
3. **Context Documents**: Reduce `k` value to minimize tokens sent to LLM
4. **Caching**: Cache common queries when possible

---

## API Reference

### Upload Document

```bash
curl -X POST \
  -F "file=@document.pdf" \
  http://127.0.0.1:8000/api/rag/upload/
```

### Query RAG System

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Your question here?",
    "num_context_docs": 3,
    "similarity_threshold": 0.1
  }' \
  http://127.0.0.1:8000/api/rag/chat/
```

### Check System Status

```bash
curl http://127.0.0.1:8000/api/rag/status/
```

### Search Documents

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "query": "search term",
    "num_results": 5
  }' \
  http://127.0.0.1:8000/api/rag/search/
```

### Clear Vector Store (Development Only)

```bash
curl -X DELETE http://127.0.0.1:8000/api/rag/clear/
```

---

## Configuration

### Environment Variables

Required in `.env.local`:
```bash
# OpenAI Configuration
OPENAI_API_KEY=sk-...

# FAISS Configuration
FAISS_INDEX_PATH=./vector_store/

# Optional
TOKENIZERS_PARALLELISM=false
```

### Django Settings

Key settings in `settings.py`:
```python
# Media files (uploaded documents)
MEDIA_ROOT = BASE_DIR / 'media'
MEDIA_URL = '/media/'

# FAISS vector store
FAISS_INDEX_PATH = BASE_DIR / 'vector_store'

# Embedding model
EMBEDDING_MODEL = 'sentence-transformers/all-MiniLM-L6-v2'
```

---

## Resources

### Documentation

- [FAISS Documentation](https://github.com/facebookresearch/faiss/wiki)
- [LangChain RAG Guide](https://python.langchain.com/docs/use_cases/question_answering/)
- [Sentence Transformers](https://www.sbert.net/)
- [OpenAI API Reference](https://platform.openai.com/docs/api-reference)

### Community

- [LangChain Discord](https://discord.gg/langchain)
- [FAISS GitHub Issues](https://github.com/facebookresearch/faiss/issues)
- [OpenAI Community Forum](https://community.openai.com/)

---

## Version History

- **v1.0** (August 2025) - Initial RAG implementation with FAISS
- **v1.1** (August 2025) - Added LLM integration with OpenAI
- **v1.2** (October 2025) - Improved error handling and documentation

---

## Support

For issues or questions:
1. Check this documentation first
2. Review error logs in Django console
3. Consult the troubleshooting section
4. Open an issue on GitHub

---

**Last Updated**: October 18, 2025