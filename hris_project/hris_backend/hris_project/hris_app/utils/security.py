import json
import base64
from cryptography.fernet import Fernet
from django.conf import settings

# Ambil key enkripsi dari settings.py (Atau buat fallback jika belum ada)
# Untuk produksi, generate via Fernet.generate_key() dan taruh di .env
SECRET_KEY_32 = getattr(settings, 'SECRET_KEY', 'default_secret_key_hris_32bytes_len')[:32].zfill(32)
FERNET_KEY = base64.urlsafe_b64encode(SECRET_KEY_32.encode())
fernet = Fernet(FERNET_KEY)

def encrypt_data(data_obj):
    """Mengenkripsi Dict/List/String menjadi String Terenkripsi (AES-256)"""
    if data_obj is None:
        return None
    json_str = json.dumps(data_obj)
    encrypted_bytes = fernet.encrypt(json_str.encode('utf-8'))
    return encrypted_bytes.decode('utf-8')

def decrypt_data(encrypted_str):
    """Mendekripsi String Terenkripsi kembali ke Bentuk Aslinya"""
    if not encrypted_str:
        return None
    try:
        decrypted_bytes = fernet.decrypt(encrypted_str.encode('utf-8'))
        return json.loads(decrypted_bytes.decode('utf-8'))
    except Exception as e:
        print(f"Decryption Error: {e}")
        return None