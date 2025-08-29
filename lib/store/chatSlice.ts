import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { apolloClient, CREATE_CHAT_COMPLETION } from '../apollo-client';
import type { LLMModel } from './aiParamsSlice';

// Types
export interface Message {
  text: string;
  role: string;
  timestamp?: number;
}

export interface ChatState {
  messages: Message[];
  loading: boolean;
  error: string | null;
  inputText: string;
}

// Async thunk for sending messages
export const sendMessage = createAsyncThunk(
  'chat/sendMessage',
  async (payload: { 
    messages: Message[], 
    temperature: number, 
    maxTokens: number,
    systemPrompt: string,
    selectedModel: LLMModel
  }, { rejectWithValue }) => {
    console.log('🔄 sendMessage thunk started with payload:', payload);
    
    try {
      // Prepare the input for GraphQL
      const input = {
        messages: payload.messages.map(msg => ({
          role: msg.role === 'ai' ? 'assistant' : msg.role,
          content: msg.text
        })),
        max_tokens: payload.maxTokens,
        temperature: payload.temperature,
        system_prompt: payload.systemPrompt,
        model: payload.selectedModel.id,
        provider: payload.selectedModel.provider
      };

      console.log('📡 Prepared input:', input);

      // Try GraphQL first
      try {
        console.log('🔗 Trying GraphQL...');
        const result = await apolloClient.mutate({
          mutation: CREATE_CHAT_COMPLETION,
          variables: { input },
        });

        const data = result.data as any;
        console.log('✅ GraphQL success:', data);
        
        const response = {
          text: data.createChatCompletion.choices[0].message.content,
          role: 'ai',
          timestamp: Date.now()
        };
        
        console.log('📝 Returning response:', response);
        return response;
      } catch (graphqlError) {
        console.warn('❌ GraphQL failed, falling back to REST API:', graphqlError);
        
        // Fallback to REST API
        const response = await fetch('/api/proxy', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(input),
        });
        
        if (!response.ok) {
          throw new Error('Both GraphQL and REST API failed');
        }

        const data = await response.json();
        return {
          text: data.choices[0].message.content,
          role: 'ai',
          timestamp: Date.now()
        };
      }
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Unknown error');
    }
  }
);

const initialState: ChatState = {
  messages: [],
  loading: false,
  error: null,
  inputText: '',
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setInputText: (state, action: PayloadAction<string>) => {
      state.inputText = action.payload;
    },
    addUserMessage: (state, action: PayloadAction<string>) => {
      state.messages.push({
        text: action.payload,
        role: 'user',
        timestamp: Date.now()
      });
      state.inputText = '';
    },
    clearMessages: (state) => {
      state.messages = [];
      state.inputText = '';
      state.error = null;
    },
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(sendMessage.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.loading = false;
        state.messages.push(action.payload);
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setInputText, addUserMessage, clearMessages, clearError } = chatSlice.actions;
export default chatSlice.reducer;
