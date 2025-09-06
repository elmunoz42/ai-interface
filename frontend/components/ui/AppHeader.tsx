'use client';

import React from 'react';
import { AppBar, Toolbar, Typography, Box } from '@mui/material';
import AuthNav from './AuthNav';

const AppHeader = () => {
  return (
    <AppBar position="static" sx={{ flexShrink: 0, backgroundColor: '#000' }}>
      <Toolbar sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" sx={{ color: '#fff' }}>Custom AI Interface</Typography>
        <Box>
          <AuthNav />
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default AppHeader;
