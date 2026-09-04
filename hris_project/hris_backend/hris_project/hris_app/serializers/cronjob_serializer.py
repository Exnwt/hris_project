from rest_framework import serializers
from hris_app.models import CronJob

class CronJobSerializer(serializers.ModelSerializer):
    class Meta:
        model = CronJob
        fields = '__all__'