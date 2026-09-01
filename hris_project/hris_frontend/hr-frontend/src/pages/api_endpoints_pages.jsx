import React, { useEffect, useState } from "react";
import api from "../api"; // Sesuaikan path instance axios / api client Anda

const APIEndpointManager = () => {
  const [endpoints, setEndpoints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // State untuk Modal Form (Create / Edit)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    code_name: "",
    description: "",
  });
  const [saving, setSaving] = useState(false);

  // ==========================================
  // 1. FETCH ALL API ENDPOINTS
  // ==========================================
  const fetchEndpoints = async () => {
    try {
      setLoading(true);
      setError("");
      // Sesuaikan URL endpoint DRF Anda (contoh: /api/v2/access/APIEndpoints/)
      console.log("Fetching API Endpoints from: api/v2/access/APIEndpoints/");
      const response = await api.get("api/v2/access/APIEndpoints/");
      console.log("Fetched API Endpoints:", response.data);
      setEndpoints(response.data);
    } catch (err) {
        console.error("erorr nih:", err);
      setError("Gagal mengambil daftar API Endpoint.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEndpoints();
  }, []);

  // ==========================================
  // 2. HANDLER FORM INPUT & MODAL
  // ==========================================
  const handleOpenModal = (item = null) => {
    if (item) {
      // Edit Mode
      setEditingId(item.id);
      setFormData({
        name: item.name,
        code_name: item.code_name,
        description: item.description || "",
      });
    } else {
      // Create Mode
      setEditingId(null);
      setFormData({ name: "", code_name: "", description: "" });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({ name: "", code_name: "", description: "" });
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // ==========================================
  // 3. SUBMIT (CREATE / UPDATE)
  // ==========================================
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      if (editingId) {
        // Update (PUT/PATCH)
        await api.put(`api/v2/access/APIEndpoints/${editingId}/`, formData);
      } else {
        // Create (POST)
        await api.post("api/v2/access/APIEndpoints/", formData);
      }
      handleCloseModal();
      fetchEndpoints();
    } catch (err) {
      alert(err.response?.data?.detail || "Gagal menyimpan data API Endpoint");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  // ==========================================
  // 4. DELETE
  // ==========================================
  const handleDelete = async (id, name) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus API Endpoint "${name}"?`)) {
      try {
        await api.delete(`api/v2/access/APIEndpoints/${id}/`);
        fetchEndpoints();
      } catch (err) {
        alert("Gagal menghapus API Endpoint.");
        console.error(err);
      }
    }
  };

    // Filter pencarian berdasarkan Name atau Code Name
    // Menggunakan optional chaining atau default array []
    const filteredEndpoints = (endpoints || []).filter(
        (item) =>
        item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.code_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  

  return (
    <div style={styles.container}>
      {/* HEADER PAGE */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Master API Endpoints</h1>
          <p style={styles.subtitle}>
            Kelola daftar katalog endpoint API yang tersedia di sistem HRD.
          </p>
        </div>
        <button style={styles.btnPrimary} onClick={() => handleOpenModal()}>
          + Tambah Endpoint
        </button>
      </div>

      {/* SEARCH BAR */}
      <div style={styles.filterSection}>
        <input
          type="text"
          placeholder="Cari nama API atau code name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={styles.searchInput}
        />
      </div>

      {/* ERROR MESSAGE */}
      {error && <div style={styles.errorBox}>{error}</div>}

      {/* TABLE / LIST */}
      {loading ? (
        <p style={{ textAlign: "center", padding: "20px" }}>Memuat data API Endpoints...</p>
      ) : (
        <div style={styles.tableCard}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>No</th>
                <th style={styles.th}>Nama API</th>
                <th style={styles.th}>Code Name (Identifier)</th>
                <th style={styles.th}>Deskripsi</th>
                <th style={{ ...styles.th, textAlign: "center" }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredEndpoints.length === 0 ? (
                <tr>
                  <td colSpan="5" style={styles.tdEmpty}>
                    Tidak ada data API Endpoint ditemukan.
                  </td>
                </tr>
              ) : (
                filteredEndpoints.map((item, index) => (
                  <tr key={item.id} style={styles.tr}>
                    <td style={styles.td}>{index + 1}</td>
                    <td style={styles.td}>
                      <strong>{item.name}</strong>
                    </td>
                    <td style={styles.td}>
                      <code style={styles.codeBadge}>{item.code_name}</code>
                    </td>
                    <td style={styles.td}>{item.description || "-"}</td>
                    <td style={{ ...styles.td, textAlign: "center" }}>
                      <button
                        style={styles.btnEdit}
                        onClick={() => handleOpenModal(item)}
                      >
                        Edit
                      </button>
                      <button
                        style={styles.btnDelete}
                        onClick={() => handleDelete(item.id, item.name)}
                      >
                        Hapus
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL FORM (CREATE / EDIT) */}
      {isModalOpen && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h3>{editingId ? "Edit API Endpoint" : "Tambah API Endpoint Baru"}</h3>
              <button style={styles.btnClose} onClick={handleCloseModal}>
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Nama API / Fungsi *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Contoh: Create Employee"
                  required
                  style={styles.input}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Code Name (Unique Identifier) *</label>
                <input
                  type="text"
                  name="code_name"
                  value={formData.code_name}
                  onChange={handleChange}
                  placeholder="Contoh: api-employee-create"
                  required
                  style={styles.input}
                />
                <small style={styles.helpText}>
                  Digunakan pada `api_codename` di backend Django.
                </small>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Deskripsi (Opsional)</label>
                <textarea
                  name="description"
                  rows="3"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Penjelasan fungsi dari API ini..."
                  style={styles.textarea}
                />
              </div>

              <div style={styles.modalFooter}>
                <button
                  type="button"
                  style={styles.btnSecondary}
                  onClick={handleCloseModal}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  style={styles.btnPrimary}
                  disabled={saving}
                >
                  {saving ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// ==========================================
// STYLES (Inline CSS)
// ==========================================
const styles = {
  container: { padding: "30px", maxWidth: "1100px", margin: "0 auto", fontFamily: "sans-serif" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "25px" },
  title: { margin: 0, fontSize: "24px", color: "#1a1a1a" },
  subtitle: { margin: "5px 0 0", color: "#666", fontSize: "14px" },
  filterSection: { marginBottom: "20px" },
  searchInput: { width: "100%", maxWidth: "350px", padding: "10px 14px", borderRadius: "6px", border: "1px solid #ccc", fontSize: "14px" },
  tableCard: { backgroundColor: "#fff", borderRadius: "8px", border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" },
  table: { width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "14px" },
  th: { backgroundColor: "#f8fafc", padding: "12px 16px", borderBottom: "1px solid #e2e8f0", color: "#475569", fontWeight: "600" },
  tr: { borderBottom: "1px solid #f1f5f9" },
  td: { padding: "14px 16px", color: "#334155", verticalAlign: "middle" },
  tdEmpty: { padding: "30px", textAlign: "center", color: "#94a3b8" },
  codeBadge: { backgroundColor: "#f1f5f9", padding: "4px 8px", borderRadius: "4px", color: "#0f172a", fontSize: "13px", fontFamily: "monospace" },
  btnPrimary: { backgroundColor: "#2563eb", color: "#fff", border: "none", padding: "10px 18px", borderRadius: "6px", cursor: "pointer", fontWeight: "500" },
  btnSecondary: { backgroundColor: "#f1f5f9", color: "#475569", border: "1px solid #cbd5e1", padding: "9px 16px", borderRadius: "6px", cursor: "pointer", marginRight: "10px" },
  btnEdit: { backgroundColor: "#e0f2fe", color: "#0369a1", border: "none", padding: "6px 12px", borderRadius: "4px", cursor: "pointer", marginRight: "8px" },
  btnDelete: { backgroundColor: "#fee2e2", color: "#b91c1c", border: "none", padding: "6px 12px", borderRadius: "4px", cursor: "pointer" },
  errorBox: { padding: "12px 16px", backgroundColor: "#fef2f2", color: "#991b1b", borderRadius: "6px", marginBottom: "20px" },
  modalOverlay: { position: "fixed", inset: 0, backgroundColor: "rgba(0, 0, 0, 0.4)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 },
  modalContent: { backgroundColor: "#fff", padding: "24px", borderRadius: "8px", width: "100%", maxWidth: "480px", boxShadow: "0 10px 25px rgba(0,0,0,0.15)" },
  modalHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" },
  btnClose: { background: "none", border: "none", fontSize: "18px", cursor: "pointer", color: "#64748b" },
  formGroup: { marginBottom: "16px" },
  label: { display: "block", marginBottom: "6px", fontWeight: "500", fontSize: "14px", color: "#334155" },
  input: { width: "100%", padding: "9px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "14px", boxSizing: "border-box" },
  textarea: { width: "100%", padding: "9px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "14px", boxSizing: "border-box", fontFamily: "inherit" },
  helpText: { display: "block", marginTop: "4px", fontSize: "12px", color: "#64748b" },
  modalFooter: { display: "flex", justifyContent: "flex-end", marginTop: "24px" }
};

export default APIEndpointManager;