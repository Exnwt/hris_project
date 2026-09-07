import React, {useState, useEffect} from "react";
import api from "../api";
import { StatCard, FilterBar } from "../components/StatisticCard_component";
import { usePermissions } from "../auth/auth";


const DepartmentPage = () => {
    // const [userPermissions, setUserPermissions] = useState({
        //     isSuperuser : false,
        //     allowedCodenames: [],
        // });        

    const { hasAccess, loadingPermissions } = usePermissions();
    const [currentView, setCurrentView] = useState("list");
    const [formMode, setFormMode] = useState("create");

    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [selectedId, setSelectedId] = useState(null);

    // buat filter
    const [searchQuery, setSearchQuery] = useState("");

    const [formData, setFormData] = useState({
        name: "",
    });

    const BASE_URL = "/api/v1/master-data/Department";

    useEffect(() =>{
        fetchDepartment();
    },[]);

    const fetchDepartment = async () => {
        setLoading(true);
        setError("")
        try{
            const response = await api.get(`${BASE_URL}/`)
            console.log('response', response)
            const data = response.data.results || response.data || [] ;
            setDepartments(Array.isArray(data) ? data : []);
        }catch (err) {
            console.error("Gagal mengambil data Department:", err);
            setError("Gagal memuat data Department")
        } finally {
            setLoading(false);
        }
    };

    const filteredData = departments.filter((item) => {
        const name = item.name || "";

        return (
            name.toLowerCase().includes(searchQuery.toLowerCase())
        );
    });

    const handleOpenCreate = () => {
        setFormData({
            name: "",
        });
        setFormMode("create");
        setSelectedId(null);
        setCurrentView("form");
    };

    const handleOpenDetail = async (id) => {
        setLoading(true);
        setSelectedId(id);
        try{
            const response = await api.get(`${BASE_URL}/${id}`);
            const data = response.data;

            setFormData({
                name: data.name || ""
            })
            setFormMode("detail")
            setCurrentView("form");
        }   catch (err) {
            alert("Gagal memuat detail Department");
        } finally {
            setLoading(false);
        }

    };

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        setLoading(true);
        try {
            if (formMode === "create") {
                await api.post(`${BASE_URL}/create/`, formData);
                alert("Data berhasil di tambahkan")
            } else if (formMode === "edit") {
                await api.put(`${BASE_URL}/${selectedId}/update/`, formData);
                alert("Data Berhasil di Update")
            }
            setCurrentView("list");
            fetchDepartment();
        } catch (error) {
            alert("Proses Gagal mohon di cek kembali ", error)
        }finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Apakah anda yakin ingin menghapus data ini ?")) return;
        setLoading(true);
        try {
            await api.delete(`${BASE_URL}/${id}/delete/`);
            alert("Data berhasil di hapus!");
            setCurrentView("list");
            fetchDepartment();
        } catch (err) {
            alert("Gagal menghapus data : ", err)
        }finally{
            setLoading(false);
        }
    }

    const totalDepartments = departments.length;


    if (currentView === "form") {
        return(
            <div style={containerStyle}>
                <div style={{ ...headerStyle, borderBottom: "1px solid #e2e8f0", paddingBottom: "15px" }}>
                <div>
                    <h3 style={{ margin: 0, color: "#0f172a" }}>
                    {formMode === "create"
                        ? "Tambah Department Baru"
                        : formMode === "edit"
                        ? `Edit Department: ${formData.name}`
                        : `Detail Department: ${formData.name}`}
                    </h3>
                </div>
                <button onClick={() => setCurrentView("list")} style={cancelButtonStyle}>
                    ← Kembali ke List
                </button>
                </div>
                <form onSubmit={handleSubmit} style={{ marginTop: "20px" }}>
                    <div style={formGridStyle}>
                        <div>
                        <label style={labelStyle}>Nama Department *</label>
                        <input
                            type="text"
                            disabled={formMode === "detail"}
                            placeholder="misal: IT"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            style={inputSearchStyle}
                            required
                        />
                        </div>

                    </div>

                    <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "20px" }}>
                        {formMode === "detail" ? (
                        <>
                            {!loadingPermissions && hasAccess("CompanyEdit") && (
                            <button
                                type="button"
                                onClick={() => setFormMode("edit")}
                                style={primaryButtonStyle}
                            >
                                ✏️ Edit Company
                            </button>
                            )}

                            {!loadingPermissions && hasAccess("CompanyDelete") && (
                            <button
                                type="button"
                                onClick={() => handleDelete(selectedId)}
                                style={clearFilterButtonStyle}
                            >
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
                            style={cancelButtonStyle}
                            >
                            Batal
                            </button>

                            <button type="submit" disabled={loading} style={primaryButtonStyle}>
                            {loading
                                ? "Menyimpan..."
                                : formMode === "edit"
                                ? "Perbarui Department"
                                : "Simpan Departmen Baru"}
                            </button>
                        </>
                        )}
                    </div>
                </form>
            </div>
        );
    }

    // list view 
    return (
        <div style={containerStyle}>
            <div style={headerStyle}>
                <div>
                    <h2 style={{margin: 0, color: "#0f172a"}}>
                        Department Master Data
                    </h2>
                    <p style={{ margin: "5px 0 0", color: "#64748b", fontSize: "14px" }}>
                        Kelola Data Department
                    </p>
                </div>
                <div style={{display: "flex", gap: "10px"}}>
                    <button onClick={fetchDepartment} style={refreshButtonStyle}>
                        🔄 Refresh Data
                    </button>
                    {!loadingPermissions && hasAccess("department-create") && (
                        <button onClick={handleOpenCreate} style={primaryButtonStyle}>
                            + Tambah Company Baru
                        </button>
                    )}
                </div>
            </div>
            <div style={statsContainerStyle}>
                <StatCard
                title="Total Department"
                count={totalDepartments}
                isActive={true}
                />
            </div>
            <FilterBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            placeholder="Cari Kode, Nama Department"
            />
            {error && <div style={errorBannerStyle}>{error}</div>}
            <div style={tableWrapperStyle}>
                <table style={tableStyle}>
                    <thead>
                        <tr style={tableHeaderRowStyle}>
                        <th style={thStyle}>Nama Department</th>
                        <th style={{ ...thStyle, textAlign: "center" }}>Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                        <tr>
                            <td colSpan="5" style={emptyTdStyle}>Memuat data Department...</td>
                        </tr>
                        ) : filteredData.length === 0 ? (
                        <tr>
                            <td colSpan="5" style={emptyTdStyle}>Tidak ada data Department ditemukan.</td>
                        </tr>
                        ) : (
                        filteredData.map((row, index) => (
                            <tr key={row.id || index} style={tableBodyRowStyle}>
                            <td style={tdStyle}>
                                <strong>{row.name}</strong>
                            </td>
                            <td style={{ ...tdStyle, textAlign: "center" }}>
                                {!loadingPermissions && (
                                <>
                                    {hasAccess("department-detail") && (
                                    <button onClick={() => handleOpenDetail(row.id)} style={actionButtonStyle}>
                                        Buka
                                    </button>
                                    )}
                                    {" "}
                                    {hasAccess("department-delete") && (
                                    <button onClick={() => handleDelete(row.id)} style={actionDeleteStyle}>
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
const containerStyle = { background: "#ffffff", padding: "24px", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", fontFamily: "Arial, sans-serif" };
const headerStyle = { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" };
const refreshButtonStyle = { padding: "8px 16px", background: "#f1f5f9", color: "#334155", border: "1px solid #cbd5e1", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "13px" };
const primaryButtonStyle = { padding: "8px 16px", background: "#2563eb", color: "#ffffff", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "13px" };
const cancelButtonStyle = { padding: "8px 16px", background: "#64748b", color: "#ffffff", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "13px" };
const clearFilterButtonStyle = { padding: "8px 16px", background: "#ef4444", color: "#ffffff", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "13px" };
const statsContainerStyle = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "15px", marginBottom: "20px" };
const inputSearchStyle = { flex: 1, minWidth: "200px", padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "14px", width: "100%", boxSizing: "border-box" };
const errorBannerStyle = { padding: "12px", background: "#fee2e2", color: "#b91c1c", borderRadius: "6px", marginBottom: "15px", fontSize: "14px" };
const tableWrapperStyle = { overflowX: "auto", border: "1px solid #e2e8f0", borderRadius: "8px" };
const tableStyle = { width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "14px" };
const tableHeaderRowStyle = { background: "#f8fafc", borderBottom: "2px solid #e2e8f0" };
const thStyle = { padding: "12px 16px", color: "#475569", fontWeight: "bold" };
const tableBodyRowStyle = { borderBottom: "1px solid #f1f5f9" };
const tdStyle = { padding: "12px 16px", color: "#334155", verticalAlign: "middle" };
const emptyTdStyle = { padding: "30px", textAlign: "center", color: "#94a3b8" };
const actionButtonStyle = { padding: "6px 12px", background: "#f1f5f9", color: "#334155", border: "1px solid #cbd5e1", borderRadius: "4px", cursor: "pointer", fontSize: "12px" };
const actionDeleteStyle = { padding: "6px 12px", background: "#fee2e2", color: "#b91c1c", border: "1px solid #fca5a5", borderRadius: "4px", cursor: "pointer", fontSize: "12px" };
const formGridStyle = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" };
const labelStyle = { display: "block", fontSize: "12px", fontWeight: "bold", color: "#475569", marginBottom: "6px" };

export default DepartmentPage;
