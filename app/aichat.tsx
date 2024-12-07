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
    try {
      setLoading(true); // Show loading spinner
      setError(''); // Clear any previous errors
  
      // Make the API call with the user's input
      const response = await fetch(`http://localhost:3000/api/proxy?query=${inputText}`);
      if (!response.ok) {
        throw new Error('API request failed'); // Handle non-200 responses
      }
  
      const data = await response.json(); // Parse the response JSON
      console.log('response data:', data);
  
      // Update the state to include the new messages from the response
      setMessages((prevMessages: { text: string, role: string }[]) => [
        ...prevMessages,
        ...data[0].inputs.messages.map((msg: any) => ({
          text: msg.content,
          role: msg.role,
        })),
        {
          text: data[0].response.response,
          role: 'ai',
        },
      ]);
      // Clear the input field
      setInputText('');
    } catch (error) {
      setError('Error fetching data'); // Handle API call errors
    } finally {
      setLoading(false); // Hide loading spinner
    }
  };

  return (
    <div style={{maxWidth: '900px'}}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6">Llama Text Interface</Typography>
        </Toolbar>
      </AppBar>
      <Paper elevation={3} style={{ height: '600px', width: '800px', overflowY: 'auto' }}>
        <List>
          {messages.map((msg, index) => (
            <ListItem key={index} alignItems="flex-start">
              <ListItemText
                primary={msg.text}
                secondary={msg.role === 'user' ? 'You' : msg.role === 'system' ? 'System' : 'Bot'}
              />
            </ListItem>
          ))}
        </List>
      </Paper>
      <TextField
        label="Type your message"
        // variant="outlined"
        fullWidth
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        style={{ margin: '16px 0' }}
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