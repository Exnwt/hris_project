import os
from zk import ZK
from apscheduler.schedulers.background import BackgroundScheduler
from django_apscheduler.jobstores import DjangoJobStore
from hris_app.models import Employee, AttendanceLog

# ==========================================
# LOGIKA SINKRONISASI KE MESIN ZKTECO
# ==========================================
def sync_zkteco_task():
    """Task otomatis untuk menarik data pindaian mesin ZK ke DB Django"""
    ZK_IP = '192.168.1.201'  # Ubah sesuai IP Mesin ZK di LAN kamu
    ZK_PORT = 4370

    zk = ZK(ZK_IP, port=ZK_PORT, timeout=5)
    try:
        print("🔄 [CRONJOB] Menghubungkan ke mesin ZKTeco...")
        conn = zk.connect()
        attendances = conn.get_attendance()

        total_synced = 0
        for att in attendances:
            bio_id = str(att.user_id)
            try:
                # Cari karyawan berdasarkan ID Biometrik
                employee = Employee.objects.get(biometric_user_id=bio_id)
                
                # Simpan log jika belum ada di database
                _, created = AttendanceLog.objects.get_or_create(
                    employee=employee,
                    timestamp=att.timestamp,
                    defaults={
                        'check_type': 'I' if att.punch == 0 else 'O',
                        'sn_device': 'ZK-MAIN-01',
                        'raw_uid': str(att.uid)
                    }
                )
                if created:
                    total_synced += 1

            except Employee.DoesNotExist:
                # Jika ID Biometrik belum dipetakan ke Employee mana pun
                continue

        print(f"✅ [CRONJOB] Sync ZKTeco Selesai. ({total_synced} log baru ditambahkan)")

    except Exception as e:
        print(f"❌ [CRONJOB] Gagal sync ZKTeco: {e}")
    finally:
        if 'conn' in locals():
            conn.disconnect()


# ==========================================
# FUNGSI MEMULAI CRONJOB SCHEDULER
# ==========================================
def start_cronjob():
    scheduler = BackgroundScheduler()
    scheduler.add_jobstore(DjangoJobStore(), "default")

    # Jalankan task sync_zkteco_task setiap 5 menit
    scheduler.add_job(
        sync_zkteco_task,
        'interval',
        minutes=5,
        name='sync_zkteco_job',
        jobstore='default',
        id='sync_zkteco_job',
        replace_existing=True,
    )

    scheduler.start()
    print("🚀 [CRONJOB] Service Sync ZKTeco Otomatis Berjalan (Interval: 5 Menit)")