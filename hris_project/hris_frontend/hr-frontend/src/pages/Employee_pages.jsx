    import React, { useState, useEffect } from "react";
    import api from "../api";
    import { StatCard, FilterBar } from "../components/StatisticCard_component";

    const EmployeePage = () => {
      // ==========================================
      // 1. STATE PERMISSION HAK AKSES
      // ==========================================
      const [userPermissions, setUserPermissions] = useState({
        isSuperuser: false,
        allowedCodenames: [],
      });
      const [loadingPermissions, setLoadingPermissions] = useState(true);

      // ==========================================
      // 2. STATE DATA UTAMA
      // ==========================================
      const [currentView, setCurrentView] = useState("list"); // 'list' | 'form'
      const [formMode, setFormMode] = useState("create"); // 'create' | 'edit' | 'detail'

      const [employees, setEmployees] = useState([]);
      const [companies, setCompanies] = useState([]);
      const [departments, setDepartments] = useState([]);
      const [positions, setPositions] = useState([]);
      const [loading, setLoading] = useState(false);
      const [error, setError] = useState("");
      const [selectedId, setSelectedId] = useState(null);

      // Filter State
      const [searchQuery, setSearchQuery] = useState("");
      const [filterDepartment, setFilterDepartment] = useState("ALL");

      // Form State
      const [formData, setFormData] = useState({
        nik_karyawan: "",
        biometric_user_id: "",
        nama_lengkap: "",
        nationality: "WNI",
        nik_ktp: "",
        passport_number: "",
        company: "",
        department: "",
        section: "",
        position: "",
        join_date: "",
        jenis_kelamin: "L",
        tempat_lahir: "",
        tanggal_lahir: "",
        agama: "ISLAM",
        pendidikan: "S1",
      });

      const BASE_URL = "/api/v1/master-data/Employees";

      // ==========================================
      // 3. FETCH PERMISSIONS & MASTER DATA
      // ==========================================
      useEffect(() => {
        fetchPermissions();
        fetchEmployees();
        fetchMasterOptions();
      }, []);

      const PushZKTeco = async () => {
        if (!selectedId) {
          alert("⚠️ Silakan pilih karyawan terlebih dahulu!");
          return;
        }
        setLoading(true);
        try {
          const syncResponse = await api.post("/api/v2/system/zkteco/push-employee/", {
            employee_id: selectedId,
          });

          const successMessage = syncResponse.data?.message || "Berhasil melakukan sinkronisasi ke ZKTeco BioTime!";
          const zkId = syncResponse.data?.zk_id;
          alert(`✅ SINKRONISASI BERHASIL!\n\n${successMessage}\nID BioTime: ${zkId || "-"}`);

          // Update state pesan lokal (jika ada)
          if (typeof setMessage === "function") {
            setMessage({
              type: "success",
              text: `Berhasil tersinkron ke ZKTeco BioTime (ID: ${zkId || "-"}).`,
            });
          }

          // Panggil ulang data list karyawan agar status/biometric_user_id ter-update di tabel UI
          if (typeof fetchEmployees === "function") {
            fetchEmployees();
          }

        } catch (err) {
          // ==========================================
          // 2. HANDLER RESPON GAGAL (400, 401, 500)
          // ==========================================
          console.error("Gagal Push ke ZKTeco:", err.response?.data || err.message);

          // Ekstrak pesan error dari backend Django / ZKTeco
          const errData = err.response?.data;
          let errorMessage = "Terjadi kesalahan sistem saat menghubungi server ZKTeco.";

          if (errData) {
            if (typeof errData.detail === "string") {
              errorMessage = errData.detail;
            } else if (errData.error && typeof errData.error === "object") {
              errorMessage = JSON.stringify(errData.error);
            } else if (typeof errData === "string") {
              errorMessage = errData;
            } else {
              errorMessage = JSON.stringify(errData);
            }
          } else if (err.message) {
            errorMessage = err.message;
          }

          // Tampilkan notifikasi pop-up gagal
          alert(`❌ GAGAL SYNC ZKTECO:\n\n${errorMessage}`);
          // Update state pesan lokal
          if (typeof setMessage === "function") {
            setMessage({
              type: "error",
              text: `Gagal Sync ZKTeco: ${errorMessage}`,
            });
          }
        } finally {
          setLoading(false);
        }
      };

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

      // Helper Hak Akses (Mendukung Superuser & Wildcard "*")
      const hasAccess = (codename) => {
        if (userPermissions.isSuperuser) return true;
        if (userPermissions.allowedCodenames.includes("*")) return true;
        return userPermissions.allowedCodenames.includes(codename);
      };

      const fetchEmployees = async () => {
        setLoading(true);
        setError("");
        try {
          const response = await api.get(`${BASE_URL}/`);
          const data = response.data.results || response.data || [];
          setEmployees(Array.isArray(data) ? data : []);
        } catch (err) {
          console.error("Gagal mengambil data karyawan:", err);
          setError("Gagal memuat data karyawan. Pastikan backend Django aktif.");
        } finally {
          setLoading(false);
        }
      };

      const fetchMasterOptions = async () => {
        try {
          const [resComp, resDept, resPos] = await Promise.all([
            api.get("/api/v1/master-data/Company/").catch(() => ({ data: [] })),
            api.get("/api/v1/master-data/Department/").catch(() => ({ data: [] })),
            api.get("/api/v1/master-data/Position/").catch(() => ({ data: [] })),
          ]);
          setCompanies(resComp.data.results || resComp.data || []);
          setDepartments(resDept.data.results || resDept.data || []);
          setPositions(resPos.data.results || resPos.data || []);
        } catch (err) {
          console.error("Gagal mengambil master data dropdown:", err);
        }
      };

      // ==========================================
      // FILTERING & STATISTIK
      // ==========================================
      const filteredData = employees.filter((item) => {
        const name = item.nama_lengkap || "";
        const nik = String(item.nik_karyawan || "");
        const bioId = String(item.biometric_user_id || "");

        const matchesSearch =
          name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          nik.includes(searchQuery) ||
          bioId.includes(searchQuery);

        const matchesDept =
          filterDepartment === "ALL"
            ? true
            : String(item.department) === String(filterDepartment) ||
              String(item.department?.id) === String(filterDepartment);

        return matchesSearch && matchesDept;
      });

      const totalMale = employees.filter((i) => i.jenis_kelamin === "L").length;
      const totalFemale = employees.filter((i) => i.jenis_kelamin === "P").length;
      const totalZkMapped = employees.filter((i) => i.biometric_user_id).length;

      // ==========================================
      // HANDLERS FORM & ACTION
      // ==========================================
      const handleOpenCreate = () => {
        setFormData({
          nik_karyawan: "",
          biometric_user_id: "",
          nama_lengkap: "",
          nationality: "WNI",
          nik_ktp: "",
          passport_number: "",
          company: "",
          department: "",
          section: "",
          position: "",
          join_date: "",
          jenis_kelamin: "L",
          tempat_lahir: "",
          tanggal_lahir: "",
          agama: "ISLAM",
          pendidikan: "S1",
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

          setFormData({
            nik_karyawan: data.nik_karyawan || "",
            biometric_user_id: data.biometric_user_id || "",
            nama_lengkap: data.nama_lengkap || "",
            nationality: data.nationality || "WNI",
            nik_ktp: data.nik_ktp || "",
            passport_number: data.passport_number || "",
            company: typeof data.company === "object" ? data.company?.id : data.company || "",
            department: typeof data.department === "object" ? data.department?.id : data.department || "",
            section: typeof data.section === "object" ? data.section?.id : data.section || "",
            position: typeof data.position === "object" ? data.position?.id : data.position || "",
            join_date: data.latest_contract_start_date || "",
            jenis_kelamin: data.jenis_kelamin || "L",
            tempat_lahir: data.tempat_lahir || "",
            tanggal_lahir: data.tanggal_lahir || "",
            agama: data.agama || "ISLAM",
            pendidikan: data.pendidikan || "S1",
          });
          setFormMode("detail");
          setCurrentView("form");
        } catch (err) {
          alert("Gagal memuat detail karyawan!");
        } finally {
          setLoading(false);
        }
      };

      const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        setLoading(true);

        const payload = {
          ...formData,
          nik_karyawan: parseInt(formData.nik_karyawan, 10),
          company: parseInt(formData.company, 10) || null,
          department: parseInt(formData.department, 10) || null,
          section: formData.section ? parseInt(formData.section, 10) : null,
          position: parseInt(formData.position, 10) || null,
        };

        try {
          if (formMode === "create") {
            await api.post(`${BASE_URL}/create/`, payload);
            alert("Karyawan berhasil ditambahkan!");
          } else if (formMode === "edit") {
            // PERBAIKAN: Menambahkan /update/ sesuai URL pattern Django backend
            await api.put(`${BASE_URL}/${selectedId}/update/`, payload);
            alert("Data karyawan berhasil diperbarui!");
          }
          setCurrentView("list");
          fetchEmployees();
        } catch (err) {
          console.error("SAVE ERROR:", err.response?.data || err);
          alert("Gagal menyimpan data karyawan. Periksa kembali inputan Anda.");
        } finally {
          setLoading(false);
        }
      };

      const handleDelete = async (id) => {
        if (!window.confirm("Apakah Anda yakin ingin menghapus data karyawan ini?")) return;
        setLoading(true);
        try {
          // PERBAIKAN: Menambahkan /delete/ sesuai URL pattern Django backend
          await api.delete(`${BASE_URL}/${id}/delete/`);
          alert("Karyawan berhasil dihapus!");
          setCurrentView("list");
          fetchEmployees();
        } catch (err) {
          alert("Gagal menghapus data karyawan.");
        } finally {
          setLoading(false);
        }
      };

      const deptOptions = [
        { value: "ALL", label: "Semua Departemen" },
        ...departments.map((d) => ({ value: String(d.id), label: d.name || d.nama_department })),
      ];

      // ==========================================
      // VIEW 1: FORM VIEW
      // ==========================================
      if (currentView === "form") {
        return (
          <div style={containerStyle}>
            <div style={{ ...headerStyle, borderBottom: "1px solid #e2e8f0", paddingBottom: "15px" }}>
              <div>
                <h3 style={{ margin: 0, color: "#0f172a" }}>
                  {formMode === "create"
                    ? "Tambah Karyawan Baru"
                    : formMode === "edit"
                    ? `Edit Karyawan: ${formData.nama_lengkap}`
                    : `Detail: ${formData.nama_lengkap}`}
                </h3>
                <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: "13px" }}>
                  Isi data demografi, organisasi, dan pemetaan biometrik ZKTeco
                </p>
              </div>
              <button onClick={() => setCurrentView("list")} style={cancelButtonStyle}>
                ← Kembali ke List
              </button>
              <button onClick={() => PushZKTeco(selectedId)} style={cancelButtonStyle}>
                Sync to ZKTeco
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ marginTop: "20px" }}>
              <div style={formGridStyle}>
                <div>
                  <label style={labelStyle}>NIK Karyawan (Angka) *</label>
                  <input
                    type="number"
                    disabled={formMode === "detail"}
                    placeholder="misal: 1001"
                    value={formData.nik_karyawan}
                    onChange={(e) => setFormData({ ...formData, nik_karyawan: e.target.value })}
                    style={inputSearchStyle}
                    required
                  />
                </div>

                <div>
                  <label style={labelStyle}>ID Biometrik ZKTeco (PIN Mesin)</label>
                  <input
                    type="text"
                    disabled={formMode === "detail"}
                    placeholder="misal: 1001"
                    value={formData.biometric_user_id}
                    onChange={(e) => setFormData({ ...formData, biometric_user_id: e.target.value })}
                    style={inputSearchStyle}
                  />
                </div>

                <div style={{ gridColumn: "span 2" }}>
                  <label style={labelStyle}>Nama Lengkap *</label>
                  <input
                    type="text"
                    disabled={formMode === "detail"}
                    placeholder="Nama sesuai KTP"
                    value={formData.nama_lengkap}
                    onChange={(e) => setFormData({ ...formData, nama_lengkap: e.target.value })}
                    style={inputSearchStyle}
                    required
                  />
                </div>

                <div>
                  <label style={labelStyle}>Company *</label>
                  <select
                    disabled={formMode === "detail"}
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    style={selectStyle}
                    required
                  >
                    <option value="">-- Pilih Company --</option>
                    {companies.map((c) => (
                      <option key={c.id} value={c.id}>{c.name || c.nama_company}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={labelStyle}>Department *</label>
                  <select
                    disabled={formMode === "detail"}
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    style={selectStyle}
                    required
                  >
                    <option value="">-- Pilih Department --</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>{d.name || d.nama_department}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={labelStyle}>Position *</label>
                  <select
                    disabled={formMode === "detail"}
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    style={selectStyle}
                    required
                  >
                    <option value="">-- Pilih Position --</option>
                    {positions.map((p) => (
                      <option key={p.id} value={p.id}>{p.name || p.nama_jabatan}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={labelStyle}>Tanggal Bergabung (Join Date) *</label>
                  <input
                    type="date"
                    disabled={true}
                    value={formData.join_date}
                    onChange={(e) => setFormData({ ...formData, join_date: e.target.value })}
                    style={inputDateStyle}
                    required
                  />
                </div>

                <div>
                  <label style={labelStyle}>Jenis Kelamin *</label>
                  <select
                    disabled={formMode === "detail"}
                    value={formData.jenis_kelamin}
                    onChange={(e) => setFormData({ ...formData, jenis_kelamin: e.target.value })}
                    style={selectStyle}
                  >
                    <option value="L">Laki-laki</option>
                    <option value="P">Perempuan</option>
                  </select>
                </div>

                <div>
                  <label style={labelStyle}>Agama</label>
                  <select
                    disabled={formMode === "detail"}
                    value={formData.agama}
                    onChange={(e) => setFormData({ ...formData, agama: e.target.value })}
                    style={selectStyle}
                  >
                    <option value="ISLAM">Islam</option>
                    <option value="KRISTEN">Kristen</option>
                    <option value="KATOLIK">Katolik</option>
                    <option value="HINDU">Hindu</option>
                    <option value="BUDDHA">Buddha</option>
                    <option value="KONGHUCU">Konghucu</option>
                  </select>
                </div>

                <div>
                  <label style={labelStyle}>Tempat Lahir</label>
                  <input
                    type="text"
                    disabled={formMode === "detail"}
                    value={formData.tempat_lahir}
                    onChange={(e) => setFormData({ ...formData, tempat_lahir: e.target.value })}
                    style={inputSearchStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Tanggal Lahir</label>
                  <input
                    type="date"
                    disabled={formMode === "detail"}
                    value={formData.tanggal_lahir}
                    onChange={(e) => setFormData({ ...formData, tanggal_lahir: e.target.value })}
                    style={inputDateStyle}
                  />
                </div>
              </div>

              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "20px" }}>
                {formMode === "detail" ? (
                  <>
                    {!loadingPermissions && hasAccess("EmployeeEdit") && (
                      <button
                        type="button"
                        onClick={() => setFormMode("edit")}
                        style={primaryButtonStyle}
                      >
                        ✏️ Edit Karyawan
                      </button>
                    )}

                    {!loadingPermissions && hasAccess("EmployeeDelete") && (
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
                        ? "Perbarui Data Karyawan"
                        : "Simpan Karyawan Baru"}
                    </button>
                  </>
                )}
              </div>
            </form>
          </div>
        );
      }

      // ==========================================
      // VIEW 2: LIST VIEW
      // ==========================================
      return (
        <div style={containerStyle}>
          {/* HEADER */}
          <div style={headerStyle}>
            <div>
              <h2 style={{ margin: 0, color: "#0f172a" }}>Master Data Employee</h2>
              <p style={{ margin: "5px 0 0", color: "#64748b", fontSize: "14px" }}>
                Kelola data demografi dan pemetaan biometrik mesin absensi
              </p>
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <button onClick={fetchEmployees} style={refreshButtonStyle}>
                🔄 Refresh Data
              </button>
              {!loadingPermissions && hasAccess("EmployeeCreate") && (
                <button onClick={handleOpenCreate} style={primaryButtonStyle}>
                  + Tambah Karyawan Baru
                </button>
              )}
            </div>
          </div>

          {/* STATISTIC CARDS */}
          <div style={statsContainerStyle}>
            <StatCard
              title="Total Karyawan"
              count={employees.length}
              isActive={filterDepartment === "ALL"}
              onClick={() => setFilterDepartment("ALL")}
            />
            <StatCard title="Laki-Laki" count={totalMale} color="#2563eb" />
            <StatCard title="Perempuan" count={totalFemale} color="#ec4899" />
            <StatCard
              title="Terhubung ZKTeco"
              count={totalZkMapped}
              color="#16a34a"
              bgColor="#f0fdf4"
              borderColor="#bbf7d0"
            />
          </div>

          {/* REUSABLE FILTER BAR */}
          <FilterBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            placeholder="Cari NIK Integer, Nama, atau ZKTeco ID..."
            filterValue={filterDepartment}
            onFilterChange={setFilterDepartment}
            filterOptions={deptOptions}
            onReset={() => setFilterDepartment("ALL")}
          />

          {error && <div style={errorBannerStyle}>{error}</div>}

          {/* TABLE DATA */}
          <div style={tableWrapperStyle}>
            <table style={tableStyle}>
              <thead>
                <tr style={tableHeaderRowStyle}>
                  <th style={thStyle}>NIK Karyawan</th>
                  <th style={thStyle}>Nama Karyawan</th>
                  <th style={thStyle}>ID ZKTeco</th>
                  <th style={thStyle}>Department</th>
                  <th style={thStyle}>Jabatan</th>
                  <th style={thStyle}>Join Date</th>
                  <th style={thStyle}>Contract Remaining</th>
                  <th style={{ ...thStyle, textAlign: "center" }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="7" style={emptyTdStyle}>Memuat data karyawan...</td>
                  </tr>
                ) : filteredData.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={emptyTdStyle}>Tidak ada data karyawan ditemukan.</td>
                  </tr>
                ) : (
                  filteredData.map((row, index) => (
                    <tr key={row.id || index} style={tableBodyRowStyle}>
                      <td style={tdStyle}>
                        <strong style={{ color: "#2563eb" }}>{row.nik_karyawan}</strong>
                      </td>
                      <td style={tdStyle}>
                        <strong>{row.nama_lengkap}</strong>
                      </td>
                      <td style={tdStyle}>
                        {row.biometric_user_id ? (
                          <span style={{ ...badgeStyle, background: "#dcfce7", color: "#15803d" }}>
                            ID: {row.biometric_user_id}
                          </span>
                        ) : (
                          <span style={{ color: "#94a3b8", fontSize: "12px" }}>Unmapped</span>
                        )}
                      </td>
                      <td style={tdStyle}>{row.department_name || "-"}</td>
                      <td style={tdStyle}>{row.position_name || "-"}</td>
                      <td style={tdStyle}>{row.latest_contract_start_date || "-"}</td>
                      <td style={tdStyle}>{row.latest_contract_days_remaining || "-"}</td>
                      <td style={{ ...tdStyle, textAlign: "center" }}>
                        {!loadingPermissions && (
                          <>
                            {hasAccess("EmployeeDetail") && (
                              <button onClick={() => handleOpenDetail(row.id)} style={actionButtonStyle}>
                                Buka
                              </button>
                            )}
                            {" "}
                            {hasAccess("EmployeeDelete") && (
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

    // ==========================================
    // STYLES
    // ==========================================
    const containerStyle = { background: "#ffffff", padding: "24px", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", fontFamily: "Arial, sans-serif" };
    const headerStyle = { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" };
    const refreshButtonStyle = { padding: "8px 16px", background: "#f1f5f9", color: "#334155", border: "1px solid #cbd5e1", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "13px" };
    const primaryButtonStyle = { padding: "8px 16px", background: "#2563eb", color: "#ffffff", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "13px" };
    const cancelButtonStyle = { padding: "8px 16px", background: "#64748b", color: "#ffffff", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "13px" };
    const clearFilterButtonStyle = { padding: "8px 16px", background: "#ef4444", color: "#ffffff", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "13px" };
    const statsContainerStyle = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "15px", marginBottom: "20px" };
    const inputSearchStyle = { flex: 1, minWidth: "200px", padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "14px", width: "100%", boxSizing: "border-box" };
    const inputDateStyle = { width: "100%", padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "14px", boxSizing: "border-box" };
    const selectStyle = { padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "14px", background: "#fff", width: "100%", boxSizing: "border-box" };
    const errorBannerStyle = { padding: "12px", background: "#fee2e2", color: "#b91c1c", borderRadius: "6px", marginBottom: "15px", fontSize: "14px" };
    const tableWrapperStyle = { overflowX: "auto", border: "1px solid #e2e8f0", borderRadius: "8px" };
    const tableStyle = { width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "14px" };
    const tableHeaderRowStyle = { background: "#f8fafc", borderBottom: "2px solid #e2e8f0" };
    const thStyle = { padding: "12px 16px", color: "#475569", fontWeight: "bold" };
    const tableBodyRowStyle = { borderBottom: "1px solid #f1f5f9" };
    const tdStyle = { padding: "12px 16px", color: "#334155", verticalAlign: "middle" };
    const emptyTdStyle = { padding: "30px", textAlign: "center", color: "#94a3b8" };
    const badgeStyle = { display: "inline-block", padding: "4px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: "bold" };
    const actionButtonStyle = { padding: "6px 12px", background: "#f1f5f9", color: "#334155", border: "1px solid #cbd5e1", borderRadius: "4px", cursor: "pointer", fontSize: "12px" };
    const actionDeleteStyle = { padding: "6px 12px", background: "#fee2e2", color: "#b91c1c", border: "1px solid #fca5a5", borderRadius: "4px", cursor: "pointer", fontSize: "12px" };
    const formGridStyle = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" };
    const labelStyle = { display: "block", fontSize: "12px", fontWeight: "bold", color: "#475569", marginBottom: "6px" };

    export default EmployeePage;