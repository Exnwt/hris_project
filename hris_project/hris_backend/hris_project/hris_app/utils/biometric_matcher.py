import math

def verify_face_descriptor(incoming_vector, stored_vector, threshold=0.50):
    """
    Menghitung Euclidean Distance antara 2 Vektor Wajah (128 floats).
    Distance <= 0.50 (atau 0.60) dikategorikan COCOK (MATCH).
    Tingkat Akurasi = (1 - Distance) * 100%
    """
    if not incoming_vector or not stored_vector:
        return False, 999.0

    if len(incoming_vector) != len(stored_vector):
        return False, 999.0

    # Rumus Euclidean Distance
    distance = math.sqrt(sum((a - b) ** 2 for a, b in zip(incoming_vector, stored_vector)))
    is_match = distance <= threshold
    
    return is_match, round(distance, 4)


def verify_fingerprint_template(incoming_template, stored_template):
    """
    Pengecekan Sidik Jari.
    - Untuk WebAuthn/Passkey: Pembandingan Credential ID.
    - Untuk Hardware SDK (ANSI/ISO Template):
      Jika SDK sudah di-convert ke Hash/Base64 string unik, dilakukan Exact Match / Matcher SDK.
    """
    if not incoming_template or not stored_template:
        return False

    # Pencocokan string template hasil ekstraksi SDK/WebAuthn
    return incoming_template.strip() == stored_template.strip()