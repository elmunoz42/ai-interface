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
  Divider
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
  startEditingRecipe,
  stopEditingRecipe,
  addNewRecipe,
  deleteRecipe,
  PromptRecipe
} from '../../lib/store/promptRecipesSlice';

const PromptRecipesSidebar = () => {
  const dispatch = useAppDispatch();
  const { recipes, editingRecipeId } = useAppSelector(state => state.promptRecipes);
  const [newRecipe, setNewRecipe] = useState({
    title: '',
    description: '',
    prompt: ''
  });
  const [showAddForm, setShowAddForm] = useState(false);

  const handlePromptRecipe = (recipe: PromptRecipe) => {
    dispatch(setInputText(recipe.prompt));
    dispatch(setSelectedPromptRecipe(recipe.title));
  };

  const handleClearChat = () => {
    dispatch(clearMessages());
  };

  const handleStartEdit = (recipeId: string) => {
    dispatch(startEditingRecipe(recipeId));
  };

  const handleStopEdit = () => {
    dispatch(stopEditingRecipe());
  };

  const handleUpdateTitle = (id: string, title: string) => {
    dispatch(updateRecipeTitle({ id, title }));
  };

  const handleUpdateDescription = (id: string, description: string) => {
    dispatch(updateRecipeDescription({ id, description }));
  };

  const handleUpdatePrompt = (id: string, prompt: string) => {
    dispatch(updateRecipePrompt({ id, prompt }));
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
    const isEditing = recipe.isEditing;

    return (
      <Card 
        key={recipe.id}
        variant="outlined" 
        sx={{ 
          mb: 1,
          cursor: isEditing ? 'default' : 'pointer',
          '&:hover': isEditing ? {} : {
            boxShadow: 2,
            backgroundColor: '#f5f5f5'
          }
        }}
        onClick={isEditing ? undefined : () => handlePromptRecipe(recipe)}
      >
        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
            {isEditing ? (
              <TextField
                size="small"
                value={recipe.title}
                onChange={(e) => handleUpdateTitle(recipe.id, e.target.value)}
                placeholder="Recipe title"
                sx={{ flexGrow: 1, mr: 1 }}
                autoFocus
              />
            ) : (
              <Typography variant="subtitle2" component="div" sx={{ flexGrow: 1, fontWeight: 600 }}>
                {recipe.title}
              </Typography>
            )}
            
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              {isEditing ? (
                <>
                  <Tooltip title="Save changes">
                    <IconButton size="small" onClick={handleStopEdit} color="primary">
                      <CheckIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </>
              ) : (
                <>
                  <Tooltip title="Edit recipe">
                    <IconButton 
                      size="small" 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStartEdit(recipe.id);
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
                </>
              )}
            </Box>
          </Box>

          {isEditing ? (
            <>
              <TextField
                size="small"
                value={recipe.description}
                onChange={(e) => handleUpdateDescription(recipe.id, e.target.value)}
                placeholder="Recipe description"
                fullWidth
                sx={{ mb: 1 }}
                multiline
                rows={2}
              />
              <TextField
                size="small"
                value={recipe.prompt}
                onChange={(e) => handleUpdatePrompt(recipe.id, e.target.value)}
                placeholder="Prompt text"
                fullWidth
                multiline
                rows={3}
              />
            </>
          ) : (
            <>
              {recipe.description && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontSize: '0.875rem' }}>
                  {recipe.description}
                </Typography>
              )}
              <Typography variant="caption" color="text.secondary" sx={{ 
                display: 'block',
                fontStyle: 'italic',
                backgroundColor: '#f8f9fa',
                p: 1,
                borderRadius: 1,
                border: '1px solid #e0e0e0'
              }}>
                {recipe.prompt.length > 60 
                  ? `${recipe.prompt.substring(0, 60)}...` 
                  : recipe.prompt
                }
              </Typography>
            </>
          )}
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
    </Box>
  );
};

export default PromptRecipesSidebar;
