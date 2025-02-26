import os
import json
import logging
from django.conf import settings
from django.db.models import Q
from chat_app.models import Message, ChatSession
from models_app.models import UploadedFile

logger = logging.getLogger(__name__)

class SearchEngine:
    """
    Search engine for finding messages, files, and other content
    """
    def __init__(self):
        self.index = {}
        self.initialized = False
    
    def initialize(self):
        """Initialize the search engine"""
        if self.initialized:
            return
        
        # In a real implementation, this would build a search index
        # For now, we'll just set a flag
        self.initialized = True
        logger.info("Search engine initialized")
    
    def search(self, query, user=None, filters=None):
        """
        Search for content matching the query
        
        Args:
            query: Search query string
            user: User performing the search (for access control)
            filters: Dictionary of filters to apply
            
        Returns:
            Dictionary with search results
        """
        self.initialize()
        
        if not filters:
            filters = {}
        
        # Default filters
        content_types = filters.get('content_types', ['messages', 'files', 'sessions'])
        date_range = filters.get('date_range', None)
        
        results = {
            'messages': [],
            'files': [],
            'sessions': [],
            'total_count': 0
        }
        
        # Search messages
        if 'messages' in content_types:
            message_results = self._search_messages(query, user, date_range)
            results['messages'] = message_results
            results['total_count'] += len(message_results)
        
        # Search files
        if 'files' in content_types:
            file_results = self._search_files(query, user, date_range)
            results['files'] = file_results
            results['total_count'] += len(file_results)
        
        # Search sessions
        if 'sessions' in content_types:
            session_results = self._search_sessions(query, user, date_range)
            results['sessions'] = session_results
            results['total_count'] += len(session_results)
        
        return results
    
    def _search_messages(self, query, user, date_range=None):
        """Search for messages matching the query"""
        # Build base query
        message_query = Q(content__icontains=query)
        
        # Add user filter if provided
        if user:
            message_query &= Q(session__user=user)
        
        # Add date range filter if provided
        if date_range and 'start' in date_range:
            message_query &= Q(timestamp__gte=date_range['start'])
        if date_range and 'end' in date_range:
            message_query &= Q(timestamp__lte=date_range['end'])
        
        # Execute query
        messages = Message.objects.filter(message_query).order_by('-timestamp')[:20]
        
        # Format results
        results = []
        for msg in messages:
            results.append({
                'id': str(msg.id),
                'content': msg.content,
                'role': msg.role,
                'timestamp': msg.timestamp.isoformat(),
                'session_id': str(msg.session.id),
                'session_title': msg.session.title
            })
        
        return results
    
    def _search_files(self, query, user, date_range=None):
        """Search for files matching the query"""
        # Build base query
        file_query = Q(file__icontains=query) | Q(processing_results__icontains=query)
        
        # Add user filter if provided
        if user:
            file_query &= Q(user=user)
        
        # Add date range filter if provided
        if date_range and 'start' in date_range:
            file_query &= Q(upload_date__gte=date_range['start'])
        if date_range and 'end' in date_range:
            file_query &= Q(upload_date__lte=date_range['end'])
        
        # Execute query
        files = UploadedFile.objects.filter(file_query).order_by('-upload_date')[:20]
        
        # Format results
        results = []
        for file in files:
            results.append({
                'id': str(file.id),
                'file_name': os.path.basename(file.file.name),
                'file_type': file.file_type,
                'upload_date': file.upload_date.isoformat(),
                'processed': file.processed,
                'url': file.file.url if hasattr(file.file, 'url') else None
            })
        
        return results
    
    def _search_sessions(self, query, user, date_range=None):
        """Search for chat sessions matching the query"""
        # Build base query
        session_query = Q(title__icontains=query)
        
        # Add user filter if provided
        if user:
            session_query &= Q(user=user)
        
        # Add date range filter if provided
        if date_range and 'start' in date_range:
            session_query &= Q(created_at__gte=date_range['start'])
        if date_range and 'end' in date_range:
            session_query &= Q(created_at__lte=date_range['end'])
        
        # Execute query
        sessions = ChatSession.objects.filter(session_query).order_by('-created_at')[:20]
        
        # Format results
        results = []
        for session in sessions:
            results.append({
                'id': str(session.id),
                'title': session.title,
                'created_at': session.created_at.isoformat(),
                'message_count': Message.objects.filter(session=session).count()
            })
        
        return results 