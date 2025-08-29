import { NextApiRequest, NextApiResponse } from 'next';
import { createRouter } from 'next-connect';
import Cors from 'cors';
import fetch from 'node-fetch';

console.log('proxy.tsx is being read');

// Initializing the cors middleware
const cors = Cors({
  methods: ['GET', 'POST', 'OPTIONS'],
});

// Create the router instance
const router = createRouter<NextApiRequest, NextApiResponse>();

// Helper method to wait for a middleware to execute before continuing
function runMiddleware(req: NextApiRequest, res: NextApiResponse, fn: (req: NextApiRequest, res: NextApiResponse, next: (result: any) => void) => void) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) {
        return reject(result);
      }

      return resolve(result);
    });
  });
}

// Helper function to call Cloudflare Workers AI
async function callCloudflareAI(requestBody: any) {
  const response = await fetch('https://llama3-api.fountain-city.workers.dev/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    throw new Error(`Cloudflare API error! status: ${response.status}`);
  }

  return await response.json();
}

// Helper function to call OpenAI API
async function callOpenAI(requestBody: any) {
  const openaiApiKey = process.env.OPENAI_API_KEY;
  
  if (!openaiApiKey) {
    throw new Error('OpenAI API key not configured. Please set OPENAI_API_KEY environment variable.');
  }

  // Convert model ID to OpenAI model name
  const modelMap: { [key: string]: string } = {
    'gpt-3.5-turbo': 'gpt-3.5-turbo',
    'gpt-4': 'gpt-4'
  };

  const openaiModel = modelMap[requestBody.model] || 'gpt-3.5-turbo';

  // Prepare messages for OpenAI format
  const messages = [
    { role: 'system', content: requestBody.system_prompt },
    ...requestBody.messages
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
      max_tokens: requestBody.max_tokens,
      temperature: requestBody.temperature,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null) as any;
    throw new Error(`OpenAI API error! status: ${response.status}, message: ${errorData?.error?.message || 'Unknown error'}`);
  }

  return await response.json();
}

// Define the API route handler
const handler = router
  .use(async (req, res, next) => {
    // Run the cors middleware
    await runMiddleware(req, res, cors);
    next();
  })
  .post(async (req, res) => {
    try {
      const requestBody = req.body;
      console.log('🔄 REST API proxy called with:', requestBody);
      
      let data;
      
      if (requestBody.provider === 'openai') {
        console.log('🤖 Using OpenAI provider via REST');
        data = await callOpenAI(requestBody);
      } else {
        console.log('☁️ Using Cloudflare provider via REST');
        data = await callCloudflareAI(requestBody);
      }

      console.log('✅ REST API response received');
      res.json(data);
    } catch (error) {
      console.error('❌ Error in REST proxy:', error);
      res.status(500).json({ 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

export default handler.handler();
