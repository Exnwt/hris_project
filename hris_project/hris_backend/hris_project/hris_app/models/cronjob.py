from django.db import models

class CronJob(models.Model):
    class StatusChoices(models.TextChoices):
        SUCCESS = 'SUCCESS', 'Sukses'
        FAILED = 'FAILED', 'Gagal'
        RUNNING = 'RUNNING', 'Sedang Berjalan'
        IDLE = 'IDLE', 'Belum Diuji'

    name = models.CharField(max_length=150, help_text="Nama Cronjob / Task")
    code_name = models.CharField(max_length=100, unique=True, help_text="Kode Unik (contoh: sync_zkteco_attendance)")
    schedule = models.CharField(max_length=100, help_text="Format Cron (contoh: */5 * * * *) atau deskripsi teks")
    description = models.TextField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    
    last_run = models.DateTimeField(null=True, blank=True)
    last_status = models.CharField(max_length=20, choices=StatusChoices.choices, default=StatusChoices.IDLE)
    last_message = models.TextField(null=True, blank=True, help_text="Log output atau error message")

    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} ({self.schedule})"