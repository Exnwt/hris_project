import React, { useState, useEffect } from "react";
import api from "../api";
import { StatCard } from "../components/StatisticCard_component";
import { usePermissions } from "../auth/auth";
import "../styles/AttendancePage.css"; 

const AttendancePage = () => {
  const { hasAccess, loadingPermissions } = usePermissions();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [departments, setDepartments] = useState([]);
  const [positions, setPositions] = useState([]);
  const [employees, setEmployees] = useState([]);

  const [statFilter, setStatFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10); 
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

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
      if (pageSize !== "all") params.append("page", page);
      if (startDate) params.append("start_date", startDate);
      if (endDate) params.append("end_date", endDate);

      const res = await api.get(`${BASE_URL}?${params.toString()}`);
      const rawData = res.data;

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
      }
    } catch (err) {
      setError("Gagal mengambil data log absensi biometrik dari server.");
    } finally {
      setLoading(false);
    }
  };

  // ==============================================================
  // HELPER PARSING LOGIC & PENENTUAN STATUS "TIDAK TER-LINK"
  // ==============================================================
  const getLogDetails = (log) => {
    const raw = log.raw_payload || {};
    
    // 1. Cek Karyawan Terlink
    let isEmpLinked = false;
    if (log.is_linked !== undefined) {
      isEmpLinked = log.is_linked === true;
    } else {
      isEmpLinked = log.employee !== null && log.employee !== "" && log.employee !== 0 && log.employee !== "null";
    }
    
    // Ekstraksi Data
    const empName = isEmpLinked 
      ? (log.employee_name || "Tanpa Nama") 
      : (`${raw.first_name || ""} ${raw.last_name || ""}`.trim() || log.employee_name || "Data Mesin Tanpa Nama");
    const empNik = isEmpLinked ? (log.employee_nik || "-") : (raw.emp_code || log.raw_uid || "-");

    const deptName = isEmpLinked ? (log.department_name || "-") : (raw.department?.dept_name || raw.department || log.department_name || "-");
    const posName = isEmpLinked ? (log.position_name || "-") : (raw.position?.position_name || raw.position || log.position_name || "-");
    const areaName = raw.area?.area_name || raw.area || "-"; 

    // 2. Cek Departemen & Posisi Terlink (Mencocokkan string dengan Master Data)
    const isDeptLinked = deptName !== "-" && departments.some(d => String(d.name || "").toLowerCase() === String(deptName).toLowerCase());
    const isPosLinked = posName !== "-" && positions.some(p => String(p.name || "").toLowerCase() === String(posName).toLowerCase());

    // Tipe Pindaian
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
    
    return { empName, empNik, deptName, posName, areaName, punchStateDisplay, isCheckIn, isEmpLinked, isDeptLinked, isPosLinked };
  };

  const filteredLogs = logs.filter((log) => {
    const { empName, empNik, deptName, posName, isCheckIn } = getLogDetails(log);
    const query = searchQuery.toLowerCase();

    if (statFilter === "IN" && !isCheckIn) return false;
    if (statFilter === "OUT" && isCheckIn) return false;

    const matchesSearch =
      empName.toLowerCase().includes(query) ||
      empNik.toLowerCase().includes(query) ||
      String(deptName).toLowerCase().includes(query) ||
      String(posName).toLowerCase().includes(query);

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
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit", second: "2-digit",
    });
  };

  const handleResetFilters = () => {
    setSearchQuery(""); setSelectedDept(""); setSelectedPos("");
    setSelectedEmp(""); setStartDate(""); setEndDate("");
    setStatFilter("ALL"); setPage(1);
  };

  const totalLogsOnPage = logs.length;
  const checkInCount = logs.filter((l) => getLogDetails(l).isCheckIn).length;
  const checkOutCount = totalLogsOnPage - checkInCount;

  return (
    <div className="att-container">
      <div className="att-header">
        <div>
          <h2>Log Absensi Mesin ZKTeco</h2>
          <p>Riwayat pindaian biometrik karyawan terintegrasi BioTime ZKTeco</p>
        </div>
        <button onClick={fetchAttendance} className="att-btn att-btn-refresh">🔄 Refresh Absensi</button>
      </div>

      <div className="att-stats-container">
        <div onClick={() => setStatFilter("ALL")} className="att-stat-card-wrapper" style={{ border: statFilter === "ALL" ? "2px solid #2563eb" : "1px solid #e2e8f0" }}>
          <StatCard title="Total Pindaian (Klik All)" count={totalLogsOnPage} isActive={statFilter === "ALL"} />
        </div>
        <div onClick={() => setStatFilter("IN")} className="att-stat-card-wrapper" style={{ border: statFilter === "IN" ? "2px solid #16a34a" : "1px solid #e2e8f0" }}>
          <StatCard title="Masuk (Klik Check In)" count={checkInCount} color="#16a34a" bgColor="#f0fdf4" borderColor="#bbf7d0" />
        </div>
        <div onClick={() => setStatFilter("OUT")} className="att-stat-card-wrapper" style={{ border: statFilter === "OUT" ? "2px solid #dc2626" : "1px solid #e2e8f0" }}>
          <StatCard title="Keluar (Klik Check Out)" count={checkOutCount} color="#dc2626" bgColor="#fef2f2" borderColor="#fecaca" />
        </div>
      </div>

      <div className="att-filter-container">
        <input type="text" placeholder="Cari Nama, NIK, Dept..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="att-input att-input-search" />
        
        <select value={selectedEmp} onChange={(e) => setSelectedEmp(e.target.value)} className="att-input">
          <option value="">-- Semua Karyawan --</option>
          {employees.map((emp) => (<option key={emp.id} value={emp.id}>{emp.nik_karyawan ? `${emp.nik_karyawan} - ` : ""}{emp.name || emp.nama_lengkap}</option>))}
        </select>
        
        <select value={selectedDept} onChange={(e) => setSelectedDept(e.target.value)} className="att-input">
          <option value="">-- Semua Departemen --</option>
          {departments.map((dept) => (<option key={dept.id} value={dept.name}>{dept.name}</option>))}
        </select>

        <div className="att-date-group">
          <label className="att-label">Mulai:</label>
          <input type="date" value={startDate} onChange={(e) => { setStartDate(e.target.value); setPage(1); }} className="att-input" />
        </div>
        <div className="att-date-group">
          <label className="att-label">Sampai:</label>
          <input type="date" value={endDate} onChange={(e) => { setEndDate(e.target.value); setPage(1); }} className="att-input" />
        </div>
        <button onClick={handleResetFilters} className="att-btn att-btn-clear">Reset Filter</button>
      </div>

      {error && <div className="att-error-banner">{error}</div>}

      <div className="att-table-wrapper">
        <table className="att-table">
          <thead>
            <tr>
              <th style={{ width: "60px" }}>No</th>
              <th>Waktu Absen</th>
              <th>Karyawan</th>
              <th>Departemen</th>
              <th>Position / Jabatan</th>
              <th>Area</th>
              <th style={{ textAlign: "center" }}>Tipe Absen</th>
              <th>SN Mesin ZK</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="8" className="att-empty-td">Memuat data pindaian biometrik...</td></tr>
            ) : filteredLogs.length === 0 ? (
              <tr><td colSpan="8" className="att-empty-td">Tidak ada data log absensi ditemukan.</td></tr>
            ) : (
              filteredLogs.map((log, index) => {
                const { empName, empNik, deptName, posName, areaName, punchStateDisplay, isCheckIn, isEmpLinked, isDeptLinked, isPosLinked } = getLogDetails(log);
                const rowNo = pageSize === "all" ? index + 1 : (page - 1) * pageSize + index + 1;

                return (
                  <tr key={log.id || index}>
                    <td>{rowNo}</td>
                    <td>
                      <strong style={{ color: "#0f172a" }}>{formatDateTime(log.timestamp || log.raw_payload?.punch_time)}</strong>
                    </td>
                    
                    {/* KOLOM KARYAWAN */}
                    <td>
                      <div><strong>{empName}</strong></div>
                      <small style={{ color: "#64748b", fontSize: "12px" }}>NIK / ID: {empNik}</small>
                      {!isEmpLinked && (
                        <div><span className="att-badge-unlinked">⚠️ Karyawan Tidak Ter-link</span></div>
                      )}
                    </td>

                    {/* KOLOM DEPARTEMEN */}
                    <td>
                      <div>{deptName}</div>
                      {!isDeptLinked && (
                        <div className="att-badge-unlinked">
                          ⚠️ {deptName === "-" ? "Dept Belum Diset" : "Dept Tidak Dikenali Sistem"}
                        </div>
                      )}
                    </td>

                    {/* KOLOM POSITION / JABATAN */}
                    <td>
                      <div>{posName}</div>
                      {!isPosLinked && (
                        <div className="att-badge-unlinked">
                          ⚠️ {posName === "-" ? "Posisi Belum Diset" : "Posisi Tidak Dikenali Sistem"}
                        </div>
                      )}
                    </td>

                    {/* KOLOM AREA */}
                    <td>
                      <div>{areaName}</div>
                    </td>

                    {/* KOLOM TIPE ABSEN */}
                    <td style={{ textAlign: "center" }}>
                      <span className="att-badge" style={{ background: isCheckIn ? "#dcfce7" : "#fee2e2", color: isCheckIn ? "#15803d" : "#b91c1c" }}>
                        {punchStateDisplay.toUpperCase()}
                      </span>
                    </td>

                    {/* KOLOM SN MESIN */}
                    <td>
                      <code className="att-code-badge">{log.sn_device || log.raw_payload?.terminal_sn || "ZK-LOCAL"}</code>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* PAGINATION */}
      <div className="att-pagination-wrapper">
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "13px", color: "#64748b" }}>Tampilkan per halaman:</span>
          <select value={pageSize} onChange={(e) => { setPageSize(e.target.value === "all" ? "all" : Number(e.target.value)); setPage(1); }} className="att-input">
            <option value={10}>10 Baris</option><option value={20}>20 Baris</option><option value={50}>50 Baris</option>
            <option value={100}>100 Baris</option><option value="all">Semua Data (Tanpa Batas)</option>
          </select>
          <span style={{ fontSize: "13px", color: "#64748b" }}>Total Database: <strong>{totalRecords}</strong> data</span>
        </div>

        {pageSize !== "all" && (
          <div className="att-pagination-controls">
            <button onClick={() => setPage((p) => Math.max(p - 1, 1))} disabled={page === 1 || loading} className="att-page-btn">← Prev</button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              let pageNum = i + 1;
              if (totalPages > 5 && page > 3) {
                pageNum = page - 3 + i;
                if (pageNum > totalPages) pageNum = totalPages - (4 - i);
              }
              return (
                <button key={pageNum} onClick={() => setPage(pageNum)} className={`att-page-btn ${page === pageNum ? "active" : ""}`}>
                  {pageNum}
                </button>
              );
            })}
            <button onClick={() => setPage((p) => Math.min(p + 1, totalPages))} disabled={page >= totalPages || loading} className="att-page-btn">Next →</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AttendancePage;