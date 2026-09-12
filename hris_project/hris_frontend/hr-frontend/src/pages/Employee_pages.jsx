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

  // Initial Form State Berdasarkan Model Employee Terbaru
  const initialFormState = {
    biometric_user_id: "",
    zk_code: "",
    nama_lengkap: "",
    nik_karyawan: "",
    nik_ktp: "",
    nationality: "WNI",
    phone_number: "",
    email: "",
    jenis_kelamin: "L",
    tempat_lahir: "",
    tanggal_lahir: "",
    agama: "ISLAM",
    blood_type: "A",
    pendidikan: "S1",
    passport_number: "",
    join_date: "",
    Employee_status: "TK/0",
    status: "draft",
    form_status: "draft",

    // Relasi
    company: "",
    department: "",
    section: "",
    position: "",

    // Alamat
    address: "",
    kelurahan: "",
    kecamatan: "",
    city: "",
    province: "",
    pos_code: "",

    // Keluarga & Kontak Darurat
    couple_name: "",
    couple_date_birth: "",
    first_child_name: "",
    first_child_date_birth: "",
    second_child_name: "",
    second_child_date_birth: "",
    third_child_name: "",
    third_child_date_birth: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
    emergency_contact_relation: "ayah",

    // Ukuran & Seragam
    shirt_size: "M",
    pants_size: 30,
    shoes_size: 40,

    // Informasi Tambahan
    tangal_induksi: "",
    poin_of_hire: "",
    is_local: false,
    is_staff: false,
    is_onboarding: false,
    onboarding_id: "",
    is_edited: false,
  };

  const [formData, setFormData] = useState(initialFormState);
  const BASE_URL = "/api/v1/master-data";

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
      const syncResponse = await api.post("/api/v2/system/zkteco/employeeSync/", {
        employee_id: selectedId,
      });

      const successMessage = syncResponse.data?.message || "Berhasil melakukan sinkronisasi ke ZKTeco BioTime!";
      const zkId = syncResponse.data?.zk_id;
      alert(`✅ SINKRONISASI BERHASIL!\n\n${successMessage}\nID BioTime: ${zkId || "-"}`);

      fetchEmployees();
    } catch (err) {
      console.error("Gagal Push ke ZKTeco:", err.response?.data || err.message);
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
      alert(`❌ GAGAL SYNC ZKTECO:\n\n${errorMessage}`);
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

  const hasAccess = (codename) => {
    if (userPermissions.isSuperuser) return true;
    if (userPermissions.allowedCodenames.includes("*")) return true;
    return userPermissions.allowedCodenames.includes(codename);
  };

  const fetchEmployees = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get(`${BASE_URL}/Employees/`);
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
    const ktp = String(item.nik_ktp || "");

    const matchesSearch =
      name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      nik.includes(searchQuery) ||
      bioId.includes(searchQuery) ||
      ktp.includes(searchQuery);

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
    setFormData(initialFormState);
    setFormMode("create");
    setSelectedId(null);
    setCurrentView("form");
  };

  const handleOpenDetail = async (id) => {
    setLoading(true);
    setSelectedId(id);
    try {
      const response = await api.get(`${BASE_URL}/Employees/${id}/`);
      const data = response.data;

      setFormData({
        biometric_user_id: data.biometric_user_id || "",
        zk_code: data.zk_code || "",
        nama_lengkap: data.nama_lengkap || "",
        nik_karyawan: data.nik_karyawan || "",
        nik_ktp: data.nik_ktp || "",
        nationality: data.nationality || "WNI",
        phone_number: data.phone_number || "",
        email: data.email || "",
        jenis_kelamin: data.jenis_kelamin || "L",
        tempat_lahir: data.tempat_lahir || null,
        tanggal_lahir: data.tanggal_lahir || null,
        agama: data.agama || "ISLAM",
        blood_type: data.blood_type || "A",
        pendidikan: data.pendidikan || "S1",
        passport_number: data.passport_number || "",
        join_date: data.join_date || "",
        Employee_status: data.Employee_status || "TK/0",
        status: data.status || "draft",
        form_status: data.form_status || "draft",

        company: typeof data.company === "object" ? data.company?.id : data.company || "",
        department: typeof data.department === "object" ? data.department?.id : data.department || "",
        section: typeof data.section === "object" ? data.section?.id : data.section || "",
        position: typeof data.position === "object" ? data.position?.id : data.position || "",

        address: data.address || "",
        kelurahan: data.kelurahan || "",
        kecamatan: data.kecamatan || "",
        city: data.city || "",
        province: data.province || "",
        pos_code: data.pos_code || "",

        couple_name: data.couple_name || "",
        couple_date_birth: data.couple_date_birth || "",
        first_child_name: data.first_child_name || "",
        first_child_date_birth: data.first_child_date_birth || "",
        second_child_name: data.second_child_name || "",
        second_child_date_birth: data.second_child_date_birth || "",
        third_child_name: data.third_child_name || "",
        third_child_date_birth: data.third_child_date_birth || "",
        emergency_contact_name: data.emergency_contact_name || "",
        emergency_contact_phone: data.emergency_contact_phone || "",
        emergency_contact_relation: data.emergency_contact_relation || "ayah",

        shirt_size: data.shirt_size || "M",
        pants_size: data.pants_size ?? 30,
        shoes_size: data.shoes_size ?? 40,

        tangal_induksi: data.tangal_induksi || "",
        poin_of_hire: data.poin_of_hire || "",
        is_local: data.is_local ?? false,
        is_staff: data.is_staff ?? false,
        is_onboarding: data.is_onboarding ?? false,
        onboarding_id: data.onboarding_id || "",
        is_edited: data.is_edited ?? false,
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
      company: formData.company ? parseInt(formData.company, 10) : null,
      department: formData.department ? parseInt(formData.department, 10) : null,
      section: formData.section ? parseInt(formData.section, 10) : null,
      position: formData.position ? parseInt(formData.position, 10) : null,
      pants_size: formData.pants_size ? parseInt(formData.pants_size, 10) : 30,
      shoes_size: formData.shoes_size ? parseInt(formData.shoes_size, 10) : 40,
    };

    try {
      if (formMode === "create") {
        await api.post(`${BASE_URL}/Employees/create/`, payload);
        alert("Karyawan berhasil ditambahkan!");
      } else if (formMode === "edit") {
        const { id, ...changes } = payload;
        const staggingPayload = {
          employee_id: selectedId,
          changes: changes,
        };
        await api.post(`${BASE_URL}/employee-stagging/submit/`, staggingPayload);
        alert("Data Perubahan karyawan berhasil Direquest ke Staging!");
      }
      setCurrentView("list");
      fetchEmployees();
    } catch (err) {
      console.error("SAVE ERROR:", err.response?.data || err);
      const backendMessage = err.response?.data?.detail || "Gagal menyimpan data karyawan. Periksa kembali inputan Anda.";
      alert(backendMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus data karyawan ini?")) return;
    setLoading(true);
    try {
      await api.delete(`${BASE_URL}/Employees/${id}/delete/`);
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
                : `Detail Karyawan: ${formData.nama_lengkap}`}
            </h3>
            <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: "13px" }}>
              Isi data demografi, organisasi, alamat, keluarga, serta atribut seragam.
            </p>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <button onClick={() => setCurrentView("list")} style={cancelButtonStyle}>
              ← Kembali ke List
            </button>
            {formMode === "detail" && (
              <button onClick={PushZKTeco} style={primaryButtonStyle}>
                Sync to ZKTeco
              </button>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ marginTop: "20px" }}>
          {/* SECTION A: DATA DIRI & BIOMETRIK */}
          <h4 style={sectionHeaderStyle}>A. Data Diri & Biometrik</h4>
          <div style={formGridStyle}>
            <div>
              <label style={labelStyle}>Nama Lengkap *</label>
              <input
                type="text"
                disabled={formMode === "detail"}
                value={formData.nama_lengkap}
                onChange={(e) => setFormData({ ...formData, nama_lengkap: e.target.value })}
                style={inputSearchStyle}
                required
              />
            </div>
            <div>
              <label style={labelStyle}>NIK Karyawan</label>
              <input
                type="text"
                disabled={formMode === "detail"}
                value={formData.nik_karyawan}
                onChange={(e) => setFormData({ ...formData, nik_karyawan: e.target.value })}
                style={inputSearchStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>ID Biometrik ZKTeco (PIN Mesin)</label>
              <input
                type="text"
                disabled={formMode === "detail"}
                value={formData.biometric_user_id}
                onChange={(e) => setFormData({ ...formData, biometric_user_id: e.target.value })}
                style={inputSearchStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>ZK Employee Code</label>
              <input
                type="text"
                disabled={formMode === "detail"}
                value={formData.zk_code}
                onChange={(e) => setFormData({ ...formData, zk_code: e.target.value })}
                style={inputSearchStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>NIK KTP</label>
              <input
                type="text"
                maxLength={16}
                disabled={formMode === "detail"}
                value={formData.nik_ktp}
                onChange={(e) => setFormData({ ...formData, nik_ktp: e.target.value })}
                style={inputSearchStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Nomor Passport</label>
              <input
                type="text"
                disabled={formMode === "detail"}
                value={formData.passport_number}
                onChange={(e) => setFormData({ ...formData, passport_number: e.target.value })}
                style={inputSearchStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Kewarganegaraan</label>
              <select
                disabled={formMode === "detail"}
                value={formData.nationality}
                onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                style={selectStyle}
              >
                <option value="WNI">Warga Negara Indonesia (WNI)</option>
                <option value="WNA">Warga Negara Asing (Expat)</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>No. WhatsApp / HP</label>
              <input
                type="text"
                disabled={formMode === "detail"}
                value={formData.phone_number}
                onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                style={inputSearchStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Email</label>
              <input
                type="email"
                disabled={formMode === "detail"}
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                style={inputSearchStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Jenis Kelamin</label>
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
                <option value="LAINNYA">Lainnya</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Golongan Darah</label>
              <select
                disabled={formMode === "detail"}
                value={formData.blood_type}
                onChange={(e) => setFormData({ ...formData, blood_type: e.target.value })}
                style={selectStyle}
              >
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="AB">AB</option>
                <option value="O">O</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Pendidikan terakhir</label>
              <select
                disabled={formMode === "detail"}
                value={formData.pendidikan}
                onChange={(e) => setFormData({ ...formData, pendidikan: e.target.value })}
                style={selectStyle}
              >
                <option value="SMA">SMA/Sederajat</option>
                <option value="D3">Diploma 3</option>
                <option value="S1">Strata 1</option>
                <option value="S2">Strata 2</option>
                <option value="S3">Strata 3</option>
                <option value="LAINNYA">Lainnya</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Status Pernikahan / PTKP</label>
              <select
                disabled={formMode === "detail"}
                value={formData.Employee_status}
                onChange={(e) => setFormData({ ...formData, Employee_status: e.target.value })}
                style={selectStyle}
              >
                <option value="TK/0">Belum Menikah / Janda (TK/0)</option>
                <option value="K/0">Menikah (K/0)</option>
                <option value="K/1">Menikah, Anak 1 (K/1)</option>
                <option value="K/2">Menikah, Anak 2 (K/2)</option>
                <option value="K/3">Menikah, Anak 3 (K/3)</option>
                <option value="TK/1">Duda, Anak 1 (TK/1)</option>
                <option value="TK/2">Duda, Anak 2 (TK/2)</option>
                <option value="TK/3">Duda, Anak 3 (TK/3)</option>
              </select>
            </div>
          </div>

          {/* SECTION B: PEKERJAAN & ORGANISASI */}
          <h4 style={sectionHeaderStyle}>B. Pekerjaan & Organisasi</h4>
          <div style={formGridStyle}>
            <div>
              <label style={labelStyle}>Company</label>
              <select
                disabled={formMode === "detail"}
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                style={selectStyle}
              >
                <option value="">-- Pilih Company --</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>{c.name || c.nama_company}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Department</label>
              <select
                disabled={formMode === "detail"}
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                style={selectStyle}
              >
                <option value="">-- Pilih Department --</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name || d.nama_department}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Position (Jabatan)</label>
              <select
                disabled={formMode === "detail"}
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                style={selectStyle}
              >
                <option value="">-- Pilih Position --</option>
                {positions.map((p) => (
                  <option key={p.id} value={p.id}>{p.name || p.nama_jabatan}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Join Date (Tanggal Masuk)</label>
              <input
                type="date"
                disabled={formMode === "detail"}
                value={formData.join_date}
                onChange={(e) => setFormData({ ...formData, join_date: e.target.value })}
                style={inputDateStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Tanggal Induksi</label>
              <input
                type="date"
                disabled={formMode === "detail"}
                value={formData.tangal_induksi}
                onChange={(e) => setFormData({ ...formData, tangal_induksi: e.target.value })}
                style={inputDateStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Point Of Hire</label>
              <input
                type="text"
                disabled={formMode === "detail"}
                value={formData.poin_of_hire}
                onChange={(e) => setFormData({ ...formData, poin_of_hire: e.target.value })}
                style={inputSearchStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Status Sistem</label>
              <select
                disabled={formMode === "detail"}
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                style={selectStyle}
              >
                <option value="draft">Draft</option>
                <option value="progress">In Progress</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Form Status</label>
              <select
                disabled={formMode === "detail"}
                value={formData.form_status}
                onChange={(e) => setFormData({ ...formData, form_status: e.target.value })}
                style={selectStyle}
              >
                <option value="draft">Draft</option>
                <option value="progress">In Progress</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            <div style={{ display: "flex", gap: "20px", alignItems: "center", marginTop: "15px" }}>
              <label style={{ cursor: "pointer", fontSize: "13px", color: "#334155" }}>
                <input
                  type="checkbox"
                  disabled={formMode === "detail"}
                  checked={formData.is_local}
                  onChange={(e) => setFormData({ ...formData, is_local: e.target.checked })}
                /> {" "}
                Is Local (Pekerja Lokal)
              </label>

              <label style={{ cursor: "pointer", fontSize: "13px", color: "#334155" }}>
                <input
                  type="checkbox"
                  disabled={formMode === "detail"}
                  checked={formData.is_staff}
                  onChange={(e) => setFormData({ ...formData, is_staff: e.target.checked })}
                /> {" "}
                Is Staff (Grade Staff)
              </label>
            </div>
          </div>

          {/* SECTION C: ALAMAT LENGKAP */}
          <h4 style={sectionHeaderStyle}>C. Alamat Domisili / KTP</h4>
          <div style={formGridStyle}>
            <div style={{ gridColumn: "span 2" }}>
              <label style={labelStyle}>Alamat Lengkap</label>
              <textarea
                disabled={formMode === "detail"}
                rows={2}
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                style={{ ...inputSearchStyle, width: "100%" }}
              />
            </div>
            <div>
              <label style={labelStyle}>Kelurahan</label>
              <input
                type="text"
                disabled={formMode === "detail"}
                value={formData.kelurahan}
                onChange={(e) => setFormData({ ...formData, kelurahan: e.target.value })}
                style={inputSearchStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Kecamatan</label>
              <input
                type="text"
                disabled={formMode === "detail"}
                value={formData.kecamatan}
                onChange={(e) => setFormData({ ...formData, kecamatan: e.target.value })}
                style={inputSearchStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Kota / Kabupaten</label>
              <input
                type="text"
                disabled={formMode === "detail"}
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                style={inputSearchStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Provinsi</label>
              <input
                type="text"
                disabled={formMode === "detail"}
                value={formData.province}
                onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                style={inputSearchStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Kode Pos</label>
              <input
                type="text"
                disabled={formMode === "detail"}
                value={formData.pos_code}
                onChange={(e) => setFormData({ ...formData, pos_code: e.target.value })}
                style={inputSearchStyle}
              />
            </div>
          </div>

          {/* SECTION D: KELUARGA & KONTAK DARURAT */}
          <h4 style={sectionHeaderStyle}>D. Data Keluarga & Kontak Darurat</h4>
          <div style={formGridStyle}>
            <div>
              <label style={labelStyle}>Nama Suami/Istri</label>
              <input
                type="text"
                disabled={formMode === "detail"}
                value={formData.couple_name}
                onChange={(e) => setFormData({ ...formData, couple_name: e.target.value })}
                style={inputSearchStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Tanggal Lahir Suami/Istri</label>
              <input
                type="date"
                disabled={formMode === "detail"}
                value={formData.couple_date_birth}
                onChange={(e) => setFormData({ ...formData, couple_date_birth: e.target.value })}
                style={inputDateStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Nama Anak Pertama</label>
              <input
                type="text"
                disabled={formMode === "detail"}
                value={formData.first_child_name}
                onChange={(e) => setFormData({ ...formData, first_child_name: e.target.value })}
                style={inputSearchStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Tanggal Lahir Anak Pertama</label>
              <input
                type="date"
                disabled={formMode === "detail"}
                value={formData.first_child_date_birth}
                onChange={(e) => setFormData({ ...formData, first_child_date_birth: e.target.value })}
                style={inputDateStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Nama Anak Kedua</label>
              <input
                type="text"
                disabled={formMode === "detail"}
                value={formData.second_child_name}
                onChange={(e) => setFormData({ ...formData, second_child_name: e.target.value })}
                style={inputSearchStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Tanggal Lahir Anak Kedua</label>
              <input
                type="date"
                disabled={formMode === "detail"}
                value={formData.second_child_date_birth}
                onChange={(e) => setFormData({ ...formData, second_child_date_birth: e.target.value })}
                style={inputDateStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Nama Anak Ketiga</label>
              <input
                type="text"
                disabled={formMode === "detail"}
                value={formData.third_child_name}
                onChange={(e) => setFormData({ ...formData, third_child_name: e.target.value })}
                style={inputSearchStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Tanggal Lahir Anak Ketiga</label>
              <input
                type="date"
                disabled={formMode === "detail"}
                value={formData.third_child_date_birth}
                onChange={(e) => setFormData({ ...formData, third_child_date_birth: e.target.value })}
                style={inputDateStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Nama Kontak Darurat</label>
              <input
                type="text"
                disabled={formMode === "detail"}
                value={formData.emergency_contact_name}
                onChange={(e) => setFormData({ ...formData, emergency_contact_name: e.target.value })}
                style={inputSearchStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>No. HP Kontak Darurat</label>
              <input
                type="text"
                disabled={formMode === "detail"}
                value={formData.emergency_contact_phone}
                onChange={(e) => setFormData({ ...formData, emergency_contact_phone: e.target.value })}
                style={inputSearchStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Hubungan Kontak Darurat</label>
              <select
                disabled={formMode === "detail"}
                value={formData.emergency_contact_relation}
                onChange={(e) => setFormData({ ...formData, emergency_contact_relation: e.target.value })}
                style={selectStyle}
              >
                <option value="ayah">Ayah</option>
                <option value="ibu">Ibu</option>
                <option value="kakak">Kakak</option>
                <option value="adik">Adik</option>
                <option value="saudara">Saudara</option>
                <option value="pasangan">Suami/Istri</option>
              </select>
            </div>
          </div>

          {/* SECTION E: UKURAN SERAGAM */}
          <h4 style={sectionHeaderStyle}>E. Ukuran Seragam & Perlengkapan</h4>
          <div style={formGridStyle}>
            <div>
              <label style={labelStyle}>Ukuran Baju</label>
              <select
                disabled={formMode === "detail"}
                value={formData.shirt_size}
                onChange={(e) => setFormData({ ...formData, shirt_size: e.target.value })}
                style={selectStyle}
              >
                <option value="S">S</option>
                <option value="M">M</option>
                <option value="L">L</option>
                <option value="XL">XL</option>
                <option value="XXL">XXL</option>
                <option value="XXXL">XXXL</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Ukuran Celana</label>
              <input
                type="number"
                disabled={formMode === "detail"}
                value={formData.pants_size}
                onChange={(e) => setFormData({ ...formData, pants_size: e.target.value })}
                style={inputSearchStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Ukuran Sepatu</label>
              <input
                type="number"
                disabled={formMode === "detail"}
                value={formData.shoes_size}
                onChange={(e) => setFormData({ ...formData, shoes_size: e.target.value })}
                style={inputSearchStyle}
              />
            </div>
          </div>

          {/* BUTTON ACTIONS */}
          <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "30px" }}>
            {formMode === "detail" ? (
              <>
                {!loadingPermissions && hasAccess("EmployeeEdit") && formData.is_edited === false && (
                  <button
                    type="button"
                    onClick={() => setFormMode("edit")}
                    style={primaryButtonStyle}
                  >
                    ✏️ Edit Karyawan
                  </button>
                )}

                {!loadingPermissions && hasAccess("EmployeeDelete") && formData.is_edited === false && (
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
                    ? "Request Perubahan Data Karyawan"
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
        placeholder="Cari NIK, KTP, Nama, atau ZKTeco ID..."
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
              <th style={thStyle}>Status</th>
              <th style={{ ...thStyle, textAlign: "center" }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8" style={emptyTdStyle}>Memuat data karyawan...</td>
              </tr>
            ) : filteredData.length === 0 ? (
              <tr>
                <td colSpan="8" style={emptyTdStyle}>Tidak ada data karyawan ditemukan.</td>
              </tr>
            ) : (
              filteredData.map((row, index) => (
                <tr key={row.id || index} style={tableBodyRowStyle}>
                  <td style={tdStyle}>
                    <strong style={{ color: "#2563eb" }}>{row.nik_karyawan || "-"}</strong>
                  </td>
                  <td style={tdStyle}>
                    <strong>{row.nama_lengkap}</strong>
                    {row.is_edited && (
                      <span style={{ marginLeft: "6px", color: "#d97706", fontSize: "11px", fontWeight: "bold" }}>
                        [Editing Staging]
                      </span>
                    )}
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
                  <td style={tdStyle}>{row.department_name || row.department?.name || "-"}</td>
                  <td style={tdStyle}>{row.position_name || row.position?.name || "-"}</td>
                  <td style={tdStyle}>{row.join_date || "-"}</td>
                  <td style={tdStyle}>
                    <span style={{ ...badgeStyle, background: row.status === 'active' ? '#dcfce7' : '#f1f5f9', color: row.status === 'active' ? '#15803d' : '#64748b' }}>
                      {row.status}
                    </span>
                  </td>
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
const sectionHeaderStyle = { marginTop: "24px", marginBottom: "12px", paddingBottom: "6px", borderBottom: "2px solid #3b82f6", color: "#1e293b", fontSize: "15px" };
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