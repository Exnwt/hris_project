from django.urls import path, include
from rest_framework.routers import DefaultRouter
from hris_app.views.cronjob_view import CronJobViewSet # Sesuaikan dengan lokasi view Anda

app_name = 'system_urls'

router = DefaultRouter()
router.register(r'cronjobs', CronJobViewSet, basename='cronjob')

urlpatterns = [
    path('', include(router.urls)),
]