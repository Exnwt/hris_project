from rest_framework import serializers

# ─── IMPORT MODEL DARI APLIKASI EMPLOYEES ──────────────────────────
from hris_app.models import (
    EmployeeStatusHistory,
    EmployeeContactHistory,
    EmployeeSubmissionStaging,
)

class EmployeeSubmissionStagingSerializer(serializers.ModelSerializer):

  class Meta:
    model = EmployeeSubmissionStaging
    fields = ['id', 'raw_payload', 'is_processed', 'created_at']
    read_only_fields = ['id', 'created_at']

class EmployeeStatusHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = EmployeeStatusHistory
        fields = '__all__'


class EmployeeContactHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = EmployeeContactHistory
        fields = '__all__'


# class EmployeeSubmissionStagingSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = EmployeeSubmissionStaging
#         fields = '__all__'