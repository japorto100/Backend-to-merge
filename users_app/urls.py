from django.urls import path
from . import views

app_name = 'users'

urlpatterns = [
    path('', views.UserListView.as_view(), name='user-list'),
    path('profile/', views.UserProfileView.as_view(), name='user-profile'),
]