from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'providers', views.ProviderViewSet)
router.register(r'search', views.SearchViewSet, basename='search')
router.register(r'preferences', views.UserProviderPreferenceViewSet, basename='preferences')

urlpatterns = [
    path('api/', include(router.urls)),
    path('api/detect-provider-type/', views.detect_provider_type, name='detect_provider_type'),
    path('api/validate-api-key/', views.validate_api_key, name='validate_api_key'),
]