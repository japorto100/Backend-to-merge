from rest_framework import generics
from rest_framework.response import Response
from rest_framework.views import APIView

class ChatListView(APIView):
    def get(self, request):
        return Response({"message": "Chat API is working!"})

class ChatDetailView(APIView):
    def get(self, request, chat_id):
        return Response({"chat_id": str(chat_id)})
