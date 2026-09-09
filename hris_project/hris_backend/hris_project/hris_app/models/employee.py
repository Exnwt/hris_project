from django.db import models
from django.contrib.auth.models import User
from .company import Company
from .division import Department, Section, Position
from django.utils.translation import gettext_lazy as _
from datetime import timezone

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

    BLOOD_CHOICE = [
        ('A', 'A'),
        ('B', 'B'),
        ('AB', 'AB'),
        ('O', 'O')
    ]

    SIZE_CHOICE = [
        ('S', 'S'),
        ('M', 'M'),
        ('L', 'L'),
        ('XL', 'XL'),
        ('XXL', 'XXL'),
        ('XXXL', 'XXXL'),
    ]

    EMPLOYEE_STATUS_CHOICES = [
        ('TK/0', 'Belum Menikah / Janda (TK/0)'),
        ('K/0', 'Menikah (K/0)'),
        ('K/1', 'Menikah, Anak 1 (K/1)'),
        ('K/2', 'Menikah, Anak 2 (K/2)'),
        ('K/3', 'Menikah, Anak 3 (K/3)'),
        ('TK/1', 'Duda, Anak 1 (TK/1)'),
        ('TK/2', 'Duda, Anak 2 (TK/2)'),
        ('TK/3', 'Duda, Anak 3 (TK/3)'),
    ]

    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('progress', 'In Progress'),
        ('active', 'Active'),
        ('inactive' 'Inactive')
    ]
    FORM_STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('progress', 'In Progress'),
        ('approved', 'Approved'),
        ('rejected' 'Rejected')
    ]

    RELATION_CHOICE = [
        ('ayah', 'Ayah'),
        ('ibu', 'Ibu'),
        ('kakak', 'Kakak'),        
        ('adik', 'Adik'),
        ('saudara', 'Saudara'),
        ('pasangan', 'Suami/Istri')
    ]

    class EducationChoices(models.TextChoices):
        SMA = 'SMA', 'SMA/Sederajat'
        D3 = 'D3', 'Diploma 3'
        S1 = 'S1', 'Strata 1'
        S2 = 'S2', 'Strata 2'
        S3 = 'S3', 'Strata 3'
        LAINNYA = 'LAINNYA', 'Lainnya'

    biometric_user_id = models.CharField(
        max_length=50, 
        unique=True, 
        null=True, 
        blank=True, 
        help_text="User ID / Enrollment ID yang didaftarkan di mesin ZKTeco"
    )
    user = models.OneToOneField(User, on_delete=models.CASCADE, null=True,blank=True, related_name='employee_profile')
    # A. Data diri
    nama_lengkap = models.CharField(max_length=255)
    nik_karyawan = models.CharField(max_length=50, unique=True)
    nik_ktp = models.CharField(max_length=16, unique=True, null=True, blank=True)
    nationality = models.CharField(
        max_length=3,
        choices=NationalityChoices.choices,
        default=NationalityChoices.WNI,
    )
    phone_number = models.CharField(_("No Whatsapp"), max_length=18, null=True, blank=True) 
    email = models.EmailField(_("Email"), max_length=254, null=True, blank=True)
    jenis_kelamin = models.CharField(max_length=1, choices=GenderChoices.choices)
    tempat_lahir = models.CharField(max_length=100)
    tanggal_lahir = models.DateField()
    agama = models.CharField(max_length=20, choices=ReligionChoices.choices, default=ReligionChoices.ISLAM)
    blood_type = models.CharField(_("Blood Type"), max_length=2, choices=BLOOD_CHOICE, null=True, blank=True) 
    pendidikan = models.CharField(max_length=20, choices=EducationChoices.choices)
    passport_number = models.CharField(max_length=50, unique=True, null=True, blank=True)
    join_date = models.DateField(null=True, blank=True)

    # Relasi Organisasi (Menggunakan PROTECT agar aman dari hapus tidak sengaja)
    company = models.ForeignKey(Company, on_delete=models.PROTECT, null=True, blank=True)
    department = models.ForeignKey(Department, on_delete=models.PROTECT, null=True, blank=True)
    section = models.ForeignKey(
        Section, on_delete=models.SET_NULL, null=True, blank=True
    )
    position = models.ForeignKey(Position, on_delete=models.PROTECT, null=True, blank=True)

    # B. Alamat
    address = models.TextField(_("Address"), null=True, blank=True)
    kelurahan = models.CharField(_("Kelurahan"), max_length=50, null=True, blank=True)
    kecamatan = models.CharField(_("Kecamatan"), max_length=50, null=True, blank=True)
    city = models.CharField(_("City"), max_length=50, null=True, blank=True)
    province = models.CharField(_("Province"), max_length=50, null=True, blank=True)
    pos_code = models.CharField(_("Pos Code"), max_length=10, null=True, blank=True) 


    
    # other relation and Emergency Contact
    couple_name = models.CharField(_("Couple Name"), max_length=100, null=True, blank=True)
    couple_date_birth = models.DateField(_("Couple Date of Birth"), null=True, blank=True)
    
    first_child_name = models.CharField(_("First Child Name"), max_length=100, null=True, blank=True)
    first_child_date_birth = models.DateField(_("First Child Date of Birth"), null=True, blank=True)
    
    second_child_name = models.CharField(_("Second Child Name"), max_length=100, null=True, blank=True)
    second_child_date_birth = models.DateField(_("Second Child Date of Birth"), null=True, blank=True)
    
    third_child_name = models.CharField(_("Third Child Name"), max_length=100, null=True, blank=True)
    third_child_date_birth = models.DateField(_("Third Child Date of Birth"), null=True, blank=True)
    emergency_contact_name = models.CharField(_("Emergency Contact Name"), max_length=100, null=True, blank=True)
    emergency_contact_phone = models.CharField(_("Emergency Contact Phone"), max_length=18, null=True, blank=True) 
    emergency_contact_relation = models.CharField(_("Emergency Contact Relation"), max_length=10, choices=RELATION_CHOICE, default='ayah')


    shirt_size = models.CharField(_("Shirt Size"), max_length=5, choices=SIZE_CHOICE, default='S')
    pants_size = models.SmallIntegerField(_("Pants Size"),default=30 ) 
    shoes_size = models.SmallIntegerField(_("Shoes Size"), default=35)
    tangal_induksi = models.DateField(_("Tanggal Induksi"), null=True, blank=True)
    poin_of_hire = models.CharField(_("Point Of Hire"), max_length=50, null=True, blank=True)
    is_local = models.BooleanField(_("Origin Type"), default=False)
    is_staff = models.BooleanField(_("Grade"), default=False)
    raw_payload = models.JSONField(null=True, blank=True)
    is_onboarding = models.BooleanField(_("Is Onboarding"),  default=False)

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
    
    
    