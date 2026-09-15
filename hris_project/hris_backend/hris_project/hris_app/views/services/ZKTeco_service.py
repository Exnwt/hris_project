import requests
from rest_framework import status
from datetime import datetime
from django.utils.dateparse import parse_datetime
from hris_app.models import AttendanceLog, Employee

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
            zk_payload['dept_code'] = found_zk_dept.get('dept_code')
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
        res_data = response.json()
        if response.status_code in [200, 201]:
            
            # ✅ Safe assignment tanpa potensi UnboundLocalError
            return True, {
                'name': res_data.get('dept_name'),
                'zk_id': res_data.get('id'),
                'code': res_data.get('dept_code'),
                'zk_data': res_data,
                'detail': f"Berhasil Sinkronsasi Department {res_data.get(dept_name)} ke ZKTeco BioTime."
            }
        
        error_detail = res_data.get('detail') if isinstance(res_data, dict) and res_data.get('detail') else res_data
        print('rqrqrqrq',error_detail)
        return False, {
            'detail': error_detail,
            'zk_data': res_data
        }

    except requests.exceptions.RequestException as e:
        return False, {"detail": f"Gagal terhubung ke Server ZKTeco: {str(e)}"}


def sync_position_to_zk(pos_name, position_obj=None, pos_code=None, zk_id=None):
    """
    Helper function untuk menyinkronkan objek Position (Jabatan) ke ZKTeco BioTime.
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

    sync_url = f"{BiotimeLogin.ZK_BASE_URL}/personnel/api/positions/"
    zk_payload = {
        'position_code': pos_code,
        'position_name': pos_name,
        'parent_position': None,
    }

    try:
        print(1111)
        # 1. Jika zk_id sudah ada di DB local -> Update ke ZK
        if zk_id:
            update_url = f"{sync_url}{zk_id}/"
            response = requests.put(update_url, json=zk_payload, headers=headers, timeout=10)
            
            if response.status_code in [200, 201]:
                res_json = response.json()
                if position_obj and res_json.get('position_code'):
                    position_obj.code = res_json.get('position_code')
                return True, res_json
            
            return False, response.json()
        print(2222)
        # 2. Cek apakah position sudah ada di BioTime berdasarkan position_name
        search_url = f"{sync_url}?position_name={pos_name}"
        search_response = requests.get(search_url, headers=headers, timeout=10)

        found_zk_pos = None
        if search_response.status_code == 200:
            res_data = search_response.json()
            results = res_data.get('data', []) if isinstance(res_data, dict) else res_data
            if results and len(results) > 0:
                found_zk_pos = results[0]

        # 3. Jika ditemukan di BioTime -> Update data di ZK & kembalikan dictionary
        print(3333)
        if found_zk_pos:
            matched_zk_id = found_zk_pos.get('id')
            zk_payload['position_code'] = found_zk_pos.get('position_code')
            update_url = f"{sync_url}{matched_zk_id}/"
            response = requests.put(update_url, json=zk_payload, headers=headers, timeout=10)
            print(f"=== ZK RESPONSE [{response.status_code}] ===")
            try:
                print("Data/Error JSON:", response.json())
            except Exception:
                print("Text Raw Response:", response.text)
            res_data = response.json()
            if response.status_code in [200, 201]:
                return True, {
                    'name': found_zk_pos.get('position_name'),
                    'zk_id': matched_zk_id,
                    'code': found_zk_pos.get('position_code'),
                    'zk_data': res_data,
                    'detail': f"Berhasil Sinkronisasi Position {pos_name} ke ZKTeco BioTime."
                }
            
            error_detail = res_data.get('detail') if isinstance(res_data, dict) and res_data.get('detail') else res_data
            print('rererer',error_detail)
            return False, {
                'detail': error_detail,
                'zk_data': res_data
            }

        print(4444)
        response = requests.post(sync_url, json=zk_payload, headers=headers, timeout=10)
        res_data = response.json()
        if response.status_code in [200, 201]:
            res_data = response.json()
            
            return True, {
                'name': res_data.get('position_name'),
                'zk_id': res_data.get('id'),
                'code': res_data.get('position_code'),
                'zk_data': res_data,
                'detail': f"Berhasil Sinkronisasi Position {pos_name} ke ZKTeco BioTime."
            }
        error_detail = res_data.get('detail') if isinstance(res_data, dict) and res_data.get('detail') else res_data
        print('rqrqrqrq',error_detail)
        return False, {
            'detail': error_detail,
            'zk_data': res_data
        }
        

    except requests.exceptions.RequestException as e:
        print('eeeeeeee',e)
        return False, {"detail": f"Gagal terhubung ke Server ZKTeco: {str(e)}"}


def sync_area_to_zk(area_name, area_obj=None, area_code=None, zk_id=None):
    """
    Helper function untuk menyinkronkan objek Area ke ZKTeco BioTime.
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

    sync_url = f"{BiotimeLogin.ZK_BASE_URL}/personnel/api/areas/"
    zk_payload = {
        'area_code': area_code,
        'area_name': area_name,
        "parent_area": None,
    }

    try:
        print(111)
        if zk_id:
            update_url = f"{sync_url}{zk_id}/"
            response = requests.put(update_url, json=zk_payload, headers=headers, timeout=10)
            
            if response.status_code in [200, 201]:
                res_json = response.json()
                if area_obj and res_json.get('area_code'):
                    area_obj.code = res_json.get('area_code')
                return True, res_json
            
            return False, response.json()

        search_url = f"{sync_url}?area_name={area_name}"
        search_response = requests.get(search_url, headers=headers, timeout=10)
        print(2222)
        found_zk_area = None
        if search_response.status_code == 200:
            res_data = search_response.json()
            results = res_data.get('data', []) if isinstance(res_data, dict) else res_data
            if results and len(results) > 0:
                found_zk_area = results[0]

        print(3333)
        if found_zk_area:
            matched_zk_id = found_zk_area.get('id')
            zk_payload['area_code'] = found_zk_area.get('area_code')
            update_url = f"{sync_url}{matched_zk_id}/"
            response = requests.put(update_url, json=zk_payload, headers=headers, timeout=10)
            
            if response.status_code in [200, 201]:
                res_json = response.json()
                return True, {
                    'name': found_zk_area.get('area_name'),
                    'zk_id': matched_zk_id,
                    'code': found_zk_area.get('area_code'),
                    'zk_data': res_json,
                    'detail': f"Berhasil Sinkronisasi Area {area_name} ke ZKTeco BioTime."
                }
            
            return False, response.json()

        print(4444)
        response = requests.post(sync_url, json=zk_payload, headers=headers, timeout=10)
        res_data = response.json()
        print(f"=== ZK RESPONSE [{response.status_code}] ===")
        try:
            print("Data/Error JSON:", response.json())
        except Exception:
            print("Text Raw Response:", response.text)
        if response.status_code in [200, 201]:
            return True, {
                'name': res_data.get('area_name'),
                'zk_id': res_data.get('id'),
                'code': res_data.get('area_code'),
                'zk_data': res_data,
                'detail': f"Berhasil Sinkronisasi Area {area_name} ke ZKTeco BioTime."
            }
        
        error_detail = res_data.get('detail') if isinstance(res_data, dict) and res_data.get('detail') else res_data
        print('rqrqrqrq',error_detail)
        return False, {
            'detail': res_data,
        }

    except requests.exceptions.RequestException as e:
        print('rttrtrt', e)
        return False, {"detail": f"Gagal terhubung ke Server ZKTeco: {str(e)}"}


