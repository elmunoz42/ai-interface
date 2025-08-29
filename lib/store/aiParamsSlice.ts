import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface AIParamsState {
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
}

const initialState: AIParamsState = {
  temperature: 0.7,
  maxTokens: 300,
  systemPrompt: 'You are a helpful assistant.',
};

const aiParamsSlice = createSlice({
  name: 'aiParams',
  initialState,
  reducers: {
    setTemperature: (state, action: PayloadAction<number>) => {
      state.temperature = action.payload;
    },
    setMaxTokens: (state, action: PayloadAction<number>) => {
      state.maxTokens = action.payload;
    },
    setSystemPrompt: (state, action: PayloadAction<string>) => {
      state.systemPrompt = action.payload;
    },
    resetToDefaults: (state) => {
      state.temperature = 0.7;
      state.maxTokens = 300;
      state.systemPrompt = 'You are a helpful assistant.';
    }
  },
});

export const { setTemperature, setMaxTokens, setSystemPrompt, resetToDefaults } = aiParamsSlice.actions;
export default aiParamsSlice.reducer;
