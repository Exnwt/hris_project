

from django.urls import include, path
from rest_framework.routers import DefaultRouter

# ─── IMPORT VIEW DARI FOLDER VIEWS ─────────────────────────────────
from hris_app.views.onboarding import (
          employee_submission_create_view,
          employee_submission_detail,
 )

from hris_app.views.onboarding import EmployeeStatusHistoryViewSet, EmployeeContactHistoryViewSet, EmployeeSubmissionStagingViewSet, OnboardingListView, OnboardingApproveView, OnboardingCreateView, OnboardingDetailView
from hris_app.views.employee_view import EmployeeViewSet

from hris_app.views.master_data import QuickCreateMasterAPIView

app_name = 'onboarding'

router = DefaultRouter()
# router.register(r'employees', EmployeeViewSet, basename='employee')

router.register(r'employee-status-histories', EmployeeStatusHistoryViewSet, basename='employee-status-history')
router.register(r'employee-contact-histories', EmployeeContactHistoryViewSet, basename='employee-contact-history')
router.register(r'staging-submissions', EmployeeSubmissionStagingViewSet, basename='staging-submission')

urlpatterns = [
    # onboarding
    path("onboarding/", OnboardingListView.as_view(), name="OnboardingList"),
    path('onboarding/<int:pk>/', OnboardingDetailView.as_view(), name='OnboardingDetail'),
    path('onboarding/<int:pk>/approve/', OnboardingApproveView.as_view(), name='OnboardingUpdate'),
    path('onboarding/<int:pk>/update/', OnboardingApproveView.as_view(), name='OnboardingUpdate'),
    path('onboarding/create/', OnboardingCreateView.as_view(), name='OnboardingCreate'),




    path('submissions/create/',employee_submission_create_view, name='api-employee-submission-create'),
    path('submissions/<int:pk>/', employee_submission_detail, name='api-employee-submission-detail'),
    path('master-quick-create/<str:master_type>/',QuickCreateMasterAPIView.as_view(),name='api_master_quick_create'),
    path('',include(router.urls)),  # Menyertakan semua URL dari router
]