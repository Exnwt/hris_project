import React, { useState, useEffect } from "react";
import api from "../api";
import { StatCard } from "../components/StatisticCard_component";
import { usePermissions } from "../auth/auth";

const AttendancePage = () => {
  const { hasAccess, loadingPermissions } = usePermissions();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Options Master Data untuk Dropdown Filter
  const [departments, setDepartments] = useState([]);
  const [positions, setPositions] = useState([]);
  const [employees, setEmployees] = useState([]);

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDept, setSelectedDept] = useState("");
  const [selectedPos, setSelectedPos] = useState("");
  const [selectedEmp, setSelectedEmp] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const BASE_URL = "/api/v2/access/attendanceLogs/";

  // ==========================================
  // FETCH DATA UTAMA & DROPDOWN OPTIONS
  // ==========================================
  useEffect(() => {
    fetchOptions();
    fetchAttendance();
  }, [startDate, endDate]);

  const fetchOptions = async () => {
    try {
      const [deptRes, posRes, empRes] = await Promise.all([
        api.get("/api/v1/master-data/Department/").catch(() => ({ data: [] })),
        api.get("/api/v1/master-data/Position/").catch(() => ({ data: [] })),
        api.get("/api/v1/master-data/Employees/").catch(() => ({ data: [] })),
      ]);

      setDepartments(deptRes.data.results || deptRes.data || []);
      setPositions(posRes.data.results || posRes.data || []);
      setEmployees(empRes.data.results || empRes.data || []);
    } catch (err) {
      console.error("Gagal mengambil data master opsi filter:", err);
    }
  };

  const fetchAttendance = async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (startDate) params.append("start_date", startDate);
      if (endDate) params.append("end_date", endDate);

      const res = await api.get(BASE_URL);
      console.log('resss',res)
      const data = res.data.results || res.data || [];
      setLogs(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Gagal memuat log absensi:", err);
      setError("Gagal mengambil data log absensi biometrik dari server.");
    } finally {
      setLoading(false);
    }
  };

  // Helper Ambil Nilai (Utamakan dari Relasi DB Local, Fallback ke raw_payload BioTime ZK)
  const getLogDetails = (log) => {
    const raw = log.raw_payload || {};

    // 1. Employee Name & NIK
    const empName =
      log.employee_name ||
      log.employee?.name ||
      log.employee?.nama_lengkap ||
      `${raw.first_name || ""} ${raw.last_name || ""}`.trim() ||
      "Karyawan Tanpa Nama";

    const empNik = log.employee_nik || log.employee?.nik || raw.emp_code || "-";

    // 2. Department Name
    const deptName =
      log.department_name ||
      log.employee?.department?.name ||
      raw.department ||
      "-";

    // 3. Position Name
    const posName =
      log.position_name ||
      log.employee?.position?.name ||
      raw.position ||
      "-";

    // 4. Punch State / Tipe Absen
    let punchStateDisplay = raw.punch_state_display || "";
    if (!punchStateDisplay) {
      switch (log.check_type) {
        case "I":
          punchStateDisplay = "Check In";
          break;
        case "O":
          punchStateDisplay = "Check Out";
          break;
        case "1":
          punchStateDisplay = "Overtime In";
          break;
        case "2":
          punchStateDisplay = "Overtime Out";
          break;
        default:
          punchStateDisplay = log.check_type || "Check In";
      }
    }

    return { empName, empNik, deptName, posName, punchStateDisplay };
  };

  // Filter Data di Sisi Client
  const filteredLogs = logs.filter((log) => {
    const { empName, empNik, deptName, posName } = getLogDetails(log);
    const query = searchQuery.toLowerCase();

    const matchesSearch =
      empName.toLowerCase().includes(query) ||
      empNik.toLowerCase().includes(query) ||
      deptName.toLowerCase().includes(query) ||
      posName.toLowerCase().includes(query);

    const matchesDept = selectedDept ? deptName === selectedDept : true;
    const matchesPos = selectedPos ? posName === selectedPos : true;
    const matchesEmp = selectedEmp ? String(log.employee || empNik) === selectedEmp : true;

    return matchesSearch && matchesDept && matchesPos && matchesEmp;
  });

  const formatDateTime = (isoString) => {
    if (!isoString) return "-";
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString;
    return date.toLocaleString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedDept("");
    setSelectedPos("");
    setSelectedEmp("");
    setStartDate("");
    setEndDate("");
  };

  // Statistik Quick View
  const totalLogs = logs.length;
  const checkInCount = logs.filter(
    (l) => l.check_type === "I" || l.raw_payload?.punch_state_display === "Check In"
  ).length;
  const checkOutCount = logs.filter(
    (l) => l.check_type === "O" || l.raw_payload?.punch_state_display === "Check Out"
  ).length;

  return (
    <div style={containerStyle}>
      {/* HEADER */}
      <div style={headerStyle}>
        <div>
          <h2 style={{ margin: 0, color: "#0f172a" }}>Log Absensi Mesin ZKTeco</h2>
          <p style={{ margin: "5px 0 0", color: "#64748b", fontSize: "14px" }}>
            Riwayat pindaian biometrik karyawan yang terintegrasi langsung dari BioTime ZKTeco
          </p>
        </div>
        <button onClick={fetchAttendance} style={refreshButtonStyle}>
          🔄 Refresh Absensi
        </button>
      </div>

      {/* STATISTIC CARDS */}
      <div style={statsContainerStyle}>
        <StatCard title="Total Pindaian" count={totalLogs} isActive={true} />
        <StatCard title="Masuk (Check In)" count={checkInCount} color="#16a34a" bgColor="#f0fdf4" borderColor="#bbf7d0" />
        <StatCard title="Keluar (Check Out)" count={checkOutCount} color="#dc2626" bgColor="#fef2f2" borderColor="#fecaca" />
      </div>

      {/* MULTI-FILTER BAR */}
      <div style={filterContainerStyle}>
        <input
          type="text"
          placeholder="Cari Nama, NIK, Dept, atau Jabatan..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={inputSearchStyle}
        />

        {/* Filter Employee */}
        <select
          value={selectedEmp}
          onChange={(e) => setSelectedEmp(e.target.value)}
          style={selectStyle}
        >
          <option value="">-- Semua Karyawan --</option>
          {employees.map((emp) => (
            <option key={emp.id} value={emp.id}>
              {emp.nik ? `${emp.nik} - ` : ""}{emp.name || emp.nama_lengkap}
            </option>
          ))}
        </select>

        {/* Filter Department */}
        <select
          value={selectedDept}
          onChange={(e) => setSelectedDept(e.target.value)}
          style={selectStyle}
        >
          <option value="">-- Semua Departemen --</option>
          {departments.map((dept) => (
            <option key={dept.id} value={dept.name}>
              {dept.name}
            </option>
          ))}
        </select>

        {/* Filter Position */}
        <select
          value={selectedPos}
          onChange={(e) => setSelectedPos(e.target.value)}
          style={selectStyle}
        >
          <option value="">-- Semua Position --</option>
          {positions.map((pos) => (
            <option key={pos.id} value={pos.name}>
              {pos.name}
            </option>
          ))}
        </select>

        {/* Start Date */}
        <div style={dateGroupStyle}>
          <label style={labelStyle}>Mulai:</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            style={inputDateStyle}
          />
        </div>

        {/* End Date */}
        <div style={dateGroupStyle}>
          <label style={labelStyle}>Sampai:</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            style={inputDateStyle}
          />
        </div>

        <button onClick={handleResetFilters} style={clearFilterButtonStyle}>
          Reset Filter
        </button>
      </div>

      {error && <div style={errorBannerStyle}>{error}</div>}

      {/* TABLE DATA */}
      <div style={tableWrapperStyle}>
        <table style={tableStyle}>
          <thead>
            <tr style={tableHeaderRowStyle}>
              <th style={{ ...thStyle, width: "60px" }}>No</th>
              <th style={thStyle}>Waktu Absen</th>
              <th style={thStyle}>Karyawan</th>
              <th style={thStyle}>Departemen</th>
              <th style={thStyle}>Position / Jabatan</th>
              <th style={{ ...thStyle, textAlign: "center" }}>Tipe Absen</th>
              <th style={thStyle}>SN Mesin ZK</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" style={emptyTdStyle}>Memuat data pindaian biometrik...</td>
              </tr>
            ) : filteredLogs.length === 0 ? (
              <tr>
                <td colSpan="7" style={emptyTdStyle}>Tidak ada data log absensi ditemukan.</td>
              </tr>
            ) : (
              filteredLogs.map((log, index) => {
                const { empName, empNik, deptName, posName, punchStateDisplay } = getLogDetails(log);
                const isCheckIn =
                  log.check_type === "I" ||
                  punchStateDisplay.toLowerCase().includes("in");

                return (
                  <tr key={log.id || index} style={tableBodyRowStyle}>
                    <td style={tdStyle}>{index + 1}</td>
                    <td style={tdStyle}>
                      <strong style={{ color: "#0f172a" }}>
                        {formatDateTime(log.timestamp || log.raw_payload?.punch_time)}
                      </strong>
                    </td>
                    <td style={tdStyle}>
                      <div>
                        <strong>{empName}</strong>
                      </div>
                      <small style={{ color: "#64748b", fontSize: "12px" }}>
                        NIK: {empNik}
                      </small>
                    </td>
                    <td style={tdStyle}>{deptName}</td>
                    <td style={tdStyle}>{posName}</td>
                    <td style={{ ...tdStyle, textAlign: "center" }}>
                      <span
                        style={{
                          ...badgeStyle,
                          background: isCheckIn ? "#dcfce7" : "#fee2e2",
                          color: isCheckIn ? "#15803d" : "#b91c1c",
                        }}
                      >
                        {punchStateDisplay.toUpperCase()}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <code style={codeBadgeStyle}>
                        {log.sn_device || log.raw_payload?.terminal_sn || "ZK-LOCAL"}
                      </code>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ==========================================
// STYLES (Identik dengan DepartmentPage)
// ==========================================
const containerStyle = { background: "#ffffff", padding: "24px", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", fontFamily: "Arial, sans-serif" };
const headerStyle = { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" };
const refreshButtonStyle = { padding: "8px 16px", background: "#f1f5f9", color: "#334155", border: "1px solid #cbd5e1", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "13px" };
const clearFilterButtonStyle = { padding: "8px 16px", background: "#ef4444", color: "#ffffff", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "13px" };
const statsContainerStyle = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "15px", marginBottom: "20px" };
const filterContainerStyle = { display: "flex", gap: "10px", marginBottom: "20px", flexWrap: "wrap", alignItems: "center" };
const inputSearchStyle = { flex: "1 1 200px", minWidth: "180px", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "13px" };
const selectStyle = { padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "13px", background: "#ffffff", cursor: "pointer", color: "#334155" };
const dateGroupStyle = { display: "flex", gap: "6px", alignItems: "center" };
const inputDateStyle = { padding: "7px 10px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "13px", color: "#334155" };
const labelStyle = { fontSize: "12px", fontWeight: "bold", color: "#475569" };
const errorBannerStyle = { padding: "12px", background: "#fee2e2", color: "#b91c1c", borderRadius: "6px", marginBottom: "15px", fontSize: "14px" };
const tableWrapperStyle = { overflowX: "auto", border: "1px solid #e2e8f0", borderRadius: "8px" };
const tableStyle = { width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "14px" };
const tableHeaderRowStyle = { background: "#f8fafc", borderBottom: "2px solid #e2e8f0" };
const thStyle = { padding: "12px 16px", color: "#475569", fontWeight: "bold" };
const tableBodyRowStyle = { borderBottom: "1px solid #f1f5f9" };
const tdStyle = { padding: "12px 16px", color: "#334155", verticalAlign: "middle" };
const emptyTdStyle = { padding: "30px", textAlign: "center", color: "#94a3b8" };
const badgeStyle = { display: "inline-block", padding: "4px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: "bold" };
const codeBadgeStyle = { background: "#f1f5f9", padding: "4px 8px", borderRadius: "4px", fontSize: "12px", color: "#0f172a", fontFamily: "monospace" };

export default AttendancePage;