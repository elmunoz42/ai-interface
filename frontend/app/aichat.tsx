'use client';

import React from 'react';
import { Box } from '@mui/material';
import { useReduxMonitoring } from '../lib/store/useReduxMonitoring';
import AppHeader from '../components/ui/AppHeader';
import AIParametersSidebar from '../components/sidebars/AIParametersSidebar';
import PromptRecipesSidebar from '../components/sidebars/PromptRecipesSidebar';
import MainChatArea from '../components/chat/MainChatArea';
import ErrorSnackbar from '../components/ui/ErrorSnackbar';

const ChatApp = () => {
  // Monitor Redux state in development
  useReduxMonitoring();

  return (
    <Box sx={{ height: '100vh', width: '100vw', display: 'flex', flexDirection: 'column', margin: 0, padding: 0 }}>
      <AppHeader />
      <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>
        <AIParametersSidebar />
        <MainChatArea />
        <PromptRecipesSidebar />
      </Box>
      <ErrorSnackbar />
    </Box>
  );
};

export default ChatApp;
