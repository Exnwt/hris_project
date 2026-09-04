import React, { useState, useEffect } from "react";
import api from "../api"; // Custom Axios Instance

const AttendancePage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const fetchAttendance = async () => {
    setLoading(true);
    setError("");
    try {
      let url = "/api/v2/access/Attendance-Logs/";
      const params = new URLSearchParams();
      if (startDate) params.append("start_date", startDate);
      if (endDate) params.append("end_date", endDate);

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const res = await api.get(url);
      const data = res.data.results || res.data || [];
      console.log("Fetched attendance logs:", data);
      setLogs(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Gagal memuat absensi:", err);
      setError("Gagal mengambil data log absensi dari server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [startDate, endDate]);

  const filteredLogs = logs.filter((item) => {
    const name = item.employee_name || "";
    const nik = item.employee_nik || "";
    const dept = item.department_name || "";
    const query = searchQuery.toLowerCase();

    return (
      name.toLowerCase().includes(query) ||
      nik.toLowerCase().includes(query) ||
      dept.toLowerCase().includes(query)
    );
  });

  const formatDateTime = (isoString) => {
    if (!isoString) return "-";
    const date = new Date(isoString);
    return date.toLocaleString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  return (
    <div style={containerStyle}>
      {/* HEADER */}
      <div style={headerStyle}>
        <div>
          <h2 style={{ margin: 0, color: "#0f172a" }}>Log Absensi Mesin ZKTeco</h2>
          <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: "14px" }}>
            Riwayat pindaian biometrik karyawan yang terintegrasi langsung dari mesin ZK
          </p>
        </div>
        <button onClick={fetchAttendance} style={refreshButtonStyle}>
          🔄 Refresh Absensi
        </button>
      </div>

      {/* FILTER BAR */}
      <div style={filterBarStyle}>
        <input
          type="text"
          placeholder="Cari Nama, NIK, atau Departemen..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={inputSearchStyle}
        />
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <label style={{ fontSize: "12px", fontWeight: "bold", color: "#475569" }}>Mulai:</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            style={inputDateStyle}
          />
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <label style={{ fontSize: "12px", fontWeight: "bold", color: "#475569" }}>Sampai:</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            style={inputDateStyle}
          />
        </div>
      </div>

      {error && <div style={errorBannerStyle}>{error}</div>}

      {/* TABLE DATA */}
      <div style={tableWrapperStyle}>
        <table style={tableStyle}>
          <thead>
            <tr style={tableHeaderRowStyle}>
              <th style={thStyle}>Waktu Absen</th>
              <th style={thStyle}>Karyawan</th>
              <th style={thStyle}>NIK</th>
              <th style={thStyle}>Departemen</th>
              <th style={thStyle}>Tipe Pindaian</th>
              <th style={thStyle}>Serial Mesin ZK</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" style={emptyTdStyle}>Memuat data pindaian biometrik...</td>
              </tr>
            ) : filteredLogs.length === 0 ? (
              <tr>
                <td colSpan="6" style={emptyTdStyle}>Tidak ada data log absensi ditemukan.</td>
              </tr>
            ) : (
              filteredLogs.map((log) => (
                console.log("Rendering log:", log) ||
                <tr key={log.id} style={tableBodyRowStyle}>
                  <td style={tdStyle}>
                    <strong style={{ color: "#0f172a" }}>{formatDateTime(log.timestamp)}</strong>
                  </td>
                  <td style={tdStyle}>
                    <strong>{log.employee_name || "-"}</strong>
                  </td>
                  <td style={tdStyle}>{log.employee_nik || "-"}</td>
                  <td style={tdStyle}>{log.department_name || "-"}</td>
                  <td style={tdStyle}>
                    <span
                      style={{
                        ...badgeStyle,
                        background: log.check_type === "I" ? "#dcfce7" : "#fee2e2",
                        color: log.check_type === "I" ? "#15803d" : "#b91c1c",
                      }}
                    >
                      {log.check_type === "I" ? "MASUK (Check In)" : "KELUAR (Check Out)"}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    <code style={{ background: "#f1f5f9", padding: "2px 6px", borderRadius: "4px" }}>
                      {log.sn_device || "ZK-LOCAL"}
                    </code>
                  </td>
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
const containerStyle = { background: "#ffffff", padding: "24px", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", fontFamily: "Arial, sans-serif" };
const headerStyle = { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" };
const refreshButtonStyle = { padding: "8px 16px", background: "#2563eb", color: "#ffffff", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "13px" };
const filterBarStyle = { display: "flex", gap: "12px", marginBottom: "20px", flexWrap: "wrap", alignItems: "center" };
const inputSearchStyle = { flex: 1, minWidth: "200px", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "14px" };
const inputDateStyle = { padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "14px" };
const errorBannerStyle = { padding: "12px", background: "#fee2e2", color: "#b91c1c", borderRadius: "6px", marginBottom: "15px", fontSize: "14px" };
const tableWrapperStyle = { overflowX: "auto", border: "1px solid #e2e8f0", borderRadius: "8px" };
const tableStyle = { width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "14px" };
const tableHeaderRowStyle = { background: "#f8fafc", borderBottom: "2px solid #e2e8f0" };
const thStyle = { padding: "12px 16px", color: "#475569", fontWeight: "bold" };
const tableBodyRowStyle = { borderBottom: "1px solid #f1f5f9" };
const tdStyle = { padding: "12px 16px", color: "#334155", verticalAlign: "middle" };
const emptyTdStyle = { padding: "30px", textAlign: "center", color: "#94a3b8" };
const badgeStyle = { display: "inline-block", padding: "4px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: "bold" };

export default AttendancePage;