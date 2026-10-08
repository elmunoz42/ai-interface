'use client';
// Utility to get CSRF token from cookies
const getCSRFToken = () => {
  const name = 'csrftoken';
  const cookies = document.cookie.split(';');
  for (let cookie of cookies) {
    const [key, value] = cookie.trim().split('=');
    if (key === name) return value;
  }
  return '';
};

import React, { useState, useEffect } from 'react';
import AppsSidebar from './AppsSidebar';
import Modal from '@mui/material/Modal';
import VisibilityIcon from '@mui/icons-material/Visibility';
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
  Alert,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Button
} from '@mui/material';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import DownloadIcon from '@mui/icons-material/Download';
import { CloudUpload } from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../../lib/store/hooks';
import { DJANGO_API_URL } from '../../lib/backend-api';
import { 
  setTemperature, 
  setMaxTokens, 
  setSelectedModel,
  setRagNumContextDocs,
  setRagSimilarityThreshold,
  type LLMModel
} from '../../lib/store/aiParamsSlice';

const AIParametersSidebar = () => {
  // ...existing code...
  // Modal state for file preview
  const [modalOpen, setModalOpen] = useState(false);
  const [modalFile, setModalFile] = useState<any | null>(null);
  const [modalContent, setModalContent] = useState<string | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  // Modal style
  const modalStyle = {
    position: 'absolute' as const,
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 600,
    bgcolor: 'background.paper',
    boxShadow: 24,
    p: 4,
    maxHeight: '80vh',
    overflowY: 'auto',
  };
  // Preview file in modal
  const handleFilePreview = async (file: any) => {
    setModalOpen(true);
    setModalFile(file);
    setModalLoading(true);
    try {
  const res = await fetch(`${DJANGO_API_URL}/api/rag/file/${file.id}/`, { credentials: 'include' });
      if (res.ok) {
        if (file.content_type && file.content_type.startsWith('text')) {
          const text = await res.text();
          setModalContent(text);
        } else {
          setModalContent('Preview not available for this file type.');
        }
      } else {
        setModalContent('Failed to load file.');
      }
    } catch (e) {
      setModalContent('Error loading file.');
    }
    setModalLoading(false);
  };

  // Download file securely
  const handleFileDownload = (file: any) => {
    window.open(`${DJANGO_API_URL}/api/rag/file/${file.id}/`, '_blank');
  };
  const [tabIndex, setTabIndex] = useState(0);
  const [kbFiles, setKbFiles] = useState<any[]>([]);
  // Fetch knowledge base files when Knowledge Base tab is selected
  const fetchKbFiles = () => {
    fetch(`${DJANGO_API_URL}/api/rag/documents/`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        // DRF paginated response: { count, next, previous, results }
        if (Array.isArray(data.results)) {
          setKbFiles(data.results);
        } else {
          setKbFiles([]);
        }
      })
      .catch(() => setKbFiles([]));
  };
  useEffect(() => {
    if (tabIndex === 1) {
      fetchKbFiles();
    }
  }, [tabIndex]);

  // Log KB files to console for UUID access
  useEffect(() => {
    if (tabIndex === 1 && kbFiles.length > 0) {
      console.log('KB Files:', kbFiles);
    }
  }, [tabIndex, kbFiles]);

  // Delete KB file handler
  const handleFileDelete = async (file: any) => {
    if (!window.confirm(`Delete "${file.filename}" from knowledge base? This cannot be undone.`)) return;
    try {
      const res = await fetch(`${DJANGO_API_URL}/api/rag/file/${file.id}/`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'X-CSRFToken': getCSRFToken(),
        },
      });
      if (res.ok) {
        setKbFiles(prev => prev.filter(f => f.id !== file.id));
      } else {
        const error = await res.json().catch(() => ({}));
        alert('Failed to delete file.' + (error.detail ? `\n${error.detail}` : ''));
      }
    } catch (e) {
      alert('Error deleting file.');
    }
  };
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
      const response = await fetch(`${DJANGO_API_URL}/api/rag/upload/`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (response.ok) {
        const result = await response.json();
        setUploadStatus('success');
        setUploadMessage(`Successfully uploaded "${file.name}" to knowledge base!`);
        console.log('File uploaded successfully:', result);
        fetchKbFiles();
        
        // Clear success message after 5 seconds
        setTimeout(() => {
          setUploadStatus('idle');
          setUploadMessage('');
        }, 5000);
      } else {
        const error = await response.json().catch(() => ({}));
        const errorDetail = error.message || error.error || error.detail ||
          (Array.isArray(error.file) ? error.file.join(' ') : undefined);
        setUploadStatus('error');
        setUploadMessage(`Upload failed: ${errorDetail || 'Unknown error occurred'}`);
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
      case 'huggingface': return '#FFD21E';
      case 'faiss': return '#4A90E2';
      default: return '#666';
    }
  };

  const getProviderLabel = (provider: string) => {
    switch (provider) {
      case 'openai': return 'OpenAI';
      case 'cloudflare': return 'Cloudflare';
      case 'huggingface': return 'Hugging Face';
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
      <Tabs value={tabIndex} onChange={(_, v) => setTabIndex(v)} variant="fullWidth" sx={{ mb: 2 }}>
        <Tab label="AI" />
        <Tab label="KB" />
        <Tab label="Apps" />
      </Tabs>

      {tabIndex === 0 && (
        <>
          {/* Model Selection - Always visible */}
          <Box sx={{ mb: 2 }}>
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
                      maxWidth: 400,
                      '& .MuiMenuItem-root': {
                        whiteSpace: 'normal',
                        minHeight: 'auto',
                        padding: '12px 16px',
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
                            flexShrink: 0
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

          {/* LLM-specific parameters - Temperature Control and Max Tokens (always visible) */}
          <>
            {/* Temperature Control */}
            <Box sx={{ mb: 2 }}>
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
            <Box sx={{ mb: 2 }}>
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

          {/* RAG Parameters */}
          {selectedModel.id === 'rag-faiss' && (
            <>
              {/* Similarity Threshold */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Similarity Threshold: {ragSimilarityThreshold}
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

              {/* Number of Context Documents - now a single-line number input */}
              <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Context Documents
                </Typography>
                <TextField
                  type="number"
                  value={ragNumContextDocs}
                  onChange={e => {
                    const val = Math.max(1, Math.min(10, parseInt(e.target.value) || 1));
                    handleRagNumContextDocsChange(val);
                  }}
                  size="small"
                  inputProps={{ min: 1, max: 10, step: 1 }}
                  sx={{ width: 70 }}
                />
              </Box>

            </>
          )}
        </>
      )}

      {tabIndex === 1 && (
        <>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Add to knowledge base
              </Typography>
              <Button
                component="label"
                variant="contained"
                startIcon={<CloudUpload />}
                fullWidth
                disabled={uploadStatus === 'uploading'}
                sx={{ mb: 1, textTransform: 'none' }}
              >
                {uploadStatus === 'uploading' ? 'Adding document...' : 'Add document'}
                <input
                  type="file"
                  accept=".pdf,.docx,.txt,.md"
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                  disabled={uploadStatus === 'uploading'}
                />
              </Button>
              {uploadStatus !== 'idle' && (
                <Alert
                  severity={uploadStatus === 'success' ? 'success' : uploadStatus === 'error' ? 'error' : 'info'}
                  sx={{ mb: 1, fontSize: '0.75rem' }}
                >
                  {uploadMessage}
                </Alert>
              )}
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', lineHeight: 1.3 }}>
                PDF, DOCX, TXT, or MD up to 10 MB
              </Typography>
            </Box>

            {kbFiles.length === 0 ? (
              <Box sx={{ p: 2, textAlign: 'center', color: 'text.secondary' }}>No files uploaded.</Box>
            ) : (
              kbFiles.map((file, idx) => (
                <Box key={idx} sx={{ border: '1px solid #eee', borderRadius: 2, p: 2, bgcolor: '#fafafa', boxShadow: 1 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1, wordBreak: 'break-word' }}>{file.filename}</Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                    Size: {file.file_size} bytes
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                    <IconButton onClick={() => handleFilePreview(file)} size="small" sx={{ bgcolor: '#e3f2fd', borderRadius: 1 }}>
                      <VisibilityIcon fontSize="small" />
                    </IconButton>
                    <IconButton onClick={() => handleFileDownload(file)} size="small" sx={{ bgcolor: '#e8f5e9', borderRadius: 1 }}>
                      <DownloadIcon fontSize="small" />
                    </IconButton>
                    <IconButton onClick={() => handleFileDelete(file)} aria-label="Delete" size="small" sx={{ bgcolor: '#ffebee', borderRadius: 1 }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d32f2f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m5 0V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                    </IconButton>
                  </Box>
                </Box>
              ))
            )}
          </Box>
          <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
            <Box sx={modalStyle}>
              <h2>{modalFile?.filename}</h2>
              {modalLoading ? (
                <div>Loading...</div>
              ) : (
                <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{modalContent}</pre>
              )}
              <Button
                variant="contained"
                sx={{ mt: 2 }}
                onClick={() => modalFile && handleFileDownload(modalFile)}
              >
                Download
              </Button>
              <Button sx={{ mt: 2, ml: 2 }} onClick={() => setModalOpen(false)}>
                Close
              </Button>
            </Box>
          </Modal>
        </>
      )}

      {tabIndex === 2 && <AppsSidebar />}
    </Box>
  );
};

export default AIParametersSidebar;
