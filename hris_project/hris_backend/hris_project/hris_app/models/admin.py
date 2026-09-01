from django.contrib import admin

from .models import Employee
from .models import Section 
from .models import Department
from .models import Company
from .models import Position
from .models import APIEndpoint
from .models import UserAccessAssignment
from .models import EmployeeSubmissionStaging

# Register your models here.


admin.site.register(Employee)
admin.site.register(Section)
admin.site.register(Department)
admin.site.register(Company)
admin.site.register(Position)
admin.site.register(APIEndpoint)
admin.site.register(UserAccessAssignment)
admin.site.register(EmployeeSubmissionStaging)
