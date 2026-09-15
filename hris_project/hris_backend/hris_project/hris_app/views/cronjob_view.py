from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from hris_app.models import CronJob
from hris_app.serializers.cronjob_serializer import CronJobSerializer
from hris_app.tasks import TASK_REGISTRY 


class CronJobViewSet(viewsets.ModelViewSet):
    api_codename = "CronJobAccess"
    queryset = CronJob.objects.all().order_by('-id')
    serializer_class = CronJobSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=True, methods=['post'], url_path='run-now')
    def run_now(self, request, pk=None):
        """
        Menjalankan task cronjob secara MANUAL dari tombol React / Frontend.
        Mengeksekusi fungsi Python dari TASK_REGISTRY tanpa bergantung pada subprocess system.
        """
        cron = self.get_object()

        # 1. Cek apakah kode task terdaftar di TASK_REGISTRY
        task_func = TASK_REGISTRY.get(cron.code_name)
        if not task_func:
            cron.last_run = timezone.now()
            cron.last_status = CronJob.StatusChoices.FAILED
            cron.last_message = f"Task dengan code_name '{cron.code_name}' belum terdaftar di TASK_REGISTRY."
            cron.save()

            return Response({
                "message": f"Gagal mengeksekusi Cronjob '{cron.name}'.",
                "status": cron.last_status,
                "output": cron.last_message
            }, status=status.HTTP_400_BAD_REQUEST)

        # 2. Update status sementara menjadi RUNNING
        cron.last_status = CronJob.StatusChoices.RUNNING
        cron.save()

        # 3. Eksekusi fungsi Python murni (contoh: sync_attendance_to_zk)
        try:
            output_result = task_func()

            cron.last_run = timezone.now()
            cron.last_status = CronJob.StatusChoices.SUCCESS
            cron.last_message = str(output_result or "Task selesai dengan sukses.")

        except Exception as e:
            cron.last_run = timezone.now()
            cron.last_status = CronJob.StatusChoices.FAILED
            cron.last_message = f"Error System: {str(e)}"

        # 4. Simpan status dan waktu running terakhir ke database
        cron.save()

        # 5. Kembalikan response JSON yang dibaca oleh React Alert/Modal
        return Response({
            "message": f"Cronjob '{cron.name}' berhasil dieksekusi.",
            "status": cron.last_status,
            "output": cron.last_message
        }, status=status.HTTP_200_OK)