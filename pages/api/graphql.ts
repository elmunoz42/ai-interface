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
    model: String = "llama-3-8b-instruct"
    provider: String = "cloudflare"
  }

  type Query {
    hello: String
  }

  type Mutation {
    createChatCompletion(input: ChatCompletionInput!): ChatCompletion!
  }
`;

// Helper function to call Cloudflare Workers AI
async function callCloudflareAI(input: any) {
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
    throw new Error(`Cloudflare API error! status: ${response.status}`);
  }

  return await response.json();
}

// Helper function to call OpenAI API
async function callOpenAI(input: any) {
  const openaiApiKey = process.env.OPENAI_API_KEY;
  
  if (!openaiApiKey) {
    throw new Error('OpenAI API key not configured. Please set OPENAI_API_KEY environment variable.');
  }

  // Convert model ID to OpenAI model name
  const modelMap: { [key: string]: string } = {
    'gpt-3.5-turbo': 'gpt-3.5-turbo',
    'gpt-4': 'gpt-4'
  };

  const openaiModel = modelMap[input.model] || 'gpt-3.5-turbo';

  // Prepare messages for OpenAI format
  const messages = [
    { role: 'system', content: input.system_prompt },
    ...input.messages
  ];

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${openaiApiKey}`,
    },
    body: JSON.stringify({
      model: openaiModel,
      messages: messages,
      max_tokens: input.max_tokens,
      temperature: input.temperature,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(`OpenAI API error! status: ${response.status}, message: ${errorData?.error?.message || 'Unknown error'}`);
  }

  return await response.json();
}

// GraphQL resolvers
const resolvers = {
  Query: {
    hello: () => 'Hello from GraphQL!',
  },
  Mutation: {
    createChatCompletion: async (_: any, { input }: { input: any }) => {
      try {
        console.log('🔄 GraphQL resolver called with input:', input);
        
        let data;
        
        if (input.provider === 'openai') {
          console.log('🤖 Using OpenAI provider');
          data = await callOpenAI(input);
        } else {
          console.log('☁️ Using Cloudflare provider');
          data = await callCloudflareAI(input);
        }

        console.log('✅ API response received:', data);
        return data;
      } catch (error) {
        console.error('❌ Error in GraphQL resolver:', error);
        throw new Error(`Failed to create chat completion: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },
  },
};

// Create Apollo Server instance
const server = new ApolloServer({
  typeDefs,
  resolvers,
  introspection: true, // Enable introspection for development
});

// Create the Next.js handler
const handler = startServerAndCreateNextHandler(server, {
  context: async (req: NextApiRequest, res: NextApiResponse) => ({ req, res }),
});

export default handler;
