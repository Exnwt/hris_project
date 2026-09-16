import React, { useState, useEffect } from "react";
import api from "../api";

// =========================================================
// SUB-KOMPONEN: GROUP API ACCESS MANAGER (DENGAN ADDITIONAL ACCESS)
// =========================================================
const GroupAccessManager = ({ group, onClose }) => {
  const [endpoints, setEndpoints] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (group?.id) {
      fetchData();
    }
  }, [group?.id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");
      const [resEndpoints, resAssignments] = await Promise.all([
        api.get("api/v2/access/APIEndpoints/"),
        api.get(`api/v2/access/Group-AA/?group=${group.id}`),
      ]);

      const endData = resEndpoints.data.results || resEndpoints.data || [];
      const assData = resAssignments.data.results || resAssignments.data || [];

      setEndpoints(Array.isArray(endData) ? endData : []);
      setAssignments(Array.isArray(assData) ? assData : []);
    } catch (err) {
      setError("Gagal memuat data hak akses API.");
    } finally {
      setLoading(false);
    }
  };

  const isAssigned = (endpointId) => {
    return assignments.some((item) => item.api_endpoint === endpointId);
  };

  const getAssignment = (endpointId) => {
    return assignments.find((item) => item.api_endpoint === endpointId);
  };

  const handleToggleAssignment = async (endpointId) => {
    try {
      setSavingId(endpointId);
      const assignment = getAssignment(endpointId);

      if (assignment) {
        await api.delete(`api/v2/access/Group-AA/${assignment.id}/`);
      } else {
        await api.post("api/v2/access/Group-AA/", {
          group: group.id,
          api_endpoint: endpointId,
        });
      }
      const res = await api.get(`api/v2/access/Group-AA/?group=${group.id}`);
      setAssignments(res.data.results || res.data || []);
    } catch (err) {
      alert("Gagal mengubah status hak akses.");
    } finally {
      setSavingId(null);
    }
  };

  // 1. MEMISAHKAN ENDPOINT STANDARD DAN ADDITIONAL
  const standardEndpoints = endpoints.filter((item) => !item.is_additional);
  const additionalEndpoints = endpoints.filter((item) => item.is_additional);

  // 2. GROUPING ENDPOINT STANDARD BY MODEL NAME
  const groupedEndpoints = standardEndpoints.reduce((acc, current) => {
    const model = current.model_name || "General / Other";
    if (!acc[model]) acc[model] = [];
    acc[model].push(current);
    return acc;
  }, {});

  return (
    <div className="modal-overlay">
      <div className="modal-access-box">
        {/* Header Modal */}
        <div className="access-header">
          <div>
            <h3>🔒 Hak Akses API Per Role</h3>
            <p>
              Atur izin API Endpoint & Aksi untuk Role:{" "}
              <strong style={{ color: "#2563eb" }}>{group.name}</strong>
            </p>
          </div>
          <button onClick={onClose} className="btn-close-modal">✕</button>
        </div>

        {error && <div className="error-banner">{error}</div>}

        {loading ? (
          <p style={{ textAlign: "center", padding: "30px", color: "#64748b" }}>
            Memuat pemetaan hak akses...
          </p>
        ) : (
          <div style={{ overflowY: "auto", maxHeight: "65vh", paddingRight: "5px" }}>
            
            {/* BAGIAN 1: LIST API MODEL UTAMA (CRUD STANDARD) */}
            {Object.keys(groupedEndpoints).map((modelName) => (
              <div key={modelName} style={{ marginBottom: "20px" }}>
                <h4
                  style={{
                    fontSize: "14px",
                    color: "#1e293b",
                    borderBottom: "2px solid #3b82f6",
                    paddingBottom: "4px",
                    marginBottom: "10px",
                  }}
                >
                  📦 Model: {modelName}
                </h4>

                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {groupedEndpoints[modelName].map((item) => {
                    const assigned = isAssigned(item.id);
                    const isSaving = savingId === item.id;

                    return (
                      <div
                        key={item.id}
                        className={`endpoint-card ${assigned ? "active-access" : ""}`}
                      >
                        <div className="endpoint-card-header">
                          <label style={{ display: "flex", gap: "10px", cursor: "pointer", alignItems: "flex-start" }}>
                            <input
                              type="checkbox"
                              checked={assigned}
                              disabled={isSaving}
                              onChange={() => handleToggleAssignment(item.id)}
                              style={{ marginTop: "3px", width: "16px", height: "16px", cursor: "pointer" }}
                            />
                            <div>
                              <div className="endpoint-title">{item.name}</div>
                              <div className="endpoint-code">Code: {item.code_name}</div>
                              {item.description && (
                                <p className="endpoint-desc">{item.description}</p>
                              )}
                            </div>
                          </label>

                          <span className={`badge ${assigned ? "badge-success" : "badge-default"}`}>
                            {assigned ? "Aktif" : "Nonaktif"}
                          </span>
                        </div>

                        {/* OPSI CHECKBOX TIPE AKSI CRUD */}
                        <div className="crud-matrix-grid">
                          <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "bold" }}>
                            Ketentuan Akses:
                          </span>
                          <label className="crud-checkbox-label">
                            <input type="checkbox" checked={!!item.is_read} disabled readOnly /> Read
                          </label>
                          <label className="crud-checkbox-label">
                            <input type="checkbox" checked={!!item.is_create} disabled readOnly /> Create
                          </label>
                          <label className="crud-checkbox-label">
                            <input type="checkbox" checked={!!item.is_update} disabled readOnly /> Update
                          </label>
                          <label className="crud-checkbox-label">
                            <input type="checkbox" checked={!!item.is_delete} disabled readOnly /> Delete
                          </label>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* BAGIAN 2: KUMPULAN API IS ADDITIONAL (DI LETAKKAN PALING BAWAH) */}
            <div style={{ marginTop: "30px", paddingTop: "15px", borderTop: "2px dashed #cbd5e1" }}>
              <h4
                style={{
                  fontSize: "15px",
                  color: "#6b21a8",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: "12px",
                }}
              >
                ⚡ Akses Tambahan Khusus (Additional Access)
              </h4>
              <p style={{ fontSize: "12px", color: "#64748b", margin: "-6px 0 12px 0" }}>
                Berisi hak akses tindakan khusus seperti persetujuan (Approve), penolakan (Reject), sync, ekspor, dll.
              </p>

              {additionalEndpoints.length === 0 ? (
                <p style={{ fontSize: "13px", color: "#94a3b8", fontStyle: "italic" }}>
                  Belum ada API tambahan (Additional Access) yang dikonfigurasi.
                </p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {additionalEndpoints.map((item) => {
                    const assigned = isAssigned(item.id);
                    const isSaving = savingId === item.id;

                    return (
                      <div
                        key={item.id}
                        className={`endpoint-card ${assigned ? "active-access" : ""}`}
                        style={{
                          borderColor: assigned ? "#a855f7" : "#e9d5ff",
                          backgroundColor: assigned ? "#faf5ff" : "#ffffff",
                        }}
                      >
                        <div className="endpoint-card-header">
                          <label style={{ display: "flex", gap: "10px", cursor: "pointer", alignItems: "flex-start" }}>
                            <input
                              type="checkbox"
                              checked={assigned}
                              disabled={isSaving}
                              onChange={() => handleToggleAssignment(item.id)}
                              style={{ marginTop: "3px", width: "16px", height: "16px", cursor: "pointer", accentColor: "#9333ea" }}
                            />
                            <div>
                              <div className="endpoint-title" style={{ color: "#581c87" }}>
                                {item.name}
                              </div>
                              <div className="endpoint-code" style={{ color: "#7e22ce" }}>
                                Code: {item.code_name}
                              </div>
                              <p className="endpoint-desc" style={{ color: "#4c1d95", fontWeight: "500", marginTop: "4px" }}>
                                {item.description || "Tidak ada deskripsi tambahan."}
                              </p>
                            </div>
                          </label>

                          <span
                            className="badge"
                            style={{
                              background: assigned ? "#f3e8ff" : "#f1f5f9",
                              color: assigned ? "#6b21a8" : "#64748b",
                            }}
                          >
                            {assigned ? "Aktif" : "Nonaktif"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        )}

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "20px", paddingTop: "12px", borderTop: "1px solid #e2e8f0" }}>
          <button onClick={onClose} className="btn btn-cancel">
            Selesai & Tutup
          </button>
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

  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [formData, setFormData] = useState({ name: "", permissions: [] });

  const [selectedAccessGroup, setSelectedAccessGroup] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

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
      console.warn("Gagal memuat permissions:", err);
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
    <div className="page-container">
      {/* HEADER */}
      <div className="page-header">
        <div>
          <h2>Group & Permission Management</h2>
          <p style={{ color: "#64748b", fontSize: "14px", marginTop: "4px" }}>
            Kelola peran pengguna (roles) serta pemetaan Hak Akses API Endpoint
          </p>
        </div>
        <div className="page-header-actions">
          <button onClick={fetchGroups} className="btn btn-secondary">
            🔄 Refresh Data
          </button>
          <button onClick={() => handleOpenModal()} className="btn btn-primary">
            + Buat Group Baru
          </button>
        </div>
      </div>

      {/* STAT CARDS */}
      <div className="stats-grid">
        <div className="stat-card-box">
          <span className="stat-card-title">Total Group / Role</span>
          <span className="stat-card-number">{groups.length}</span>
        </div>
        <div className="stat-card-box">
          <span className="stat-card-title">System Permissions</span>
          <span className="stat-card-number" style={{ color: "#2563eb" }}>
            {permissionsList.length}
          </span>
        </div>
      </div>

      {/* FILTER BAR */}
      <div style={{ marginBottom: "20px" }}>
        <input
          type="text"
          placeholder="Cari Nama Group / Role..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="input-control"
        />
      </div>

      {error && <div className="error-banner">{error}</div>}

      {/* TABLE DATA */}
      <div className="table-wrapper">
        <table className="custom-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nama Group / Role</th>
              <th>Permissions Total</th>
              <th style={{ textAlign: "center" }}>Aksi & API Access</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="4" style={{ textAlign: "center", padding: "30px", color: "#94a3b8" }}>
                  Memuat data group...
                </td>
              </tr>
            ) : filteredData.length === 0 ? (
              <tr>
                <td colSpan="4" style={{ textAlign: "center", padding: "30px", color: "#94a3b8" }}>
                  Tidak ada data group ditemukan.
                </td>
              </tr>
            ) : (
              filteredData.map((row) => (
                <tr key={row.id}>
                  <td><strong>#{row.id}</strong></td>
                  <td><strong>{row.name}</strong></td>
                  <td>
                    <span className="badge badge-default">
                      {Array.isArray(row.permissions) ? row.permissions.length : 0} Perms
                    </span>
                  </td>
                  <td style={{ textAlign: "center" }}>
                    <div className="action-group">
                      <button
                        onClick={() => setSelectedAccessGroup(row)}
                        className="btn btn-secondary"
                        style={{ color: "#2563eb", borderColor: "#bfdbfe", backgroundColor: "#eff6ff" }}
                      >
                        🔒 Manage API Access
                      </button>
                      <button onClick={() => handleOpenModal(row)} className="btn btn-action-view">
                        Edit
                      </button>
                      <button onClick={() => handleDelete(row.id)} className="btn btn-action-delete">
                        Hapus
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL FORM CREATE / EDIT GROUP */}
      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: "550px" }}>
            <div className="page-header" style={{ marginBottom: "12px" }}>
              <h4 style={{ margin: 0, color: "#0f172a" }}>
                {editItem ? `Edit Group #${editItem.id}` : "Tambah Group Baru"}
              </h4>
              <button onClick={handleCloseModal} className="btn-close-modal">✕</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ overflowY: "auto", maxHeight: "60vh", paddingRight: "5px" }}>
                <div style={{ marginBottom: "15px" }}>
                  <label className="form-label">Nama Group / Role *</label>
                  <input
                    type="text"
                    placeholder="misal: HR Manager, Payroll Admin"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input-control"
                    required
                  />
                </div>

                {permissionsList.length > 0 && (
                  <div style={{ marginBottom: "15px" }}>
                    <label className="form-label">Pilih Permissions (Django System):</label>
                    <div
                      style={{
                        maxHeight: "180px",
                        overflowY: "auto",
                        border: "1px solid #cbd5e1",
                        borderRadius: "6px",
                        padding: "10px",
                        backgroundColor: "#f8fafc",
                        display: "flex",
                        flexDirection: "column",
                        gap: "6px",
                      }}
                    >
                      {permissionsList.map((perm) => (
                        <label key={perm.id} className="crud-checkbox-label" style={{ background: "transparent" }}>
                          <input
                            type="checkbox"
                            checked={formData.permissions.includes(perm.id)}
                            onChange={() => handlePermissionToggle(perm.id)}
                          />
                          {perm.name || perm.codename}
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "15px", paddingTop: "10px", borderTop: "1px solid #e2e8f0" }}>
                <button type="button" onClick={handleCloseModal} className="btn btn-cancel">Batal</button>
                <button type="submit" disabled={loading} className="btn btn-primary">
                  {loading ? "Menyimpan..." : "Simpan Group"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL ACCESS MANAGER */}
      {selectedAccessGroup && (
        <GroupAccessManager
          group={selectedAccessGroup}
          onClose={() => setSelectedAccessGroup(null)}
        />
      )}
    </div>
  );
};

export default GroupPages;