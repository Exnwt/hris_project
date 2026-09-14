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
from hris_app.views.services.ZKTeco_service import sync_department_to_zk


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
        # 1. Validasi input dari request (Belum simpan ke DB)
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        dept_name = serializer.validated_data.get('name')
        dept_code = serializer.validated_data.get('code')
        zk_id = serializer.validated_data.get('zk_id')

        # 2. Jalankan sync ke ZKTeco TERLEBIH DAHULU (Sebelum Save ke DB Local)
        success, zk_result = sync_department_to_zk(
            dept_name=dept_name,
            department_obj=None,
            dept_code=dept_code,
            zk_id=zk_id
        )

        # 3. Jika sync gagal -> Batalkan pembuatan di DB local dan kembalikan response error
        if not success:
            return Response({
                "detail": "Gagal sinkronisasi ke ZKTeco BioTime. Data tidak disimpan ke HRIS.",
                "error": zk_result
            }, status=status.HTTP_400_BAD_REQUEST)

        # 4. Jika sync BERHASIL -> Siapkan data tambahan dari ZKTeco (misal: zk_id / code baru)
        save_kwargs = {}
        if isinstance(zk_result, dict):
            if zk_result.get('zk_id') and not zk_id:
                save_kwargs['zk_id'] = zk_result.get('zk_id')
            if zk_result.get('code') and not dept_code:
                save_kwargs['code'] = zk_result.get('code')
        # 5. SIMPAN KE DATABASE LOCAL (Setelah ZKTeco sukses)
        department_obj = serializer.save(**save_kwargs)

        # 6. Susun Response Akhir
        headers = self.get_success_headers(serializer.data)
        response_data = self.get_serializer(department_obj).data
        response_data['zk_sync_status'] = True
        response_data['zk_data'] = zk_result

        return Response(response_data, status=status.HTTP_201_CREATED, headers=headers)
    
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

