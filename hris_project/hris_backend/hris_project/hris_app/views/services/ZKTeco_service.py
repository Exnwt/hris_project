import requests
from rest_framework import status

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


def sync_department_to_zk(dept_name, department_obj=None, dept_code=None, zk_id=None):
    """
    Helper function untuk menyinkronkan objek Department ke ZKTeco BioTime.
    Returns: (success: bool, data_or_error_message: dict)
    """
    zk_auth = BiotimeLogin()
    zk_token = zk_auth.get_token()

    if not zk_token:
        return False, {"detail": "Gagal Melakukan Autentikasi ke Server ZKTeco BioTime."}

    headers = {
        "Authorization": f"Token {zk_token}",
        "Content-Type": "application/json",
    }

    sync_url = f"{BiotimeLogin.ZK_BASE_URL}/personnel/api/departments/"
    zk_payload = {
        'dept_code': dept_code,
        'dept_name': dept_name
    }

    try:
        print('start1111')
        # 1. Jika zk_id sudah ada di DB local -> Update ke ZK
        if zk_id:
            update_url = f"{sync_url}{zk_id}/"
            response = requests.put(update_url, json=zk_payload, headers=headers, timeout=10)
            
            if response.status_code in [200, 201]:
                print(1111)
                res_json = response.json()
                print(2222, res_json)
                if department_obj and res_json.get('dept_code'):
                    department_obj.code = res_json.get('dept_code')
                return True, res_json
            

        # 2. Cek apakah departemen sudah ada di BioTime berdasarkan dept_name
        search_url = f"{sync_url}?dept_name={dept_name}"
        search_response = requests.get(search_url, headers=headers, timeout=10)

        found_zk_dept = None
        if search_response.status_code == 200:
            res_data = search_response.json()
            results = res_data.get('data', []) if isinstance(res_data, dict) else res_data
            if results and len(results) > 0:
                found_zk_dept = results[0]

        # 3. Jika ditemukan di BioTime -> Update data di ZK & kembalikan dictionary
        if found_zk_dept:
            matched_zk_id = found_zk_dept.get('id')
            update_url = f"{sync_url}{matched_zk_id}/"
            response = requests.put(update_url, json=zk_payload, headers=headers, timeout=10)
            
            if response.status_code in [200, 201]:
                res_json = response.json()
                return True, {
                    'name': found_zk_dept.get('dept_name'),
                    'zk_id': matched_zk_id,
                    'code': found_zk_dept.get('dept_code'),
                    'zk_data': res_json,
                    'detail': f"Berhasil Sinkronsasi Department {res_data.get(dept_name)} ke ZKTeco BioTime."
                }
            
            return False, response.json()

        # 4. Jika belum ada -> Buat departemen baru di BioTime (POST)
        response = requests.post(sync_url, json=zk_payload, headers=headers, timeout=10)
        if response.status_code in [200, 201]:
            res_data = response.json()
            
            # ✅ Safe assignment tanpa potensi UnboundLocalError
            return True, {
                'name': res_data.get('dept_name'),
                'zk_id': res_data.get('id'),
                'code': res_data.get('dept_code'),
                'zk_data': res_data,
                'detail': f"Berhasil Sinkronsasi Department {res_data.get(dept_name)} ke ZKTeco BioTime."
            }
        
        return False, response.json()

    except requests.exceptions.RequestException as e:
        return False, {"detail": f"Gagal terhubung ke Server ZKTeco: {str(e)}"}