# AI Chat Interface

A modern, feature-rich Next.js chat interface for interacting with Large Language Models (LLMs) using Cloudflare Workers AI and Llama 3 8B Instruct.

## ✨ Features

### 🎨 **Modern UI/UX**
- **Three-panel layout** with dual sidebars
- **Material-UI components** with custom styling
- **Responsive design** optimized for desktop and mobile
- **Real-time loading indicators** and error handling
- **Dark charcoal header** with professional styling

### 🧠 **AI Integration**
- **Multi-provider support** (Cloudflare Workers AI + OpenAI)
- **Dual API architecture** (GraphQL + REST fallback)
- **3 AI models available**:
  - Llama 3 8B Instruct (Cloudflare - default)
  - GPT-3.5 Turbo (OpenAI)
  - GPT-4 (OpenAI)
- **Customizable AI parameters** (temperature, max tokens)
- **Smart error handling** with automatic fallback

### ⚙️ **Advanced Controls**
- **Model selection dropdown** (Llama 3, GPT-3.5 Turbo, GPT-4)
- **Temperature slider** (0.0 = focused, 1.0 = creative)
- **Token limit control** (50-8192 tokens, varies by model)
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
│   ├── AIParametersSidebar.tsx    # Temperature & token controls
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
    ├── chatSlice.ts          # Chat state management
    ├── aiParamsSlice.ts      # AI parameters state
    ├── uiSlice.ts            # UI state management
    └── useReduxMonitoring.ts # Development monitoring

pages/api/
├── graphql.ts                # Apollo Server GraphQL endpoint
└── proxy.tsx                 # REST API fallback
```

### **State Management**
- **Redux Toolkit** with typed hooks
- **Async thunks** for API calls
- **Automatic error handling**
- **Development monitoring**

### **API Layer**
- **Primary**: GraphQL with Apollo Server v4
- **Fallback**: REST API proxy
- **Providers**: Cloudflare Workers AI + OpenAI
- **Models**: Llama 3 8B, GPT-3.5 Turbo, GPT-4

## 🚀 **Quick Start**

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd ai-chat

# Install dependencies
npm install

# Start development server
npm run dev
```

Visit `http://localhost:3000` to use the chat interface.

## 🔧 **Configuration**

### **Default AI Parameters**
```typescript
{
  temperature: 0.7,        // Creativity level (0.0-1.0)
  maxTokens: 300,         // Response length (50-8192, varies by model)
  systemPrompt: "You are a helpful assistant.",
  selectedModel: "Llama 3 8B Instruct" // Default model
}
```

### **Environment Variables**
```bash
# Optional: Enable OpenAI models (GPT-3.5 Turbo, GPT-4)
OPENAI_API_KEY=your_openai_api_key_here

# If not set, only Cloudflare Workers AI (Llama 3) will be available
```

## 📱 **Usage**

### **Basic Chat**
1. Type your message in the center input field
2. Press **Enter** or click **Send**
3. View AI responses in the message list
4. Use **Clear Chat** to start fresh

### **AI Model Selection**
- **Left Sidebar**: Choose between available AI models
- **Cloudflare**: Llama 3 8B Instruct (free, fast)
- **OpenAI**: GPT-3.5 Turbo, GPT-4 (requires API key)
- **Auto-adjustment**: Token limits adjust based on selected model

### **AI Parameter Tuning**
- **Left Sidebar**: Adjust temperature and token limits
- **Temperature**: 0.0 for focused responses, 1.0 for creative
- **Max Tokens**: Control response length (varies by model)

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

### **Core**
- **Next.js 14.2.3** - React framework
- **React 18** - UI library
- **TypeScript** - Type safety

### **UI/Styling** 
- **Material-UI** - Component library
- **@mui/material** - Core components
- **@mui/icons-material** - Icon set

### **State Management**
- **@reduxjs/toolkit** - Redux state management
- **react-redux** - React-Redux bindings

### **GraphQL**
- **@apollo/client** - GraphQL client
- **@apollo/server** - GraphQL server
- **@as-integrations/next** - Apollo-Next.js integration
- **graphql** - GraphQL implementation

### **AI/ML**
- **openai** - OpenAI SDK for GPT models

## 🐛 **Troubleshooting**

### **Common Issues**

**Chat not responding:**
- Check browser console for errors
- Verify Redux DevTools shows action dispatching
- Check Network tab for API call failures

**Redux DevTools not showing:**
- Install Redux DevTools browser extension
- Refresh the page after installation

**Compilation errors:**
- Run `npm install` to ensure all dependencies
- Check TypeScript errors in console
- Verify component imports are correct

**API failures:**
- Check if both GraphQL and REST APIs fail
- Verify Cloudflare Workers AI endpoint availability
- For OpenAI: Check OPENAI_API_KEY environment variable
- Monitor console for detailed error logs

**OpenAI models not available:**
- Set OPENAI_API_KEY environment variable
- Restart the development server
- Check API key validity at https://platform.openai.com/api-keys

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
