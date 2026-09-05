import sys
from django.core.management.base import BaseCommand
from django.utils import timezone
from hris_app.models import Employee, AttendanceLog
from zk import ZK, const

class Command(BaseCommand):
    help = 'Mengambil log absensi dari mesin ZKTeco dan menyimpan ke database HRIS'

    def handle(self, *args, **options):
        ZK_IP = '10.106.23.116'
        ZK_PORT = 1913  # Sesuaikan port mesin Anda
       
        self.stdout.write(f"Menghubungkan ke mesin ZKTeco di {ZK_IP}:{ZK_PORT}...")
        
        zk = ZK(ZK_IP, port=ZK_PORT)
        conn = None

        try:
            conn = zk.connect()
            attendance_data, size = conn.read_with_buffer(const.CMD_ATTLOG_RRQ)
            print("total size:", size, "records reported:", conn.records)
            # 1. PERBAIKAN STRUCT FIRMWARE
            try:
                conn.get_compat_old_firmware()
            except Exception as e:
                self.stdout.write(self.style.WARNING(f"Info Compat: {e}"))

            # 2. DISABLE DEVICE AGAR MEMORI LOG STABIL SAAT DITARIK
            conn.disable_device()
            self.stdout.write("Membaca log absensi dari mesin...")

            attendances = conn.get_attendance()
            total_synced = 0
            total_skipped = 0

            print('attendances' ,attendances)
            for att in attendances:
                biometric_id = str(att.user_id).strip()
                naive_dt = att.timestamp
                # Konversi dari naive datetime ZK ke aware datetime Django
                aware_dt = timezone.make_aware(naive_dt, timezone.get_current_timezone())
                print('atttt', aware_dt, biometric_id)
                # Validasi jika ID kosong/0
                if not biometric_id or biometric_id == '0':
                    continue

                employee = Employee.objects.filter(biometric_user_id=biometric_id).first()
                print('att111', biometric_id, employee)
                if not employee:
                    self.stdout.write(self.style.WARNING(f"Karyawan dengan ID Biometrik '{biometric_id}' tidak ditemukan. Dilewati."))
                    total_skipped += 1
                    continue

                check_type = 'I' if att.punch == 0 else 'O'
                
                # Normalisasi Timezone
                log_time = att.timestamp
                if timezone.is_naive(log_time):
                    log_time = timezone.make_aware(log_time, timezone.get_current_timezone())

                log, created = AttendanceLog.objects.get_or_create(
                    employee=employee,
                    timestamp=log_time,
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
            sys.exit(1)
            
        finally:
            if conn:
                # 3. PASTIKAN SELALU RE-ENABLE DEVICE
                try:
                    conn.enable_device()
                except:
                    pass
                conn.disconnect()
                self.stdout.write("Koneksi ke mesin ZKTeco ditutup.")