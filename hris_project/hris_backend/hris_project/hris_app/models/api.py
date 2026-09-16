
from django.db import models
from django.contrib.auth.models import User, Group
from django.utils.translation import gettext_lazy as _


# APIAccessTemplate
class APIEndpoint(models.Model):
    """Template / Paket Akses API.

    Berisi kumpulan daftar endpoint yang diizinkan dalam bentuk JSON.
    """

    name = models.CharField(
        max_length=100, unique=True, help_text="Nama fungsi API (Contoh: Employee list, Employee create, employee tabel view, dll)"
    )
    code_name = models.CharField(
        max_length=100, 
        unique=True, 
        help_text="Identifikasi unik endpoint (Contoh: api-hris-submission)"
    )
    description = models.TextField(
        null=True, blank=True, help_text="Deskripsi tambahan untuk fungsi api ini"
    )
    model_name = models.CharField(max_length=100, default="General", help_text="Nama Model / Modul (Contoh: Employee, Department, Contract)")
    is_read = models.BooleanField(_("Read"), default=False)
    is_update = models.BooleanField(_("Update"), default=False)
    is_create = models.BooleanField(_("Create"), default=False)
    is_delete = models.BooleanField(_("Delete"), default=False)
    is_crud = models.BooleanField(_("CRUD API"), default=True)
    is_additional = models.BooleanField(_("Additional"), default=False)


    def __str__(self):
        return f"{self.name} ({len(self.code_name)} API)"
    
    
class GroupAccessAssignment(models.Model):
    """
    Menghubungkan Group Django ke Template Akses API.
    """
    
    group = models.ForeignKey(
        Group, related_name="api_access_assignments", on_delete=models.CASCADE
    )
    api_endpoint = models.ForeignKey(APIEndpoint, on_delete=models.CASCADE)

    class Meta:
        unique_together = ("group", "api_endpoint")

    def __str__(self):
        return f"{self.group.name} -> {self.api_endpoint.name}"


class ExcelTemplate(models.Model):
    name = models.CharField(max_length=150)  # Nama Template, misal: "Format Laporan KTP & WA"
    target_model = models.CharField(max_length=100)  # Misal: "Employee", "Department"
    description = models.TextField(null=True, blank=True)
    
    # JSONField menyimpan urutan dan daftar kolom yang dipilih
    # Format: [{"field": "nik_karyawan", "label": "NIK Karyawan"}, {"field": "nama_lengkap", "label": "Nama"}]
    selected_fields = models.JSONField(help_text="Menyimpan urutan dan daftar kolom")
    
    created_by = models.ForeignKey(User, on_delete=models.DO_NOTHING, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} ({self.target_model})"
