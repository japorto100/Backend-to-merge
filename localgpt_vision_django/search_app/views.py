from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import SearchQuery
from .serializers import SearchQuerySerializer
from models_app.models import UploadedFile
from chat_app.models import Message
from django.shortcuts import render

class SearchView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Get search history for current user"""
        queries = SearchQuery.objects.filter(user=request.user)[:20]  # Limit to 20 most recent
        serializer = SearchQuerySerializer(queries, many=True)
        return Response(serializer.data)
    
    def post(self, request):
        """Perform a search"""
        query = request.data.get('query', '')
        filters = request.data.get('filters', {})
        
        if not query:
            return Response({"error": "Query is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        # Create a search query record
        search_query = SearchQuery.objects.create(
            user=request.user if request.user.is_authenticated else None,
            query=query,
            filters=filters
        )
        
        # Perform the search
        from search_app.search_engine import SearchEngine
        search_engine = SearchEngine()
        results = search_engine.search(
            query, 
            user=request.user if request.user.is_authenticated else None,
            filters=filters
        )
        
        # Update the search query with results
        search_query.results_count = results['total_count']
        search_query.save()
        
        # Create analytics event for search
        from analytics_app.models import AnalyticsEvent
        AnalyticsEvent.objects.create(
            user=request.user if request.user.is_authenticated else None,
            event_type='search',
            data={
                'query': query,
                'filters': filters,
                'results_count': results['total_count']
            }
        )
        
        return Response({
            'query': query,
            'filters': filters,
            'results': results
        })

def search_view(request):
    """Render the search interface"""
    return render(request, 'search_app/search.html')
