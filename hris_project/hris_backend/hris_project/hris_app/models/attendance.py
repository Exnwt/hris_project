# hris_app/models.py
from django.db import models
from django.contrib.auth.models import User
from hris_app.models import Employee  # Model Employee utama Anda


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