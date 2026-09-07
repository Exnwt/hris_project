import React, { useState, useEffect } from "react";
import api from "../api";
import { StatCard, FilterBar } from "../components/StatisticCard_component";

const CompanyPage = () => {
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

  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedId, setSelectedId] = useState(null);

  // Filter State
  const [searchQuery, setSearchQuery] = useState("");

  // Form State sesuai Model Company
  const [formData, setFormData] = useState({
    name: "",
    company_code: "",
    phone_number: "",
    address: "",
  });

  const BASE_URL = "/api/v1/master-data/Company";

  // ==========================================
  // 3. FETCH PERMISSIONS & MASTER DATA
  // ==========================================
  useEffect(() => {
    fetchPermissions();
    fetchCompanies();
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

  // Helper Hak Akses (Mendukung Superuser & Wildcard "*")
  const hasAccess = (codename) => {
    if (userPermissions.isSuperuser) return true;
    if (userPermissions.allowedCodenames.includes("*")) return true;
    return userPermissions.allowedCodenames.includes(codename);
  };

  const fetchCompanies = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get(`${BASE_URL}/`);
      const data = response.data.results || response.data || [];
      setCompanies(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Gagal mengambil data company:", err);
      setError("Gagal memuat data perusahaan. Pastikan backend Django aktif.");
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // FILTERING & STATISTIK
  // ==========================================
  const filteredData = companies.filter((item) => {
    const name = item.name || "";
    const code = item.company_code || "";
    const phone = item.phone_number || "";

    return (
      name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      phone.includes(searchQuery)
    );
  });

  const totalCompanies = companies.length;
  const withAddressCount = companies.filter(
    (c) => c.address && c.address.trim() !== ""
  ).length;

  // ==========================================
  // HANDLERS FORM & ACTION
  // ==========================================
  const handleOpenCreate = () => {
    setFormData({
      name: "",
      company_code: "",
      phone_number: "",
      address: "",
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
        company_code: data.company_code || "",
        phone_number: data.phone_number || "",
        address: data.address || "",
      });
      setFormMode("detail");
      setCurrentView("form");
    } catch (err) {
      alert("Gagal memuat detail perusahaan!");
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
        alert("Perusahaan berhasil ditambahkan!");
      } else if (formMode === "edit") {
        await api.put(`${BASE_URL}/${selectedId}/update/`, formData);
        alert("Data perusahaan berhasil diperbarui!");
      }
      setCurrentView("list");
      fetchCompanies();
    } catch (err) {
      console.error("SAVE ERROR:", err.response?.data || err);
      alert("Gagal menyimpan data perusahaan. Periksa kembali inputan Anda.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus data perusahaan ini?")) return;
    setLoading(true);
    try {
      await api.delete(`${BASE_URL}/${id}/delete/`);
      alert("Perusahaan berhasil dihapus!");
      setCurrentView("list");
      fetchCompanies();
    } catch (err) {
      alert("Gagal menghapus data perusahaan.");
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // VIEW 1: FORM VIEW (CREATE / EDIT / DETAIL)
  // ==========================================
  if (currentView === "form") {
    return (
      <div style={containerStyle}>
        <div style={{ ...headerStyle, borderBottom: "1px solid #e2e8f0", paddingBottom: "15px" }}>
          <div>
            <h3 style={{ margin: 0, color: "#0f172a" }}>
              {formMode === "create"
                ? "Tambah Perusahaan Baru"
                : formMode === "edit"
                ? `Edit Company: ${formData.name}`
                : `Detail Company: ${formData.name}`}
            </h3>
            <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: "13px" }}>
              Kelola entitas bisnis dan informasi kontak utama perusahaan
            </p>
          </div>
          <button onClick={() => setCurrentView("list")} style={cancelButtonStyle}>
            ← Kembali ke List
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ marginTop: "20px" }}>
          <div style={formGridStyle}>
            <div>
              <label style={labelStyle}>Nama Company *</label>
              <input
                type="text"
                disabled={formMode === "detail"}
                placeholder="misal: PT Utama Karya"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                style={inputSearchStyle}
                required
              />
            </div>

            <div>
              <label style={labelStyle}>Kode Company *</label>
              <input
                type="text"
                disabled={formMode === "detail"}
                placeholder="misal: CMP-001"
                value={formData.company_code}
                onChange={(e) => setFormData({ ...formData, company_code: e.target.value })}
                style={inputSearchStyle}
                required
              />
            </div>

            <div>
              <label style={labelStyle}>Nomor Telepon *</label>
              <input
                type="text"
                disabled={formMode === "detail"}
                placeholder="misal: 021-5551234"
                value={formData.phone_number}
                onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                style={inputSearchStyle}
                required
              />
            </div>

            <div style={{ gridColumn: "span 2" }}>
              <label style={labelStyle}>Alamat Perusahaan</label>
              <textarea
                disabled={formMode === "detail"}
                placeholder="Alamat lengkap lokasi kantor..."
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                rows={4}
                style={{
                  ...inputSearchStyle,
                  resize: "vertical",
                  fontFamily: "Arial, sans-serif",
                }}
              />
            </div>
          </div>

          <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "20px" }}>
            {formMode === "detail" ? (
              <>
                {!loadingPermissions && hasAccess("CompanyEdit") && (
                  <button
                    type="button"
                    onClick={() => setFormMode("edit")}
                    style={primaryButtonStyle}
                  >
                    ✏️ Edit Company
                  </button>
                )}

                {!loadingPermissions && hasAccess("CompanyDelete") && (
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
                    ? "Perbarui Company"
                    : "Simpan Company Baru"}
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
          <h2 style={{ margin: 0, color: "#0f172a" }}>Master Data Company</h2>
          <p style={{ margin: "5px 0 0", color: "#64748b", fontSize: "14px" }}>
            Kelola daftar dan entitas bisnis perusahaan
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button onClick={fetchCompanies} style={refreshButtonStyle}>
            🔄 Refresh Data
          </button>
          {!loadingPermissions && hasAccess("CompanyCreate") && (
            <button onClick={handleOpenCreate} style={primaryButtonStyle}>
              + Tambah Company Baru
            </button>
          )}
        </div>
      </div>

      {/* STATISTIC CARDS */}
      <div style={statsContainerStyle}>
        <StatCard
          title="Total Company"
          count={totalCompanies}
          isActive={true}
        />
        <StatCard
          title="Memiliki Alamat"
          count={withAddressCount}
          color="#16a34a"
          bgColor="#f0fdf4"
          borderColor="#bbf7d0"
        />
      </div>

      {/* REUSABLE FILTER BAR */}
      <FilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        placeholder="Cari Kode, Nama Company, atau No Telepon..."
      />

      {error && <div style={errorBannerStyle}>{error}</div>}

      {/* TABLE DATA */}
      <div style={tableWrapperStyle}>
        <table style={tableStyle}>
          <thead>
            <tr style={tableHeaderRowStyle}>
              <th style={thStyle}>Kode Company</th>
              <th style={thStyle}>Nama Company</th>
              <th style={thStyle}>No. Telepon</th>
              <th style={thStyle}>Alamat</th>
              <th style={{ ...thStyle, textAlign: "center" }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="5" style={emptyTdStyle}>Memuat data perusahaan...</td>
              </tr>
            ) : filteredData.length === 0 ? (
              <tr>
                <td colSpan="5" style={emptyTdStyle}>Tidak ada data perusahaan ditemukan.</td>
              </tr>
            ) : (
              filteredData.map((row, index) => (
                <tr key={row.id || index} style={tableBodyRowStyle}>
                  <td style={tdStyle}>
                    <strong style={{ color: "#2563eb" }}>{row.company_code}</strong>
                  </td>
                  <td style={tdStyle}>
                    <strong>{row.name}</strong>
                  </td>
                  <td style={tdStyle}>{row.phone_number || "-"}</td>
                  <td style={{ ...tdStyle, maxWidth: "250px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {row.address || "-"}
                  </td>
                  <td style={{ ...tdStyle, textAlign: "center" }}>
                    {!loadingPermissions && (
                      <>
                        {hasAccess("CompanyDetail") && (
                          <button onClick={() => handleOpenDetail(row.id)} style={actionButtonStyle}>
                            Buka
                          </button>
                        )}
                        {" "}
                        {hasAccess("CompanyDelete") && (
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

export default CompanyPage;