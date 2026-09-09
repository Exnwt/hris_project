# hris_app/views.py
import hmac
import hashlib
import json
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from hris_app.models import Employee, Company

# Secret Key Rahasia yang disepakati antara hris_app dan Project Kedua
WEBHOOK_SECRET = "SecretTokenRahasiaHRIS2026"

class IncomingWebhookView(APIView):
    # Bebaskan dari autentikasi standar (karena dipanggil oleh server external)
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        # 1. Ambil Header Keamanan (Signature / Token)
        signature = request.headers.get("X-Webhook-Signature")

        if not signature:
            return Response(
                {"detail": "Akses Ditolak: Header X-Webhook-Signature tidak ditemukan."}, 
                status=status.HTTP_401_UNAUTHORIZED
            )

        # 2. Validasi HMAC Signature
        payload_bytes = request.body
        expected_signature = hmac.new(
            WEBHOOK_SECRET.encode('utf-8'),
            payload_bytes,
            hashlib.sha256
        ).hexdigest()

        if not hmac.compare_digest(signature, expected_signature):
            return Response(
                {"detail": "Akses Ditolak: Invalid Signature/Token."}, 
                status=status.HTTP_403_FORBIDDEN
            )

        # 3. Proses Payload Data
        data = request.data
        event_type = data.get("event")  # Contoh: "employee.created" atau "employee.updated"
        payload = data.get("data", {})

        print(f"[WEBHOOK RECEIVED] Event: {event_type}, Payload: {payload}")
        try:
            if event_type in ["employee.created", "employee.updated"]:
                def clean_val(val):
                    if val is None:
                        return None
                    if isinstance(val, str) and not val.strip():
                        return None
                    return val
                nik = payload.get("nik_karyawan")
                nama = payload.get("nama_lengkap")
                passport = clean_val(payload.get("passport_number"))
                nik_ktp = clean_val(payload.get("nik_ktp"))
                # Update atau Create Karyawan berdasarkan NIK
                employee, created = Employee.objects.update_or_create(
                    nik_karyawan=nik,
                    defaults={
                        # Data Utama
                        "nama_lengkap": nama,
                        "passport_number": passport,
                        "nik_ktp": nik_ktp,
                        "phone_number": clean_val(payload.get("phone_number")),
                        "email": clean_val(payload.get("email")),
                        "jenis_kelamin": payload.get("gender"),
                        "tempat_lahir": payload.get("place_birth"),
                        "tanggal_lahir": payload.get("date_birth"),
                        "agama": payload.get("religion"),
                        "blood_type": payload.get("blood_type"),
                        # "employee_status": payload.get("employee_status"),
                        
                        # Data Alamat
                        "address": payload.get("address"),
                        "kelurahan": payload.get("kelurahan"),
                        "kecamatan": payload.get("kecamatan"),
                        "city": payload.get("city"),
                        "province": payload.get("province"),
                        "pos_code": payload.get("pos_code"),

                        # Ukuran Seragam
                        "shirt_size": payload.get("shirt_size"),
                        "pants_size": payload.get("pants_size", 0),
                        "shoes_size": payload.get("shoes_size", 0),

                        # Data Keluarga
                        # "mom_name": payload.get("mom_name"),
                        "couple_name": payload.get("couple_name"),
                        "couple_date_birth": payload.get("couple_date_birth"),
                        "first_child_name": payload.get("first_child_name"),
                        "first_child_date_birth": payload.get("first_child_date_birth"),
                        "second_child_name": payload.get("second_child_name"),
                        "second_child_date_birth": payload.get("second_child_date_birth"),
                        "third_child_name": payload.get("third_child_name"),
                        "third_child_date_birth": payload.get("third_child_date_birth"),

                        # Flag Status Onboarding
                        "is_onboarding": True,
                    }
                )

                action_str = "dibuat" if created else "diperbarui"
                return Response({
                    "status": "success",
                    "message": f"Data karyawan {nik} berhasil {action_str} via Webhook."
                }, status=status.HTTP_200_OK)
            

            return Response({"message": "Event tidak dikenali, diabaikan."}, status=status.HTTP_200_OK)

        except Exception as e:
            print ('aaaaaaaaaaa', e)
            return Response({
                "status": "error",
                "detail": f"Gagal memproses data: {str(e)}"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)