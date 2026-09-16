from django.db import models

class CronJob(models.Model):
    class StatusChoices(models.TextChoices):
        SUCCESS = 'SUCCESS', 'Sukses'
        FAILED = 'FAILED', 'Gagal'
        RUNNING = 'RUNNING', 'Sedang Berjalan'
        IDLE = 'IDLE', 'Belum Diuji'

    class IntervalTypeChoices(models.TextChoices):
        MINUTES = 'minutes', 'Menit'
        HOURS = 'hours', 'Jam'
        DAYS = 'days', 'Hari'

    name = models.CharField(max_length=150, help_text="Nama Cronjob / Task")
    code_name = models.CharField(max_length=100, unique=True, help_text="Kode Unik (contoh: sync_zkteco_attendance)")
    description = models.TextField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    
    # KONFIGURASI JADWAL BARU
    start_time = models.TimeField(null=True, blank=True, help_text="Jam Mulai (opsional, contoh: 08:00:00)")
    interval_value = models.PositiveIntegerField(default=5, help_text="Nilai interval (contoh: 5)")
    interval_type = models.CharField(
        max_length=10, 
        choices=IntervalTypeChoices.choices, 
        default=IntervalTypeChoices.MINUTES,
        help_text="Satuan waktu (Menit/Jam/Hari)"
    )
    
    last_run = models.DateTimeField(null=True, blank=True)
    last_status = models.CharField(max_length=20, choices=StatusChoices.choices, default=StatusChoices.IDLE)
    last_message = models.TextField(null=True, blank=True, help_text="Log output atau error message")

    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} (Setiap {self.interval_value} {self.get_interval_type_display()})"