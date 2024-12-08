import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  TextField,
  Button,
  CircularProgress,
  Snackbar,
} from '@mui/material';

interface Message {
  text: string;
  role: string;
}

const ChatApp = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    try {
      setLoading(true);
      setError('');

      // Add user message immediately for better UX
      setMessages(prevMessages => [
        ...prevMessages,
        { text: inputText, role: 'user' }
      ]);

      const response = await fetch('http://localhost:3000/api/proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: inputText })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch response');
      }

      const data = await response.json();
      console.log('Response data:', data);

      // Add AI response
      setMessages(prevMessages => [
        ...prevMessages,
        {
          text: data[0].response.response,
          role: 'ai',
        }
      ]);

      setInputText('');
    } catch (error) {
      console.error('Error in handleSendMessage:', error);
      setError(error.message || 'Error fetching data');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div style={{ maxWidth: '900px' }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6">Llama Text Interface</Typography>
        </Toolbar>
      </AppBar>
      <Paper 
        elevation={3} 
        style={{ 
          height: '600px', 
          width: '800px', 
          overflowY: 'auto',
          padding: '16px' 
        }}
      >
        <List>
          {messages.map((msg, index) => (
            <ListItem 
              key={index} 
              alignItems="flex-start"
              style={{
                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                padding: '8px 0'
              }}
            >
              <Paper 
                elevation={1}
                style={{
                  padding: '8px 16px',
                  maxWidth: '80%',
                  backgroundColor: msg.role === 'user' ? '#e3f2fd' : '#f5f5f5'
                }}
              >
                <ListItemText
                  primary={msg.text}
                  secondary={msg.role === 'user' ? 'You' : 'Assistant'}
                  secondaryTypographyProps={{
                    style: { fontSize: '0.8rem', opacity: 0.7 }
                  }}
                />
              </Paper>
            </ListItem>
          ))}
        </List>
      </Paper>
      <TextField
        label="Type your message"
        fullWidth
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        onKeyPress={handleKeyPress}
        style={{ margin: '16px 0' }}
        multiline
        maxRows={4}
        disabled={loading}
      />
      <Button
        variant="contained"
        color="primary"
        onClick={handleSendMessage}
        disabled={loading || !inputText.trim()}
      >
        {loading ? 'Sending...' : 'Send'}
      </Button>
      {loading && <CircularProgress style={{ marginLeft: '16px' }} />}
      {error && (
        <Snackbar 
          open={!!error} 
          autoHideDuration={3000} 
          message={error}
          onClose={() => setError('')}
        />
      )}
    </div>
  );
};

export default ChatApp;