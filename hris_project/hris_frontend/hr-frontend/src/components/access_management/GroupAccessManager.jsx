import React, { useEffect, useState } from "react";
import api from "../../api";

const GroupAccessManager = ({ group, onClose }) => {

    const [templates, setTemplates] = useState([]);
    const [assignments, setAssignments] = useState([]);

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    const [error, setError] = useState("");


    // ==========================================
    // GET ALL ACCESS TEMPLATES
    // ==========================================

    const fetchTemplates = async () => {

        try {

            const response = await api.get(
                "api/v2/APItemplates/"
            );
            setTemplates(response.data);

        } catch (error) {
            setError(
                "Gagal mengambil access template"
            );
        }
    };


    // ==========================================
    // GET ACCESS MILIK GROUP
    // ==========================================

    const fetchGroupAccess = async () => {

        try {

            setLoading(true);
            setError("");
            const response = await api.get(
                `api/v2/Group-AA/?group=${group.id}`
            );

            setAssignments(response.data);

        } catch (error) {

            setError(
                "Gagal mengambil access group"
            );

        } finally {

            setLoading(false);

        }
    };


    // ==========================================
    // LOAD DATA
    // ==========================================

    useEffect(() => {

        fetchTemplates();
        fetchGroupAccess();

    }, [group.id]);


    // ==========================================
    // CEK APAKAH TEMPLATE SUDAH DIMILIKI GROUP
    // ==========================================

    const isAssigned = (templateId) => {

        return assignments.some(
            (assignment) =>
                assignment.template === templateId
        );

    };


    // ==========================================
    // GET ASSIGNMENT
    // ==========================================

    const getAssignment = (templateId) => {

        return assignments.find(
            (assignment) =>
                assignment.template === templateId
        );

    };


    // ==========================================
    // TOGGLE ACCESS
    // ==========================================

    const handleToggle = async (template) => {

        try {

            setSaving(true);

            const assignment =
                getAssignment(template.id);


            // ==================================
            // REMOVE ACCESS
            // ==================================

            if (assignment) {

                console.log(
                    "REMOVE TEMPLATE:",
                    assignment
                );

                await api.delete(
                    `api/v2/Group-AA/${assignment.id}/`
                );

            }

            // ==================================
            // ADD ACCESS
            // ==================================

            else {

                console.log(
                    "ASSIGN TEMPLATE:",
                    {
                        group: group.id,
                        template: template.id
                    }
                );

                await api.post(
                    "api/v2/Group-AA/",
                    {
                        group: group.id,
                        template: template.id
                    }
                );

            }


            // Refresh access
            await fetchGroupAccess();

        } catch (error) {

            console.error(
                "Gagal mengubah access:",
                error
            );

            console.error(
                "Status:",
                error.response?.status
            );

            console.error(
                "Data:",
                error.response?.data
            );

            alert(
                error.response?.data?.detail ||
                "Gagal mengubah access"
            );

        } finally {

            setSaving(false);

        }

    };


    return (

        <div style={styles.overlay}>

            <div style={styles.modal}>

                {/* ============================= */}
                {/* HEADER */}
                {/* ============================= */}

                <div style={styles.header}>

                    <div>

                        <h2 style={styles.title}>
                            Manage Access
                        </h2>

                        <p style={styles.groupName}>
                            Role: <strong>
                                {group.name}
                            </strong>
                        </p>

                    </div>

                    <button
                        onClick={onClose}
                        style={styles.closeButton}
                    >
                        ✕
                    </button>

                </div>


                {/* ============================= */}
                {/* ERROR */}
                {/* ============================= */}

                {error && (

                    <div style={styles.error}>
                        {error}
                    </div>

                )}


                {/* ============================= */}
                {/* LOADING */}
                {/* ============================= */}

                {loading ? (

                    <p>
                        Loading access...
                    </p>

                ) : (

                    <div>

                        <h3>
                            Access Templates
                        </h3>


                        {templates.length === 0 ? (

                            <div style={styles.empty}>
                                Belum ada access template.
                            </div>

                        ) : (

                            templates.map(
                                (template) => {

                                    const checked =
                                        isAssigned(
                                            template.id
                                        );

                                    return (

                                        <div
                                            key={
                                                template.id
                                            }
                                            style={
                                                styles.templateCard
                                            }
                                        >

                                            <label
                                                style={
                                                    styles.templateLabel
                                                }
                                            >

                                                <input
                                                    type="checkbox"

                                                    checked={
                                                        checked
                                                    }

                                                    disabled={
                                                        saving
                                                    }

                                                    onChange={() =>
                                                        handleToggle(
                                                            template
                                                        )
                                                    }

                                                    style={
                                                        styles.checkbox
                                                    }
                                                />

                                                <span>

                                                    <strong>
                                                        {
                                                            template.name
                                                        }
                                                    </strong>

                                                    <br />

                                                    <small>

                                                        {
                                                            template
                                                                .allowed_codenames
                                                                ?.length || 0
                                                        }{" "}
                                                        API Access

                                                    </small>

                                                </span>

                                            </label>


                                            {template.description && (

                                                <p
                                                    style={
                                                        styles.description
                                                    }
                                                >
                                                    {
                                                        template.description
                                                    }
                                                </p>

                                            )}

                                        </div>

                                    );

                                }
                            )

                        )}

                    </div>

                )}


                {/* ============================= */}
                {/* FOOTER */}
                {/* ============================= */}

                <div style={styles.footer}>

                    <button
                        onClick={onClose}
                        style={
                            styles.closeFooterButton
                        }
                    >
                        Tutup
                    </button>

                </div>

            </div>

        </div>

    );

};


// ==========================================
// STYLES
// ==========================================

const styles = {

    overlay: {
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.45)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1000,
    },

    modal: {
        width: "600px",
        maxWidth: "90%",
        maxHeight: "80vh",
        overflowY: "auto",
        backgroundColor: "#fff",
        borderRadius: "12px",
        padding: "25px",
        boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
    },

    header: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: "25px",
    },

    title: {
        margin: 0,
        fontSize: "22px",
    },

    groupName: {
        marginTop: "5px",
        color: "#666",
    },

    closeButton: {
        border: "none",
        backgroundColor: "transparent",
        fontSize: "20px",
        cursor: "pointer",
    },

    templateCard: {
        border: "1px solid #ddd",
        borderRadius: "8px",
        padding: "15px",
        marginBottom: "10px",
    },

    templateLabel: {
        display: "flex",
        alignItems: "center",
        gap: "12px",
        cursor: "pointer",
    },

    checkbox: {
        width: "18px",
        height: "18px",
    },

    description: {
        marginLeft: "30px",
        color: "#666",
        fontSize: "14px",
    },

    error: {
        padding: "12px",
        marginBottom: "15px",
        backgroundColor: "#ffe5e5",
        color: "#b00020",
        borderRadius: "6px",
    },

    empty: {
        padding: "20px",
        textAlign: "center",
        color: "#777",
    },

    footer: {
        marginTop: "25px",
        textAlign: "right",
    },

    closeFooterButton: {
        padding: "9px 18px",
        border: "1px solid #ccc",
        borderRadius: "6px",
        backgroundColor: "#fff",
        cursor: "pointer",
    },

};

export default GroupAccessManager;