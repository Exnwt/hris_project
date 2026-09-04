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