"""
URL configuration for hris_project project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import include, path
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)


urlpatterns = [
    path('admin/', admin.site.urls),
    path("api/auth/",include("hris_app.urls.auth"),name="api_auth"),
    #JWT AUTH
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    # api master data disini
    path('api/v1/master-data/', include('hris_app.urls.master_data_urls', namespace='master_data')),
    # Mengarah ke api_urls/__init__.py
    path('api/v1/onboarding/', include('hris_app.urls.onboarding', namespace='onboarding')),
    path('api/v2/', include('hris_app.urls.user_management', namespace='user_management')),
    path('api/v2/access/', include('hris_app.urls.api_urls', namespace='api_access_assigment'))
]