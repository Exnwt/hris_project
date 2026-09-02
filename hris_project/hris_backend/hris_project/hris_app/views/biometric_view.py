# hris_app/views/biometric_view.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from rest_framework_simplejwt.authentication import JWTAuthentication

from hris_app.models import Employee, EmployeeBiometric
from hris_app.utils.security import encrypt_data
from hris_app.permissions import HasAPIAccessPermission
from datetime import datetime
from hris_app.models import Attendance
from hris_app.utils.security import decrypt_data
from hris_app.utils.biometric_matcher import verify_face_descriptor, verify_fingerprint_template

class BiometricEnrollmentView(APIView):
    """
    Endpoint untuk Mendaftarkan (Enroll) Biometrik Karyawan
    Dilengkapi dengan fitur Anti-Duplicate Detection.
    URL: POST /api/v2/biometric/enroll/
    """
    api_codename = "api-biometric-enroll"

    def post(self, request):
        nik_karyawan = request.data.get("nik_karyawan")
        face_vector = request.data.get("face_descriptor") # Array 128 float
        fingerprint_template = request.data.get("fingerprint_template") # String Base64 / Hash
        device_pin_id = request.data.get("device_pin_id")

        if not nik_karyawan:
            return Response({"detail": "NIK Karyawan wajib diisi."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            employee = Employee.objects.get(nik_karyawan=nik_karyawan)
        except Employee.DoesNotExist:
            return Response({"detail": "Karyawan tidak ditemukan."}, status=status.HTTP_404_NOT_FOUND)

        # Ambil seluruh biometrik yang sudah ada di DB untuk validasi duplikasi
        all_biometrics = EmployeeBiometric.objects.select_related('employee').all()

        # =========================================================
        # 1. VALIDASI DUPLIKASI WAJAH (ANTI-COLLISION CHECK)
        # =========================================================
        if face_vector:
            if not isinstance(face_vector, list) or len(face_vector) != 128:
                return Response({"detail": "Format Vektor Wajah harus berupa array 128 float."}, status=status.HTTP_400_BAD_REQUEST)

            for bio in all_biometrics:
                # Dilewati jika record ini milik karyawan yang sedang di-enroll (ijinkan update wajah sendiri)
                if bio.employee_id == employee.nik_karyawan:
                    continue

                if bio.encrypted_face_descriptor:
                    stored_vector = decrypt_data(bio.encrypted_face_descriptor)
                    is_match, distance = verify_face_descriptor(face_vector, stored_vector, threshold=0.50)

                    # Jika wajah cocok dengan karyawan lain -> TOLAK ENROLLMENT!
                    if is_match:
                        return Response({
                            "detail": f"Gagal Enrollment! Wajah ini SUDAH TERDAFTAR atas nama karyawan: '{bio.employee.nama_lengkap}' (NIK: {bio.employee.nik_karyawan}). Harap periksa kembali karyawan yang dipilih."
                        }, status=status.HTTP_400_BAD_REQUEST)

        # =========================================================
        # 2. VALIDASI DUPLIKASI SIDIK JARI
        # =========================================================
        if fingerprint_template:
            for bio in all_biometrics:
                if bio.employee_id == employee.nik_karyawan:
                    continue

                if bio.encrypted_fingerprint_template:
                    stored_template = decrypt_data(bio.encrypted_fingerprint_template)
                    is_match = verify_fingerprint_template(fingerprint_template, stored_template)

                    # Jika sidik jari cocok dengan karyawan lain -> TOLAK ENROLLMENT!
                    if is_match:
                        return Response({
                            "detail": f"Gagal Enrollment! Sidik jari ini SUDAH TERDAFTAR atas nama karyawan: '{bio.employee.nama_lengkap}' (NIK: {bio.employee.nik_karyawan})."
                        }, status=status.HTTP_400_BAD_REQUEST)

        # =========================================================
        # 3. PROSES SIMPAN JIKA TIDAK ADA DUPLIKASI
        # =========================================================
        biometric, _ = EmployeeBiometric.objects.get_or_create(employee=employee)

        if face_vector:
            biometric.encrypted_face_descriptor = encrypt_data(face_vector)

        if fingerprint_template:
            biometric.encrypted_fingerprint_template = encrypt_data(fingerprint_template)

        if device_pin_id:
            biometric.device_pin_id = device_pin_id

        biometric.save()

        return Response({
            "message": f"Pendaftaran Biometrik Karyawan {employee.nama_lengkap} BERHASIL disimpan (Terenkripsi AES-256).",
            "has_face": biometric.encrypted_face_descriptor is not None,
            "has_fingerprint": biometric.encrypted_fingerprint_template is not None
        }, status=status.HTTP_200_OK)
        
# class BiometricEnrollmentView(APIView):
#     """
#     Endpoint untuk Mendaftarkan (Enroll) Biometrik Karyawan
#     URL: POST /api/v2/biometric/enroll/
#     """
#     # authentication_classes = [JWTAuthentication]
#     # permission_classes = [permissions.IsAuthenticated, HasAPIAccessPermission]
#     api_codename = "api-biometric-enroll"

#     def post(self, request):
#         nik_karyawan = request.data.get("nik_karyawan")
#         face_vector = request.data.get("face_descriptor") # Array 128 float
#         fingerprint_template = request.data.get("fingerprint_template") # String Base64 / Hash
#         device_pin_id = request.data.get("device_pin_id")

#         if not nik_karyawan:
#             return Response({"detail": "NIK Karyawan wajib diisi."}, status=status.HTTP_400_BAD_REQUEST)

#         try:
#             employee = Employee.objects.get(nik_karyawan=nik_karyawan)
#         except Employee.DoesNotExist:
#             return Response({"detail": "Karyawan tidak ditemukan."}, status=status.HTTP_404_NOT_FOUND)

#         # Get or Create record biometrik
#         biometric, _ = EmployeeBiometric.objects.get_or_create(employee=employee)

#         # 1. ENROLLMENT WAJAH
#         if face_vector:
#             if not isinstance(face_vector, list) or len(face_vector) != 128:
#                 return Response({"detail": "Format Vektor Wajah harus berupa array 128 float."}, status=status.HTTP_400_BAD_REQUEST)
            
#             # Enkripsi data sebelum disimpan
#             biometric.encrypted_face_descriptor = encrypt_data(face_vector)

#         # 2. ENROLLMENT SIDIK JARI
#         if fingerprint_template:
#             # Enkripsi template sidik jari
#             biometric.encrypted_fingerprint_template = encrypt_data(fingerprint_template)

#         # 3. PIN MESIN HARDWARE (Opsional)
#         if device_pin_id:
#             biometric.device_pin_id = device_pin_id

#         biometric.save()

#         return Response({
#             "message": f"Pendaftaran Biometrik Karyawan {employee.nama_lengkap} BERHASIL disimpan (Terenkripsi AES-256).",
#             "has_face": biometric.encrypted_face_descriptor is not None,
#             "has_fingerprint": biometric.encrypted_fingerprint_template is not None
#         }, status=status.HTTP_200_OK)
        

class BiometricVerificationView(APIView):
    """
    Endpoint untuk Identifikasi & Verifikasi Absensi Karyawan via Biometrik.
    Sistem akan mencari Karyawan mana yang cocok dengan wajah/fingerprint yang dikirim.
    URL: POST /api/v2/access/biometric/verify-clock/
    """
    api_codename = "api-biometric-verify"

    def post(self, request):
        method = request.data.get("method")  # "FACE" atau "FINGERPRINT"
        action_type = request.data.get("type", "IN")  # "IN" atau "OUT"

        matched_employee = None
        best_distance = 999.0

        # Ambil seluruh data biometrik yang terdaftar di database
        all_biometrics = EmployeeBiometric.objects.select_related('employee').all()

        if not all_biometrics.exists():
            return Response(
                {"detail": "Belum ada data biometrik karyawan yang terdaftar di sistem."},
                status=status.HTTP_404_NOT_FOUND
            )

        # =========================================================
        # 1. IDENTIFIKASI VIA WAJAH (FACE RECOGNITION 1-TO-N)
        # =========================================================
        if method == "FACE":
            incoming_vector = request.data.get("face_descriptor")

            if not incoming_vector or len(incoming_vector) != 128:
                return Response(
                    {"detail": "Data vektor wajah tidak valid. Harus berupa array 128 float."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Iterasi seluruh karyawan untuk mencari jarak (Euclidean Distance) terdekat
            for bio in all_biometrics:
                if not bio.encrypted_face_descriptor:
                    continue

                stored_vector = decrypt_data(bio.encrypted_face_descriptor)
                is_match, distance = verify_face_descriptor(incoming_vector, stored_vector, threshold=0.50)

                # Cari yang paling cocok (distance terkecil di bawah threshold)
                if is_match and distance < best_distance:
                    best_distance = distance
                    matched_employee = bio.employee

            if not matched_employee:
                return Response({
                    "detail": "Wajah tidak dikenali dalam sistem. Silakan coba lagi.",
                    "matched": False
                }, status=status.HTTP_401_UNAUTHORIZED)

        # =========================================================
        # 2. IDENTIFIKASI VIA SIDIK JARI (FINGERPRINT 1-TO-N)
        # =========================================================
        elif method == "FINGERPRINT":
            incoming_template = request.data.get("fingerprint_template")

            if not incoming_template:
                return Response(
                    {"detail": "Data template sidik jari tidak boleh kosong."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            for bio in all_biometrics:
                if not bio.encrypted_fingerprint_template:
                    continue

                stored_template = decrypt_data(bio.encrypted_fingerprint_template)
                is_match = verify_fingerprint_template(incoming_template, stored_template)

                if is_match:
                    matched_employee = bio.employee
                    break

            if not matched_employee:
                return Response({
                    "detail": "Sidik jari tidak cocok dengan data karyawan manapun.",
                    "matched": False
                }, status=status.HTTP_401_UNAUTHORIZED)

        else:
            return Response(
                {"detail": "Metode tidak valid. Gunakan 'FACE' atau 'FINGERPRINT'."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # =========================================================
        # 3. PROSES ABSENSI UNTUK KARYAWAN YANG DITEMUKAN
        # =========================================================
        today = datetime.now().date()
        now_time = datetime.now().time()

        attendance, _ = Attendance.objects.get_or_create(
            employee=matched_employee,
            date=today,
            defaults={'method': method}
        )

        if action_type == "IN":
            if attendance.clock_in is not None:
                return Response({
                    "detail": f"Karyawan {matched_employee.nama_lengkap} sudah melakukan Clock-In hari ini pukul {attendance.clock_in.strftime('%H:%M:%S')}."
                }, status=status.HTTP_400_BAD_REQUEST)

            attendance.clock_in = now_time
            attendance.save()

            return Response({
                "message": f"Berhasil! Karyawan Dikenali: {matched_employee.nama_lengkap}. Clock-In pukul {now_time.strftime('%H:%M:%S')}.",
                "nik_karyawan": matched_employee.nik_karyawan,
                "nama_lengkap": matched_employee.nama_lengkap,
                "matched": True
            }, status=status.HTTP_200_OK)

        elif action_type == "OUT":
            if attendance.clock_in is None:
                return Response({
                    "detail": f"Karyawan {matched_employee.nama_lengkap} belum melakukan Clock-In hari ini."
                }, status=status.HTTP_400_BAD_REQUEST)

            attendance.clock_out = now_time
            attendance.save()

            return Response({
                "message": f"Berhasil! Karyawan Dikenali: {matched_employee.nama_lengkap}. Clock-Out pukul {now_time.strftime('%H:%M:%S')}.",
                "nik_karyawan": matched_employee.nik_karyawan,
                "nama_lengkap": matched_employee.nama_lengkap,
                "matched": True
            }, status=status.HTTP_200_OK)