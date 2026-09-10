import React, { useState, useEffect } from "react";
import api from "../api";
import { StatCard, FilterBar } from "../components/StatisticCard_component";

const OnboardingPage1 = () => {
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
  const [sections, setSections] = useState([]);
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedId, setSelectedId] = useState(null);

  // Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL"); 

  // Initial State Form Data Sesuai Model Employee
  const initialFormState = {
    // Identitas Utama & Organisasi
    nik_karyawan: null,
    biometric_user_id: "",
    nama_lengkap: "",
    nik_ktp: "",
    passport_number: "",
    nationality: "WNI",
    phone_number: "",
    email: "",
    company: "",
    department: "",
    section: "",
    position: "",
    join_date: "",
    tangal_induksi: "",
    poin_of_hire: "",
    is_staff: false,

    // Data Demografi
    jenis_kelamin: "L",
    tempat_lahir: "",
    tanggal_lahir: "",
    agama: "ISLAM",
    blood_type: "A",
    pendidikan: "SMA",
    Employee_status: "TK/0",

    // Alamat
    address: "",
    kelurahan: "",
    kecamatan: "",
    city: "",
    province: "",
    pos_code: "",

    // Pasangan & Anak
    couple_name: "",
    couple_date_birth: "",
    first_child_name: "",
    first_child_date_birth: "",
    second_child_name: "",
    second_child_date_birth: "",
    third_child_name: "",
    third_child_date_birth: "",

    // Kontak Darurat
    emergency_contact_name: "",
    emergency_contact_phone: "",
    emergency_contact_relation: "ayah",

    // Ukuran Seragam
    shirt_size: "M",
    pants_size: 30,
    shoes_size: 35,
  };

  const [formData, setFormData] = useState(initialFormState);
  const BASE_URL = "/api/v1/onboarding/onboarding";

  // ==========================================
  // 3. FETCH PERMISSIONS & MASTER DATA
  // ==========================================
  useEffect(() => {
    fetchPermissions();
    fetchEmployees();
    fetchMasterOptions();
  }, []);

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
      const [resComp, resDept, resSec, resPos] = await Promise.all([
        api.get("/api/v1/master-data/Company/").catch(() => ({ data: [] })),
        api.get("/api/v1/master-data/Department/").catch(() => ({ data: [] })),
        api.get("/api/v1/master-data/Section/").catch(() => ({ data: [] })),
        api.get("/api/v1/master-data/Position/").catch(() => ({ data: [] })),
      ]);
      setCompanies(resComp.data.results || resComp.data || []);
      setDepartments(resDept.data.results || resDept.data || []);
      setSections(resSec.data.results || resSec.data || []);
      setPositions(resPos.data.results || resPos.data || []);
    } catch (err) {
      console.error("Gagal mengambil master data dropdown:", err);
    }
  };

  // Helper Sanitasi Payload sebelum dikirim ke API
  const cleanPayload = (data) => {
    const cleanDate = (val) => (val && String(val).trim() !== "" ? val : null);
    const cleanStr = (val) => (val && String(val).trim() !== "" ? val : null);

    return {
      ...data,
      nik_karyawan: data.nik_karyawan ? String(data.nik_karyawan) : "",
      company: parseInt(data.company, 10) || null,
      department: parseInt(data.department, 10) || null,
      section: parseInt(data.section, 10) || null,
      position: parseInt(data.position, 10) || null,
      pants_size: parseInt(data.pants_size, 10) || 30,
      shoes_size: parseInt(data.shoes_size, 10) || 35,

      // Format Null untuk Tanggal jika Kosong
      join_date: cleanDate(data.join_date),
      tanggal_lahir: cleanDate(data.tanggal_lahir),
      tangal_induksi: cleanDate(data.tangal_induksi),
      couple_date_birth: cleanDate(data.couple_date_birth),
      first_child_date_birth: cleanDate(data.first_child_date_birth),
      second_child_date_birth: cleanDate(data.second_child_date_birth),
      third_child_date_birth: cleanDate(data.third_child_date_birth),

      // Format Null untuk String Opsional
      nik_ktp: cleanStr(data.nik_ktp),
      passport_number: cleanStr(data.passport_number),
      biometric_user_id: cleanStr(data.biometric_user_id),
      phone_number: cleanStr(data.phone_number),
      email: cleanStr(data.email),
      poin_of_hire: cleanStr(data.poin_of_hire),
      address: cleanStr(data.address),
      kelurahan: cleanStr(data.kelurahan),
      kecamatan: cleanStr(data.kecamatan),
      city: cleanStr(data.city),
      province: cleanStr(data.province),
      pos_code: cleanStr(data.pos_code),
      couple_name: cleanStr(data.couple_name),
      first_child_name: cleanStr(data.first_child_name),
      second_child_name: cleanStr(data.second_child_name),
      third_child_name: cleanStr(data.third_child_name),
      emergency_contact_name: cleanStr(data.emergency_contact_name),
      emergency_contact_phone: cleanStr(data.emergency_contact_phone),
    };
  };

  const ApproveButton = async () => {
    if (!selectedId) {
      alert("⚠️ Silakan pilih karyawan terlebih dahulu!");
      return;
    }
    setLoading(true);
    const payload = cleanPayload(formData);

    try {
      await api.put(`${BASE_URL}/${selectedId}/update/`, payload);
      alert("Data Onboarding Berhasil Di Approve!");
      setCurrentView("list");
      fetchEmployees();
    } catch (err) {
      console.error("SAVE ERROR:", err.response?.data || err);
      alert("Gagal Menyimpan data onboarding. Periksa kembalaaaai kelengkapan field! : ", err)
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    const payload = cleanPayload(formData);

    try {
      if (formMode === "create") {
        await api.post(`${BASE_URL}/create/`, payload);
        alert("Karyawan berhasil ditambahkan!");
      } else if (formMode === "edit") {
        await api.put(`${BASE_URL}/${selectedId}/update/`, payload);
        alert("Data karyawan berhasil diperbarui!");
      }
      setCurrentView("list");
      fetchEmployees();
    } catch (err) {
      console.error("SAVE ERROR:", err.response?.data || err);
      alert("Gagal menyimpan data Onboarding. Periksa kembali inputan Anda.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus data karyawan ini?")) return;
    setLoading(true);
    try {
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

  const handleOpenCreate = () => {
    setFormData(initialFormState);
    setFormMode("create");
    setSelectedId(null);
    setCurrentView("form");
  };

  const handleOpenDetail = async (id) => {
    setLoading(true);
    setSelectedId(id);
    console.log('iddddddd',id)
    try {
      const response = await api.get(`${BASE_URL}/${id}/`);
      const data = response.data;
      console.log('responsee1e11', data)

      setFormData({
        nik_karyawan: data.nik_karyawan || null,
        biometric_user_id: data.biometric_user_id || "",
        nama_lengkap: data.nama_lengkap || "",
        nik_ktp: data.nik_ktp || "",
        passport_number: data.passport_number || "",
        nationality: data.nationality || "WNI",
        phone_number: data.phone_number || "",
        email: data.email || "",
        company: typeof data.company === "object" ? data.company?.id : data.company || "",
        department: typeof data.department === "object" ? data.department?.id : data.department || "",
        section: typeof data.section === "object" ? data.section?.id : data.section || "",
        position: typeof data.position === "object" ? data.position?.id : data.position || "",
        join_date: data.join_date || "",
        tangal_induksi: data.tangal_induksi || "",
        poin_of_hire: data.poin_of_hire || "",
        is_staff: Boolean(data.is_staff),

        jenis_kelamin: data.jenis_kelamin || "L",
        tempat_lahir: data.tempat_lahir || "",
        tanggal_lahir: data.tanggal_lahir || "",
        agama: data.agama || "ISLAM",
        blood_type: data.blood_type || "A",
        pendidikan: data.pendidikan || "SMA",
        Employee_status: data.Employee_status || "TK/0",

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
        pants_size: data.pants_size || 30,
        shoes_size: data.shoes_size || 35,
      });

      setFormMode("detail");
      setCurrentView("form");
    } catch (err) {
      alert("Gagal memuat detail karyawan!");
    } finally {
      setLoading(false);
    }
  };

  // Filter & Options
  const filteredData = employees.filter((item) => {
    const name = item.nama_lengkap || "";
    const nik = String(item.nik_karyawan || "");

    const matchesSearch =
      name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      nik.includes(searchQuery);

    const matchesDept =
      filterDepartment === "ALL"
        ? true
        : String(item.department) === String(filterDepartment) ||
          String(item.department?.id) === String(filterDepartment);

    const matchesStatus =
        filterStatus === "ALL" ? true : item.form_status === filterStatus;
    return matchesSearch && matchesDept && matchesStatus;
  });

  const deptOptions = [
    { value: "ALL", label: "Semua Departemen" },
    ...departments.map((d) => ({ value: String(d.id), label: d.name || d.nama_department })),
  ];

  const totaldraft = employees.filter((i) => i.form_status === "draft").length;
  const totalprogress = employees.filter((i) => i.form_status === "progress").length;
  const totalapproved = employees.filter((i) => i.form_status === "approved").length;

  // ==========================================
  // VIEW 1: FORM VIEW (DENGAN LENGKAP FIELD)
  // ==========================================
  if (currentView === "form") {
    return (
      <div style={containerStyle}>
        <div style={{ ...headerStyle, borderBottom: "1px solid #e2e8f0", paddingBottom: "15px" }}>
          <div>
            <h3 style={{ margin: 0, color: "#0f172a" }}>
              {formMode === "create"
                ? "Tambah Karyawan Onboarding"
                : formMode === "edit"
                ? `Edit Karyawan: ${formData.nama_lengkap}`
                : `Detail: ${formData.nama_lengkap}`}
            </h3>
            <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: "13px" }}>
              Kelola data profil, alamat, keluarga, dan atribut kerja karyawan
            </p>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <button onClick={() => setCurrentView("list")} style={cancelButtonStyle}>
              ← Kembali ke List
            </button>
            {formMode !== "create" && (
              <button onClick={ApproveButton} style={approveButtonStyle}>
                Approve
              </button>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ marginTop: "20px" }}>
          {/* SECTION 1: IDENTITAS UTAMA & DOKUMEN */}
          <SectionHeader title="A. Data Identitas Utama & Dokumen" />
          <div style={formGridStyle}>
            <div>
              <label style={labelStyle}>NIK Karyawan *</label>
              <input
                type="text"
                disabled={formMode === "detail"}
                value={formData.nik_karyawan}
                onChange={(e) => setFormData({ ...formData, nik_karyawan: e.target.value })}
                style={inputSearchStyle}
              />
            </div>

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
              <label style={labelStyle}>ID Biometrik ZKTeco</label>
              <input
                type="text"
                disabled={formMode === "detail"}
                value={formData.biometric_user_id}
                onChange={(e) => setFormData({ ...formData, biometric_user_id: e.target.value })}
                style={inputSearchStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>NIK KTP (16 Digit)</label>
              <input
                type="text"
                maxLength={16}
                disabled={formMode === "detail"}
                value={formData.nik_ktp}
                onChange={(e) => setFormData({ ...formData, nik_ktp: e.target.value })}
                style={inputSearchStyle}
                required
              />
            </div>

            <div>
              <label style={labelStyle}>No. Passport</label>
              <input
                type="text"
                disabled={formMode === "detail"}
                value={formData.passport_number}
                onChange={(e) => setFormData({ ...formData, passport_number: e.target.value })}
                style={inputSearchStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Kewarganegaraan (Nationality)</label>
              <select
                disabled={formMode === "detail"}
                value={formData.nationality}
                onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                style={inputSearchStyle}
              >
                <option value="WNI">Warga Negara Indonesia (WNI)</option>
                <option value="WNA">Warga Negara Asing (WNA)</option>
              </select>
            </div>

            <div>
              <label style={labelStyle}>No. WhatsApp / Handphone</label>
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
          </div>

          {/* SECTION 2: DEMOGRAFI & STATUS */}
          <SectionHeader title="B. Data Demografi & Pendidikan" />
          <div style={formGridStyle}>
            <div>
              <label style={labelStyle}>Jenis Kelamin *</label>
              <select
                disabled={formMode === "detail"}
                value={formData.jenis_kelamin}
                onChange={(e) => setFormData({ ...formData, jenis_kelamin: e.target.value })}
                style={inputSearchStyle}
              >
                <option value="L">Laki-laki</option>
                <option value="P">Perempuan</option>
              </select>
            </div>

            <div>
              <label style={labelStyle}>Tempat Lahir *</label>
              <input
                type="text"
                disabled={formMode === "detail"}
                value={formData.tempat_lahir}
                onChange={(e) => setFormData({ ...formData, tempat_lahir: e.target.value })}
                style={inputSearchStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Tanggal Lahir *</label>
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
                style={inputSearchStyle}
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
                style={inputSearchStyle}
              >
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="AB">AB</option>
                <option value="O">O</option>
              </select>
            </div>

            <div>
              <label style={labelStyle}>Pendidikan Terakhir</label>
              <select
                disabled={formMode === "detail"}
                value={formData.pendidikan}
                onChange={(e) => setFormData({ ...formData, pendidikan: e.target.value })}
                style={inputSearchStyle}
              >
                <option value="SMA">SMA/Sederajat</option>
                <option value="D3">Diploma 3 (D3)</option>
                <option value="S1">Strata 1 (S1)</option>
                <option value="S2">Strata 2 (S2)</option>
                <option value="S3">Strata 3 (S3)</option>
                <option value="LAINNYA">Lainnya</option>
              </select>
            </div>

            <div>
              <label style={labelStyle}>Status Pernikahan / Pajak (PTKP)</label>
              <select
                disabled={formMode === "detail"}
                value={formData.Employee_status}
                onChange={(e) => setFormData({ ...formData, Employee_status: e.target.value })}
                style={inputSearchStyle}
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

          {/* SECTION 3: ORGANISASI & PEKERJAAN */}
          <SectionHeader title="C. Relasi Organisasi & Pekerjaan" />
          <div style={formGridStyle}>
            <div>
              <label style={labelStyle}>Company</label>
              <select
                disabled={formMode === "detail"}
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                style={inputSearchStyle}
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
                style={inputSearchStyle}
              >
                <option value="">-- Pilih Department --</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name || d.nama_department}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={labelStyle}>Section</label>
              <select
                disabled={formMode === "detail"}
                value={formData.section}
                onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                style={inputSearchStyle}
              >
                <option value="">-- Pilih Section --</option>
                {sections.map((s) => (
                  <option key={s.id} value={s.id}>{s.name || s.nama_section}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={labelStyle}>Position (Jabatan)</label>
              <select
                disabled={formMode === "detail"}
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                style={inputSearchStyle}
              >
                <option value="">-- Pilih Jabatan --</option>
                {positions.map((p) => (
                  <option key={p.id} value={p.id}>{p.name || p.nama_jabatan}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={labelStyle}>Tanggal Bergabung (Join Date)</label>
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
                placeholder="misal: Jakarta / Balikpapan"
                value={formData.poin_of_hire}
                onChange={(e) => setFormData({ ...formData, poin_of_hire: e.target.value })}
                style={inputSearchStyle}
              />
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "24px" }}>
              <input
                type="checkbox"
                id="is_staff"
                disabled={formMode === "detail"}
                checked={formData.is_staff}
                onChange={(e) => setFormData({ ...formData, is_staff: e.target.checked })}
              />
              <label htmlFor="is_staff" style={{ fontSize: "14px", color: "#334155", fontWeight: "bold" }}>
                Karyawan Tingkat Staff (Grade Staff)
              </label>
            </div>
          </div>

          {/* SECTION 4: ALAMAT LENGKAP */}
          <SectionHeader title="D. Alamat Tempat Tinggal" />
          <div style={formGridStyle}>
            <div style={{ gridColumn: "span 2" }}>
              <label style={labelStyle}>Alamat Lengkap</label>
              <textarea
                rows={2}
                disabled={formMode === "detail"}
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                style={{ ...inputSearchStyle, height: "auto" }}
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

          {/* SECTION 5: DATA PASANGAN & ANAK */}
          <SectionHeader title="E. Data Pasangan & Anak" />
          <div style={formGridStyle}>
            <div>
              <label style={labelStyle}>Nama Suami / Istri</label>
              <input
                type="text"
                disabled={formMode === "detail"}
                value={formData.couple_name}
                onChange={(e) => setFormData({ ...formData, couple_name: e.target.value })}
                style={inputSearchStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Tanggal Lahir Pasangan</label>
              <input
                type="date"
                disabled={formMode === "detail"}
                value={formData.couple_date_birth}
                onChange={(e) => setFormData({ ...formData, couple_date_birth: e.target.value })}
                style={inputDateStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Nama Anak Ke-1</label>
              <input
                type="text"
                disabled={formMode === "detail"}
                value={formData.first_child_name}
                onChange={(e) => setFormData({ ...formData, first_child_name: e.target.value })}
                style={inputSearchStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Tanggal Lahir Anak Ke-1</label>
              <input
                type="date"
                disabled={formMode === "detail"}
                value={formData.first_child_date_birth}
                onChange={(e) => setFormData({ ...formData, first_child_date_birth: e.target.value })}
                style={inputDateStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Nama Anak Ke-2</label>
              <input
                type="text"
                disabled={formMode === "detail"}
                value={formData.second_child_name}
                onChange={(e) => setFormData({ ...formData, second_child_name: e.target.value })}
                style={inputSearchStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Tanggal Lahir Anak Ke-2</label>
              <input
                type="date"
                disabled={formMode === "detail"}
                value={formData.second_child_date_birth}
                onChange={(e) => setFormData({ ...formData, second_child_date_birth: e.target.value })}
                style={inputDateStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Nama Anak Ke-3</label>
              <input
                type="text"
                disabled={formMode === "detail"}
                value={formData.third_child_name}
                onChange={(e) => setFormData({ ...formData, third_child_name: e.target.value })}
                style={inputSearchStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Tanggal Lahir Anak Ke-3</label>
              <input
                type="date"
                disabled={formMode === "detail"}
                value={formData.third_child_date_birth}
                onChange={(e) => setFormData({ ...formData, third_child_date_birth: e.target.value })}
                style={inputDateStyle}
              />
            </div>
          </div>

          {/* SECTION 6: KONTAK DARURAT */}
          <SectionHeader title="F. Kontak Darurat" />
          <div style={formGridStyle}>
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
                style={inputSearchStyle}
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

          {/* SECTION 7: UKURAN SERAGAM */}
          <SectionHeader title="G. Ukuran Seragam & Perlengkapan" />
          <div style={formGridStyle}>
            <div>
              <label style={labelStyle}>Ukuran Baju / Kaos</label>
              <select
                disabled={formMode === "detail"}
                value={formData.shirt_size}
                onChange={(e) => setFormData({ ...formData, shirt_size: e.target.value })}
                style={inputSearchStyle}
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
              <label style={labelStyle}>Ukuran Celana (Angka)</label>
              <input
                type="number"
                disabled={formMode === "detail"}
                value={formData.pants_size}
                onChange={(e) => setFormData({ ...formData, pants_size: e.target.value })}
                style={inputSearchStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Ukuran Sepatu (Angka)</label>
              <input
                type="number"
                disabled={formMode === "detail"}
                value={formData.shoes_size}
                onChange={(e) => setFormData({ ...formData, shoes_size: e.target.value })}
                style={inputSearchStyle}
              />
            </div>
          </div>

          {/* TOMBOL AKSI */}
          <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "30px" }}>
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

      <div style={statsContainerStyle}>
        <StatCard
          title="Total Karyawan"
          count={employees.length}
          isActive={filterDepartment === "ALL" && filterStatus === "ALL"}
          onClick={() => {
            setFilterDepartment("ALL"); setFilterStatus("ALL");
          }} 
            
        />
        <StatCard 
        title="Draft" 
        count={totaldraft} 
        color="#2563eb" 
        isActive={filterStatus === "draft"}
        onClick={() => setFilterStatus("draft")}
        />
        <StatCard 
        title="Progress" 
        count={totalprogress} 
        color="#ec4899" 
        onClick={() => setFilterStatus("Progress")}

        />
        <StatCard
          title="Approved"
          count={totalapproved}
          color="#16a34a"
          bgColor="#f0fdf4"
          borderColor="#bbf7d0"
          onClick={() => setFilterStatus("Approved")}
        />
      </div>

      <FilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        placeholder="Cari NIK, Nama, atau ZKTeco ID..."
        filterValue={filterDepartment}
        onFilterChange={setFilterDepartment}
        filterOptions={deptOptions}
        onReset={() => setFilterDepartment("ALL")}
      />

      {error && <div style={errorBannerStyle}>{error}</div>}

      <div style={tableWrapperStyle}>
        <table style={tableStyle}>
          <thead>
            <tr style={tableHeaderRowStyle}>
              <th style={thStyle}>NIK Karyawan</th>
              <th style={thStyle}>Nama Karyawan</th>
              <th style={thStyle}>Department</th>
              <th style={thStyle}>Jabatan</th>
              <th style={thStyle}>Status Form</th>
              <th style={{ ...thStyle, textAlign: "center" }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" style={emptyTdStyle}>Memuat data karyawan...</td>
              </tr>
            ) : filteredData.length === 0 ? (
              <tr>
                <td colSpan="6" style={emptyTdStyle}>Tidak ada data karyawan ditemukan.</td>
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
                  <td style={tdStyle}>{row.department_name || row.department?.name || "-"}</td>
                  <td style={tdStyle}>{row.position_name || row.position?.name || "-"}</td>
                  <td style={tdStyle}>
                    <span style={{
                      ...badgeStyle,
                      backgroundColor: row.form_status === 'approved' ? '#dcfce7' : '#f1f5f9',
                      color: row.form_status === 'approved' ? '#15803d' : '#475569'
                    }}>
                      {row.form_status || "-"}
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

// Component Sub-Header untuk memisahkan form
const SectionHeader = ({ title }) => (
  <div style={{
    borderBottom: "2px solid #e2e8f0",
    paddingBottom: "6px",
    marginTop: "24px",
    marginBottom: "16px"
  }}>
    <h4 style={{ margin: 0, color: "#1e293b", fontSize: "14px", fontWeight: "bold" }}>{title}</h4>
  </div>
);

// Styles
const containerStyle = { background: "#ffffff", padding: "24px", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", fontFamily: "Arial, sans-serif" };
const headerStyle = { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" };
const refreshButtonStyle = { padding: "8px 16px", background: "#f1f5f9", color: "#334155", border: "1px solid #cbd5e1", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "13px" };
const primaryButtonStyle = { padding: "8px 16px", background: "#2563eb", color: "#ffffff", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "13px" };
const cancelButtonStyle = { padding: "8px 16px", background: "#64748b", color: "#ffffff", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "13px" };
const approveButtonStyle = { padding: "8px 16px", background: "#16a34a", color: "#ffffff", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "13px" };
const clearFilterButtonStyle = { padding: "8px 16px", background: "#ef4444", color: "#ffffff", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "13px" };
const statsContainerStyle = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "15px", marginBottom: "20px" };
const inputSearchStyle = { padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "14px", width: "100%", boxSizing: "border-box" };
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

export default OnboardingPage1;