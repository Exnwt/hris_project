import React, { useState, useEffect } from "react";
import api from "../api";
import { StatCard, FilterBar } from "../components/StatisticCard_component";

const PositionPage = () => {
  // ==========================================
  // 1. STATE PERMISSION HAK AKSES
  // ==========================================
  const [userPermissions, setUserPermissions] = useState({
    isSuperuser: false,
    allowedCodenames: [],
  });
  const [loadingPermissions, setLoadingPermissions] = useState(true);

  // ==========================================
  // 2. STATE DATA UTAMA
  // ==========================================
  const [currentView, setCurrentView] = useState("list"); // 'list' | 'form'
  const [formMode, setFormMode] = useState("create"); // 'create' | 'edit' | 'detail'

  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedId, setSelectedId] = useState(null);

  // Filter State
  const [searchQuery, setSearchQuery] = useState("");

  // Form State sesuai Model Position (name)
  const [formData, setFormData] = useState({
    name: "",
  });

  const BASE_URL = "/api/v1/master-data/Position";

  // ==========================================
  // 3. FETCH PERMISSIONS & MASTER DATA
  // ==========================================
  useEffect(() => {
    fetchPermissions();
    fetchPositions();
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

  const fetchPositions = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get(`${BASE_URL}/`);
      const data = response.data.results || response.data || [];
      setPositions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Gagal mengambil data posisi/jabatan:", err);
      setError("Gagal memuat data jabatan. Pastikan backend Django aktif.");
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // FILTERING & STATISTIK
  // ==========================================
  const filteredData = positions.filter((item) => {
    const name = item.name || "";
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const totalPositions = positions.length;

  // ==========================================
  // HANDLERS FORM & ACTION
  // ==========================================
  const handleOpenCreate = () => {
    setFormData({
      name: "",
    });
    setFormMode("create");
    setSelectedId(null);
    setCurrentView("form");
  };

  const handleOpenDetail = async (id) => {
    setLoading(true);
    setSelectedId(id);
    try {
      const response = await api.get(`${BASE_URL}/${id}/`);
      const data = response.data;

      setFormData({
        name: data.name || "",
      });
      setFormMode("detail");
      setCurrentView("form");
    } catch (err) {
      alert("Gagal memuat detail jabatan!");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);

    try {
      if (formMode === "create") {
        await api.post(`${BASE_URL}/create/`, formData);
        alert("Jabatan berhasil ditambahkan!");
      } else if (formMode === "edit") {
        await api.put(`${BASE_URL}/${selectedId}/update/`, formData);
        alert("Data jabatan berhasil diperbarui!");
      }
      setCurrentView("list");
      fetchPositions();
    } catch (err) {
      console.error("SAVE ERROR:", err.response?.data || err);
      alert("Gagal menyimpan data jabatan. Periksa kembali inputan Anda.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus data jabatan ini?")) return;
    setLoading(true);
    try {
      await api.delete(`${BASE_URL}/${id}/delete/`);
      alert("Jabatan berhasil dihapus!");
      setCurrentView("list");
      fetchPositions();
    } catch (err) {
      alert("Gagal menghapus data jabatan.");
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // VIEW 1: FORM VIEW
  // ==========================================
  if (currentView === "form") {
    return (
      <div style={containerStyle}>
        <div style={{ ...headerStyle, borderBottom: "1px solid #e2e8f0", paddingBottom: "15px" }}>
          <div>
            <h3 style={{ margin: 0, color: "#0f172a" }}>
              {formMode === "create"
                ? "Tambah Jabatan Baru"
                : formMode === "edit"
                ? `Edit Position: ${formData.name}`
                : `Detail Position: ${formData.name}`}
            </h3>
            <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: "13px" }}>
              Kelola struktur jabatan/posisi pekerjaan karyawan
            </p>
          </div>
          <button onClick={() => setCurrentView("list")} style={cancelButtonStyle}>
            ← Kembali ke List
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ marginTop: "20px" }}>
          <div style={formGridStyle}>
            <div style={{ gridColumn: "span 2" }}>
              <label style={labelStyle}>Nama Position / Jabatan *</label>
              <input
                type="text"
                disabled={formMode === "detail"}
                placeholder="misal: Software Engineer / Staff HR"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                style={inputSearchStyle}
                required
              />
            </div>
          </div>

          <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "20px" }}>
            {formMode === "detail" ? (
              <>
                {!loadingPermissions && hasAccess("PositionEdit") && (
                  <button
                    type="button"
                    onClick={() => setFormMode("edit")}
                    style={primaryButtonStyle}
                  >
                    ✏️ Edit Position
                  </button>
                )}

                {!loadingPermissions && hasAccess("PositionDelete") && (
                  <button
                    type="button"
                    onClick={() => handleDelete(selectedId)}
                    style={clearFilterButtonStyle}
                  >
                    🗑️ Hapus
                  </button>
                )}
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => {
                    if (formMode === "edit") {
                      setFormMode("detail");
                    } else {
                      setCurrentView("list");
                    }
                  }}
                  style={cancelButtonStyle}
                >
                  Batal
                </button>

                <button type="submit" disabled={loading} style={primaryButtonStyle}>
                  {loading
                    ? "Menyimpan..."
                    : formMode === "edit"
                    ? "Perbarui Position"
                    : "Simpan Position Baru"}
                </button>
              </>
            )}
          </div>
        </form>
      </div>
    );
  }

  // ==========================================
  // VIEW 2: LIST VIEW
  // ==========================================
  return (
    <div style={containerStyle}>
      {/* HEADER */}
      <div style={headerStyle}>
        <div>
          <h2 style={{ margin: 0, color: "#0f172a" }}>Master Data Position</h2>
          <p style={{ margin: "5px 0 0", color: "#64748b", fontSize: "14px" }}>
            Kelola daftar posisi/jabatan karyawan
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button onClick={fetchPositions} style={refreshButtonStyle}>
            🔄 Refresh Data
          </button>
          {!loadingPermissions && hasAccess("PositionCreate") && (
            <button onClick={handleOpenCreate} style={primaryButtonStyle}>
              + Tambah Position Baru
            </button>
          )}
        </div>
      </div>

      {/* STATISTIC CARDS */}
      <div style={statsContainerStyle}>
        <StatCard
          title="Total Jabatan"
          count={totalPositions}
          isActive={true}
        />
      </div>

      {/* REUSABLE FILTER BAR */}
      <FilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        placeholder="Cari Nama Position / Jabatan..."
      />

      {error && <div style={errorBannerStyle}>{error}</div>}

      {/* TABLE DATA */}
      <div style={tableWrapperStyle}>
        <table style={tableStyle}>
          <thead>
            <tr style={tableHeaderRowStyle}>
              <th style={{ ...thStyle, width: "80px" }}>No</th>
              <th style={thStyle}>Nama Position / Jabatan</th>
              <th style={{ ...thStyle, textAlign: "center", width: "180px" }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="3" style={emptyTdStyle}>Memuat data jabatan...</td>
              </tr>
            ) : filteredData.length === 0 ? (
              <tr>
                <td colSpan="3" style={emptyTdStyle}>Tidak ada data jabatan ditemukan.</td>
              </tr>
            ) : (
              filteredData.map((row, index) => (
                <tr key={row.id || index} style={tableBodyRowStyle}>
                  <td style={tdStyle}>{index + 1}</td>
                  <td style={tdStyle}>
                    <strong>{row.name}</strong>
                  </td>
                  <td style={{ ...tdStyle, textAlign: "center" }}>
                    {!loadingPermissions && (
                      <>
                        {hasAccess("PositionDetail") && (
                          <button onClick={() => handleOpenDetail(row.id)} style={actionButtonStyle}>
                            Buka
                          </button>
                        )}
                        {" "}
                        {hasAccess("PositionDelete") && (
                          <button onClick={() => handleDelete(row.id)} style={actionDeleteStyle}>
                            Hapus
                          </button>
                        )}
                      </>
                    )}
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
const refreshButtonStyle = { padding: "8px 16px", background: "#f1f5f9", color: "#334155", border: "1px solid #cbd5e1", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "13px" };
const primaryButtonStyle = { padding: "8px 16px", background: "#2563eb", color: "#ffffff", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "13px" };
const cancelButtonStyle = { padding: "8px 16px", background: "#64748b", color: "#ffffff", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "13px" };
const clearFilterButtonStyle = { padding: "8px 16px", background: "#ef4444", color: "#ffffff", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "13px" };
const statsContainerStyle = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "15px", marginBottom: "20px" };
const inputSearchStyle = { flex: 1, minWidth: "200px", padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "14px", width: "100%", boxSizing: "border-box" };
const errorBannerStyle = { padding: "12px", background: "#fee2e2", color: "#b91c1c", borderRadius: "6px", marginBottom: "15px", fontSize: "14px" };
const tableWrapperStyle = { overflowX: "auto", border: "1px solid #e2e8f0", borderRadius: "8px" };
const tableStyle = { width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "14px" };
const tableHeaderRowStyle = { background: "#f8fafc", borderBottom: "2px solid #e2e8f0" };
const thStyle = { padding: "12px 16px", color: "#475569", fontWeight: "bold" };
const tableBodyRowStyle = { borderBottom: "1px solid #f1f5f9" };
const tdStyle = { padding: "12px 16px", color: "#334155", verticalAlign: "middle" };
const emptyTdStyle = { padding: "30px", textAlign: "center", color: "#94a3b8" };
const actionButtonStyle = { padding: "6px 12px", background: "#f1f5f9", color: "#334155", border: "1px solid #cbd5e1", borderRadius: "4px", cursor: "pointer", fontSize: "12px" };
const actionDeleteStyle = { padding: "6px 12px", background: "#fee2e2", color: "#b91c1c", border: "1px solid #fca5a5", borderRadius: "4px", cursor: "pointer", fontSize: "12px" };
const formGridStyle = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" };
const labelStyle = { display: "block", fontSize: "12px", fontWeight: "bold", color: "#475569", marginBottom: "6px" };

export default PositionPage;