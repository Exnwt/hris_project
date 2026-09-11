import requests
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from hris_app.models import Employee, Department, Position
from hris_app.models.division import Area

class BiotimeLogin:
    ZK_BASE_URL = "http://10.106.13.48:8081"
    ZK_USERNAME = "api-zkteco"
    ZK_PASSWORD = "api-zkteco"

    def get_token(self):
        login_url = f"{self.ZK_BASE_URL}/api-token-auth/"
        payload = {
            "username": self.ZK_USERNAME,
            "password": self.ZK_PASSWORD
        }

        try:
            login_response = requests.post(login_url, json=payload, timeout=10)
            if login_response.status_code == 200:
                return login_response.json().get("token")
            else:
                print("Gagal Autentikasi ZK:", login_response.text)
                return None
        except requests.exceptions.RequestException as e:
            print(f"Gagal Login ke Server ZKBiotime: {e}")
            return None


class SyncEmployeeToZkBiotimeView(APIView):
  # Ganti dengan password ZK BioTime
    zk_auth = BiotimeLogin()

    def post(self, request):
        employee_id = request.data.get("employee_id")

        if not employee_id:
            return Response({"detail": "employee_id wajib diisi."}, status=status.HTTP_400_BAD_REQUEST)

        # 1. Cari Karyawan di DB Django
        try:
            employee = Employee.objects.get(id=employee_id)
        except Employee.DoesNotExist:
            return Response({"detail": "Karyawan tidak ditemukan."}, status=status.HTTP_404_NOT_FOUND)

        # 2. Dapatkan Token ZK BioTime Secara Otomatis
        zk_token = self.zk_auth.get_token()
        if not zk_token:
            return Response({
                "detail": "Gagal melakukan autentikasi ke Server ZKTeco BioTime."
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # 3. Buat Payload Karyawan untuk ZK BioTime
        zk_payload = {
            "emp_code": employee.nik_karyawan,
            "first_name": employee.nama_lengkap,
            "department": employee.department.id if employee.department else 1,  # Default ID Dept 1 jika null
            "area": [1],  # ID Area Mesin di ZK
            "position" : employee.position.id if employee.position else 1,
        }

        # 4. Header dengan Token JWT ZK
        headers = {
            "Authorization": f"Token {zk_token}",
            "Content-Type": "application/json",
        }

        # 5. Kirim Request Sync Server-to-Server
        try:
            sync_url = f"{BiotimeLogin.ZK_BASE_URL}/personnel/api/employees/"
            if employee.biometric_user_id :
                update_url = f"{sync_url}{employee.biometric_user_id}/"
                zk_response = requests.put(
                    update_url,
                    json =zk_payload,
                    headers=headers,
                    timeout=10
                )
                if zk_response.status_code in [200, 201]:
                    return Response({
                        "message": f"Berhasil sinkronisasi karyawan1 {employee.nama_lengkap} ke ZKTeco BioTime!",
                        "zk_data": zk_response.json()
                    }, status=status.HTTP_200_OK)
            zk_response = requests.post(
                sync_url,
                json=zk_payload,
                headers=headers,
                timeout=10
            )
            if zk_response.status_code in [200, 201]:
                res_data = zk_response.json()
                res_id = ''
                if res_data and res_data.get('id'):
                    res_id = res_data.get('id')
                employee.biometric_user_id = res_id
                employee.save()
                return Response({
                    "message": f"Berhasil sinkronisasi karyawan {employee.nama_lengkap} ke ZKTeco BioTime!",
                    "zk_data": zk_response.json()
                }, status=status.HTTP_200_OK)
            else:
                return Response({
                    "detail": "ZKTeco Menolak Request",
                    "error": zk_response.json()
                }, status=zk_response.status_code)

        except requests.exceptions.RequestException as e:
            return Response({
                "detail": f"Gagal terhubung ke Server ZKTeco: {str(e)}"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class SyncDepartmentToZKBiotimeView(APIView):
    zk_auth = BiotimeLogin()

    def post(self, request):
        department_id = request.data.get("department_id")

        if not department_id:
            return Response(
                {"detail": "Informasi Department Dari HRIS Tidak Ditemukan."}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # Perbaikan nama variabel instance
            department_obj = Department.objects.get(id=department_id)
        except Department.DoesNotExist:
            return Response(
                {"detail": "Detail Informasi Department Dari HRIS Tidak Ditemukan."}, 
                status=status.HTTP_404_NOT_FOUND
            )

        # 1. Autentikasi Token
        zk_token = self.zk_auth.get_token()
        if not zk_token:
            return Response(
                {"detail": "Gagal Melakukan Autentikasi ke Server ZKTeco BioTime."}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        headers = {
            "Authorization": f"Token {zk_token}",  
            "Content-Type": "application/json",
        }

        zk_id = department_obj.zk_id if department_obj.zk_id else None
        zk_payload = {
            'dept_code': department_obj.code,
            'dept_name': department_obj.name
        }

        sync_url = f"{BiotimeLogin.ZK_BASE_URL}/personnel/api/departments/"

        try:
            if zk_id:
                update_url = f"{sync_url}{zk_id}/"
                zk_response = requests.put(
                    update_url,
                    json=zk_payload,
                    headers=headers,
                    timeout=10
                )

                if zk_response.status_code in [200, 201]:
                    return Response({
                        "message": f"Berhasil memperbarui Department {department_obj.name} di ZKTeco BioTime!",
                        "zk_data": zk_response.json()
                    }, status=status.HTTP_200_OK)
                else:
                    return Response({
                        "message": f"Gagal Mengupdate Department {department_obj.name} ke ZKTeco BioTime!",
                        "zk_data": zk_response.json()
                    }, status=zk_response.status_code)

            else:
                zk_response = requests.post(
                    sync_url,
                    json=zk_payload,
                    headers=headers,
                    timeout=10
                )

                if zk_response.status_code in [200, 201]:
                    res_data = zk_response.json()
                    
                    # Simpan ID dari BioTime ke database local HRIS
                    if res_data and res_data.get('id'):
                        department_obj.zk_id = res_data.get('id')
                        department_obj.save()

                    return Response({
                        "message": f"Berhasil menambahkan Department {department_obj.name} ke ZKTeco BioTime!",
                        "zk_data": res_data
                    }, status=status.HTTP_200_OK)
                else:
                    return Response({
                        "detail": "ZKTeco Menolak Request",
                        "error": zk_response.json()
                    }, status=zk_response.status_code)

        except requests.exceptions.RequestException as e:
            return Response(
                {"detail": f"Gagal terhubung ke Server ZKTeco: {str(e)}"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class SyncPositionToZKBiotimeView(APIView):
    zk_auth = BiotimeLogin()

    def post(self, request):
        position_id = request.data.get("position_id")

        if not position_id:
            return Response(
                {"detail": "Informasi Position Dari HRIS Tidak Ditemukan."}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # Perbaikan nama variabel instance
            position_obj = Position.objects.get(id=position_id)
        except Position.DoesNotExist:
            return Response(
                {"detail": "Detail Informasi Position Dari HRIS Tidak Ditemukan."}, 
                status=status.HTTP_404_NOT_FOUND
            )

        # 1. Autentikasi Token
        zk_token = self.zk_auth.get_token()
        if not zk_token:
            return Response(
                {"detail": "Gagal Melakukan Autentikasi ke Server ZKTeco BioTime."}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        headers = {
            "Authorization": f"Token {zk_token}",  
            "Content-Type": "application/json",
        }

        zk_id = position_obj.zk_id if position_obj.zk_id else None
        zk_payload = {
            'position_code': position_obj.code,
            'position_name': position_obj.name
        }

        sync_url = f"{BiotimeLogin.ZK_BASE_URL}/personnel/api/positions/"

        try:
            if zk_id:
                update_url = f"{sync_url}{zk_id}/"
                zk_response = requests.put(
                    update_url,
                    json=zk_payload,
                    headers=headers,
                    timeout=10
                )

                if zk_response.status_code in [200, 201]:
                    return Response({
                        "message": f"Berhasil memperbarui Position {position_obj.name} di ZKTeco BioTime!",
                        "zk_data": zk_response.json()
                    }, status=status.HTTP_200_OK)
                else:
                    return Response({
                        "message": f"Gagal Mengupdate Position {position_obj.name} ke ZKTeco BioTime!",
                        "zk_data": zk_response.json()
                    }, status=zk_response.status_code)

            else:
                zk_response = requests.post(
                    sync_url,
                    json=zk_payload,
                    headers=headers,
                    timeout=10
                )

                if zk_response.status_code in [200, 201]:
                    res_data = zk_response.json()
                    
                    # Simpan ID dari BioTime ke database local HRIS
                    if res_data and res_data.get('id'):
                        position_obj.zk_id = res_data.get('id')
                        position_obj.save()

                    return Response({
                        "message": f"Berhasil menambahkan positions {position_obj.name} ke ZKTeco BioTime!",
                        "zk_data": res_data
                    }, status=status.HTTP_200_OK)
                else:
                    return Response({
                        "detail": "ZKTeco Menolak Request",
                        "error": zk_response.json()
                    }, status=zk_response.status_code)

        except requests.exceptions.RequestException as e:
            return Response(
                {"detail": f"Gagal terhubung ke Server ZKTeco: {str(e)}"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

              
class SyncAreaToZKBiotimeView(APIView):
    zk_auth = BiotimeLogin()

    def post(self, request):
        area_id = request.data.get("area_id")

        if not area_id:
            return Response(
                {"detail": "Informasi Area Dari HRIS Tidak Ditemukan."}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # Perbaikan nama variabel instance
            area_obj = Area.objects.get(id=area_id)
        except Area.DoesNotExist:
            return Response(
                {"detail": "Detail Informasi Area Dari HRIS Tidak Ditemukan."}, 
                status=status.HTTP_404_NOT_FOUND
            )

        # 1. Autentikasi Token
        zk_token = self.zk_auth.get_token()
        if not zk_token:
            return Response(
                {"detail": "Gagal Melakukan Autentikasi ke Server ZKTeco BioTime."}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        headers = {
            "Authorization": f"Token {zk_token}",  
            "Content-Type": "application/json",
        }

        zk_id = area_obj.zk_id if area_obj.zk_id else None
        zk_payload = {
            'area_code': area_obj.code,
            'area_name': area_obj.name
        }

        sync_url = f"{BiotimeLogin.ZK_BASE_URL}/personnel/api/areas/"

        try:
            if zk_id:
                update_url = f"{sync_url}{zk_id}/"
                zk_response = requests.put(
                    update_url,
                    json=zk_payload,
                    headers=headers,
                    timeout=10
                )

                if zk_response.status_code in [200, 201]:
                    return Response({
                        "message": f"Berhasil memperbarui Area {area_obj.name} di ZKTeco BioTime!",
                        "zk_data": zk_response.json()
                    }, status=status.HTTP_200_OK)
                else:
                    return Response({
                        "message": f"Gagal Mengupdate Area {area_obj.name} ke ZKTeco BioTime!",
                        "zk_data": zk_response.json()
                    }, status=zk_response.status_code)

            else:
                zk_response = requests.post(
                    sync_url,
                    json=zk_payload,
                    headers=headers,
                    timeout=10
                )

                if zk_response.status_code in [200, 201]:
                    res_data = zk_response.json()
                    
                    # Simpan ID dari BioTime ke database local HRIS
                    if res_data and res_data.get('id'):
                        area_obj.zk_id = res_data.get('id')
                        area_obj.save()

                    return Response({
                        "message": f"Berhasil menambahkan Area {area_obj.name} ke ZKTeco BioTime!",
                        "zk_data": res_data
                    }, status=status.HTTP_200_OK)
                else:
                    return Response({
                        "detail": "ZKTeco Menolak Request",
                        "error": zk_response.json()
                    }, status=zk_response.status_code)

        except requests.exceptions.RequestException as e:
            return Response(
                {"detail": f"Gagal terhubung ke Server ZKTeco: {str(e)}"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

         

    



