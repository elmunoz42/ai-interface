import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface PromptRecipe {
  id: string;
  title: string;
  description: string;
  prompt: string;
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
      isEditing: false
    },
    {
      id: 'code-review',
      title: 'Code Review',
      description: 'Get suggestions for code improvements',
      prompt: 'Please review this code and suggest improvements: ',
      isEditing: false
    },
    {
      id: 'brainstorm-ideas',
      title: 'Brainstorm Ideas',
      description: 'Generate creative ideas and solutions',
      prompt: 'Help me brainstorm creative ideas for: ',
      isEditing: false
    },
    {
      id: 'summarize',
      title: 'Summarize',
      description: 'Create concise summaries of content',
      prompt: 'Please provide a concise summary of: ',
      isEditing: false
    },
    {
      id: 'debug-help',
      title: 'Debug Help',
      description: 'Get assistance with troubleshooting issues',
      prompt: 'I\'m having trouble with this issue, can you help me debug: ',
      isEditing: false
    }
  ],
  editingRecipeId: null
};

const promptRecipesSlice = createSlice({
  name: 'promptRecipes',
  initialState,
  reducers: {
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
        isEditing: false
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
  startEditingRecipe,
  stopEditingRecipe,
  addNewRecipe,
  deleteRecipe,
  resetToDefaults
} = promptRecipesSlice.actions;

export default promptRecipesSlice.reducer;
