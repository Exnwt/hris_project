import React, { useState, useEffect } from "react";
import api from "../api";
import { StatCard } from "../components/StatisticCard_component";
import { usePermissions } from "../auth/auth";

const AttendancePage = () => {
  const { hasAccess, loadingPermissions } = usePermissions();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Options Master Data
  const [departments, setDepartments] = useState([]);
  const [positions, setPositions] = useState([]);
  const [employees, setEmployees] = useState([]);

  // Filter StatCard Click ('ALL' | 'IN' | 'OUT')
  const [statFilter, setStatFilter] = useState("ALL");

  // Server-side Pagination & Filter States ('all' / number)
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10); 
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Client-side Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDept, setSelectedDept] = useState("");
  const [selectedPos, setSelectedPos] = useState("");
  const [selectedEmp, setSelectedEmp] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const BASE_URL = "/api/v2/access/attendanceLogs/";

  useEffect(() => {
    fetchOptions();
  }, []);

  useEffect(() => {
    fetchAttendance();
  }, [page, pageSize, startDate, endDate]);

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
      params.append("page_size", pageSize);
      if (pageSize !== "all") {
        params.append("page", page);
      }
      if (startDate) params.append("start_date", startDate);
      if (endDate) params.append("end_date", endDate);

      const res = await api.get(`${BASE_URL}?${params.toString()}`);
      const rawData = res.data;

      // Handling jika backend mengembalikan Paginated Array vs Unpaginated Array (page_size=all)
      if (Array.isArray(rawData)) {
        setLogs(rawData);
        setTotalRecords(rawData.length);
        setTotalPages(1);
      } else if (rawData.results) {
        setLogs(rawData.results);
        setTotalRecords(rawData.count || 0);
        setTotalPages(pageSize === "all" ? 1 : Math.ceil((rawData.count || 0) / Number(pageSize)));
      } else {
        setLogs([]);
        setTotalRecords(0);
        setTotalPages(1);
      }
    } catch (err) {
      console.error("Gagal memuat log absensi:", err);
      setError("Gagal mengambil data log absensi biometrik dari server.");
    } finally {
      setLoading(false);
    }
  };

  // Helper Extract Details Data Log
  const getLogDetails = (log) => {
    const raw = log.raw_payload || {};

    const empName =
      log.employee_name ||
      log.employee?.name ||
      log.employee?.nama_lengkap ||
      `${raw.first_name || ""} ${raw.last_name || ""}`.trim() ||
      "Karyawan Tanpa Nama";

    const empNik = log.employee_nik || log.employee?.nik || raw.emp_code || "-";
    const deptName = log.department_name || log.employee?.department?.name || raw.department || "-";
    const posName = log.position_name || log.employee?.position?.name || raw.position || "-";

    let punchStateDisplay = raw.punch_state_display || "";
    if (!punchStateDisplay) {
      switch (log.check_type) {
        case "I": punchStateDisplay = "Check In"; break;
        case "O": punchStateDisplay = "Check Out"; break;
        case "1": punchStateDisplay = "Overtime In"; break;
        case "2": punchStateDisplay = "Overtime Out"; break;
        default: punchStateDisplay = log.check_type || "Check In";
      }
    }

    const isCheckIn = log.check_type === "I" || punchStateDisplay.toLowerCase().includes("in");

    return { empName, empNik, deptName, posName, punchStateDisplay, isCheckIn };
  };

  // Client Side Filtering
  const filteredLogs = logs.filter((log) => {
    const { empName, empNik, deptName, posName, isCheckIn } = getLogDetails(log);
    const query = searchQuery.toLowerCase();

    // 1. StatCard Click Filter
    if (statFilter === "IN" && !isCheckIn) return false;
    if (statFilter === "OUT" && isCheckIn) return false;

    // 2. Search Text Query Filter
    const matchesSearch =
      empName.toLowerCase().includes(query) ||
      empNik.toLowerCase().includes(query) ||
      deptName.toLowerCase().includes(query) ||
      posName.toLowerCase().includes(query);

    // 3. Dropdown Filters
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
    setStatFilter("ALL");
    setPage(1);
  };

  const handlePageSizeChange = (e) => {
    const val = e.target.value;
    setPageSize(val === "all" ? "all" : Number(val));
    setPage(1);
  };

  // Stats Card Numbers
  const totalLogsOnPage = logs.length;
  const checkInCount = logs.filter((l) => getLogDetails(l).isCheckIn).length;
  const checkOutCount = totalLogsOnPage - checkInCount;

  return (
    <div style={containerStyle}>
      {/* HEADER */}
      <div style={headerStyle}>
        <div>
          <h2 style={{ margin: 0, color: "#0f172a" }}>Log Absensi Mesin ZKTeco</h2>
          <p style={{ margin: "5px 0 0", color: "#64748b", fontSize: "14px" }}>
            Riwayat pindaian biometrik karyawan terintegrasi BioTime ZKTeco
          </p>
        </div>
        <button onClick={fetchAttendance} style={refreshButtonStyle}>
          🔄 Refresh Absensi
        </button>
      </div>

      {/* CLICKABLE STATISTIC CARDS */}
      <div style={statsContainerStyle}>
        <div
          onClick={() => setStatFilter("ALL")}
          style={{
            cursor: "pointer",
            border: statFilter === "ALL" ? "2px solid #2563eb" : "1px solid #e2e8f0",
            borderRadius: "8px",
            transition: "all 0.2s ease",
          }}
        >
          <StatCard title="Total Pindaian (Klik All)" count={totalLogsOnPage} isActive={statFilter === "ALL"} />
        </div>

        <div
          onClick={() => setStatFilter("IN")}
          style={{
            cursor: "pointer",
            border: statFilter === "IN" ? "2px solid #16a34a" : "1px solid #e2e8f0",
            borderRadius: "8px",
            transition: "all 0.2s ease",
          }}
        >
          <StatCard title="Masuk (Klik Check In)" count={checkInCount} color="#16a34a" bgColor="#f0fdf4" borderColor="#bbf7d0" />
        </div>

        <div
          onClick={() => setStatFilter("OUT")}
          style={{
            cursor: "pointer",
            border: statFilter === "OUT" ? "2px solid #dc2626" : "1px solid #e2e8f0",
            borderRadius: "8px",
            transition: "all 0.2s ease",
          }}
        >
          <StatCard title="Keluar (Klik Check Out)" count={checkOutCount} color="#dc2626" bgColor="#fef2f2" borderColor="#fecaca" />
        </div>
      </div>

      {/* MULTI-FILTER BAR */}
      <div style={filterContainerStyle}>
        <input
          type="text"
          placeholder="Cari Nama, NIK, Dept, Jabatan..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={inputSearchStyle}
        />

        <select value={selectedEmp} onChange={(e) => setSelectedEmp(e.target.value)} style={selectStyle}>
          <option value="">-- Semua Karyawan --</option>
          {employees.map((emp) => (
            <option key={emp.id} value={emp.id}>
              {emp.nik ? `${emp.nik} - ` : ""}{emp.name || emp.nama_lengkap}
            </option>
          ))}
        </select>

        <select value={selectedDept} onChange={(e) => setSelectedDept(e.target.value)} style={selectStyle}>
          <option value="">-- Semua Departemen --</option>
          {departments.map((dept) => (
            <option key={dept.id} value={dept.name}>{dept.name}</option>
          ))}
        </select>

        <select value={selectedPos} onChange={(e) => setSelectedPos(e.target.value)} style={selectStyle}>
          <option value="">-- Semua Position --</option>
          {positions.map((pos) => (
            <option key={pos.id} value={pos.name}>{pos.name}</option>
          ))}
        </select>

        <div style={dateGroupStyle}>
          <label style={labelStyle}>Mulai:</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
            style={inputDateStyle}
          />
        </div>

        <div style={dateGroupStyle}>
          <label style={labelStyle}>Sampai:</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
            style={inputDateStyle}
          />
        </div>

        <button onClick={handleResetFilters} style={clearFilterButtonStyle}>
          Reset Filter
        </button>
      </div>

      {error && <div style={errorBannerStyle}>{error}</div>}

      {/* TABLE DATA WITH INTERNAL SCROLLBAR */}
      <div style={scrollableTableWrapperStyle}>
        <table style={tableStyle}>
          <thead>
            <tr style={stickyHeaderRowStyle}>
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
                const { empName, empNik, deptName, posName, punchStateDisplay, isCheckIn } = getLogDetails(log);
                const rowNo = pageSize === "all" ? index + 1 : (page - 1) * pageSize + index + 1;

                return (
                  <tr key={log.id || index} style={tableBodyRowStyle}>
                    <td style={tdStyle}>{rowNo}</td>
                    <td style={tdStyle}>
                      <strong style={{ color: "#0f172a" }}>
                        {formatDateTime(log.timestamp || log.raw_payload?.punch_time)}
                      </strong>
                    </td>
                    <td style={tdStyle}>
                      <div><strong>{empName}</strong></div>
                      <small style={{ color: "#64748b", fontSize: "12px" }}>NIK: {empNik}</small>
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

      {/* PAGINATION CONTROL BAR */}
      <div style={paginationWrapperStyle}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "13px", color: "#64748b" }}>Tampilkan per halaman:</span>
          <select value={pageSize} onChange={handlePageSizeChange} style={pageSizeSelectStyle}>
            <option value={10}>10 Baris</option>
            <option value={20}>20 Baris</option>
            <option value={50}>50 Baris</option>
            <option value={100}>100 Baris</option>
            <option value="all">Semua Data (Tanpa Batas)</option>
          </select>
          <span style={{ fontSize: "13px", color: "#64748b" }}>
            Total Database: <strong>{totalRecords}</strong> data
          </span>
        </div>

        {/* Tampilkan kontrol tombol halaman hanya jika bukan mode 'all' */}
        {pageSize !== "all" && (
          <div style={{ display: "flex", gap: "5px", alignItems: "center" }}>
            <button
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page === 1 || loading}
              style={{ ...paginationBtnStyle, opacity: page === 1 ? 0.5 : 1 }}
            >
              ← Prev
            </button>

            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              let pageNum = i + 1;
              if (totalPages > 5 && page > 3) {
                pageNum = page - 3 + i;
                if (pageNum > totalPages) pageNum = totalPages - (4 - i);
              }
              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  style={{
                    ...paginationBtnStyle,
                    background: page === pageNum ? "#2563eb" : "#ffffff",
                    color: page === pageNum ? "#ffffff" : "#334155",
                    fontWeight: page === pageNum ? "bold" : "normal",
                  }}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              disabled={page >= totalPages || loading}
              style={{ ...paginationBtnStyle, opacity: page >= totalPages ? 0.5 : 1 }}
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// ==========================================
// STYLES
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
const scrollableTableWrapperStyle = { maxHeight: "550px", overflowY: "auto", overflowX: "auto", border: "1px solid #e2e8f0", borderRadius: "8px" };
const tableStyle = { width: "100%", borderCollapse: "separate", borderSpacing: 0, textAlign: "left", fontSize: "14px" };
const stickyHeaderRowStyle = { background: "#f8fafc", position: "sticky", top: 0, zIndex: 10, boxShadow: "0 1px 2px rgba(0,0,0,0.05)" };
const thStyle = { padding: "12px 16px", color: "#475569", fontWeight: "bold", borderBottom: "2px solid #e2e8f0", background: "#f8fafc" };
const tableBodyRowStyle = { borderBottom: "1px solid #f1f5f9" };
const tdStyle = { padding: "12px 16px", color: "#334155", verticalAlign: "middle", borderBottom: "1px solid #f1f5f9" };
const emptyTdStyle = { padding: "30px", textAlign: "center", color: "#94a3b8" };
const badgeStyle = { display: "inline-block", padding: "4px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: "bold" };
const codeBadgeStyle = { background: "#f1f5f9", padding: "4px 8px", borderRadius: "4px", fontSize: "12px", color: "#0f172a", fontFamily: "monospace" };
const paginationWrapperStyle = { display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "20px", flexWrap: "wrap", gap: "15px" };
const pageSizeSelectStyle = { padding: "6px 10px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "13px", background: "#fff", cursor: "pointer" };
const paginationBtnStyle = { padding: "6px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "13px", background: "#ffffff", cursor: "pointer", color: "#334155" };

export default AttendancePage;