def sync_attendance_to_zk(start_date_str=None, end_date_str=None, emp_code=None):
    """
    Helper function untuk penarikan data transaksi absensi dari ZKTeco BioTime.
    
    - Default: Menarik data hari ini (00:00:00 s/d 23:59:59).
    - Menangani pagination secara otomatis hingga seluruh data ditarik.
    - Mencegah duplikasi log menggunakan `zk_id`.
    - Cocok digunakan oleh CronJob maupun API Endpoint manual.
    
    Returns: (success: bool, result_dict: dict)
    """
    zk_auth = BiotimeLogin()
    zk_token = zk_auth.get_token()
    print('att111', zk_token)
    if not zk_token:
        return False, {"detail": "Gagal Melakukan Autentikasi ke Server ZKTeco BioTime."}

    headers = {
        "Authorization": f"Token {zk_token}",
        "Content-Type": "application/json",
    }

    # 1. Penentuan Rentang Waktu (Default: Hari Ini)
    now = datetime.now()
    today_str = now.strftime("%Y-%m-%d")

    start_time = f"{start_date_str} 00:00:00" if start_date_str else f"{today_str} 00:00:00"
    end_time = f"{end_date_str} 23:59:59" if end_date_str else f"{today_str} 23:59:59"

    params = {
        "page": 1,
        "page_size": 100,
        "start_time": start_time,
        "end_time": end_time,
    }

    if emp_code:
        params["emp_code"] = emp_code

    sync_url = f"{BiotimeLogin.ZK_BASE_URL}/iclock/api/transactions/"

    total_saved = 0
    total_skipped = 0
    total_fetched = 0

    try:
        # Pre-fetch seluruh Employee untuk optimasi query (memetakan NIK ke instance Employee)
        all_employees = Employee.objects.all()
        emp_map = {str(e.code if hasattr(e, 'code') and e.code else e.nik): e for e in all_employees if hasattr(e, 'nik') or hasattr(e, 'code')}

        while True:
            response = requests.get(sync_url, headers=headers, params=params, timeout=15)
            
            if response.status_code != 200:
                err_data = response.json() if response.content else response.text
                return False, {"detail": f"Gagal mengambil transaksi dari ZK [{response.status_code}]", "error": err_data}

            res_data = response.json()
            results = res_data.get('results', res_data.get('data', []))

            if not results:
                break

            total_fetched += len(results)

            for item in results:
                zk_tx_id = item.get('id')
                item_emp_code = str(item.get('emp_code', ''))
                punch_time_str = item.get('punch_time')

                if not punch_time_str:
                    continue

                # 2. Pemetaan Tipe Pindaian (Check In / Check Out)
                punch_state = str(item.get('punch_state', '0'))
                check_type_map = {
                    '0': AttendanceLog.CheckTypeChoices.CHECK_IN,
                    '1': AttendanceLog.CheckTypeChoices.CHECK_OUT,
                    '4': AttendanceLog.CheckTypeChoices.OVERTIME_IN,
                    '5': AttendanceLog.CheckTypeChoices.OVERTIME_OUT,
                }
                check_type = check_type_map.get(punch_state, AttendanceLog.CheckTypeChoices.CHECK_IN)

                # 3. Ambil data gabungan Employee (dari DB Local jika ada match NIK)
                matched_emp = emp_map.get(item_emp_code)
                first_name = item.get('first_name') or ''
                last_name = item.get('last_name') or ''
                emp_name = f"{first_name} {last_name}".strip()
                if not emp_name and matched_emp:
                    emp_name = getattr(matched_emp, 'name', '')

                dept_name = item.get('department') or (matched_emp.department.name if matched_emp and getattr(matched_emp, 'department', None) else None)
                pos_name = item.get('position') or (matched_emp.position.name if matched_emp and getattr(matched_emp, 'position', None) else None)

                parsed_time = parse_datetime(punch_time_str) or punch_time_str

                # 4. Simpan Log (Gunakan get_or_create dengan zk_id agar tidak terduplikasi)
                if zk_tx_id:
                    obj, created = AttendanceLog.objects.get_or_create(
                        zk_id=zk_tx_id,
                        defaults={
                            'employee': matched_emp,
                            'employee_nik': item_emp_code,
                            'employee_name': emp_name or item_emp_code,
                            'department_name': dept_name,
                            'position_name': pos_name,
                            'timestamp': parsed_time,
                            'check_type': check_type,
                            'sn_device': item.get('terminal_sn', ''),
                            'raw_uid': item_emp_code,
                            'raw_payload': item
                        }
                    )
                else:
                    obj, created = AttendanceLog.objects.get_or_create(
                        employee_nik=item_emp_code,
                        timestamp=parsed_time,
                        defaults={
                            'employee': matched_emp,
                            'employee_name': emp_name or item_emp_code,
                            'department_name': dept_name,
                            'position_name': pos_name,
                            'check_type': check_type,
                            'sn_device': item.get('terminal_sn', ''),
                            'raw_uid': item_emp_code,
                            'raw_payload': item
                        }
                    )

                if created:
                    total_saved += 1
                else:
                    total_skipped += 1

            # Pagination: Cek apakah ada halaman berikutnya dari ZKTeco
            if res_data.get('next'):
                params['page'] += 1
            else:
                break

        return True, {
            "detail": f"Sinkronisasi absensi selesai. Data ditarik: {total_fetched}, Baru disimpan: {total_saved}, Dilewati (Sudah ada): {total_skipped}.",
            "total_fetched": total_fetched,
            "total_saved": total_saved,
            "total_skipped": total_skipped
        }

    except requests.exceptions.RequestException as e:
        return False, {"detail": f"Gagal terhubung ke Server ZKTeco: {str(e)}"}






