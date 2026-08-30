# from django.db import connection
# from django.urls import resolve
# from rest_framework.permissions import BasePermission
# from hris_app.models import UserAccessAssignment


# class HasApiWhitelistPermission(BasePermission):
#   """Satpam otomatis: Mengecek izin akses berdasarkan Template yang

#   dihubungkan langsung ke User yang sedang melakukan request.
#   """

#   def has_permission(self, request, view):

# # 1. Autentikasi dasar
#     if not request.user or not request.user.is_authenticated:
#       return False

#     # 2. Ambil URL Name
#     url_name = getattr(request.resolver_match, 'url_name', None)
#     if not url_name:
#       return False

#     # 3. Pengecekan Database (0 For-Loop, O(1) Memory Overhead)
#     if connection.vendor in ['postgresql', 'mysql']:
#       # MySQL (5.7.8+) & PostgreSQL: Menggunakan Native JSON Lookup
#       return UserAccessAssignment.objects.filter(
#           user=request.user,
#           template__allowed_codenames__contains=[url_name],
#       ).exists()
#     else:
#       # SQLite (Dev): Menggunakan Substring Text Match
#       return UserAccessAssignment.objects.filter(
#           user=request.user,
#           template__allowed_codenames__icontains=f'"{url_name}"',
#       ).exists()

#     return is_allowed


from rest_framework.permissions import BasePermission

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
      