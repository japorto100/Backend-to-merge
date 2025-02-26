from django.urls import path
from . import views

app_name = 'analytics'

urlpatterns = [
    path('', views.AnalyticsListView.as_view(), name='analytics-list'),
    path('dashboard/', views.DashboardDataView.as_view(), name='dashboard-data'),
    path('dashboard-view/', views.dashboard_view, name='dashboard-view'),
]