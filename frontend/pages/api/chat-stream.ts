import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('🌊 Chat-stream API called:', req.method);
  
  if (req.method !== 'POST') {
    console.log('❌ Method not allowed:', req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { messages, max_tokens, temperature, system_prompt, model, provider } = req.body;

    console.log('🔄 Streaming API called with:', { 
      provider, 
      model, 
      messages: messages?.length,
      temperature,
      max_tokens 
    });

    // Set headers for Server-Sent Events
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    console.log('📡 Headers set, starting streaming...');

    if (provider === 'openai') {
      console.log('🤖 Calling OpenAI streaming');
      await streamOpenAI(req.body, res);
    } else {
      console.log('☁️ Calling Cloudflare streaming');
      await streamCloudflare(req.body, res);
    }
  } catch (error) {
    console.error('❌ Streaming error:', error);
    res.write(`data: ${JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' })}\n\n`);
    res.end();
  }
}

async function streamOpenAI(requestBody: any, res: NextApiResponse) {
  const openaiApiKey = process.env.OPENAI_API_KEY;
  
  if (!openaiApiKey) {
    throw new Error('OpenAI API key not configured');
  }

  const modelMap: { [key: string]: string } = {
    'gpt-3.5-turbo': 'gpt-3.5-turbo',
    'gpt-4': 'gpt-4'
  };

  const openaiModel = modelMap[requestBody.model] || 'gpt-3.5-turbo';

  const messages = [
    { role: 'system', content: requestBody.system_prompt },
    ...requestBody.messages
  ];

  console.log('🤖 Streaming OpenAI request');

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
      stream: true,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error! status: ${response.status}`);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('No response body');
  }

  const decoder = new TextDecoder();

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') {
            res.write('data: [DONE]\n\n');
            continue;
          }

          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              res.write(`data: ${JSON.stringify({ content })}\n\n`);
            }
          } catch (e) {
            // Skip invalid JSON lines
            continue;
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
    res.end();
  }
}

async function streamCloudflare(requestBody: any, res: NextApiResponse) {
  console.log('☁️ Streaming Cloudflare request');
  console.log('☁️ Request body:', {
    messages: requestBody.messages?.length,
    max_tokens: requestBody.max_tokens,
    temperature: requestBody.temperature
  });

  try {
    // For now, we'll simulate streaming since the Cloudflare endpoint might not support it
    // First try to get the full response
    console.log('☁️ Making request to Cloudflare API...');
    const response = await fetch('https://llama3-api.fountain-city.workers.dev/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: requestBody.messages,
        max_tokens: requestBody.max_tokens,
        temperature: requestBody.temperature,
        system_prompt: requestBody.system_prompt,
      }),
    });

    console.log('☁️ Cloudflare API response:', response.status, response.statusText);

    if (!response.ok) {
      throw new Error(`Cloudflare API error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('☁️ Cloudflare API data received:', {
      hasChoices: !!data.choices,
      choicesLength: data.choices?.length,
      hasContent: !!data.choices?.[0]?.message?.content
    });
    
    const fullText = data.choices[0].message.content;
    console.log('☁️ Full text to stream:', fullText.substring(0, 100) + '...');

    // Simulate streaming by sending chunks
    const words = fullText.split(' ');
    const chunkSize = 3; // Send 3 words at a time
    console.log('☁️ Starting simulated streaming with', words.length, 'words');

    for (let i = 0; i < words.length; i += chunkSize) {
      const chunk = words.slice(i, i + chunkSize).join(' ');
      const isLast = i + chunkSize >= words.length;
      
      const content = chunk + (isLast ? '' : ' ');
      console.log('☁️ Sending chunk:', content);
      
      res.write(`data: ${JSON.stringify({ content })}\n\n`);
      
      // Add a small delay to simulate real streaming
      await new Promise(resolve => setTimeout(resolve, 150));
    }

    console.log('☁️ Sending [DONE] signal');
    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    console.error('❌ Cloudflare streaming error:', error);
    throw error;
  }
}
