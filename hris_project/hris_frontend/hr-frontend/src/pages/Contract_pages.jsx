import React, { useState, useEffect } from "react";
import api from "../api"; // Instance axios Anda

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
  const [userPermissions, setUserPermissions] = useState({
    isSuperuser: false,
    allowedCodenames: [],
  });
  const [loadingPermissions, setLoadingPermissions] = useState(true);

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
  const EMPLOYEE_URL = "/api/v1/onboarding/employees";

  // ----------------------------------------------------
  // FETCH USER PERMISSIONS
  // ----------------------------------------------------
  useEffect(() => {
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

    fetchPermissions();
  }, []);

  const hasAccess = (codename) => {
    if (userPermissions.isSuperuser) return true;
    return userPermissions.allowedCodenames.includes(codename);
  };

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

  // Helper Ambil Nama Karyawan
  const getEmployeeName = (item) => {
    if (item.employee_name) return item.employee_name;
    if (item.employee_detail && typeof item.employee_detail === "object") {
      return item.employee_detail.nama_lengkap || item.employee_detail.name;
    }
    if (item.employee && typeof item.employee === "object") {
      return item.employee.nama_lengkap || item.employee.name;
    }
    const empId = typeof item.employee === "object" ? item.employee?.id : item.employee;
    if (empId) {
      const found = employees.find((e) => String(e.id) === String(empId));
      if (found) return found.nama_lengkap || found.name;
    }
    return "-";
  };

  const getEmployeeNik = (item) => {
    if (item.employee_detail && typeof item.employee_detail === "object") {
      return item.employee_detail.nik_karyawan || "-";
    }
    if (item.employee && typeof item.employee === "object") {
      return item.employee.nik_karyawan || "-";
    }
    const empId = typeof item.employee === "object" ? item.employee?.id : item.employee;
    if (empId) {
      const found = employees.find((e) => String(e.id) === String(empId));
      if (found) return found.nik_karyawan || "-";
    }
    return "-";
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

    return diffDays <= 90;
  };

  const getDaysLeftLabel = (endDateStr) => {
    if (!endDateStr) return <span style={{ ...badgeStyle, background: "#e2e8f0", color: "#475569" }}>Permanen</span>;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endDate = new Date(endDateStr);

    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return <span style={{ ...badgeStyle, background: "#fee2e2", color: "#b91c1c" }}>Expired ({Math.abs(diffDays)} Hari Lalu)</span>;
    } else if (diffDays <= 90) {
      return <span style={{ ...badgeStyle, background: "#ffedd5", color: "#c2410c" }}>{diffDays} Hari Lagi</span>;
    } else {
      return <span style={{ ...badgeStyle, background: "#f1f5f9", color: "#334155" }}>{diffDays} Hari Lagi</span>;
    }
  };

  // ----------------------------------------------------
  // FILTERING & STATISTIK
  // ----------------------------------------------------
  const filteredData = contracts.filter((item) => {
    const empName = getEmployeeName(item);
    const empNik = getEmployeeNik(item);
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
      alert("Terjadi kesalahan saat menyimpan data kontrak.");
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

  // Helper Badge Color Tipe
  const getTypeBadge = (type) => {
    if (type === "PKWT") {
      return <span style={{ ...badgeStyle, background: "#fef3c7", color: "#b45309" }}>PKWT</span>;
    }
    return <span style={{ ...badgeStyle, background: "#dcfce7", color: "#15803d" }}>PKWTT</span>;
  };

  // ----------------------------------------------------
  // VIEW 1: FORM VIEW
  // ----------------------------------------------------
  if (currentView === "form") {
    return (
      <div style={containerStyle}>
        <div style={{ ...headerStyle, borderBottom: "1px solid #e2e8f0", paddingBottom: "15px" }}>
          <div>
            <h3 style={{ margin: 0, color: "#0f172a" }}>
              {formMode === "create" ? "Buat Kontrak Baru" : `Detail Kontrak: ${formData.name}`}
            </h3>
            <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: "13px" }}>
              Isi parameter dan durasi perjanjian kerja karyawan
            </p>
          </div>
          <button onClick={() => setCurrentView("list")} style={cancelButtonStyle}>
            ← Kembali ke List
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ marginTop: "20px" }}>
          <div style={formGridStyle}>
            <div style={{ gridColumn: "span 2" }}>
              <label style={labelStyle}>Nama / No. Kontrak *</label>
              <input
                type="text"
                disabled={formMode === "detail"}
                placeholder="misal: PKWT-2026/001"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                style={inputSearchStyle}
                required
              />
            </div>

            <div>
              <label style={labelStyle}>Tipe Kontrak *</label>
              <select
                disabled={formMode === "detail"}
                value={formData.contract_type}
                onChange={(e) => setFormData({ ...formData, contract_type: e.target.value })}
                style={selectStyle}
                required
              >
                <option value="PKWT">PKWT (Waktu Tentu)</option>
                <option value="PKWTT">PKWTT (Waktu Tidak Tentu)</option>
              </select>
            </div>

            <div>
              <label style={labelStyle}>Karyawan</label>
              <select
                disabled={formMode === "detail"}
                value={formData.employee}
                onChange={(e) => setFormData({ ...formData, employee: e.target.value })}
                style={selectStyle}
              >
                <option value="">-- Pilih Karyawan --</option>
                {employees.map((emp, index) => (
                  <option key={emp.id || index} value={emp.id}>
                    {emp.nama_lengkap || emp.name} ({emp.nik_karyawan || emp.nik || "Tanpa NIK"})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={labelStyle}>Tanggal Mulai</label>
              <input
                type="date"
                disabled={formMode === "detail"}
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                style={inputDateStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Tanggal Selesai</label>
              <input
                type="date"
                disabled={formMode === "detail"}
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                style={inputDateStyle}
              />
            </div>

            <div style={{ gridColumn: "span 2" }}>
              <label style={labelStyle}>Deskripsi / Catatan</label>
              <textarea
                rows="3"
                disabled={formMode === "detail"}
                placeholder="Catatan tambahan kontrak..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                style={{ ...inputSearchStyle, width: "100%", boxSizing: "border-box" }}
              ></textarea>
            </div>
          </div>

          <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "20px" }}>
            {formMode === "detail" ? (
              <>
                {!loadingPermissions && hasAccess("ContractUpdate") && (
                  <button type="button" onClick={() => setFormMode("edit")} style={primaryButtonStyle}>
                    Edit Kontrak
                  </button>
                )}
                {!loadingPermissions && hasAccess("ContractDelete") && (
                  <button type="button" onClick={() => handleDelete(selectedId)} style={clearFilterButtonStyle}>
                    Hapus
                  </button>
                )}
              </>
            ) : (
              <button type="submit" disabled={loading} style={primaryButtonStyle}>
                {loading ? "Menyimpan..." : "Simpan Kontrak"}
              </button>
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
    <div style={containerStyle}>
      {/* TITLE & SUBTITLE */}
      <div style={headerStyle}>
        <div>
          <h2 style={{ margin: 0, color: "#0f172a" }}>Master Data Kontrak</h2>
          <p style={{ margin: "5px 0 0", color: "#64748b", fontSize: "14px" }}>
            Kelola daftar dan tipe kontrak kerja karyawan
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button onClick={fetchContracts} style={refreshButtonStyle}>
            🔄 Refresh Data
          </button>
          {!loadingPermissions && hasAccess("ContractCreate") && (
            <button onClick={handleOpenCreate} style={primaryButtonStyle}>
              + Buat Kontrak Baru
            </button>
          )}
        </div>
      </div>

      {/* STATISTIC CARDS */}
      <div style={statsContainerStyle}>
        <div 
          onClick={() => setFilterType("ALL")}
          style={{
            ...statCardStyle,
            borderColor: filterType === "ALL" ? "#2563eb" : "#e2e8f0",
            cursor: "pointer"
          }}
        >
          <span style={statTitleStyle}>Total Kontrak</span>
          <span style={statNumberStyle}>{contracts.length}</span>
        </div>

        <div 
          onClick={() => setFilterType("PKWT")}
          style={{
            ...statCardStyle,
            borderColor: filterType === "PKWT" ? "#d97706" : "#e2e8f0",
            cursor: "pointer"
          }}
        >
          <span style={statTitleStyle}>Kontrak PKWT</span>
          <span style={{ ...statNumberStyle, color: "#d97706" }}>{totalPKWT}</span>
        </div>

        <div 
          onClick={() => setFilterType("PKWTT")}
          style={{
            ...statCardStyle,
            borderColor: filterType === "PKWTT" ? "#16a34a" : "#e2e8f0",
            cursor: "pointer"
          }}
        >
          <span style={statTitleStyle}>Kontrak PKWTT</span>
          <span style={{ ...statNumberStyle, color: "#16a34a" }}>{totalPKWTT}</span>
        </div>

        {/* STAT CARD KHUSUS EXPIRED SOON 90 HARI */}
        <div 
          onClick={() => setFilterType("EXPIRED_90_DAYS")}
          style={{
            ...statCardStyle,
            background: filterType === "EXPIRED_90_DAYS" ? "#fff7ed" : "#f8fafc",
            borderColor: filterType === "EXPIRED_90_DAYS" ? "#ea580c" : "#e2e8f0",
            cursor: "pointer"
          }}
        >
          <span style={{ ...statTitleStyle, color: "#c2410c" }}>⚠️ Expired Soon (&lt; 90 Hari)</span>
          <span style={{ ...statNumberStyle, color: "#ea580c" }}>{totalExpired90Days}</span>
        </div>
      </div>

      {/* FILTER BAR */}
      <div style={filterBarStyle}>
        <input
          type="text"
          placeholder="Cari No. Kontrak, Nama, NIK..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={inputSearchStyle}
        />

        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          style={selectStyle}
        >
          <option value="ALL">Semua Tipe Kontrak</option>
          <option value="PKWT">PKWT (Waktu Tentu)</option>
          <option value="PKWTT">PKWTT (Waktu Tidak Tentu)</option>
          <option value="EXPIRED_90_DAYS">⚠️ Akan Expired (&lt; 90 Hari)</option>
        </select>

        {filterType !== "ALL" && (
          <button onClick={() => setFilterType("ALL")} style={clearFilterButtonStyle}>
            Reset Filter
          </button>
        )}
      </div>

      {/* ERROR MESSAGE */}
      {error && <div style={errorBannerStyle}>{error}</div>}

      {/* TABLE DATA */}
      <div style={tableWrapperStyle}>
        <table style={tableStyle}>
          <thead>
            <tr style={tableHeaderRowStyle}>
              <th style={thStyle}>Nama Kontrak</th>
              <th style={thStyle}>Tipe</th>
              <th style={thStyle}>Karyawan</th>
              <th style={thStyle}>Tanggal Mulai</th>
              <th style={thStyle}>Tanggal Selesai</th>
              <th style={thStyle}>Sisa Waktu</th>
              <th style={{ ...thStyle, textAlign: "center" }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" style={emptyTdStyle}>
                  Memuat data kontrak...
                </td>
              </tr>
            ) : filteredData.length === 0 ? (
              <tr>
                <td colSpan="7" style={emptyTdStyle}>
                  Tidak ada data kontrak ditemukan.
                </td>
              </tr>
            ) : (
              filteredData.map((row, index) => (
                <tr key={row.id || index} style={tableBodyRowStyle}>
                  <td style={tdStyle}>
                    <strong style={{ color: "#2563eb" }}>{row.name}</strong>
                  </td>
                  <td style={tdStyle}>{getTypeBadge(row.contract_type)}</td>
                  <td style={tdStyle}>
                    <strong>{getEmployeeName(row)}</strong>
                    <br />
                    <small style={{ color: "#64748b" }}>
                      NIK: {getEmployeeNik(row)}
                    </small>
                  </td>
                  <td style={tdStyle}>{row.start_date || "-"}</td>
                  <td style={tdStyle}>{row.end_date || "-"}</td>
                  <td style={tdStyle}>{getDaysLeftLabel(row.end_date)}</td>
                  <td style={{ ...tdStyle, textAlign: "center" }}>
                    {!loadingPermissions && (
                      <>
                        {hasAccess("ContractDetail") && (
                          <button
                            onClick={() => handleOpenDetail(row.id)}
                            style={actionButtonStyle}
                          >
                            Buka
                          </button>
                        )}
                        {" "}
                        {hasAccess("ContractDelete") && (
                          <button
                            onClick={() => handleDelete(row.id)}
                            style={actionDeleteStyle}
                          >
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

const containerStyle = {
  background: "#ffffff",
  padding: "24px",
  borderRadius: "12px",
  boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
  fontFamily: "Arial, sans-serif",
};

const headerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "20px",
};

const refreshButtonStyle = {
  padding: "8px 16px",
  background: "#f1f5f9",
  color: "#334155",
  border: "1px solid #cbd5e1",
  borderRadius: "6px",
  cursor: "pointer",
  fontWeight: "bold",
  fontSize: "13px",
};

const primaryButtonStyle = {
  padding: "8px 16px",
  background: "#2563eb",
  color: "#ffffff",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
  fontWeight: "bold",
  fontSize: "13px",
};

const cancelButtonStyle = {
  padding: "8px 16px",
  background: "#64748b",
  color: "#ffffff",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
  fontWeight: "bold",
  fontSize: "13px",
};

const statsContainerStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
  gap: "15px",
  marginBottom: "20px",
};

const statCardStyle = {
  background: "#f8fafc",
  padding: "16px",
  borderRadius: "8px",
  border: "1px solid #e2e8f0",
  display: "flex",
  flexDirection: "column",
  transition: "all 0.2s ease-in-out",
};

const statTitleStyle = {
  fontSize: "12px",
  color: "#64748b",
  fontWeight: "bold",
};

const statNumberStyle = {
  fontSize: "22px",
  fontWeight: "bold",
  marginTop: "5px",
  color: "#0f172a",
};

const filterBarStyle = {
  display: "flex",
  gap: "12px",
  marginBottom: "20px",
  flexWrap: "wrap",
};

const inputSearchStyle = {
  flex: 1,
  minWidth: "200px",
  padding: "10px 12px",
  border: "1px solid #cbd5e1",
  borderRadius: "6px",
  fontSize: "14px",
};

const inputDateStyle = {
  width: "100%",
  padding: "10px 12px",
  border: "1px solid #cbd5e1",
  borderRadius: "6px",
  fontSize: "14px",
  boxSizing: "border-box",
};

const selectStyle = {
  padding: "10px 12px",
  border: "1px solid #cbd5e1",
  borderRadius: "6px",
  fontSize: "14px",
  background: "#fff",
  minWidth: "180px",
  boxSizing: "border-box",
};

const clearFilterButtonStyle = {
  padding: "10px 12px",
  background: "#ef4444",
  color: "#fff",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
  fontSize: "13px",
};

const errorBannerStyle = {
  padding: "12px",
  background: "#fee2e2",
  color: "#b91c1c",
  borderRadius: "6px",
  marginBottom: "15px",
  fontSize: "14px",
};

const tableWrapperStyle = {
  overflowX: "auto",
  border: "1px solid #e2e8f0",
  borderRadius: "8px",
};

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
  textAlign: "left",
  fontSize: "14px",
};

const tableHeaderRowStyle = {
  background: "#f8fafc",
  borderBottom: "2px solid #e2e8f0",
};

const thStyle = {
  padding: "12px 16px",
  color: "#475569",
  fontWeight: "bold",
};

const tableBodyRowStyle = {
  borderBottom: "1px solid #f1f5f9",
};

const tdStyle = {
  padding: "12px 16px",
  color: "#334155",
  verticalAlign: "middle",
};

const emptyTdStyle = {
  padding: "30px",
  textAlign: "center",
  color: "#94a3b8",
};

const badgeStyle = {
  display: "inline-block",
  padding: "4px 10px",
  borderRadius: "20px",
  fontSize: "12px",
  fontWeight: "bold",
};

const actionButtonStyle = {
  padding: "6px 12px",
  background: "#f1f5f9",
  color: "#334155",
  border: "1px solid #cbd5e1",
  borderRadius: "4px",
  cursor: "pointer",
  fontSize: "12px",
};

const actionDeleteStyle = {
  padding: "6px 12px",
  background: "#fee2e2",
  color: "#b91c1c",
  border: "1px solid #fca5a5",
  borderRadius: "4px",
  cursor: "pointer",
  fontSize: "12px",
};

const formGridStyle = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "16px",
};

const labelStyle = {
  display: "block",
  fontSize: "12px",
  fontWeight: "bold",
  color: "#475569",
  marginBottom: "6px",
};

export default ContractPage;