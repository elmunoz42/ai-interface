import { NextApiRequest, NextApiResponse } from 'next';
import { createRouter } from 'next-connect'; // Correct import for createRouter
import Cors from 'cors';
import fetch from 'node-fetch';
console.log('proxy.tsx is being read');

// Initializing the cors middleware
const cors = Cors({
  methods: ['GET', 'HEAD'],
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
  .get(async (req, res) => { // Define the method (GET) for the route
    // Extract the query parameters and convert them to a string
    const query = new URLSearchParams(req.query as Record<string, string>).toString();

    // Include the query parameters in the request to the external API
    const response = await fetch(`https://worker-sparkling-star-5ba6.elmunoz42.workers.dev/?${query}`);
    const data = await response.json();
    res.json(data);
  });

export default handler.handler(); // Export the handler from the router