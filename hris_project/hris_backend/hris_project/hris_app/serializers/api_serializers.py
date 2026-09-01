from rest_framework import serializers
from hris_app.models import APIEndpoint, UserAccessAssignment, GroupAccessAssignment


class APIEndpointSerializer(serializers.ModelSerializer):
    class Meta:
        model = APIEndpoint
        fields = '__all__'


class UserAccessAssignmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserAccessAssignment
        fields = '__all__'

class GroupAccessAssignmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = GroupAccessAssignment
        fields = '__all__'