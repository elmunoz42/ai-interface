import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type LLMProvider = 'cloudflare' | 'openai';

export interface LLMModel {
  id: string;
  name: string;
  provider: LLMProvider;
  description: string;
  maxTokens: number;
}

export interface AIParamsState {
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
  selectedModel: LLMModel;
  availableModels: LLMModel[];
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
  }
];

const initialState: AIParamsState = {
  temperature: 0.7,
  maxTokens: 300,
  systemPrompt: 'You are a helpful assistant.',
  selectedModel: availableModels[0], // Default to Llama 3
  availableModels
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
    }
  },
});

export const { 
  setTemperature, 
  setMaxTokens, 
  setSystemPrompt, 
  setSelectedModel,
  resetToDefaults 
} = aiParamsSlice.actions;
export default aiParamsSlice.reducer;
