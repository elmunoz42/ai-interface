

//// COPIED FROM COPILOT NEED TO SETUP


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

const ChatApp = () => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSendMessage = async () => {
    try {
      setLoading(true); // Show loading spinner
      setError(null); // Clear any previous errors
  
      // Make the API call with the user's input
      const response = await fetch(`https://llama2-query-responder.fountain-city.workers.dev/?query=${inputText}`);
      if (!response.ok) {
        throw new Error('API request failed'); // Handle non-200 responses
      }
  
      const data = await response.json(); // Parse the response JSON
      setMessages([...messages, { text: data.message, isUser: true }]);
    } catch (error) {
      setError('Error fetching data'); // Handle API call errors
    } finally {
      setLoading(false); // Hide loading spinner
    }
  };

  return (
    <div>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6">ChatGPT Clone</Typography>
        </Toolbar>
      </AppBar>
      <Paper elevation={3} style={{ height: '400px', overflowY: 'auto' }}>
        <List>
          {messages.map((msg, index) => (
            <ListItem key={index} alignItems="flex-start">
              <ListItemText
                primary={msg.text}
                secondary={msg.isUser ? 'You' : 'ChatGPT'}
              />
            </ListItem>
          ))}
        </List>
      </Paper>
      <TextField
        label="Type your message"
        variant="outlined"
        fullWidth
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
      />
      <Button
        variant="contained"
        color="primary"
        onClick={handleSendMessage}
        disabled={loading}
      >
        Send
      </Button>
      {loading && <CircularProgress />}
      {error && (
        <Snackbar open autoHideDuration={3000} message={error} />
      )}
    </div>
  );
};

export default ChatApp;
