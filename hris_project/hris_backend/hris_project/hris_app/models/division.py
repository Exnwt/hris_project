from django.db import models
from django.contrib.auth.models import User

class Department(models.Model):
    name=models.CharField(max_length=200,unique=True)

    def __str__(self):
        return self.name

class Section(models.Model):
    name=models.CharField(max_length=200)
    department=models.ForeignKey(Department,on_delete=models.DO_NOTHING,null=True,blank=True)

    def __str__(self):
        return self.name

class Position(models.Model):
  name = models.CharField(max_length=100, unique=True)

  def __str__(self):
    return self.name