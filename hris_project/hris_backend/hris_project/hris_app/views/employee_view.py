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
from hris_app.serializers import EmployeeSerializer,EmployeeEditStaggingSerializer
import hmac
import hashlib
import json
from rest_framework.views import APIView
from hris_app.models import Employee, EmployeeEditStagging
from django.utils import timezone
import datetime

class EmployeeViewSet(viewsets.ModelViewSet):
    queryset = Employee.objects.all()
    serializer_class = EmployeeSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [HasAPIAccessPermission]
    def create(self, request, *args, **kwargs):
        print('create1111')
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            print("\n❌ VALIDATION ERROR ON EMPLOYEE CREATE:")
            print(serializer.errors)  # <-- Ini akan menampilkan field mana yang error di terminal
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)


class EmployeeEditStaggingListView(generics.ListAPIView):
    api_codename = 'employeeStaggingRead'
    queryset = EmployeeEditStagging.objects.all()
    serializer_class = EmployeeEditStaggingSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [HasAPIAccessPermission]

class SubmitEmployeeEditView(APIView):
    api_codename = 'employeeRequestEdit'
    authentication_classes = [JWTAuthentication]
    permission_classes = [HasAPIAccessPermission]

    def post(self, request):
        employee_id = request.data.get("employee_id")
        new_data = request.data.get("changes", {})

        try:
            employee_obj = Employee.objects.get(id=employee_id)
        except Employee.DoesNotExist:
            return Response({"detail": "Employee tidak ditemukan."}, status=status.HTTP_404_NOT_FOUND)

        if employee_obj.is_edited:
            return Response(
                {"detail": "Data perubahan karyawan sudah ada yang direquest. Selesaikan terlebih dahulu sebelum diedit."},
                status=status.HTTP_400_BAD_REQUEST
            )

        changes_payload = {}

        # 1. Buat pemetaan (mapping) field_name ke verbose_name (Label Translasi)
        field_verbose_names = {}
        for f in Employee._meta.get_fields():
            if hasattr(f, 'verbose_name'):
                # str(f.verbose_name) memanggil gettext_lazy agar menjadi String
                field_verbose_names[f.name] = str(f.verbose_name).title()

        # 2. Komparasi Data Lama & Data Baru
        for field_name, new_value in new_data.items():
            if hasattr(employee_obj, field_name):
                old_value = getattr(employee_obj, field_name)

                # Format ulang jika Foreign Key
                if hasattr(old_value, 'id'):
                    old_value = old_value.id

                # Format ulang tanggal jika Date/Datetime
                if isinstance(old_value, (datetime.date, datetime.datetime)):
                    old_value = old_value.strftime("%Y-%m-%d")

                if isinstance(new_value, (datetime.date, datetime.datetime)):
                    new_value = new_value.strftime("%Y-%m-%d")

                # Bandingkan nilai (abaikan jika nilainya sama)
                if str(old_value or "") != str(new_value or ""):
                    # Ambil label translasi verbose_name, jika tidak ada fallback ke field_name
                    label = field_verbose_names.get(field_name, field_name.replace("_", " ").title())

                    changes_payload[field_name] = {
                        "label": label,  # <-- TAMBAHAN LABEL VERBOSE NAME ("ZK Employee Code")
                        "old": old_value,
                        "new": new_value
                    }

        if not changes_payload:
            return Response(
                {"detail": "Tidak ada perubahan data yang dideteksi."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            update_request = EmployeeEditStagging.objects.create(
                employee=employee_obj,
                nama_lengkap=employee_obj.nama_lengkap,
                nik_karyawan=employee_obj.nik_karyawan,
                nik_ktp=employee_obj.nik_ktp,
                changes_payload=changes_payload,
                requested_by=request.user,
                status='draft'
            )
            print('chagnepayload', changes_payload)
            employee_obj.is_edited = True
            employee_obj.save()

            return Response({
                "message": "Permohonan perubahan data berhasil diajukan.",
                "request_id": update_request.id,
                "changes": changes_payload
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response(
                {"detail": f"Gagal mengajukan permohonan perubahan data: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class ApproveEmployeeUpdateView(APIView):
    # Mapping Codename spesifik untuk setiap Action
    action_codenames = {
        'CHECK': 'employeeStaggingCheck',  # Cukup role peninjau/checker
        'APPROVE':  'employeeStaggingApprove',   # Role manager/approver
        'REJECT':   'employeeStaggingReject',    # Role manager/approver
    }
    
    # Optional: fallback codename jika action tidak terdaftar
    api_codename = 'employeeRequestEdit'

    authentication_classes = [JWTAuthentication]
    permission_classes = [HasAPIAccessPermission]

    def post(self, request, request_id):
        try:
            update_req = EmployeeEditStagging.objects.get(id=request_id)
        except EmployeeEditStagging.DoesNotExist:
            return Response({"detail": "Request tidak ditemukan."}, status=status.HTTP_404_NOT_FOUND)

        action = request.data.get("action")  # 'PROGRESS', 'APPROVE', atau 'REJECT'

        try:
            # Layer 1: Check / Mark as Progress
            if action == "CHECK":
                update_req.status = 'progress'
                update_req.save()
                return Response({"message": "Status pengajuan berhasil diubah menjadi Progress."})

            # Layer 2: Approve Data
            elif action == "APPROVE":
                employee = update_req.employee
                
                for field_name, values in update_req.changes_payload.items():
                    new_value = values.get("new")
                    if isinstance(new_value, str) and new_value.strip() == "":
                        new_value = None
                    
                    if hasattr(employee, field_name):
                        setattr(employee, field_name, new_value)
                
                employee.is_edited = False
                employee.save()

                update_req.status = 'approved'
                update_req.reviewed_by = request.user
                update_req.reviewed_at = timezone.now()
                update_req.save()

                return Response({"message": f"Data {employee.nama_lengkap} berhasil diperbarui!"})

            # Layer 3: Reject Data
            elif action == "REJECT":
                employee = update_req.employee
                if employee:
                    employee.is_edited = False
                    employee.save()

                update_req.status = 'rejected'
                update_req.reviewed_by = request.user
                update_req.reviewed_at = timezone.now()
                update_req.rejection_reason = request.data.get("reason", "")
                update_req.save()

                return Response({"message": "Permohonan perubahan data ditolak."})

        except Exception as e:
            print(f"Error on Approve View: {e}")
            return Response({"detail": f"Terjadi kesalahan: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response({"detail": "Action tidak valid."}, status=status.HTTP_400_BAD_REQUEST)
    