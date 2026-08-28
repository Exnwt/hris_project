

from django.urls import path

# ─── IMPORT VIEW DARI FOLDER VIEWS ─────────────────────────────────
from hris_app.views.api_views.onboarding import (
          employee_submission_create_view,
          employee_submission_detail,
 )
from hris_app.views.api_views.master_data import QuickCreateMasterAPIView


urlpatterns = [
    path('submissions/',employee_submission_create_view, name='api-employee-submission-create'),
    path('submissions/<int:pk>/', employee_submission_detail, name='api-employee-submission-detail'),
    path('master-quick-create/<str:master_type>/',QuickCreateMasterAPIView.as_view(),name='api_master_quick_create'),
]