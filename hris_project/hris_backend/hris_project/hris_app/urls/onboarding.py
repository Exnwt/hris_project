

from django.urls import include, path
from rest_framework.routers import DefaultRouter

# ─── IMPORT VIEW DARI FOLDER VIEWS ─────────────────────────────────
from hris_app.views.onboarding import (
          employee_submission_create_view,
          employee_submission_detail,
 )

from hris_app.views.onboarding import (
    CompanyViewSet,
    DepartmentViewSet,
    SectionViewSet,
    PositionViewSet,
    EmployeeViewSet,
    EmployeeStatusHistoryViewSet,
    EmployeeContactHistoryViewSet,
    EmployeeSubmissionStagingViewSet,
    APIAccessTemplateViewSet,
    UserAccessAssignmentViewSet,
)
from hris_app.views.master_data import QuickCreateMasterAPIView

app_name = 'onboarding'

router = DefaultRouter()
router.register(r'companies', CompanyViewSet, basename='company')
router.register(r'departments', DepartmentViewSet, basename='department')
router.register(r'sections', SectionViewSet, basename='section')
router.register(r'positions', PositionViewSet, basename='position')
router.register(r'employees', EmployeeViewSet, basename='employee')
router.register(r'employee-status-histories', EmployeeStatusHistoryViewSet, basename='employee-status-history')
router.register(r'employee-contact-histories', EmployeeContactHistoryViewSet, basename='employee-contact-history')
router.register(r'staging-submissions', EmployeeSubmissionStagingViewSet, basename='staging-submission')
router.register(r'api-access-templates', APIAccessTemplateViewSet, basename='api-access-template')
router.register(r'user-access-assignments', UserAccessAssignmentViewSet, basename='user-access-assignment')

urlpatterns = [
    path('submissions/create/',employee_submission_create_view, name='api-employee-submission-create'),
    path('submissions/<int:pk>/', employee_submission_detail, name='api-employee-submission-detail'),
    path('master-quick-create/<str:master_type>/',QuickCreateMasterAPIView.as_view(),name='api_master_quick_create'),
    path('',include(router.urls)),  # Menyertakan semua URL dari router
]