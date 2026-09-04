from django.db import models
from django.contrib.auth.models import User
from .company import Company
from .division import Department, Section, Position

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
    nik_karyawan = models.CharField(max_length=50, unique=True)
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
  

class EmployeeBiometric(models.Model):
    employee = models.OneToOneField(Employee, on_delete=models.CASCADE, related_name='EmployeeBiometric')
    # Data Wajah & Sidik Jari yang telah di-ENKRIPSI (AES-256)
    encrypted_face_descriptor = models.TextField(null=True, blank=True)
    encrypted_fingerprint_template = models.TextField(null=True, blank=True)
    device_employee_id = models.CharField(max_length=100, null=True, blank=True, help_text="ID karyawan di perangkat biometrik")
    
    webauthn_credential_id = models.CharField(max_length=550, null=True, blank=True)
    webauthn_public_key = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Biometric Data: {self.employee.nama_lengkap}"
    
    
    