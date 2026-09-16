from hris_app.models import APIEndpoint, GroupAccessAssignment, ExcelTemplate, Employee
from hris_app.serializers.api_serializers import APIEndpointSerializer, GroupAccessAssignmentSerializer, ExcelTemplateSerializer
from rest_framework import generics, status
from rest_framework.authentication import TokenAuthentication  # Django Token 
from rest_framework_simplejwt.authentication import JWTAuthentication #JWT Token
from rest_framework.decorators import (
    api_view,
    authentication_classes,
    permission_classes,
)
from django.apps import apps
from rest_framework.permissions import IsAuthenticated
from hris_app.permissions import HasAPIAccessPermission
from rest_framework.response import Response
from rest_framework import viewsets, permissions
from rest_framework.views import APIView
from hris_app.views.services.ImportExport_service import DynamicExcelService
MANUAL_IMPORT_MAPPINGS = {
    "Employee": {
        # "Nama Kolom di Excel" : "nama_field_di_database"
        "NIK Karyawan": "nik_karyawan",
        "Nama Lengkap": "nama_lengkap",
        "NIK KTP": "nik_ktp",
        "No WhatsApp": "phone_number",
        "Email": "email",
        "Jenis Kelamin": "jenis_kelamin",
        "Tanggal Masuk": "join_date",
        "Ukuran Baju": "shirt_size",
        "Department": "department", # Contoh field relasi
    },
    # Anda bisa menambahkan model lain di sini nantinya...
    # "Department": { "Kode": "kode_dept", "Nama Dept": "nama_department" }
}

class UserPermissionView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        print('starttt', request.user)
        user = request.user
        
        # 1. Jika Superuser, beri flag is_superuser
        if user.is_superuser:
            return Response({
                "username": user.username,
                "is_superuser": True,
                "allowed_codenames": ["*"] # Wildcard akses penuh
            })

        # 2. Ambil semua Group milik user
        user_groups = user.groups.all()

        # 3. Ambil daftar code_name dari GroupAccessAssignment
        allowed_codenames = GroupAccessAssignment.objects.filter(
            group__in=user_groups
        ).values_list('api_endpoint__code_name', flat=True).distinct()
        print('allowed_codenames', allowed_codenames)
        
        return Response({
            "username": user.username,
            "is_superuser": False,
            "allowed_codenames": list(allowed_codenames)
        })

class APIEndpointViewSet(viewsets.ModelViewSet):
    api_codename = 'APIEndpointsAccess'
    queryset = APIEndpoint.objects.all()
    serializer_class = APIEndpointSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [permissions.IsAuthenticated, HasAPIAccessPermission]

class GroupAccessAssignmentViewSet(viewsets.ModelViewSet):
    api_codename = 'GroupAccess'
    authentication_classes = [JWTAuthentication]
    queryset = GroupAccessAssignment.objects.select_related(
        "group",
        "api_endpoint"
    ).all()

    serializer_class = GroupAccessAssignmentSerializer

    permission_classes = [
        permissions.IsAuthenticated
    ]

    def get_queryset(self):
        queryset = super().get_queryset()

        group_id = self.request.query_params.get("group")
        api_endpoint_id = self.request.query_params.get("api_endpoint")

        if group_id:
            queryset = queryset.filter(group_id=group_id)

        if api_endpoint_id:
            queryset = queryset.filter(api_endpoint_id=api_endpoint_id)

        return queryset
    
    

# 1. CRUD Template Manager
class ExcelTemplateListCreateView(generics.ListCreateAPIView):
    serializer_class = ExcelTemplateSerializer

    def get_queryset(self):
        target_model = self.request.query_params.get('target_model')
        if target_model:
            return ExcelTemplate.objects.filter(target_model=target_model)
        return ExcelTemplate.objects.all()

class ExcelTemplateDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = ExcelTemplate.objects.all()
    serializer_class = ExcelTemplateSerializer

class GlobalTemplateView(APIView):
    def get(self, request):
        target_model = request.query_params.get("target_model")
        if not target_model:
            return Response({"detail": "target_model wajib dikirim."}, status=status.HTTP_400_BAD_REQUEST)
            
        if target_model not in MANUAL_IMPORT_MAPPINGS:
            return Response({"detail": f"Template manual untuk {target_model} belum disetting di backend."}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            model_class = apps.get_model('hris_app', target_model)
            manual_mapping = MANUAL_IMPORT_MAPPINGS[target_model]
            
            return DynamicExcelService.generate_template(model_class, manual_mapping, filename=f"Template_Import_{target_model}")
        except LookupError:
            return Response({"detail": "Model tidak ditemukan."}, status=status.HTTP_404_NOT_FOUND)


# [BARU] 1. API Untuk Mengambil List Field Langsung Dari Database
class ModelFieldsView(APIView):
    def get(self, request):
        target_model = request.query_params.get("target_model")
        if not target_model:
            return Response({"detail": "target_model wajib diisi."}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            model_class = apps.get_model('hris_app', target_model)
            fields = []
            for f in model_class._meta.fields:
                # Sembunyikan field sistem yang tidak perlu di-export/import
                if f.name in ['id', 'created_at', 'updated_at']:
                    continue
                    
                fields.append({
                    "field": f.name,
                    "label": f.verbose_name.title(),
                    "required": not f.blank and not f.null # Cek apakah field ini Wajib
                })
            return Response(fields, status=status.HTTP_200_OK)
        except LookupError:
            return Response({"detail": "Model tidak ditemukan."}, status=status.HTTP_404_NOT_FOUND)

# 2. Export View (Tanpa Template ID)
class GlobalExportView(APIView):
    def post(self, request):
        target_model = request.data.get("target_model")
        selected_fields = request.data.get("selected_fields") # Format: [{"field":"nik", "label":"NIK"}]

        try:
            model_class = apps.get_model('hris_app', target_model)
            queryset = model_class.objects.all()

            # Jika Frontend tidak mengirim list, ambil otomatis semua field
            if not selected_fields:
                selected_fields = [
                    {"field": f.name, "label": f.verbose_name.title()} 
                    for f in model_class._meta.fields if f.name not in ['id', 'created_at', 'updated_at']
                ]

            return DynamicExcelService.export_data(queryset, selected_fields, filename=f"Export_{target_model}")
        except Exception as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

class GlobalImportView(APIView):
    def post(self, request):
        target_model = request.data.get("target_model")
        file_obj = request.FILES.get("file")

        if not file_obj:
            return Response({"detail": "File Excel wajib diunggah."}, status=status.HTTP_400_BAD_REQUEST)
        
        if target_model not in MANUAL_IMPORT_MAPPINGS:
            return Response({"detail": f"Mapping manual import untuk {target_model} belum disetting di backend."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            model_class = apps.get_model('hris_app', target_model)
            manual_mapping = MANUAL_IMPORT_MAPPINGS[target_model]
            
            success_count, errors = DynamicExcelService.import_data(file_obj, model_class, manual_mapping)

            return Response({
                "message": f"Berhasil mengimpor {success_count} data.",
                "errors": errors
            }, status=status.HTTP_200_OK if not errors else status.HTTP_207_MULTI_STATUS)
        except Exception as e:
            return Response({"detail": f"Terjadi kesalahan sistem: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
