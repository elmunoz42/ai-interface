# AI Chat Interface

A modern, feature-rich Next.js chat interface for interacting with Large Language Models (LLMs) using GraphQL, Redux, OpenAI API, and self-hosted Cloudflare Workers AI and Llama 3 8B Instruct. **Now includes RAG (Retrieval-Augmented Generation) capabilities with document upload and knowledge base integration.**

## ✨ Features

### 🎨 **Modern UI/UX**
- **Three-panel layout** with dual sidebars
- **Material-UI components** with custom styling
- **Responsive design** optimized for desktop and mobile
- **Real-time loading indicators** and error handling
- **Dark charcoal header** with professional styling

### 🧠 **AI Integration**
- **Multi-provider support** (Cloudflare Workers AI + OpenAI + RAG)
- **Dual API architecture** (GraphQL + REST fallback)
- **4 AI models available**:
  - **RAG Knowledge Base** (Django + FAISS + OpenAI) - **NEW!**
  - Llama 3 8B Instruct (Cloudflare - default)
  - GPT-3.5 Turbo (OpenAI)
  - GPT-4 (OpenAI)
- **Customizable AI parameters** (temperature, max tokens)
- **Smart error handling** with automatic fallback

### 📚 **RAG (Retrieval-Augmented Generation) - NEW!**
- **Document Upload**: Support for PDF, DOCX, TXT, and Markdown files
- **Vector Search**: FAISS-powered similarity search with sentence transformers
- **Knowledge Integration**: LangChain-based RAG pipeline with OpenAI GPT-3.5-turbo
- **Smart Retrieval**: Configurable similarity thresholds and context document limits
- **Document Management**: Upload, process, and manage knowledge base documents
- **Contextual Responses**: AI answers based on uploaded document content
- **Real-time Processing**: Automatic document chunking and embedding generation

### ⚙️ **Advanced Controls**
- **Model selection dropdown** (RAG, Llama 3, GPT-3.5 Turbo, GPT-4)
- **Temperature slider** (0.0 = focused, 1.0 = creative)
- **Token limit control** (50-8192 tokens, varies by model)
- **RAG-specific parameters**: Context documents (1-10), similarity threshold (0.0-1.0)
- **Real-time parameter adjustment**
- **Provider-specific information display**

### 🚀 **Prompt Engineering**
- **5 built-in prompt recipes**:
  - Fix Grammar
  - Code Review  
  - Brainstorm Ideas
  - Summarize
  - Debug Help
- **One-click prompt population**
- **Clear chat functionality**

### 🔧 **Developer Experience**
- **Redux Toolkit** state management
- **Modular component architecture**
- **TypeScript** throughout
- **Redux DevTools** integration
- **Comprehensive logging** for debugging

## 🏗️ **Architecture**

### **Full-Stack Structure**
```
ai-chat/
├── frontend/                   # Next.js React application
│   ├── app/
│   ├── components/
│   ├── lib/
│   └── pages/
└── backend/                    # Django REST API (NEW!)
    ├── ai_chat_backend/        # Django project settings
    ├── rag_service/            # RAG implementation
    ├── chat_api/              # Chat endpoints
    ├── document_store/        # Document management
    ├── vector_store/          # FAISS indices
    └── media/                 # Uploaded documents
```

### **Component Structure**
```
app/
├── aichat.tsx                 # Main app component (29 lines!)
├── layout.tsx                 # Redux provider setup
└── page.tsx                   # App entry point

components/
├── chat/
│   ├── MainChatArea.tsx       # Message container
│   ├── MessagesList.tsx       # Chat message display
│   └── ChatInput.tsx          # Input field + send button
├── sidebars/
│   ├── AIParametersSidebar.tsx    # AI controls + RAG settings + Upload
│   └── PromptRecipesSidebar.tsx   # Prompt shortcuts
├── ui/
│   ├── AppHeader.tsx          # Navigation bar
│   └── ErrorSnackbar.tsx      # Error notifications
└── index.ts                   # Component exports

lib/
├── apollo-client.ts           # GraphQL client setup
├── test-graphql.ts           # GraphQL testing utilities
└── store/
    ├── store.ts              # Redux store configuration
    ├── hooks.ts              # Typed Redux hooks
    ├── chatSlice.ts          # Chat state management + RAG routing
    ├── aiParamsSlice.ts      # AI parameters state + RAG settings
    ├── uiSlice.ts            # UI state management
    └── useReduxMonitoring.ts # Development monitoring

backend/                       # NEW! Django backend
├── rag_service/
│   ├── models.py             # Document and vector store models
│   ├── views.py              # RAG API endpoints
│   ├── serializers.py        # API serialization
│   ├── vector_store.py       # Original vector store service
│   ├── faiss_rag.py          # FAISS + LangChain implementation
│   └── document_processor.py # Document text extraction
├── ai_chat_backend/
│   ├── settings.py           # Django configuration
│   └── urls.py               # API routing
└── requirements.txt          # Python dependencies
```

