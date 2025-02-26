from rest_framework.views import APIView
from rest_framework.response import Response

class SearchView(APIView):
    def get(self, request):
        return Response({"message": "Search API is working!"})
