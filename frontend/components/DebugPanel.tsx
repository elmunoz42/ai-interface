'use client';

import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Button,
  Chip,
  Divider
} from '@mui/material';
import { useAppSelector, useAppDispatch } from '../lib/store/hooks';
import { 
  setInputText, 
  addUserMessage, 
  clearMessages, 
  clearError 
} from '../lib/store/chatSlice';
import { 
  setTemperature, 
  setMaxTokens, 
  resetToDefaults 
} from '../lib/store/aiParamsSlice';
import { 
  toggleLeftSidebar, 
  toggleRightSidebar 
} from '../lib/store/uiSlice';

const DebugPanel = () => {
  const dispatch = useAppDispatch();
  const [expanded, setExpanded] = useState(false);
  
  // Get all state from Redux store
  const chatState = useAppSelector(state => state.chat);
  const aiParams = useAppSelector(state => state.aiParams);
  const uiState = useAppSelector(state => state.ui);

  return (
    <Box sx={{ 
      position: 'fixed', 
      bottom: 20, 
      right: 20, 
      width: 350, 
      zIndex: 1000,
      maxHeight: '70vh',
      overflow: 'auto'
    }}>
      <Paper sx={{ backgroundColor: '#f5f5f5', border: '2px solid #2196f3', p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <Typography variant="h6">🐛 Redux Debug</Typography>
          <Button
            onClick={() => setExpanded(!expanded)}
            size="small"
            variant="outlined"
          >
            {expanded ? 'Hide' : 'Show'}
          </Button>
          <Chip 
            label={`${chatState.messages.length} msgs`} 
            size="small" 
            color="primary" 
          />
          {chatState.loading && (
            <Chip label="Loading..." size="small" color="warning" />
          )}
          {chatState.error && (
            <Chip label="Error" size="small" color="error" />
          )}
        </Box>

        {expanded && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            
            {/* Quick Test Buttons */}
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                🧪 Quick Tests:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                <Button
                  onClick={() => dispatch(setInputText('Test from Redux!'))}
                  variant="outlined"
                  size="small"
                  color="primary"
                >
                  Set Input
                </Button>
                <Button
                  onClick={() => dispatch(addUserMessage('Test message'))}
                  variant="outlined"
                  size="small"
                  color="secondary"
                >
                  Add Message
                </Button>
                <Button
                  onClick={() => dispatch(setTemperature(0.9))}
                  variant="outlined"
                  size="small"
                  color="warning"
                >
                  High Temp
                </Button>
                <Button
                  onClick={() => dispatch(clearMessages())}
                  variant="outlined"
                  size="small"
                  color="error"
                >
                  Clear
                </Button>
              </Box>
            </Box>

            <Divider />

            {/* State Summary */}
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                � Current State:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                <Chip label={`Messages: ${chatState.messages.length}`} size="small" />
                <Chip label={`Temp: ${aiParams.temperature}`} size="small" />
                <Chip label={`Tokens: ${aiParams.maxTokens}`} size="small" />
                <Chip 
                  label={`Input: ${chatState.inputText.length} chars`} 
                  size="small" 
                  color={chatState.inputText.length > 0 ? 'primary' : 'default'}
                />
              </Box>
            </Box>

            {/* Detailed State Views */}
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                🔍 Chat Messages:
              </Typography>
              <Paper sx={{ p: 1, maxHeight: 100, overflow: 'auto', backgroundColor: '#fafafa' }}>
                {chatState.messages.length === 0 ? (
                  <Typography variant="caption">No messages</Typography>
                ) : (
                  chatState.messages.map((msg, index) => (
                    <Typography key={index} variant="caption" display="block">
                      {msg.role}: {msg.text.substring(0, 40)}...
                    </Typography>
                  ))
                )}
              </Paper>
            </Box>

            {/* Redux DevTools Instructions */}
            <Box sx={{ p: 1, backgroundColor: '#e3f2fd', borderRadius: 1 }}>
              <Typography variant="caption" display="block">
                💡 <strong>Redux DevTools:</strong>
              </Typography>
              <Typography variant="caption" display="block">
                1. Open DevTools (F12) → Redux tab
              </Typography>
              <Typography variant="caption" display="block">
                2. Click test buttons to see actions
              </Typography>
              <Typography variant="caption" display="block">
                3. Monitor state changes in real-time
              </Typography>
            </Box>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default DebugPanel;
