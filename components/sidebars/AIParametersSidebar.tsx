'use client';

import React from 'react';
import { Box, Typography, TextField, Slider } from '@mui/material';
import { useAppDispatch, useAppSelector } from '../../lib/store/hooks';
import { setTemperature, setMaxTokens } from '../../lib/store/aiParamsSlice';

const AIParametersSidebar = () => {
  const dispatch = useAppDispatch();
  const { temperature, maxTokens } = useAppSelector(state => state.aiParams);

  const handleTemperatureChange = (value: number) => {
    dispatch(setTemperature(value));
  };

  const handleMaxTokensChange = (value: number) => {
    dispatch(setMaxTokens(value));
  };

  return (
    <Box 
      sx={{ 
        width: 280, 
        minWidth: 280,
        borderRight: 1, 
        borderColor: 'divider',
        pt: 2,
        pb: 2,
        pl: 2,
        pr: 2,
        backgroundColor: '#f8f9fa',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <Typography variant="h6" sx={{ mb: 1.5, mt: 0 }}>
        AI Parameters
      </Typography>
      
      {/* Temperature Control */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" gutterBottom>
          Temperature: {temperature}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
          Controls randomness (0.0 = focused, 1.0 = creative)
        </Typography>
        <Slider
          value={temperature}
          onChange={(_, value) => handleTemperatureChange(value as number)}
          min={0}
          max={1}
          step={0.1}
          size="small"
          sx={{ mb: 1 }}
        />
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="caption">Focused</Typography>
          <Typography variant="caption">Creative</Typography>
        </Box>
      </Box>

      {/* Max Tokens Control */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" gutterBottom>
          Max Tokens
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
          Maximum length of the AI response
        </Typography>
        <TextField
          type="number"
          value={maxTokens}
          onChange={(e) => handleMaxTokensChange(parseInt(e.target.value) || 1000)}
          size="small"
          fullWidth
          inputProps={{ min: 50, max: 4000, step: 50 }}
          sx={{ mb: 1 }}
        />
        <Slider
          value={maxTokens}
          onChange={(_, value) => handleMaxTokensChange(value as number)}
          min={50}
          max={4000}
          step={50}
          size="small"
        />
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="caption">50</Typography>
          <Typography variant="caption">4000</Typography>
        </Box>
      </Box>

      {/* Model Info Section */}
      <Box sx={{ mt: 'auto', pt: 2, borderTop: 1, borderColor: 'divider' }}>
        <Typography variant="subtitle2" gutterBottom>
          Model Information
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Using: Llama 3 8B Instruct
        </Typography>
        <br />
        <Typography variant="caption" color="text.secondary">
          Provider: Cloudflare Workers AI
        </Typography>
      </Box>
    </Box>
  );
};

export default AIParametersSidebar;
