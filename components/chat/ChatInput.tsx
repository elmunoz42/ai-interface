'use client';

import React from 'react';
import { Box, TextField, Button, CircularProgress } from '@mui/material';
import { useAppDispatch, useAppSelector } from '../../lib/store/hooks';
import { setInputText, addUserMessage, sendMessage } from '../../lib/store/chatSlice';

const ChatInput = () => {
  const dispatch = useAppDispatch();
  const { messages, loading, inputText } = useAppSelector(state => state.chat);
  const { temperature, maxTokens, systemPrompt, selectedModel } = useAppSelector(state => state.aiParams);

  const handleInputChange = (value: string) => {
    dispatch(setInputText(value));
  };

  const handleSendMessage = async () => {
    if (!inputText.trim()) return; // Don't send empty messages

    console.log('🚀 Sending message:', inputText);
    console.log('📊 Current state:', { 
      messages: messages.length, 
      temperature, 
      maxTokens, 
      selectedModel: selectedModel.name 
    });

    // Add user message to Redux store
    dispatch(addUserMessage(inputText));
    
    // Send message to AI
    const allMessages = [...messages, { text: inputText, role: 'user', timestamp: Date.now() }];
    console.log('📤 Dispatching sendMessage with:', { 
      messagesCount: allMessages.length, 
      temperature, 
      maxTokens,
      systemPrompt,
      model: selectedModel.name
    });
    
    dispatch(sendMessage({ 
      messages: allMessages, 
      temperature, 
      maxTokens,
      systemPrompt,
      selectedModel
    }));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Box sx={{ flexShrink: 0 }}>
      <TextField
        label="Type your message"
        variant="outlined"
        multiline
        rows={2}
        fullWidth
        value={inputText}
        onChange={(e) => handleInputChange(e.target.value)}
        onKeyPress={handleKeyPress}
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
  );
};

export default ChatInput;
