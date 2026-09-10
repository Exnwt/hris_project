from rest_framework.authentication import TokenAuthentication  # Django Token 
from rest_framework_simplejwt.authentication import JWTAuthentication #JWT Token
from rest_framework.decorators import (
    api_view,
    authentication_classes,
    permission_classes,
)
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from hris_app.permissions import HasAPIAccessPermission
from rest_framework import viewsets, permissions, status, generics
from hris_app.serializers.employee_serializer import EmployeeSerializer
import hmac
import hashlib
import json
from rest_framework.views import APIView
from hris_app.models import Employee


class EmployeeViewSet(viewsets.ModelViewSet):
    queryset = Employee.objects.all()
    serializer_class = EmployeeSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [HasAPIAccessPermission]
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            print("\n❌ VALIDATION ERROR ON EMPLOYEE CREATE:")
            print(serializer.errors)  # <-- Ini akan menampilkan field mana yang error di terminal
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
