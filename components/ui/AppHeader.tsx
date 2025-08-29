'use client';

import React from 'react';
import { AppBar, Toolbar, Typography } from '@mui/material';

const AppHeader = () => {
  return (
    <AppBar position="static" sx={{ flexShrink: 0, backgroundColor: '#2c2c2c' }}>
      <Toolbar>
        <Typography variant="h6">Llama Chat</Typography>
      </Toolbar>
    </AppBar>
  );
};

export default AppHeader;
