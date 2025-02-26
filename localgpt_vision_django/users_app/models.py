from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone

class UserProfile(models.Model):
    """Extended user profile information"""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    
    # Preferences
    theme = models.CharField(max_length=20, default='light', choices=[
        ('light', 'Light'),
        ('dark', 'Dark'),
        ('system', 'System Default')
    ])
    
    default_model = models.CharField(max_length=50, default='gpt-3.5-turbo')
    
    # API keys (encrypted in a real implementation)
    openai_api_key = models.CharField(max_length=255, blank=True, null=True)
    anthropic_api_key = models.CharField(max_length=255, blank=True, null=True)
    
    # Usage limits
    daily_message_limit = models.IntegerField(default=100)
    daily_file_upload_limit = models.IntegerField(default=10)
    
    # Usage statistics
    messages_sent_today = models.IntegerField(default=0)
    files_uploaded_today = models.IntegerField(default=0)
    last_usage_reset = models.DateField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.user.username}'s profile"
    
    def reset_daily_usage(self):
        """Reset daily usage counters"""
        self.messages_sent_today = 0
        self.files_uploaded_today = 0
        self.last_usage_reset = timezone.now().date()
        self.save()
    
    def can_send_message(self):
        """Check if user can send more messages today"""
        # Reset counters if it's a new day
        today = timezone.now().date()
        if self.last_usage_reset != today:
            self.reset_daily_usage()
        
        return self.messages_sent_today < self.daily_message_limit
    
    def can_upload_file(self):
        """Check if user can upload more files today"""
        # Reset counters if it's a new day
        today = timezone.now().date()
        if self.last_usage_reset != today:
            self.reset_daily_usage()
        
        return self.files_uploaded_today < self.daily_file_upload_limit
    
    def increment_message_count(self):
        """Increment the messages sent counter"""
        # Reset counters if it's a new day
        today = timezone.now().date()
        if self.last_usage_reset != today:
            self.reset_daily_usage()
        
        self.messages_sent_today += 1
        self.save()
    
    def increment_file_upload_count(self):
        """Increment the files uploaded counter"""
        # Reset counters if it's a new day
        today = timezone.now().date()
        if self.last_usage_reset != today:
            self.reset_daily_usage()
        
        self.files_uploaded_today += 1
        self.save()

@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    """Create a UserProfile for every new User"""
    if created:
        UserProfile.objects.create(user=instance)

@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    """Save the UserProfile when the User is saved"""
    instance.profile.save()