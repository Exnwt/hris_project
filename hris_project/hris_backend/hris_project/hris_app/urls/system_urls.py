from django.urls import path, include
from rest_framework.routers import DefaultRouter
from hris_app.views.cronjob_view import CronJobViewSet # Sesuaikan dengan lokasi view Anda
from hris_app.views.zkteco_view import SyncEmployeeToZkBiotimeView, SyncDepartmentToZKBiotimeView, SyncPositionToZKBiotimeView, SyncAreaToZKBiotimeView

app_name = 'system_urls'

router = DefaultRouter()
router.register(r'cronjobs', CronJobViewSet, basename='cronjob')

urlpatterns = [
    path('zkteco/employeeSync/', SyncEmployeeToZkBiotimeView.as_view(), name='zkteco-employeeSync'),
    path('zkteco/departmentSync/', SyncDepartmentToZKBiotimeView.as_view(), name='zkteco-departmentSync'),
    path('zkteco/positionSync/', SyncPositionToZKBiotimeView.as_view(), name='zkteco-positionSync'),
    path('zkteco/areaSync/', SyncAreaToZKBiotimeView.as_view(), name='zkteco-areaSync'),

    
    path('', include(router.urls)),
]