import hmac
import hashlib
import json
from django.db.models import Q
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from hris_app.models import Employee, Company

WEBHOOK_SECRET = "SecretTokenRahasiaHRIS2026"

class IncomingWebhookView(APIView):
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        # 1. Ambil Header Keamanan
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
        event_type = data.get("event")
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

                # Ambil Identifier Kunci
                onboarding_id = clean_val(payload.get("onboarding_id"))
                nik_ktp = clean_val(payload.get("nik_ktp"))
                nik = clean_val(payload.get("nik_karyawan"))
                nama = clean_val(payload.get("nama_lengkap"))

                # 🟢 4. LOGIKA PENCEKAN KEBERADAAN DATA (LOOKUP)
                # Cari record berdasarkan onboarding_id OR nik_ktp OR nik_karyawan
                lookup_query = Q()
                if onboarding_id:
                    lookup_query |= Q(onboarding_id=onboarding_id)
                if nik_ktp:
                    lookup_query |= Q(nik_ktp=nik_ktp)
                if nik:
                    lookup_query |= Q(nik_karyawan=nik)

                employee = None
                if lookup_query:
                    employee = Employee.objects.filter(lookup_query).first()

                # 🟢 5. PERSIAPAN DATA DEFAULT UPDATE / CREATE
                defaults_data = {
                    "nama_lengkap": nama,
                    "nik_karyawan": nik,
                    "nik_ktp": nik_ktp,
                    "passport_number": clean_val(payload.get("passport_number")),
                    "nationality": payload.get("nationality", "WNI"),
                    "pendidikan": payload.get("pendidikan", "LAINNYA"),
                    "phone_number": clean_val(payload.get("phone_number")),
                    "email": clean_val(payload.get("email")),
                    "jenis_kelamin": payload.get("jenis_kelamin", "L"),
                    "tempat_lahir": clean_val(payload.get("tempat_lahir")),
                    "tanggal_lahir": clean_val(payload.get("tanggal_lahir")),
                    "agama": payload.get("agama", "ISLAM"),
                    "blood_type": clean_val(payload.get("blood_type")),

                    # Data Alamat
                    "address": clean_val(payload.get("address")),
                    "kelurahan": clean_val(payload.get("kelurahan")),
                    "kecamatan": clean_val(payload.get("kecamatan")),
                    "city": clean_val(payload.get("city")),
                    "province": clean_val(payload.get("province")),
                    "pos_code": clean_val(payload.get("pos_code")),

                    # Ukuran Seragam & Perlengkapan
                    "shirt_size": payload.get("shirt_size", "S"),
                    "pants_size": int(payload.get("pants_size") or 30),
                    "shoes_size": int(payload.get("shoes_size") or 35),

                    # Data Keluarga & Status
                    "Employee_status": payload.get("Employee_status", "TK/0"),
                    "couple_name": clean_val(payload.get("couple_name")),
                    "couple_date_birth": clean_val(payload.get("couple_date_birth")),
                    "first_child_name": clean_val(payload.get("first_child_name")),
                    "first_child_date_birth": clean_val(payload.get("first_child_date_birth")),
                    "second_child_name": clean_val(payload.get("second_child_name")),
                    "second_child_date_birth": clean_val(payload.get("second_child_date_birth")),
                    "third_child_name": clean_val(payload.get("third_child_name")),
                    "third_child_date_birth": clean_val(payload.get("third_child_date_birth")),

                    # Kontak Darurat
                    "emergency_contact_name": clean_val(payload.get("emergency_contact_name")),
                    "emergency_contact_phone": clean_val(payload.get("emergency_contact_phone")),
                    "emergency_contact_relation": payload.get("emergency_contact_relation", "ayah"),

                    # ID Onboarding dan Flag Status
                    "is_onboarding": True,
                    "form_status": "progress",
                    "status": "progress"
                }

                if onboarding_id:
                    defaults_data["onboarding_id"] = onboarding_id

                # 🟢 6. EKSEKUSI UPDATE ATAU CREATE
                if employee:
                    # Update data yang sudah ditemukan
                    for key, value in defaults_data.items():
                        setattr(employee, key, value)
                    employee.save()
                    created = False
                else:
                    # Buat data baru jika tidak ditemukan
                    employee = Employee.objects.create(**defaults_data)
                    created = True

                action_str = "dibuat" if created else "diperbarui (Update)"
                identifier_display = onboarding_id or nik_ktp or nik or nama
                
                return Response({
                    "status": "success",
                    "message": f"Data karyawan ({identifier_display}) berhasil {action_str} via Webhook."
                }, status=status.HTTP_200_OK)

            return Response({"message": "Event tidak dikenali, diabaikan."}, status=status.HTTP_200_OK)

        except Exception as e:
            print('[WEBHOOK PROCESS ERROR]', e)
            return Response({
                "status": "error",
                "detail": f"Gagal memproses data: {str(e)}"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)