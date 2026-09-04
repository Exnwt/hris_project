from hris_app.models import Attendance, AttendanceLog
from hris_app.serializers.attendance_serializers import AttedanceSerializers, AttendanceLogSerializer, ZKTecoSyncSerializer
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.authentication import TokenAuthentication  # Django Token 
from rest_framework.permissions import IsAuthenticated
from rest_framework import viewsets, permissions, status
from hris_app.permissions import HasAPIAccessPermission

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