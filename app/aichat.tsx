'use client';

import React, { useEffect } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  TextField,
  Button,
  CircularProgress,
  Snackbar,
  Box,
  Slider,
  Divider,
  // Grid,
  // Chip,
} from '@mui/material';
import { useAppDispatch, useAppSelector } from '../lib/store/hooks';
import { 
  setInputText, 
  addUserMessage, 
  clearMessages, 
  clearError, 
  sendMessage 
} from '../lib/store/chatSlice';
import { 
  setTemperature, 
  setMaxTokens 
} from '../lib/store/aiParamsSlice';
import { 
  setSelectedPromptRecipe 
} from '../lib/store/uiSlice';

const ChatApp = () => {
  const dispatch = useAppDispatch();
  
  // Get state from Redux store
  const { messages, loading, error, inputText } = useAppSelector(state => state.chat);
  const { temperature, maxTokens } = useAppSelector(state => state.aiParams);
  const { selectedPromptRecipe } = useAppSelector(state => state.ui);

  // Redux state monitoring for development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔄 Redux State Update:', {
        chat: {
          messagesCount: messages.length,
          loading,
          error,
          inputTextLength: inputText.length,
          inputPreview: inputText.substring(0, 30) + (inputText.length > 30 ? '...' : '')
        },
        aiParams: { temperature, maxTokens },
        ui: { selectedPromptRecipe }
      });
    }
  }, [messages, loading, error, inputText, temperature, maxTokens, selectedPromptRecipe]);

  // State validation
  useEffect(() => {
    const validations = [
      { check: temperature >= 0 && temperature <= 1, message: 'Temperature out of range' },
      { check: maxTokens >= 50 && maxTokens <= 4000, message: 'MaxTokens out of range' },
      { check: Array.isArray(messages), message: 'Messages should be array' },
      { check: typeof inputText === 'string', message: 'InputText should be string' },
    ];

    validations.forEach(({ check, message }) => {
      if (!check) {
        console.error('❌ State Validation Failed:', message);
      }
    });
  }, [temperature, maxTokens, messages, inputText]);

  // Prompt recipes for quick access
  const promptRecipes = [
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

  const handlePromptRecipe = (recipe: { label: string; prompt: string }) => {
    dispatch(setInputText(recipe.prompt));
    dispatch(setSelectedPromptRecipe(recipe.label));
  };

  const handleClearChat = () => {
    dispatch(clearMessages());
  };

  const handleSendMessage = async () => {
    if (!inputText.trim()) return; // Don't send empty messages

    // Add user message to Redux store
    dispatch(addUserMessage(inputText));
    
    // Send message to AI
    const allMessages = [...messages, { text: inputText, role: 'user', timestamp: Date.now() }];
    dispatch(sendMessage({ 
      messages: allMessages, 
      temperature, 
      maxTokens 
    }));
  };

  const handleTemperatureChange = (value: number) => {
    dispatch(setTemperature(value));
  };

  const handleMaxTokensChange = (value: number) => {
    dispatch(setMaxTokens(value));
  };

  const handleInputChange = (value: string) => {
    dispatch(setInputText(value));
  };

  const handleErrorClose = () => {
    dispatch(clearError());
  };

  return (
    <Box sx={{ height: '100vh', width: '100vw', display: 'flex', flexDirection: 'column', margin: 0, padding: 0 }}>
      <AppBar position="static" sx={{ flexShrink: 0, backgroundColor: '#2c2c2c' }}>
        <Toolbar>
          <Typography variant="h6">Llama Chat</Typography>
        </Toolbar>
      </AppBar>
      
      <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>
        {/* Left Sidebar - AI Parameters */}
        <Box 
          sx={{ 
            width: 280, 
            minWidth: 280,
            borderRight: 1, 
            borderColor: 'divider',
            pt: 2,
            pb: 2,
            pl: 2,
            pr: 2,
            backgroundColor: '#f8f9fa',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <Typography variant="h6" sx={{ mb: 1.5, mt: 0 }}>
            AI Parameters
          </Typography>
          
          {/* Temperature Control */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Temperature: {temperature}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
              Controls randomness (0.0 = focused, 1.0 = creative)
            </Typography>
            <Slider
              value={temperature}
              onChange={(_, value) => handleTemperatureChange(value as number)}
              min={0}
              max={1}
              step={0.1}
              size="small"
              sx={{ mb: 1 }}
            />
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="caption">Focused</Typography>
              <Typography variant="caption">Creative</Typography>
            </Box>
          </Box>

          {/* Max Tokens Control */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Max Tokens
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
              Maximum length of the AI response
            </Typography>
            <TextField
              type="number"
              value={maxTokens}
              onChange={(e) => handleMaxTokensChange(parseInt(e.target.value) || 1000)}
              size="small"
              fullWidth
              inputProps={{ min: 50, max: 4000, step: 50 }}
              sx={{ mb: 1 }}
            />
            <Slider
              value={maxTokens}
              onChange={(_, value) => handleMaxTokensChange(value as number)}
              min={50}
              max={4000}
              step={50}
              size="small"
            />
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="caption">50</Typography>
              <Typography variant="caption">4000</Typography>
            </Box>
          </Box>

          {/* Model Info Section */}
          <Box sx={{ mt: 'auto', pt: 2, borderTop: 1, borderColor: 'divider' }}>
            <Typography variant="subtitle2" gutterBottom>
              Model Information
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Using: Llama 3 8B Instruct
            </Typography>
            <br />
            <Typography variant="caption" color="text.secondary">
              Provider: Cloudflare Workers AI
            </Typography>
          </Box>
        </Box>

        {/* Main Chat Area */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', py: 2.5, px: 2, minWidth: 0 }}>
          {/* Messages Area */}
          <Paper 
            elevation={1} 
            sx={{ 
              flex: 1, 
              overflowY: 'auto', 
              mb: 2.5,
              minHeight: 0, // Important for flex scrolling
              width: '100%',
              // p: 1.5
            }}
          >
            <List>
              {messages.map((msg, index) => (
                <ListItem key={index} alignItems="flex-start">
                  <ListItemText
                    primary={msg.text}
                    secondary={msg.role === 'user' ? 'You' : msg.role === 'system' ? 'System' : 'AI Assistant'}
                    sx={{
                      '& .MuiListItemText-primary': {
                        backgroundColor: msg.role === 'user' ? '#e3f2fd' : '#f5f5f5',
                        padding: 1,
                        borderRadius: 1,
                        marginBottom: 0.5
                      }
                    }}
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
          
          {/* Input Area */}
          <Box sx={{ flexShrink: 0 }}>
            <TextField
              label="Type your message"
              variant="outlined"
              multiline
              rows={2}
              fullWidth
              value={inputText}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              sx={{ mb: 1.5 }}
            />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleSendMessage}
                disabled={loading || !inputText.trim()}
              >
                Send
              </Button>
              {loading && <CircularProgress size={24} />}
            </Box>
          </Box>
        </Box>
        
        {/* Right Sidebar - Prompt Recipes */}
        <Box 
          sx={{ 
            width: 320, 
            minWidth: 320,
            borderLeft: 1, 
            borderColor: 'divider',
            pt: 2, // top padding
            pb: 2, // bottom padding
            pr: 2, // right padding restored
            pl: 2, // left padding to avoid double spacing
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
      </Box>
      
      {error && (
        <Snackbar 
          open={!!error} 
          autoHideDuration={3000} 
          message={error} 
          onClose={handleErrorClose}
        />
      )}
    </Box>
  );
};

export default ChatApp;