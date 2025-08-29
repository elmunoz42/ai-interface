'use client';

import React from 'react';
import { Box } from '@mui/material';
import MessagesList from './MessagesList';
import ChatInput from './ChatInput';

const MainChatArea = () => {
  return (
    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', py: 2.5, px: 2, minWidth: 0 }}>
      <MessagesList />
      <ChatInput />
    </Box>
  );
};

export default MainChatArea;
