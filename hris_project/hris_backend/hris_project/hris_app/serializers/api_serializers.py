from rest_framework import serializers
from hris_app.models import APIEndpoint, GroupAccessAssignment, ExcelTemplate


class APIEndpointSerializer(serializers.ModelSerializer):
    class Meta:
        model = APIEndpoint
        fields = '__all__'



class GroupAccessAssignmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = GroupAccessAssignment
        fields = '__all__'
        
class ExcelTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExcelTemplate
        fields = '__all__'      
        