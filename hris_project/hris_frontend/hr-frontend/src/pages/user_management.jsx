import React, { useEffect, useState } from "react";
import api from "../api";

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editUser, setEditUser] = useState(null);

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    first_name: "",
    last_name: "",
    password: "",
    group: "", // Single Group ID
    is_active: true,
  });

  useEffect(() => {
    fetchUsers();
    fetchGroups();
  }, []);

  // =========================
  // FETCH DATA
  // =========================
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/v2/users/");
      setUsers(res.data.results || res.data || []);
    } catch (err) {
      console.error("Gagal mengambil user:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchGroups = async () => {
    try {
      const res = await api.get("/api/v2/groups/");
      setGroups(res.data.results || res.data || []);
    } catch (err) {
      console.error("Gagal mengambil groups:", err);
    }
  };

  // =========================
  // MODAL HANDLER
  // =========================
  const handleOpenModal = (user = null) => {
    setEditUser(user);

    if (user) {
      // Ambil ID Group tunggal (bisa berbentuk integer ID atau dari array single)
      let currentGroupId = "";
      if (user.group) {
        currentGroupId = user.group;
      } else if (Array.isArray(user.groups) && user.groups.length > 0) {
        const first = user.groups[0];
        currentGroupId = typeof first === "object" ? first.id : first;
      }

      setFormData({
        username: user.username || "",
        email: user.email || "",
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        password: "", // Kosongkan saat edit
        group: currentGroupId || "",
        is_active: user.is_active ?? true,
      });
    } else {
      setFormData({
        username: "",
        email: "",
        first_name: "",
        last_name: "",
        password: "",
        group: "",
        is_active: true,
      });
    }

    setModalOpen(true);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  // =========================
  // SAVE USER
  // =========================
  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);

    const payload = { ...formData };

    // 1. Hapus field password jika kosong saat EDIT
    if (editUser && (!payload.password || payload.password.trim() === "")) {
      delete payload.password;
    }

    // 2. Format group ke Integer ID tunggal atau null jika tidak memilih
    if (payload.group !== "" && payload.group !== null) {
      payload.group = parseInt(payload.group, 10);
    } else {
      payload.group = null;
    }

    try {
      if (editUser) {
        await api.patch(`/api/v2/users/${editUser.id}/`, payload);
        alert("User & Role berhasil diperbarui!");
      } else {
        await api.post("/api/v2/users/", payload);
        alert("User & Role berhasil dibuat!");
      }

      setModalOpen(false);
      fetchUsers();
    } catch (err) {
      console.error("USER SAVE ERROR:", err.response?.data || err);
      const errDetail = err.response?.data
        ? JSON.stringify(err.response.data)
        : err.message;
      alert(`Gagal menyimpan user:\n${errDetail}`);
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // DELETE USER
  // =========================
  const handleDelete = async (id) => {
    if (!window.confirm("Hapus user ini?")) return;

    try {
      await api.delete(`/api/v2/users/${id}/`);
      alert("User berhasil dihapus!");
      fetchUsers();
    } catch (err) {
      console.error("DELETE USER ERROR:", err);
      alert("Gagal menghapus user.");
    }
  };

  // Helper menampilkan nama Role / Group di tabel
  const getRoleDisplayName = (user) => {
    if (user.group_name) return user.group_name;
    if (user.group) {
      const found = groups.find((g) => String(g.id) === String(user.group));
      if (found) return found.name;
    }
    if (Array.isArray(user.groups) && user.groups.length > 0) {
      const first = user.groups[0];
      if (typeof first === "object") return first.name;
      const found = groups.find((g) => String(g.id) === String(first));
      if (found) return found.name;
    }
    return "-";
  };

  return (
    <div style={cardStyle}>
      <div style={headerStyle}>
        <div>
          <h3 style={{ margin: 0, color: "#0f172a" }}>User Management</h3>
          <p style={descriptionStyle}>Kelola pengguna dan peran (Role/Group) sistem</p>
        </div>

        <button onClick={() => handleOpenModal()} style={btnPrimary}>
          + Tambah User
        </button>
      </div>

      {loading ? (
        <p style={{ padding: "20px", textAlign: "center", color: "#64748b" }}>Memuat data...</p>
      ) : (
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>ID</th>
              <th style={thStyle}>Username</th>
              <th style={thStyle}>Email</th>
              <th style={thStyle}>Nama Lengkap</th>
              <th style={thStyle}>Role / Group</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>Aksi</th>
            </tr>
          </thead>

          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ ...tdStyle, textAlign: "center", color: "#94a3b8" }}>
                  Tidak ada data user ditemukan.
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id}>
                  <td style={tdStyle}>#{user.id}</td>
                  <td style={tdStyle}>
                    <strong style={{ color: "#2563eb" }}>{user.username}</strong>
                  </td>
                  <td style={tdStyle}>{user.email || "-"}</td>
                  <td style={tdStyle}>
                    {user.first_name} {user.last_name}
                  </td>
                  <td style={tdStyle}>
                    <span style={badgeRoleStyle}>
                      {getRoleDisplayName(user)}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    <span
                      style={{
                        padding: "2px 8px",
                        borderRadius: "12px",
                        fontSize: "11px",
                        fontWeight: "bold",
                        background: user.is_active ? "#dcfce7" : "#fee2e2",
                        color: user.is_active ? "#15803d" : "#b91c1c",
                      }}
                    >
                      {user.is_active ? "Aktif" : "Nonaktif"}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    <button onClick={() => handleOpenModal(user)} style={btnEdit}>
                      Edit
                    </button>{" "}
                    <button onClick={() => handleDelete(user.id)} style={btnDelete}>
                      Hapus
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}

      {/* MODAL EDIT / CREATE */}
      {modalOpen && (
        <div style={modalOverlay}>
          <div style={modalBox}>
            <h3 style={{ marginTop: 0, color: "#0f172a" }}>
              {editUser ? `Edit User #${editUser.id}` : "Tambah User Baru"}
            </h3>

            <form onSubmit={handleSave}>
              <label style={labelStyle}>Username *</label>
              <input
                name="username"
                value={formData.username}
                onChange={handleChange}
                style={inputStyle}
                required
              />

              <label style={labelStyle}>Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                style={inputStyle}
              />

              <label style={labelStyle}>Nama Depan</label>
              <input
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                style={inputStyle}
              />

              <label style={labelStyle}>Nama Belakang</label>
              <input
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                style={inputStyle}
              />

              <label style={labelStyle}>
                Password {editUser ? "(Kosongkan jika tidak ubah)" : "*"}
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                style={inputStyle}
                required={!editUser}
                placeholder={editUser ? "••••••••" : "Masukkan password"}
              />

              {/* SINGLE ROLE DROPDOWN */}
              <label style={labelStyle}>Role / Group Akses *</label>
              <select
                name="group"
                value={formData.group}
                onChange={handleChange}
                style={selectStyle}
              >
                <option value="">-- Pilih Single Role --</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>

              <label style={{ ...labelStyle, marginTop: "12px", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}>
                <input
                  type="checkbox"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleChange}
                />{" "}
                Status User Aktif
              </label>

              <div style={buttonContainer}>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  style={btnCancel}
                >
                  Batal
                </button>
                <button type="submit" disabled={loading} style={btnPrimary}>
                  {loading ? "Menyimpan..." : "Simpan User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// =========================
// STYLES
// =========================
const cardStyle = {
  padding: "24px",
  border: "1px solid #e2e8f0",
  borderRadius: "12px",
  background: "#fff",
  boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
  fontFamily: "Arial, sans-serif",
};

const headerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "20px",
};

const descriptionStyle = {
  margin: "4px 0 0",
  color: "#64748b",
  fontSize: "13px",
};

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
  fontSize: "13px",
};

const thStyle = {
  padding: "12px 10px",
  textAlign: "left",
  color: "#475569",
  background: "#f8fafc",
  borderBottom: "2px solid #e2e8f0",
  fontWeight: "bold",
};

const tdStyle = {
  padding: "12px 10px",
  borderBottom: "1px solid #f1f5f9",
  color: "#334155",
  verticalAlign: "middle",
};

const inputStyle = {
  width: "100%",
  padding: "8px 12px",
  marginBottom: "12px",
  borderRadius: "6px",
  border: "1px solid #cbd5e1",
  boxSizing: "border-box",
  fontSize: "13px",
};

const selectStyle = {
  width: "100%",
  padding: "8px 12px",
  marginBottom: "12px",
  borderRadius: "6px",
  border: "1px solid #cbd5e1",
  boxSizing: "border-box",
  background: "#fff",
  fontSize: "13px",
};

const labelStyle = {
  display: "block",
  fontSize: "12px",
  fontWeight: "bold",
  marginBottom: "4px",
  color: "#475569",
};

const badgeRoleStyle = {
  display: "inline-block",
  padding: "3px 10px",
  borderRadius: "12px",
  fontSize: "12px",
  fontWeight: "bold",
  background: "#eff6ff",
  color: "#1d4ed8",
  border: "1px solid #bfdbfe",
};

const btnPrimary = {
  padding: "8px 16px",
  background: "#2563eb",
  color: "#fff",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
  fontWeight: "bold",
  fontSize: "13px",
};

const btnEdit = {
  padding: "5px 10px",
  background: "#f1f5f9",
  color: "#334155",
  border: "1px solid #cbd5e1",
  borderRadius: "4px",
  cursor: "pointer",
  fontSize: "12px",
};

const btnDelete = {
  padding: "5px 10px",
  background: "#fee2e2",
  color: "#b91c1c",
  border: "1px solid #fca5a5",
  borderRadius: "4px",
  cursor: "pointer",
  fontSize: "12px",
};

const btnCancel = {
  padding: "8px 16px",
  background: "#64748b",
  color: "#fff",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
  fontSize: "13px",
};

const buttonContainer = {
  display: "flex",
  justifyContent: "flex-end",
  gap: "10px",
  marginTop: "20px",
};

const modalOverlay = {
  position: "fixed",
  inset: 0,
  background: "rgba(15, 23, 42, 0.5)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 100,
};

const modalBox = {
  background: "#fff",
  padding: "24px",
  borderRadius: "12px",
  width: "420px",
  maxHeight: "90vh",
  overflowY: "auto",
  boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
};