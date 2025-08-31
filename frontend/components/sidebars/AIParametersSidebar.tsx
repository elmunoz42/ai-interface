'use client';

import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  TextField, 
  Slider, 
  FormControl, 
  Select, 
  MenuItem, 
  SelectChangeEvent, 
  Chip,
  InputLabel,
  Button,
  Alert
} from '@mui/material';
import { CloudUpload } from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../../lib/store/hooks';
import { 
  setTemperature, 
  setMaxTokens, 
  setSelectedModel,
  setRagNumContextDocs,
  setRagSimilarityThreshold,
  type LLMModel
} from '../../lib/store/aiParamsSlice';

const AIParametersSidebar = () => {
  const dispatch = useAppDispatch();
  const { 
    temperature, 
    maxTokens, 
    selectedModel, 
    availableModels,
    ragNumContextDocs,
    ragSimilarityThreshold
  } = useAppSelector(state => state.aiParams);

  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [uploadMessage, setUploadMessage] = useState<string>('');

  const handleTemperatureChange = (value: number) => {
    dispatch(setTemperature(value));
  };

  const handleMaxTokensChange = (value: number) => {
    dispatch(setMaxTokens(value));
  };

  const handleModelChange = (event: SelectChangeEvent<string>) => {
    const modelId = event.target.value;
    const model = availableModels.find(m => m.id === modelId);
    if (model) {
      dispatch(setSelectedModel(model));
    }
  };

  const handleRagNumContextDocsChange = (value: number) => {
    dispatch(setRagNumContextDocs(value));
  };

  const handleRagSimilarityThresholdChange = (value: number) => {
    dispatch(setRagSimilarityThreshold(value));
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadStatus('uploading');
    setUploadMessage('Uploading document...');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://127.0.0.1:8000/api/rag/upload/', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        setUploadStatus('success');
        setUploadMessage(`Successfully uploaded "${file.name}" to knowledge base!`);
        console.log('File uploaded successfully:', result);
        
        // Clear success message after 5 seconds
        setTimeout(() => {
          setUploadStatus('idle');
          setUploadMessage('');
        }, 5000);
      } else {
        const error = await response.json();
        setUploadStatus('error');
        setUploadMessage(`Upload failed: ${error.message || 'Unknown error occurred'}`);
        console.error('Upload failed:', error);
        
        // Clear error message after 8 seconds
        setTimeout(() => {
          setUploadStatus('idle');
          setUploadMessage('');
        }, 8000);
      }
    } catch (error) {
      setUploadStatus('error');
      setUploadMessage('Upload failed: Network error or server unavailable');
      console.error('Upload error:', error);
      
      // Clear error message after 8 seconds
      setTimeout(() => {
        setUploadStatus('idle');
        setUploadMessage('');
      }, 8000);
    }

    // Reset the input
    event.target.value = '';
  };

  const getProviderColor = (provider: string) => {
    switch (provider) {
      case 'openai': return '#10A37F';
      case 'cloudflare': return '#F38020';
      case 'faiss': return '#4A90E2';
      default: return '#666';
    }
  };

  const getProviderLabel = (provider: string) => {
    switch (provider) {
      case 'openai': return 'OpenAI';
      case 'cloudflare': return 'Cloudflare';
      case 'faiss': return 'FAISS';
      default: return provider;
    }
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
      
      {/* Model Selection - Always visible */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" gutterBottom>
          Model Selection
        </Typography>
        <FormControl fullWidth size="small" sx={{ mb: 1 }}>
          <InputLabel>Select Model</InputLabel>
          <Select
            value={selectedModel.id}
            onChange={handleModelChange}
            label="Select Model"
            MenuProps={{
              PaperProps: {
                sx: {
                  maxWidth: 400, // Allow wider dropdown
                  '& .MuiMenuItem-root': {
                    whiteSpace: 'normal', // Allow text wrapping
                    minHeight: 'auto', // Allow variable height
                    padding: '12px 16px', // More padding for better spacing
                  }
                }
              }
            }}
          >
            {availableModels.map((model) => (
              <MenuItem key={model.id} value={model.id}>
                <Box sx={{ width: '100%' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <Typography variant="body2" fontWeight="medium">
                      {model.name}
                    </Typography>
                    <Chip
                      label={getProviderLabel(model.provider)}
                      size="small"
                      sx={{
                        bgcolor: getProviderColor(model.provider),
                        color: 'white',
                        fontSize: '0.75rem',
                        height: 20,
                        flexShrink: 0 // Prevent chip from shrinking
                      }}
                    />
                  </Box>
                  <Typography 
                    variant="caption" 
                    color="text.secondary"
                    sx={{ 
                      display: 'block',
                      whiteSpace: 'normal',
                      wordWrap: 'break-word',
                      lineHeight: 1.3
                    }}
                  >
                    {model.description}
                  </Typography>
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Chip
            label={getProviderLabel(selectedModel.provider)}
            size="small"
            sx={{
              bgcolor: getProviderColor(selectedModel.provider),
              color: 'white',
              fontSize: '0.75rem'
            }}
          />
          <Typography variant="caption" color="text.secondary">
            {selectedModel.id !== 'rag-faiss' 
              ? `Max: ${selectedModel.maxTokens.toLocaleString()} tokens`
              : 'Document-based AI with vector search'
            }
          </Typography>
        </Box>
      </Box>

      {/* LLM-specific parameters - Temperature Control and Max Tokens */}
      {selectedModel.id !== 'rag-faiss' && (
        <>
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
              inputProps={{ min: 50, max: selectedModel.maxTokens, step: 50 }}
              sx={{ mb: 1 }}
            />
            <Slider
              value={maxTokens}
              onChange={(_, value) => handleMaxTokensChange(value as number)}
              min={50}
              max={selectedModel.maxTokens}
              step={50}
              size="small"
            />
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="caption">50</Typography>
              <Typography variant="caption">{selectedModel.maxTokens.toLocaleString()}</Typography>
            </Box>
          </Box>
        </>
      )}

      {/* RAG Parameters */}
      {selectedModel.id === 'rag-faiss' && (
        <>
          {/* Number of Context Documents */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Context Documents: {ragNumContextDocs}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
              Number of relevant documents to retrieve
            </Typography>
            <Slider
              value={ragNumContextDocs}
              onChange={(_, value) => handleRagNumContextDocsChange(value as number)}
              min={1}
              max={10}
              step={1}
              size="small"
              sx={{ mb: 1 }}
            />
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="caption">1</Typography>
              <Typography variant="caption">10</Typography>
            </Box>
          </Box>

          {/* Similarity Threshold */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Similarity Threshold: {ragSimilarityThreshold}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
              Minimum relevance score for document retrieval (0.0 = any, 1.0 = exact match)
            </Typography>
            <Slider
              value={ragSimilarityThreshold}
              onChange={(_, value) => handleRagSimilarityThresholdChange(value as number)}
              min={0}
              max={1}
              step={0.1}
              size="small"
              sx={{ mb: 1 }}
            />
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="caption">Any</Typography>
              <Typography variant="caption">Exact</Typography>
            </Box>
          </Box>

          {/* Document Upload */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Knowledge Base
            </Typography>
            <Button
              component="label"
              variant="outlined"
              startIcon={<CloudUpload />}
              fullWidth
              disabled={uploadStatus === 'uploading'}
              sx={{ 
                mb: 1,
                textTransform: 'none',
                borderColor: '#4A90E2',
                color: '#4A90E2',
                '&:hover': {
                  borderColor: '#357ABD',
                  backgroundColor: 'rgba(74, 144, 226, 0.04)'
                },
                '&:disabled': {
                  borderColor: '#ccc',
                  color: '#999'
                }
              }}
            >
              {uploadStatus === 'uploading' ? 'Uploading...' : 'Upload PDF'}
              <input
                type="file"
                accept=".pdf,.docx,.txt,.md"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
                disabled={uploadStatus === 'uploading'}
              />
            </Button>
            
            {/* Upload Status Message */}
            {uploadStatus !== 'idle' && (
              <Alert 
                severity={uploadStatus === 'success' ? 'success' : uploadStatus === 'error' ? 'error' : 'info'}
                sx={{ mb: 1, fontSize: '0.75rem' }}
              >
                {uploadMessage}
              </Alert>
            )}
            
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', lineHeight: 1.3 }}>
              Upload documents to expand the RAG knowledge base. Supports PDF, DOCX, TXT, and MD files.
            </Typography>
          </Box>
        </>
      )}
    </Box>
  );
};

export default AIParametersSidebar;
