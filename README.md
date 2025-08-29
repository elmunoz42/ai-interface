# AI Chat Interface

A modern, feature-rich chat interface for interacting with Large Language Models (LLMs) using Cloudflare Workers AI and Llama 3 8B Instruct.

## ✨ Features

### 🎨 **Modern UI/UX**
- **Three-panel layout** with dual sidebars
- **Material-UI components** with custom styling
- **Responsive design** optimized for desktop and mobile
- **Real-time loading indicators** and error handling
- **Dark charcoal header** with professional styling

### 🧠 **AI Integration**
- **Dual API architecture** (GraphQL + REST fallback)
- **Cloudflare Workers AI** backend with Llama 3 8B Instruct
- **Customizable AI parameters** (temperature, max tokens)
- **Smart error handling** with automatic fallback

### ⚙️ **Advanced Controls**
- **Temperature slider** (0.0 = focused, 1.0 = creative)
- **Token limit control** (50-4000 tokens)
- **Real-time parameter adjustment**
- **Model information display**

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
- **Endpoint**: Cloudflare Workers AI
- **Model**: Llama 3 8B Instruct

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
  maxTokens: 300,         // Response length (50-4000)
  systemPrompt: "You are a helpful assistant."
}
```

### **Environment Variables**
The app uses Cloudflare Workers AI endpoints. No additional environment variables required for basic usage.

## 📱 **Usage**

### **Basic Chat**
1. Type your message in the center input field
2. Press **Enter** or click **Send**
3. View AI responses in the message list
4. Use **Clear Chat** to start fresh

### **AI Parameter Tuning**
- **Left Sidebar**: Adjust temperature and token limits
- **Temperature**: 0.0 for focused responses, 1.0 for creative
- **Max Tokens**: Control response length (50-4000)

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
- Monitor console for detailed error logs

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
- **Meta** for Llama 3 model
- **Material-UI** team for components
- **Redux Toolkit** team for state management
- **Apollo GraphQL** for API layer

---

**Built with ❤️ using Next.js, Redux Toolkit, and Material-UI**