### **State Management & API Architecture**
- **Redux Toolkit** with typed hooks
- **Async thunks** for API calls
- **Automatic error handling**
- **Development monitoring**
- **RAG routing logic** - Detects RAG model selection and routes to Django backend

### **API Layer**
- **Primary**: GraphQL with Apollo Server v4 (Next.js frontend APIs)
- **RAG Backend**: Django REST API with LangChain + FAISS (NEW!)
- **Fallback**: REST API proxy for traditional models
- **Providers**: 
  - **Django + OpenAI** (RAG Knowledge Base)
  - **Cloudflare Workers AI** (Llama 3 8B)
  - **OpenAI** (GPT-3.5 Turbo, GPT-4)

### **RAG Technology Stack**
- **Django REST Framework** - Backend API
- **FAISS** - Vector similarity search
- **Sentence Transformers** - Document embeddings (all-MiniLM-L6-v2)
- **LangChain** - RAG pipeline orchestration
- **OpenAI GPT-3.5-turbo** - Text generation
- **Document Processing** - PDF, DOCX, TXT, Markdown support

## 🚀 **Quick Start**

### Prerequisites
- **Frontend**: Node.js 18+, npm or yarn
- **Backend**: Python 3.9+, pip

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd ai-chat

# Frontend Setup
cd frontend
npm install
npm run dev

# Backend Setup (in a new terminal)
cd backend
python -m venv ai_chat_env
source ai_chat_env/bin/activate  # On Windows: ai_chat_env\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

**Frontend**: Visit `http://localhost:3000`
**Backend**: Django API at `http://localhost:8000`

### Environment Configuration

Create `.env.local` files for API keys:

**Frontend** (`frontend/.env.local`):
```bash
# Optional: Enable OpenAI models (GPT-3.5 Turbo, GPT-4)
OPENAI_API_KEY=your_openai_api_key_here
```

**Backend** (`backend/.env.local`):
```bash
# OpenAI Configuration (Required for RAG)
OPENAI_API_KEY=your_openai_api_key_here

# Django Settings
DEBUG=True
SECRET_KEY=your_secret_key_here
```

## 🔧 **Configuration**

### **Default AI Parameters**
```typescript
{
  temperature: 0.7,        // Creativity level (0.0-1.0)
  maxTokens: 300,         // Response length (50-8192, varies by model)
  systemPrompt: "You are a helpful assistant.",
  selectedModel: "Llama 3 8B Instruct", // Default model
  
  // RAG-specific settings (when RAG model selected)
  ragNumContextDocs: 3,    // Number of context documents (1-10)
  ragSimilarityThreshold: 0.1  // Similarity threshold (0.0-1.0)
}
```

### **Supported Models**
```typescript
const models = [
  {
    id: 'rag',
    name: 'RAG Knowledge Base',
    provider: 'django',
    requiresApiKey: true,  // OpenAI API key for generation
    supportsDocuments: true,
    maxTokens: 4000
  },
  {
    id: 'llama',
    name: 'Llama 3 8B Instruct',
    provider: 'cloudflare',
    requiresApiKey: false,
    maxTokens: 8192
  },
  // ... GPT models
];
```

## 📱 **Usage**

### **Basic Chat**
1. Type your message in the center input field
2. Press **Enter** or click **Send**
3. View AI responses in the message list
4. Use **Clear Chat** to start fresh

### **AI Model Selection**
- **Left Sidebar**: Choose between available AI models
- **RAG Knowledge Base**: Upload documents and chat with your knowledge base
- **Cloudflare**: Llama 3 8B Instruct (free, fast)
- **OpenAI**: GPT-3.5 Turbo, GPT-4 (requires API key)
- **Auto-adjustment**: Token limits adjust based on selected model

### **RAG Knowledge Base Usage** 🆕
1. **Select RAG Model**: Choose "RAG Knowledge Base" from the model dropdown
2. **Upload Documents**: Click the "Upload Document" button in the left sidebar
   - Supported formats: PDF, DOCX, TXT, Markdown
   - Documents are automatically processed and indexed
3. **Configure RAG Settings**:
   - **Context Documents**: Number of relevant document chunks to retrieve (1-10)
   - **Similarity Threshold**: Minimum similarity score for document relevance (0.0-1.0)
