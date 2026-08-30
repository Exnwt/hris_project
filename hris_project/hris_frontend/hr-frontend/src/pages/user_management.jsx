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
    groups: [],
    is_active: true,
  });

  useEffect(() => {
    fetchUsers();
    fetchGroups();
  }, []);

  // =========================
  // GET USERS
  // =========================

  const fetchUsers = async () => {

    setLoading(true);

    try {

      const res = await api.get("/api/v2/users/");

      console.log("USER API RESPONSE:", res.data);

      setUsers(res.data.results || res.data || []);

    } catch (err) {

      console.error("Gagal mengambil user:", err);

    } finally {

      setLoading(false);

    }
  };


  // =========================
  // GET GROUPS
  // =========================

  const fetchGroups = async () => {

    try {

      const res = await api.get("/api/v2/groups/");

      console.log("GROUP API RESPONSE:", res.data);

      setGroups(res.data.results || res.data || []);

    } catch (err) {

      console.error("Gagal mengambil groups:", err);

    }

  };


  // =========================
  // OPEN MODAL
  // =========================

  const handleOpenModal = (user = null) => {

    setEditUser(user);

    if (user) {

      setFormData({
        username: user.username || "",
        email: user.email || "",
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        password: "",
        groups: user.groups || [],
        is_active: user.is_active,
      });

    } else {

      setFormData({
        username: "",
        email: "",
        first_name: "",
        last_name: "",
        password: "",
        groups: [],
        is_active: true,
      });

    }

    setModalOpen(true);
  };


  // =========================
  // HANDLE INPUT
  // =========================

  const handleChange = (e) => {

    const { name, value, type, checked } = e.target;

    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });

  };


  // =========================
  // GROUP CHANGE
  // =========================

  const handleGroupChange = (e) => {

    const selected = Array.from(
      e.target.selectedOptions,
      option => option.value
    );

    setFormData({
      ...formData,
      groups: selected,
    });

  };


  // =========================
  // SAVE USER
  // =========================

  const handleSave = async (e) => {

    e.preventDefault();

    setLoading(true);

    try {

      if (editUser) {

        await api.patch(
          `/api/v2/users/${editUser.id}/`,
          formData
        );

        alert("User berhasil diperbarui!");

      } else {

        await api.post(
          "/api/v2/users/",
          formData
        );

        alert("User berhasil dibuat!");

      }

      setModalOpen(false);

      fetchUsers();

    } catch (err) {

      console.error("USER SAVE ERROR:", err.response?.data);

      alert(
        JSON.stringify(
          err.response?.data || err.message
        )
      );

    } finally {

      setLoading(false);

    }

  };


  // =========================
  // DELETE
  // =========================

  const handleDelete = async (id) => {

    if (!window.confirm("Hapus user ini?")) {
      return;
    }

    try {

      await api.delete(`/api/v1/users/${id}/`);

      fetchUsers();

    } catch (err) {

      console.error("DELETE USER ERROR:", err);

    }

  };


  return (
    <div style={cardStyle}>

      <div style={headerStyle}>

        <div>

          <h3 style={{ margin: 0 }}>
            User Management
          </h3>

          <p style={descriptionStyle}>
            Kelola user dan hak akses sistem
          </p>

        </div>

        <button
          onClick={() => handleOpenModal()}
          style={btnPrimary}
        >
          + Tambah User
        </button>

      </div>


      {loading ? (

        <p>Memuat data...</p>

      ) : (

        <table style={tableStyle}>

          <thead>

            <tr>

              <th style={thStyle}>ID</th>
              <th style={thStyle}>Username</th>
              <th style={thStyle}>Email</th>
              <th style={thStyle}>Nama</th>
              <th style={thStyle}>Group</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>Aksi</th>

            </tr>

          </thead>


          <tbody>

            {users.map(user => (

              <tr key={user.id}>

                <td style={tdStyle}>
                  #{user.id}
                </td>

                <td style={tdStyle}>
                  {user.username}
                </td>

                <td style={tdStyle}>
                  {user.email || "-"}
                </td>

                <td style={tdStyle}>
                  {user.first_name} {user.last_name}
                </td>

                <td style={tdStyle}>
                  {user.groups?.join(", ") || "-"}
                </td>

                <td style={tdStyle}>
                  {user.is_active ? "Aktif" : "Nonaktif"}
                </td>

                <td style={tdStyle}>

                  <button
                    onClick={() => handleOpenModal(user)}
                    style={btnEdit}
                  >
                    Edit
                  </button>

                  {" "}

                  <button
                    onClick={() => handleDelete(user.id)}
                    style={btnDelete}
                  >
                    Hapus
                  </button>

                </td>

              </tr>

            ))}

          </tbody>

        </table>

      )}


      {/* MODAL */}

      {modalOpen && (

        <div style={modalOverlay}>

          <div style={modalBox}>

            <h3>

              {editUser
                ? `Edit User #${editUser.id}`
                : "Tambah User"}

            </h3>


            <form onSubmit={handleSave}>

              <label style={labelStyle}>
                Username
              </label>

              <input
                name="username"
                value={formData.username}
                onChange={handleChange}
                style={inputStyle}
                required
              />


              <label style={labelStyle}>
                Email
              </label>

              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                style={inputStyle}
              />


              <label style={labelStyle}>
                Nama Depan
              </label>

              <input
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                style={inputStyle}
              />


              <label style={labelStyle}>
                Nama Belakang
              </label>

              <input
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                style={inputStyle}
              />


              <label style={labelStyle}>
                Password
              </label>

              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                style={inputStyle}
                required={!editUser}
                placeholder={
                  editUser
                    ? "Kosongkan jika tidak ingin mengubah"
                    : ""
                }
              />


              <label style={labelStyle}>
                Group
              </label>

              <select
                multiple
                value={formData.groups}
                onChange={handleGroupChange}
                style={{
                  ...inputStyle,
                  height: "100px"
                }}
              >

                {groups.map(group => (

                  <option
                    key={group.id}
                    value={group.name}
                  >
                    {group.name}
                  </option>

                ))}

              </select>


              <label
                style={{
                  ...labelStyle,
                  marginTop: "10px"
                }}
              >

                <input
                  type="checkbox"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleChange}
                />

                {" "}Aktif

              </label>


              <div style={buttonContainer}>

                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  style={btnCancel}
                >
                  Batal
                </button>

                <button
                  type="submit"
                  style={btnPrimary}
                >
                  Simpan
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
// STYLE
// =========================

const cardStyle = {
  padding: "20px",
  border: "1px solid #e2e8f0",
  borderRadius: "8px",
  background: "#fff"
};

const headerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "20px"
};

const descriptionStyle = {
  margin: "4px 0 0",
  color: "#64748b",
  fontSize: "13px"
};

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
  fontSize: "13px"
};

