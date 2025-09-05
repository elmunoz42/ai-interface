import { apolloClient, HELLO_QUERY, CREATE_CHAT_COMPLETION } from '../lib/apollo-client';

// Test function to verify GraphQL connectivity
export const testGraphQLConnection = async () => {
  try {
    console.log('Testing GraphQL connection...');
    
    // Test simple query
    const { data } = await apolloClient.query({
      query: HELLO_QUERY,
    });
    
    console.log('Hello query result:', data);
    return data;
  } catch (error) {
    console.error('GraphQL connection test failed:', error);
    throw error;
  }
};

// Test function for chat completion
export const testChatCompletion = async () => {
  try {
    console.log('Testing chat completion...');
    
    const input = {
      messages: [
        { role: 'user', content: 'Hello, how are you?' }
      ],
      max_tokens: 100,
      temperature: 0.7,
      system_prompt: 'You are a helpful assistant.'
    };
    
    const { data } = await apolloClient.mutate({
      mutation: CREATE_CHAT_COMPLETION,
      variables: { input },
    });
    
    console.log('Chat completion result:', data);
    return data;
  } catch (error) {
    console.error('Chat completion test failed:', error);
    throw error;
  }
};
