from hris_app.permissions import HasApiWhitelistPermission
from rest_framework.authentication import SessionAuthentication
from rest_framework_simplejwt.authentication import JWTAuthentication #JWT Token
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from hris_app.models import Company, Department, Position, Section


class QuickCreateMasterAPIView(APIView):
  """API Universal untuk Quick Create Master Data via Pop-up Modal."""
  
  authentication_classes = [JWTAuthentication]
  permission_classes = [ HasApiWhitelistPermission]


  def post(self, request, master_type):
    # 🔍 PRINT DEBUG DI TERMINAL DJANGO
    print("\n================ DEBUG PAYLOAD ================")
    print("Master Type :", master_type)
    print("User        :", request.user)
    print("Request Data:", request.data)  # 👈 Ini isi JSON payload dari front-end
    print("===============================================\n")
    name = request.data.get('name', '').strip()
    if not name:
      return Response(
          {'error': 'Nama master wajib diisi.'},
          status=status.HTTP_400_BAD_REQUEST,
      )

    formatted_name = name.title()

    if master_type == 'section':
      dept_id = request.data.get('department_id')
      if not dept_id:
        return Response(
            {
                'error': (
                    'Harap pilih Departemen terlebih dahulu sebelum membuat'
                    ' Seksi baru!'
                )
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

      try:
        department = Department.objects.get(id=dept_id)
      except Department.DoesNotExist:
        return Response(
            {'error': 'Departemen tidak ditemukan.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

      # Relasi 1-to-Many: 1 Departemen bisa punya banyak Seksi
      obj, created = Section.objects.get_or_create(
          name=formatted_name, department=department
      )

    elif master_type == 'department':
      obj, created = Department.objects.get_or_create(name=formatted_name)
    elif master_type == 'company':
      obj, created = Company.objects.get_or_create(name=formatted_name)
    elif master_type == 'position':
      obj, created = Position.objects.get_or_create(name=formatted_name)
    else:
      return Response(
          {'error': 'Tipe master tidak valid.'},
          status=status.HTTP_400_BAD_REQUEST,
      )

    return Response(
        {'id': obj.id, 'name': obj.name, 'created': created},
        status=status.HTTP_201_CREATED,
    )