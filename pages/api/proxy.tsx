import { NextApiRequest, NextApiResponse } from 'next';
import { createRouter } from 'next-connect'; // Correct import for createRouter
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
// And to throw an error when an error happens in a middleware
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

// Define the API route handler
const handler = router
  .use(async (req, res, next) => {
    // Run the cors middleware
    await runMiddleware(req, res, cors);
    next(); // Call next() to pass control to the next middleware
  })
  .post(async (req, res) => { // Changed to POST method for the Llama 3 endpoint
    try {
      // The request body should contain the chat completion parameters
      const requestBody = req.body;
      
      // Make the request to the Llama 3 endpoint
      const response = await fetch('https://llama3-api.fountain-city.workers.dev/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error('Error in proxy:', error);
      res.status(500).json({ 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

export default handler.handler(); // Export the handler from the router