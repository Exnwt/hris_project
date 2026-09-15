from django.urls import include, path
from rest_framework.routers import DefaultRouter

# Import Views
from hris_app.views import APIEndpointViewSet, GroupAccessAssignmentViewSet, ExcelTemplateListCreateView, ExcelTemplateDetailView, GlobalExportView, GlobalImportView, UserPermissionView
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
    # 1. Get List Template (opsional filter ?target_model=Employee) & Create Template Baru
    # GET/POST /api/v1/master-data/excel-templates/
    path('excel-templates/', ExcelTemplateListCreateView.as_view(), name='excel-template-list-create'),
    
    # 2. Get Detail, Update, & Delete Template Berdasarkan ID
    # GET/PUT/PATCH/DELETE /api/v1/master-data/excel-templates/1/
    path(
        'excel-templates/<int:pk>/', 
        ExcelTemplateDetailView.as_view(), 
        name='excel-template-detail'
    ),

    # ==========================================
    # GLOBAL EXPORT & IMPORT ENGINE
    # ==========================================
    
    # 3. Eksekusi Export Data ke File Excel secara Dinamis
    # POST /api/v1/master-data/global-export/
    path(
        'global-export/', 
        GlobalExportView.as_view(), 
        name='global-export'
    ),
    
    # 4. Eksekusi Import Data dari File Excel ke Database
    # POST /api/v1/master-data/global-import/
    path(
        'global-import/', 
        GlobalImportView.as_view(), 
        name='global-import'
    ),
    # Router Default URLs
    path('', include(router.urls)), 
]