import time
import logging
import datetime
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger  # <--- UBAH IMPORT INI
from django.core.management.base import BaseCommand
from django.utils import timezone
from django_apscheduler.jobstores import DjangoJobStore

from hris_app.models import CronJob
from hris_app.tasks import TASK_REGISTRY

logger = logging.getLogger(__name__)

def execute_task(cron_id):
    # (Kode execute_task SAMA SEPERTI SEBELUMNYA)
    try:
        cron = CronJob.objects.get(id=cron_id)
    except CronJob.DoesNotExist:
        return

    if not cron.is_active:
        return

    task_func = TASK_REGISTRY.get(cron.code_name)
    if not task_func:
        cron.last_run = timezone.now()
        cron.last_status = CronJob.StatusChoices.FAILED
        cron.last_message = f"Task '{cron.code_name}' belum terdaftar di TASK_REGISTRY."
        cron.save()
        return

    cron.last_status = CronJob.StatusChoices.RUNNING
    cron.save()

    try:
        output_result = task_func()
        cron.last_run = timezone.now()
        cron.last_status = CronJob.StatusChoices.SUCCESS
        cron.last_message = str(output_result or "Task selesai otomatis.")
    except Exception as e:
        cron.last_run = timezone.now()
        cron.last_status = CronJob.StatusChoices.FAILED
        cron.last_message = f"Error System: {str(e)}"
    
    cron.save()


class Command(BaseCommand):
    help = "Menjalankan APScheduler untuk mengeksekusi CronJob otomatis."

    def handle(self, *args, **options):
        scheduler = BackgroundScheduler()
        scheduler.add_jobstore(DjangoJobStore(), "default")

        active_crons = CronJob.objects.filter(is_active=True)
        for cron in active_crons:
            try:
                # 1. Tentukan Parameter Interval (minutes/hours/days)
                trigger_kwargs = {cron.interval_type: cron.interval_value}
                
                # 2. Set Jam Mulai (Jika diisi)
                if cron.start_time:
                    today = timezone.now().date()
                    # Gabungkan tanggal hari ini dengan jam yang diset user
                    start_dt = timezone.make_aware(datetime.datetime.combine(today, cron.start_time))
                    trigger_kwargs['start_date'] = start_dt

                # 3. Buat Interval Trigger
                trigger = IntervalTrigger(**trigger_kwargs)
                
                scheduler.add_job(
                    execute_task,
                    trigger=trigger,
                    args=[cron.id],
                    id=f"cronjob_{cron.id}",
                    replace_existing=True
                )
                self.stdout.write(self.style.SUCCESS(f"Registered job: {cron.name} (Setiap {cron.interval_value} {cron.interval_type})"))
            except Exception as e:
                self.stdout.write(self.style.ERROR(f"Gagal register {cron.name}: {e}"))

        scheduler.start()
        self.stdout.write(self.style.SUCCESS("Scheduler berjalan... Tekan Ctrl+C untuk berhenti."))

        try:
            while True:
                time.sleep(1)
        except (KeyboardInterrupt, SystemExit):
            scheduler.shutdown()