'use client';

import React, { useState, useEffect } from 'react';
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
import { 
  setTemperature, 
  setMaxTokens, 
  setSelectedModel,
  setRagNumContextDocs,
  setRagSimilarityThreshold,
  type LLMModel
} from '../../lib/store/aiParamsSlice';

const AIParametersSidebar = () => {
  const [presentersInput, setPresentersInput] = useState('');
  const [presenters, setPresenters] = useState<string[]>([]);
  const [meetingResults, setMeetingResults] = useState<{stakeholders: string[], followups: {name: string, email: string}[]} | null>(null);
  // Meeting Follow-up upload state
  const [meetingUploadStatus, setMeetingUploadStatus] = useState<'idle' | 'uploading' | 'error'>('idle');
  const [meetingUploadMessage, setMeetingUploadMessage] = useState<string>('');
  // Meeting Follow-up modal state
  const [meetingModalOpen, setMeetingModalOpen] = useState(false);
  const meetingModalStyle = {
    position: 'absolute' as const,
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 700,
    bgcolor: 'background.paper',
    boxShadow: 24,
    p: 4,
    maxHeight: '90vh',
    overflowY: 'auto',
    borderRadius: 2,
  };
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
  const res = await fetch(`http://localhost:8000/api/rag/file/${file.id}/`, { credentials: 'include' });
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
    window.open(`http://localhost:8000/api/rag/file/${file.id}/`, '_blank');
  };
  const [tabIndex, setTabIndex] = useState(0);
  const [kbFiles, setKbFiles] = useState<any[]>([]);
  // Fetch knowledge base files when Knowledge Base tab is selected
  useEffect(() => {
    if (tabIndex === 1) {
      fetch('http://127.0.0.1:8000/api/rag/documents/')
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
    }
  }, [tabIndex]);
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
                  Supports PDF, DOCX, TXT and MD files.
                </Typography>
              </Box>
            </>
          )}
        </>
      )}

      {tabIndex === 1 && (
        <>
          <List dense>
            {kbFiles.length === 0 ? (
              <ListItem>
                <ListItemText primary="No files uploaded." />
              </ListItem>
            ) : (
              kbFiles.map((file, idx) => (
                <ListItem key={idx} secondaryAction={
                  <>
                    <IconButton onClick={() => handleFilePreview(file)}>
                      <VisibilityIcon fontSize="small" />
                    </IconButton>
                    <IconButton onClick={() => handleFileDownload(file)}>
                      <DownloadIcon fontSize="small" />
                    </IconButton>
                  </>
                }>
                  <ListItemText 
                    primary={file.filename}
                    secondary={`Size: ${file.file_size} bytes`}
                  />
                </ListItem>
              ))
            )}
          </List>
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

      {tabIndex === 2 && (
        <Box sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ width: '48%' }}>
              <Button
                variant="outlined"
                sx={{ width: '100%', p: 2, flexDirection: 'column', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 120 }}
                onClick={() => setMeetingModalOpen(true)}
              >
                <span style={{ fontSize: 36, marginBottom: 8 }}>📅</span>
                <Typography variant="body2" sx={{ mt: 1 }}>Meeting Follow-up</Typography>
              </Button>
            </Box>
          </Box>
          <Modal open={meetingModalOpen} onClose={() => setMeetingModalOpen(false)}>
            <Box sx={meetingModalStyle}>
              <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
                Meeting Follow-up Utility
              </Typography>
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" sx={{ mb: 1 }}>
                  Step 1: Enter full names of the presenter(s) (separate w/ commas)
                </Typography>
                <TextField
                  label="Presenters"
                  placeholder="e.g. Jane Doe, John Smith"
                  value={presentersInput}
                  onChange={e => setPresentersInput(e.target.value)}
                  fullWidth
                  sx={{ mb: 2 }}
                />
                <Typography variant="subtitle1" sx={{ mb: 1 }}>
                  Step 2: Upload the meeting chat txt file.
                </Typography>
                <Button
                  variant="contained"
                  component="label"
                  sx={{ minWidth: 180 }}
                  disabled={meetingUploadStatus === 'uploading'}
                >
                  {meetingUploadStatus === 'uploading' ? 'Uploading...' : 'Upload TXT File'}
                  <input
                    type="file"
                    accept=".txt"
                    style={{ display: 'none' }}
                    disabled={meetingUploadStatus === 'uploading'}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setMeetingUploadStatus('uploading');
                      setMeetingUploadMessage('Uploading and processing file...');
                      const formData = new FormData();
                      formData.append('file', file);
                      try {
                        const res = await fetch('http://localhost:8000/api/rag/meeting-followup/', {
                          method: 'POST',
                          body: formData,
                        });
                        if (!res.ok) {
                          setMeetingUploadStatus('error');
                          setMeetingUploadMessage('Upload failed: ' + (await res.text()));
                        } else {
                          const data = await res.json();
                          // Parse presenters from input
                          const enteredPresenters = presentersInput.split(',').map(s => s.trim()).filter(Boolean);
                          setPresenters(enteredPresenters);
                          // Filter out presenters from stakeholders and followups
                          const filteredStakeholders = data.stakeholders.filter((name: string) => !enteredPresenters.includes(name));
                          const filteredFollowups = data.followups.filter((f: {name: string}) => !enteredPresenters.includes(f.name));
                          setMeetingUploadStatus('idle');
                          setMeetingUploadMessage('Upload and processing complete!');
                          setMeetingResults({
                            stakeholders: filteredStakeholders,
                            followups: filteredFollowups
                          });
                        }
                      } catch (err) {
                        setMeetingUploadStatus('error');
                        setMeetingUploadMessage('Network error or server unavailable');
                      }
                      e.target.value = '';
                    }}
                  />
                </Button>
                {meetingUploadStatus === 'uploading' && (
                  <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <span className="spinner" style={{ width: 24, height: 24, border: '3px solid #1976d2', borderTop: '3px solid #eee', borderRadius: '50%', display: 'inline-block', animation: 'spin 1s linear infinite' }} />
                    <Typography variant="body2">{meetingUploadMessage}</Typography>
                    <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
                  </Box>
                )}
                {meetingUploadStatus === 'error' && (
                  <Alert severity="error" sx={{ mt: 2 }}>{meetingUploadMessage}</Alert>
                )}
                {meetingUploadStatus === 'idle' && meetingUploadMessage && (
                  <Alert severity="success" sx={{ mt: 2 }}>{meetingUploadMessage}</Alert>
                )}
                {meetingResults && (
                  <Box sx={{ mt: 3 }}>
                    {presenters.length > 0 && (
                      <>
                        <Typography variant="subtitle1" sx={{ mb: 1 }}>Presenters:</Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                          {presenters.map((name, idx) => (
                            <Chip key={idx} label={name} color="secondary" sx={{ fontWeight: 500 }} />
                          ))}
                        </Box>
                      </>
                    )}
                    <Typography variant="subtitle1" sx={{ mb: 1 }}>Stakeholders:</Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                      {meetingResults.stakeholders.map((name, idx) => (
                        <Chip key={idx} label={name} color="primary" sx={{ fontWeight: 500 }} />
                      ))}
                    </Box>
                    <Typography variant="subtitle1" sx={{ mb: 1 }}>Follow-up Emails:</Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                      {meetingResults.followups.map((f, idx) => {
                        // Encode email body for mailto
                        const mailtoBody = encodeURIComponent(f.email);
                        const mailtoSubject = encodeURIComponent('Follow-Up on Innergy ERP Inquiry');
                        return (
                          <Box key={idx} sx={{ width: '45%', minWidth: 220, mb: 2 }}>
                            <a
                              href={`mailto:?subject=${mailtoSubject}&body=${mailtoBody}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ textDecoration: 'none' }}
                            >
                              <Box sx={{ border: '1px solid #eee', borderRadius: 2, p: 2, bgcolor: '#fafafa', cursor: 'pointer', '&:hover': { boxShadow: 2, backgroundColor: '#f5f5f5' } }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>{f.name}</Typography>
                                <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>{f.email}</Typography>
                              </Box>
                            </a>
                          </Box>
                        );
                      })}
                    </Box>
                  </Box>
                )}
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 4 }}>
                <Button onClick={() => setMeetingModalOpen(false)} variant="outlined">Close</Button>
              </Box>
            </Box>
          </Modal>
        </Box>
      )}
    </Box>
  );
};

export default AIParametersSidebar;
