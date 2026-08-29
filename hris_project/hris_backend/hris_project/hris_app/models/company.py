from django.db import models
from django.contrib.auth.models import User




# Create your models here.

class Company(models.Model):
    name = models.CharField(max_length=200)
    company_code = models.CharField(max_length=100)
    address = models.TextField(null=True,blank=True)
    phone_number = models.CharField(max_length=20)

    def __str__(self):
        return self.name