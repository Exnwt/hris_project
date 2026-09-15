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

# 2. Universal Export API
class GlobalExportView(APIView):
    def post(self, request):
        target_model = request.data.get("target_model")  # Contoh: "Employee"
        template_id = request.data.get("template_id")
        selected_fields = request.data.get("selected_fields") # Format: [{"field":"nik", "label":"NIK"}]

        if template_id:
            template = ExcelTemplate.objects.get(id=template_id)
            selected_fields = template.selected_fields

        # Dapatkan Model Class secara dinamis
        model_class = apps.get_model('hris_app', target_model)
        queryset = model_class.objects.all()

        return DynamicExcelService.export_data(queryset, selected_fields, filename=f"Export_{target_model}")

# 3. Universal Import API
class GlobalImportView(APIView):
    def post(self, request):
        target_model = request.data.get("target_model")
        template_id = request.data.get("template_id")
        file_obj = request.FILES.get("file")

        if not file_obj:
            return Response({"detail": "File Excel wajib diunggah."}, status=status.HTTP_400_BAD_REQUEST)

        template = ExcelTemplate.objects.get(id=template_id)
        model_class = apps.get_model('hris_app', target_model)

        success_count, errors = DynamicExcelService.import_data(file_obj, model_class, template.selected_fields)

        return Response({
            "message": f"Berhasil mengimpor {success_count} data.",
            "errors": errors
        }, status=status.HTTP_200_OK if not errors else status.HTTP_207_MULTI_STATUS)
    
    
    
    