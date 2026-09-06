from rest_framework import serializers
from hris_app.models import Employee,Company, Department, Section, Position

class EmployeeSerializer(serializers.ModelSerializer):
    company_name = serializers.CharField(source='company.name', read_only=True)
    department_name = serializers.CharField(source='department.name', read_only=True)
    position_name = serializers.CharField(source='position.name', read_only=True)
    section_name = serializers.CharField(source='section.name', read_only=True)
    class Meta:
        model = Employee
        fields = '__all__'
