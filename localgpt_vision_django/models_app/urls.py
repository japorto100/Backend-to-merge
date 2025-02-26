from django.urls import path
from . import views

app_name = 'models'

urlpatterns = [
    path('', views.ModelListView.as_view(), name='model-list'),
    path('upload/', views.FileUploadView.as_view(), name='file-upload'),
    path('upload-interface/', views.upload_view, name='upload-interface'),
]