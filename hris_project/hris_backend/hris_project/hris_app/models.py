# import traceback

# print(f'\n==================== LOADING MODELS.PY ({__name__}) ====================')
# traceback.print_stack(limit=20)
# print('=======================================================================\n')


from django.db import models
from django.contrib.auth.models import User




# Create your models here.

class Company(models.Model):
    name = models.CharField(max_length=200)
    company_code = models.CharField(max_length=100)
    address = models.TextField(null=True,blank=True)
    phone_number = models.CharField(max_length=20)
    number = models.CharField(max_length=20)


    def __str__(self):
        return self.name

class Department(models.Model):
    name=models.CharField(max_length=200,unique=True)

    def __str__(self):
        return self.name

class Section(models.Model):
    name=models.CharField(max_length=200)
    department=models.ForeignKey(Department,on_delete=models.DO_NOTHING,null=True,blank=True)

    def __str__(self):
        return self.name

class Position(models.Model):
  name = models.CharField(max_length=100, unique=True)

  def __str__(self):
    return self.name

# TABEL 1: Core Employee (Data Utama yang Jarang Sekali Berubah)
class Employee(models.Model):

    class NationalityChoices(models.TextChoices):
        WNI = 'WNI', 'Warga Negara Indonesia'
        WNA = 'WNA', 'Warga Negara Asing (Expat)'

    class GenderChoices(models.TextChoices):
        LAKI_LAKI = 'L', 'Laki-laki'
        PEREMPUAN = 'P', 'Perempuan'

    class ReligionChoices(models.TextChoices):
        ISLAM = 'ISLAM', 'Islam'
        KRISTEN = 'KRISTEN', 'Kristen'
        KATOLIK = 'KATOLIK', 'Katolik'
        HINDU = 'HINDU', 'Hindu'
        BUDDHA = 'BUDDHA', 'Buddha'
        KONGHUCU = 'KONGHUCU', 'Konghucu'
        LAINNYA = 'LAINNYA', 'Lainnya'

    class EducationChoices(models.TextChoices):
        SMA = 'SMA', 'SMA/Sederajat'
        D3 = 'D3', 'Diploma 3'
        S1 = 'S1', 'Strata 1'
        S2 = 'S2', 'Strata 2'
        S3 = 'S3', 'Strata 3'
        LAINNYA = 'LAINNYA', 'Lainnya'

    user = models.OneToOneField(User, on_delete=models.CASCADE, null=True,blank=True, related_name='employee_profile')
    nik_karyawan = models.CharField(max_length=50, primary_key=True)
    nama_lengkap = models.CharField(max_length=255)
    nationality = models.CharField(
        max_length=3,
        choices=NationalityChoices.choices,
        default=NationalityChoices.WNI,
    )
    nik_ktp = models.CharField(max_length=16, unique=True, null=True, blank=True)
    passport_number = models.CharField(
        max_length=50, unique=True, null=True, blank=True
    )

    # Relasi Organisasi (Menggunakan PROTECT agar aman dari hapus tidak sengaja)
    company = models.ForeignKey(Company, on_delete=models.PROTECT)
    department = models.ForeignKey(Department, on_delete=models.PROTECT)
    section = models.ForeignKey(
        Section, on_delete=models.SET_NULL, null=True, blank=True
    )
    position = models.ForeignKey(Position, on_delete=models.PROTECT)
    join_date = models.DateField()

    # Demografi
    jenis_kelamin = models.CharField(max_length=1, choices=GenderChoices.choices)
    tempat_lahir = models.CharField(max_length=100)
    tanggal_lahir = models.DateField()
    agama = models.CharField(
        max_length=20, choices=ReligionChoices.choices, default=ReligionChoices.ISLAM
    )
    pendidikan = models.CharField(max_length=20, choices=EducationChoices.choices)

    def __str__(self):
        return f'{self.nik_karyawan} - {self.nama_lengkap}'


# TABEL 2: Status Kepegawaian (Mendukung History / Perpanjangan Kontrak)
class EmployeeStatusHistory(models.Model):

    class EmploymentStatusChoices(models.TextChoices):
        PERMANENT = 'PKWTT', 'Karyawan Tetap'
        CONTRACT = 'PKWT', 'Karyawan Kontrak'
        INTERN = 'INTERN', 'Magang/Internship'
        PROBATION = 'PROBATION', 'Karyawan Probation'

    # Menggunakan ForeignKey agar bisa menyimpan riwayat (One-to-Many)
    employee = models.ForeignKey(
        Employee, on_delete=models.CASCADE, related_name='status_histories'
    )
    status = models.CharField(
        max_length=20, choices=EmploymentStatusChoices.choices
    )
    start_date = models.DateField()
    end_date = models.DateField(
        null=True, blank=True
    )  # Kosong jika PKWTT / Tetap
    is_active = models.BooleanField(
        default=True
    )  # Penanda status mana yang sedang berlaku saat ini

    def __str__(self):
        return f'{self.employee.nama_lengkap} - {self.status} (Active: {self.is_active})'


# TABEL 3: Alamat & Kontak (Mendukung History Perubahan Alamat/Kontak)
class EmployeeContactHistory(models.Model):
    employee = models.ForeignKey(
        Employee, on_delete=models.CASCADE, related_name='contact_histories'
    )
    alamat = models.TextField()
    contact_person = models.CharField(max_length=20)  # No HP Karyawan

    # Emergency Contact ikut di sini karena sering sepaket dengan data kontak
    emergency_contact_name = models.CharField(max_length=255)
    emergency_contact_relation = models.CharField(max_length=50)
    emergency_contact_phone = models.CharField(max_length=20)

    is_active = models.BooleanField(default=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return (
            f'Kontak/Alamat {self.employee.nama_lengkap} (Active: {self.is_active})'
        )


class EmployeeSubmissionStaging(models.Model):
  # Menyimpan seluruh data mentah dari Google/Microsoft Form dalam bentuk JSON
  raw_payload = models.JSONField()

  # Status untuk melacak apakah data sudah diproses HR atau belum
  is_processed = models.BooleanField(default=False)
  created_at = models.DateTimeField(auto_now_add=True)

  # Opsional: Mencatat siapa HR yang memprosesnya
  processed_by = models.CharField(max_length=100, null=True, blank=True)

  def __str__(self):
    return (
        f'Submission ID: {self.id} - Processed: {self.is_processed}'
    )
  
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

