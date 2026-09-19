from rest_framework import serializers

# ─── IMPORT MODEL DARI APLIKASI EMPLOYEES ──────────────────────────
from hris_app.models import EmployeeSubmissionStaging, Employee

class OnboardingApproveSerializer(serializers.ModelSerializer) :
   class Meta:
        model = Employee
        fields = '__all__'
        read_only_fiels = ['nik_karyawan','nama_lengkap' ]
        extra_kwargs = {
            'nama_lengkap':{
                'required':True,
                'allow_blank':False
            }
        }

class EmployeeSubmissionStagingSerializer(serializers.ModelSerializer):
  class Meta:
    model = EmployeeSubmissionStaging
    fields = ['id', 'raw_payload', 'is_processed', 'created_at']
    read_only_fields = ['id', 'created_at']


# class EmployeeSubmissionStagingSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = EmployeeSubmissionStaging
#         fields = '__all__'