import sys
from django.core.management.base import BaseCommand
from django.utils import timezone
from hris_app.models import Employee, AttendanceLog  # Sesuaikan model Anda

# Pustaka PyZK untuk komunikasi dengan mesin ZKTeco
from zk import ZK, const

class Command(BaseCommand):
    help = 'Mengambil log absensi dari mesin ZKTeco dan menyimpan ke database HRIS'

    def handle(self, *args, **options):
        # Konfigurasi IP & Port Mesin ZKTeco
        ZK_IP = '192.168.1.201'  # Ganti dengan IP mesin ZK Anda
        ZK_PORT = 4370

        self.stdout.write(f"Menghubungkan ke mesin ZKTeco di {ZK_IP}:{ZK_PORT}...")
        
        zk = ZK(ZK_IP, port=ZK_PORT, timeout=10)
        conn = None

        try:
            conn = zk.connect()
            self.stdout.write("Terhubung! Mengambil data absensi...")
            
            attendances = conn.get_attendance()
            total_synced = 0
            total_skipped = 0

            for att in attendances:
                biometric_id = str(att.user_id)
                
                # 1. Cari Karyawan berdasarkan biometric_user_id
                employee = Employee.objects.filter(biometric_user_id=biometric_id).first()
                
                if not employee:
                    self.stdout.write(self.style.WARNING(f"Karyawan dengan ID Biometrik '{biometric_id}' tidak ditemukan. Dilewati."))
                    total_skipped += 1
                    continue

                # 2. Tentukan Tipe Absen (Punch Type 0 = In, 1 = Out, dsb)
                check_type = 'I' if att.punch == 0 else 'O'

                # 3. Simpan ke AttendanceLog (Mencegah duplikasi data jika timestamp & employee sama)
                log, created = AttendanceLog.objects.get_or_create(
                    employee=employee,
                    timestamp=att.timestamp,
                    defaults={
                        'check_type': check_type,
                        'sn_device': 'ZK-MAIN-01',
                        'raw_uid': str(att.uid)
                    }
                )

                if created:
                    total_synced += 1

            self.stdout.write(self.style.SUCCESS(
                f"Sinkronisasi Selesai! Berhasil menambahkan {total_synced} log baru. (Dilewati: {total_skipped})"
            ))

        except Exception as e:
            self.stderr.write(f"Gagal melakukan sinkronisasi ZKTeco: {str(e)}")
            sys.exit(1) # Keluar dengan error code 1 agar subprocess Django mencatat sebagai FAILED
            
        finally:
            if conn:
                conn.disconnect()
                self.stdout.write("Koneksi ke mesin ZKTeco ditutup.")