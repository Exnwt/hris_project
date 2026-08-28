from rest_framework import serializers

# ─── IMPORT MODEL DARI APLIKASI EMPLOYEES ──────────────────────────
from hris_app.models import (
    Company,
    Department,
    Section,
    Position,
    Employee,
    EmployeeStatusHistory,
    EmployeeContactHistory,
    EmployeeSubmissionStaging,
    APIAccessTemplate,
    UserAccessAssignment,
)

class EmployeeSubmissionStagingSerializer(serializers.ModelSerializer):

  class Meta:
    model = EmployeeSubmissionStaging
    fields = ['id', 'raw_payload', 'is_processed', 'created_at']
    read_only_fields = ['id', 'created_at']


class CompanySerializer(serializers.ModelSerializer):
    
    class Meta:
        model = Company
        fields = '__all__'


class DepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = '__all__'


class SectionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Section
        fields = '__all__'


class PositionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Position
        fields = '__all__'


class EmployeeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Employee
        fields = '__all__'


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


class APIAccessTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = APIAccessTemplate
        fields = '__all__'


class UserAccessAssignmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserAccessAssignment
        fields = '__all__'
