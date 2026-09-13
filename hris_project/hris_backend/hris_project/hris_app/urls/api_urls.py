from django.urls import include, path
from rest_framework.routers import DefaultRouter

# Import Views
from hris_app.views.api_view import APIEndpointViewSet, GroupAccessAssignmentViewSet, UserPermissionView
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
    path('Attendance-Logs', AttendanceLogViewSet.as_view(), name='attendance-log'),
    # Biometric Machine / ZKTeco Sync Endpoints
    path('biometric/enroll/', BiometricEnrollmentView.as_view(), name='biometric-enroll'),
    path('biometric/verify-clock/', BiometricVerificationView.as_view(), name='biometric-verify-clock'),
    
    # Router Default URLs
    path('', include(router.urls)), 
]