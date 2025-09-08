'use client';

import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  IconButton, 
  TextField, 
  Card, 
  CardContent,
  Tooltip,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { 
  Edit as EditIcon, 
  Check as CheckIcon, 
  Close as CloseIcon,
  Delete as DeleteIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../../lib/store/hooks';
import { setInputText, clearMessages } from '../../lib/store/chatSlice';
import { setSelectedPromptRecipe } from '../../lib/store/uiSlice';
import {
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
  PromptRecipe
} from '../../lib/store/promptRecipesSlice';
import { setSelectedModel, setTemperature, setMaxTokens } from '../../lib/store/aiParamsSlice';

const PromptRecipesSidebar = () => {
  // Restore missing handler functions
  const handleStartEdit = (recipe: PromptRecipe) => {
    setEditingRecipe({ ...recipe });
    setEditDialogOpen(true);
  };

  const handleStopEdit = () => {
    setEditDialogOpen(false);
    setEditingRecipe(null);
  };

  const handleClearChat = () => {
    dispatch(clearMessages());
  };
  const dispatch = useAppDispatch();
  const { recipes, editingRecipeId } = useAppSelector(state => state.promptRecipes);
  const aiParams = useAppSelector(state => state.aiParams);
  const [newRecipe, setNewRecipe] = useState({
    title: '',
    description: '',
    prompt: ''
  });
  const [showAddForm, setShowAddForm] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<PromptRecipe | null>(null);

  const handlePromptRecipe = (recipe: PromptRecipe) => {
    dispatch(setInputText(recipe.prompt));
    dispatch(setSelectedPromptRecipe(recipe.title));
    // Apply LLM settings from recipe if present
    if (recipe.modelId) {
      const model = aiParams.availableModels.find(m => m.id === recipe.modelId);
      if (model) {
        dispatch(setSelectedModel(model));
        setTimeout(() => {
          const state = window.__REDUX_DEVTOOLS_EXTENSION__?.getState?.() || {};
          // Fallback: log from aiParams
          console.log('Selected model after recipe:', model);
        }, 100);
      }
    }
    if (typeof recipe.temperature === 'number') {
      dispatch(setTemperature(recipe.temperature));
    }
    if (typeof recipe.maxTokens === 'number') {
      dispatch(setMaxTokens(recipe.maxTokens));
    }
  };

  // Save current LLM settings to the recipe being edited
  const handleSaveCurrentLLMSettings = () => {
    if (editingRecipe) {
      setEditingRecipe(prev => prev ? {
        ...prev,
        modelId: aiParams.selectedModel.id,
        temperature: aiParams.temperature,
        maxTokens: aiParams.maxTokens
      } : null);
    }
  };

  const handleSaveEdit = () => {
    if (editingRecipe) {
      dispatch(updateRecipeTitle({ id: editingRecipe.id, title: editingRecipe.title }));
      dispatch(updateRecipeDescription({ id: editingRecipe.id, description: editingRecipe.description }));
      dispatch(updateRecipePrompt({ id: editingRecipe.id, prompt: editingRecipe.prompt }));
      dispatch(updateRecipeModel({ id: editingRecipe.id, modelId: editingRecipe.modelId || aiParams.selectedModel.id }));
      dispatch(updateRecipeTemperature({ id: editingRecipe.id, temperature: editingRecipe.temperature ?? aiParams.temperature }));
      dispatch(updateRecipeMaxTokens({ id: editingRecipe.id, maxTokens: editingRecipe.maxTokens ?? aiParams.maxTokens }));
    }
    setEditDialogOpen(false);
    setEditingRecipe(null);
  }; 

  const handleDeleteRecipe = (id: string) => {
    dispatch(deleteRecipe(id));
  };

  const handleAddNewRecipe = () => {
    if (newRecipe.title.trim() && newRecipe.prompt.trim()) {
      dispatch(addNewRecipe({
        title: newRecipe.title.trim(),
        description: newRecipe.description.trim(),
        prompt: newRecipe.prompt.trim()
      }));
      setNewRecipe({ title: '', description: '', prompt: '' });
      setShowAddForm(false);
    }
  };

  const renderRecipeCard = (recipe: PromptRecipe) => {
    return (
      <Card 
        key={recipe.id}
        variant="outlined" 
        sx={{ 
          mb: 1,
          cursor: 'pointer',
          '&:hover': {
            boxShadow: 2,
            backgroundColor: '#f5f5f5'
          }
        }}
        onClick={() => handlePromptRecipe(recipe)}
      >
        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
          {/* Header Section */}
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'flex-start', 
            mb: 1 
          }}>
            <Typography variant="subtitle2" component="div" sx={{ flexGrow: 1, fontWeight: 600 }}>
              {recipe.title}
            </Typography>
            
            {/* Action Buttons */}
            <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0 }}>
              <Tooltip title="Edit recipe">
                <IconButton 
                  size="small" 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStartEdit(recipe);
                  }}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Delete recipe">
                <IconButton 
                  size="small" 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteRecipe(recipe.id);
                  }}
                  color="error"
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        </CardContent>
      </Card>
    );
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
        <Typography variant="h6" sx={{ mt: 0 }}>
          Prompt Recipes
        </Typography>
        <Tooltip title="Add new recipe">
          <IconButton 
            size="small" 
            onClick={() => setShowAddForm(!showAddForm)}
            color="primary"
          >
            <AddIcon />
          </IconButton>
        </Tooltip>
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
        Click a prompt to populate the text field, then add your specific details. Use the edit button to customize recipes.
      </Typography>

      {/* Add New Recipe Form */}
      {showAddForm && (
        <Card variant="outlined" sx={{ mb: 2, backgroundColor: '#e3f2fd' }}>
          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
              Add New Recipe
            </Typography>
            <TextField
              size="small"
              placeholder="Recipe title"
              value={newRecipe.title}
              onChange={(e) => setNewRecipe({ ...newRecipe, title: e.target.value })}
              fullWidth
              sx={{ mb: 1 }}
            />
            <TextField
              size="small"
              placeholder="Description (optional)"
              value={newRecipe.description}
              onChange={(e) => setNewRecipe({ ...newRecipe, description: e.target.value })}
              fullWidth
              multiline
              rows={2}
              sx={{ mb: 1 }}
            />
            <TextField
              size="small"
              placeholder="Prompt text"
              value={newRecipe.prompt}
              onChange={(e) => setNewRecipe({ ...newRecipe, prompt: e.target.value })}
              fullWidth
              multiline
              rows={2}
              sx={{ mb: 1 }}
            />
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
              <Button 
                size="small" 
                onClick={() => {
                  setShowAddForm(false);
                  setNewRecipe({ title: '', description: '', prompt: '' });
                }}
              >
                Cancel
              </Button>
              <Button 
                size="small" 
                variant="contained" 
                onClick={handleAddNewRecipe}
                disabled={!newRecipe.title.trim() || !newRecipe.prompt.trim()}
              >
                Add Recipe
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}
      
      <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, overflowY: 'auto' }}>
        {recipes.map(renderRecipeCard)}
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

      {/* Edit Recipe Dialog */}
      <Dialog 
        open={editDialogOpen} 
        onClose={handleStopEdit}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { minHeight: '60vh' }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Typography variant="h6" component="div">
            Edit Recipe
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Customize your prompt recipe title, description, and template
          </Typography>
        </DialogTitle>
        
        <DialogContent sx={{ pb: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
            {/* Title Field */}
            <Box>
              <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
                Recipe Title *
              </Typography>
              <TextField
                value={editingRecipe?.title || ''}
                onChange={(e) => setEditingRecipe(prev => prev ? { ...prev, title: e.target.value } : null)}
                placeholder="Enter a descriptive title for your recipe"
                fullWidth
                autoFocus
                variant="outlined"
              />
            </Box>

            {/* Description Field */}
            <Box>
              <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
                Description
              </Typography>
              <TextField
                value={editingRecipe?.description || ''}
                onChange={(e) => setEditingRecipe(prev => prev ? { ...prev, description: e.target.value } : null)}
                placeholder="Brief description of what this recipe does and when to use it"
                fullWidth
                multiline
                rows={3}
                variant="outlined"
              />
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                Optional: Help others understand the purpose of this prompt recipe
              </Typography>
            </Box>

            {/* Prompt Template Field */}
            <Box>
              <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
                Prompt Template *
              </Typography>
              <TextField
                value={editingRecipe?.prompt || ''}
                onChange={(e) => setEditingRecipe(prev => prev ? { ...prev, prompt: e.target.value } : null)}
                placeholder="Enter your prompt template here..."
                fullWidth
                multiline
                rows={6}
                variant="outlined"
              />
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                Tip: End your prompt with a colon or space so users can easily add their specific content
              </Typography>
            </Box>

            {/* LLM Settings Section */}
            <Box sx={{ backgroundColor: '#f8f9fa', p: 2, borderRadius: 1, border: '1px solid #e0e0e0', mb: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                Saved LLM Settings
              </Typography>
              <Typography variant="body2" sx={{ mb: 0.5 }}>
                <strong>Model:</strong> {editingRecipe?.modelId || 'Not set'}
              </Typography>
              <Typography variant="body2" sx={{ mb: 0.5 }}>
                <strong>Temperature:</strong> {editingRecipe?.temperature ?? 'Not set'}
              </Typography>
              <Typography variant="body2" sx={{ mb: 0.5 }}>
                <strong>Max Tokens:</strong> {editingRecipe?.maxTokens ?? 'Not set'}
              </Typography>
              <Button variant="outlined" size="small" sx={{ mt: 1 }} onClick={handleSaveCurrentLLMSettings}>
                Save Current LLM Settings
              </Button>
            </Box>
            {/* Preview Section */}
            <Box sx={{ backgroundColor: '#f8f9fa', p: 2, borderRadius: 1, border: '1px solid #e0e0e0' }}>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                Preview
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                {editingRecipe?.title || 'Recipe Title'}
              </Typography>
              {editingRecipe?.description && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontSize: '0.875rem' }}>
                  {editingRecipe.description}
                </Typography>
              )}
              <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic', display: 'block' }}>
                &quot;{editingRecipe?.prompt || 'Your prompt template will appear here...'}&quot;
              </Typography>
            </Box>
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={handleStopEdit}>
            Cancel
          </Button>
          <Button 
            onClick={handleSaveEdit} 
            variant="contained"
            disabled={!editingRecipe?.title?.trim() || !editingRecipe?.prompt?.trim()}
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PromptRecipesSidebar;
