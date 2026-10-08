import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { apolloClient, CREATE_CHAT_COMPLETION } from '../apollo-client';
import type { LLMModel } from './aiParamsSlice';
import { DJANGO_API_URL } from '../backend-api';

// Types
export interface Message {
  text: string;
  role: string;
  timestamp?: number;
  streaming?: boolean;
  references?: MessageReference[];
}

export interface MessageReference {
  content: string;
  source: string;
  page?: number;
}

export interface ChatState {
  messages: Message[];
  loading: boolean;
  error: string | null;
  inputText: string;
  streamingMessageId: string | null;
}

// Async thunk for streaming messages
export const sendStreamingMessage = createAsyncThunk(
  'chat/sendStreamingMessage',
  async (payload: { 
    messages: Message[], 
    temperature: number, 
    maxTokens: number,
    systemPrompt: string,
    selectedModel: LLMModel,
    ragNumContextDocs?: number,
    ragSimilarityThreshold?: number
  }, { dispatch, rejectWithValue }) => {
    console.log('🔄 sendStreamingMessage thunk started');
    console.log('📊 Streaming payload:', {
      provider: payload.selectedModel.provider,
      model: payload.selectedModel.id,
      messagesCount: payload.messages.length
    });
    
    try {
      // Check if this is a RAG query - RAG doesn't support streaming, fall back to regular message
      if (payload.selectedModel.id === 'rag-faiss') {
        console.log('🧠 RAG model detected, falling back to non-streaming');
        // For RAG, we'll fall back to the regular sendMessage thunk
        return await dispatch(sendMessage(payload)).unwrap();
      }

      // Check if this is a Hugging Face model - doesn't support streaming, fall back to regular message
      if (payload.selectedModel.id === 'llama3-ev-finetuned') {
        console.log('🤗 Hugging Face model detected, falling back to non-streaming');
        // For Hugging Face, we'll fall back to the regular sendMessage thunk
        return await dispatch(sendMessage(payload)).unwrap();
      }

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

      console.log('🌊 Starting streaming request to:', payload.selectedModel.provider);
      console.log('📡 Sending to /api/chat-stream with input:', input);

      // Create initial AI message placeholder
      const messageId = Date.now().toString();
      console.log('📝 Created message ID:', messageId);
      dispatch(startStreamingMessage(messageId));

      const response = await fetch('/api/chat-stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
      });

      console.log('📡 Fetch response status:', response.status, response.statusText);

      if (!response.ok) {
        throw new Error(`Streaming API error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      console.log('📖 Starting to read stream...');
      const decoder = new TextDecoder();

      try {
        while (true) {
          const { done, value } = await reader.read();
          console.log('📖 Read chunk:', { done, valueLength: value?.length });
          
          if (done) {
            console.log('✅ Stream finished');
            break;
          }

          const chunk = decoder.decode(value);
          console.log('📖 Decoded chunk:', chunk);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              console.log('📊 Processing data line:', data);
              
              if (data === '[DONE]') {
                console.log('🏁 Received [DONE] signal');
                dispatch(finishStreamingMessage(messageId));
                return { messageId, completed: true };
              }

              try {
                const parsed = JSON.parse(data);
                console.log('📊 Parsed data:', parsed);
                if (parsed.content) {
                  console.log('✏️ Appending content:', parsed.content);
                  dispatch(appendToStreamingMessage({ 
                    messageId, 
                    content: parsed.content 
                  }));
                }
              } catch (e) {
                console.log('⚠️ Failed to parse JSON:', data, e);
                // Skip invalid JSON
                continue;
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }

      console.log('✅ Streaming completed');
      return { messageId, completed: true };
    } catch (error) {
      console.error('❌ Streaming error:', error);
      return rejectWithValue(error instanceof Error ? error.message : 'Unknown error');
    }
  }
);

// Async thunk for sending messages (non-streaming fallback)
export const sendMessage = createAsyncThunk(
  'chat/sendMessage',
  async (payload: { 
    messages: Message[], 
    temperature: number, 
    maxTokens: number,
    systemPrompt: string,
    selectedModel: LLMModel,
    ragNumContextDocs?: number,
    ragSimilarityThreshold?: number
  }, { rejectWithValue }) => {
    console.log('🔄 sendMessage thunk started with payload:', payload);
    
    try {
      // Check if this is a RAG query
      if (payload.selectedModel.id === 'rag-faiss') {
        console.log('🧠 Using RAG endpoint for query');
        
        // Get the last user message as the query
        const userMessage = payload.messages[payload.messages.length - 1];
        if (!userMessage || userMessage.role !== 'user') {
          throw new Error('No user message found for RAG query');
        }

        // Call Django RAG endpoint
        const ragResponse = await fetch(`${DJANGO_API_URL}/api/rag/chat/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: userMessage.text,
            num_context_docs: payload.ragNumContextDocs || 4,
            similarity_threshold: payload.ragSimilarityThreshold || 0.0
          }),
        });

        if (!ragResponse.ok) {
          const errorData = await ragResponse.json();
          throw new Error(`RAG API error: ${errorData.error || 'Unknown error'}`);
        }

        const ragData = await ragResponse.json();
        console.log('✅ RAG response received:', ragData);

        const references: MessageReference[] = Array.isArray(ragData.context_documents)
          ? ragData.context_documents
              .filter((document: any) => typeof document?.content === 'string')
              .map((document: any) => {
                const rawSource = typeof document.metadata?.source === 'string'
                  ? document.metadata.source
                  : 'Knowledge base document';
                const source = rawSource.split(/[\\/]/).pop() || rawSource;
                const rawPage = document.metadata?.page;

                return {
                  content: document.content,
                  source,
                  // Document loaders use zero-based page indexes.
                  page: typeof rawPage === 'number' ? rawPage + 1 : undefined,
                };
              })
          : [];

        return {
          text: ragData.response || 'No response from RAG system',
          role: 'ai',
          timestamp: Date.now(),
          references
        };
      }

      // Check if this is a Hugging Face model query
      if (payload.selectedModel.id === 'llama3-ev-finetuned') {
        console.log('🤗 Using Hugging Face endpoint for query');
        
        // Get the last user message
        const userMessage = payload.messages[payload.messages.length - 1];
        if (!userMessage || userMessage.role !== 'user') {
          throw new Error('No user message found for Hugging Face query');
        }

        // Call Django Hugging Face endpoint
        const hfResponse = await fetch(`${DJANGO_API_URL}/api/chat/huggingface/chat/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: userMessage.text,
            temperature: payload.temperature,
            max_tokens: payload.maxTokens,
            system_prompt: payload.systemPrompt
          }),
        });

        if (!hfResponse.ok) {
          const errorData = await hfResponse.json();
          throw new Error(`Hugging Face API error: ${errorData.error || errorData.message || 'Unknown error'}`);
        }

        const hfData = await hfResponse.json();
        console.log('✅ Hugging Face response received:', hfData);

        return {
          text: hfData.response || 'No response from Hugging Face model',
          role: 'ai',
          timestamp: Date.now()
        };
      }

      // For non-RAG, non-HF models, use existing logic
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

      console.log('📡 Prepared input for GraphQL:', {
        ...input,
        selectedModelInfo: {
          id: payload.selectedModel.id,
          name: payload.selectedModel.name,
          provider: payload.selectedModel.provider
        }
      });

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
  streamingMessageId: null,
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
    startStreamingMessage: (state, action: PayloadAction<string>) => {
      const messageId = action.payload;
      state.messages.push({
        text: '',
        role: 'ai',
        timestamp: Date.now(),
        streaming: true
      });
      state.streamingMessageId = messageId;
      state.loading = true;
    },
    appendToStreamingMessage: (state, action: PayloadAction<{ messageId: string, content: string }>) => {
      const lastMessage = state.messages[state.messages.length - 1];
      if (lastMessage && lastMessage.streaming) {
        lastMessage.text += action.payload.content;
      }
    },
    finishStreamingMessage: (state, action: PayloadAction<string>) => {
      const lastMessage = state.messages[state.messages.length - 1];
      if (lastMessage && lastMessage.streaming) {
        lastMessage.streaming = false;
      }
      state.streamingMessageId = null;
      state.loading = false;
    },
    clearMessages: (state) => {
      state.messages = [];
      state.inputText = '';
      state.error = null;
      state.streamingMessageId = null;
    },
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Non-streaming message handlers
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
      })
      // Streaming message handlers
      .addCase(sendStreamingMessage.pending, (state) => {
        state.error = null;
      })
      .addCase(sendStreamingMessage.fulfilled, (state) => {
        // Streaming completion is handled by finishStreamingMessage action
      })
      .addCase(sendStreamingMessage.rejected, (state, action) => {
        state.loading = false;
        state.streamingMessageId = null;
        state.error = action.payload as string;
        // Remove the incomplete streaming message
        if (state.messages.length > 0 && state.messages[state.messages.length - 1].streaming) {
          state.messages.pop();
        }
      });
  },
});

export const { 
  setInputText, 
  addUserMessage, 
  startStreamingMessage,
  appendToStreamingMessage,
  finishStreamingMessage,
  clearMessages, 
  clearError 
} = chatSlice.actions;
export default chatSlice.reducer;
