'use client';

import React from 'react';
import { Box, TextField, Button, CircularProgress, Switch, FormControlLabel } from '@mui/material';
import { useAppDispatch, useAppSelector } from '../../lib/store/hooks';
import { setInputText, addUserMessage, sendMessage, sendStreamingMessage } from '../../lib/store/chatSlice';
import { setStreamingEnabled } from '../../lib/store/uiSlice';

const ChatInput = () => {
  const dispatch = useAppDispatch();
  const { messages, loading, inputText, streamingMessageId } = useAppSelector(state => state.chat);
  const { 
    temperature, 
    maxTokens, 
    systemPrompt, 
    selectedModel,
    ragNumContextDocs,
    ragSimilarityThreshold
  } = useAppSelector(state => state.aiParams);
  const { streamingEnabled } = useAppSelector(state => state.ui);

  const handleInputChange = (value: string) => {
    dispatch(setInputText(value));
  };

  const handleSendMessage = async () => {
    if (!inputText.trim()) return; // Don't send empty messages

    console.log('🚀 Sending message:', inputText, streamingEnabled ? '(streaming)' : '(non-streaming)');
    console.log('📊 Current state:', { 
      messages: messages.length, 
      temperature, 
      maxTokens, 
      selectedModel: selectedModel.name,
      streamingEnabled
    });

    // Add user message to Redux store
    dispatch(addUserMessage(inputText));
    
    // Send message to AI
    const allMessages = [...messages, { text: inputText, role: 'user', timestamp: Date.now() }];
    
    const payload = { 
      messages: allMessages, 
      temperature, 
      maxTokens,
      systemPrompt,
      selectedModel,
      ragNumContextDocs,
      ragSimilarityThreshold
    };

    if (streamingEnabled) {
      console.log('🌊 Dispatching streaming message with payload:', payload);
      dispatch(sendStreamingMessage(payload));
    } else {
      console.log('📤 Dispatching regular message with payload:', payload);
      dispatch(sendMessage(payload));
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const isLoading = loading || streamingMessageId !== null;

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
        disabled={isLoading}
      />
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <Button
          variant="contained"
          color="primary"
          onClick={handleSendMessage}
          disabled={isLoading || !inputText.trim()}
        >
          Send
        </Button>
        {isLoading && <CircularProgress size={24} />}
        <FormControlLabel
          control={
            <Switch
              checked={streamingEnabled}
              onChange={(e) => dispatch(setStreamingEnabled(e.target.checked))}
              size="small"
            />
          }
          label="Streaming"
          sx={{ ml: 'auto' }}
        />
      </Box>
    </Box>
  );
};

export default ChatInput;
