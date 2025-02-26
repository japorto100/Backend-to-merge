from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import AnalyticsEvent
from .serializers import AnalyticsEventSerializer
from django.shortcuts import render
from django.contrib.auth.decorators import login_required, user_passes_test
from django.contrib.auth.models import User
from django.db.models import Avg, Count
from django.utils import timezone
from datetime import timedelta
from chat_app.models import ChatSession, Message
from models_app.models import UploadedFile

class AnalyticsListView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Get analytics data (admin only)"""
        if not request.user.is_staff:
            return Response({"error": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)
            
        events = AnalyticsEvent.objects.all()[:100]  # Limit to 100 most recent events
        serializer = AnalyticsEventSerializer(events, many=True)
        return Response(serializer.data)
    
    def post(self, request):
        """Log an analytics event"""
        serializer = AnalyticsEventSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(user=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@login_required
@user_passes_test(lambda u: u.is_staff)
def dashboard_view(request):
    """Render the admin dashboard"""
    return render(request, 'analytics_app/dashboard.html')

class DashboardDataView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Get dashboard data for admin"""
        if not request.user.is_staff:
            return Response({"error": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)
        
        # Get basic stats
        stats = {
            'total_users': User.objects.count(),
            'total_chats': ChatSession.objects.count(),
            'total_messages': Message.objects.count(),
            'total_files': UploadedFile.objects.count()
        }
        
        # Get API requests for the last 7 days
        end_date = timezone.now()
        start_date = end_date - timedelta(days=7)
        
        # Prepare data for API requests chart
        api_requests = {
            'labels': [],
            'values': []
        }
        
        for i in range(7):
            day = start_date + timedelta(days=i)
            day_end = day + timedelta(days=1)
            count = AnalyticsEvent.objects.filter(
                event_type='api_request',
                timestamp__gte=day,
                timestamp__lt=day_end
            ).count()
            
            api_requests['labels'].append(day.strftime('%Y-%m-%d'))
            api_requests['values'].append(count)
        
        # Get average response times by endpoint
        response_times = {
            'endpoints': [],
            'times': []
        }
        
        endpoint_times = AnalyticsEvent.objects.filter(
            event_type='api_request',
            timestamp__gte=start_date
        ).values('endpoint').annotate(
            avg_time=Avg('response_time')
        ).order_by('-avg_time')[:5]
        
        for item in endpoint_times:
            response_times['endpoints'].append(item['endpoint'])
            response_times['times'].append(item['avg_time'] * 1000)  # Convert to ms
        
        # Get recent requests
        recent_requests = AnalyticsEvent.objects.filter(
            event_type='api_request'
        ).order_by('-timestamp')[:10]
        
        recent_requests_data = []
        for req in recent_requests:
            recent_requests_data.append({
                'timestamp': req.timestamp,
                'user': req.user.username if req.user else None,
                'endpoint': req.endpoint,
                'method': req.method,
                'status_code': req.status_code,
                'response_time': req.response_time
            })
        
        return Response({
            'stats': stats,
            'api_requests': api_requests,
            'response_times': response_times,
            'recent_requests': recent_requests_data
        })
