import React, { useState, useEffect } from "react";
import api from "../api";

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

  const initialForm = {
    name: "",
    code_name: "",
    start_time: "", // HH:mm
    interval_value: 5,
    interval_type: "minutes",
    description: "",
    is_active: true,
  };

  const [formData, setFormData] = useState(initialForm);

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
        start_time: item.start_time ? item.start_time.substring(0, 5) : "",
        interval_value: item.interval_value || 5,
        interval_type: item.interval_type || "minutes",
        description: item.description || "",
        is_active: item.is_active ?? true,
      });
    } else {
      setFormData(initialForm);
    }
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...formData,
        start_time: formData.start_time === "" ? null : formData.start_time,
      };

      if (editItem) {
        await api.put(`${BASE_URL}${editItem.id}/`, payload);
        alert("Cronjob berhasil diperbarui!");
      } else {
        await api.post(BASE_URL, payload);
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
        return <span className="badge badge-success">SUCCESS</span>;
      case "FAILED":
        return <span className="badge" style={{ background: "#fee2e2", color: "#b91c1c" }}>FAILED</span>;
      case "RUNNING":
        return <span className="badge" style={{ background: "#e0f2fe", color: "#0369a1" }}>RUNNING...</span>;
      default:
        return <span className="badge badge-default">IDLE</span>;
    }
  };

  const renderScheduleText = (row) => {
    const typeLabel = { minutes: "Menit", hours: "Jam", days: "Hari" };
    const label = typeLabel[row.interval_type] || "Waktu";
    let text = `Setiap ${row.interval_value} ${label}`;
    if (row.start_time) {
      text += ` (Mulai ${row.start_time.substring(0, 5)})`;
    }
    return text;
  };

  return (
    <div className="page-container">
      {/* HEADER */}
      <div className="page-header">
        <div>
          <h2>Cronjob & Scheduled Tasks</h2>
          <p style={{ color: "#64748b", fontSize: "14px", marginTop: "4px" }}>
            Monitor dan atur eksekusi jadwal tugas otomatis (seperti sync ZKTeco & Rekap Absensi)
          </p>
        </div>
        <div className="page-header-actions">
          <button onClick={fetchCronjobs} className="btn btn-secondary">🔄 Refresh</button>
          <button onClick={() => handleOpenModal()} className="btn btn-primary">+ Tambah Task Baru</button>
        </div>
      </div>

      {/* STAT CARDS */}
      <div className="stats-grid">
        <div className="stat-card-box">
          <span className="stat-card-title">Total Tasks</span>
          <span className="stat-card-number">{cronjobs.length}</span>
        </div>
        <div className="stat-card-box">
          <span className="stat-card-title">Task Aktif</span>
          <span className="stat-card-number" style={{ color: "#16a34a" }}>
            {cronjobs.filter((c) => c.is_active).length}
          </span>
        </div>
        <div className="stat-card-box">
          <span className="stat-card-title">Gagal (Last Run)</span>
          <span className="stat-card-number" style={{ color: "#dc2626" }}>
            {cronjobs.filter((c) => c.last_status === "FAILED").length}
          </span>
        </div>
      </div>

      {/* FILTER BAR */}
      <div style={{ marginBottom: "20px" }}>
        <input
          type="text"
          placeholder="Cari Nama Task atau Code Name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="input-control"
          style={{ maxWidth: "400px" }}
        />
      </div>

      {error && <div className="error-banner">{error}</div>}

      {/* TABLE */}
      <div className="table-wrapper">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Nama Task</th>
              <th>Code Command</th>
              <th>Jadwal Otomatis</th>
              <th>Status Terakhir</th>
              <th>Eksekusi Terakhir</th>
              <th>Status</th>
              <th style={{ textAlign: "center" }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" style={{ textAlign: "center", padding: "30px", color: "#94a3b8" }}>
                  Memuat data task cronjob...
                </td>
              </tr>
            ) : filteredData.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: "center", padding: "30px", color: "#94a3b8" }}>
                  Tidak ada task cronjob ditemukan.
                </td>
              </tr>
            ) : (
              filteredData.map((row) => (
                <tr key={row.id}>
                  <td>
                    <strong>{row.name}</strong>
                  </td>
                  <td>
                    <code style={{ background: "#f1f5f9", padding: "4px 8px", borderRadius: "4px", fontSize: "12px", color: "#2563eb" }}>
                      {row.code_name}
                    </code>
                  </td>
                  <td>
                    <span className="badge" style={{ background: "#fef3c7", color: "#b45309", fontFamily: "monospace" }}>
                      {renderScheduleText(row)}
                    </span>
                  </td>
                  <td>{getStatusBadge(row.last_status)}</td>
                  <td>
                    {row.last_run ? new Date(row.last_run).toLocaleString("id-ID") : "-"}
                  </td>
                  <td>
                    <span style={{ color: row.is_active ? "#16a34a" : "#94a3b8", fontWeight: "bold" }}>
                      {row.is_active ? "● Active" : "○ Inactive"}
                    </span>
                  </td>
                  <td style={{ textAlign: "center" }}>
                    <div className="action-group">
                      <button
                        onClick={() => handleRunNow(row.id)}
                        disabled={executingId === row.id}
                        className="btn btn-secondary"
                        style={{ background: "#dcfce7", color: "#15803d", borderColor: "#86efac" }}
                      >
                        {executingId === row.id ? "Running..." : "🚀 Run"}
                      </button>
                      <button onClick={() => showLogModal(row)} className="btn btn-action-view">
                        Logs
                      </button>
                      <button onClick={() => handleOpenModal(row)} className="btn btn-action-view">
                        Edit
                      </button>
                      <button onClick={() => handleDelete(row.id)} className="btn btn-action-delete">
                        Hapus
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL FORM CREATE/EDIT */}
      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: "550px" }}>
            <div className="page-header" style={{ marginBottom: "16px" }}>
              <h3 style={{ margin: 0, color: "#0f172a" }}>
                {editItem ? "Edit Cronjob Task" : "Tambah Cronjob Task"}
              </h3>
              <button type="button" onClick={() => setModalOpen(false)} className="btn-close-modal">✕</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div>
                  <label className="form-label">Nama Task *</label>
                  <input
                    type="text"
                    placeholder="misal: Sync Absensi ZKTeco"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input-control"
                    required
                  />
                </div>

                <div>
                  <label className="form-label">Code Command (Django Command) *</label>
                  <input
                    type="text"
                    placeholder="misal: sync_zkteco_attendance"
                    value={formData.code_name}
                    onChange={(e) => setFormData({ ...formData, code_name: e.target.value })}
                    className="input-control"
                    required
                  />
                </div>

                {/* KONFIGURASI JADWAL BARU */}
                <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                  <h4 style={{ margin: "0 0 12px 0", fontSize: "14px", color: "#334155" }}>Konfigurasi Jadwal (Schedule)</h4>
                  
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
                    <div>
                      <label className="form-label">Mulai Dari Jam (Opsional)</label>
                      <input
                        type="time"
                        value={formData.start_time}
                        onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                        className="input-control"
                      />
                    </div>
                    <div>
                      <label className="form-label">Nilai Interval *</label>
                      <input
                        type="number"
                        min="1"
                        value={formData.interval_value}
                        onChange={(e) => setFormData({ ...formData, interval_value: parseInt(e.target.value) })}
                        className="input-control"
                        required
                      />
                    </div>
                  </div>

                  <label className="form-label">Satuan Waktu Interval *</label>
                  <select
                    value={formData.interval_type}
                    onChange={(e) => setFormData({ ...formData, interval_type: e.target.value })}
                    className="input-control"
                    required
                  >
                    <option value="minutes">Menit</option>
                    <option value="hours">Jam</option>
                    <option value="days">Hari</option>
                  </select>
                </div>

                <div>
                  <label className="form-label">Deskripsi (Opsional)</label>
                  <textarea
                    rows="2"
                    placeholder="Deskripsi singkat fungsi cronjob ini..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="input-control"
                  />
                </div>

                <label className="form-label" style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", marginTop: "8px" }}>
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    style={{ width: "16px", height: "16px", cursor: "pointer" }}
                  />
                  Aktifkan Jadwal Cronjob Ini
                </label>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "24px", paddingTop: "16px", borderTop: "1px solid #e2e8f0" }}>
                <button type="button" onClick={() => setModalOpen(false)} className="btn btn-cancel">Batal</button>
                <button type="submit" disabled={loading} className="btn btn-primary">
                  {loading ? "Menyimpan..." : "Simpan Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL LOG OUTPUT */}
      {logModalOpen && selectedLog && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: "650px" }}>
            <div className="page-header" style={{ marginBottom: "16px" }}>
              <h3 style={{ margin: 0, color: "#0f172a" }}>Log Output: {selectedLog.name}</h3>
              <button onClick={() => setLogModalOpen(false)} className="btn-close-modal">✕</button>
            </div>
            
            <p style={{ fontSize: "13px", color: "#64748b", marginBottom: "12px" }}>
              Status: {getStatusBadge(selectedLog.last_status)} | Eksekusi Terakhir: {selectedLog.last_run ? new Date(selectedLog.last_run).toLocaleString("id-ID") : "-"}
            </p>
            
            {/* Terminal Style Log Area (Tetap inline karena ini spesifik UI console) */}
            <pre style={{ 
              background: "#0f172a", 
              color: "#38bdf8", 
              padding: "16px", 
              borderRadius: "8px", 
              maxHeight: "350px", 
              overflowY: "auto", 
              fontSize: "13px", 
              fontFamily: "monospace", 
              whiteSpace: "pre-wrap",
              border: "1px solid #334155"
            }}>
              {selectedLog.last_message || "Belum ada log eksekusi pada task ini."}
            </pre>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "20px", paddingTop: "12px", borderTop: "1px solid #e2e8f0" }}>
              <button onClick={() => setLogModalOpen(false)} className="btn btn-cancel">Tutup Log</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CronjobPage;