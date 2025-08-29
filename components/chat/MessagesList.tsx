'use client';

import React from 'react';
import { Paper, List, ListItem, ListItemText } from '@mui/material';
import { useAppSelector } from '../../lib/store/hooks';

const MessagesList = () => {
  const { messages } = useAppSelector(state => state.chat);

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
  );
};

export default MessagesList;
