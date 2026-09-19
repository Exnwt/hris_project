import React, { useState, useEffect } from "react";
import api from "../api";
import { StatCard, FilterBar } from "../components/StatisticCard_component";
import ExcelManagerModal from "../components/ExcelManagerModal";
import "../styles/MasterData.css";

const CompanyPage = () => {
  const [showExcelModal, setShowExcelModal] = useState(false);
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
      <div className="page-container">
        <div className="page-header form-header-bordered">
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
          <button onClick={() => setCurrentView("list")} className="btn btn-cancel">
            ← Kembali ke List
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ marginTop: "20px" }}>
          <div className="form-grid">
            <div>
              <label className="form-label">Nama Company *</label>
              <input
                type="text"
                disabled={formMode === "detail"}
                placeholder="misal: PT Utama Karya"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input-control"
                required
              />
            </div>

            <div>
              <label className="form-label">Kode Company *</label>
              <input
                type="text"
                disabled={formMode === "detail"}
                placeholder="misal: CMP-001"
                value={formData.company_code}
                onChange={(e) => setFormData({ ...formData, company_code: e.target.value })}
                className="input-control"
                required
              />
            </div>

            <div>
              <label className="form-label">Nomor Telepon *</label>
              <input
                type="text"
                disabled={formMode === "detail"}
                placeholder="misal: 021-5551234"
                value={formData.phone_number}
                onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                className="input-control"
                required
              />
            </div>

            <div className="form-group-full">
              <label className="form-label">Alamat Perusahaan</label>
              <textarea
                disabled={formMode === "detail"}
                placeholder="Alamat lengkap lokasi kantor..."
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                rows={4}
                className="input-control"
                style={{ resize: "vertical", fontFamily: "Arial, sans-serif" }}
              />
            </div>
          </div>

          <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "20px" }}>
            {formMode === "detail" ? (
              <>
                {!loadingPermissions && hasAccess("CompanyEdit") && (
                  <button type="button" onClick={() => setFormMode("edit")} className="btn btn-primary">
                    ✏️ Edit Company
                  </button>
                )}
                {!loadingPermissions && hasAccess("CompanyDelete") && (
                  <button type="button" onClick={() => handleDelete(selectedId)} className="btn btn-danger">
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
                  className="btn btn-cancel"
                >
                  Batal
                </button>
                <button type="submit" disabled={loading} className="btn btn-primary">
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
    <div className="page-container">
      {/* HEADER */}
      <div className="page-header">
        <div>
          <h2 style={{ margin: 0, color: "#0f172a" }}>Master Data Company</h2>
          <p style={{ margin: "5px 0 0", color: "#64748b", fontSize: "14px" }}>
            Kelola daftar dan entitas bisnis perusahaan
          </p>
        </div>
        <div className="page-header-actions">
          <button onClick={() => setShowExcelModal(true)} className="btn btn-secondary">
            📊 Import / Export Excel
          </button>
          <ExcelManagerModal
            isOpen={showExcelModal}
            onClose={() => setShowExcelModal(false)}
            targetModel="Company"
          />
          <button onClick={fetchCompanies} className="btn btn-secondary">
            🔄 Refresh Data
          </button>
          {!loadingPermissions && hasAccess("CompanyCreate") && (
            <button onClick={handleOpenCreate} className="btn btn-primary">
              + Tambah Company Baru
            </button>
          )}
        </div>
      </div>

      {/* STATISTIC CARDS */}
      <div className="stats-grid">
        <StatCard title="Total Company" count={totalCompanies} isActive={true} />
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

      {error && <div className="error-banner">{error}</div>}

      {/* TABLE DATA */}
      <div className="table-wrapper">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Kode Company</th>
              <th>Nama Company</th>
              <th>No. Telepon</th>
              <th>Alamat</th>
              <th style={{ textAlign: "center" }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="5" className="table-empty-td">Memuat data perusahaan...</td>
              </tr>
            ) : filteredData.length === 0 ? (
              <tr>
                <td colSpan="5" className="table-empty-td">Tidak ada data perusahaan ditemukan.</td>
              </tr>
            ) : (
              filteredData.map((row, index) => (
                <tr key={row.id || index}>
                  <td>
                    <strong style={{ color: "#2563eb" }}>{row.company_code}</strong>
                  </td>
                  <td>
                    <strong>{row.name}</strong>
                  </td>
                  <td>{row.phone_number || "-"}</td>
                  <td className="table-cell-truncate">{row.address || "-"}</td>
                  <td>
                    {!loadingPermissions && (
                      <div className="action-group">
                        {hasAccess("CompanyDetail") && (
                          <button onClick={() => handleOpenDetail(row.id)} className="btn-action-view">
                            Buka
                          </button>
                        )}
                        {hasAccess("CompanyDelete") && (
                          <button onClick={() => handleDelete(row.id)} className="btn-action-delete">
                            Hapus
                          </button>
                        )}
                      </div>
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

export default CompanyPage;