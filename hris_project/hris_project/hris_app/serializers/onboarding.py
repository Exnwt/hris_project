from rest_framework import serializers

# ─── IMPORT MODEL DARI APLIKASI EMPLOYEES ──────────────────────────
from hris_app.models import EmployeeSubmissionStaging


class EmployeeSubmissionStagingSerializer(serializers.ModelSerializer):

  class Meta:
    model = EmployeeSubmissionStaging
    fields = ['id', 'raw_payload', 'is_processed', 'created_at']
    read_only_fields = ['id', 'is_processed', 'created_at']

