import time
import json
from django.utils import timezone
from .models import AnalyticsEvent

class RequestLoggingMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Code to be executed for each request before the view is called
        start_time = time.time()
        
        # Process the request
        response = self.get_response(request)
        
        # Code to be executed for each request after the view is called
        duration = time.time() - start_time
        
        # Only log API requests
        if request.path.startswith('/api/'):
            # Don't log sensitive endpoints
            if not request.path.startswith('/api/users/'):
                self.log_request(request, response, duration)
        
        return response
    
    def log_request(self, request, response, duration):
        """Log the request to the database"""
        # Get user if authenticated
        user = request.user if request.user.is_authenticated else None
        
        # Get request data
        try:
            if request.method in ['POST', 'PUT', 'PATCH']:
                if request.content_type == 'application/json':
                    request_data = json.loads(request.body)
                else:
                    request_data = request.POST.dict()
                
                # Remove sensitive data
                if 'password' in request_data:
                    request_data['password'] = '[REDACTED]'
                if 'api_key' in request_data:
                    request_data['api_key'] = '[REDACTED]'
            else:
                request_data = request.GET.dict()
        except:
            request_data = {}
        
        # Create analytics event
        AnalyticsEvent.objects.create(
            user=user,
            event_type='api_request',
            endpoint=request.path,
            method=request.method,
            status_code=response.status_code,
            response_time=duration,
            ip_address=self.get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT', ''),
            data={
                'request': request_data,
                'response_status': response.status_code
            }
        )
    
    def get_client_ip(self, request):
        """Get the client IP address"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip

class SecurityHeadersMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        
        # Add security headers
        response['X-Content-Type-Options'] = 'nosniff'
        response['X-Frame-Options'] = 'DENY'
        response['X-XSS-Protection'] = '1; mode=block'
        response['Referrer-Policy'] = 'strict-origin-when-cross-origin'
        response['Permissions-Policy'] = 'camera=(), microphone=(), geolocation=()'
        
        return response 