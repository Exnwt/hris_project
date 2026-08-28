
from django.db import models
from django.contrib.auth.models import User




class APIAccessTemplate(models.Model):
    """Template / Paket Akses API.

    Berisi kumpulan daftar endpoint yang diizinkan dalam bentuk JSON.
    """

    name = models.CharField(
        max_length=100, unique=True, help_text="Nama Paket Akses (Contoh: HR Admin)"
    )
    allowed_codenames = models.JSONField(
        default=list,
        help_text=(
            "List endpoint yang diizinkan, misal: ['api-hris-submission',"
            " 'api-general-submission']"
        ),
    )
    description = models.TextField(
        null=True, blank=True, help_text="Deskripsi tambahan untuk Paket akses ini"
    )
    def __str__(self):
        return f"{self.name} ({len(self.allowed_codenames)} API)"


class UserAccessAssignment(models.Model):
    """Menghubungkan langsung User Django ke Template Akses API.

    Berlaku untuk Employee, Superuser, maupun System Account.
    """

    user = models.ForeignKey(
        User, related_name="api_access_assignments", on_delete=models.CASCADE
    )
    template = models.ForeignKey(APIAccessTemplate, on_delete=models.CASCADE)

    class Meta:
        unique_together = ("user", "template")

    def __str__(self):
        return f"{self.user.username} -> {self.template.name}"

