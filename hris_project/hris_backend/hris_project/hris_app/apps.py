import os
from django.apps import AppConfig

class HrisAppConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'hris_app'

    def ready(self):
        # Jalankan scheduler HANYA di main process (mencegah double execution dari StatReloader)
        if os.environ.get('RUN_MAIN') == 'true' or os.environ.get('SERVER_SOFTWARE', '').startswith('gunicorn'):
            from .scheduler import start_scheduler
            start_scheduler()