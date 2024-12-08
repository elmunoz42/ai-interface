import { NextApiRequest, NextApiResponse } from 'next';
import { createRouter } from 'next-connect';
import Cors from 'cors';
import fetch from 'node-fetch';

// Initialize cors middleware
const cors = Cors({
  methods: ['POST', 'OPTIONS'], // Updated to allow POST requests
});

// Create router instance
const router = createRouter<NextApiRequest, NextApiResponse>();

// Helper method to run middleware
function runMiddleware(
  req: NextApiRequest,
  res: NextApiResponse,
  fn: (req: NextApiRequest, res: NextApiResponse, next: (result: any) => void) => void
) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
}

// Define API route handler
const handler = router
  .use(async (req, res, next) => {
    await runMiddleware(req, res, cors);
    next();
  })
  .post(async (req, res) => { // Changed from .get to .post
    try {
      // Construct the message payload
      const payload = {
        messages: [
          {
            content: "You are a helpful assistant.",
            role: "system"
          },
          {
            content: req.body.query, // Get the query from the request body
            role: "user"
          }
        ],
        model: "llama-3.2-3b-instruct-q8", // Updated model name
        stream: false, // Set to false for simplicity, can be made configurable
        max_tokens: 2048,
        temperature: 0.7,
        top_p: 0.95
      };

      // Make request to Jan.ai endpoint
      const response = await fetch('http://localhost:1337/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const data = await response.json();

      // Transform the response to match your frontend expectations
      const transformedResponse = [{
        inputs: {
          messages: payload.messages
        },
        response: {
          response: data.choices[0].message.content
        }
      }];

      res.json(transformedResponse);
    } catch (error) {
      console.error('Error in proxy:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

export default handler.handler();