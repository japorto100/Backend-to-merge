from rest_framework.views import APIView
from rest_framework.response import Response

class ModelListView(APIView):
    def get(self, request):
        return Response({"message": "Models API is working!"})
