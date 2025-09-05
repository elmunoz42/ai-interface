import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type LLMProvider = 'cloudflare' | 'openai';

export interface LLMModel {
  id: string;
  name: string;
  provider: LLMProvider;
  description: string;
  maxTokens: number;
}

export type AIModel = 'openai' | 'anthropic' | 'cloudflare' | 'rag';

interface AIParamsState {
  model: AIModel;
  temperature: number;
  maxTokens: number;
  topP: number;
  frequencyPenalty: number;
  presencePenalty: number;
  systemPrompt: string;
  selectedModel: LLMModel;
  availableModels: LLMModel[];
  // RAG-specific parameters
  ragNumContextDocs: number;
  ragSimilarityThreshold: number;
}

const availableModels: LLMModel[] = [
  {
    id: 'llama-3-8b-instruct',
    name: 'Llama 3 8B Instruct',
    provider: 'cloudflare',
    description: 'Fast and efficient model via Cloudflare Workers AI',
    maxTokens: 4000
  },
  {
    id: 'gpt-3.5-turbo',
    name: 'GPT-3.5 Turbo',
    provider: 'openai',
    description: 'OpenAI\'s fast and cost-effective model',
    maxTokens: 4096
  },
  {
    id: 'gpt-4',
    name: 'GPT-4',
    provider: 'openai',
    description: 'OpenAI\'s most capable model',
    maxTokens: 8192
  },
  {
    id: 'rag-faiss',
    name: 'RAG with FAISS',
    provider: 'cloudflare', // Can use any provider for the underlying LLM
    description: 'Retrieval-Augmented Generation using local documents',
    maxTokens: 4000
  }
];

const initialState: AIParamsState = {
  model: 'openai',
  temperature: 0.7,
  maxTokens: 150,
  topP: 1,
  frequencyPenalty: 0,
  presencePenalty: 0,
  systemPrompt: 'You are a helpful assistant.',
  selectedModel: availableModels[1], // GPT-3.5 Turbo as default
  availableModels,
  ragNumContextDocs: 4,
  ragSimilarityThreshold: 0.7,
};

const aiParamsSlice = createSlice({
  name: 'aiParams',
  initialState,
  reducers: {
    setTemperature: (state, action: PayloadAction<number>) => {
      state.temperature = action.payload;
    },
    setMaxTokens: (state, action: PayloadAction<number>) => {
      // Ensure maxTokens doesn't exceed the selected model's limit
      const modelLimit = state.selectedModel.maxTokens;
      state.maxTokens = Math.min(action.payload, modelLimit);
    },
    setSystemPrompt: (state, action: PayloadAction<string>) => {
      state.systemPrompt = action.payload;
    },
    setSelectedModel: (state, action: PayloadAction<LLMModel>) => {
      state.selectedModel = action.payload;
      // Adjust maxTokens if it exceeds the new model's limit
      if (state.maxTokens > action.payload.maxTokens) {
        state.maxTokens = Math.min(1000, action.payload.maxTokens);
      }
    },
    resetToDefaults: (state) => {
      state.temperature = 0.7;
      state.maxTokens = 300;
      state.systemPrompt = 'You are a helpful assistant.';
      state.selectedModel = state.availableModels[0];
    },
    setRagNumContextDocs: (state, action: PayloadAction<number>) => {
      state.ragNumContextDocs = Math.max(1, Math.min(action.payload, 10));
    },
    setRagSimilarityThreshold: (state, action: PayloadAction<number>) => {
      state.ragSimilarityThreshold = Math.max(0.1, Math.min(action.payload, 1.0));
    },
    setModel: (state, action: PayloadAction<AIModel>) => {
      state.model = action.payload;
    }
  },
});

export const { 
  setTemperature, 
  setMaxTokens, 
  setSystemPrompt, 
  setSelectedModel,
  resetToDefaults,
  setRagNumContextDocs,
  setRagSimilarityThreshold,
  setModel
} = aiParamsSlice.actions;
export default aiParamsSlice.reducer;