4. **Ask Questions**: Chat normally - the AI will use your uploaded documents as context
5. **View Sources**: Check the response metadata to see which documents were used

### **AI Parameter Tuning**
- **Left Sidebar**: Adjust temperature and token limits
- **Temperature**: 0.0 for focused responses, 1.0 for creative
- **Max Tokens**: Control response length (varies by model)
- **RAG Parameters**: Available when RAG model is selected

### **Document Management**
- **Upload**: Drag & drop or click to upload documents
- **Processing**: Real-time feedback on document processing status
- **Storage**: Documents are processed into vector embeddings for fast retrieval

### **Prompt Recipes**
- **Right Sidebar**: Quick-access prompt templates
- Click any recipe to populate the input field
- Add your specific content and send

### **Development Features**
- **Redux DevTools**: Install browser extension for state monitoring
- **Console Logging**: Detailed action and state logs in development
- **Error Handling**: Automatic fallback between GraphQL and REST

## 🛠️ **Development**

### **Adding New Components**
```typescript
// Create in appropriate subfolder
components/
├── chat/          # Chat-related components
├── sidebars/      # Sidebar components  
├── ui/            # General UI components
```

### **Redux State**
```typescript
// Add new slice
lib/store/newSlice.ts

// Update store
lib/store/store.ts

// Use in components
const data = useAppSelector(state => state.newSlice.data);
const dispatch = useAppDispatch();
```

### **API Integration**
- **GraphQL**: Add queries/mutations to `lib/apollo-client.ts`
- **REST**: Modify `pages/api/proxy.tsx`
- **Error Handling**: Automatic fallback system

## 🧪 **Testing & Debugging**

### **Redux DevTools**
1. Install Redux DevTools browser extension
2. Open DevTools → Redux tab
3. Monitor actions and state changes

### **Console Logging**
Development mode includes comprehensive logging:
- 🔄 Redux state updates
- 🚀 Action dispatching
- 📡 API requests/responses
- ❌ Error details

### **Component Testing**
```bash
# Run tests (when implemented)
npm test

# Type checking
npm run type-check
```

## 📦 **Dependencies**

### **Frontend**
- **Next.js 14.2.3** - React framework
- **React 18** - UI library
- **TypeScript** - Type safety
- **Material-UI** - Component library
- **@reduxjs/toolkit** - Redux state management
- **@apollo/client** - GraphQL client
- **@apollo/server** - GraphQL server
- **openai** - OpenAI SDK for GPT models

### **Backend (NEW!)**
- **Django 4.2.15** - Web framework
- **djangorestframework** - API framework
- **langchain & langchain-openai** - RAG pipeline
- **faiss-cpu** - Vector similarity search
- **sentence-transformers** - Document embeddings
- **pypdf, python-docx** - Document processing
- **python-dotenv** - Environment management

## 🐛 **Troubleshooting**

### **Common Issues**

**Chat not responding:**
- Check browser console for errors
- Verify Redux DevTools shows action dispatching
- Check Network tab for API call failures

**RAG model not working:** 🆕
- Verify OpenAI API key is set in `backend/.env.local`
- Check Django server is running on port 8000
- Ensure documents have been uploaded and processed
- Check similarity threshold isn't too high (try 0.1)

**Document upload failing:**
- Check file format is supported (PDF, DOCX, TXT, MD)
- Verify Django backend is running and accessible
- Check browser console for upload errors
- Ensure file size is reasonable (< 10MB recommended)

**Redux DevTools not showing:**
- Install Redux DevTools browser extension
- Refresh the page after installation

**API failures:**
- Check if both GraphQL and REST APIs fail
- Verify Cloudflare Workers AI endpoint availability
- For OpenAI: Check OPENAI_API_KEY environment variable
- For RAG: Check Django backend connectivity
- Monitor console for detailed error logs

**Backend connection issues:**
- Verify Django server is running on `http://localhost:8000`
- Check CORS configuration in Django settings
- Ensure `.env.local` files are properly configured
- Test backend directly: `curl http://localhost:8000/api/rag/status/`

## 🤝 **Contributing**

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### **Development Guidelines**
- Use TypeScript for all new code
- Follow component modularity patterns
- Add Redux slices for new state
- Include error handling in API calls
- Test with Redux DevTools

## 📄 **License**

MIT License - see LICENSE file for details.

## 🙏 **Acknowledgments**

- **Cloudflare Workers AI** for LLM hosting
- **OpenAI** for GPT models and API
- **Meta** for Llama 3 model
- **Material-UI** team for components
- **Redux Toolkit** team for state management
- **Apollo GraphQL** for API layer

---

**Built with ❤️ using Next.js, Redux Toolkit, and Material-UI**
