from rest_framework import status
from rest_framework.authentication import TokenAuthentication  # Django Token 
from rest_framework_simplejwt.authentication import JWTAuthentication #JWT Token
from rest_framework.decorators import (
    api_view,
    authentication_classes,
    permission_classes,
)
from rest_framework.permissions import IsAuthenticated 
from rest_framework.response import Response
from rest_framework import viewsets, permissions, generics
from rest_framework_simplejwt.authentication import JWTAuthentication
from hris_app.models import Company, Department, Section, Position
from hris_app.serializers.masterData_serializer import CompanySerializer, DepartmentSerializer, SectionSerializer, PositionSerializer
from hris_app.serializers.employee_serializer import EmployeeSerializer
from hris_app.permissions import HasAPIAccessPermission


class CompanyViewSet(viewsets.ModelViewSet):
    api_codename = "CompanyAccess"
    queryset = Company.objects.all()
    serializer_class = CompanySerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [permissions.IsAuthenticated, HasAPIAccessPermission]

class DepartmentListView(generics.ListAPIView):
    api_codename = 'DepartmentRead'
    queryset = Department.objects.all().order_by('-id')
    serializer_class = DepartmentSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [permissions.IsAuthenticated, HasAPIAccessPermission]

class DepartmentDetailView(generics.RetrieveAPIView):
    api_codename = 'DepartmentRead'
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [permissions.IsAuthenticated, HasAPIAccessPermission]

class DepartmentCreateView(generics.CreateAPIView):
    api_codename = 'DepartmentCreate'
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [permissions.IsAuthenticated, HasAPIAccessPermission]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

class DepartmentUpdateView(generics.UpdateAPIView):
    api_codename = 'DepartmentUpdate'
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [permissions.IsAuthenticated, HasAPIAccessPermission]

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        self.perform_update(serializer)
        return Response(serializer.data, status=status.HTTP_200_OK)

class DepartmentDeleteView(generics.DestroyAPIView):
    api_codename = 'DepartmentDelete'
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [permissions.IsAuthenticated, HasAPIAccessPermission]

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        dept_name = getattr(instance, 'name', getattr(instance, 'nama_department', str(instance)))
        self.perform_destroy(instance)
        return Response(
            {"message": f"Department {dept_name} berhasil dihapus."},
            status=status.HTTP_200_OK
        )

class SectionListView(generics.ListAPIView):
    api_codename = 'SectionRead'
    queryset = Section.objects.all().order_by('-id')
    serializer_class = SectionSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [permissions.IsAuthenticated, HasAPIAccessPermission]


class SectionDetailView(generics.RetrieveAPIView):
    api_codename = 'SectionRead'
    queryset = Section.objects.all()
    serializer_class = SectionSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [permissions.IsAuthenticated, HasAPIAccessPermission]


class SectionCreateView(generics.CreateAPIView):
    api_codename = 'SectionCreate'
    queryset = Section.objects.all()
    serializer_class = SectionSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [permissions.IsAuthenticated, HasAPIAccessPermission]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)


class SectionUpdateView(generics.UpdateAPIView):
    api_codename = 'SectionUpdate'
    queryset = Section.objects.all()
    serializer_class = SectionSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [permissions.IsAuthenticated, HasAPIAccessPermission]

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        self.perform_update(serializer)
        return Response(serializer.data, status=status.HTTP_200_OK)

class SectionDeleteView(generics.DestroyAPIView):
    api_codename = 'SectionDelete'
    queryset = Section.objects.all()
    serializer_class = SectionSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [permissions.IsAuthenticated, HasAPIAccessPermission]

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        section_name = getattr(instance, 'name', getattr(instance, 'nama_section', str(instance)))
        self.perform_destroy(instance)
        return Response(
            {"message": f"Section {section_name} berhasil dihapus."},
            status=status.HTTP_200_OK
        )

class PositionListView(generics.ListAPIView):
    api_codename = 'PositionRead'
    queryset = Position.objects.all().order_by('-id')
    serializer_class = PositionSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [permissions.IsAuthenticated, HasAPIAccessPermission]


class PositionDetailView(generics.RetrieveAPIView):
    api_codename = 'PositionRead'
    queryset = Position.objects.all()
    serializer_class = PositionSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [permissions.IsAuthenticated, HasAPIAccessPermission]

class PositionCreateView(generics.CreateAPIView):
    api_codename = 'PositionCreate'
    queryset = Position.objects.all()
    serializer_class = PositionSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [permissions.IsAuthenticated, HasAPIAccessPermission]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

class PositionUpdateView(generics.UpdateAPIView):
    api_codename = 'PositionUpdate'
    queryset = Position.objects.all()
    serializer_class = PositionSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [permissions.IsAuthenticated, HasAPIAccessPermission]

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        self.perform_update(serializer)
        return Response(serializer.data, status=status.HTTP_200_OK)

class PositionDeleteView(generics.DestroyAPIView):
    api_codename = 'PositionDelete'
    queryset = Position.objects.all()
    serializer_class = PositionSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [permissions.IsAuthenticated, HasAPIAccessPermission]

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        position_name = getattr(instance, 'name', getattr(instance, 'nama_jabatan', str(instance)))
        self.perform_destroy(instance)
        return Response(
            {"message": f"Position {position_name} berhasil dihapus."},
            status=status.HTTP_200_OK
        )

