import React, { useState, useEffect } from "react";
import api from "../api"; // Instance axios Anda

const CronjobPage = () => {
  const [cronjobs, setCronjobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [executingId, setExecutingId] = useState(null);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [logModalOpen, setLogModalOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);
  const [editItem, setEditItem] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    code_name: "",
    schedule: "*/5 * * * *",
    description: "",
    is_active: true,
  });

  const BASE_URL = "api/v2/system/cronjobs/";

  useEffect(() => {
    fetchCronjobs();
  }, []);

  const fetchCronjobs = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get(BASE_URL);
      const data = res.data.results || res.data || [];
      setCronjobs(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Gagal memuat cronjob:", err);
      setError("Gagal memuat daftar Cronjob.");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (item = null) => {
    setEditItem(item);
    if (item) {
      setFormData({
        name: item.name || "",
        code_name: item.code_name || "",
        schedule: item.schedule || "",
        description: item.description || "",
        is_active: item.is_active ?? true,
      });
    } else {
      setFormData({
        name: "",
        code_name: "",
        schedule: "*/5 * * * *",
        description: "",
        is_active: true,
      });
    }
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editItem) {
        await api.put(`${BASE_URL}${editItem.id}/`, formData);
        alert("Cronjob berhasil diperbarui!");
      } else {
        await api.post(BASE_URL, formData);
        alert("Cronjob baru berhasil ditambahkan!");
      }
      setModalOpen(false);
      fetchCronjobs();
    } catch (err) {
      alert("Gagal menyimpan Cronjob.");
    } finally {
      setLoading(false);
    }
  };

  const handleRunNow = async (id) => {
    setExecutingId(id);
    try {
      const res = await api.post(`${BASE_URL}${id}/run-now/`);
      alert(`Eksekusi Selesai:\nStatus: ${res.data.status}\nOutput: ${res.data.output}`);
      fetchCronjobs();
    } catch (err) {
      alert("Gagal mengeksekusi Cronjob.");
    } finally {
      setExecutingId(null);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus Cronjob ini?")) return;
    try {
      await api.delete(`${BASE_URL}${id}/`);
      alert("Cronjob berhasil dihapus!");
      fetchCronjobs();
    } catch (err) {
      alert("Gagal menghapus Cronjob.");
    }
  };

  const showLogModal = (item) => {
    setSelectedLog(item);
    setLogModalOpen(true);
  };

  const filteredData = cronjobs.filter((item) =>
    (item.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.code_name || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status) => {
    switch (status) {
      case "SUCCESS":
        return <span style={{ ...badgeStyle, background: "#dcfce7", color: "#15803d" }}>SUCCESS</span>;
      case "FAILED":
        return <span style={{ ...badgeStyle, background: "#fee2e2", color: "#b91c1c" }}>FAILED</span>;
      case "RUNNING":
        return <span style={{ ...badgeStyle, background: "#e0f2fe", color: "#0369a1" }}>RUNNING...</span>;
      default:
        return <span style={{ ...badgeStyle, background: "#f1f5f9", color: "#475569" }}>IDLE</span>;
    }
  };

  return (
    <div style={containerStyle}>
      {/* HEADER */}
      <div style={headerStyle}>
        <div>
          <h2 style={{ margin: 0, color: "#0f172a" }}>Cronjob & Scheduled Tasks</h2>
          <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: "14px" }}>
            Monitor dan atur eksekusi jadwal tugas otomatis (seperti sync ZKTeco & Rekap Absensi)
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button onClick={fetchCronjobs} style={refreshButtonStyle}>🔄 Refresh</button>
          <button onClick={() => handleOpenModal()} style={primaryButtonStyle}>+ Tambah Task Baru</button>
        </div>
      </div>

      {/* STAT CARDS */}
      <div style={statsContainerStyle}>
        <div style={statCardStyle}>
          <span style={statTitleStyle}>Total Tasks</span>
          <span style={statNumberStyle}>{cronjobs.length}</span>
        </div>
        <div style={statCardStyle}>
          <span style={statTitleStyle}>Task Aktif</span>
          <span style={{ ...statNumberStyle, color: "#16a34a" }}>
            {cronjobs.filter((c) => c.is_active).length}
          </span>
        </div>
        <div style={statCardStyle}>
          <span style={statTitleStyle}>Gagal (Last Run)</span>
          <span style={{ ...statNumberStyle, color: "#dc2626" }}>
            {cronjobs.filter((c) => c.last_status === "FAILED").length}
          </span>
        </div>
      </div>

      {/* FILTER BAR */}
      <div style={filterBarStyle}>
        <input
          type="text"
          placeholder="Cari Nama Task atau Code Name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={inputSearchStyle}
        />
      </div>

      {error && <div style={errorBannerStyle}>{error}</div>}

      {/* TABLE */}
      <div style={tableWrapperStyle}>
        <table style={tableStyle}>
          <thead>
            <tr style={tableHeaderRowStyle}>
              <th style={thStyle}>Nama Task</th>
              <th style={thStyle}>Code Command</th>
              <th style={thStyle}>Jadwal Cron</th>
              <th style={thStyle}>Status Terakhir</th>
              <th style={thStyle}>Eksekusi Terakhir</th>
              <th style={thStyle}>Status Task</th>
              <th style={{ ...thStyle, textAlign: "center" }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" style={emptyTdStyle}>Memuat data task cronjob...</td>
              </tr>
            ) : filteredData.length === 0 ? (
              <tr>
                <td colSpan="7" style={emptyTdStyle}>Tidak ada task cronjob ditemukan.</td>
              </tr>
            ) : (
              filteredData.map((row) => (
                <tr key={row.id} style={tableBodyRowStyle}>
                  <td style={tdStyle}>
                    <strong style={{ color: "#0f172a" }}>{row.name}</strong>
                    {row.description && (
                      <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#64748b" }}>{row.description}</p>
                    )}
                  </td>
                  <td style={tdStyle}>
                    <code style={codeStyle}>{row.code_name}</code>
                  </td>
                  <td style={tdStyle}>
                    <span style={badgeCronStyle}>{row.schedule}</span>
                  </td>
                  <td style={tdStyle}>{getStatusBadge(row.last_status)}</td>
                  <td style={tdStyle}>
                    {row.last_run ? new Date(row.last_run).toLocaleString("id-ID") : "-"}
                  </td>
                  <td style={tdStyle}>
                    <span style={{ color: row.is_active ? "#16a34a" : "#94a3b8", fontWeight: "bold" }}>
                      {row.is_active ? "● Active" : "○ Inactive"}
                    </span>
                  </td>
                  <td style={{ ...tdStyle, textAlign: "center" }}>
                    <button
                      onClick={() => handleRunNow(row.id)}
                      disabled={executingId === row.id}
                      style={btnRunStyle}
                    >
                      {executingId === row.id ? "Running..." : "🚀 Run"}
                    </button>{" "}
                    <button onClick={() => showLogModal(row)} style={actionButtonStyle}>Logs</button>{" "}
                    <button onClick={() => handleOpenModal(row)} style={actionButtonStyle}>Edit</button>{" "}
                    <button onClick={() => handleDelete(row.id)} style={actionDeleteStyle}>Hapus</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL FORM CREATE/EDIT */}
      {modalOpen && (
        <div style={overlayStyle}>
          <div style={modalBoxStyle}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "15px" }}>
              <h3 style={{ margin: 0 }}>{editItem ? "Edit Cronjob Task" : "Tambah Cronjob Task"}</h3>
              <button onClick={() => setModalOpen(false)} style={closeModalBtnStyle}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <label style={labelStyle}>Nama Task *</label>
              <input
                type="text"
                placeholder="misal: Sync Absensi ZKTeco"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                style={inputStyle}
                required
              />

              <label style={labelStyle}>Code Command (Django Command) *</label>
              <input
                type="text"
                placeholder="misal: sync_zkteco_attendance"
                value={formData.code_name}
                onChange={(e) => setFormData({ ...formData, code_name: e.target.value })}
                style={inputStyle}
                required
              />

              <label style={labelStyle}>Jadwal Cron Expression *</label>
              <input
                type="text"
                placeholder="*/5 * * * * (Setiap 5 menit)"
                value={formData.schedule}
                onChange={(e) => setFormData({ ...formData, schedule: e.target.value })}
                style={inputStyle}
                required
              />

              <label style={labelStyle}>Deskripsi</label>
              <textarea
                rows="3"
                placeholder="Deskripsi singkat fungsi cronjob ini..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                style={{ ...inputStyle, width: "100%", boxSizing: "border-box" }}
              />

              <label style={{ ...labelStyle, display: "flex", alignItems: "center", gap: "8px", marginTop: "10px" }}>
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                />
                Aktifkan Jadwal Cronjob
              </label>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "20px" }}>
                <button type="button" onClick={() => setModalOpen(false)} style={cancelButtonStyle}>Batal</button>
                <button type="submit" disabled={loading} style={primaryButtonStyle}>
                  {loading ? "Menyimpan..." : "Simpan Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL LOG OUTPUT */}
      {logModalOpen && selectedLog && (
        <div style={overlayStyle}>
          <div style={{ ...modalBoxStyle, width: "650px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "15px" }}>
              <h3 style={{ margin: 0 }}>Log Output: {selectedLog.name}</h3>
              <button onClick={() => setLogModalOpen(false)} style={closeModalBtnStyle}>✕</button>
            </div>
            <p style={{ fontSize: "13px", color: "#64748b" }}>
              Status: {getStatusBadge(selectedLog.last_status)} | Eksekusi Terakhir: {selectedLog.last_run ? new Date(selectedLog.last_run).toLocaleString("id-ID") : "-"}
            </p>
            <pre style={logOutputConsoleStyle}>
              {selectedLog.last_message || "Belum ada log eksekusi."}
            </pre>
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "15px" }}>
              <button onClick={() => setLogModalOpen(false)} style={cancelButtonStyle}>Tutup Log</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ==========================================
// STYLES
// ==========================================
const containerStyle = { background: "#ffffff", padding: "24px", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", fontFamily: "Arial, sans-serif" };
const headerStyle = { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" };
const refreshButtonStyle = { padding: "8px 16px", background: "#f1f5f9", color: "#334155", border: "1px solid #cbd5e1", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "13px" };
const primaryButtonStyle = { padding: "8px 16px", background: "#2563eb", color: "#ffffff", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "13px" };
const cancelButtonStyle = { padding: "8px 16px", background: "#64748b", color: "#ffffff", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "13px" };
const btnRunStyle = { padding: "5px 10px", background: "#dcfce7", color: "#15803d", border: "1px solid #86efac", borderRadius: "4px", cursor: "pointer", fontSize: "12px", fontWeight: "bold" };
const actionButtonStyle = { padding: "5px 10px", background: "#f1f5f9", color: "#334155", border: "1px solid #cbd5e1", borderRadius: "4px", cursor: "pointer", fontSize: "12px" };
const actionDeleteStyle = { padding: "5px 10px", background: "#fee2e2", color: "#b91c1c", border: "1px solid #fca5a5", borderRadius: "4px", cursor: "pointer", fontSize: "12px" };
const statsContainerStyle = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "15px", marginBottom: "20px" };
const statCardStyle = { background: "#f8fafc", padding: "16px", borderRadius: "8px", border: "1px solid #e2e8f0", display: "flex", flexDirection: "column" };
const statTitleStyle = { fontSize: "12px", color: "#64748b", fontWeight: "bold" };
const statNumberStyle = { fontSize: "22px", fontWeight: "bold", marginTop: "5px", color: "#0f172a" };
const filterBarStyle = { display: "flex", gap: "12px", marginBottom: "20px" };
const inputSearchStyle = { width: "100%", padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "14px" };
const inputStyle = { width: "100%", padding: "8px 12px", marginBottom: "12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px", boxSizing: "border-box" };
const errorBannerStyle = { padding: "12px", background: "#fee2e2", color: "#b91c1c", borderRadius: "6px", marginBottom: "15px", fontSize: "14px" };
const tableWrapperStyle = { overflowX: "auto", border: "1px solid #e2e8f0", borderRadius: "8px" };
const tableStyle = { width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "14px" };
const tableHeaderRowStyle = { background: "#f8fafc", borderBottom: "2px solid #e2e8f0" };
const thStyle = { padding: "12px 16px", color: "#475569", fontWeight: "bold" };
const tableBodyRowStyle = { borderBottom: "1px solid #f1f5f9" };
const tdStyle = { padding: "12px 16px", color: "#334155", verticalAlign: "middle" };
const emptyTdStyle = { padding: "30px", textAlign: "center", color: "#94a3b8" };
const badgeStyle = { display: "inline-block", padding: "4px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: "bold" };
const badgeCronStyle = { background: "#fef3c7", color: "#b45309", padding: "3px 8px", borderRadius: "4px", fontSize: "12px", fontFamily: "monospace", fontWeight: "bold" };
const codeStyle = { background: "#f1f5f9", padding: "2px 6px", borderRadius: "4px", fontSize: "12px", color: "#2563eb" };
const labelStyle = { display: "block", fontSize: "12px", fontWeight: "bold", color: "#475569", marginBottom: "4px" };
const overlayStyle = { position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 100 };
const modalBoxStyle = { background: "#fff", padding: "24px", borderRadius: "12px", width: "450px", maxWidth: "90%", maxHeight: "90vh", overflowY: "auto" };
const closeModalBtnStyle = { background: "transparent", border: "none", fontSize: "18px", cursor: "pointer", color: "#64748b" };
const logOutputConsoleStyle = { background: "#0f172a", color: "#38bdf8", padding: "15px", borderRadius: "8px", maxHeight: "300px", overflowY: "auto", fontSize: "12px", fontFamily: "monospace" };

export default CronjobPage;