# Llama Text Interface

A Next.js application that provides a chat interface for interacting with local Large Language Models (LLMs) through Jan.ai.

## Prerequisites

- Node.js (v18 or later)
- The main branch works with a llama 2 endpoint hosted at Cloudflare PLEASE DON'T OVERUSE THE TOKENS.
- For the local branch you'll need Jan.ai desktop application installed
- A compatible language model downloaded in Jan.ai (e.g., Llama 3.2 3B Instruct)

## Setup

1. Clone the repository:

```bash
git clone <repository-url>
cd <project-directory>
```

2. Install dependencies:

```bash
npm install
```

3. Start Jan.ai and ensure it's running on port 1337 (default port)

4. Start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Project Structure

```
├── pages/
│   ├── api/
│   │   └── proxy.tsx    # Backend proxy for Jan.ai API
│   └── aichat.tsx       # Main chat interface component
├── package.json
└── README.md
```

## Key Features

- Real-time chat interface
- Integration with local LLMs through Jan.ai
- Material-UI components for modern styling
- Error handling and loading states
- Support for multiline messages

## Technical Details

### Frontend (aichat.tsx)

- Built with React and Material-UI
- Handles message state and UI interactions
- Supports keyboard shortcuts (Enter to send)
- Responsive design with message bubbles

### Backend (proxy.tsx)

- Proxies requests to Jan.ai API
- Handles CORS and request transformation
- Provides error handling and response formatting

### API Integration

- Endpoint: `http://localhost:1337/v1/chat/completions`
- Model: "llama3.2-3b-instruct" (configurable)
- Supports streaming responses (currently disabled for simplicity)

## Configuration

Default model parameters:

```javascript
{
  max_tokens: 2048,
  temperature: 0.7,
  top_p: 0.95,
  stream: false
}
```

## Dependencies

- Next.js
- Material-UI
- node-fetch
- cors
- next-connect

## Error Handling

The application includes comprehensive error handling for:

- API connection failures
- Invalid responses
- Rate limiting
- Network issues

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## Troubleshooting

### Common Issues

1. Connection refused errors:

   - Ensure Jan.ai is running
   - Check if the correct port (1337) is being used
   - Verify no firewall is blocking the connection

2. Model not found:

   - Verify the model name in proxy.tsx matches your Jan.ai installation
   - Ensure the model is downloaded in Jan.ai

3. CORS errors:
   - Check that the CORS middleware is properly configured
   - Verify the frontend is making requests to the correct URL

## License

MIT

## Acknowledgments

- Jan.ai team for providing the local LLM infrastructure
- Material-UI for the component library
