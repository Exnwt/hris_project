import React, { useState, useEffect, useRef } from "react";
import * as faceapi from "face-api.js";
import api from "../api";

const BiometricEnrollmentPages = () => {
  // State Karyawan
  const [employees, setEmployees] = useState([]);
  const [selectedNik, setSelectedNik] = useState("");
  const [selectedEmployeeData, setSelectedEmployeeData] = useState(null);

  // State Biometrik
  const [activeTab, setActiveTab] = useState("FACE"); // "FACE" atau "FINGERPRINT"
  const [devicePinId, setDevicePinId] = useState("");
  const [manualTemplate, setManualTemplate] = useState("");

  // State Camera & AI
  const videoRef = useRef(null);
  const [isModelsLoaded, setIsModelsLoaded] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [capturedVector, setCapturedVector] = useState(null);

  // Status & Loading
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  // 1. Fetch Daftar Karyawan saat Load
  useEffect(() => {
    fetchEmployees();
    loadFaceModels();
    
    return () => {
      stopCamera();
    };
  }, []);

  const fetchEmployees = async () => {
    try {
      const res = await api.get("/api/v1/onboarding/employees/");
      const data = res.data.results || res.data;
      setEmployees(data);
    } catch (err) {
      console.error("Gagal mengambil list karyawan:", err);
      setMessage({ type: "error", text: "Gagal memuat data karyawan." });
    }
  };

  // Update Detail Karyawan Terpilih
  const handleSelectEmployee = (nik) => {
    setSelectedNik(nik);
    const emp = employees.find((item) => item.nik_karyawan === nik);
    setSelectedEmployeeData(emp || null);
    setMessage({ type: "", text: "" });
  };

  // 2. Load Models face-api.js
  const loadFaceModels = async () => {
    try {
        const MODEL_URL = "/models";
        console.log("Memuat AI Models dari:", MODEL_URL);

        // Dapatkan instance nets yang valid
        const nets = faceapi.nets || (faceapi.default && faceapi.default.nets);

        if (!nets) {
        throw new Error("Objek faceapi.nets tidak ditemukan. Periksa cara import library.");
        }

        await Promise.all([
        nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
        nets.faceLandmark64Net ? nets.faceLandmark64Net.loadFromUri(MODEL_URL) : nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        ]);

        setIsModelsLoaded(true);
        console.log("✅ AI Models Berhasil Dimuat!");
    } catch (err) {
        console.error("Gagal memuat AI Models:", err);
        setMessage({
        type: "error",
        text: "Gagal memuat AI Models. Pastikan file model ada di folder public/models/.",
        });
    }
    };

  // 3. Kontrol Kamera Webcam
  const startCamera = () => {
    setIsCameraActive(true);
    setCapturedVector(null);
    navigator.mediaDevices
      .getUserMedia({ video: { width: 640, height: 480 } })
      .then((stream) => {
        if (videoRef.current) videoRef.current.srcObject = stream;
      })
      .catch((err) => {
        console.error("Gagal akses kamera:", err);
        setMessage({ type: "error", text: "Kamera tidak diizinkan atau tidak ditemukan." });
        setIsCameraActive(false);
      });
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
    }
    setIsCameraActive(false);
  };

    // 4. Tangkap Sampel Wajah & Ekstrak Vector (128 Floats)
    const handleCaptureFace = async () => {
        if (!isModelsLoaded) {
        setMessage({ type: "error", text: "Model AI Wajah belum siap. Tunggu sebentar." });
        return;
        }

        try {
        setLoading(true);
        setMessage({ type: "info", text: "Mendeteksi wajah..." });

        // Gunakan faceapi instance
        const apiInstance = faceapi.detectSingleFace ? faceapi : faceapi.default;

        const detection = await apiInstance
            .detectSingleFace(videoRef.current)
            .withFaceLandmarks()
            .withFaceDescriptor();

        if (!detection) {
            setMessage({ type: "error", text: "Wajah tidak terdeteksi! Pastikan wajah menghadap tepat ke kamera." });
            return;
        }

        const vectorArray = Array.from(detection.descriptor);
        setCapturedVector(vectorArray);
        setMessage({ type: "success", text: "Wajah berhasil dideteksi! Silakan klik 'Simpan Pendaftaran Wajah'." });
        stopCamera();
        } catch (err) {
        console.error("Capture Face Error:", err);
        setMessage({ type: "error", text: "Gagal mengekstraksi sampel wajah." });
        } finally {
        setLoading(false);
        }
    };

  // 5. Tangkap Sidik Jari via WebAuthn API (Sensor HP/Laptop Native)
  const handleCaptureWebAuthnFingerprint = async () => {
    if (!window.PublicKeyCredential) {
      alert("Browser/Laptop Anda tidak mendukung WebAuthn Fingerprint.");
      return;
    }

    try {
      setLoading(true);
      setMessage({ type: "info", text: "Sentuh sensor sidik jari perangkat Anda..." });

      const credential = await navigator.credentials.create({
        publicKey: {
          challenge: new Uint8Array(32),
          rp: { name: "HRIS Biometric System" },
          user: {
            id: new Uint8Array(16),
            name: selectedEmployeeData?.nama_lengkap || "Employee",
            displayName: selectedEmployeeData?.nama_lengkap || "Employee",
          },
          pubKeyCredParams: [{ alg: -7, type: "public-key" }],
          timeout: 60000,
          authenticatorSelection: { userVerification: "required" },
        },
      });

      if (credential) {
        // Gunakan credential ID sebagai string template
        setManualTemplate(credential.id);
        setMessage({ type: "success", text: "Sidik Jari Perangkat Berhasil Diverifikasi! Klik 'Simpan'." });
      }
    } catch (err) {
      setMessage({ type: "error", text: "Pendaftaran Sidik Jari Dibatalkan / Gagal." });
    } finally {
      setLoading(false);
    }
  };

  // 6. Submit Data Pendaftaran ke Backend Django
  const handleSubmitEnrollment = async (e) => {
    e.preventDefault();

    if (!selectedNik) {
      setMessage({ type: "error", text: "Pilih Karyawan terlebih dahulu!" });
      return;
    }

    if (activeTab === "FACE" && !capturedVector) {
      setMessage({ type: "error", text: "Ambil foto sampel wajah terlebih dahulu!" });
      return;
    }

    if (activeTab === "FINGERPRINT" && !manualTemplate && !devicePinId) {
      setMessage({ type: "error", text: "Isi Template Sidik Jari atau PIN Mesin Hardware!" });
      return;
    }

    setLoading(true);
    setMessage({ type: "info", text: "Menyimpan data biometrik terenkripsi..." });

    try {
      const payload = {
        nik_karyawan: selectedNik,
        face_descriptor: activeTab === "FACE" ? capturedVector : null,
        fingerprint_template: activeTab === "FINGERPRINT" ? manualTemplate : null,
        device_pin_id: devicePinId || null,
      };

      const res = await api.post("/api/v2/access/biometric/enroll/", payload);
      setMessage({ type: "success", text: res.data.message });

      // Reset form biometrik
      setCapturedVector(null);
      setManualTemplate("");
    } catch (err) {
      const errorDetail = err.response?.data?.detail || "Gagal mendaftarkan biometrik.";
      setMessage({ type: "error", text: errorDetail });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={containerStyle}>
      {/* HEADER */}
      <div style={headerStyle}>
        <h2 style={{ margin: 0, color: "#0f172a" }}>Biometric Enrollment</h2>
        <p style={{ margin: "5px 0 0", color: "#64748b", fontSize: "14px" }}>
          Pendaftaran Master Data Wajah & Sidik Jari Karyawan
        </p>
      </div>

      {/* FORM UTAMA */}
      <form onSubmit={handleSubmitEnrollment}>
        {/* STEP 1: PILIH KARYAWAN */}
        <div style={cardStyle}>
          <h3 style={sectionTitleStyle}>1. Pilih Karyawan</h3>
          <div style={{ display: "flex", gap: "15px", alignItems: "center" }}>
            <select
              value={selectedNik}
              onChange={(e) => handleSelectEmployee(e.target.value)}
              style={selectStyle}
              required
            >
              <option value="">-- Pilih Karyawan --</option>
              {employees.map((emp) => (
                <option key={emp.nik_karyawan} value={emp.nik_karyawan}>
                  {emp.nik_karyawan} - {emp.nama_lengkap}
                </option>
              ))}
            </select>
          </div>

          {selectedEmployeeData && (
            <div style={empInfoBoxStyle}>
              <p style={{ margin: 0 }}>
                <strong>Nama:</strong> {selectedEmployeeData.nama_lengkap} | <strong>Gender:</strong>{" "}
                {selectedEmployeeData.jenis_kelamin === "L" ? "Laki-laki" : "Perempuan"}
              </p>
            </div>
          )}
        </div>

        {/* STEP 2: METODE BIOMETRIK */}
        <div style={cardStyle}>
          <h3 style={sectionTitleStyle}>2. Pilih Biometrik yang Ingin Didaftarkan</h3>

          {/* TAB BUTTONS */}
          <div style={tabContainerStyle}>
            <button
              type="button"
              onClick={() => {
                setActiveTab("FACE");
                setMessage({ type: "", text: "" });
              }}
              style={{
                ...tabButtonStyle,
                ...(activeTab === "FACE" ? activeTabStyle : {}),
              }}
            >
              📸 Wajah (Face Recognition)
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab("FINGERPRINT");
                stopCamera();
                setMessage({ type: "", text: "" });
              }}
              style={{
                ...tabButtonStyle,
                ...(activeTab === "FINGERPRINT" ? activeTabStyle : {}),
              }}
            >
              👆 Sidik Jari (Fingerprint)
            </button>
          </div>

          {/* CONTENT TAB 1: FACE RECOGNITION */}
          {activeTab === "FACE" && (
            <div style={{ textAlign: "center", marginTop: "20px" }}>
              <div style={cameraBoxStyle}>
                <video ref={videoRef} autoPlay muted style={videoStyle} />
                {!isCameraActive && !capturedVector && (
                  <div style={overlayStyle}>Kamera Mati. Klik "Buka Kamera".</div>
                )}
                {capturedVector && (
                  <div style={{ ...overlayStyle, background: "rgba(22, 163, 74, 0.85)" }}>
                    ✅ Sampel Vektor Wajah (128 Float) Berhasil Ditangkap!
                  </div>
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
                      onClick={handleCaptureFace}
                      style={{ ...btnPrimaryStyle, background: "#16a34a" }}
                    >
                      📸 Tangkap Sampel Wajah
                    </button>
                    <button type="button" onClick={stopCamera} style={btnDangerStyle}>
                      🛑 Matikan Kamera
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* CONTENT TAB 2: FINGERPRINT */}
          {activeTab === "FINGERPRINT" && (
            <div style={{ marginTop: "20px" }}>
              <div style={{ marginBottom: "15px" }}>
                <label style={labelStyle}>Opsi A: Scan Sidik Jari Perangkat (HP/Laptop Passkey)</label>
                <button
                  type="button"
                  onClick={handleCaptureWebAuthnFingerprint}
                  style={{ ...btnPrimaryStyle, background: "#2563eb", width: "100%", marginTop: "5px" }}
                >
                  👆 Sentuh Sensor Sidik Jari Laptop/HP
                </button>
              </div>

              <hr style={{ border: "0.5px solid #e2e8f0", margin: "20px 0" }} />

              <div style={{ marginBottom: "15px" }}>
                <label style={labelStyle}>Opsi B: PIN Mesin Absensi Fisik Kantor (Solution/ZKTeco)</label>
                <input
                  type="text"
                  placeholder="Contoh: 1002"
                  value={devicePinId}
                  onChange={(e) => setDevicePinId(e.target.value)}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Opsi C: Raw Template String / Base64 SDK</label>
                <textarea
                  rows="3"
                  placeholder="Format ANSI-378 / ISO Base64 String..."
                  value={manualTemplate}
                  onChange={(e) => setManualTemplate(e.target.value)}
                  style={inputStyle}
                />
              </div>
            </div>
          )}
        </div>

        {/* NOTIFIKASI */}
        {message.text && (
          <div style={message.type === "error" ? msgErrorStyle : msgSuccessStyle}>
            {message.text}
          </div>
        )}

        {/* SUBMIT BUTTON */}
        <button
          type="submit"
          disabled={loading || !selectedNik}
          style={{
            ...btnPrimaryStyle,
            width: "100%",
            padding: "14px",
            fontSize: "16px",
            opacity: !selectedNik ? 0.6 : 1,
          }}
        >
          {loading ? "Menyimpan Data..." : "💾 Simpan Pendaftaran Biometrik"}
        </button>
      </form>
    </div>
  );
};

// ==========================================
// STYLES
// ==========================================

const containerStyle = { maxWidth: "700px", margin: "0 auto", padding: "24px", fontFamily: "Arial, sans-serif" };
const headerStyle = { marginBottom: "20px" };
const cardStyle = { background: "#ffffff", padding: "20px", borderRadius: "10px", border: "1px solid #e2e8f0", marginBottom: "20px" };
const sectionTitleStyle = { margin: "0 0 15px", fontSize: "16px", color: "#0f172a" };
const selectStyle = { width: "100%", padding: "10px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "14px", background: "#fff" };
const empInfoBoxStyle = { marginTop: "12px", padding: "10px", background: "#f8fafc", borderRadius: "6px", fontSize: "13px", color: "#334155", borderLeft: "4px solid #2563eb" };

const tabContainerStyle = { display: "flex", gap: "10px", borderBottom: "1px solid #e2e8f0", paddingBottom: "10px" };
const tabButtonStyle = { flex: 1, padding: "10px", border: "none", background: "#f1f5f9", color: "#64748b", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "14px" };
const activeTabStyle = { background: "#2563eb", color: "#ffffff" };

const cameraBoxStyle = { position: "relative", width: "100%", height: "300px", background: "#000", borderRadius: "8px", overflow: "hidden", marginBottom: "15px" };
const videoStyle = { width: "100%", height: "100%", objectFit: "cover" };
const overlayStyle = { position: "absolute", inset: 0, display: "flex", justifyContent: "center", alignItems: "center", color: "#fff", background: "rgba(0,0,0,0.6)", fontSize: "14px" };

const labelStyle = { display: "block", fontSize: "13px", fontWeight: "bold", color: "#475569", marginBottom: "5px" };
const inputStyle = { width: "100%", padding: "10px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "14px", boxSizing: "border-box" };

const btnPrimaryStyle = { background: "#2563eb", color: "#fff", border: "none", padding: "10px 18px", borderRadius: "6px", fontWeight: "bold", cursor: "pointer" };
const btnSecondaryStyle = { background: "#475569", color: "#fff", border: "none", padding: "10px 18px", borderRadius: "6px", fontWeight: "bold", cursor: "pointer" };
const btnDangerStyle = { background: "#ef4444", color: "#fff", border: "none", padding: "10px 18px", borderRadius: "6px", fontWeight: "bold", cursor: "pointer" };

const msgSuccessStyle = { padding: "12px", background: "#dcfce7", color: "#15803d", borderRadius: "6px", marginBottom: "15px", fontWeight: "bold", fontSize: "14px" };
const msgErrorStyle = { padding: "12px", background: "#fee2e2", color: "#b91c1c", borderRadius: "6px", marginBottom: "15px", fontWeight: "bold", fontSize: "14px" };

export default BiometricEnrollmentPages;