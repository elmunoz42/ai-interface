'use client';

import React, { useEffect, useRef } from 'react';
import { Paper, List, ListItem, ListItemText, Box, Typography } from '@mui/material';
import { useAppSelector } from '../../lib/store/hooks';

const MessagesList = () => {
  const { messages } = useAppSelector(state => state.chat);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <Paper 
      elevation={1} 
      sx={{ 
        flex: 1, 
        overflowY: 'auto', 
        mb: 2.5,
        minHeight: 0, // Important for flex scrolling
        width: '100%',
      }}
    >
      <List>
        {messages.map((msg, index) => (
          <ListItem key={index} alignItems="flex-start">
            <ListItemText
              primary={
                <Box>
                  <Typography
                    variant="body1"
                    sx={{
                      backgroundColor: msg.role === 'user' ? '#e3f2fd' : '#f5f5f5',
                      padding: 1,
                      borderRadius: 1,
                      marginBottom: 0.5,
                      whiteSpace: 'pre-wrap', // Preserve line breaks
                      wordBreak: 'break-word'
                    }}
                  >
                    {msg.text}
                    {msg.streaming && (
                      <Box
                        component="span"
                        sx={{
                          display: 'inline-block',
                          width: '8px',
                          height: '12px',
                          backgroundColor: '#1976d2',
                          marginLeft: '2px',
                          animation: 'blink 1s infinite',
                          '@keyframes blink': {
                            '0%, 50%': { opacity: 1 },
                            '51%, 100%': { opacity: 0 }
                          }
                        }}
                      />
                    )}
                  </Typography>
                </Box>
              }
              secondary={msg.role === 'user' ? 'You' : msg.role === 'system' ? 'System' : 'AI Assistant'}
            />
          </ListItem>
        ))}
        <div ref={messagesEndRef} />
      </List>
    </Paper>
  );
};

export default MessagesList;
