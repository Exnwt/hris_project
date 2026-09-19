import React, { useState, useEffect } from "react";
import api from "../api";
// FilterBar bawaan tidak dipakai karena halaman ini butuh Filter khusus (Select PKWT), jadi kita buat custom filter.
import { StatCard } from "../components/StatisticCard_component"; 
import { usePermissions } from "../auth/auth";
import "../styles/MasterData.css"; // Sesuaikan path jika berbeda

const ContractPage = () => {
  // State Navigasi View ('list' | 'form')
  const [currentView, setCurrentView] = useState("list");
  const [formMode, setFormMode] = useState("create"); // 'create' | 'edit' | 'detail'

  // State Data Main
  const [contracts, setContracts] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedId, setSelectedId] = useState(null);

  // Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("ALL"); // ALL | PKWT | PKWTT | EXPIRED_90_DAYS

  // State Permission User
  const { hasAccess, loadingPermissions } = usePermissions();

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    contract_type: "PKWT",
    employee: "",
    start_date: "",
    end_date: "",
    description: "",
  });

  const BASE_URL = "/api/v1/master-data/ContractList";
  const EMPLOYEE_URL = "/api/v1/master-data/Employees";

  // ----------------------------------------------------
  // FETCH DATA
  // ----------------------------------------------------
  useEffect(() => {
    fetchContracts();
    fetchEmployees();
  }, []);

  const fetchContracts = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get(`${BASE_URL}/`);
      const data = response.data.results || response.data || [];
      setContracts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Gagal mengambil data kontrak:", err);
      setError("Gagal memuat data kontrak. Pastikan server Django aktif.");
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await api.get(`${EMPLOYEE_URL}/`);
      const data = response.data.results || response.data || [];
      setEmployees(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Gagal mengambil master data karyawan:", err);
    }
  };

  // ----------------------------------------------------
  // HELPER MENGHITUNG SISA HARI / EXPIRED 90 HARI
  // ----------------------------------------------------
  const isExpiringWithin90Days = (endDateStr) => {
    if (!endDateStr) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endDate = new Date(endDateStr);

    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    console.log('diffdays', diffDays)
    return diffDays <= 90;
  };

  const getDaysLeftLabel = (endDateStr) => {
    if (!endDateStr) return <span className="badge badge-default">Permanen</span>;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endDate = new Date(endDateStr);

    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return <span className="badge" style={{ background: "#fee2e2", color: "#b91c1c" }}>Expired ({Math.abs(diffDays)} Hari Lalu)</span>;
    } else if (diffDays <= 90) {
      return <span className="badge" style={{ background: "#ffedd5", color: "#c2410c" }}>{diffDays} Hari Lagi</span>;
    } else {
      return <span className="badge badge-default">{diffDays} Hari Lagi</span>;
    }
  };

  const getTypeBadge = (type) => {
    if (type === "PKWT") {
      return <span className="badge" style={{ background: "#fef3c7", color: "#b45309" }}>PKWT</span>;
    }
    return <span className="badge badge-success">PKWTT</span>;
  };

  // ----------------------------------------------------
  // FILTERING & STATISTIK
  // ----------------------------------------------------
  const filteredData = contracts.filter((item) => {
    const empName = item.employee_detail?.nama_lengkap || item.employee_name || "";
    const empNik = item.employee_detail?.nik_karyawan || "";
    const contractName = item.name || "";
    const matchesSearch =
      empName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      empNik.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contractName.toLowerCase().includes(searchQuery.toLowerCase());

    let matchesType = true;
    if (filterType === "PKWT") matchesType = item.contract_type === "PKWT";
    else if (filterType === "PKWTT") matchesType = item.contract_type === "PKWTT";
    else if (filterType === "EXPIRED_90_DAYS") matchesType = isExpiringWithin90Days(item.end_date);

    return matchesSearch && matchesType;
  });

  const totalPKWT = contracts.filter((i) => i.contract_type === "PKWT").length;
  const totalPKWTT = contracts.filter((i) => i.contract_type === "PKWTT").length;
  const totalExpired90Days = contracts.filter((i) => isExpiringWithin90Days(i.end_date)).length;

  // ----------------------------------------------------
  // HANDLERS FORM & ACTION
  // ----------------------------------------------------
  const handleOpenCreate = () => {
    setFormData({
      name: "",
      contract_type: "PKWT",
      employee: "",
      start_date: "",
      end_date: "",
      description: "",
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

      let employeeId = "";
      if (data.employee && typeof data.employee === "object") {
        employeeId = data.employee.id || "";
      } else if (data.employee !== null && data.employee !== undefined) {
        employeeId = data.employee;
      }

      setFormData({
        name: data.name || "",
        contract_type: data.contract_type || "PKWT",
        employee: employeeId,
        start_date: data.start_date || "",
        end_date: data.end_date || "",
        description: data.description || "",
      });
      setFormMode("detail");
      setCurrentView("form");
    } catch (err) {
      alert("Gagal memuat detail data!");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);

    const parsedEmployeeId =
      formData.employee !== "" && !isNaN(formData.employee)
        ? parseInt(formData.employee, 10)
        : null;

    const payload = {
      name: formData.name,
      contract_type: formData.contract_type,
      employee: parsedEmployeeId,
      start_date: formData.start_date || null,
      end_date: formData.end_date || null,
      description: formData.description || null,
    };

    try {
      if (formMode === "create") {
        await api.post(`${BASE_URL}/create/`, payload);
        alert("Kontrak berhasil dibuat!");
      } else if (formMode === "edit") {
        await api.put(`${BASE_URL}/${selectedId}/update/`, payload);
        alert("Kontrak berhasil diperbarui!");
      }
      setCurrentView("list");
      fetchContracts();
    } catch (err) {
      alert("Terjadi kesalahan saat menyimpan data kontrak. Pastikan inputan sudah benar.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus kontrak ini?")) return;
    setLoading(true);
    try {
      await api.delete(`${BASE_URL}/${id}/delete/`);
      alert("Kontrak berhasil dihapus!");
      setCurrentView("list");
      fetchContracts();
    } catch (err) {
      alert("Gagal menghapus data kontrak.");
    } finally {
      setLoading(false);
    }
  };

  // ----------------------------------------------------
  // VIEW 1: FORM VIEW
  // ----------------------------------------------------
  if (currentView === "form") {
    return (
      <div className="page-container">
        <div className="page-header form-header-bordered">
          <div>
            <h3 style={{ margin: 0, color: "#0f172a" }}>
              {formMode === "create" ? "Buat Kontrak Baru" : `Detail Kontrak: ${formData.name}`}
            </h3>
            <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: "13px" }}>
              Isi parameter dan durasi perjanjian kerja karyawan
            </p>
          </div>
          <button onClick={() => setCurrentView("list")} className="btn btn-cancel">
            ← Kembali ke List
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ marginTop: "20px" }}>
          <div className="form-grid">
            <div className="form-group-full">
              <label className="form-label">Nama / No. Kontrak *</label>
              <input
                type="text"
                disabled={formMode === "detail"}
                placeholder="misal: PKWT-2026/001"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input-control"
                required
              />
            </div>

            <div>
              <label className="form-label">Tipe Kontrak *</label>
              <select
                disabled={formMode === "detail"}
                value={formData.contract_type}
                onChange={(e) => setFormData({ ...formData, contract_type: e.target.value })}
                className="select-control"
                required
              >
                <option value="PKWT">PKWT (Waktu Tentu)</option>
                <option value="PKWTT">PKWTT (Waktu Tidak Tentu)</option>
              </select>
            </div>

            <div>
              <label className="form-label">Karyawan</label>
              <select
                disabled={formMode === "detail"}
                value={formData.employee}
                onChange={(e) => setFormData({ ...formData, employee: e.target.value })}
                className="select-control"
              >
                <option value="">-- Pilih Karyawan --</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.nama_lengkap || emp.name} ({emp.nik_ktp || emp.nik_karyawan || "Tanpa NIK"})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label">Tanggal Mulai</label>
              <input
                type="date"
                disabled={formMode === "detail"}
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                className="input-control"
              />
            </div>

            <div>
              <label className="form-label">Tanggal Selesai</label>
              <input
                type="date"
                disabled={formMode === "detail"}
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                className="input-control"
              />
            </div>

            <div className="form-group-full">
              <label className="form-label">Deskripsi / Catatan</label>
              <textarea
                rows="3"
                disabled={formMode === "detail"}
                placeholder="Catatan tambahan kontrak..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="input-control"
                style={{ resize: "vertical" }}
              ></textarea>
            </div>
          </div>

          <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "20px" }}>
            {formMode === "detail" ? (
              <>
                {!loadingPermissions && hasAccess("ContractUpdate") && (
                  <button type="button" onClick={() => setFormMode("edit")} className="btn btn-primary">
                    ✏️ Edit Kontrak
                  </button>
                )}
                {!loadingPermissions && hasAccess("ContractDelete") && (
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
                  {loading ? "Menyimpan..." : (formMode === "edit" ? "Perbarui Kontrak" : "Simpan Kontrak")}
                </button>
              </>
            )}
          </div>
        </form>
      </div>
    );
  }

  // ----------------------------------------------------
  // VIEW 2: LIST VIEW
  // ----------------------------------------------------
  return (
    <div className="page-container">
      {/* TITLE & SUBTITLE */}
      <div className="page-header">
        <div>
          <h2 style={{ margin: 0, color: "#0f172a" }}>Master Data Kontrak</h2>
          <p style={{ margin: "5px 0 0", color: "#64748b", fontSize: "14px" }}>
            Kelola daftar dan tipe kontrak kerja karyawan
          </p>
        </div>
        <div className="page-header-actions">
          <button onClick={fetchContracts} className="btn btn-secondary">
            🔄 Refresh Data
          </button>
          {!loadingPermissions && hasAccess("ContractCreate") && (
            <button onClick={handleOpenCreate} className="btn btn-primary">
              + Buat Kontrak Baru
            </button>
          )}
        </div>
      </div>

      {/* STATISTIC CARDS (Clickable for Filtering) */}
      <div className="stats-grid">
        <div 
          onClick={() => setFilterType("ALL")}
          className="stat-card-box"
          style={{ borderColor: filterType === "ALL" ? "#2563eb" : "#e2e8f0", cursor: "pointer" }}
        >
          <span className="stat-card-title">Total Kontrak</span>
          <span className="stat-card-number">{contracts.length}</span>
        </div>

        <div 
          onClick={() => setFilterType("PKWT")}
          className="stat-card-box"
          style={{ borderColor: filterType === "PKWT" ? "#d97706" : "#e2e8f0", cursor: "pointer" }}
        >
          <span className="stat-card-title">Kontrak PKWT</span>
          <span className="stat-card-number" style={{ color: "#d97706" }}>{totalPKWT}</span>
        </div>

        <div 
          onClick={() => setFilterType("PKWTT")}
          className="stat-card-box"
          style={{ borderColor: filterType === "PKWTT" ? "#16a34a" : "#e2e8f0", cursor: "pointer" }}
        >
          <span className="stat-card-title">Kontrak PKWTT</span>
          <span className="stat-card-number" style={{ color: "#16a34a" }}>{totalPKWTT}</span>
        </div>

        <div 
          onClick={() => setFilterType("EXPIRED_90_DAYS")}
          className="stat-card-box"
          style={{
            background: filterType === "EXPIRED_90_DAYS" ? "#fff7ed" : "#f8fafc",
            borderColor: filterType === "EXPIRED_90_DAYS" ? "#ea580c" : "#e2e8f0",
            cursor: "pointer"
          }}
        >
          <span className="stat-card-title" style={{ color: "#c2410c" }}>⚠️ Expired Soon (&lt; 90 Hari)</span>
          <span className="stat-card-number" style={{ color: "#ea580c" }}>{totalExpired90Days}</span>
        </div>
      </div>

      {/* CUSTOM FILTER BAR UNTUK KONTRAK */}
      <div style={{ display: "flex", gap: "12px", marginBottom: "20px", flexWrap: "wrap" }}>
        <input
          type="text"
          placeholder="Cari No. Kontrak, Nama, NIK..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="input-control"
          style={{ flex: 1, minWidth: "200px" }}
        />

        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="select-control"
          style={{ width: "auto", minWidth: "200px" }}
        >
          <option value="ALL">Semua Tipe Kontrak</option>
          <option value="PKWT">PKWT (Waktu Tentu)</option>
          <option value="PKWTT">PKWTT (Waktu Tidak Tentu)</option>
          <option value="EXPIRED_90_DAYS">⚠️ Akan Expired (&lt; 90 Hari)</option>
        </select>

        {filterType !== "ALL" && (
          <button type="button" onClick={() => setFilterType("ALL")} className="btn btn-danger">
            Reset Filter
          </button>
        )}
      </div>

      {/* ERROR MESSAGE */}
      {error && <div className="error-banner">{error}</div>}

      {/* TABLE DATA */}
      <div className="table-wrapper">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Nama Kontrak</th>
              <th>Tipe</th>
              <th>Karyawan</th>
              <th>Tanggal Mulai</th>
              <th>Tanggal Selesai</th>
              <th>Sisa Waktu</th>
              <th style={{ textAlign: "center" }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" className="table-empty-td">Memuat data kontrak...</td>
              </tr>
            ) : filteredData.length === 0 ? (
              <tr>
                <td colSpan="7" className="table-empty-td">Tidak ada data kontrak ditemukan.</td>
              </tr>
            ) : (
              filteredData.map((row, index) => (
                <tr key={row.id || index}>
                  <td>
                    <strong style={{ color: "#2563eb" }}>{row.name}</strong>
                  </td>
                  <td>{getTypeBadge(row.contract_type)}</td>
                  <td>
                    {/* ✅ Perbaikan Optional Chaining di sini agar tidak crash */}
                    <strong>{row.employee_detail?.nama_lengkap || row.employee_name || "-"}</strong>
                    <br />
                    <small style={{ color: "#64748b" }}>
                      NIK: {row.employee_detail?.nik_karyawan || "-"}
                    </small>
                  </td>
                  <td>{row.start_date || "-"}</td>
                  <td>{row.end_date || "-"}</td>
                  <td>{getDaysLeftLabel(row.end_date)}</td>
                  <td>
                    {!loadingPermissions && (
                      <div className="action-group">
                        {hasAccess("ContractRead") && (
                          <button
                            type="button"
                            onClick={() => handleOpenDetail(row.id)}
                            className="btn-action-view"
                          >
                            Buka
                          </button>
                        )}
                        {hasAccess("ContractDelete") && (
                          <button
                            type="button"
                            onClick={() => handleDelete(row.id)}
                            className="btn-action-delete"
                          >
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

export default ContractPage;