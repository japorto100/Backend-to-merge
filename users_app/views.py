from rest_framework.views import APIView
from rest_framework.response import Response

class UserListView(APIView):
    def get(self, request):
        return Response({"message": "Users API is working!"})

class UserProfileView(APIView):
    def get(self, request):
        return Response({"message": "User Profile API is working!"})
