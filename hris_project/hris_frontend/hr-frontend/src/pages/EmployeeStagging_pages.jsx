import React, { useState, useEffect } from "react";
import api from "../api";
import { StatCard } from "../components/StatisticCard_component";

const EmployeeEditStagingPage = () => {
  const [userPermissions, setUserPermissions] = useState({
    isSuperuser: false,
    allowedCodenames: [],
  });
  const [stagings, setStagings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingPermissions, setLoadingPermissions] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [selectedStaging, setSelectedStaging] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const BASE_URL = "/api/v1/master-data/employee-stagging";

  useEffect(() => {
    fetchPermissions();
    fetchStagings();
  }, []);

  const fetchPermissions = async () => {
    try {
      const response = await api.get("api/v2/access/my-permissions/");
      setUserPermissions({
        isSuperuser: response.data.is_superuser,
        allowedCodenames: response.data.allowed_codenames || [],
      });
    } catch (error) {
      console.error("Gagal mengambil permission user:", error);
    } finally {
      setLoadingPermissions(false);
    }
  };

  const hasAccess = (codename) => {
    if (userPermissions.isSuperuser) return true;
    if (userPermissions.allowedCodenames.includes("*")) return true;
    return userPermissions.allowedCodenames.includes(codename);
  };

  const fetchStagings = async () => {
    setLoading(true);
    try {
      const response = await api.get(`${BASE_URL}/`);
      const data = Array.isArray(response.data)
        ? response.data
        : response.data.results || [];
      setStagings(data);
    } catch (err) {
      console.error("Gagal mengambil data staging:", err);
      alert("Gagal memuat data staging edit karyawan.");
    } finally {
      setLoading(false);
    }
  };

  // Kalkulasi statistik data
  const stats = {
    total: stagings.length,
    draft: stagings.filter((s) => s.status === "draft").length,
    progress: stagings.filter((s) => ["pending", "progress"].includes(s.status)).length,
    approved: stagings.filter((s) => s.status === "approved").length,
    rejected: stagings.filter((s) => s.status === "rejected").length,
  };

  // Logic Filtering Tab Data
  const filteredStagings = stagings.filter((item) => {
    if (activeTab === "draft") return item.status === "draft";
    if (activeTab === "progress") return ["pending", "progress"].includes(item.status);
    if (activeTab === "approved") return item.status === "approved";
    if (activeTab === "rejected") return item.status === "rejected";
    return true;
  });

  const handleProcess = async (id) => {
    if (!window.confirm("Tandai pengajuan ini dalam proses peninjauan (Progress)?")) return;
    setActionLoading(true);
    try {
      await api.post(`${BASE_URL}/${id}/approve/`, {
        action: "CHECK",
      });
      alert("Status berhasil diperbarui ke Progress!");
      fetchStagings();
      if (selectedStaging) setSelectedStaging(null);
    } catch (err) {
      alert(err.response?.data?.detail || "Gagal memperbarui status.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprove = async (id) => {
    if (!window.confirm("Apakah Anda yakin ingin menyetujui perubahan data ini? Data utama karyawan akan langsung diperbarui.")) return;
    setActionLoading(true);
    try {
      await api.post(`${BASE_URL}/${id}/approve/`, {
        action: "APPROVE",
      });
      alert("Pengajuan berhasil disetujui (Approved)!");
      fetchStagings();
      setSelectedStaging(null);
    } catch (err) {
      alert(err.response?.data?.detail || "Gagal menyetujui pengajuan.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectSubmit = async () => {
    if (!rejectionReason.trim()) {
      alert("Harap masukkan alasan penolakan!");
      return;
    }
    setActionLoading(true);
    try {
      await api.post(`${BASE_URL}/${selectedStaging.id}/approve/`, {
        action: "REJECT",
        reason: rejectionReason,
      });
      alert("Pengajuan berhasil ditolak.");
      setShowRejectModal(false);
      setRejectionReason("");
      setSelectedStaging(null);
      fetchStagings();
    } catch (err) {
      alert(err.response?.data?.detail || "Gagal menolak pengajuan.");
    } finally {
      setActionLoading(false);
    }
  };

  const renderStatusBadge = (status) => {
    const badges = {
      draft: <span className="badge badge-default">DRAFT</span>,
      pending: <span className="badge" style={{ backgroundColor: "#fef3c7", color: "#92400e" }}>PENDING</span>,
      progress: <span className="badge" style={{ backgroundColor: "#dbeafe", color: "#1e40af" }}>PROGRESS</span>,
      approved: <span className="badge badge-success">APPROVED</span>,
      rejected: <span className="badge" style={{ backgroundColor: "#fee2e2", color: "#991b1b" }}>REJECTED</span>,
    };
    return badges[status] || <span className="badge badge-default">{status}</span>;
  };

  return (
    <div className="page-container">
      {/* HEADER */}
      <div className="page-header">
        <div>
          <h2>Persetujuan Perubahan Data Karyawan</h2>
          <p style={{ color: "#64748b", fontSize: "14px", marginTop: "4px" }}>
            Kelola dan tinjau riwayat permohonan edit data karyawan (<em>Maker-Checker Staging</em>).
          </p>
        </div>
        <div className="page-header-actions">
          <button onClick={fetchStagings} className="btn btn-secondary">
            🔄 Refresh Data
          </button>
        </div>
      </div>

      {/* 1. STAT CARDS INTERAKTIF (KLIK UNTUK FILTER) */}
      <div className="stats-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "15px", marginBottom: "20px" }}>
        <StatCard
          title="Total Pengajuan"
          count={stats.total}
          isActive={activeTab === "all"}
          onClick={() => setActiveTab("all")}
          color="#0f172a"
        />
        <StatCard
          title="Draft"
          count={stats.draft}
          isActive={activeTab === "draft"}
          onClick={() => setActiveTab("draft")}
          color="#64748b"
        />
        <StatCard
          title="In Progress"
          count={stats.progress}
          isActive={activeTab === "progress"}
          onClick={() => setActiveTab("progress")}
          color="#2563eb"
          bgColor={activeTab === "progress" ? "#eff6ff" : undefined}
          borderColor="#93c5fd"
        />
        <StatCard
          title="Disetujui"
          count={stats.approved}
          isActive={activeTab === "approved"}
          onClick={() => setActiveTab("approved")}
          color="#16a34a"
          bgColor={activeTab === "approved" ? "#f0fdf4" : undefined}
          borderColor="#bbf7d0"
        />
        <StatCard
          title="Ditolak"
          count={stats.rejected}
          isActive={activeTab === "rejected"}
          onClick={() => setActiveTab("rejected")}
          color="#dc2626"
          bgColor={activeTab === "rejected" ? "#fef2f2" : undefined}
          borderColor="#fca5a5"
        />
      </div>

      {/* 2. FILTER TABS */}
      <div style={{ display: "flex", gap: "8px", borderBottom: "1px solid #e2e8f0", marginBottom: "20px" }}>
        {[
          { key: "all", label: "Semua" },
          { key: "draft", label: "Draft" },
          { key: "progress", label: "In Progress" },
          { key: "approved", label: "Disetujui" },
          { key: "rejected", label: "Ditolak" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: "8px 16px",
              fontWeight: activeTab === tab.key ? "bold" : "500",
              fontSize: "14px",
              border: "none",
              backgroundColor: "transparent",
              cursor: "pointer",
              borderBottom: activeTab === tab.key ? "2px solid #2563eb" : "none",
              color: activeTab === tab.key ? "#2563eb" : "#64748b",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 3. TABLE STAGINGS LIST */}
      <div className="table-wrapper">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Tanggal</th>
              <th>Nama Karyawan</th>
              <th>NIK Karyawan</th>
              <th>Pemohon</th>
              <th>Status</th>
              <th style={{ textAlign: "center" }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" style={{ textAlign: "center", padding: "30px", color: "#94a3b8" }}>
                  Memuat data staging...
                </td>
              </tr>
            ) : filteredStagings.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: "center", padding: "30px", color: "#94a3b8" }}>
                  Tidak ada data pengajuan perubahan data.
                </td>
              </tr>
            ) : (
              filteredStagings.map((item) => (
                <tr key={item.id}>
                  <td>{new Date(item.created_at).toLocaleDateString("id-ID")}</td>
                  <td><strong>{item.nama_lengkap}</strong></td>
                  <td><strong style={{ color: "#2563eb" }}>{item.nik_karyawan || "-"}</strong></td>
                  <td>{item.requested_by_name || item.requested_by || "User"}</td>
                  <td>{renderStatusBadge(item.status)}</td>
                  <td style={{ textAlign: "center" }}>
                    <button
                      onClick={() => setSelectedStaging(item)}
                      className="btn btn-action-view"
                    >
                      Tinjau Perubahan
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 4. MODAL DETAIL KOMPARASI (BEFORE VS AFTER) */}
      {selectedStaging && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: "680px" }}>
            <div className="page-header" style={{ marginBottom: "12px" }}>
              <h3>Detail Perubahan: {selectedStaging.nama_lengkap}</h3>
              <button onClick={() => setSelectedStaging(null)} className="btn-close-modal">✕</button>
            </div>

            <div style={{ marginBottom: "16px", fontSize: "13px" }}>
              <div style={{ marginBottom: "8px" }}>Status Saat Ini: {renderStatusBadge(selectedStaging.status)}</div>

              {/* ALASAN PENGAJUAN EDIT */}
              <div style={{ marginTop: "8px", color: "#1e40af", backgroundColor: "#eff6ff", padding: "12px", borderRadius: "6px", border: "1px solid #bfdbfe" }}>
                <strong>📌 Alasan Perubahan (Edit Reason):</strong>
                <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "#1e3a8a" }}>
                  {selectedStaging.edit_reason || "Tidak ada alasan spesifik yang dicantumkan."}
                </p>
              </div>

              {/* ALASAN PENOLAKAN (JIKA ADA) */}
              {selectedStaging.rejection_reason && (
                <div style={{ marginTop: "8px", color: "#dc2626", backgroundColor: "#fef2f2", padding: "12px", borderRadius: "6px", border: "1px solid #fca5a5" }}>
                  <strong>❌ Alasan Penolakan (Rejection Reason):</strong>
                  <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "#991b1b" }}>
                    {selectedStaging.rejection_reason}
                  </p>
                </div>
              )}
            </div>

            {/* TABEL KOMPARASI DATA BEFORE VS AFTER */}
            <div className="table-wrapper" style={{ maxHeight: "300px", overflowY: "auto" }}>
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Field</th>
                    <th style={{ backgroundColor: "#fef2f2", color: "#991b1b" }}>Before (Data Lama)</th>
                    <th style={{ backgroundColor: "#ecfdf5", color: "#065f46" }}>After (Data Baru)</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(selectedStaging.changes_payload || {}).map(([field, values]) => (
                    <tr key={field}>
                      <td><strong>{field}</strong></td>
                      <td style={{ backgroundColor: "#fff5f5", color: "#991b1b" }}>
                        {String(values.old ?? "-")}
                      </td>
                      <td style={{ backgroundColor: "#f0fdf4", color: "#065f46", fontWeight: "bold" }}>
                        {String(values.new ?? "-")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ACTION BUTTONS (CHECK / APPROVE / REJECT) */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "20px", borderTop: "1px solid #e2e8f0", paddingTop: "16px" }}>
              <button onClick={() => setSelectedStaging(null)} className="btn btn-cancel">
                Tutup
              </button>

              {/* LAYER 1: CHECK / MARK AS PROGRESS */}
              {["draft", "pending"].includes(selectedStaging.status) && !loadingPermissions && hasAccess("employeeStaggingCheck") && (
                <button
                  disabled={actionLoading}
                  onClick={() => handleProcess(selectedStaging.id)}
                  className="btn btn-secondary"
                  style={{ backgroundColor: "#f59e0b", color: "#ffffff", borderColor: "#f59e0b" }}
                >
                  {actionLoading ? "Memproses..." : "Check (Mark as Progress)"}
                </button>
              )}

              {/* LAYER 2: REJECT BUTTON */}
              {["draft", "pending", "progress"].includes(selectedStaging.status) && !loadingPermissions && hasAccess("employeeStaggingReject") && (
                <button
                  disabled={actionLoading}
                  onClick={() => setShowRejectModal(true)}
                  className="btn btn-danger"
                >
                  Tolak (Reject)
                </button>
              )}

              {/* LAYER 3: APPROVE BUTTON */}
              {["pending", "progress"].includes(selectedStaging.status) && !loadingPermissions && hasAccess("employeeStaggingApprove") && (
                <button
                  disabled={actionLoading}
                  onClick={() => handleApprove(selectedStaging.id)}
                  className="btn btn-primary"
                  style={{ backgroundColor: "#10b981" }}
                >
                  {actionLoading ? "Menyimpan..." : "Setujui (Approve)"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 5. MODAL REJECTION REASON */}
      {showRejectModal && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: "420px" }}>
            <h4 style={{ margin: "0 0 12px 0", color: "#dc2626" }}>Alasan Penolakan (Rejection Reason)</h4>
            <p style={{ fontSize: "13px", color: "#64748b", margin: "0 0 12px 0" }}>
              Harap berikan alasan yang jelas mengapa Anda menolak pengajuan perubahan data ini.
            </p>
            <textarea
              rows={4}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Masukkan alasan mengapa perubahan ini ditolak..."
              className="input-control"
            />
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "16px" }}>
              <button onClick={() => setShowRejectModal(false)} className="btn btn-cancel">
                Batal
              </button>
              <button onClick={handleRejectSubmit} disabled={actionLoading} className="btn btn-danger">
                Kirim Penolakan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeEditStagingPage;