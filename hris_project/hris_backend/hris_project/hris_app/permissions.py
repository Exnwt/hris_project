# hris_app/permissions.py
from rest_framework.permissions import BasePermission
from hris_app.models import GroupAccessAssignment

class HasAPIAccessPermission(BasePermission):
    """
    Custom Permission untuk mengecek akses API.
    Jika view memiliki `action_codenames` (dict), permission akan mengecek 
    codename berdasarkan `action` yang ada di request.data.
    """

    def has_permission(self, request, view):
        # 1. User Anonymous / Belum Login -> Tolak
        if not request.user or not request.user.is_authenticated:
            return False

        # 2. Superuser -> Izinkan Otomatis
        if request.user.is_superuser:
            return True

        # 3. Ambil codename API dari view
        required_codename = getattr(view, "api_codename", None)

        # FITUR TAMBAHAN: Cek jika view memiliki pemetaan action khusus (dict)
        action_codenames = getattr(view, "action_codenames", None)
        if action_codenames and isinstance(action_codenames, dict):
            # Ambil action dari request body (POST/PUT data)
            current_action = request.data.get("action")
            if current_action in action_codenames:
                required_codename = action_codenames[current_action]

        # Jika tidak ada codename yang ditentukan, izinkan (atau return False jika strict)
        if not required_codename:
            return True

        # 4. CEK Akses via Group / Role User
        user_groups = request.user.groups.all()
        has_group_access = GroupAccessAssignment.objects.filter(
            group__in=user_groups, 
            api_endpoint__code_name=required_codename
        ).exists()

        if has_group_access:
            return True

        # 5. Tidak cocok -> Tolak Akses (403 Forbidden)
        return False

    
class HasApiWhitelistPermission(BasePermission):
    """
    Mengecek akses API berdasarkan Django Group + Permission.

    User
      ↓
    Group
      ↓
    Django Permission
      ↓
    API boleh / ditolak
    """
    def has_permission(self, request, view):

        # 1. Pastikan user sudah login
        if not request.user or not request.user.is_authenticated:
            return False

        # 2. Ambil nama URL
        url_name = getattr(request.resolver_match, 'url_name', None)

        if not url_name:
            return False

        # 3. Administrator boleh mengakses semua API
        if request.user.groups.filter(name='ADMINISTRATOR').exists():
            return True
        if request.user.is_superuser:
            return True

        # 4. Cek permission berdasarkan action ViewSet
        action = getattr(view, 'action', None)

        if not action:
            return False

        # Mapping action DRF → Django permission
        permission_map = {
            'list': 'view',
            'retrieve': 'view',
            'create': 'add',
            'update': 'change',
            'partial_update': 'change',
            'destroy': 'delete',
        }

        permission_action = permission_map.get(action)

        if not permission_action:
            return False

        # 5. Ambil model dari ViewSet
        queryset = getattr(view, 'queryset', None)

        if queryset is None:
            return False

        model = queryset.model

        # 6. Buat codename permission
        permission_codename = (
            f"{model._meta.app_label}."
            f"{permission_action}_{model._meta.model_name}"
        )

        # 7. Cek apakah user punya permission tersebut
        return request.user.has_perm(permission_codename)
      