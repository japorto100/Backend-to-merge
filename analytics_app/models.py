from django.db import models
from django.contrib.auth.models import User

class AnalyticsEvent(models.Model):
    EVENT_TYPES = [
        ('chat', 'Chat'),
        ('search', 'Search'),
        ('file_upload', 'File Upload'),
        ('model_inference', 'Model Inference'),
    ]

    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    event_type = models.CharField(max_length=20, choices=EVENT_TYPES)
    event_data = models.JSONField()
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.event_type} - {self.timestamp}"
