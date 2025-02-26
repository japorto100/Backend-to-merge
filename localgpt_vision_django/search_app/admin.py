from django.contrib import admin
from .models import SearchQuery

@admin.register(SearchQuery)
class SearchQueryAdmin(admin.ModelAdmin):
    list_display = ('query', 'user', 'timestamp')
    list_filter = ('timestamp',)
    search_fields = ('query', 'user__username')