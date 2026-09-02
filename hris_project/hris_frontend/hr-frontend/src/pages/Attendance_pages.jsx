import React, { useState, useEffect } from "react";
import api from "../api"; // Instance axios Anda

const AttendancePages = () => {
  const [attendances, setAttendances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filter State
  const [filterDate, setFilterDate] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch Data Absensi dari Backend Django
  useEffect(() => {
    fetchAttendances();
  }, [filterDate, filterStatus]);

  const fetchAttendances = async () => {
    setLoading(true);
    setError("");
    try {
      let url = "/api/v2/access/Attedances/";
      const params = new URLSearchParams();

      if (filterDate) params.append("date", filterDate);
      if (filterStatus !== "ALL") params.append("status", filterStatus);

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await api.get(url);
      setAttendances(response.data.results || response.data);
    } catch (err) {
      console.error("Gagal mengambil data absensi:", err);
      setError("Gagal memuat data absensi. Pastikan server Django aktif.");
    } finally {
      setLoading(false);
    }
  };

  // Filter Client-Side berdasarkan Nama/NIK Karyawan
  const filteredData = attendances.filter((item) => {
    const empName = item.employee_name || item.employee?.nama_lengkap || "";
    const empNik = item.nik_karyawan || item.employee?.nik_karyawan || "";
    const matchesSearch =
      empName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      empNik.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  // Kalkulasi Ringkasan Statistik Log
  const totalHadir = filteredData.filter((i) => i.status === "PRESENT").length;
  const totalTerlambat = filteredData.filter((i) => i.status === "LATE").length;
  const totalPulangCepat = filteredData.filter((i) => i.status === "EARLY_LEAVE").length;

  // Helper Badge Color untuk Status
  const getStatusBadge = (status) => {
    switch (status) {
      case "PRESENT":
        return <span style={{ ...badgeStyle, background: "#dcfce7", color: "#15803d" }}>Hadir</span>;
      case "LATE":
        return <span style={{ ...badgeStyle, background: "#fef3c7", color: "#b45309" }}>Terlambat</span>;
      case "EARLY_LEAVE":
        return <span style={{ ...badgeStyle, background: "#ffedd5", color: "#c2410c" }}>Pulang Cepat</span>;
      case "ABSENT":
        return <span style={{ ...badgeStyle, background: "#fee2e2", color: "#b91c1c" }}>Mangkir</span>;
      default:
        return <span style={{ ...badgeStyle, background: "#e2e8f0", color: "#475569" }}>{status}</span>;
    }
  };

  // Helper Badge Color untuk Metode
  const getMethodBadge = (method) => {
    switch (method) {
      case "FACE":
        return <span style={methodBadgeStyle}>📸 Face Recognition</span>;
      case "FINGERPRINT":
        return <span style={methodBadgeStyle}>👆 Fingerprint</span>;
      default:
        return <span style={methodBadgeStyle}>⚙️ Manual</span>;
    }
  };

  return (
    <div style={containerStyle}>
      {/* TITLE & SUBTITLE */}
      <div style={headerStyle}>
        <div>
          <h2 style={{ margin: 0, color: "#0f172a" }}>Attendance Records</h2>
          <p style={{ margin: "5px 0 0", color: "#64748b", fontSize: "14px" }}>
            Riwayat dan log absensi biometrik karyawan
          </p>
        </div>
        <button onClick={fetchAttendances} style={refreshButtonStyle}>
          🔄 Refresh Data
        </button>
      </div>

      {/* STATISTIC CARDS */}
      <div style={statsContainerStyle}>
        <div style={statCardStyle}>
          <span style={statTitleStyle}>Total Record</span>
          <span style={statNumberStyle}>{filteredData.length}</span>
        </div>
        <div style={statCardStyle}>
          <span style={statTitleStyle}>Hadir Tepat Waktu</span>
          <span style={{ ...statNumberStyle, color: "#16a34a" }}>{totalHadir}</span>
        </div>
        <div style={statCardStyle}>
          <span style={statTitleStyle}>Terlambat</span>
          <span style={{ ...statNumberStyle, color: "#d97706" }}>{totalTerlambat}</span>
        </div>
        <div style={statCardStyle}>
          <span style={statTitleStyle}>Pulang Cepat</span>
          <span style={{ ...statNumberStyle, color: "#ea580c" }}>{totalPulangCepat}</span>
        </div>
      </div>

      {/* FILTER BAR */}
      <div style={filterBarStyle}>
        <input
          type="text"
          placeholder="Cari Nama atau NIK..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={inputSearchStyle}
        />

        <input
          type="date"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
          style={inputDateStyle}
        />

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          style={selectStyle}
        >
          <option value="ALL">Semua Status</option>
          <option value="PRESENT">Hadir (PRESENT)</option>
          <option value="LATE">Terlambat (LATE)</option>
          <option value="EARLY_LEAVE">Pulang Cepat (EARLY_LEAVE)</option>
          <option value="ABSENT">Mangkir (ABSENT)</option>
        </select>

        {filterDate && (
          <button onClick={() => setFilterDate("")} style={clearFilterButtonStyle}>
            Reset Tanggal
          </button>
        )}
      </div>

      {/* ERROR MESSAGE */}
      {error && <div style={errorBannerStyle}>{error}</div>}

      {/* TABLE DATA */}
      <div style={tableWrapperStyle}>
        <table style={tableStyle}>
          <thead>
            <tr style={tableHeaderRowStyle}>
              <th style={thStyle}>Tanggal</th>
              <th style={thStyle}>Karyawan</th>
              <th style={thStyle}>Jam Masuk (In)</th>
              <th style={thStyle}>Jam Pulang (Out)</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>Metode Absen</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" style={emptyTdStyle}>
                  Memuat data absensi...
                </td>
              </tr>
            ) : filteredData.length === 0 ? (
              <tr>
                <td colSpan="6" style={emptyTdStyle}>
                  Tidak ada data absensi ditemukan.
                </td>
              </tr>
            ) : (
              filteredData.map((row, index) => (
                <tr key={row.id || index} style={tableBodyRowStyle}>
                  <td style={tdStyle}>{row.date}</td>
                  <td style={tdStyle}>
                    <strong>{row.employee_name || row.employee?.nama_lengkap || "-"}</strong>
                    <br />
                    <small style={{ color: "#64748b" }}>
                      NIK: {row.nik_karyawan || row.employee?.nik_karyawan || "-"}
                    </small>
                  </td>
                  <td style={tdStyle}>
                    {row.clock_in ? (
                      <span style={{ fontWeight: "bold", color: "#0f172a" }}>{row.clock_in}</span>
                    ) : (
                      <span style={{ color: "#94a3b8" }}>--:--:--</span>
                    )}
                  </td>
                  <td style={tdStyle}>
                    {row.clock_out ? (
                      <span style={{ fontWeight: "bold", color: "#0f172a" }}>{row.clock_out}</span>
                    ) : (
                      <span style={{ color: "#94a3b8" }}>--:--:--</span>
                    )}
                  </td>
                  <td style={tdStyle}>{getStatusBadge(row.status)}</td>
                  <td style={tdStyle}>{getMethodBadge(row.method)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ==========================================
// STYLES
// ==========================================

const containerStyle = {
  background: "#ffffff",
  padding: "24px",
  borderRadius: "12px",
  boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
  fontFamily: "Arial, sans-serif",
};

const headerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "20px",
};

const refreshButtonStyle = {
  padding: "8px 16px",
  background: "#f1f5f9",
  color: "#334155",
  border: "1px solid #cbd5e1",
  borderRadius: "6px",
  cursor: "pointer",
  fontWeight: "bold",
  fontSize: "13px",
};

const statsContainerStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
  gap: "15px",
  marginBottom: "20px",
};

const statCardStyle = {
  background: "#f8fafc",
  padding: "16px",
  borderRadius: "8px",
  border: "1px solid #e2e8f0",
  display: "flex",
  flexDirection: "column",
};

const statTitleStyle = {
  fontSize: "12px",
  color: "#64748b",
  fontWeight: "bold",
};

const statNumberStyle = {
  fontSize: "22px",
  fontWeight: "bold",
  marginTop: "5px",
  color: "#0f172a",
};

const filterBarStyle = {
  display: "flex",
  gap: "12px",
  marginBottom: "20px",
  flexWrap: "wrap",
};

const inputSearchStyle = {
  flex: 1,
  minWidth: "200px",
  padding: "10px 12px",
  border: "1px solid #cbd5e1",
  borderRadius: "6px",
  fontSize: "14px",
};

const inputDateStyle = {
  padding: "10px 12px",
  border: "1px solid #cbd5e1",
  borderRadius: "6px",
  fontSize: "14px",
};

const selectStyle = {
  padding: "10px 12px",
  border: "1px solid #cbd5e1",
  borderRadius: "6px",
  fontSize: "14px",
  background: "#fff",
};

const clearFilterButtonStyle = {
  padding: "10px 12px",
  background: "#ef4444",
  color: "#fff",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
  fontSize: "13px",
};

const errorBannerStyle = {
  padding: "12px",
  background: "#fee2e2",
  color: "#b91c1c",
  borderRadius: "6px",
  marginBottom: "15px",
  fontSize: "14px",
};

const tableWrapperStyle = {
  overflowX: "auto",
  border: "1px solid #e2e8f0",
  borderRadius: "8px",
};

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
  textAlign: "left",
  fontSize: "14px",
};

const tableHeaderRowStyle = {
  background: "#f8fafc",
  borderBottom: "2px solid #e2e8f0",
};

const thStyle = {
  padding: "12px 16px",
  color: "#475569",
  fontWeight: "bold",
};

const tableBodyRowStyle = {
  borderBottom: "1px solid #f1f5f9",
};

const tdStyle = {
  padding: "12px 16px",
  color: "#334155",
  verticalAlign: "middle",
};

const emptyTdStyle = {
  padding: "30px",
  textAlign: "center",
  color: "#94a3b8",
};

const badgeStyle = {
  display: "inline-block",
  padding: "4px 10px",
  borderRadius: "20px",
  fontSize: "12px",
  fontWeight: "bold",
};

const methodBadgeStyle = {
  display: "inline-block",
  padding: "4px 8px",
  background: "#f1f5f9",
  color: "#475569",
  borderRadius: "6px",
  fontSize: "12px",
  border: "1px solid #cbd5e1",
};

export default AttendancePages;


// import React, { useState, useEffect, useRef } from "react";
// import api from "../api";

// const AttendancePages = () => {
//   const videoRef = useRef(null);
//   const [scanning, setScanning] = useState(false);
//   const [cameraActive, setCameraActive] = useState(false);
//   const [location, setLocation] = useState({ lat: null, lng: null, error: null });
//   const [message, setMessage] = useState({ type: "", text: "" });
//   const [lastAttendance, setLastAttendance] = useState(null);

//   // 1. Inisialisasi Kamera & Geolocation saat komponen dimuat
//   useEffect(() => {
//     startCamera();
//     getCurrentLocation();

//     return () => {
//       stopCamera();
//     };
//   }, []);

//   // Aktifkan Kamera Webcam
//   const startCamera = async () => {
//     try {
//       const stream = await navigator.mediaDevices.getUserMedia({
//         video: { width: 640, height: 480, facingMode: "user" },
//       });
//       if (videoRef.current) {
//         videoRef.current.srcObject = stream;
//         setCameraActive(true);
//       }
//     } catch (err) {
//       console.error("Gagal mengakses kamera:", err);
//       setMessage({
//         type: "error",
//         text: "Kamera tidak diizinkan atau tidak terdeteksi.",
//       });
//     }
//   };

//   // Matikan Kamera saat Komponen Unmount
//   const stopCamera = () => {
//     if (videoRef.current && videoRef.current.srcObject) {
//       const stream = videoRef.current.srcObject;
//       const tracks = stream.getTracks();
//       tracks.forEach((track) => track.stop());
//     }
//   };

//   // Dapatkan Lokasi GPS Pengguna
//   const getCurrentLocation = () => {
//     if (navigator.geolocation) {
//       navigator.geolocation.getCurrentPosition(
//         (position) => {
//           setLocation({
//             lat: position.coords.latitude,
//             lng: position.coords.longitude,
//             error: null,
//           });
//         },
//         (error) => {
//           console.warn("Gagal mengambil GPS:", error.message);
//           setLocation({
//             lat: null,
//             lng: null,
//             error: "GPS tidak aktif/tidak diizinkan.",
//           });
//         }
//       );
//     }
//   };

//   // Helper Simulasi/Ekstraksi Descriptor Wajah dari Video Element
//   const captureFaceDescriptor = () => {
//     // Note: Jika menggunakan library face-api.js, gunakan:
//     // const detection = await faceapi.detectSingleFace(videoRef.current).withFaceLandmarks().withFaceDescriptor();
//     // return Array.from(detection.descriptor);

//     // Sampel Vektor Dummy 128-float untuk Pengujian Client jika face-api belum terpasang:
//     const mockVector = Array.from({ length: 128 }, (_, i) =>
//       parseFloat((Math.sin(i + Date.now()) * 0.5).toFixed(4))
//     );
//     return mockVector;
//   };

//   // 2. Handler Absensi via WAJAH (FACE)
//   const handleFaceClock = async (actionType) => {
//     if (!cameraActive) {
//       setMessage({ type: "error", text: "Kamera belum aktif." });
//       return;
//     }

//     try {
//       setScanning(true);
//       setMessage({ type: "info", text: "Menganalisis wajah dan memverifikasi..." });

//       const faceVector = captureFaceDescriptor();

//       const payload = {
//         method: "FACE",
//         type: actionType, // "IN" atau "OUT"
//         face_descriptor: faceVector,
//         latitude: location.lat,
//         longitude: location.lng,
//       };

//       const response = await api.post("api/v2/access/biometric/verify-clock/", payload);

//       setMessage({ type: "success", text: response.data.message });
//       setLastAttendance({
//         nama: response.data.nama_lengkap,
//         nik: response.data.nik_karyawan,
//         waktu: new Date().toLocaleTimeString(),
//         type: actionType === "IN" ? "Clock-In (Masuk)" : "Clock-Out (Pulang)",
//       });
//     } catch (err) {
//       const errDetail = err.response?.data?.detail || "Verifikasi biometrik gagal.";
//       setMessage({ type: "error", text: errDetail });
//     } finally {
//       setScanning(false);
//     }
//   };

//   // 3. Handler Absensi via SIDIK JARI (FINGERPRINT / WebAuthn)
//   const handleFingerprintClock = async (actionType) => {
//     try {
//       setScanning(true);
//       setMessage({ type: "info", text: "Silakan sentuh sensor sidik jari perangkat..." });

//       let fingerprintTemplate = "SAMPLE_FINGERPRINT_TEMPLATE_BASE64";

//       // Jika browser mendukung WebAuthn Native Biometric Sensor (Passkey/TouchID):
//       if (window.PublicKeyCredential) {
//         try {
//           const credential = await navigator.credentials.get({
//             publicKey: {
//               challenge: new Uint8Array(32),
//               timeout: 60000,
//               userVerification: "required",
//             },
//           });
//           if (credential) {
//             fingerprintTemplate = credential.id;
//           }
//         } catch (e) {
//           console.log("WebAuthn bypassed or canceled, using hardware fallback");
//         }
//       }

//       const payload = {
//         method: "FINGERPRINT",
//         type: actionType,
//         fingerprint_template: fingerprintTemplate,
//         latitude: location.lat,
//         longitude: location.lng,
//       };

//       const response = await api.post("api/v2/access/biometric/verify-clock/", payload);

//       setMessage({ type: "success", text: response.data.message });
//       setLastAttendance({
//         nama: response.data.nama_lengkap,
//         nik: response.data.nik_karyawan,
//         waktu: new Date().toLocaleTimeString(),
//         type: actionType === "IN" ? "Clock-In (Masuk)" : "Clock-Out (Pulang)",
//       });
//     } catch (err) {
//       const errDetail = err.response?.data?.detail || "Verifikasi sidik jari gagal.";
//       setMessage({ type: "error", text: errDetail });
//     } finally {
//       setScanning(false);
//     }
//   };

//   return (
//     <div style={styles.pageContainer}>
//       <div style={styles.card}>
//         <h2 style={styles.title}>Presensi Biometrik HRIS</h2>
//         <p style={styles.subtitle}>Verifikasi Wajah & Sidik Jari Karyawan</p>

//         {/* WEBCAM FEED */}
//         <div style={styles.videoWrapper}>
//           <video ref={videoRef} autoPlay playsInline muted style={styles.video} />
//           {!cameraActive && (
//             <div style={styles.videoOverlay}>Memuat Kamera...</div>
//           )}
//         </div>

//         {/* GEOLOCATION INFORMATION */}
//         <div style={styles.locationBadge}>
//           📍 GPS:{" "}
//           {location.lat && location.lng
//             ? `${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}`
//             : location.error || "Mencari Lokasi..."}
//         </div>

//         {/* NOTIFIKASI RESPONSE */}
//         {message.text && (
//           <div
//             style={{
//               ...styles.alert,
//               ...(message.type === "error"
//                 ? styles.alertError
//                 : message.type === "success"
//                 ? styles.alertSuccess
//                 : styles.alertInfo),
//             }}
//           >
//             {message.text}
//           </div>
//         )}

//         {/* LAST ATTENDANCE BRIEF */}
//         {lastAttendance && (
//           <div style={styles.lastAttendanceBox}>
//             <strong>Karyawan Dikenali:</strong> {lastAttendance.nama} ({lastAttendance.nik})<br />
//             <strong>Status:</strong> {lastAttendance.type} pada {lastAttendance.waktu}
//           </div>
//         )}

//         {/* BUTTON ACTIONS */}
//         <div style={styles.buttonGrid}>
//           <button
//             disabled={scanning}
//             onClick={() => handleFaceClock("IN")}
//             style={{ ...styles.btn, backgroundColor: "#16a34a" }}
//           >
//             {scanning ? "Memproses..." : "📸 Clock-In (Wajah)"}
//           </button>

//           <button
//             disabled={scanning}
//             onClick={() => handleFaceClock("OUT")}
//             style={{ ...styles.btn, backgroundColor: "#dc2626" }}
//           >
//             {scanning ? "Memproses..." : "📸 Clock-Out (Wajah)"}
//           </button>

//           <button
//             disabled={scanning}
//             onClick={() => handleFingerprintClock("IN")}
//             style={{ ...styles.btn, backgroundColor: "#2563eb", gridColumn: "span 2" }}
//           >
//             {scanning ? "Memproses..." : "👆 Clock-In / Out via Sidik Jari"}
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// // ==============================
// // STYLES
// // ==============================
// const styles = {
//   pageContainer: {
//     display: "flex",
//     justifyContent: "center",
//     alignItems: "center",
//     padding: "20px",
//     background: "#f1f5f9",
//     minHeight: "85vh",
//   },
//   card: {
//     background: "#ffffff",
//     padding: "30px",
//     borderRadius: "12px",
//     boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
//     maxWidth: "500px",
//     width: "100%",
//     textAlign: "center",
//   },
//   title: {
//     margin: "0 0 5px 0",
//     color: "#0f172a",
//     fontSize: "22px",
//   },
//   subtitle: {
//     margin: "0 0 20px 0",
//     color: "#64748b",
//     fontSize: "14px",
//   },
//   videoWrapper: {
//     position: "relative",
//     width: "100%",
//     height: "300px",
//     backgroundColor: "#000",
//     borderRadius: "10px",
//     overflow: "hidden",
//     marginBottom: "15px",
//   },
//   video: {
//     width: "100%",
//     height: "100%",
//     objectFit: "cover",
//   },
//   videoOverlay: {
//     position: "absolute",
//     inset: 0,
//     display: "flex",
//     justifyContent: "center",
//     alignItems: "center",
//     color: "#fff",
//     background: "rgba(0,0,0,0.6)",
//   },
//   locationBadge: {
//     fontSize: "12px",
//     color: "#475569",
//     background: "#f8fafc",
//     padding: "6px 12px",
//     borderRadius: "20px",
//     display: "inline-block",
//     marginBottom: "15px",
//     border: "1px solid #e2e8f0",
//   },
//   alert: {
//     padding: "12px",
//     borderRadius: "8px",
//     fontSize: "14px",
//     fontWeight: "bold",
//     marginBottom: "15px",
//   },
//   alertSuccess: { background: "#dcfce7", color: "#166534" },
//   alertError: { background: "#fee2e2", color: "#991b1b" },
//   alertInfo: { background: "#e0f2fe", color: "#075985" },
//   lastAttendanceBox: {
//     background: "#f0fdf4",
//     border: "1px solid #bbf7d0",
//     padding: "10px",
//     borderRadius: "8px",
//     fontSize: "13px",
//     color: "#166534",
//     marginBottom: "15px",
//     textAlign: "left",
//   },
//   buttonGrid: {
//     display: "grid",
//     gridTemplateColumns: "1fr 1fr",
//     gap: "10px",
//   },
//   btn: {
//     padding: "12px",
//     border: "none",
//     borderRadius: "6px",
//     color: "#fff",
//     fontWeight: "bold",
//     fontSize: "14px",
//     cursor: "pointer",
//     transition: "opacity 0.2s",
//   },
// };

// export default AttendancePages;