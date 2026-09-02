from hris_app.models import Attendance
from hris_app.serializers.attendance_serializers import AttedanceSerializers

from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.authentication import TokenAuthentication  # Django Token 
from rest_framework.permissions import IsAuthenticated
from rest_framework import viewsets, permissions
from hris_app.permissions import HasAPIAccessPermission

class AttendanceViewSet(viewsets.ModelViewSet):
    queryset = Attendance.objects.all()
    serializer_class = AttedanceSerializers
    api_codename = 'Attendace'
    authentication_classes = [JWTAuthentication]
    permission_classes = [permissions.IsAuthenticated, HasAPIAccessPermission]
    
    
    