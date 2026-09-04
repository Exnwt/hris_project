# views.py
import subprocess
from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from hris_app.models import CronJob
from hris_app.serializers.cronjob_serializer import CronJobSerializer

class CronJobViewSet(viewsets.ModelViewSet):
    queryset = CronJob.objects.all().order_by('-id')
    serializer_class = CronJobSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=True, methods=['post'], url_path='run-now')
    def run_now(self, request, pk=None):
        """Menjalankan task cronjob secara manual dari frontend."""
        cron = self.get_object()
        cron.last_status = CronJob.StatusChoices.RUNNING
        cron.save()

        try:
            # Contoh eksekusi custom django management command berbasis code_name
            # python manage.py <code_name>
            result = subprocess.run(
                ["python", "manage.py", cron.code_name],
                capture_output=True,
                text=True,
                timeout=60
            )

            cron.last_run = timezone.now()
            if result.returncode == 0:
                cron.last_status = CronJob.StatusChoices.SUCCESS
                cron.last_message = result.stdout or "Task selesai dengan sukses."
            else:
                cron.last_status = CronJob.StatusChoices.FAILED
                cron.last_message = result.stderr or "Task gagal dijalankan."

        except Exception as e:
            cron.last_run = timezone.now()
            cron.last_status = CronJob.StatusChoices.FAILED
            cron.last_message = str(e)

        cron.save()
        return Response({
            "message": f"Cronjob '{cron.name}' telah dieksekusi.",
            "status": cron.last_status,
            "output": cron.last_message
        }, status=status.HTTP_200_OK)