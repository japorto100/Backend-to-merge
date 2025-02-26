from django.contrib import admin
from .models import UploadedFile, ModelConfig

@admin.register(UploadedFile)
class UploadedFileAdmin(admin.ModelAdmin):
    list_display = ('file', 'file_type', 'uploaded_at', 'processed')
    list_filter = ('file_type', 'processed', 'uploaded_at')
    search_fields = ('file',)

@admin.register(ModelConfig)
class ModelConfigAdmin(admin.ModelAdmin):
    list_display = ('name', 'model_type', 'is_active', 'updated_at')
    list_filter = ('model_type', 'is_active')
    search_fields = ('name',)
