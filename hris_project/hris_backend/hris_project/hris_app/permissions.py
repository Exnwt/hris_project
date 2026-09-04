# hris_app/permissions.py
from rest_framework.permissions import BasePermission


class HasAPIAccessPermission(BasePermission):
    """Custom Permission untuk mengecek apakah User / Group milik User

    memiliki akses ke API berdasarkan `api_codename` yang dipasang pada View.
    """

    def has_permission(self, request, view):
        # 1. User yang belum terotentikasi (Anonymous) ditolak
        if not request.user or not request.user.is_authenticated:
            return False

        # 2. Bypass otomatis untuk Superuser / Admin Tertinggi
        if request.user.is_superuser:
            return True

        # 3. Ambil codename API dari atribut `api_codename` pada view
        required_codename = getattr(view, "api_codename", None)
        print('test111', required_codename)
        # Jika view tidak memasang `api_codename`, izinkan akses (atau ubah ke False jika ingin strict)
        # if not required_codename:
        #     return True

        # 4. CEK 1: Akses via Group / Role User
        user_groups = request.user.groups.all()
        print('test222',user_groups)
        has_group_access = GroupAccessAssignment.objects.filter(
            group__in=user_groups, api_endpoint__code_name=required_codename
        ).exists()
        print('test333',has_group_access)
        if has_group_access:
            return True

        # 6. Jika tidak ada yang cocok di Group maupun User assignment -> Tolak Akses
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
      