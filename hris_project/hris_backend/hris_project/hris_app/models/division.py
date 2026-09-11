from django.db import models
from django.contrib.auth.models import User
from django.utils.translation import gettext_lazy as _

class Department(models.Model):
    name= models.CharField(max_length=200,unique=True)
    code = models.CharField(_("Department Code"), max_length=20, null=True, blank=True)
    zk_id = models.BigIntegerField(_("ZKTeco Department ID"), null=True, blank=True)

    def __str__(self):
        return self.name

class Section(models.Model):
    name=models.CharField(max_length=200)
    # department=models.ForeignKey(Department,on_delete=models.DO_NOTHING,null=True,blank=True)
    code = models.CharField(_("Section Code"), max_length=20, null=True, blank=True)
    zk_id = models.BigIntegerField(_("ZKTeco Section ID"), null=True, blank=True)


    def __str__(self):
        return self.name

class Position(models.Model):
   name = models.CharField(max_length=100, unique=True)
   code = models.CharField(_("Postition Code"), max_length=20, null=True, blank=True)
   zk_id = models.BigIntegerField(_("ZKTeco Position ID"), null=True, blank=True)

   def __str__(self):
      return self.name