from django.db import connection
from django.urls import resolve
from rest_framework.permissions import BasePermission
from hris_app.models import UserAccessAssignment


class HasApiWhitelistPermission(BasePermission):
  """Satpam otomatis: Mengecek izin akses berdasarkan Template yang

  dihubungkan langsung ke User yang sedang melakukan request.
  """

  def has_permission(self, request, view):

# 1. Autentikasi dasar
    if not request.user or not request.user.is_authenticated:
      return False

    # 2. Ambil URL Name
    url_name = getattr(request.resolver_match, 'url_name', None)
    if not url_name:
      return False

    # 3. Pengecekan Database (0 For-Loop, O(1) Memory Overhead)
    if connection.vendor in ['postgresql', 'mysql']:
      # MySQL (5.7.8+) & PostgreSQL: Menggunakan Native JSON Lookup
      return UserAccessAssignment.objects.filter(
          user=request.user,
          template__allowed_codenames__contains=[url_name],
      ).exists()
    else:
      # SQLite (Dev): Menggunakan Substring Text Match
      return UserAccessAssignment.objects.filter(
          user=request.user,
          template__allowed_codenames__icontains=f'"{url_name}"',
      ).exists()

    return is_allowed