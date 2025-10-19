"""
Hugging Face Space Service
Handles communication with fine-tuned models hosted on Hugging Face Spaces
"""

import os
import logging
from typing import Dict, Any, Optional
from gradio_client import Client

logger = logging.getLogger(__name__)

class HuggingFaceService:
    """Service for interacting with Hugging Face Space (EV Fine-tuned Llama 3)"""
    
    def __init__(self):
        # Space URL for your deployed model
        self.space_url = os.getenv(
            'HUGGINGFACE_SPACE_URL',
            'https://elmunoz42-llama3-ev-finetuned.hf.space/'
        )
        self.model_id = "elmunoz42/llama3-ev-finetuned-v-0-0-2"
        self.client = None
        
        # Initialize Gradio client
        try:
            logger.info(f"Connecting to Hugging Face Space: {self.space_url}")
            self.client = Client(self.space_url)
            logger.info("Successfully connected to Hugging Face Space")
        except Exception as e:
            logger.error(f"Failed to initialize Gradio client: {str(e)}")
            self.client = None
    
    def generate_response(
        self,
        message: str,
        temperature: float = 0.7,
        max_tokens: int = 500,
        system_prompt: str = "",
        **kwargs
    ) -> Dict[str, Any]:
        """
        Generate a response using the Hugging Face Space
        
        Args:
            message: User message
            temperature: Sampling temperature (0.0-1.0)
            max_tokens: Maximum tokens to generate
            system_prompt: Optional system prompt
            **kwargs: Additional parameters
            
        Returns:
            Dict containing the generated response and metadata
        """
        if not self.client:
            return {
                'error': 'Hugging Face Space client not initialized',
                'message': 'Failed to connect to the Space. Please check the HUGGINGFACE_SPACE_URL.',
                'success': False
            }
        
        try:
            logger.info(f"Sending request to Hugging Face Space: {self.model_id}")
            
            # Call the Space's chat function using positional arguments
            # Gradio ChatInterface expects: message, then additional_inputs in order
            # Order: message, temperature, max_tokens, system_prompt
            result = self.client.predict(
                message,           # message (positional arg 0)
                temperature,       # temperature slider (additional_input 0)
                max_tokens,        # max_tokens slider (additional_input 1)
                system_prompt,     # system_prompt textbox (additional_input 2)
                api_name="/chat"
            )
            
            # Result is the generated text from the model
            logger.info("Successfully generated response from Hugging Face Space")
            return {
                'response': result,
                'model': self.model_id,
                'provider': 'huggingface-space',
                'success': True
            }
                
        except Exception as e:
            error_msg = str(e)
            logger.error(f"Error calling Hugging Face Space: {error_msg}")
            
            # Check for specific error types
            if "Could not connect" in error_msg or "Connection" in error_msg:
                return {
                    'error': 'Connection error',
                    'message': f'Failed to connect to Hugging Face Space: {error_msg}',
                    'success': False
                }
            elif "timeout" in error_msg.lower():
                return {
                    'error': 'Request timeout',
                    'message': 'The Space took too long to respond. It may be starting up (Zero GPU cold start).',
                    'success': False
                }
            else:
                return {
                    'error': 'Unexpected error',
                    'message': f'Error from Hugging Face Space: {error_msg}',
                    'success': False
                }
    
    def chat(
        self,
        message: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 500,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Chat interface for the Hugging Face Space
        
        Args:
            message: User message
            system_prompt: Optional system prompt to guide the model
            temperature: Sampling temperature
            max_tokens: Maximum tokens to generate
            **kwargs: Additional parameters
            
        Returns:
            Dict containing the chat response
        """
        # Call generate_response with the message directly
        return self.generate_response(
            message=message,
            temperature=temperature,
            max_tokens=max_tokens,
            system_prompt=system_prompt or "",
            **kwargs
        )
    
    def check_model_status(self) -> Dict[str, Any]:
        """
        Check if the Hugging Face Space is available and ready
        
        Returns:
            Dict containing Space status information
        """
        if not self.client:
            return {
                'available': False,
                'message': 'Space client not initialized',
                'model_id': self.model_id,
                'space_url': self.space_url
            }
        
        try:
            # Try a simple test to see if the Space is responsive
            # Just checking if client is initialized means Space is accessible
            return {
                'available': True,
                'model_id': self.model_id,
                'space_url': self.space_url,
                'message': 'Space is ready'
            }
        except Exception as e:
            return {
                'available': False,
                'error': str(e),
                'model_id': self.model_id,
                'space_url': self.space_url
            }


# Global instance
huggingface_service = HuggingFaceService()
