from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from .models import UploadedFile, ModelConfig
from .serializers import UploadedFileSerializer, ModelConfigSerializer
from .ai_models import AIModelManager
from django.shortcuts import render
import logging

class ModelListView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Get all available models"""
        ai_model_manager = AIModelManager()
        available_models = ai_model_manager.get_available_models()
        return Response(available_models)

class FileUploadView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]
    
    def post(self, request):
        """Upload a file for processing"""
        serializer = UploadedFileSerializer(data=request.data)
        if serializer.is_valid():
            # Save the file
            uploaded_file = serializer.save(user=request.user)
            
            try:
                # Process the file based on its type
                ai_model_manager = AIModelManager()
                processing_results = ai_model_manager.process_file(
                    uploaded_file.file.path,
                    uploaded_file.file_type
                )
                
                # Update the file with processing results
                uploaded_file.processed = True
                uploaded_file.processing_results = processing_results
                uploaded_file.save()
                
                # Create analytics event for file upload
                from analytics_app.models import AnalyticsEvent
                AnalyticsEvent.objects.create(
                    user=request.user,
                    event_type='file_upload',
                    data={
                        'file_id': str(uploaded_file.id),
                        'file_type': uploaded_file.file_type,
                        'file_name': uploaded_file.file.name,
                        'processing_status': 'success'
                    }
                )
                
                return Response(UploadedFileSerializer(uploaded_file).data, status=status.HTTP_201_CREATED)
            except Exception as e:
                # Log the error
                logger = logging.getLogger(__name__)
                logger.error(f"Error processing file: {str(e)}")
                
                # Update the file with error
                uploaded_file.processed = False
                uploaded_file.processing_results = {
                    'status': 'error',
                    'error': str(e)
                }
                uploaded_file.save()
                
                # Create analytics event for file upload error
                from analytics_app.models import AnalyticsEvent
                AnalyticsEvent.objects.create(
                    user=request.user,
                    event_type='file_upload_error',
                    data={
                        'file_id': str(uploaded_file.id),
                        'file_type': uploaded_file.file_type,
                        'file_name': uploaded_file.file.name,
                        'error': str(e)
                    }
                )
                
                return Response({
                    'error': f"Error processing file: {str(e)}",
                    'file': UploadedFileSerializer(uploaded_file).data
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

def upload_view(request):
    """Render the file upload interface"""
    return render(request, 'models_app/upload.html')
