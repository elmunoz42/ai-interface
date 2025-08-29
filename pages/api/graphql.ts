import { ApolloServer } from '@apollo/server';
import { startServerAndCreateNextHandler } from '@as-integrations/next';
import { gql } from 'graphql-tag';
import { NextApiRequest, NextApiResponse } from 'next';

// GraphQL schema definition
const typeDefs = gql`
  type Message {
    role: String!
    content: String!
  }

  type ChatChoice {
    index: Int!
    message: Message!
    finish_reason: String!
  }

  type ChatUsage {
    prompt_tokens: Int!
    completion_tokens: Int!
    total_tokens: Int!
  }

  type ChatCompletion {
    id: String!
    object: String!
    created: Int!
    model: String!
    choices: [ChatChoice!]!
    usage: ChatUsage!
  }

  input MessageInput {
    role: String!
    content: String!
  }

  input ChatCompletionInput {
    messages: [MessageInput!]!
    max_tokens: Int = 1000
    temperature: Float = 0.7
    system_prompt: String = "You are a helpful assistant."
  }

  type Query {
    hello: String
  }

  type Mutation {
    createChatCompletion(input: ChatCompletionInput!): ChatCompletion!
  }
`;

// GraphQL resolvers
const resolvers = {
  Query: {
    hello: () => 'Hello from GraphQL!',
  },
  Mutation: {
    createChatCompletion: async (_: any, { input }: { input: any }) => {
      try {
        // Make the request to the Llama 3 endpoint
        const response = await fetch('https://llama3-api.fountain-city.workers.dev/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messages: input.messages,
            max_tokens: input.max_tokens,
            temperature: input.temperature,
            system_prompt: input.system_prompt,
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
      } catch (error) {
        console.error('Error in GraphQL resolver:', error);
        throw new Error(`Failed to create chat completion: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },
  },
};

// Create Apollo Server instance
const server = new ApolloServer({
  typeDefs,
  resolvers,
});

// Create the Next.js handler
const handler = startServerAndCreateNextHandler(server, {
  context: async (req: NextApiRequest, res: NextApiResponse) => ({ req, res }),
});

export default handler;
