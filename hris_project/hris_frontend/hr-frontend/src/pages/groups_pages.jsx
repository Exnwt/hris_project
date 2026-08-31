import React, { useEffect, useState } from "react";
import api from "../api";
import GroupAccessManager from "../components/access_management/GroupAccessManager";

const GroupPages = () => {
    const [groups, setGroups] = useState([]);
    const [groupName, setGroupName] = useState("");
    const [editingId, setEditingId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [selectedGroup, setSelectedGroup] = useState(null);

    // =========================
    // GET GROUPS
    // =========================
    const fetchGroups = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await api.get("/api/v2/groups/");

            console.log("GROUP RESPONSE:", response.data);

            setGroups(response.data);
        } catch (error) {
            console.error("Gagal mengambil groups:", error);

            console.error("Status:", error.response?.status);
            console.error("Data:", error.response?.data);

            setError(
                error.response?.data?.detail ||
                "Gagal mengambil data group"
            );
        } finally {
            setLoading(false);
        }
    };

    // =========================
    // LOAD DATA
    // =========================
    useEffect(() => {
        fetchGroups();
    }, []);

    // =========================
    // CREATE / UPDATE GROUP
    // =========================
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!groupName.trim()) {
            alert("Nama group wajib diisi");
            return;
        }

        try {
            if (editingId) {
                // UPDATE
                const response = await api.patch(
                    `groups/${editingId}/`,
                    {
                        name: groupName,
                    }
                );

                console.log("GROUP UPDATED:", response.data);

                alert("Group berhasil diperbarui");
            } else {
                // CREATE
                const response = await api.post(
                    "groups/",
                    {
                        name: groupName,
                    }
                );

                console.log("GROUP CREATED:", response.data);

                alert("Group berhasil dibuat");
            }

            setGroupName("");
            setEditingId(null);

            fetchGroups();

        } catch (error) {
            console.error("Gagal menyimpan group:", error);

            console.error("Status:", error.response?.status);
            console.error("Data:", error.response?.data);

            alert(
                error.response?.data?.name?.[0] ||
                error.response?.data?.detail ||
                "Gagal menyimpan group"
            );
        }
    };

    // =========================
    // EDIT
    // =========================
    const handleEdit = (group) => {
        setEditingId(group.id);
        setGroupName(group.name);
    };

    // =========================
    // CANCEL EDIT
    // =========================
    const handleCancelEdit = () => {
        setEditingId(null);
        setGroupName("");
    };

    // =========================
    // DELETE
    // =========================
    const handleDelete = async (id) => {
        const confirmDelete = window.confirm(
            "Apakah kamu yakin ingin menghapus group ini?"
        );

        if (!confirmDelete) {
            return;
        }

        try {
            await api.delete(`groups/${id}/`);

            console.log("GROUP DELETED:", id);

            alert("Group berhasil dihapus");

            fetchGroups();

        } catch (error) {
            console.error("Gagal menghapus group:", error);

            console.error("Status:", error.response?.status);
            console.error("Data:", error.response?.data);

            alert(
                error.response?.data?.detail ||
                "Gagal menghapus group"
            );
        }
    };

    return (
        <div style={styles.container}>

            {/* HEADER */}
            <div style={styles.header}>
                <div>
                    <h1 style={styles.title}>Group Management</h1>
                    <p style={styles.subtitle}>
                        Kelola group dan permission user
                    </p>
                </div>
            </div>

            {/* FORM */}
            <div style={styles.card}>

                <h2 style={styles.cardTitle}>
                    {editingId ? "Edit Group" : "Tambah Group"}
                </h2>

                <form onSubmit={handleSubmit}>

                    <div style={styles.formGroup}>

                        <label style={styles.label}>
                            Group Name
                        </label>

                        <input
                            type="text"
                            value={groupName}
                            onChange={(e) =>
                                setGroupName(e.target.value)
                            }
                            placeholder="Masukkan nama group"
                            style={styles.input}
                        />

                    </div>

                    <div style={styles.formActions}>

                        <button
                            type="submit"
                            style={styles.primaryButton}
                        >
                            {editingId ? "Update Group" : "Tambah Group"}
                        </button>

                        {editingId && (
                            <button
                                type="button"
                                onClick={handleCancelEdit}
                                style={styles.secondaryButton}
                            >
                                Batal
                            </button>
                        )}

                    </div>

                </form>
            </div>

            {/* GROUP LIST */}
            <div style={styles.card}>

                <div style={styles.listHeader}>

                    <h2 style={styles.cardTitle}>
                        Daftar Group
                    </h2>

                    <button
                        onClick={fetchGroups}
                        style={styles.refreshButton}
                    >
                        Refresh
                    </button>

                </div>

                {loading ? (
                    <p>Loading...</p>
                ) : error ? (
                    <div style={styles.error}>
                        {error}
                    </div>
                ) : groups.length === 0 ? (
                    <div style={styles.empty}>
                        Belum ada group.
                    </div>
                ) : (

                    <table style={styles.table}>

                        <thead>
                            <tr>

                                <th style={styles.th}>
                                    ID
                                </th>

                                <th style={styles.th}>
                                    Group Name
                                </th>

                                <th style={styles.th}>
                                    Action
                                </th>

                            </tr>
                        </thead>

                        <tbody>

                            {groups.map((group) => (

                                <tr key={group.id}>

                                    <td style={styles.td}>
                                        {group.id}
                                    </td>

                                    <td style={styles.td}>
                                        {group.name}
                                    </td>

                                    <td style={styles.td}>
                                        <button
                                            onClick={() =>
                                                setSelectedGroup(group)
                                            }
                                            style={styles.accessButton}
                                        >
                                            Manage Access
                                        </button>

                                        <button
                                            onClick={() =>
                                                handleEdit(group)
                                            }
                                            style={styles.editButton}
                                        >
                                            Edit
                                        </button>

                                        <button
                                            onClick={() =>
                                                handleDelete(group.id)
                                            }
                                            style={styles.deleteButton}
                                        >
                                            Delete
                                        </button>

                                    </td>

                                </tr>

                            ))}

                        </tbody>

                    </table>

                )}

            </div>
            {/* ================================= */}
            {/* GROUP ACCESS MANAGER */}
            {/* ================================= */}

            {selectedGroup && (
                <GroupAccessManager
                    group={selectedGroup}
                    onClose={() => setSelectedGroup(null)}
                />
            )}
        </div>
    );
};


