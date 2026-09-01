
from django.db import models
from django.contrib.auth.models import User, Group


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
    def __str__(self):
        return f"{self.name} ({len(self.code_name)} API)"
    
    


class UserAccessAssignment(models.Model):
    """Menghubungkan langsung User Django ke Template Akses API.

    Berlaku untuk Employee, Superuser, maupun System Account.
    """

    user = models.ForeignKey(
        User, related_name="api_access_assignments", on_delete=models.CASCADE
    )
    api_endpoint = models.ForeignKey(APIEndpoint, on_delete=models.CASCADE)

    class Meta:
        unique_together = ("user", "api_endpoint")

    def __str__(self):
        return f"{self.user.username} -> {self.api_endpoint.name}"
    
    
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

