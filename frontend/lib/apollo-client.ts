import { ApolloClient, InMemoryCache, gql, createHttpLink } from '@apollo/client';

// Create HTTP link
const httpLink = createHttpLink({
  uri: '/api/graphql',
});

// Create Apollo Client instance
export const apolloClient = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache(),
});

// GraphQL mutations
export const CREATE_CHAT_COMPLETION = gql`
  mutation CreateChatCompletion($input: ChatCompletionInput!) {
    createChatCompletion(input: $input) {
      id
      object
      created
      model
      choices {
        index
        message {
          role
          content
        }
        finish_reason
      }
      usage {
        prompt_tokens
        completion_tokens
        total_tokens
      }
    }
  }
`;

// GraphQL queries
export const HELLO_QUERY = gql`
  query Hello {
    hello
  }
`;
