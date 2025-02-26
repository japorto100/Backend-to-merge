import os
import json
import logging
from typing import Dict, List, Optional, Union, Any
import base64
from io import BytesIO

import openai
import anthropic
import groq
from django.conf import settings
from utils.config_handler import config

# Konfiguriere Logging
logger = logging.getLogger(__name__)

class AIModelManager:
    """
    Manages AI model interactions and responses
    """
    def __init__(self):
        self.models = {}
        self.default_model = config.get("MODELS", "DEFAULT_CHAT_MODEL", "gpt-3.5-turbo")
        self.default_vision_model = config.get("MODELS", "DEFAULT_VISION_MODEL", "gpt-4-vision")
        self.load_models()
        
        # API Keys aus Konfiguration oder Umgebungsvariablen
        self.openai_api_key = config.get("API_KEYS", "OPENAI", os.environ.get("OPENAI_API_KEY", ""))
        self.anthropic_api_key = config.get("API_KEYS", "ANTHROPIC", os.environ.get("ANTHROPIC_API_KEY", ""))
        self.groq_api_key = config.get("API_KEYS", "GROQ", os.environ.get("GROQ_API_KEY", ""))
        
        # Initialisiere API-Clients
        if self.openai_api_key:
            self.openai_client = openai.OpenAI(api_key=self.openai_api_key)
        else:
            self.openai_client = None
            
        if self.anthropic_api_key:
            self.anthropic_client = anthropic.Anthropic(api_key=self.anthropic_api_key)
        else:
            self.anthropic_client = None
            
        if self.groq_api_key:
            self.groq_client = groq.Groq(api_key=self.groq_api_key)
        else:
            self.groq_client = None
    
    def load_models(self):
        """Load available AI models"""
        # OpenAI Modelle
        self.models["gpt-3.5-turbo"] = {
            "name": "GPT-3.5 Turbo",
            "provider": "OpenAI",
            "max_tokens": 4096,
            "vision_capable": False,
            "supports_functions": True,
            "supports_tools": True
        }
        
        self.models["gpt-4"] = {
            "name": "GPT-4",
            "provider": "OpenAI",
            "max_tokens": 8192,
            "vision_capable": False,
            "supports_functions": True,
            "supports_tools": True
        }
        
        self.models["gpt-4-vision"] = {
            "name": "GPT-4 Vision",
            "provider": "OpenAI",
            "max_tokens": 8192,
            "vision_capable": True,
            "supports_functions": True,
            "supports_tools": True
        }
        
        # Anthropic Modelle
        self.models["claude-3-opus"] = {
            "name": "Claude 3 Opus",
            "provider": "Anthropic",
            "max_tokens": 200000,
            "vision_capable": True,
            "supports_functions": False,
            "supports_tools": True
        }
        
        self.models["claude-3-sonnet"] = {
            "name": "Claude 3 Sonnet",
            "provider": "Anthropic",
            "max_tokens": 200000,
            "vision_capable": True,
            "supports_functions": False,
            "supports_tools": True
        }
        
        self.models["claude-3-haiku"] = {
            "name": "Claude 3 Haiku",
            "provider": "Anthropic",
            "max_tokens": 200000,
            "vision_capable": True,
            "supports_functions": False,
            "supports_tools": True
        }
        
        # Groq Modelle
        self.models["llama2-70b-4096"] = {
            "name": "Llama 2 70B",
            "provider": "Groq",
            "max_tokens": 4096,
            "vision_capable": False,
            "supports_functions": False,
            "supports_tools": False
        }
        
        self.models["mixtral-8x7b-32768"] = {
            "name": "Mixtral 8x7B",
            "provider": "Groq",
            "max_tokens": 32768,
            "vision_capable": False,
            "supports_functions": False,
            "supports_tools": False
        }
    
    def get_available_models(self) -> List[Dict[str, Any]]:
        """
        Get a list of available AI models
        
        Returns:
            List of model information dictionaries
        """
        result = []
        for model_id, model_info in self.models.items():
            model_data = model_info.copy()
            model_data["id"] = model_id
            result.append(model_data)
        return result
    
    def get_model_info(self, model_id: str) -> Optional[Dict[str, Any]]:
        """
        Get information about a specific model
        
        Args:
            model_id: The ID of the model
            
        Returns:
            Model information dictionary or None if not found
        """
        if model_id in self.models:
            model_info = self.models[model_id].copy()
            model_info["id"] = model_id
            return model_info
        return None
    
    def encode_image(self, image_path: str) -> str:
        """
        Encode an image to base64
        
        Args:
            image_path: Path to the image file
            
        Returns:
            Base64 encoded image
        """
        with open(image_path, "rb") as image_file:
            return base64.b64encode(image_file.read()).decode('utf-8')
    
    def encode_image_from_bytes(self, image_bytes: bytes) -> str:
        """
        Encode image bytes to base64
        
        Args:
            image_bytes: Image as bytes
            
        Returns:
            Base64 encoded image
        """
        return base64.b64encode(image_bytes).decode('utf-8')
    
    def generate_response(self, 
                         messages: List[Dict[str, str]], 
                         model_id: Optional[str] = None,
                         max_tokens: int = 1000,
                         temperature: float = 0.7,
                         tools: Optional[List[Dict[str, Any]]] = None) -> Dict[str, Any]:
        """
        Generate a response from an AI model
        
        Args:
            messages: List of message dictionaries with 'role' and 'content'
            model_id: ID of the model to use (defaults to default_model)
            max_tokens: Maximum number of tokens to generate
            temperature: Temperature for response generation
            tools: List of tools/functions for the model to use
            
        Returns:
            Response dictionary with 'content' and metadata
        """
        if not model_id:
            model_id = self.default_model
        
        # Check if model exists
        if model_id not in self.models:
            return {
                "error": f"Model {model_id} not found",
                "content": "I'm sorry, the requested AI model is not available."
            }
        
        model_info = self.models[model_id]
        provider = model_info["provider"]
        
        try:
            # OpenAI models
            if provider == "OpenAI":
                if not self.openai_client:
                    return {
                        "error": "OpenAI API key not configured",
                        "content": "I'm sorry, the OpenAI API key is not configured."
                    }
                
                kwargs = {
                    "model": model_id,
                    "messages": messages,
                    "max_tokens": max_tokens,
                    "temperature": temperature
                }
                
                if tools and model_info["supports_tools"]:
                    kwargs["tools"] = tools
                
                response = self.openai_client.chat.completions.create(**kwargs)
                
                return {
                    "content": response.choices[0].message.content,
                    "model": model_id,
                    "finish_reason": response.choices[0].finish_reason,
                    "usage": {
                        "prompt_tokens": response.usage.prompt_tokens,
                        "completion_tokens": response.usage.completion_tokens,
                        "total_tokens": response.usage.total_tokens
                    }
                }
            
            # Anthropic models
            elif provider == "Anthropic":
                if not self.anthropic_client:
                    return {
                        "error": "Anthropic API key not configured",
                        "content": "I'm sorry, the Anthropic API key is not configured."
                    }
                
                # Convert messages to Anthropic format
                system_message = None
                anthropic_messages = []
                
                for msg in messages:
                    if msg["role"] == "system":
                        system_message = msg["content"]
                    else:
                        anthropic_messages.append({
                            "role": msg["role"],
                            "content": msg["content"]
                        })
                
                kwargs = {
                    "model": model_id,
                    "messages": anthropic_messages,
                    "max_tokens": max_tokens,
                    "temperature": temperature
                }
                
                if system_message:
                    kwargs["system"] = system_message
                
                response = self.anthropic_client.messages.create(**kwargs)
                
                return {
                    "content": response.content[0].text,
                    "model": model_id,
                    "finish_reason": response.stop_reason,
                    "usage": {
                        "input_tokens": response.usage.input_tokens,
                        "output_tokens": response.usage.output_tokens
                    }
                }
            
            # Groq models
            elif provider == "Groq":
                if not self.groq_client:
                    return {
                        "error": "Groq API key not configured",
                        "content": "I'm sorry, the Groq API key is not configured."
                    }
                
                response = self.groq_client.chat.completions.create(
                    model=model_id,
                    messages=messages,
                    max_tokens=max_tokens,
                    temperature=temperature
                )
                
                return {
                    "content": response.choices[0].message.content,
                    "model": model_id,
                    "finish_reason": response.choices[0].finish_reason,
                    "usage": {
                        "prompt_tokens": response.usage.prompt_tokens,
                        "completion_tokens": response.usage.completion_tokens,
                        "total_tokens": response.usage.total_tokens
                    }
                }
            
            else:
                return {
                    "error": f"Provider {provider} not supported",
                    "content": "I'm sorry, the requested AI provider is not supported."
                }
                
        except Exception as e:
            logger.error(f"Error generating response: {str(e)}")
            return {
                "error": str(e),
                "content": "I'm sorry, there was an error generating a response."
            }
    
    def generate_vision_response(self,
                               messages: List[Dict[str, Union[str, List[Dict[str, str]]]]],
                               model_id: Optional[str] = None,
                               max_tokens: int = 1000,
                               temperature: float = 0.7) -> Dict[str, Any]:
        """
        Generate a response from a vision-capable AI model
        
        Args:
            messages: List of message dictionaries with 'role' and 'content'
                     Content can be a string or a list of content blocks
            model_id: ID of the model to use (defaults to default_vision_model)
            max_tokens: Maximum number of tokens to generate
            temperature: Temperature for response generation
            
        Returns:
            Response dictionary with 'content' and metadata
        """
        if not model_id:
            model_id = self.default_vision_model
        
        # Check if model exists and is vision-capable
        if model_id not in self.models:
            return {
                "error": f"Model {model_id} not found",
                "content": "I'm sorry, the requested AI model is not available."
            }
        
        model_info = self.models[model_id]
        if not model_info["vision_capable"]:
            return {
                "error": f"Model {model_id} is not vision-capable",
                "content": "I'm sorry, the requested AI model does not support vision capabilities."
            }
        
        provider = model_info["provider"]
        
        try:
            # OpenAI vision models
            if provider == "OpenAI":
                if not self.openai_client:
                    return {
                        "error": "OpenAI API key not configured",
                        "content": "I'm sorry, the OpenAI API key is not configured."
                    }
                
                response = self.openai_client.chat.completions.create(
                    model=model_id,
                    messages=messages,
                    max_tokens=max_tokens,
                    temperature=temperature
                )
                
                return {
                    "content": response.choices[0].message.content,
                    "model": model_id,
                    "finish_reason": response.choices[0].finish_reason,
                    "usage": {
                        "prompt_tokens": response.usage.prompt_tokens,
                        "completion_tokens": response.usage.completion_tokens,
                        "total_tokens": response.usage.total_tokens
                    }
                }
            
            # Anthropic vision models
            elif provider == "Anthropic":
                if not self.anthropic_client:
                    return {
                        "error": "Anthropic API key not configured",
                        "content": "I'm sorry, the Anthropic API key is not configured."
                    }
                
                # Convert messages to Anthropic format
                system_message = None
                anthropic_messages = []
                
                for msg in messages:
                    if msg["role"] == "system":
                        system_message = msg["content"]
                    else:
                        anthropic_messages.append(msg)
                
                kwargs = {
                    "model": model_id,
                    "messages": anthropic_messages,
                    "max_tokens": max_tokens,
                    "temperature": temperature
                }
                
                if system_message:
                    kwargs["system"] = system_message
                
                response = self.anthropic_client.messages.create(**kwargs)
                
                return {
                    "content": response.content[0].text,
                    "model": model_id,
                    "finish_reason": response.stop_reason,
                    "usage": {
                        "input_tokens": response.usage.input_tokens,
                        "output_tokens": response.usage.output_tokens
                    }
                }
            
            else:
                return {
                    "error": f"Provider {provider} does not support vision",
                    "content": "I'm sorry, the requested AI provider does not support vision capabilities."
                }
                
        except Exception as e:
            logger.error(f"Error generating vision response: {str(e)}")
            return {
                "error": str(e),
                "content": "I'm sorry, there was an error generating a vision response."
            }
    
    def process_document(self, file_path: str, file_type: str) -> Dict[str, Any]:
        """
        Process a document with AI
        
        Args:
            file_path: Path to the document file
            file_type: Type of the document (pdf, docx, etc.)
            
        Returns:
            Processing results
        """
        try:
            # Placeholder for document processing
            # In a real implementation, this would extract text from the document
            # and potentially use an AI model to analyze it
            
            return {
                "success": True,
                "file_type": file_type,
                "content_summary": "Document processed successfully",
                "extracted_text": "This is placeholder extracted text from the document."
            }
        except Exception as e:
            logger.error(f"Error processing document: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            } 