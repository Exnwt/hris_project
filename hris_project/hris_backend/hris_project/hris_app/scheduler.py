# hris_app/scheduler.py
import logging
from django.utils import timezone
from apscheduler.schedulers.background import BackgroundScheduler
from django_apscheduler.jobstores import DjangoJobStore
from hris_app.models import CronJob
from hris_app.views.zkteco_view import TASK_REGISTRY

logger = logging.getLogger(__name__)

def run_all_active_cronjobs():
    """
    Fungsi ini dipanggil oleh APScheduler secara periodik.
    Memeriksa semua task di tabel CronJob yang berstatus is_active=True.
    """
    active_jobs = CronJob.objects.filter(is_active=True)

    for cron in active_jobs:
        task_func = TASK_REGISTRY.get(cron.code_name)

        if not task_func:
            cron.last_status = CronJob.StatusChoices.FAILED
            cron.last_message = f"Task '{cron.code_name}' tidak terdaftar di TASK_REGISTRY."
            cron.last_run = timezone.now()
            cron.save()
            continue

        try:
            cron.last_status = CronJob.StatusChoices.RUNNING
            cron.save()

            # Eksekusi Fungsi Python Langsung
            output_message = task_func()

            cron.last_run = timezone.now()
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

    # Menjalankan pengecekan task setiap 5 menit (bisa disesuaikan)
    scheduler.add_job(
        run_all_active_cronjobs,
        trigger="interval",
        minutes=5,
        id="master_cronjob_runner",
        replace_existing=True
    )

    scheduler.start()
    logger.info("APScheduler Master Runner berhasil dijalankan!")