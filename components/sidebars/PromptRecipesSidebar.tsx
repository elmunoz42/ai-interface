'use client';

import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { useAppDispatch } from '../../lib/store/hooks';
import { setInputText, clearMessages } from '../../lib/store/chatSlice';
import { setSelectedPromptRecipe } from '../../lib/store/uiSlice';

interface PromptRecipe {
  label: string;
  prompt: string;
}

const PromptRecipesSidebar = () => {
  const dispatch = useAppDispatch();

  const promptRecipes: PromptRecipe[] = [
    {
      label: "Fix Grammar",
      prompt: "Fix the grammar and spelling in the following text: "
    },
    {
      label: "Code Review",
      prompt: "Please review this code and suggest improvements: "
    },
    {
      label: "Brainstorm Ideas",
      prompt: "Help me brainstorm creative ideas for: "
    },
    {
      label: "Summarize",
      prompt: "Please provide a concise summary of: "
    },
    {
      label: "Debug Help",
      prompt: "I'm having trouble with this issue, can you help me debug: "
    }
  ];

  const handlePromptRecipe = (recipe: PromptRecipe) => {
    dispatch(setInputText(recipe.prompt));
    dispatch(setSelectedPromptRecipe(recipe.label));
  };

  const handleClearChat = () => {
    dispatch(clearMessages());
  };

  return (
    <Box 
      sx={{ 
        width: 320, 
        minWidth: 320,
        borderLeft: 1, 
        borderColor: 'divider',
        pt: 2,
        pb: 2,
        pr: 2,
        pl: 2,
        backgroundColor: '#fafafa',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <Typography variant="h6" sx={{ mb: 1.5, mt: 0 }}>
        Prompt Recipes
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
        Click a prompt to populate the text field, then add your specific details.
      </Typography>
      
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75, flex: 1, overflowY: 'auto' }}>
        {promptRecipes.map((recipe, index) => (
          <Button
            key={index}
            variant="outlined"
            size="small"
            onClick={() => handlePromptRecipe(recipe)}
            sx={{ 
              justifyContent: 'flex-start',
              textAlign: 'left',
              textTransform: 'none',
              py: 1.5,
              px: 2
            }}
          >
            <Box>
              <Typography variant="subtitle2" component="div">
                {recipe.label}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {recipe.prompt.length > 40 
                  ? `${recipe.prompt.substring(0, 40)}...` 
                  : recipe.prompt
                }
              </Typography>
            </Box>
          </Button>
        ))}
      </Box>
      
      {/* Clear Chat Button */}
      <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
        <Button
          variant="contained"
          color="secondary"
          size="small"
          onClick={handleClearChat}
          fullWidth
          sx={{ 
            textTransform: 'none',
            py: 1
          }}
        >
          Clear Chat
        </Button>
      </Box>
    </Box>
  );
};

export default PromptRecipesSidebar;