// =========================
// STYLES
// =========================

const styles = {

    container: {
        padding: "30px",
        backgroundColor: "#f5f6f8",
        minHeight: "100vh",
    },

    header: {
        marginBottom: "25px",
    },

    title: {
        margin: 0,
        fontSize: "28px",
        fontWeight: "600",
    },

    subtitle: {
        marginTop: "5px",
        color: "#666",
    },

    card: {
        backgroundColor: "#fff",
        padding: "25px",
        borderRadius: "10px",
        marginBottom: "25px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
    },

    cardTitle: {
        marginTop: 0,
        marginBottom: "20px",
        fontSize: "20px",
    },

    formGroup: {
        marginBottom: "20px",
    },

    label: {
        display: "block",
        marginBottom: "8px",
        fontWeight: "500",
    },

    input: {
        width: "100%",
        maxWidth: "400px",
        padding: "10px",
        border: "1px solid #ddd",
        borderRadius: "6px",
        fontSize: "14px",
        boxSizing: "border-box",
    },

    formActions: {
        display: "flex",
        gap: "10px",
    },

    primaryButton: {
        padding: "10px 18px",
        border: "none",
        borderRadius: "6px",
        cursor: "pointer",
        backgroundColor: "#333",
        color: "#fff",
    },

    secondaryButton: {
        padding: "10px 18px",
        border: "1px solid #ccc",
        borderRadius: "6px",
        cursor: "pointer",
        backgroundColor: "#fff",
    },

    listHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
    },

    refreshButton: {
        padding: "8px 15px",
        border: "1px solid #ccc",
        borderRadius: "6px",
        backgroundColor: "#fff",
        cursor: "pointer",
    },

    table: {
        width: "100%",
        borderCollapse: "collapse",
    },

    th: {
        textAlign: "left",
        padding: "12px",
        borderBottom: "2px solid #ddd",
    },

    td: {
        padding: "12px",
        borderBottom: "1px solid #eee",
    },

    editButton: {
        marginRight: "8px",
        padding: "7px 12px",
        border: "none",
        borderRadius: "5px",
        cursor: "pointer",
        backgroundColor: "#e0e0e0",
    },

    deleteButton: {
        padding: "7px 12px",
        border: "none",
        borderRadius: "5px",
        cursor: "pointer",
        backgroundColor: "#333",
        color: "#fff",
    },

    error: {
        padding: "15px",
        borderRadius: "6px",
        backgroundColor: "#ffe5e5",
        color: "#b00020",
    },

    empty: {
        padding: "30px",
        textAlign: "center",
        color: "#777",
    },
    accessButton: {
        marginRight: "8px",
        padding: "7px 12px",
        border: "none",
        borderRadius: "5px",
        cursor: "pointer",
        backgroundColor: "#e8d8c3",
        color: "#333",
    },
};

export default GroupPages;