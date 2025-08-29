import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

const GraphQLExplorer = () => {
  return (
    <Box sx={{ height: '100vh', width: '100vw', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 2, backgroundColor: '#1976d2', color: 'white' }}>
        <Typography variant="h4">GraphQL Schema Explorer</Typography>
        <Typography variant="subtitle1">Explore your chat completion API schema</Typography>
      </Box>
      
      <Box sx={{ flex: 1, p: 2 }}>
        <iframe
          src="https://studio.apollographql.com/sandbox/explorer?endpoint=http://localhost:3000/api/graphql"
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            borderRadius: '8px',
          }}
          title="Apollo Studio Sandbox"
        />
      </Box>
    </Box>
  );
};

export default GraphQLExplorer;
