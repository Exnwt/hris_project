from django.db import models
from django.contrib.auth.models import User
from hris_app.models.employee import Employee
from datetime import date

class ContractList(models.Model):
    CONTRACT_TYPE_CHOICES = [
        ('PKWT', 'PKWT'),
        ('PKWTT', 'PKWTT'),
    ]

    name=models.CharField(max_length=200,unique=True)
    contract_type=models.CharField(max_length=10, choices=CONTRACT_TYPE_CHOICES)
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE)
    description=models.TextField(null=True,blank=True)
    start_date=models.DateField(null=True,blank=True)
    end_date=models.DateField(null=True,blank=True)
    requested_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    approved_by=models.ForeignKey(User,on_delete=models.DO_NOTHING,null=True,blank=True,related_name='approved_contracts')

    @property
    def remaining_days(self):
        if self.end_date:
            today = date.today()
            remaining = (self.end_date - today).days
            return remaining
        else:
            return None
    
            
    def __str__(self):
        return self.name

class ContractHistory(models.Model):
    contract=models.ForeignKey(ContractList,on_delete=models.CASCADE)
    employee=models.ForeignKey(Employee,on_delete=models.DO_NOTHING,null=True,blank=True)
    start_date=models.DateField(null=True,blank=True)
    end_date=models.DateField(null=True,blank=True)
    created_at=models.DateTimeField(auto_now_add=True)
    updated_at=models.DateTimeField(auto_now=True)
    requested_by=models.ForeignKey(User,on_delete=models.DO_NOTHING,null=True,blank=True,related_name='requested_by')
    approved_by=models.ForeignKey(User,on_delete=models.DO_NOTHING,null=True,blank=True,related_name='approved_by')

    def __str__(self):
        return f"{self.contract.name} - {self.employee.user.username}"
