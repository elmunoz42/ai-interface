import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface UIState {
  leftSidebarOpen: boolean;
  rightSidebarOpen: boolean;
  theme: 'light' | 'dark';
  selectedPromptRecipe: string | null;
}

const initialState: UIState = {
  leftSidebarOpen: true,
  rightSidebarOpen: true,
  theme: 'light',
  selectedPromptRecipe: null,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleLeftSidebar: (state) => {
      state.leftSidebarOpen = !state.leftSidebarOpen;
    },
    toggleRightSidebar: (state) => {
      state.rightSidebarOpen = !state.rightSidebarOpen;
    },
    setLeftSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.leftSidebarOpen = action.payload;
    },
    setRightSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.rightSidebarOpen = action.payload;
    },
    setTheme: (state, action: PayloadAction<'light' | 'dark'>) => {
      state.theme = action.payload;
    },
    setSelectedPromptRecipe: (state, action: PayloadAction<string | null>) => {
      state.selectedPromptRecipe = action.payload;
    }
  },
});

export const { 
  toggleLeftSidebar, 
  toggleRightSidebar, 
  setLeftSidebarOpen, 
  setRightSidebarOpen, 
  setTheme, 
  setSelectedPromptRecipe 
} = uiSlice.actions;
export default uiSlice.reducer;
