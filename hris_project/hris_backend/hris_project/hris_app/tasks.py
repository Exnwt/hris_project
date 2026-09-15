from hris_app.views.services.ZKTeco_service import sync_attendance_to_zk

def cron_sync_attendance():
    """Wrapper function untuk eksekusi otomatis CronJob (Menarik data hari ini)."""
    success, result = sync_attendance_to_zk()
    if success:
        return result.get("detail")
    return f"Gagal: {result.get('detail')}"

# Registrasi Task
TASK_REGISTRY = {
    'sync_zkteco_attendance': cron_sync_attendance,
}