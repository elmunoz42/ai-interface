# Project Specifications

## User Stories

### 1. Knowledge Base Management

- **As an authenticated user, I want to upload documents (PDF, DOCX, TXT, MD) to a knowledge base, so that I can use them for AI-powered retrieval and question answering.**
- **As an authenticated user, I want to view a list of uploaded KB files in a sidebar, so that I can see what documents are available.**
- **As an authenticated user, I want to preview, download, and delete KB files from the sidebar, so that I can manage my knowledge base easily.**
- **As an authenticated user, I want file deletion to be secure and require confirmation, so that I don't accidentally lose important documents.**

### 2. AI Model and RAG Parameters

- **As an authenticated user, I want to select from multiple AI models (OpenAI, Cloudflare, FAISS, etc.), so that I can choose the best model for my needs.**
- **As an authenticated user, I want to adjust model parameters (temperature, max tokens, etc.), so that I can control the behavior of the AI.**
- **As an authenticated user, I want to configure RAG-specific parameters (similarity threshold, number of context documents), so that I can fine-tune retrieval performance.**

### 3. Apps and Utilities

- **As an authenticated user, I want to access AI-powered utilities (e.g., Meeting Follow-up) from an Apps tab in the sidebar, so that I can use specialized workflows.**
- **As an authenticated user, I want to generate follow-up emails and stakeholder lists from meeting transcripts, so that I can automate meeting documentation.**

### 4. UI/UX

- **As an authenticated user, I want the sidebar to be modular, with separate tabs for AI parameters, KB, and Apps, so that the interface is organized and easy to use.**
- **As an authenticated user, I want KB and Apps sidebar items to be displayed as cards, so that the UI is visually appealing and clear.**
- **As an authenticated user, I want modals for file preview and app workflows to be responsive and accessible.**

### 5. Security & Robustness

- **As an authenticated user, I want all file operations to be protected by CSRF tokens and proper authentication, so that my data is secure.**
- **As an authenticated user, I want clear error messages and feedback for all actions (upload, delete, etc.), so that I know what is happening.**

## Technical Specifications

- **Frontend:** Next.js, React, TypeScript, Material-UI
- **Backend:** Django, Django REST Framework
- **State Management:** Redux Toolkit (aiParamsSlice, promptRecipesSlice, etc.)
- **File Upload/Download:** REST API endpoints for document management
- **RAG (Retrieval-Augmented Generation):** FAISS vector search, document chunking, and context retrieval
- **CSRF Protection:** CSRF token extraction and inclusion in all mutating requests
- **Modular Sidebar:** Components for AI parameters, KB, and Apps tabs
- **Meeting Follow-up Utility:** Upload meeting transcript, extract presenters, stakeholders, and generate follow-up emails

## Acceptance Criteria

- Users can upload, preview, download, and delete KB files from the sidebar
- Sidebar tabs are modular and visually distinct
- AI model and RAG parameters are adjustable and persist in state
- Apps tab provides access to Meeting Follow-up utility with full workflow
- All file operations are secure and provide user feedback
- UI is responsive and accessible

## Future Enhancements

- Add more AI-powered utilities to the Apps tab
- Support for additional document types and larger files
- User authentication and role-based access
- Advanced search and filtering for KB documents
- Integration with external data sources (e.g., cloud storage)
