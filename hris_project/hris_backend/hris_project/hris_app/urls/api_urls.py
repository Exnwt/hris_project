from django.urls import include, path
from hris_app.views.api_view import APIEndpointViewSet, UserAccessAssignmentViewSet, GroupAccessAssignmentViewSet, UserPermissionView
from hris_app.views.biometric_view import BiometricEnrollmentView, BiometricVerificationView
from hris_app.views.attendance_view import AttendanceViewSet
from rest_framework.routers import DefaultRouter



app_name = 'api_access_assigment'
router = DefaultRouter()

router.register(r'APIEndpoints', APIEndpointViewSet, basename='APIEndpoint')
router.register(r'User-AA', UserAccessAssignmentViewSet, basename='userAA')
router.register(r'Group-AA', GroupAccessAssignmentViewSet, basename='groupAA')
router.register(r'Attedances', AttendanceViewSet, basename='Attendace')

urlpatterns = [
    # mypersmision = check personal akses groups
    path('my-permissions/', UserPermissionView.as_view(), name='my-permissions'),
    path('biometric/enroll/', BiometricEnrollmentView.as_view(), name='biometric-enroll'),
    path('biometric/verify-clock/', BiometricVerificationView.as_view(), name='biometric-verify-clock'),
    path('', include(router.urls)), 
]

# urlpatterns = router.urls