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
from datetime import timezone
import datetime

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
        print(1111)
        # employee_id, changes {},
        employee_id = request.data.get("employee_id")
        new_data = request.data.get("changes", {}) # Dictionary berisi inputan baru dari form
        try:
            employee_obj = Employee.objects.get(id=employee_id)
            print
        except Employee.DoesNotExist:
            print('err111')
            return Response({"detail": "Employee tidak ditemukan."}, status=status.HTTP_404_NOT_FOUND)

        if employee_obj.is_edited :
            return Response({"detail": "Data Perubahan Karyawan Sudah Ada yang Direquest Selesaikan Terlebih Dahulu Sebelum Di edit ."}, status=status.HTTP_400_BAD_REQUEST)

        changes_payload = {}

        # Bandingkan data lama di DB dengan data baru yang dikirim
        for field_name, new_value in new_data.items():
            if hasattr(employee_obj, field_name):
                old_value = getattr(employee_obj, field_name)

                # Format ulang jika nilai berupa relational object (opsional)
                if hasattr(old_value, 'id'):
                    old_value = old_value.id

                if isinstance(old_value, (datetime.date, datetime.datetime)):
                    old_value = old_value.strftime("%Y-%m-%d")

                if isinstance(new_value, (datetime.date, datetime.datetime)):
                    new_value = new_value.strftime("%Y-%m-%d")

                # Hanya simpan jika datanya benar-benar berubah
                if str(old_value) != str(new_value):
                    changes_payload[field_name] = {
                        "old": old_value,
                        "new": new_value
                    }

        if not changes_payload:
            return Response(
                {"detail": "Tidak ada perubahan data yang dideteksi."}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        try :
        # Simpan ke tabel Staging
            update_request = EmployeeEditStagging.objects.create(
                employee=employee_obj,
                nama_lengkap = employee_obj.nama_lengkap,
                nik_karyawan= employee_obj.nik_karyawan,
                nik_ktp= employee_obj.nik_ktp,
                changes_payload=changes_payload,
                requested_by=request.user,
                status='draft'
            )
            print('updaterequest', update_request)
            employee_obj.is_edited = True
            employee_obj.save()

            return Response({
                "message": "Permohonan perubahan data berhasil diajukan.",
                "request_id": update_request.id,
                "changes": changes_payload
            }, status=status.HTTP_201_CREATED)
        except Exception as e:
            print('err222', e)
            return Response(
                {"detail": f"Gagal mengajukan permohonan perubahan data: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ApproveEmployeeUpdateView(APIView):
    def post(self, request, request_id):
        try:
            print(1111)
            update_req = EmployeeEditStagging.objects.get(id=request_id)
        except EmployeeEditStagging.DoesNotExist:
            return Response({"detail": "Request tidak ditemukan."}, status=status.HTTP_404_NOT_FOUND)

        action = request.data.get("action")  # 'PROGRESS', 'APPROVE', atau 'REJECT'

        # Layer 1: Check / Mark as Progress
        if action == "PROGRESS":
            update_req.status = 'progress'
            update_req.save()
            return Response({"message": "Status pengajuan berhasil diubah menjadi Progress."})

        # Layer 2: Approve Data
        elif action == "APPROVE":
            employee = update_req.employee
            
            # Terapkan nilai 'new' ke model Employee
            for field_name, values in update_req.changes_payload.items():
                new_value = values.get("new")
                if hasattr(employee, field_name):
                    setattr(employee, field_name, new_value)
            
            # Kembalikan flag is_edited agar bisa diedit lagi di masa mendatang
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

        return Response({"detail": "Action tidak valid."}, status=status.HTTP_400_BAD_REQUEST)