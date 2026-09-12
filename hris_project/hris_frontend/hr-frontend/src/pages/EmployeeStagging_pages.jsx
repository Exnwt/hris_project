import React, { useState, useEffect } from "react";
import api from "../api"; // Instance axios Anda

const EmployeeEditStagingPage = () => {
  const [stagings, setStagings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [selectedStaging, setSelectedStaging] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const BASE_URL = "/api/v1/master-data/employee-stagging";



  useEffect(() => {
    fetchStagings();
  }, []);

  const fetchStagings = async () => {
    setLoading(true);
    try {
        console.log('start111')
        const response = await api.get(`${BASE_URL}/`);
        console.log('11111', response)
        // Menangani response berupa array atau objek terpaginasi DRF
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

  // --- Perhitungan Stat Cards ---
  const stats = {
    total: stagings.length,
    progress: stagings.filter((s) => ["draft", "pending", "progress"].includes(s.status)).length,
    approved: stagings.filter((s) => s.status === "approved").length,
    rejected: stagings.filter((s) => s.status === "rejected").length,
  };

  // --- Filtering Data Berdasarkan Tab ---
  const filteredStagings = stagings.filter((item) => {
    if (activeTab === "progress") return ["draft", "pending", "progress"].includes(item.status);
    if (activeTab === "approved") return item.status === "approved";
    if (activeTab === "rejected") return item.status === "rejected";
    return true;
  });

  // --- Handler Action 3-Layer ---
  const handleProcess = async (id) => {
    if (!window.confirm("Tandai pengajuan ini dalam proses peninjauan (Progress)?")) return;
    setActionLoading(true);
    try {
      await api.post(`${BASE_URL}/${id}/approve/`, {
        action: "PROGRESS",
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

  // Badge Status Styling
  const renderStatusBadge = (status) => {
    const styles = {
      draft: { bg: "#FFFBEB", text: "#B45309", border: "#FCD34D" },
      pending: { bg: "#FEF3C7", text: "#92400E", border: "#FBBF24" },
      progress: { bg: "#EFF6FF", text: "#1D4ED8", border: "#93C5FD" },
      approved: { bg: "#ECFDF5", text: "#047857", border: "#6EE7B7" },
      rejected: { bg: "#FEF2F2", text: "#B91C1C", border: "#FCA5A5" },
    };
    const current = styles[status] || styles.draft;
    return (
      <span
        style={{
          padding: "4px 12px",
          borderRadius: "9999px",
          fontSize: "12px",
          fontWeight: "600",
          backgroundColor: current.bg,
          color: current.text,
          border: `1px solid ${current.border}`,
          textTransform: "uppercase",
        }}
      >
        {status}
      </span>
    );
  };

  return (
    <div style={{ padding: "24px", fontFamily: "'Inter', sans-serif", backgroundColor: "#F9FAFB", minHeight: "100vh" }}>
      {/* Header */}
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: "700", color: "#111827", margin: "0 0 8px 0" }}>
          Persetujuan Perubahan Data Karyawan
        </h1>
        <p style={{ color: "#6B7280", margin: 0, fontSize: "14px" }}>
          Kelola dan tinjau riwayat permohonan edit data karyawan (*Maker-Checker Staging*).
        </p>
      </div>

      {/* 1. Stat Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px", marginBottom: "24px" }}>
        <div style={cardStyle}>
          <span style={cardTitleStyle}>Total Pengajuan</span>
          <span style={{ fontSize: "28px", fontWeight: "700", color: "#111827" }}>{stats.total}</span>
        </div>
        <div style={{ ...cardStyle, borderLeft: "4px solid #3B82F6" }}>
          <span style={cardTitleStyle}>Dalam Proses / Draft</span>
          <span style={{ fontSize: "28px", fontWeight: "700", color: "#2563EB" }}>{stats.progress}</span>
        </div>
        <div style={{ ...cardStyle, borderLeft: "4px solid #10B981" }}>
          <span style={cardTitleStyle}>Disetujui (Approved)</span>
          <span style={{ fontSize: "28px", fontWeight: "700", color: "#059669" }}>{stats.approved}</span>
        </div>
        <div style={{ ...cardStyle, borderLeft: "4px solid #EF4444" }}>
          <span style={cardTitleStyle}>Ditolak (Rejected)</span>
          <span style={{ fontSize: "28px", fontWeight: "700", color: "#DC2626" }}>{stats.rejected}</span>
        </div>
      </div>

      {/* 2. Filter Tabs */}
      <div style={{ display: "flex", gap: "8px", borderBottom: "1px solid #E5E7EB", marginBottom: "20px" }}>
        {["all", "progress", "approved", "rejected"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: "8px 16px",
              fontWeight: "600",
              fontSize: "14px",
              border: "none",
              backgroundColor: "transparent",
              cursor: "pointer",
              borderBottom: activeTab === tab ? "2px solid #2563EB" : "none",
              color: activeTab === tab ? "#2563EB" : "#6B7280",
              textTransform: "capitalize",
            }}
          >
            {tab === "all" ? "Semua" : tab}
          </button>
        ))}
      </div>

      {/* 3. Table List Staging */}
      <div style={{ backgroundColor: "#FFFFFF", borderRadius: "8px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: "40px", textAlign: "center", color: "#6B7280" }}>Memuat data staging...</div>
        ) : filteredStagings.length === 0 ? (
          <div style={{ padding: "40px", textAlign: "center", color: "#6B7280" }}>Tidak ada data pengajuan.</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "14px" }}>
            <thead>
              <tr style={{ backgroundColor: "#F9FAFB", borderBottom: "1px solid #E5E7EB", color: "#374151" }}>
                <th style={thStyle}>Tanggal</th>
                <th style={thStyle}>Karyawan</th>
                <th style={thStyle}>NIK</th>
                <th style={thStyle}>Pemohon</th>
                <th style={thStyle}>Status</th>
                <th style={{ ...thStyle, textAlign: "center" }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredStagings.map((item) => (
                <tr key={item.id} style={{ borderBottom: "1px solid #E5E7EB" }}>
                  <td style={tdStyle}>{new Date(item.created_at).toLocaleDateString("id-ID")}</td>
                  <td style={{ ...tdStyle, fontWeight: "600" }}>{item.nama_lengkap}</td>
                  <td style={tdStyle}>{item.nik_karyawan || "-"}</td>
                  <td style={tdStyle}>{item.requested_by_name || item.requested_by || "User"}</td>
                  <td style={tdStyle}>{renderStatusBadge(item.status)}</td>
                  <td style={{ ...tdStyle, textAlign: "center" }}>
                    <button
                      onClick={() => setSelectedStaging(item)}
                      style={btnDetailStyle}
                    >
                      Tinjau Perubahan
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* 4. Modal Detail Komparasi Before vs After */}
      {selectedStaging && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #E5E7EB", paddingBottom: "12px", marginBottom: "16px" }}>
              <h3 style={{ margin: 0, fontSize: "18px", color: "#111827" }}>
                Detail Perubahan: {selectedStaging.nama_lengkap}
              </h3>
              <button onClick={() => setSelectedStaging(null)} style={{ border: "none", background: "none", cursor: "pointer", fontSize: "18px" }}>✕</button>
            </div>

            <div style={{ marginBottom: "16px", fontSize: "13px", color: "#6B7280" }}>
              <span>Status: {renderStatusBadge(selectedStaging.status)}</span>
              {selectedStaging.rejection_reason && (
                <div style={{ marginTop: "8px", color: "#DC2626", backgroundColor: "#FEF2F2", padding: "8px", borderRadius: "4px" }}>
                  <strong>Alasan Penolakan:</strong> {selectedStaging.rejection_reason}
                </div>
              )}
            </div>

            {/* Tabel Perbandingan Before vs After */}
            <div style={{ maxHeight: "350px", overflowY: "auto", border: "1px solid #E5E7EB", borderRadius: "6px" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                <thead style={{ backgroundColor: "#F3F4F6", position: "sticky", top: 0 }}>
                  <tr>
                    <th style={thStyle}>Field</th>
                    <th style={{ ...thStyle, backgroundColor: "#FEF2F2", color: "#991B1B" }}>Before (Data Lama)</th>
                    <th style={{ ...thStyle, backgroundColor: "#ECFDF5", color: "#065F46" }}>After (Data Baru)</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(selectedStaging.changes_payload || {}).map(([field, values]) => (
                    <tr key={field} style={{ borderBottom: "1px solid #E5E7EB" }}>
                      <td style={{ ...tdStyle, fontWeight: "600", color: "#374151", width: "30%" }}>{field}</td>
                      <td style={{ ...tdStyle, backgroundColor: "#FFF5F5", color: "#991B1B" }}>
                        {String(values.old ?? "-")}
                      </td>
                      <td style={{ ...tdStyle, backgroundColor: "#F0FDF4", color: "#065F46", fontWeight: "600" }}>
                        {String(values.new ?? "-")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 3-Layer Action Buttons */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "20px", borderTop: "1px solid #E5E7EB", paddingTop: "16px" }}>
              <button onClick={() => setSelectedStaging(null)} style={btnSecondaryStyle}>
                Tutup
              </button>

              {/* Layer 1: Check/Progress Button */}
              {["draft", "pending"].includes(selectedStaging.status) && (
                <button
                  disabled={actionLoading}
                  onClick={() => handleProcess(selectedStaging.id)}
                  style={btnCheckStyle}
                >
                  {actionLoading ? "Memproses..." : "Periksa (Mark as Progress)"}
                </button>
              )}

              {/* Layer 2 & 3: Approve and Reject Buttons */}
              {["draft", "pending", "progress"].includes(selectedStaging.status) && (
                <>
                  <button
                    disabled={actionLoading}
                    onClick={() => setShowRejectModal(true)}
                    style={btnDangerStyle}
                  >
                    Tolak (Reject)
                  </button>
                  <button
                    disabled={actionLoading}
                    onClick={() => handleApprove(selectedStaging.id)}
                    style={btnSuccessStyle}
                  >
                    {actionLoading ? "Menyimpan..." : "Setujui (Approve)"}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Rejection Reason */}
      {showRejectModal && (
        <div style={modalOverlayStyle}>
          <div style={{ ...modalContentStyle, maxWidth: "400px" }}>
            <h4 style={{ margin: "0 0 12px 0", color: "#111827" }}>Alasan Penolakan</h4>
            <textarea
              rows={4}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Masukkan alasan mengapa perubahan ini ditolak..."
              style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #D1D5DB", fontSize: "14px", boxSizing: "border-box" }}
            />
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "12px" }}>
              <button onClick={() => setShowRejectModal(false)} style={btnSecondaryStyle}>Batal</button>
              <button onClick={handleRejectSubmit} disabled={actionLoading} style={btnDangerStyle}>
                Kirim Penolakan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- Embedded Styles ---
const cardStyle = {
  backgroundColor: "#FFFFFF",
  padding: "16px 20px",
  borderRadius: "8px",
  boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
  display: "flex",
  flexDirection: "column",
  gap: "4px",
};

const cardTitleStyle = { fontSize: "12px", color: "#6B7280", fontWeight: "600", textTransform: "uppercase" };
const thStyle = { padding: "12px 16px", fontWeight: "600" };
const tdStyle = { padding: "12px 16px" };

const btnDetailStyle = {
  padding: "6px 12px",
  backgroundColor: "#2563EB",
  color: "#FFFFFF",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
  fontSize: "12px",
  fontWeight: "500",
};

const btnSecondaryStyle = {
  padding: "8px 16px",
  backgroundColor: "#F3F4F6",
  color: "#374151",
  border: "1px solid #D1D5DB",
  borderRadius: "6px",
  cursor: "pointer",
  fontSize: "13px",
  fontWeight: "500",
};

const btnCheckStyle = {
  padding: "8px 16px",
  backgroundColor: "#D97706",
  color: "#FFFFFF",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
  fontSize: "13px",
  fontWeight: "600",
};

const btnSuccessStyle = {
  padding: "8px 16px",
  backgroundColor: "#059669",
  color: "#FFFFFF",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
  fontSize: "13px",
  fontWeight: "600",
};

const btnDangerStyle = {
  padding: "8px 16px",
  backgroundColor: "#DC2626",
  color: "#FFFFFF",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
  fontSize: "13px",
  fontWeight: "600",
};

const modalOverlayStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: "rgba(0,0,0,0.5)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 1000,
};

const modalContentStyle = {
  backgroundColor: "#FFFFFF",
  padding: "24px",
  borderRadius: "8px",
  width: "100%",
  maxWidth: "650px",
  boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)",
};

export default EmployeeEditStagingPage;