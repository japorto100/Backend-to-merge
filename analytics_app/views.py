from rest_framework.views import APIView
from rest_framework.response import Response

class AnalyticsListView(APIView):
    def get(self, request):
        return Response({"message": "Analytics API is working!"})
