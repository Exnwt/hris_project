from hris_app.models import Attendance, AttendanceLog, Employee
from rest_framework import serializers

class AttedanceSerializers(serializers.ModelSerializer):

    class Meta:
        model = Attendance
        fields = '__all__'   
             
# zktco attendace
class AttendanceLogSerializer(serializers.ModelSerializer):
    employee_nik = serializers.CharField(source='employee.nik_karyawan', read_only=True)
    employee_name = serializers.CharField(source='employee.nama_lengkap', read_only=True)
    department_name = serializers.CharField(source='employee.department.name', read_only=True)

    class Meta:
        model = AttendanceLog
        fields = [
            'id', 'employee', 'employee_nik', 'employee_name', 
            'department_name', 'timestamp', 'check_type', 'sn_device', 'raw_uid'
        ]

class ZKTecoSyncSerializer(serializers.Serializer):
    biometric_user_id = serializers.CharField(max_length=50)
    timestamp = serializers.DateTimeField()
    check_type = serializers.CharField(max_length=2, default='I')
    sn_device = serializers.CharField(max_length=100, required=False, allow_blank=True)
    raw_uid = serializers.CharField(max_length=50)

    def create(self, validated_data):
        bio_id = validated_data['biometric_user_id']
        print(f"Received biometric_user_id: {bio_id}")
        try:
            employee = Employee.objects.get(biometric_user_id=bio_id)
        except Employee.DoesNotExist:
            raise serializers.ValidationError({"biometric_user_id": f"Employee dengan ID Biometrik '{bio_id}' tidak ditemukan."})

        log, created = AttendanceLog.objects.get_or_create(
            employee=employee,
            timestamp=validated_data['timestamp'],
            defaults={
                'check_type': validated_data.get('check_type', 'I'),
                'sn_device': validated_data.get('sn_device', ''),
                'raw_uid': validated_data.get('raw_uid', '')
            }
        )
        return log