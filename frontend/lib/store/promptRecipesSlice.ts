import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface PromptRecipe {
  id: string;
  title: string;
  description: string;
  prompt: string;
  modelId?: string;
  temperature?: number;
  maxTokens?: number;
  isEditing?: boolean;
}

export interface PromptRecipesState {
  recipes: PromptRecipe[];
  editingRecipeId: string | null;
}

const initialState: PromptRecipesState = {
  recipes: [
    {
      id: 'fix-grammar',
      title: 'Fix Grammar',
      description: 'Correct grammar and spelling errors in text',
      prompt: 'Fix the grammar and spelling in the following text: ',
      modelId: 'llama-3-8b-instruct',
      temperature: 0.2,
      maxTokens: 300,
      isEditing: false
    },
    {
      id: 'social-media-post',
      title: 'Social Media Post',
      description: 'Generate a social media post from the following content',
      prompt: 'Create a social media post based on the following content: ',
      modelId: 'gpt-4',
      temperature: 0.7,
      maxTokens: 400,
      isEditing: false
    },
    {
      id: 'brainstorm-ideas',
      title: 'Brainstorm Ideas',
      description: 'Generate creative ideas and solutions',
      prompt: 'Help me brainstorm creative ideas for: ',
      modelId: 'gpt-4',
      temperature: 1.0,
      maxTokens: 500,
      isEditing: false
    },
    {
      id: 'summarize',
      title: 'Summarize',
      description: 'Create concise summaries of content',
      prompt: 'Please provide a concise summary of: ',
      modelId: 'gpt-3.5-turbo',
      temperature: 0.3,
      maxTokens: 200,
      isEditing: false
    },
    {
      id: 'info-search',
      title: 'Information Search',
      description: 'Get assistance with finding information',
      prompt: 'I\'m looking for information in our knowledge base on the following topic: ',
      modelId: 'rag-faiss',
      temperature: 0.4,
      maxTokens: 300,
      isEditing: false
    }
  ],
  editingRecipeId: null
};

const promptRecipesSlice = createSlice({
  name: 'promptRecipes',
  initialState,
  reducers: {
    updateRecipeModel: (state, action: PayloadAction<{ id: string; modelId: string }>) => {
      const recipe = state.recipes.find(r => r.id === action.payload.id);
      if (recipe) {
        recipe.modelId = action.payload.modelId;
      }
    },
    updateRecipeTemperature: (state, action: PayloadAction<{ id: string; temperature: number }>) => {
      const recipe = state.recipes.find(r => r.id === action.payload.id);
      if (recipe) {
        recipe.temperature = action.payload.temperature;
      }
    },
    updateRecipeMaxTokens: (state, action: PayloadAction<{ id: string; maxTokens: number }>) => {
      const recipe = state.recipes.find(r => r.id === action.payload.id);
      if (recipe) {
        recipe.maxTokens = action.payload.maxTokens;
      }
    },
    updateRecipeTitle: (state, action: PayloadAction<{ id: string; title: string }>) => {
      const recipe = state.recipes.find(r => r.id === action.payload.id);
      if (recipe) {
        recipe.title = action.payload.title;
      }
    },
    updateRecipeDescription: (state, action: PayloadAction<{ id: string; description: string }>) => {
      const recipe = state.recipes.find(r => r.id === action.payload.id);
      if (recipe) {
        recipe.description = action.payload.description;
      }
    },
    updateRecipePrompt: (state, action: PayloadAction<{ id: string; prompt: string }>) => {
      const recipe = state.recipes.find(r => r.id === action.payload.id);
      if (recipe) {
        recipe.prompt = action.payload.prompt;
      }
    },
    startEditingRecipe: (state, action: PayloadAction<string>) => {
      // Stop editing any other recipe
      state.editingRecipeId = action.payload;
      state.recipes.forEach(recipe => {
        recipe.isEditing = recipe.id === action.payload;
      });
    },
    stopEditingRecipe: (state) => {
      state.editingRecipeId = null;
      state.recipes.forEach(recipe => {
        recipe.isEditing = false;
      });
    },
    addNewRecipe: (state, action: PayloadAction<Omit<PromptRecipe, 'id' | 'isEditing'>>) => {
      const newRecipe: PromptRecipe = {
        ...action.payload,
        id: `custom-${Date.now()}`,
        isEditing: false,
        modelId: action.payload.modelId || 'gpt-3.5-turbo',
        temperature: action.payload.temperature ?? 0.7,
        maxTokens: action.payload.maxTokens ?? 300
      };
      state.recipes.push(newRecipe);
    },
    deleteRecipe: (state, action: PayloadAction<string>) => {
      state.recipes = state.recipes.filter(recipe => recipe.id !== action.payload);
      if (state.editingRecipeId === action.payload) {
        state.editingRecipeId = null;
      }
    },
    resetToDefaults: (state) => {
      state.recipes = initialState.recipes;
      state.editingRecipeId = null;
    }
  },
});

export const {
  updateRecipeTitle,
  updateRecipeDescription,
  updateRecipePrompt,
  updateRecipeModel,
  updateRecipeTemperature,
  updateRecipeMaxTokens,
  startEditingRecipe,
  stopEditingRecipe,
  addNewRecipe,
  deleteRecipe,
  resetToDefaults
} = promptRecipesSlice.actions;

export default promptRecipesSlice.reducer;
