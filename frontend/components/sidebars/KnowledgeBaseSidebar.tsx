import React from 'react';
import { Box, Typography, IconButton, Modal, Button } from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DownloadIcon from '@mui/icons-material/Download';

const KnowledgeBaseSidebar = ({ kbFiles, handleFilePreview, handleFileDownload, handleFileDelete, modalOpen, modalFile, modalContent, modalLoading, modalStyle, setModalOpen }) => (
  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
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
  </Box>
);

export default KnowledgeBaseSidebar;
