# hris_app/scheduler.py
import logging
from datetime import datetime, timedelta
from django.utils import timezone
from apscheduler.schedulers.background import BackgroundScheduler
from django_apscheduler.jobstores import DjangoJobStore
from hris_app.models import CronJob
from hris_app.tasks import TASK_REGISTRY  # Sesuaikan dengan path registry Anda

logger = logging.getLogger(__name__)

def run_all_active_cronjobs():
    """
    Fungsi ini dipanggil oleh APScheduler secara periodik (tiap 1 menit).
    Mengeksekusi cronjob berdasarkan perhitungan waktu (last_run + interval).
    """
    active_jobs = CronJob.objects.filter(is_active=True)
    now = timezone.now()

    for cron in active_jobs:
        task_func = TASK_REGISTRY.get(cron.code_name)

        if not task_func:
            cron.last_status = CronJob.StatusChoices.FAILED
            cron.last_message = f"Task '{cron.code_name}' tidak terdaftar di TASK_REGISTRY."
            cron.last_run = now
            cron.save()
            continue

        # ====================================================
        # LOGIKA PENENTUAN APAKAH TASK HARUS JALAN SEKARANG
        # ====================================================
        should_run = False

        if not cron.last_run:
            # Skenario 1: Belum pernah dijalankan / baru direset
            if cron.start_time:
                # Ambil tanggal lokal hari ini lalu gabungkan dengan start_time
                local_today = timezone.localtime(now).date()
                start_dt = timezone.make_aware(datetime.combine(local_today, cron.start_time))
                
                # Jika waktu sekarang sudah melewati atau sama dengan jam mulai
                if now >= start_dt:
                    should_run = True
            else:
                # Jika tidak diset jam mulai, langsung jalankan
                should_run = True
        else:
            # Skenario 2: Sudah pernah jalan, kalkulasi next execution berdasarkan interval
            if cron.interval_type == CronJob.IntervalTypeChoices.MINUTES:
                delta = timedelta(minutes=cron.interval_value)
            elif cron.interval_type == CronJob.IntervalTypeChoices.HOURS:
                delta = timedelta(hours=cron.interval_value)
            elif cron.interval_type == CronJob.IntervalTypeChoices.DAYS:
                delta = timedelta(days=cron.interval_value)
            else:
                delta = timedelta(minutes=cron.interval_value)

            next_run_time = cron.last_run + delta

            # Jika waktu sekarang sudah melewati next_run_time yang tertinggal
            if now >= next_run_time:
                should_run = True

        # ====================================================
        # EKSEKUSI TASK JIKA MEMENUHI SYARAT
        # ====================================================
        if should_run:
            try:
                cron.last_status = CronJob.StatusChoices.RUNNING
                cron.save()

                # Eksekusi Fungsi Python Langsung
                output_message = task_func()

                cron.last_run = timezone.now()  # Update last_run menjadi sekarang
                cron.last_status = CronJob.StatusChoices.SUCCESS
                cron.last_message = str(output_message or "Task selesai dengan sukses.")

            except Exception as e:
                cron.last_run = timezone.now()
                cron.last_status = CronJob.StatusChoices.FAILED
                cron.last_message = f"Gagal eksekusi: {str(e)}"

            cron.save()


def start_scheduler():
    """Menjalankan engine APScheduler di background."""
    scheduler = BackgroundScheduler()
    scheduler.add_jobstore(DjangoJobStore(), "default")

    # UBAH MENJADI 1 MENIT AGAR INTERVAL (misal 8 menit) BISA PRESISI DILACAK
    scheduler.add_job(
        run_all_active_cronjobs,
        trigger="interval",
        minutes=1,
        id="master_cronjob_runner",
        replace_existing=True
    )

    scheduler.start()
    logger.info("APScheduler Master Runner berhasil dijalankan!")