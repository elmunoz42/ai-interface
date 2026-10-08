'use client';

import React, { useEffect, useRef, useState } from 'react';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import IconButton from '@mui/material/IconButton';
import { Paper, List, ListItem, ListItemText, Box, Typography, Link, Popover, Divider } from '@mui/material';
import { useAppSelector } from '../../lib/store/hooks';
import type { MessageReference } from '../../lib/store/chatSlice';

const MessagesList = () => {
  const { messages } = useAppSelector(state => state.chat);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [referenceAnchor, setReferenceAnchor] = useState<HTMLElement | null>(null);
  const [activeReference, setActiveReference] = useState<MessageReference | null>(null);

  const showReference = (anchor: HTMLElement, reference: MessageReference) => {
    setReferenceAnchor(anchor);
    setActiveReference(reference);
  };

  const hideReference = () => {
    setReferenceAnchor(null);
    setActiveReference(null);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
          <ListItem key={index} alignItems="flex-start" sx={{ flexDirection: 'column', alignItems: 'flex-start' }}>
            <ListItemText
              primary={
                <Box>
                  <Typography
                    variant="body1"
                    sx={{
                      backgroundColor: msg.role === 'user' ? '#e3f2fd' : '#f5f5f5',
                      padding: 1,
                      borderRadius: 1,
                      marginBottom: 0.5,
                      whiteSpace: 'pre-wrap', // Preserve line breaks
                      wordBreak: 'break-word'
                    }}
                  >
                    {msg.text}
                    {msg.streaming && (
                      <Box
                        component="span"
                        sx={{
                          display: 'inline-block',
                          width: '8px',
                          height: '12px',
                          backgroundColor: '#1976d2',
                          marginLeft: '2px',
                          animation: 'blink 1s infinite',
                          '@keyframes blink': {
                            '0%, 50%': { opacity: 1 },
                            '51%, 100%': { opacity: 0 }
                          }
                        }}
                      />
                    )}
                  </Typography>
                  {msg.references && msg.references.length > 0 && (
                    <Box
                      aria-label="Knowledge base references"
                      sx={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        alignItems: 'center',
                        gap: 0.75,
                        mt: 0.75,
                      }}
                    >
                      <Typography variant="caption" color="text.secondary">
                        References:
                      </Typography>
                      {msg.references.map((reference, referenceIndex) => (
                        <Link
                          key={`${reference.source}-${reference.page ?? 'chunk'}-${referenceIndex}`}
                          component="button"
                          type="button"
                          variant="caption"
                          underline="hover"
                          onMouseEnter={(event) => showReference(event.currentTarget, reference)}
                          onMouseLeave={hideReference}
                          onFocus={(event) => showReference(event.currentTarget, reference)}
                          onBlur={hideReference}
                          sx={{
                            border: '1px solid',
                            borderColor: 'divider',
                            borderRadius: 1,
                            bgcolor: 'background.paper',
                            px: 0.75,
                            py: 0.25,
                            cursor: 'help',
                          }}
                        >
                          [{referenceIndex + 1}] {reference.source}
                          {reference.page ? ` · page ${reference.page}` : ''}
                        </Link>
                      ))}
                    </Box>
                  )}
                  {/* Copy button for AI answers (support both 'assistant' and 'ai' roles) */}
                  {(msg.role === 'assistant' || msg.role === 'ai') && (
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', width: '100%', mt: 0.25 }}>
                      <IconButton
                        size="small"
                        aria-label="Copy message"
                        sx={{ m: 0 }}
                        onClick={() => navigator.clipboard.writeText(msg.text)}
                      >
                        <ContentCopyIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  )}
                </Box>
              }
              secondary={msg.role === 'user' ? 'You' : msg.role === 'system' ? 'System' : 'AI Assistant'}
            />
          </ListItem>
        ))}
        <div ref={messagesEndRef} />
      </List>
      <Popover
        open={Boolean(referenceAnchor && activeReference)}
        anchorEl={referenceAnchor}
        onClose={hideReference}
        disableRestoreFocus
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        sx={{ pointerEvents: 'none' }}
        PaperProps={{
          sx: {
            width: 'min(560px, calc(100vw - 32px))',
            maxHeight: 360,
            p: 2,
            mt: 0.5,
            overflowY: 'auto',
            boxShadow: 6,
          }
        }}
      >
        {activeReference && (
          <Box>
            <Typography variant="subtitle2" sx={{ wordBreak: 'break-word' }}>
              {activeReference.source}
              {activeReference.page ? ` · Page ${activeReference.page}` : ''}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Retrieved knowledge-base chunk
            </Typography>
            <Divider sx={{ my: 1 }} />
            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {activeReference.content}
            </Typography>
          </Box>
        )}
      </Popover>
    </Paper>
  );
};

export default MessagesList;
