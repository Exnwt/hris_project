from django.apps import AppConfig
import os


class HrisAppConfig(AppConfig):
    name = 'hris_app'
    def ready(self):
        # Memastikan hanya berjalan di proses utama server Django
        if os.environ.get('RUN_MAIN') == 'true':
            from hris_app.cronjob.sync_zktco import start_cronjob
            start_cronjob()


