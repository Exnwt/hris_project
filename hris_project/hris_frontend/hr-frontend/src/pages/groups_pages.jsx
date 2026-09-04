import React, { useState, useEffect } from "react";
import api from "../api"; // Instance axios Anda

// =========================================================
// SUB-KOMPONEN: MANAGING API ACCESS (MODAL DEDIKASI GROUP)
// =========================================================
const GroupAccessManager = ({ group, onClose }) => {
  const [templates, setTemplates] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (group?.id) {
      fetchTemplates();
      fetchGroupAccess();
    }
  }, [group?.id]);

  // 1. Ambil Semua Template API Endpoint
  const fetchTemplates = async () => {
    try {
      const response = await api.get("api/v2/access/APIEndpoints/");
      const data = response.data.results || response.data || [];
      setTemplates(Array.isArray(data) ? data : []);
    } catch (err) {
      setError("Gagal mengambil daftar Access API Endpoints.");
    }
  };

  // 2. Ambil List Access yang Sudah Dimiliki oleh Group
  const fetchGroupAccess = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await api.get(`api/v2/access/Group-AA/?group=${group.id}`);
      const data = response.data.results || response.data || [];
      setAssignments(Array.isArray(data) ? data : []);
    } catch (err) {
      setError("Gagal mengambil data akses API group.");
    } finally {
      setLoading(false);
    }
  };

  const isAssigned = (apiEndpointId) => {
    return assignments.some((item) => item.api_endpoint === apiEndpointId);
  };

  const getAssignment = (apiEndpointId) => {
    return assignments.find((item) => item.api_endpoint === apiEndpointId);
  };

  // 3. Toggle Checkbox Access
  const handleToggle = async (template) => {
    try {
      setSavingId(template.id);
      const assignment = getAssignment(template.id);

      if (assignment) {
        // Hapus Akses (DELETE)
        await api.delete(`api/v2/access/Group-AA/${assignment.id}/`);
      } else {
        // Tambah Akses (POST)
        await api.post("api/v2/access/Group-AA/", {
          group: group.id,
          api_endpoint: template.id,
        });
      }
      await fetchGroupAccess();
    } catch (err) {
      console.error("Gagal mengubah akses:", err);
      alert(err.response?.data?.detail || "Gagal mengubah akses API Endpoint.");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div style={overlayStyle}>
      <div style={modalAccessBoxStyle}>
        {/* Header Modal */}
        <div style={accessHeaderStyle}>
          <div>
            <h3 style={{ margin: 0, color: "#0f172a" }}>🔒 Manage API Access</h3>
            <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: "13px" }}>
              Atur izin API Endpoints untuk Role / Group: <strong style={{ color: "#2563eb" }}>{group.name}</strong>
            </p>
          </div>
          <button onClick={onClose} style={closeModalBtnStyle}>✕</button>
        </div>

        {error && <div style={errorBannerStyle}>{error}</div>}

        {/* List Template API Endpoints */}
        {loading ? (
          <p style={{ padding: "20px", textAlign: "center", color: "#64748b" }}>Memuat daftar akses...</p>
        ) : (
          <div style={templateScrollBoxStyle}>
            {templates.length === 0 ? (
              <p style={{ textAlign: "center", color: "#94a3b8", padding: "20px" }}>Belum ada master API Endpoint.</p>
            ) : (
              templates.map((template) => {
                const checked = isAssigned(template.id);
                const isSaving = savingId === template.id;

                return (
                  <div
                    key={template.id}
                    style={{
                      ...templateCardStyle,
                      borderLeft: checked ? "4px solid #2563eb" : "1px solid #cbd5e1",
                      background: checked ? "#f0f6ff" : "#ffffff",
                    }}
                  >
                    <label style={templateLabelStyle}>
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={isSaving}
                        onChange={() => handleToggle(template)}
                        style={checkboxStyle}
                      />
                      <div>
                        <strong style={{ color: "#0f172a", fontSize: "14px" }}>
                          {template.name}
                        </strong>
                        <br />
                        <small style={{ color: "#2563eb", fontWeight: "bold" }}>
                          Code: {template.code_name}
                        </small>
                        {template.description && (
                          <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#64748b" }}>
                            {template.description}
                          </p>
                        )}
                      </div>
                    </label>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Footer */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "15px", paddingTop: "12px", borderTop: "1px solid #e2e8f0" }}>
          <button onClick={onClose} style={cancelButtonStyle}>Selesai & Tutup</button>
        </div>
      </div>
    </div>
  );
};


// =========================================================
// HALAMAN UTAMA: GROUP PAGES
// =========================================================
const GroupPages = () => {
  const [groups, setGroups] = useState([]);
  const [permissionsList, setPermissionsList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Modal State Group Form
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [formData, setFormData] = useState({ name: "", permissions: [] });

  // Modal State API Access Manager
  const [selectedAccessGroup, setSelectedAccessGroup] = useState(null);

  // Filter State
  const [searchQuery, setSearchQuery] = useState("");

  // URL Endpoints Sesuai urls.py
  const BASE_URL = "api/v2/groups/";
  const PERMISSIONS_URL = "api/v2/permissions/";

  useEffect(() => {
    fetchGroups();
    fetchPermissions();
  }, []);

  const fetchGroups = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get(BASE_URL);
      const data = response.data.results || response.data || [];
      setGroups(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Gagal mengambil data groups:", err);
      setError("Gagal memuat data Group.");
    } finally {
      setLoading(false);
    }
  };

  const fetchPermissions = async () => {
    try {
      const response = await api.get(PERMISSIONS_URL);
      const data = response.data.results || response.data || [];
      setPermissionsList(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn("Gagal memuat Django permissions:", err);
    }
  };

  const filteredData = groups.filter((group) =>
    (group.name || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenModal = (group = null) => {
    setEditItem(group);
    if (group) {
      setFormData({
        name: group.name || "",
        permissions: group.permissions || [],
      });
    } else {
      setFormData({ name: "", permissions: [] });
    }
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditItem(null);
  };

  const handlePermissionToggle = (permId) => {
    setFormData((prev) => {
      const exists = prev.permissions.includes(permId);
      return {
        ...prev,
        permissions: exists
          ? prev.permissions.filter((id) => id !== permId)
          : [...prev.permissions, permId],
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editItem) {
        await api.put(`${BASE_URL}${editItem.id}/`, formData);
        alert("Group berhasil diperbarui!");
      } else {
        await api.post(BASE_URL, formData);
        alert("Group baru berhasil dibuat!");
      }
      handleCloseModal();
      fetchGroups();
    } catch (err) {
      alert("Gagal menyimpan group.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus Group #${id}?`)) return;
    setLoading(true);
    try {
      await api.delete(`${BASE_URL}${id}/`);
      alert("Group berhasil dihapus!");
      fetchGroups();
    } catch (err) {
      alert("Gagal menghapus group.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={containerStyle}>
      {/* HEADER */}
      <div style={headerStyle}>
        <div>
          <h2 style={{ margin: 0, color: "#0f172a" }}>Group & Permission Management</h2>
          <p style={{ margin: "5px 0 0", color: "#64748b", fontSize: "14px" }}>
            Kelola peran pengguna (roles) serta pemetaan Hak Akses API Endpoint
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button onClick={fetchGroups} style={refreshButtonStyle}>
            🔄 Refresh Data
          </button>
          <button onClick={() => handleOpenModal()} style={primaryButtonStyle}>
            + Buat Group Baru
          </button>
        </div>
      </div>

      {/* STAT CARDS */}
      <div style={statsContainerStyle}>
        <div style={statCardStyle}>
          <span style={statTitleStyle}>Total Group / Role</span>
          <span style={statNumberStyle}>{groups.length}</span>
        </div>
        <div style={statCardStyle}>
          <span style={statTitleStyle}>System Permissions</span>
          <span style={{ ...statNumberStyle, color: "#2563eb" }}>{permissionsList.length}</span>
        </div>
      </div>

      {/* FILTER BAR */}
      <div style={filterBarStyle}>
        <input
          type="text"
          placeholder="Cari Nama Group / Role..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={inputSearchStyle}
        />
      </div>

      {error && <div style={errorBannerStyle}>{error}</div>}

      {/* TABLE DATA */}
      <div style={tableWrapperStyle}>
        <table style={tableStyle}>
          <thead>
            <tr style={tableHeaderRowStyle}>
              <th style={thStyle}>ID</th>
              <th style={thStyle}>Nama Group / Role</th>
              <th style={thStyle}>Django Permissions</th>
              <th style={{ ...thStyle, textAlign: "center" }}>Aksi & API Access</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="4" style={emptyTdStyle}>Memuat data group...</td>
              </tr>
            ) : filteredData.length === 0 ? (
              <tr>
                <td colSpan="4" style={emptyTdStyle}>Tidak ada data group ditemukan.</td>
              </tr>
            ) : (
              filteredData.map((row) => (
                <tr key={row.id} style={tableBodyRowStyle}>
                  <td style={{ ...tdStyle, fontWeight: "bold" }}>#{row.id}</td>
                  <td style={tdStyle}>
                    <strong style={{ color: "#0f172a" }}>{row.name}</strong>
                  </td>
                  <td style={tdStyle}>
                    <span style={badgeStyle}>
                      {Array.isArray(row.permissions) ? row.permissions.length : 0} Perms
                    </span>
                  </td>
                  <td style={{ ...tdStyle, textAlign: "center" }}>
                    {/* TOMBOL MANAGE ACCESS API */}
                    <button
                      onClick={() => setSelectedAccessGroup(row)}
                      style={accessButtonStyle}
                    >
                      🔒 Manage API Access
                    </button>
                    {" "}
                    <button onClick={() => handleOpenModal(row)} style={actionButtonStyle}>
                      Edit
                    </button>
                    {" "}
                    <button onClick={() => handleDelete(row.id)} style={actionDeleteStyle}>
                      Hapus
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL FORM CREATE / EDIT GROUP */}
      {modalOpen && (
        <div style={overlayStyle}>
          <div style={modalBoxStyle}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "15px" }}>
              <h3 style={{ margin: 0, color: "#0f172a" }}>
                {editItem ? `Edit Group #${editItem.id}` : "Tambah Group Baru"}
              </h3>
              <button onClick={handleCloseModal} style={closeModalBtnStyle}>✕</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={modalFormBody}>
                <div style={{ marginBottom: "15px" }}>
                  <label style={labelStyle}>Nama Group / Role *</label>
                  <input
                    type="text"
                    placeholder="misal: HR Manager, Payroll Admin"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    style={inputSearchStyle}
                    required
                  />
                </div>

                {permissionsList.length > 0 && (
                  <div style={{ marginBottom: "15px" }}>
                    <label style={labelStyle}>Pilih Permissions (Django System):</label>
                    <div style={permissionBoxStyle}>
                      {permissionsList.map((perm) => (
                        <label key={perm.id} style={checkboxLabelStyle}>
                          <input
                            type="checkbox"
                            checked={formData.permissions.includes(perm.id)}
                            onChange={() => handlePermissionToggle(perm.id)}
                            style={{ marginRight: "8px" }}
                          />
                          {perm.name || perm.codename}
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "15px", paddingTop: "10px", borderTop: "1px solid #e2e8f0" }}>
                <button type="button" onClick={handleCloseModal} style={cancelButtonStyle}>Batal</button>
                <button type="submit" disabled={loading} style={primaryButtonStyle}>
                  {loading ? "Menyimpan..." : "Simpan Group"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL ACCESS MANAGER (DIBUKA KETIKA TOMBOL "MANAGE API ACCESS" DIKLIK) */}
      {selectedAccessGroup && (
        <GroupAccessManager
          group={selectedAccessGroup}
          onClose={() => setSelectedAccessGroup(null)}
        />
      )}
    </div>
  );
};

// ==========================================
// STYLES (KONSISTEN HRIS DASHBOARD)
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

const accessButtonStyle = {
  padding: "6px 12px",
  background: "#eff6ff",
  color: "#2563eb",
  border: "1px solid #bfdbfe",
  borderRadius: "4px",
  cursor: "pointer",
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

const statsContainerStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
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
  width: "100%",
  padding: "10px 12px",
  border: "1px solid #cbd5e1",
  borderRadius: "6px",
  fontSize: "14px",
  boxSizing: "border-box",
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
  background: "#e0f2fe",
  color: "#0369a1",
};

const labelStyle = {
  display: "block",
  fontSize: "12px",
  fontWeight: "bold",
  color: "#475569",
  marginBottom: "6px",
};

const overlayStyle = {
  position: "fixed",
  inset: 0,
  background: "rgba(15, 23, 42, 0.5)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 100,
  padding: "20px",
};

const modalBoxStyle = {
  background: "#fff",
  padding: "20px",
  borderRadius: "8px",
  width: "500px",
  maxWidth: "100%",
  maxHeight: "90vh",
  display: "flex",
  flexDirection: "column",
};

const modalAccessBoxStyle = {
  background: "#fff",
  padding: "24px",
  borderRadius: "12px",
  width: "600px",
  maxWidth: "90%",
  maxHeight: "85vh",
  display: "flex",
  flexDirection: "column",
  boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
};

const accessHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  marginBottom: "15px",
};

const modalFormBody = {
  overflowY: "auto",
  maxHeight: "60vh",
  paddingRight: "5px",
};

const templateScrollBoxStyle = {
  overflowY: "auto",
  maxHeight: "50vh",
  display: "flex",
  flexDirection: "column",
  gap: "10px",
  paddingRight: "5px",
};

const templateCardStyle = {
  padding: "12px 16px",
  borderRadius: "8px",
  transition: "all 0.2s ease-in-out",
};

const templateLabelStyle = {
  display: "flex",
  alignItems: "flex-start",
  gap: "12px",
  cursor: "pointer",
};

const checkboxStyle = {
  width: "18px",
  height: "18px",
  marginTop: "3px",
  cursor: "pointer",
};

const closeModalBtnStyle = {
  background: "transparent",
  border: "none",
  fontSize: "18px",
  cursor: "pointer",
  color: "#64748b",
};

const permissionBoxStyle = {
  maxHeight: "180px",
  overflowY: "auto",
  border: "1px solid #cbd5e1",
  borderRadius: "6px",
  padding: "10px",
  background: "#f8fafc",
  display: "flex",
  flexDirection: "column",
  gap: "6px",
};

const checkboxLabelStyle = {
  fontSize: "13px",
  color: "#334155",
  display: "flex",
  alignItems: "center",
  cursor: "pointer",
};

export default GroupPages;