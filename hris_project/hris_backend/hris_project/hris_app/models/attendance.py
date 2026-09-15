# hris_app/models.py
from django.db import models
from django.contrib.auth.models import User
from hris_app.models import Employee
from django.utils.translation import gettext_lazy as _


class Attendance(models.Model):
    METHOD_CHOICES = (
        ('FACE', 'Face Recognition'),
        ('FINGERPRINT', 'Fingerprint Device / WebAuthn'),
        ('MANUAL', 'Manual Admin Approval'),
    )

    STATUS_CHOICES = (
        ('PRESENT', 'Hadir Tepat Waktu'),
        ('LATE', 'Terlambat'),
        ('EARLY_LEAVE', 'Pulang Cepat'),
        ('ABSENT', 'Mangkir / Tanpa Keterangan'),
    )
    
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name="attendances")
    date = models.DateField(auto_now_add=True)
    clock_in = models.TimeField(null=True, blank=True)
    clock_out = models.TimeField(null=True, blank=True)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PRESENT')
    method = models.CharField(max_length=20, choices=METHOD_CHOICES, default='FACE')
    
    # Geolocation GPS
    clock_in_lat = models.FloatField(null=True, blank=True)
    clock_in_long = models.FloatField(null=True, blank=True)
    clock_out_lat = models.FloatField(null=True, blank=True)
    clock_out_long = models.FloatField(null=True, blank=True)
    
    # Gambar Bukti Absensi (Opsional)
    snapshot_image = models.ImageField(upload_to="attendance_snapshots/", null=True, blank=True)

    class Meta:
        unique_together = ('employee', 'date')

    def __str__(self):
        return f"{self.employee.nama_lengkap} - {self.date} [{self.status}]"
    

class AttendanceLog(models.Model):
    class CheckTypeChoices(models.TextChoices):
        CHECK_IN = 'I', 'Check In'
        CHECK_OUT = 'O', 'Check Out'
        OVERTIME_IN = '1', 'Overtime In'
        OVERTIME_OUT = '2', 'Overtime Out'

    employee = models.ForeignKey(Employee, on_delete=models.SET_NULL, related_name='attendance_logs', null=True, blank=True)
    
    employee_nik = models.CharField(max_length=50, null=True, blank=True)
    employee_name = models.CharField(max_length=200, null=True, blank=True)
    department_name = models.CharField(max_length=200, null=True, blank=True)
    position_name = models.CharField(max_length=200, null=True, blank=True)
    
    timestamp = models.DateTimeField()
    check_type = models.CharField(max_length=2, choices=CheckTypeChoices.choices, default=CheckTypeChoices.CHECK_IN)
    sn_device = models.CharField(max_length=100, null=True, blank=True, help_text="Serial Number Mesin ZKTeco")
    raw_uid = models.CharField(max_length=50, null=True, blank=True, help_text="UID Mentah / emp_code dari Mesin ZK")
    zk_id = models.BigIntegerField(_("ZKTeco Attendance ID"), unique=True, null=True, blank=True)
    raw_payload = models.JSONField(_("Attendance Raw Payload"), null=True, blank=True)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        emp_display = self.employee_name or (self.employee.name if self.employee else "Unknown")
        return f"{emp_display} - {self.timestamp.strftime('%Y-%m-%d %H:%M:%S')}"