from hris_app.models import Attendance, AttendanceLog, Employee
import logging
from hris_app.serializers.attendance_serializers import AttedanceSerializers, AttendanceLogSerializer, ZKTecoSyncSerializer
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.authentication import TokenAuthentication  # Django Token 
from rest_framework.permissions import IsAuthenticated
from rest_framework import viewsets, permissions, status
from hris_app.permissions import HasAPIAccessPermission
from django.utils.decorators import method_decorator
from django.views import View
from django.views.decorators.csrf import csrf_exempt    
from django.http import HttpResponse
logger = logging.getLogger(__name__)

class AttendanceViewSet(viewsets.ModelViewSet):
    queryset = Attendance.objects.all()
    serializer_class = AttedanceSerializers
    api_codename = 'Attendace'
    authentication_classes = [JWTAuthentication]
    permission_classes = [permissions.IsAuthenticated, HasAPIAccessPermission]
    
    
class AttendanceLogViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet untuk Frontend melihat riwayat absensi"""
    queryset = AttendanceLog.objects.select_related('employee', 'employee__department').all()
    serializer_class = AttendanceLogSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        # Jika bukan admin/HR, hanya tampilkan absensi miliknya sendiri
        # user = self.request.user
        # if not user.is_staff and hasattr(user, 'employee_profile'):
        #     queryset = queryset.filter(employee=user.employee_profile)

        # Filter tanggal jika dikirim via Query Parameters
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        if start_date and end_date:
            queryset = queryset.filter(timestamp__date__range=[start_date, end_date])

        print("iniqueryset", queryset)
        return queryset


class ZKTecoPushSyncView(APIView):
    """API Endpoint untuk menerima Push Sync Log dari Script Python PyZK / Service Mesin ZK"""
    permission_classes = [IsAuthenticated] # Gunakan API Key atau Token Auth

    def post(self, request):
        is_many = isinstance(request.data, list)
        serializer = ZKTecoSyncSerializer(data=request.data, many=is_many)
        
        if serializer.is_valid():
            serializer.save()
            return Response({"status": "success", "message": "Log absensi berhasil disinkronisasi"}, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
# @method_decorator(csrf_exempt, name='dispatch')
# class ZKDeviceCDataView(View):
#     """
#     Endpoint HTTP tempat mesin ZKTeco melakukan POST log absensi real-time.
#     Path URL: /iclock/cdata
#     """
#     def get(self, request):
#         # Saat pertama kali dihubungkan, mesin ZK biasanya melakukan Handshake (GET)
#         SN = request.GET.get('SN', '')
#         logger.info(f"ZK Device Handshake SN: {SN}")
#         return HttpResponse("OK", content_type="text/plain")

#     def post(self, request):
#         SN = request.GET.get('SN', '')
#         table = request.GET.get('table', 'ATTLOG')
#         body = request.body.decode('utf-8', errors='ignore')

#         logger.info(f"Received ZK Push Data from SN: {SN}, Table: {table}")

#         if table == 'ATTLOG' or 'ATTLOG' in body:
#             self.process_attendance_data(body, SN)

#         # Mesin ZKTeco mengharapkan respon 'OK' teks biasa dari server
#         return HttpResponse("OK", content_type="text/plain")

#     def process_attendance_data(self, body, sn_device):
#         """
#         Format baris data dari mesin ZK biasanya berupa tab-separated string:
#         [USER_ID/PIN]\t[TIMESTAMP]\t[VERIFY_TYPE]\t[PUNCH_TYPE]\t...
#         Contoh: 1001\t2026-09-05 08:30:00\t1\t0
#         """
#         lines = body.strip().split('\n')
#         for line in lines:
#             if not line.strip():
#                 continue

#             parts = line.split('\t')
#             if len(parts) >= 2:
#                 bio_user_id = parts[0].strip()
#                 timestamp_str = parts[1].strip()
#                 punch_type = parts[3].strip() if len(parts) > 3 else '0'

#                 try:
#                     dt = datetime.strptime(timestamp_str, '%Y-%m-%d %H:%M:%S')
                    
#                     # 1. Cari Karyawan berdasarkan biometric_user_id
#                     employee = Employee.objects.filter(biometric_user_id=bio_user_id).first()
                    
#                     if employee:
#                         # Punch 0 = Check-in ('I'), Punch 1 = Check-out ('O')
#                         check_type = 'I' if punch_type == '0' else 'O'

#                         # 2. Simpan ke Database
#                         AttendanceLog.objects.get_or_create(
#                             employee=employee,
#                             timestamp=dt,
#                             defaults={
#                                 'check_type': check_type,
#                                 'sn_device': sn_device or 'ZK-HTTP-PUSH',
#                                 'raw_uid': bio_user_id
#                             }
#                         )
#                         logger.info(f"Real-Time Log Saved: {employee.nama_lengkap} ({dt})")
#                     else:
#                         logger.warning(f"Employee ID Biometrik '{bio_user_id}' tidak terdaftar di HRIS.")

#                 except Exception as e:
#                     logger.error(f"Gagal memproses baris log ZK '{line}': {str(e)}")


# @method_decorator(csrf_exempt, name='dispatch')
# class ZKDeviceGetRequestView(View):
#     """
#     Endpoint tempat mesin ZKTeco meminta antrean perintah server (Optional / Heartbeat).
#     Path URL: /iclock/getrequest
#     """
#     def get(self, request):
#         return HttpResponse("OK", content_type="text/plain")