"""
Hugging Face Inference API Service
Handles communication with fine-tuned models hosted on Hugging Face
"""

import os
import requests
import logging
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

class HuggingFaceService:
    """Service for interacting with Hugging Face Inference API"""
    
    def __init__(self):
        self.api_token = os.getenv('HUGGINGFACE_TOKEN')
        # TODO: Fine-tuned model (elmunoz42/llama3-ev-finetuned-v-0-0-2) is not available on free Inference API
        # Using a public model for now. To use your fine-tuned model, deploy it via:
        # - Hugging Face Inference Endpoints (paid)
        # - Hugging Face Space with API
        # - Local deployment
        self.model_id = os.getenv('HUGGINGFACE_MODEL_ID', 'meta-llama/Llama-3.2-1B-Instruct')
        self.api_url = f"https://api-inference.huggingface.co/models/{self.model_id}"
        
        if not self.api_token:
            logger.warning("HUGGINGFACE_TOKEN not found in environment variables")
    
    def generate_response(
        self,
        prompt: str,
        temperature: float = 0.7,
        max_tokens: int = 500,
        top_p: float = 0.9,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Generate a response using the Hugging Face model
        
        Args:
            prompt: Input text prompt
            temperature: Sampling temperature (0.0-1.0)
            max_tokens: Maximum tokens to generate
            top_p: Top-p sampling parameter
            **kwargs: Additional model parameters
            
        Returns:
            Dict containing the generated response and metadata
        """
        if not self.api_token:
            return {
                'error': 'Hugging Face API token not configured',
                'message': 'Please set HUGGINGFACE_TOKEN in environment variables'
            }
        
        headers = {
            "Authorization": f"Bearer {self.api_token}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "inputs": prompt,
            "parameters": {
                "temperature": temperature,
                "max_new_tokens": max_tokens,
                "top_p": top_p,
                "return_full_text": False,
                "do_sample": True,
            }
        }
        
        try:
            logger.info(f"Sending request to Hugging Face model: {self.model_id}")
            response = requests.post(
                self.api_url,
                headers=headers,
                json=payload,
                timeout=30
            )
            
            if response.status_code == 200:
                result = response.json()
                
                # Handle different response formats
                if isinstance(result, list) and len(result) > 0:
                    generated_text = result[0].get('generated_text', '')
                elif isinstance(result, dict):
                    generated_text = result.get('generated_text', '')
                else:
                    generated_text = str(result)
                
                logger.info("Successfully generated response from Hugging Face model")
                return {
                    'response': generated_text,
                    'model': self.model_id,
                    'provider': 'huggingface',
                    'success': True
                }
            
            elif response.status_code == 503:
                # Model is loading
                error_data = response.json()
                estimated_time = error_data.get('estimated_time', 20)
                return {
                    'error': 'Model is loading',
                    'message': f'The model is currently loading. Please try again in {estimated_time} seconds.',
                    'estimated_time': estimated_time,
                    'success': False
                }
            
            else:
                error_message = response.text
                logger.error(f"Hugging Face API error: {response.status_code} - {error_message}")
                return {
                    'error': f'API request failed with status {response.status_code}',
                    'message': error_message,
                    'success': False
                }
                
        except requests.exceptions.Timeout:
            logger.error("Hugging Face API request timed out")
            return {
                'error': 'Request timeout',
                'message': 'The request to Hugging Face API timed out. Please try again.',
                'success': False
            }
        
        except requests.exceptions.RequestException as e:
            logger.error(f"Network error when calling Hugging Face API: {str(e)}")
            return {
                'error': 'Network error',
                'message': f'Failed to connect to Hugging Face API: {str(e)}',
                'success': False
            }
        
        except Exception as e:
            logger.error(f"Unexpected error in HuggingFace service: {str(e)}")
            return {
                'error': 'Unexpected error',
                'message': str(e),
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
        Chat interface for the Hugging Face model
        
        Args:
            message: User message
            system_prompt: Optional system prompt to guide the model
            temperature: Sampling temperature
            max_tokens: Maximum tokens to generate
            **kwargs: Additional parameters
            
        Returns:
            Dict containing the chat response
        """
        # Format the prompt with system message if provided
        if system_prompt:
            full_prompt = f"System: {system_prompt}\n\nUser: {message}\n\nAssistant:"
        else:
            full_prompt = f"User: {message}\n\nAssistant:"
        
        return self.generate_response(
            prompt=full_prompt,
            temperature=temperature,
            max_tokens=max_tokens,
            **kwargs
        )
    
    def check_model_status(self) -> Dict[str, Any]:
        """
        Check if the model is available and ready
        
        Returns:
            Dict containing model status information
        """
        if not self.api_token:
            return {
                'available': False,
                'message': 'API token not configured'
            }
        
        headers = {
            "Authorization": f"Bearer {self.api_token}"
        }
        
        try:
            response = requests.get(self.api_url, headers=headers, timeout=10)
            return {
                'available': response.status_code == 200,
                'status_code': response.status_code,
                'model_id': self.model_id
            }
        except Exception as e:
            return {
                'available': False,
                'error': str(e)
            }


# Global instance
huggingface_service = HuggingFaceService()
