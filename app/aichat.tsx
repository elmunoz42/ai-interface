import React, { useState } from 'react';
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
  // Grid,
  // Chip,
} from '@mui/material';
import { apolloClient, CREATE_CHAT_COMPLETION } from '../lib/apollo-client';

interface Message {
    text: string;
    role: string;
  }

const ChatApp = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
    setInputText(recipe.prompt);
  };

  const handleClearChat = () => {
    setMessages([]);
    setInputText('');
    setError('');
  };

  const handleSendMessage = async () => {
    if (!inputText.trim()) return; // Don't send empty messages

    try {
      setLoading(true);
      setError('');
  
      // Add user message to the conversation
      const userMessage: Message = { text: inputText, role: 'user' };
      const updatedMessages = [...messages, userMessage];
      setMessages(updatedMessages);
      
      // Clear input field immediately
      setInputText('');

      // Try GraphQL first, fallback to REST API if it fails
      try {
        // Prepare the input for the GraphQL mutation
        const input = {
          messages: updatedMessages.map(msg => ({
            role: msg.role === 'ai' ? 'assistant' : msg.role,
            content: msg.text
          })),
          max_tokens: 1000,
          temperature: 0.7,
          system_prompt: "You are a helpful assistant."
        };
    
        // Make the GraphQL mutation
        const result = await apolloClient.mutate({
          mutation: CREATE_CHAT_COMPLETION,
          variables: { input },
        });
        
        const data = result.data as any; // Type assertion for GraphQL response
        console.log('GraphQL response data:', data);
    
        // Extract the assistant's response from the GraphQL response
        const assistantMessage: Message = {
          text: data.createChatCompletion.choices[0].message.content,
          role: 'ai',
        };
        
        // Add the assistant's response to the conversation
        setMessages(prev => [...prev, assistantMessage]);
        
      } catch (graphqlError) {
        console.warn('GraphQL failed, falling back to REST API:', graphqlError);
        
        // Fallback to REST API
        const requestBody = {
          messages: updatedMessages.map(msg => ({
            role: msg.role === 'ai' ? 'assistant' : msg.role,
            content: msg.text
          })),
          max_tokens: 1000,
          temperature: 0.7,
          system_prompt: "You are a helpful assistant."
        };
    
        const response = await fetch('/api/proxy', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        });
        
        if (!response.ok) {
          throw new Error('Both GraphQL and REST API failed');
        }
    
        const data = await response.json();
        console.log('REST API response data:', data);
    
        // Extract the assistant's response from the REST API response
        const assistantMessage: Message = {
          text: data.choices[0].message.content,
          role: 'ai',
        };
        
        // Add the assistant's response to the conversation
        setMessages(prev => [...prev, assistantMessage]);
      }
      
    } catch (error) {
      setError('Error fetching data');
      console.error('Complete Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ height: '100vh', width: '100vw', display: 'flex', flexDirection: 'column', margin: 0, padding: 0 }}>
      <AppBar position="static" sx={{ flexShrink: 0 }}>
        <Toolbar>
          <Typography variant="h6">Llama Chat</Typography>
        </Toolbar>
      </AppBar>
      
      <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0, pl: 2.5, pr: 0 }}>
        {/* Main Chat Area */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', py: 2.5, pr: 2, minWidth: 0 }}>
          {/* Messages Area */}
          <Paper 
            elevation={3} 
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
              onChange={(e) => setInputText(e.target.value)}
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
        
        {/* Sidebar */}
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
        <Snackbar open autoHideDuration={3000} message={error} />
      )}
    </Box>
  );
};

export default ChatApp;