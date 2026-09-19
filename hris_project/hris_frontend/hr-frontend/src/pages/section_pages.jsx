import React, { useState, useEffect } from "react";
import api from "../api";
import { StatCard, FilterBar } from "../components/StatisticCard_component";
import ExcelManagerModal from "../components/ExcelManagerModal";
import "../styles/MasterData.css";

const SectionPage = () => {
  // ==========================================
  // 1. STATE PERMISSION HAK AKSES
  // ==========================================
  const [showExcelModal, setShowExcelModal] = useState(false);
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

  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedId, setSelectedId] = useState(null);

  // Filter State
  const [searchQuery, setSearchQuery] = useState("");

  // Form State sesuai Model Section (name)
  const [formData, setFormData] = useState({
    name: "",
  });

  const BASE_URL = "/api/v1/master-data/Section";

  // ==========================================
  // 3. FETCH PERMISSIONS & MASTER DATA
  // ==========================================
  useEffect(() => {
    fetchPermissions();
    fetchSections();
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

  const fetchSections = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get(`${BASE_URL}/`);
      const data = response.data.results || response.data || [];
      setSections(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Gagal mengambil data section:", err);
      setError("Gagal memuat data section. Pastikan backend Django aktif.");
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // FILTERING & STATISTIK
  // ==========================================
  const filteredData = sections.filter((item) => {
    const name = item.name || "";
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const totalSections = sections.length;

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
      alert("Gagal memuat detail section!");
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
        alert("Section berhasil ditambahkan!");
      } else if (formMode === "edit") {
        await api.put(`${BASE_URL}/${selectedId}/update/`, formData);
        alert("Data section berhasil diperbarui!");
      }
      setCurrentView("list");
      fetchSections();
    } catch (err) {
      console.error("SAVE ERROR:", err.response?.data || err);
      alert("Gagal menyimpan data section. Periksa kembali inputan Anda.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus data section ini?")) return;
    setLoading(true);
    try {
      await api.delete(`${BASE_URL}/${id}/delete/`);
      alert("Section berhasil dihapus!");
      setCurrentView("list");
      fetchSections();
    } catch (err) {
      alert("Gagal menghapus data section.");
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // VIEW 1: FORM VIEW
  // ==========================================
  if (currentView === "form") {
    return (
      <div className="page-container">
        <div className="page-header form-header-bordered">
          <div>
            <h3 style={{ margin: 0, color: "#0f172a" }}>
              {formMode === "create"
                ? "Tambah Section Baru"
                : formMode === "edit"
                ? `Edit Section: ${formData.name}`
                : `Detail Section: ${formData.name}`}
            </h3>
            <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: "13px" }}>
              Kelola entitas unit section / seksi kerja perusahaan
            </p>
          </div>
          <button onClick={() => setCurrentView("list")} className="btn btn-cancel">
            ← Kembali ke List
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ marginTop: "20px" }}>
          <div className="form-grid">
            <div className="form-group-full">
              <label className="form-label">Nama Section *</label>
              <input
                type="text"
                disabled={formMode === "detail"}
                placeholder="misal: Recruitment & Onboarding"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input-control"
                required
              />
            </div>
          </div>

          <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "20px" }}>
            {formMode === "detail" ? (
              <>
                {!loadingPermissions && hasAccess("SectionEdit") && (
                  <button type="button" onClick={() => setFormMode("edit")} className="btn btn-primary">
                    ✏️ Edit Section
                  </button>
                )}

                {!loadingPermissions && hasAccess("SectionDelete") && (
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
                    ? "Perbarui Section"
                    : "Simpan Section Baru"}
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
          <h2 style={{ margin: 0, color: "#0f172a" }}>Master Data Section</h2>
          <p style={{ margin: "5px 0 0", color: "#64748b", fontSize: "14px" }}>
            Kelola daftar section / sub-unit kerja
          </p>
        </div>
        <div className="page-header-actions">
          <button onClick={fetchSections} className="btn btn-secondary">
            🔄 Refresh Data
          </button>
          <button onClick={() => setShowExcelModal(true)} className="btn btn-secondary">
            📊 Import / Export Excel
          </button>
          <ExcelManagerModal
            isOpen={showExcelModal}
            onClose={() => setShowExcelModal(false)}
            targetModel="Employee"
          />
          {!loadingPermissions && hasAccess("SectionCreate") && (
            <button onClick={handleOpenCreate} className="btn btn-primary">
              + Tambah Section Baru
            </button>
          )}
        </div>
      </div>

      {/* STATISTIC CARDS */}
      <div className="stats-grid">
        <StatCard
          title="Total Section"
          count={totalSections}
          isActive={true}
        />
      </div>

      {/* REUSABLE FILTER BAR */}
      <FilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        placeholder="Cari Nama Section..."
      />

      {error && <div className="error-banner">{error}</div>}

      {/* TABLE DATA */}
      <div className="table-wrapper">
        <table className="custom-table">
          <thead>
            <tr>
              <th style={{ width: "80px" }}>No</th>
              <th>Nama Section</th>
              <th style={{ textAlign: "center", width: "180px" }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="3" className="table-empty-td">Memuat data section...</td>
              </tr>
            ) : filteredData.length === 0 ? (
              <tr>
                <td colSpan="3" className="table-empty-td">Tidak ada data section ditemukan.</td>
              </tr>
            ) : (
              filteredData.map((row, index) => (
                <tr key={row.id || index}>
                  <td>{index + 1}</td>
                  <td>
                    <strong>{row.name}</strong>
                  </td>
                  <td>
                    {!loadingPermissions && (
                      <div className="action-group">
                        {hasAccess("SectionDetail") && (
                          <button onClick={() => handleOpenDetail(row.id)} className="btn-action-view">
                            Buka
                          </button>
                        )}
                        {hasAccess("SectionDelete") && (
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

export default SectionPage;