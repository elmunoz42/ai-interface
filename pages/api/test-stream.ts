import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('🧪 Test streaming API called');

  // Set headers for Server-Sent Events
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    const testWords = ['Hello', 'this', 'is', 'a', 'test', 'streaming', 'response'];
    
    console.log('🧪 Starting test stream with', testWords.length, 'words');

    for (let i = 0; i < testWords.length; i++) {
      const word = testWords[i];
      const isLast = i === testWords.length - 1;
      
      console.log('🧪 Sending word:', word);
      res.write(`data: ${JSON.stringify({ content: word + (isLast ? '' : ' ') })}\n\n`);
      
      // Wait a bit between words
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    console.log('🧪 Sending [DONE] signal');
    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    console.error('🧪 Test streaming error:', error);
    res.write(`data: ${JSON.stringify({ error: 'Test failed' })}\n\n`);
    res.end();
  }
}
