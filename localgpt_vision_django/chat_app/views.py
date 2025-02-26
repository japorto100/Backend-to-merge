from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import JSONParser, MultiPartParser, FormParser
from .models import ChatSession, Message
from .serializers import ChatSessionSerializer, MessageSerializer
from models_app.ai_models import AIModelManager
from django.shortcuts import render, get_object_or_404
import base64
import json
import uuid
from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
from files_app.models import UploadedFile
from users_app.models import UserProfile

@login_required
def chat_view(request, session_id=None):
    """Render the chat interface"""
    # Get available AI models
    ai_model_manager = AIModelManager()
    available_models = ai_model_manager.get_available_models()
    
    # Get user's default model
    default_model = request.user.profile.default_model
    
    # Get or create chat session
    if session_id:
        chat_session = get_object_or_404(ChatSession, id=session_id, user=request.user)
    else:
        # Create a new chat session
        chat_session = ChatSession.objects.create(
            user=request.user,
            title="New Chat"
        )
    
    # Get recent chat sessions
    recent_sessions = ChatSession.objects.filter(user=request.user).order_by('-updated_at')[:10]
    
    return render(request, 'chat_app/chat.html', {
        'chat_session': chat_session,
        'recent_sessions': recent_sessions,
        'available_models': available_models,
        'default_model': default_model
    })

class ChatSessionListCreateAPIView(APIView):
    """API view for listing and creating chat sessions"""
    permission_classes = [IsAuthenticated]
    parser_classes = [JSONParser]
    
    def get(self, request):
        """Get all chat sessions for the authenticated user"""
        chat_sessions = ChatSession.objects.filter(user=request.user).order_by('-updated_at')
        serializer = ChatSessionSerializer(chat_sessions, many=True)
        return Response(serializer.data)
    
    def post(self, request):
        """Create a new chat session"""
        serializer = ChatSessionSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(user=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ChatSessionDetailAPIView(APIView):
    """API view for retrieving, updating, and deleting a chat session"""
    permission_classes = [IsAuthenticated]
    parser_classes = [JSONParser]
    
    def get(self, request, session_id):
        """Get a specific chat session"""
        chat_session = get_object_or_404(ChatSession, id=session_id, user=request.user)
        serializer = ChatSessionSerializer(chat_session)
        return Response(serializer.data)
    
    def patch(self, request, session_id):
        """Update a chat session"""
        chat_session = get_object_or_404(ChatSession, id=session_id, user=request.user)
        serializer = ChatSessionSerializer(chat_session, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def delete(self, request, session_id):
        """Delete a chat session"""
        chat_session = get_object_or_404(ChatSession, id=session_id, user=request.user)
        chat_session.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

class MessageListCreateAPIView(APIView):
    """API view for listing and creating messages in a chat session"""
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    
    def get(self, request, session_id):
        """Get all messages for a chat session"""
        chat_session = get_object_or_404(ChatSession, id=session_id, user=request.user)
        messages = Message.objects.filter(session=chat_session).order_by('created_at')
        serializer = MessageSerializer(messages, many=True)
        return Response(serializer.data)
    
    def post(self, request, session_id):
        """Create a new message and get AI response"""
        chat_session = get_object_or_404(ChatSession, id=session_id, user=request.user)
        
        # Check if user has reached their daily message limit
        profile = request.user.profile
        if not profile.can_send_message():
            return Response(
                {"error": "You have reached your daily message limit."},
                status=status.HTTP_429_TOO_MANY_REQUESTS
            )
        
        # Get request data
        content = request.data.get('content')
        model_id = request.data.get('model_id', profile.default_model)
        
        # Check for attached file
        file_id = request.data.get('file_id')
        file_obj = None
        if file_id:
            try:
                file_obj = UploadedFile.objects.get(id=file_id, user=request.user)
            except UploadedFile.DoesNotExist:
                return Response(
                    {"error": "File not found."},
                    status=status.HTTP_404_NOT_FOUND
                )
        
        # Create user message
        user_message = Message.objects.create(
            session=chat_session,
            role='user',
            content=content,
            file=file_obj
        )
        
        # Prepare messages for AI
        ai_messages = []
        
        # Add system message if it exists
        system_message = chat_session.system_message
        if system_message:
            ai_messages.append({
                "role": "system",
                "content": system_message
            })
        
        # Add previous messages (limit to last 20 for context)
        previous_messages = Message.objects.filter(session=chat_session).order_by('created_at')
        for msg in previous_messages:
            message_data = {
                "role": msg.role,
                "content": msg.content
            }
            ai_messages.append(message_data)
        
        # Initialize AI model manager
        ai_model_manager = AIModelManager()
        
        # Check if this is a vision request (has image)
        is_vision_request = False
        if file_obj and file_obj.file_type == 'image':
            is_vision_request = True
            
            # Replace the last message with vision format
            last_message = ai_messages.pop()
            
            # Get image data
            image_path = file_obj.file.path
            base64_image = ai_model_manager.encode_image(image_path)
            
            # Format depends on the model provider
            model_info = ai_model_manager.get_model_info(model_id)
            if not model_info:
                model_id = ai_model_manager.default_vision_model
                model_info = ai_model_manager.get_model_info(model_id)
            
            provider = model_info["provider"]
            
            if provider == "OpenAI":
                # OpenAI vision format
                vision_message = {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": last_message["content"]},
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{base64_image}"
                            }
                        }
                    ]
                }
                ai_messages.append(vision_message)
            
            elif provider == "Anthropic":
                # Anthropic vision format
                vision_message = {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": last_message["content"]},
                        {
                            "type": "image",
                            "source": {
                                "type": "base64",
                                "media_type": "image/jpeg",
                                "data": base64_image
                            }
                        }
                    ]
                }
                ai_messages.append(vision_message)
        
        # Generate AI response
        if is_vision_request:
            ai_response = ai_model_manager.generate_vision_response(
                messages=ai_messages,
                model_id=model_id
            )
        else:
            ai_response = ai_model_manager.generate_response(
                messages=ai_messages,
                model_id=model_id
            )
        
        # Create assistant message with AI response
        assistant_message = Message.objects.create(
            session=chat_session,
            role='assistant',
            content=ai_response.get('content', "I'm sorry, I couldn't generate a response.")
        )
        
        # Update chat session
        chat_session.model_used = model_id
        chat_session.save()
        
        # Increment user's message count
        profile.increment_message_count()
        
        # Return both messages
        user_serializer = MessageSerializer(user_message)
        assistant_serializer = MessageSerializer(assistant_message)
        
        return Response({
            'user_message': user_serializer.data,
            'assistant_message': assistant_serializer.data,
            'model_used': model_id,
            'usage': ai_response.get('usage', {})
        }, status=status.HTTP_201_CREATED)

@login_required
@require_http_methods(["POST"])
def rename_session(request, session_id):
    """Rename a chat session"""
    try:
        data = json.loads(request.body)
        new_title = data.get('title')
        
        if not new_title:
            return JsonResponse({'error': 'Title is required'}, status=400)
        
        chat_session = get_object_or_404(ChatSession, id=session_id, user=request.user)
        chat_session.title = new_title
        chat_session.save()
        
        return JsonResponse({'success': True, 'title': new_title})
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)

@login_required
@require_http_methods(["POST"])
def update_system_message(request, session_id):
    """Update the system message for a chat session"""
    try:
        data = json.loads(request.body)
        system_message = data.get('system_message', '')
        
        chat_session = get_object_or_404(ChatSession, id=session_id, user=request.user)
        chat_session.system_message = system_message
        chat_session.save()
        
        return JsonResponse({'success': True, 'system_message': system_message})
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)
