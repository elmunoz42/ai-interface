import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  List,
  ListItem,
  ListItemText,
  Container,
  Alert,
} from '@mui/material';

const GraphQLSchemaViewer = () => {
  const [schema, setSchema] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchSchema = async () => {
      try {
        const response = await fetch('/api/graphql', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: `
              query IntrospectionQuery {
                __schema {
                  types {
                    name
                    kind
                    description
                    fields {
                      name
                      description
                      type {
                        name
                        kind
                        ofType {
                          name
                          kind
                        }
                      }
                    }
                    inputFields {
                      name
                      description
                      type {
                        name
                        kind
                        ofType {
                          name
                          kind
                        }
                      }
                    }
                  }
                  queryType { name }
                  mutationType { name }
                }
              }
            `,
          }),
        });

        const data = await response.json();
        if (data.errors) {
          throw new Error(data.errors[0].message);
        }
        setSchema(data.data.__schema);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch schema');
      } finally {
        setLoading(false);
      }
    };

    fetchSchema();
  }, []);

  const getTypeString = (type: any): string => {
    if (!type) return 'Unknown';
    if (type.kind === 'NON_NULL') {
      return `${getTypeString(type.ofType)}!`;
    }
    if (type.kind === 'LIST') {
      return `[${getTypeString(type.ofType)}]`;
    }
    return type.name || 'Unknown';
  };

  const renderType = (type: any) => {
    if (!type.name || type.name.startsWith('__')) return null;

    return (
      <Accordion key={type.name} sx={{ mb: 1 }}>
        <AccordionSummary expandIcon={<span>▼</span>}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="h6">{type.name}</Typography>
            <Chip 
              label={type.kind} 
              size="small" 
              color={type.kind === 'OBJECT' ? 'primary' : type.kind === 'INPUT_OBJECT' ? 'secondary' : 'default'}
            />
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          {type.description && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {type.description}
            </Typography>
          )}
          
          {type.fields && type.fields.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle1" sx={{ mb: 1 }}>Fields:</Typography>
              <List dense>
                {type.fields.map((field: any) => (
                  <ListItem key={field.name} sx={{ py: 0.5 }}>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography component="span" sx={{ fontWeight: 'bold' }}>
                            {field.name}
                          </Typography>
                          <Typography component="span" color="text.secondary">
                            : {getTypeString(field.type)}
                          </Typography>
                        </Box>
                      }
                      secondary={field.description}
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}

          {type.inputFields && type.inputFields.length > 0 && (
            <Box>
              <Typography variant="subtitle1" sx={{ mb: 1 }}>Input Fields:</Typography>
              <List dense>
                {type.inputFields.map((field: any) => (
                  <ListItem key={field.name} sx={{ py: 0.5 }}>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography component="span" sx={{ fontWeight: 'bold' }}>
                            {field.name}
                          </Typography>
                          <Typography component="span" color="text.secondary">
                            : {getTypeString(field.type)}
                          </Typography>
                        </Box>
                      }
                      secondary={field.description}
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}
        </AccordionDetails>
      </Accordion>
    );
  };

  if (loading) {
    return (
      <Container>
        <Typography variant="h4" sx={{ my: 4 }}>Loading GraphQL Schema...</Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Alert severity="error" sx={{ my: 4 }}>
          Error loading schema: {error}
        </Alert>
      </Container>
    );
  }

  const customTypes = schema?.types?.filter((type: any) => 
    !type.name.startsWith('__') && 
    ['OBJECT', 'INPUT_OBJECT', 'ENUM'].includes(type.kind)
  ) || [];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" gutterBottom>
          GraphQL Schema Explorer
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Explore your chat completion API types and structure
        </Typography>
      </Box>

      <Box sx={{ mb: 4 }}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h5" gutterBottom>Schema Overview</Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Chip label={`Query: ${schema?.queryType?.name || 'None'}`} color="primary" />
            <Chip label={`Mutation: ${schema?.mutationType?.name || 'None'}`} color="secondary" />
            <Chip label={`${customTypes.length} Custom Types`} />
          </Box>
        </Paper>
      </Box>

      <Typography variant="h4" gutterBottom>
        Type Definitions
      </Typography>
      
      {customTypes.map(renderType)}
    </Container>
  );
};

export default GraphQLSchemaViewer;
