from rest_framework import serializers
from .models import UploadedFile, ModelConfig

class UploadedFileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UploadedFile
        fields = ['id', 'file', 'file_type', 'uploaded_at', 'processed', 'processing_results']
        read_only_fields = ['id', 'uploaded_at', 'processed', 'processing_results']

class ModelConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = ModelConfig
        fields = ['id', 'name', 'model_type', 'config', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']