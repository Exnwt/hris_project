from django.core.exceptions import ValidationError
from django.db import transaction
from hris_app.models import (
    Company,
    Department,
    Employee,
    EmployeeContactHistory,
    EmployeeStatusHistory,
    EmployeeSubmissionStaging,
    Position,
    Section,
)


def validate_and_process_onboarding(
    staging_id: int, form_data: dict, processed_by_user: str
) -> Employee:
  """Memvalidasi input HR dan menyimpan data permanen ke database."""
  staging = EmployeeSubmissionStaging.objects.get(pk=staging_id)

  if staging.is_processed:
    raise ValidationError(
        'Data onboarding ini sudah pernah diproses sebelumnya.'
    )

  # 1. Validasi NIK Unik
  nik = form_data.get('nik_karyawan', '').strip()
  if not nik:
    raise ValidationError('NIK Karyawan wajib diisi.')
  if Employee.objects.filter(nik_karyawan=nik).exists():
    raise ValidationError(f"NIK Karyawan '{nik}' sudah terdaftar di sistem.")

  # 2. Ambil Master Data dari Dropdown
  try:
    company = Company.objects.get(id=form_data.get('company_id'))
    department = Department.objects.get(id=form_data.get('department_id'))
    position = Position.objects.get(id=form_data.get('position_id'))
  except (Company.DoesNotExist, Department.DoesNotExist, Position.DoesNotExist):
    raise ValidationError(
        'Perusahaan, Departemen, dan Jabatan wajib dipilih dari master data.'
    )

  section_id = form_data.get('section_id')
  section = None
  if section_id:
    try:
      section = Section.objects.get(id=section_id)
    except Section.DoesNotExist:
      raise ValidationError('Seksi yang dipilih tidak valid.')

  # 3. Validasi Relasi One-to-Many: Seksi harus milik Departemen yang dipilih
  if section and department:
    if section.department_id != department.id:
      raise ValidationError(
          f"Seksi '{section.name}' bukan merupakan bagian dari Departemen"
          f" '{department.name}'."
      )

  # 4. Transaksi Atomic Database
  with transaction.atomic():
    employee = Employee.objects.create(
        nik_karyawan=nik,
        nama_lengkap=form_data.get('nama_lengkap', '').strip(),
        nationality=form_data.get('nationality', 'WNI'),
        nik_ktp=form_data.get('nik_ktp') or None,
        passport_number=form_data.get('passport_number') or None,
        company=company,
        department=department,
        section=section,
        position=position,
        join_date=form_data.get('join_date'),
        jenis_kelamin=form_data.get('jenis_kelamin'),
        tempat_lahir=form_data.get('tempat_lahir'),
        tanggal_lahir=form_data.get('tanggal_lahir'),
        agama=form_data.get('agama'),
        pendidikan=form_data.get('pendidikan'),
    )

    EmployeeStatusHistory.objects.create(
        employee=employee,
        status=form_data.get('employment_status'),
        start_date=form_data.get('status_start_date'),
        end_date=form_data.get('status_end_date') or None,
        is_active=True,
    )

    EmployeeContactHistory.objects.create(
        employee=employee,
        alamat=form_data.get('alamat'),
        contact_person=form_data.get('contact_person'),
        emergency_contact_name=form_data.get('emergency_contact_name'),
        emergency_contact_relation=form_data.get('emergency_contact_relation'),
        emergency_contact_phone=form_data.get('emergency_contact_phone'),
        is_active=True,
    )

    staging.is_processed = True
    staging.processed_by = processed_by_user
    staging.save()

  return employee