const thStyle = {
  padding: "10px",
  textAlign: "left",
  color: "#475569",
  background: "#f8fafc"
};

const tdStyle = {
  padding: "10px",
  borderBottom: "1px solid #f1f5f9"
};

const inputStyle = {
  width: "100%",
  padding: "8px",
  marginBottom: "12px",
  borderRadius: "4px",
  border: "1px solid #cbd5e1",
  boxSizing: "border-box"
};

const labelStyle = {
  display: "block",
  fontSize: "12px",
  fontWeight: "bold",
  marginBottom: "4px"
};

const btnPrimary = {
  padding: "8px 14px",
  background: "#2563eb",
  color: "#fff",
  border: "none",
  borderRadius: "4px",
  cursor: "pointer"
};

const btnEdit = {
  padding: "4px 8px",
  background: "#0284c7",
  color: "#fff",
  border: "none",
  borderRadius: "4px",
  cursor: "pointer"
};

const btnDelete = {
  padding: "4px 8px",
  background: "#ef4444",
  color: "#fff",
  border: "none",
  borderRadius: "4px",
  cursor: "pointer"
};

const btnCancel = {
  padding: "8px 14px",
  background: "#64748b",
  color: "#fff",
  border: "none",
  borderRadius: "4px",
  cursor: "pointer"
};

const buttonContainer = {
  display: "flex",
  justifyContent: "flex-end",
  gap: "10px",
  marginTop: "15px"
};

const modalOverlay = {
  position: "fixed",
  inset: 0,
  background: "rgba(15, 23, 42, 0.5)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 50
};

const modalBox = {
  background: "#fff",
  padding: "20px",
  borderRadius: "8px",
  width: "400px",
  maxHeight: "90vh",
  overflowY: "auto"
};