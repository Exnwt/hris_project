import React, { useState, useEffect } from "react";
import api from "../api";
import { StatCard, FilterBar } from "../components/StatisticCard_component";
import { usePermissions } from "../auth/auth";
import "../styles/MasterData.css";
import ExcelManagerModal from "../components/ExcelManagerModal";


const DepartmentPage = () => {
  const [showExcelModal, setShowExcelModal] = useState(false);
  const { hasAccess, loadingPermissions } = usePermissions();
  const [currentView, setCurrentView] = useState("list");
  const [formMode, setFormMode] = useState("create");

  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedId, setSelectedId] = useState(null);

  // State Filter Pencarian
  const [searchQuery, setSearchQuery] = useState("");

  // State Form dengan field name, code, dan zk_id
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    zk_id: "",
  });

  const BASE_URL = "/api/v1/master-data/Department";

  useEffect(() => {
    fetchDepartment();
  }, []);

  const fetchDepartment = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get(`${BASE_URL}/`);
      const data = response.data.results || response.data || [];
      setDepartments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Gagal mengambil data Department:", err);
      setError("Gagal memuat data Department");
    } finally {
      setLoading(false);
    }
  };

  // Filter Data berdasarkan Name atau Code
  const filteredData = departments.filter((item) => {
    const name = item.name || "";
    const code = item.code || "";
    const zkId = String(item.zk_id || "");

    const query = searchQuery.toLowerCase();
    return (
      name.toLowerCase().includes(query) ||
      code.toLowerCase().includes(query) ||
      zkId.includes(query)
    );
  });

  const handleOpenCreate = () => {
    setFormData({
      name: "",
      code: "",
      zk_id: "",
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
        code: data.code || "",
        zk_id: data.zk_id || "",
      });
      setFormMode("detail");
      setCurrentView("form");
    } catch (err) {
      alert("Gagal memuat detail Department");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);

    const payload = {
      name: formData.name,
      code: formData.code || null,
    };

    try {
      if (formMode === "create") {
        await api.post(`${BASE_URL}/create/`, payload);
        alert("Data Department berhasil ditambahkan!");
      } else if (formMode === "edit") {
        await api.put(`${BASE_URL}/${selectedId}/update/`, payload);
        alert("Data Department berhasil diperbarui!");
      }
      setCurrentView("list");
      fetchDepartment();
    } catch (error) {
      const errDetail = error.response?.data?.detail || "Proses gagal, mohon periksa kembali inputan Anda.";
      alert(`❌ GAGAL SIMPAN:\n\n${errDetail}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus data Department ini?")) return;
    setLoading(true);
    try {
      await api.delete(`${BASE_URL}/${id}/delete/`);
      alert("Data Department berhasil dihapus!");
      setCurrentView("list");
      fetchDepartment();
    } catch (err) {
      alert("Gagal menghapus data Department.");
    } finally {
      setLoading(false);
    }
  };

  const departmentZKTecoSync = async () => {
    if (!selectedId) {
      alert("Detail Informasi Department Tidak Bisa Didapatkan.");
      return;
    }
    setLoading(true);
    try {
      const syncResponse = await api.post("/api/v2/system/zkteco/departmentSync/", {
        department_id: selectedId,
      });
      const successMessage = syncResponse.data?.message || "Berhasil melakukan sinkronisasi ke ZKTeco BioTime!";
      const zkId = syncResponse.data?.zk_id;
      
      alert(`✅ SINKRONISASI BERHASIL!\n\n${successMessage}\nID BioTime: ${zkId || "-"}`);
      
      // Re-fetch detail terbaru agar zk_id & code ter-update pada form
      handleOpenDetail(selectedId);
      fetchDepartment();
    } catch (error) {
      console.error("Gagal Push ke ZKTeco:", error.response?.data || error.message);
      const errData = error.response?.data;
      let errorMessage = "Terjadi kesalahan sistem saat menghubungi server ZKTeco.";

      if (errData) {
        if (typeof errData.detail === "string") {
          errorMessage = errData.detail;
        } else if (errData.error && typeof errData.error === "object") {
          errorMessage = JSON.stringify(errData.error);
        } else if (typeof errData === "string") {
          errorMessage = errData;
        } else {
          errorMessage = JSON.stringify(errData);
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      alert(`❌ GAGAL SYNC ZKTECO:\n\n${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const totalDepartments = departments.length;
  const totalZkMapped = departments.filter((d) => d.zk_id).length;

  // Cek apakah zk_id sudah ada
  const isZkMapped = Boolean(formData.zk_id);

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
                ? "Tambah Department Baru"
                : formMode === "edit"
                ? `Edit Department: ${formData.name}`
                : `Detail Department: ${formData.name}`}
            </h3>
          </div>
          <div className="page-header-actions">
            <button onClick={() => setCurrentView("list")} className="btn btn-cancel">
              ← Kembali ke List
            </button>
            {formMode === "detail" && (
              <button onClick={departmentZKTecoSync} disabled={loading} className="btn btn-primary">
                Sync to ZKTeco
              </button>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ marginTop: "20px" }}>
          <div className="form-grid">
            {/* Nama Department */}
            <div>
              <label className="form-label">Nama Department *</label>
              <input
                type="text"
                disabled={formMode === "detail"}
                placeholder="misal: Information Technology"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input-control"
                required
              />
            </div>

            {/* Department Code: Readonly jika sudah terhubung zk_id atau dalam mode detail */}
            <div>
              <label className="form-label">
                Department Code {isZkMapped && <span style={{ color: "#2563eb", fontSize: "11px" }}>(Locked by ZKTeco)</span>}
              </label>
              <input
                type="text"
                disabled={formMode === "detail" || isZkMapped}
                placeholder={isZkMapped ? "Otomatis tersinkron dari ZKTeco" : "misal: DEPT-IT"}
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className="input-control"
                style={isZkMapped ? { backgroundColor: "#f1f5f9", cursor: "not-allowed" } : {}}
              />
            </div>

            {/* ZKTeco Department ID: Selalu Readonly */}
            <div className="form-group-full">
              <label className="form-label">ZKTeco Department ID (BioTime Auto Sync)</label>
              <input
                type="text"
                disabled={true}
                placeholder="Unmapped (Klik 'Sync to ZKTeco' untuk menghubungkan)"
                value={formData.zk_id || ""}
                className="input-control"
                style={{ backgroundColor: "#f8fafc", cursor: "not-allowed", color: "#1e293b", fontWeight: "bold" }}
              />
            </div>
          </div>

          <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "20px" }}>
            {formMode === "detail" ? (
              <>
                {!loadingPermissions && hasAccess("DepartmentEdit") && (
                  <button type="button" onClick={() => setFormMode("edit")} className="btn btn-primary">
                    ✏️ Edit Department
                  </button>
                )}
                {!loadingPermissions && hasAccess("DepartmentDelete") && (
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
                    ? "Perbarui Department"
                    : "Simpan Department Baru"}
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
      <div className="page-header">
        <div>
          <h2 style={{ margin: 0, color: "#0f172a" }}>Department Master Data</h2>
          <p style={{ margin: "5px 0 0", color: "#64748b", fontSize: "14px" }}>
            Kelola Master Data Department dan Pemetaan ZKTeco BioTime
          </p>
        </div>
        <div className="page-header-actions">
          <button onClick={() => setShowExcelModal(true)} className="btn btn-secondary">
            📊 Import / Export Excel
          </button>
          <ExcelManagerModal
            isOpen={showExcelModal}
            onClose={()=> setShowExcelModal(false)}
            targetModel="Department"
          />
          <button onClick={fetchDepartment} className="btn btn-secondary">
            🔄 Refresh Data
          </button>
          {!loadingPermissions && hasAccess("DepartmentCreate") && (
            <button onClick={handleOpenCreate} className="btn btn-primary">
              + Tambah Department Baru
            </button>
          )}
        </div>
      </div>

      <div className="stats-grid">
        <StatCard title="Total Department" count={totalDepartments} isActive={true} />
        <StatCard 
          title="Terhubung ZKTeco" 
          count={totalZkMapped} 
          color="#16a34a" 
          bgColor="#f0fdf4" 
          borderColor="#bbf7d0" 
        />
      </div>

      <FilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        placeholder="Cari Kode, Nama Department, atau ZK ID..."
      />

      {error && <div className="error-banner">{error}</div>}

      <div className="table-wrapper">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Nama Department</th>
              <th>Department Code</th>
              <th>ZKTeco ID</th>
              <th style={{ textAlign: "center" }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="4" className="table-empty-td">Memuat data Department...</td>
              </tr>
            ) : filteredData.length === 0 ? (
              <tr>
                <td colSpan="4" className="table-empty-td">Tidak ada data Department ditemukan.</td>
              </tr>
            ) : (
              filteredData.map((row, index) => (
                <tr key={row.id || index}>
                  <td>
                    <strong>{row.name}</strong>
                  </td>
                  <td>{row.code || "-"}</td>
                  <td>
                    {row.zk_id ? (
                      <span className="badge badge-success">
                        ZK ID: {row.zk_id}
                      </span>
                    ) : (
                      <span style={{ color: "#94a3b8", fontSize: "12px" }}>Unmapped</span>
                    )}
                  </td>
                  <td>
                    {!loadingPermissions && (
                      <div className="action-group">
                        {hasAccess("DepartmentDetail") && (
                          <button onClick={() => handleOpenDetail(row.id)} className="btn-action-view">
                            Buka
                          </button>
                        )}
                        {hasAccess("DepartmentDelete") && (
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

export default DepartmentPage;