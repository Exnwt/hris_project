import React, { useEffect, useState } from "react";
import api from "../api";

const APIEndpointManager = () => {
  const [endpoints, setEndpoints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const initialFormState = {
    name: "",
    code_name: "",
    model_name: "Employee",
    description: "",
    is_read: false,
    is_create: false,
    is_update: false,
    is_delete: false,
    is_additional: false, // Flag Additional
  };

  const [formData, setFormData] = useState(initialFormState);
  const [saving, setSaving] = useState(false);

  const fetchEndpoints = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await api.get("api/v2/access/APIEndpoints/");
      const data = response.data.results || response.data || [];
      setEndpoints(Array.isArray(data) ? data : []);
    } catch (err) {
      setError("Gagal mengambil daftar API Endpoint.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEndpoints();
  }, []);

  const handleOpenModal = (item = null) => {
    if (item) {
      setEditingId(item.id);
      setFormData({
        name: item.name || "",
        code_name: item.code_name || "",
        model_name: item.model_name || "General",
        description: item.description || "",
        is_read: !!item.is_read,
        is_create: !!item.is_create,
        is_update: !!item.is_update,
        is_delete: !!item.is_delete,
        is_additional: !!item.is_additional,
      });
    } else {
      setEditingId(null);
      setFormData(initialFormState);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData(initialFormState);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      if (editingId) {
        await api.put(`api/v2/access/APIEndpoints/${editingId}/`, formData);
      } else {
        await api.post("api/v2/access/APIEndpoints/", formData);
      }
      handleCloseModal();
      fetchEndpoints();
    } catch (err) {
      alert(err.response?.data?.detail || "Gagal menyimpan data API Endpoint");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus API Endpoint "${name}"?`)) {
      try {
        await api.delete(`api/v2/access/APIEndpoints/${id}/`);
        fetchEndpoints();
      } catch (err) {
        alert("Gagal menghapus API Endpoint.");
      }
    }
  };

  const filteredEndpoints = (endpoints || []).filter(
    (item) =>
      item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.code_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.model_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="page-container">
      {/* HEADER PAGE */}
      <div className="page-header">
        <div>
          <h2>Master API Endpoints</h2>
          <p style={{ color: "#64748b", fontSize: "14px", marginTop: "4px" }}>
            Kelola daftar katalog endpoint API, tipe aksinya (CRUD), dan fitur tambahan.
          </p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-primary" onClick={() => handleOpenModal()}>
            + Tambah Endpoint
          </button>
        </div>
      </div>

      {/* SEARCH BAR */}
      <div style={{ marginBottom: "20px" }}>
        <input
          type="text"
          placeholder="Cari nama API, model, atau code name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="input-control"
          style={{ maxWidth: "400px" }}
        />
      </div>

      {error && <div className="error-banner">{error}</div>}

      {/* TABLE */}
      {loading ? (
        <p style={{ textAlign: "center", padding: "30px", color: "#64748b" }}>
          Memuat data API Endpoints...
        </p>
      ) : (
        <div className="table-wrapper">
          <table className="custom-table">
            <thead>
              <tr>
                <th>No</th>
                <th>Model / Modul</th>
                <th>Nama API</th>
                <th>Code Name</th>
                <th>Status Tipe Akses</th>
                <th style={{ textAlign: "center" }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredEndpoints.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: "center", padding: "30px", color: "#94a3b8" }}>
                    Tidak ada data API Endpoint ditemukan.
                  </td>
                </tr>
              ) : (
                filteredEndpoints.map((item, index) => (
                  <tr key={item.id}>
                    <td>{index + 1}</td>
                    <td>
                      <span className="badge badge-default" style={{ backgroundColor: "#e2e8f0" }}>
                        {item.model_name || "General"}
                      </span>
                    </td>
                    <td>
                      <strong>{item.name}</strong>
                      {item.is_additional && (
                        <span className="badge" style={{ marginLeft: "8px", background: "#f3e8ff", color: "#7e22ce" }}>
                          Additional
                        </span>
                      )}
                    </td>
                    <td>
                      <code style={{ background: "#f1f5f9", padding: "4px 8px", borderRadius: "4px", fontSize: "12px" }}>
                        {item.code_name}
                      </code>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                        {item.is_read && <span className="badge badge-success">Read</span>}
                        {item.is_create && <span className="badge" style={{ background: "#dbeafe", color: "#1d4ed8" }}>Create</span>}
                        {item.is_update && <span className="badge" style={{ background: "#fef3c7", color: "#b45309" }}>Update</span>}
                        {item.is_delete && <span className="badge" style={{ background: "#fee2e2", color: "#b91c1c" }}>Delete</span>}
                        {item.is_additional && <span className="badge" style={{ background: "#f3e8ff", color: "#7e22ce" }}>Additional</span>}
                      </div>
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <div className="action-group">
                        <button className="btn btn-action-view" onClick={() => handleOpenModal(item)}>
                          Edit
                        </button>
                        <button className="btn btn-action-delete" onClick={() => handleDelete(item.id, item.name)}>
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
      )}

      {/* MODAL FORM */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: "550px" }}>
            <div className="page-header" style={{ marginBottom: "16px" }}>
              <h3>{editingId ? "Edit API Endpoint" : "Tambah API Endpoint Baru"}</h3>
              <button onClick={handleCloseModal} className="btn-close-modal">✕</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div>
                  <label className="form-label">Target Model / Modul *</label>
                  <input
                    type="text"
                    name="model_name"
                    value={formData.model_name}
                    onChange={handleChange}
                    placeholder="Contoh: Employee, Department, Contract"
                    required
                    className="input-control"
                  />
                </div>

                <div>
                  <label className="form-label">Nama API / Fungsi *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Contoh: Approve Edit Staging"
                    required
                    className="input-control"
                  />
                </div>

                <div>
                  <label className="form-label">Code Name (Unique Identifier) *</label>
                  <input
                    type="text"
                    name="code_name"
                    value={formData.code_name}
                    onChange={handleChange}
                    placeholder="Contoh: EmployeeStaggingApprove"
                    required
                    className="input-control"
                  />
                </div>

                <div>
                  <label className="form-label">Pengaturan Tipe Akses & Karakteristik:</label>
                  <div className="crud-matrix-grid">
                    <label className="crud-checkbox-label">
                      <input type="checkbox" name="is_read" checked={formData.is_read} onChange={handleChange} /> Read
                    </label>
                    <label className="crud-checkbox-label">
                      <input type="checkbox" name="is_create" checked={formData.is_create} onChange={handleChange} /> Create
                    </label>
                    <label className="crud-checkbox-label">
                      <input type="checkbox" name="is_update" checked={formData.is_update} onChange={handleChange} /> Update
                    </label>
                    <label className="crud-checkbox-label">
                      <input type="checkbox" name="is_delete" checked={formData.is_delete} onChange={handleChange} /> Delete
                    </label>
                    
                    {/* CHECKBOX ADDITIONAL */}
                    <label className="crud-checkbox-label" style={{ backgroundColor: "#f3e8ff", color: "#6b21a8" }}>
                      <input type="checkbox" name="is_additional" checked={formData.is_additional} onChange={handleChange} />
                      Is Additional
                    </label>
                  </div>
                </div>

                <div>
                  <label className="form-label">Deskripsi (Sangat disarankan untuk Additional Access)</label>
                  <textarea
                    name="description"
                    rows="3"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Contoh: Memberikan izin khusus untuk menyetujui (Approve) pengajuan edit data karyawan..."
                    className="input-control"
                  />
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "20px" }}>
                <button type="button" className="btn btn-cancel" onClick={handleCloseModal}>
                  Batal
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
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

export default APIEndpointManager;