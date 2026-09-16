from django.urls import include, path
from rest_framework.routers import DefaultRouter

# Import Views
from hris_app.views import APIEndpointViewSet, GroupAccessAssignmentViewSet, ExcelTemplateListCreateView, ExcelTemplateDetailView, GlobalExportView, GlobalImportView, UserPermissionView, ModelFieldsView, GlobalTemplateView
from hris_app.views.biometric_view import BiometricEnrollmentView, BiometricVerificationView
from hris_app.views.attendance_view import AttendanceViewSet, AttendanceLogViewSet

app_name = 'api_access_assigment'

router = DefaultRouter()
router.register(r'APIEndpoints', APIEndpointViewSet, basename='APIEndpoint')
router.register(r'Group-AA', GroupAccessAssignmentViewSet, basename='groupAA')
router.register(r'Attedances', AttendanceViewSet, basename='Attendace')

urlpatterns = [
    # Check personal permissions
    path('my-permissions/', UserPermissionView.as_view(), name='my-permissions'),
    path('attendanceLogs/', AttendanceLogViewSet.as_view(), name='attendance-log'),
    # Biometric Machine / ZKTeco Sync Endpoints
    path('biometric/enroll/', BiometricEnrollmentView.as_view(), name='biometric-enroll'),
    path('biometric/verify-clock/', BiometricVerificationView.as_view(), name='biometric-verify-clock'),
    
    
    path('global-template/', GlobalTemplateView.as_view(), name='global-template'),
    path('model-fields/', ModelFieldsView.as_view(), name='model-fields'),
    
    # Eksekusi Export Data ke File Excel secara Dinamis
    path('global-export/', GlobalExportView.as_view(), name='global-export'),
    
    # Eksekusi Import Data dari File Excel ke Database
    path('global-import/', GlobalImportView.as_view(), name='global-import'),

    # (Opsional) Endpoint Excel Template lama biarkan saja jika suatu saat ingin dipakai lagi
    path('excel-templates/', ExcelTemplateListCreateView.as_view(), name='excel-template-list-create'),
    path('excel-templates/<int:pk>/', ExcelTemplateDetailView.as_view(), name='excel-template-detail'),
    
    # Router Default URLs
    path('', include(router.urls)), 
]