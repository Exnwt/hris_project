"""
URL configuration for hris_project project.
"""
from django.contrib import admin
from django.urls import include, path
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

urlpatterns = [
    path('admin/', admin.site.urls),
    path("api/auth/", include("hris_app.urls.auth")),
    
    # JWT AUTH
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # API V1
    path('api/v1/master-data/', include('hris_app.urls.master_data_urls', namespace='master_data')),
    path('api/v1/onboarding/', include('hris_app.urls.onboarding', namespace='onboarding')),
    
    # API V2
    path('api/v2/', include('hris_app.urls.user_management', namespace='user_management')),
    path('api/v2/access/', include('hris_app.urls.api_urls', namespace='api_access_assigment')),
    path('api/v2/system/', include('hris_app.urls.system_urls', namespace='system')), # <-- TAMBAHKAN INI
]