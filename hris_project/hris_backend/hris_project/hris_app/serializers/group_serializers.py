from django.contrib.auth.models import User, Group
from rest_framework import serializers

class GroupSerializer(serializers.ModelSerializer):

    class Meta:
        model = Group
        field = '__all__'        
        