from django.db import models
from django.contrib.auth.models import User
from hris_app.models.employee import Employee
from datetime import date

class HistoryLog(models.Model): 
    updated_by = models.ForeignKey(User, on_delete=models.DO_NOTHING, null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)
    description = models.TextField(null=True, blank=True)
    user = models.ForeignKey(User, on_delete=models.DO_NOTHING, null=True, blank=True, related_name='history_user')
    model_name = models.CharField(max_length=100, null=True, blank=True)
    model_id = models.IntegerField(null=True, blank=True)
    
