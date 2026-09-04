import React, { useState, useEffect, useRef } from "react";
import * as faceapi from "face-api.js";
import api from "../api";

const AttendanceScannerPages = () => {
  // State Aksi Absen & Metode
  const [clockType, setClockType] = useState("IN"); // "IN" (Clock-In) atau "OUT" (Clock-Out)
  const [activeMethod, setActiveMethod] = useState("FACE"); // "FACE" atau "FINGERPRINT"

  // State Kamera & AI Wajah
  const videoRef = useRef(null);
  const [isModelsLoaded, setIsModelsLoaded] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);

  // State Fingerprint Manual/Passkey
  const [fingerprintTemplate, setFingerprintTemplate] = useState("");

  // Status & Respon
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [lastAttendanceInfo, setLastAttendanceInfo] = useState(null);

  // 1. Load AI Models
  useEffect(() => {
    loadFaceModels();

    return () => {
      stopCamera();
    };
  }, []);

  const loadFaceModels = async () => {
    try {
      const MODEL_URL = "/models";
      const nets = faceapi.nets || (faceapi.default && faceapi.default.nets);

      if (!nets) {
        throw new Error("Objek faceapi.nets tidak ditemukan.");
      }

      await Promise.all([
        nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
        nets.faceLandmark64Net
          ? nets.faceLandmark64Net.loadFromUri(MODEL_URL)
          : nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      ]);

      setIsModelsLoaded(true);
    } catch (err) {
      console.error("Gagal memuat AI Models:", err);
    }
  };

  // 2. Kontrol Kamera Webcam
  const startCamera = () => {
    setIsCameraActive(true);
    setMessage({ type: "", text: "" });
    
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setMessage({
        type: "error",
        text: "Kamera tidak dapat diakses. Pastikan Anda mengakses via HTTPS atau localhost.",
      });
      setIsCameraActive(false);
      return;
    }

    navigator.mediaDevices
      .getUserMedia({ video: { width: 640, height: 480 } })
      .then((stream) => {
        if (videoRef.current) videoRef.current.srcObject = stream;
      })
      .catch((err) => {
        console.error("Gagal akses kamera:", err);
        setMessage({ type: "error", text: "Kamera tidak diizinkan atau tidak terdeteksi." });
        setIsCameraActive(false);
      });
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
    }
    setIsCameraActive(false);
  };

  // 3. Proses Absensi via WAJAH (Scan & Verify)
  const handleScanAndVerifyFace = async () => {
    // if (!isModelsLoaded) {
    //   alert("Model AI Wajah belum siap. Mohon tunggu beberapa detik.");
    //   return;
    // }
  
    try {
      setLoading(true);
      setMessage({ type: "info", text: "Mendeteksi & Mengidentifikasi Wajah..." });
  
      const apiInstance = faceapi.detectSingleFace ? faceapi : faceapi.default;
  
      // 1. Proses deteksi wajah via AI Browser
      const detection = await apiInstance
        .detectSingleFace(videoRef.current)
        .withFaceLandmarks()
        .withFaceDescriptor();
  
      // 2. JIKA WAJAH TIDAK TERDETEKSI:
      if (!detection) {
        alert("⚠️ Gagal Mengidentifikasi Wajah!\n\nPastikan pencahayaan cukup dan wajah menghadap tepat ke kamera, lalu coba lagi.");
        setMessage({
          type: "error",
          text: "Wajah tidak terdeteksi. Silakan posisikan wajah dengan jelas dan tekan tombol Scan kembali.",
        });
        return;
      }
  
      // 3. JIKA WAJAH TERDETEKSI:
      const faceVector = Array.from(detection.descriptor);
  
      const response = await api.post("/api/v2/access/biometric/verify-clock/", {
        method: "FACE",
        type: clockType,
        face_descriptor: faceVector,
      });
  
      // Berhasil Absen
      setMessage({ type: "success", text: response.data.message });
      setLastAttendanceInfo({
        nama: response.data.nama_lengkap,
        nik: response.data.nik_karyawan,
        waktu: new Date().toLocaleTimeString(),
        tipe: clockType === "IN" ? "Clock-In (Masuk)" : "Clock-Out (Pulang)",
      });
  
      stopCamera();
    } catch (err) {
      console.error("Biometric Verification Error:", err);
      const errorMsg = err.response?.data?.detail || "Gagal melakukan verifikasi wajah ke server.";
      
      alert(`❌ Verifikasi Gagal:\n${errorMsg}`);
      setMessage({ type: "error", text: errorMsg });
    } finally {
      setLoading(false);
    }
  };    

  // 4. Proses Absensi via SIDIK JARI (Passkey / WebAuthn)
  const handleVerifyFingerprintPasskey = async () => {
    if (!window.PublicKeyCredential) {
      alert("Browser/Laptop Anda tidak mendukung WebAuthn Fingerprint.");
      return;
    }

    try {
      setLoading(true);
      setMessage({ type: "info", text: "Sentuh sensor sidik jari pada perangkat Anda..." });

      const credential = await navigator.credentials.get({
        publicKey: {
          challenge: new Uint8Array(32),
          timeout: 60000,
          userVerification: "required",
        },
      });

      if (credential) {
        submitFingerprintAttendance(credential.id);
      }
    } catch (err) {
      setMessage({ type: "error", text: "Verifikasi Sidik Jari Dibatalkan atau Gagal." });
      setLoading(false);
    }
  };

  // Submit Absensi Sidik Jari ke Backend
  const submitFingerprintAttendance = async (templateStr) => {
    try {
      setLoading(true);
      const response = await api.post("/api/v2/access/biometric/verify-clock/", {
        method: "FINGERPRINT",
        type: clockType,
        fingerprint_template: templateStr,
      });

      setMessage({ type: "success", text: response.data.message });
      setLastAttendanceInfo({
        nama: response.data.nama_lengkap,
        nik: response.data.nik_karyawan,
        waktu: new Date().toLocaleTimeString(),
        tipe: clockType === "IN" ? "Clock-In (Masuk)" : "Clock-Out (Pulang)",
      });
      setFingerprintTemplate("");
    } catch (err) {
      const errorMsg = err.response?.data?.detail || "Gagal melakukan verifikasi sidik jari.";
      setMessage({ type: "error", text: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={containerStyle}>
      {/* HEADER */}
      <div style={headerStyle}>
        <h2 style={{ margin: 0, color: "#0f172a" }}>Biometric Attendance Terminal</h2>
        <p style={{ margin: "5px 0 0", color: "#64748b", fontSize: "14px" }}>
          Terminal Absensi Harian Karyawan (Clock-In / Clock-Out)
        </p>
      </div>

      {/* SAKELAR CLOCK-IN / CLOCK-OUT */}
      <div style={cardStyle}>
        <label style={labelStyle}>Pilih Jenis Absensi:</label>
        <div style={clockTypeContainerStyle}>
          <button
            type="button"
            onClick={() => {
              setClockType("IN");
              setMessage({ type: "", text: "" });
            }}
            style={{
              ...clockTypeButtonStyle,
              ...(clockType === "IN" ? activeClockInStyle : {}),
            }}
          >
            🟢 CLOCK - IN (Absen Masuk)
          </button>
          <button
            type="button"
            onClick={() => {
              setClockType("OUT");
              setMessage({ type: "", text: "" });
            }}
            style={{
              ...clockTypeButtonStyle,
              ...(clockType === "OUT" ? activeClockOutStyle : {}),
            }}
          >
            🔴 CLOCK - OUT (Absen Pulang)
          </button>
        </div>
      </div>

      {/* METODE BIOMETRIK */}
      <div style={cardStyle}>
        <label style={labelStyle}>Pilih Metode Biometrik:</label>
        <div style={tabContainerStyle}>
          <button
            type="button"
            onClick={() => {
              setActiveMethod("FACE");
              setMessage({ type: "", text: "" });
            }}
            style={{
              ...tabButtonStyle,
              ...(activeMethod === "FACE" ? activeTabStyle : {}),
            }}
          >
            📸 Wajah (Face Recognition)
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveMethod("FINGERPRINT");
              stopCamera();
              setMessage({ type: "", text: "" });
            }}
            style={{
              ...tabButtonStyle,
              ...(activeMethod === "FINGERPRINT" ? activeTabStyle : {}),
            }}
          >
            👆 Sidik Jari (Fingerprint)
          </button>
        </div>

        {/* TAB CONTENT 1: FACE RECOGNITION */}
        {activeMethod === "FACE" && (
          <div style={{ textAlign: "center", marginTop: "20px" }}>
            <div style={cameraBoxStyle}>
              <video ref={videoRef} autoPlay muted style={videoStyle} />
              {!isCameraActive && (
                <div style={overlayStyle}>Kamera Offline. Klik "Buka Kamera" untuk scan.</div>
              )}
            </div>

            <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
              {!isCameraActive ? (
                <button type="button" onClick={startCamera} style={btnSecondaryStyle}>
                  🎥 Buka Kamera
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={handleScanAndVerifyFace}
                    style={{
                      ...btnPrimaryStyle,
                      background: clockType === "IN" ? "#16a34a" : "#dc2626",
                    }}
                  >
                    {loading
                      ? "Verifikasi..."
                      : clockType === "IN"
                      ? "📸 Process Clock-In (Wajah)"
                      : "📸 Process Clock-Out (Wajah)"}
                  </button>
                  <button type="button" onClick={stopCamera} style={btnDangerStyle}>
                    🛑 Tutup Kamera
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* TAB CONTENT 2: FINGERPRINT */}
        {activeMethod === "FINGERPRINT" && (
          <div style={{ marginTop: "20px" }}>
            <div style={{ marginBottom: "20px" }}>
              <label style={subLabelStyle}>Opsi 1: Scan via Sensor Laptop/HP (WebAuthn)</label>
              <button
                type="button"
                disabled={loading}
                onClick={handleVerifyFingerprintPasskey}
                style={{
                  ...btnPrimaryStyle,
                  background: clockType === "IN" ? "#16a34a" : "#dc2626",
                  width: "100%",
                }}
              >
                {loading
                  ? "Verifikasi..."
                  : clockType === "IN"
                  ? "👆 Sentuh Sensor untuk Clock-In"
                  : "👆 Sentuh Sensor untuk Clock-Out"}
              </button>
            </div>

            <hr style={{ border: "0.5px solid #e2e8f0", margin: "20px 0" }} />

            <div>
              <label style={subLabelStyle}>Opsi 2: Manual Template Input / USB Fingerprint Scanner</label>
              <textarea
                rows="3"
                placeholder="Paste String Template Sidik Jari / Base64 SDK..."
                value={fingerprintTemplate}
                onChange={(e) => setFingerprintTemplate(e.target.value)}
                style={inputStyle}
              />
              <button
                type="button"
                disabled={loading || !fingerprintTemplate}
                onClick={() => submitFingerprintAttendance(fingerprintTemplate)}
                style={{
                  ...btnSecondaryStyle,
                  width: "100%",
                  marginTop: "10px",
                  opacity: !fingerprintTemplate ? 0.6 : 1,
                }}
              >
                Submit Absensi Sidik Jari Manual
              </button>
            </div>
          </div>
        )}
      </div>

      {/* NOTIFIKASI STATUS */}
      {message.text && (
        <div style={message.type === "error" ? msgErrorStyle : msgSuccessStyle}>
          {message.text}
        </div>
      )}

      {/* INFO RESI ABSENSI TERAKHIR */}
      {lastAttendanceInfo && (
        <div style={receiptCardStyle}>
          <h4 style={{ margin: "0 0 10px 0", color: "#166534" }}>✅ Resi Transaksi Absensi</h4>
          <p style={{ margin: "4px 0" }}>
            <strong>Nama:</strong> {lastAttendanceInfo.nama} ({lastAttendanceInfo.nik})
          </p>
          <p style={{ margin: "4px 0" }}>
            <strong>Jenis:</strong> {lastAttendanceInfo.tipe}
          </p>
          <p style={{ margin: "4px 0" }}>
            <strong>Waktu Selesai:</strong> {lastAttendanceInfo.waktu}
          </p>
        </div>
      )}
    </div>
  );
};

// ==========================================
// STYLES
// ==========================================

const containerStyle = { maxWidth: "650px", margin: "0 auto", padding: "24px", fontFamily: "Arial, sans-serif" };
const headerStyle = { marginBottom: "20px", textAlign: "center" };
const cardStyle = { background: "#ffffff", padding: "20px", borderRadius: "10px", border: "1px solid #e2e8f0", marginBottom: "20px" };

const labelStyle = { display: "block", fontSize: "14px", fontWeight: "bold", color: "#0f172a", marginBottom: "10px" };
const subLabelStyle = { display: "block", fontSize: "13px", fontWeight: "bold", color: "#475569", marginBottom: "6px" };

const clockTypeContainerStyle = { display: "flex", gap: "10px" };
const clockTypeButtonStyle = { flex: 1, padding: "14px", border: "2px solid #cbd5e1", background: "#f8fafc", color: "#64748b", borderRadius: "8px", cursor: "pointer", fontWeight: "bold", fontSize: "14px" };
const activeClockInStyle = { background: "#dcfce7", color: "#15803d", borderColor: "#16a34a" };
const activeClockOutStyle = { background: "#fee2e2", color: "#b91c1c", borderColor: "#dc2626" };

const tabContainerStyle = { display: "flex", gap: "10px", borderBottom: "1px solid #e2e8f0", paddingBottom: "10px" };
const tabButtonStyle = { flex: 1, padding: "10px", border: "none", background: "#f1f5f9", color: "#64748b", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "14px" };
const activeTabStyle = { background: "#0f172a", color: "#ffffff" };

const cameraBoxStyle = { position: "relative", width: "100%", height: "320px", background: "#000", borderRadius: "8px", overflow: "hidden", marginBottom: "15px" };

// TAMPILAN KAMERA NORMAL (TANPA MIRROR)
const videoStyle = { 
  width: "100%", 
  height: "100%", 
  objectFit: "cover",
  transform: "scaleX(-1)",
  WebkitTransform: "scaleX(-1)",
};

const overlayStyle = { position: "absolute", inset: 0, display: "flex", justifyContent: "center", alignItems: "center", color: "#fff", background: "rgba(0,0,0,0.6)", fontSize: "14px" };

const inputStyle = { width: "100%", padding: "10px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "14px", boxSizing: "border-box" };

const btnPrimaryStyle = { color: "#fff", border: "none", padding: "12px 20px", borderRadius: "6px", fontWeight: "bold", cursor: "pointer", fontSize: "14px" };
const btnSecondaryStyle = { background: "#475569", color: "#fff", border: "none", padding: "12px 20px", borderRadius: "6px", fontWeight: "bold", cursor: "pointer", fontSize: "14px" };
const btnDangerStyle = { background: "#ef4444", color: "#fff", border: "none", padding: "12px 20px", borderRadius: "6px", fontWeight: "bold", cursor: "pointer", fontSize: "14px" };

const msgSuccessStyle = { padding: "12px", background: "#dcfce7", color: "#15803d", borderRadius: "6px", marginBottom: "15px", fontWeight: "bold", fontSize: "14px" };
const msgErrorStyle = { padding: "12px", background: "#fee2e2", color: "#b91c1c", borderRadius: "6px", marginBottom: "15px", fontWeight: "bold", fontSize: "14px" };

const receiptCardStyle = { padding: "16px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "8px", fontSize: "14px", color: "#166534" };

export default AttendanceScannerPages;