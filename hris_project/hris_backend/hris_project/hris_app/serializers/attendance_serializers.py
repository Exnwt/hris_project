from hris_app.models import Attendance
from rest_framework import serializers

class AttedanceSerializers(serializers.ModelSerializer):

    class Meta:
        model = Attendance
        fields = '__all__'        
        