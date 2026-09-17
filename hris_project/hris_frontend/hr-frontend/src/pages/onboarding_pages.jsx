import React, { useState, useEffect } from "react";
import api from "../api";
import { StatCard, FilterBar } from "../components/StatisticCard_component";
import "../styles/Onboarding.css"; 

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
  const [currentView, setCurrentView] = useState("list"); 
  const [formMode, setFormMode] = useState("create"); 

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

  const initialFormState = {
    nik_karyawan: null, biometric_user_id: "", nama_lengkap: "", nik_ktp: "",
    passport_number: "", nationality: "WNI", phone_number: "", email: "",
    company: "", department: "", section: "", position: "",
    join_date: "", tangal_induksi: "", poin_of_hire: "", is_staff: false,
    jenis_kelamin: "L", tempat_lahir: "", tanggal_lahir: "", agama: "ISLAM",
    blood_type: "A", pendidikan: "SMA", Employee_status: "TK/0",
    address: "", kelurahan: "", kecamatan: "", city: "", province: "", pos_code: "",
    couple_name: "", couple_date_birth: "",
    first_child_name: "", first_child_date_birth: "",
    second_child_name: "", second_child_date_birth: "",
    third_child_name: "", third_child_date_birth: "",
    emergency_contact_name: "", emergency_contact_phone: "", emergency_contact_relation: "ayah",
    shirt_size: "M", pants_size: 30, shoes_size: 35,
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
      join_date: cleanDate(data.join_date),
      tanggal_lahir: cleanDate(data.tanggal_lahir),
      tangal_induksi: cleanDate(data.tangal_induksi),
      couple_date_birth: cleanDate(data.couple_date_birth),
      first_child_date_birth: cleanDate(data.first_child_date_birth),
      second_child_date_birth: cleanDate(data.second_child_date_birth),
      third_child_date_birth: cleanDate(data.third_child_date_birth),
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
      alert("Gagal Menyimpan data onboarding. Periksa kembali kelengkapan field!");
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
    try {
      const response = await api.get(`${BASE_URL}/${id}/`);
      const data = response.data;

      setFormData({
        ...initialFormState,
        ...data,
        company: typeof data.company === "object" ? data.company?.id : data.company || "",
        department: typeof data.department === "object" ? data.department?.id : data.department || "",
        section: typeof data.section === "object" ? data.section?.id : data.section || "",
        position: typeof data.position === "object" ? data.position?.id : data.position || "",
        is_staff: Boolean(data.is_staff),
      });

      setFormMode("detail");
      setCurrentView("form");
    } catch (err) {
      alert("Gagal memuat detail karyawan!");
    } finally {
      setLoading(false);
    }
  };

  const filteredData = employees.filter((item) => {
    const name = item.nama_lengkap || "";
    const nik = String(item.nik_karyawan || "");
    const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase()) || nik.includes(searchQuery);
    const matchesDept = filterDepartment === "ALL" ? true : String(item.department) === String(filterDepartment) || String(item.department?.id) === String(filterDepartment);
    const matchesStatus = filterStatus === "ALL" ? true : item.form_status === filterStatus;
    
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
  // LOGIKA RENDER FORM KELUARGA (PTKP)
  // ==========================================
  const empStatus = formData.Employee_status;
  // Jika K (Kawin) -> Show Partner
  const showPartner = empStatus.startsWith("K");
  // Jika berakhiran 1, 2, atau 3 -> Show Anak 1
  const showChild1 = ["K/1", "K/2", "K/3", "TK/1", "TK/2", "TK/3"].includes(empStatus);
  // Jika berakhiran 2 atau 3 -> Show Anak 2
  const showChild2 = ["K/2", "K/3", "TK/2", "TK/3"].includes(empStatus);
  // Jika berakhiran 3 -> Show Anak 3
  const showChild3 = ["K/3", "TK/3"].includes(empStatus);


  // ==========================================
  // VIEW 1: FORM VIEW
  // ==========================================
  if (currentView === "form") {
    return (
      <div className="ob-container">
        <div className="ob-header" style={{ borderBottom: "1px solid #e2e8f0", paddingBottom: "15px" }}>
          <div>
            <h3 className="ob-header-title">
              {formMode === "create" ? "Tambah Karyawan Onboarding"
                : formMode === "edit" ? `Edit Karyawan: ${formData.nama_lengkap}`
                : `Detail: ${formData.nama_lengkap}`}
            </h3>
            <p className="ob-header-subtitle">
              Kelola data profil, alamat, keluarga, dan atribut kerja karyawan
            </p>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <button onClick={() => setCurrentView("list")} className="ob-btn ob-btn-cancel">
              ← Kembali ke List
            </button>
            {formMode !== "create" && !loadingPermissions && hasAccess('employeeApproveStagging') && (
              <button onClick={ApproveButton} className="ob-btn ob-btn-success">
                ✓ Approve
              </button>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ marginTop: "20px" }}>
          <SectionHeader title="A. Data Identitas Utama & Dokumen" />
          <div className="ob-form-grid">
            <div>
              <label className="ob-label">NIK Karyawan *</label>
              <input type="text" className="ob-input" disabled={formMode === "detail"}
                value={formData.nik_karyawan || ""}
                onChange={(e) => setFormData({ ...formData, nik_karyawan: e.target.value })}
              />
            </div>
            <div>
              <label className="ob-label">Nama Lengkap *</label>
              <input type="text" className="ob-input" required disabled={formMode === "detail"}
                value={formData.nama_lengkap || ""}
                onChange={(e) => setFormData({ ...formData, nama_lengkap: e.target.value })}
              />
            </div>
            <div>
              <label className="ob-label">ID Biometrik ZKTeco</label>
              <input type="text" className="ob-input" disabled={formMode === "detail"}
                value={formData.biometric_user_id || ""}
                onChange={(e) => setFormData({ ...formData, biometric_user_id: e.target.value })}
              />
            </div>
            <div>
              <label className="ob-label">NIK KTP (16 Digit)</label>
              <input type="text" maxLength={16} className="ob-input" required disabled={formMode === "detail"}
                value={formData.nik_ktp || ""}
                onChange={(e) => setFormData({ ...formData, nik_ktp: e.target.value })}
              />
            </div>
            <div>
              <label className="ob-label">No. Passport</label>
              <input type="text" className="ob-input" disabled={formMode === "detail"}
                value={formData.passport_number || ""}
                onChange={(e) => setFormData({ ...formData, passport_number: e.target.value })}
              />
            </div>
            <div>
              <label className="ob-label">Kewarganegaraan</label>
              <select className="ob-select" disabled={formMode === "detail"}
                value={formData.nationality}
                onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}>
                <option value="WNI">Warga Negara Indonesia (WNI)</option>
                <option value="WNA">Warga Negara Asing (WNA)</option>
              </select>
            </div>
            <div>
              <label className="ob-label">No. WhatsApp / Handphone</label>
              <input type="text" className="ob-input" disabled={formMode === "detail"}
                value={formData.phone_number || ""}
                onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
              />
            </div>
            <div>
              <label className="ob-label">Email</label>
              <input type="email" className="ob-input" disabled={formMode === "detail"}
                value={formData.email || ""}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
          </div>

          <SectionHeader title="B. Data Demografi & Pendidikan" />
          <div className="ob-form-grid">
            <div>
              <label className="ob-label">Jenis Kelamin *</label>
              <select className="ob-select" disabled={formMode === "detail"}
                value={formData.jenis_kelamin}
                onChange={(e) => setFormData({ ...formData, jenis_kelamin: e.target.value })}>
                <option value="L">Laki-laki</option>
                <option value="P">Perempuan</option>
              </select>
            </div>
            <div>
              <label className="ob-label">Tempat Lahir *</label>
              <input type="text" className="ob-input" disabled={formMode === "detail"}
                value={formData.tempat_lahir || ""}
                onChange={(e) => setFormData({ ...formData, tempat_lahir: e.target.value })}
              />
            </div>
            <div>
              <label className="ob-label">Tanggal Lahir *</label>
              <input type="date" className="ob-input" disabled={formMode === "detail"}
                value={formData.tanggal_lahir || ""}
                onChange={(e) => setFormData({ ...formData, tanggal_lahir: e.target.value })}
              />
            </div>
            <div>
              <label className="ob-label">Agama</label>
              <select className="ob-select" disabled={formMode === "detail"}
                value={formData.agama}
                onChange={(e) => setFormData({ ...formData, agama: e.target.value })}>
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
              <label className="ob-label">Golongan Darah</label>
              <select className="ob-select" disabled={formMode === "detail"}
                value={formData.blood_type}
                onChange={(e) => setFormData({ ...formData, blood_type: e.target.value })}>
                <option value="A">A</option><option value="B">B</option>
                <option value="AB">AB</option><option value="O">O</option>
              </select>
            </div>
            <div>
              <label className="ob-label">Pendidikan Terakhir</label>
              <select className="ob-select" disabled={formMode === "detail"}
                value={formData.pendidikan}
                onChange={(e) => setFormData({ ...formData, pendidikan: e.target.value })}>
                <option value="SMA">SMA/Sederajat</option>
                <option value="D3">Diploma 3 (D3)</option>
                <option value="S1">Strata 1 (S1)</option>
                <option value="S2">Strata 2 (S2)</option>
                <option value="S3">Strata 3 (S3)</option>
                <option value="LAINNYA">Lainnya</option>
              </select>
            </div>
          </div>

          <SectionHeader title="C. Relasi Organisasi & Pekerjaan" />
          <div className="ob-form-grid">
            <div>
              <label className="ob-label">Company</label>
              <select className="ob-select" disabled={formMode === "detail"}
                value={formData.company} onChange={(e) => setFormData({ ...formData, company: e.target.value })}>
                <option value="">-- Pilih Company --</option>
                {companies.map((c) => <option key={c.id} value={c.id}>{c.name || c.nama_company}</option>)}
              </select>
            </div>
            <div>
              <label className="ob-label">Department</label>
              <select className="ob-select" disabled={formMode === "detail"}
                value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })}>
                <option value="">-- Pilih Department --</option>
                {departments.map((d) => <option key={d.id} value={d.id}>{d.name || d.nama_department}</option>)}
              </select>
            </div>
            <div>
              <label className="ob-label">Section</label>
              <select className="ob-select" disabled={formMode === "detail"}
                value={formData.section} onChange={(e) => setFormData({ ...formData, section: e.target.value })}>
                <option value="">-- Pilih Section --</option>
                {sections.map((s) => <option key={s.id} value={s.id}>{s.name || s.nama_section}</option>)}
              </select>
            </div>
            <div>
              <label className="ob-label">Position (Jabatan)</label>
              <select className="ob-select" disabled={formMode === "detail"}
                value={formData.position} onChange={(e) => setFormData({ ...formData, position: e.target.value })}>
                <option value="">-- Pilih Jabatan --</option>
                {positions.map((p) => <option key={p.id} value={p.id}>{p.name || p.nama_jabatan}</option>)}
              </select>
            </div>
            <div>
              <label className="ob-label">Tanggal Bergabung (Join Date)</label>
              <input type="date" className="ob-input" disabled={formMode === "detail"}
                value={formData.join_date || ""} onChange={(e) => setFormData({ ...formData, join_date: e.target.value })} />
            </div>
            <div>
              <label className="ob-label">Tanggal Induksi</label>
              <input type="date" className="ob-input" disabled={formMode === "detail"}
                value={formData.tangal_induksi || ""} onChange={(e) => setFormData({ ...formData, tangal_induksi: e.target.value })} />
            </div>
            <div>
              <label className="ob-label">Point Of Hire</label>
              <input type="text" className="ob-input" placeholder="misal: Jakarta" disabled={formMode === "detail"}
                value={formData.poin_of_hire || ""} onChange={(e) => setFormData({ ...formData, poin_of_hire: e.target.value })} />
            </div>
            <div className="ob-checkbox-group">
              <input type="checkbox" id="is_staff" disabled={formMode === "detail"}
                checked={formData.is_staff} onChange={(e) => setFormData({ ...formData, is_staff: e.target.checked })} />
              <label htmlFor="is_staff">Karyawan Tingkat Staff (Grade Staff)</label>
            </div>
          </div>

          <SectionHeader title="D. Alamat Tempat Tinggal" />
          <div className="ob-form-grid">
            <div className="ob-form-group-full">
              <label className="ob-label">Alamat Lengkap</label>
              <textarea rows={2} className="ob-input" style={{ height: "auto" }} disabled={formMode === "detail"}
                value={formData.address || ""} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
            </div>
            <div>
              <label className="ob-label">Kelurahan</label>
              <input type="text" className="ob-input" disabled={formMode === "detail"}
                value={formData.kelurahan || ""} onChange={(e) => setFormData({ ...formData, kelurahan: e.target.value })} />
            </div>
            <div>
              <label className="ob-label">Kecamatan</label>
              <input type="text" className="ob-input" disabled={formMode === "detail"}
                value={formData.kecamatan || ""} onChange={(e) => setFormData({ ...formData, kecamatan: e.target.value })} />
            </div>
            <div>
              <label className="ob-label">Kota / Kabupaten</label>
              <input type="text" className="ob-input" disabled={formMode === "detail"}
                value={formData.city || ""} onChange={(e) => setFormData({ ...formData, city: e.target.value })} />
            </div>
            <div>
              <label className="ob-label">Provinsi</label>
              <input type="text" className="ob-input" disabled={formMode === "detail"}
                value={formData.province || ""} onChange={(e) => setFormData({ ...formData, province: e.target.value })} />
            </div>
            <div>
              <label className="ob-label">Kode Pos</label>
              <input type="text" className="ob-input" disabled={formMode === "detail"}
                value={formData.pos_code || ""} onChange={(e) => setFormData({ ...formData, pos_code: e.target.value })} />
            </div>
          </div>

          {/* ============================================================== */}
          {/* SECTION KELUARGA CONDITIONAL RENDERING                         */}
          {/* ============================================================== */}
          <SectionHeader title="E. Data Pasangan & Anak" />
          <div className="ob-form-grid">
            <div>
              <label className="ob-label">Status Pernikahan / Pajak (PTKP)</label>
              <select className="ob-select" disabled={formMode === "detail"}
                value={formData.Employee_status}
                onChange={(e) => setFormData({ ...formData, Employee_status: e.target.value })}>
                <option value="TK/0">Belum Menikah / Janda (TK/0)</option>
                <option value="K/0">Menikah (K/0)</option>
                <option value="K/1">Menikah, Anak 1 (K/1)</option>
                <option value="K/2">Menikah, Anak 2 (K/2)</option>
                <option value="K/3">Menikah, Anak 3 (K/3)</option>
                <option value="TK/1">Duda/Janda, Anak 1 (TK/1)</option>
                <option value="TK/2">Duda/Janda, Anak 2 (TK/2)</option>
                <option value="TK/3">Duda/Janda, Anak 3 (TK/3)</option>
              </select>
            </div>
            <div>{/* Spacer kosong agar sejajar */}</div>

            {/* Muncul Jika Menikah (K/...) */}
            {showPartner && (
              <>
                <div>
                  <label className="ob-label">Nama Suami / Istri</label>
                  <input type="text" className="ob-input" disabled={formMode === "detail"}
                    value={formData.couple_name || ""} onChange={(e) => setFormData({ ...formData, couple_name: e.target.value })} />
                </div>
                <div>
                  <label className="ob-label">Tanggal Lahir Pasangan</label>
                  <input type="date" className="ob-input" disabled={formMode === "detail"}
                    value={formData.couple_date_birth || ""} onChange={(e) => setFormData({ ...formData, couple_date_birth: e.target.value })} />
                </div>
              </>
            )}

            {/* Muncul Jika Anak >= 1 */}
            {showChild1 && (
              <>
                <div>
                  <label className="ob-label">Nama Anak Ke-1</label>
                  <input type="text" className="ob-input" disabled={formMode === "detail"}
                    value={formData.first_child_name || ""} onChange={(e) => setFormData({ ...formData, first_child_name: e.target.value })} />
                </div>
                <div>
                  <label className="ob-label">Tanggal Lahir Anak Ke-1</label>
                  <input type="date" className="ob-input" disabled={formMode === "detail"}
                    value={formData.first_child_date_birth || ""} onChange={(e) => setFormData({ ...formData, first_child_date_birth: e.target.value })} />
                </div>
              </>
            )}

            {/* Muncul Jika Anak >= 2 */}
            {showChild2 && (
              <>
                <div>
                  <label className="ob-label">Nama Anak Ke-2</label>
                  <input type="text" className="ob-input" disabled={formMode === "detail"}
                    value={formData.second_child_name || ""} onChange={(e) => setFormData({ ...formData, second_child_name: e.target.value })} />
                </div>
                <div>
                  <label className="ob-label">Tanggal Lahir Anak Ke-2</label>
                  <input type="date" className="ob-input" disabled={formMode === "detail"}
                    value={formData.second_child_date_birth || ""} onChange={(e) => setFormData({ ...formData, second_child_date_birth: e.target.value })} />
                </div>
              </>
            )}

            {/* Muncul Jika Anak >= 3 */}
            {showChild3 && (
              <>
                <div>
                  <label className="ob-label">Nama Anak Ke-3</label>
                  <input type="text" className="ob-input" disabled={formMode === "detail"}
                    value={formData.third_child_name || ""} onChange={(e) => setFormData({ ...formData, third_child_name: e.target.value })} />
                </div>
                <div>
                  <label className="ob-label">Tanggal Lahir Anak Ke-3</label>
                  <input type="date" className="ob-input" disabled={formMode === "detail"}
                    value={formData.third_child_date_birth || ""} onChange={(e) => setFormData({ ...formData, third_child_date_birth: e.target.value })} />
                </div>
              </>
            )}
          </div>

          <SectionHeader title="F. Kontak Darurat" />
          <div className="ob-form-grid">
            <div>
              <label className="ob-label">Nama Kontak Darurat</label>
              <input type="text" className="ob-input" disabled={formMode === "detail"}
                value={formData.emergency_contact_name || ""} onChange={(e) => setFormData({ ...formData, emergency_contact_name: e.target.value })} />
            </div>
            <div>
              <label className="ob-label">No. HP Kontak Darurat</label>
              <input type="text" className="ob-input" disabled={formMode === "detail"}
                value={formData.emergency_contact_phone || ""} onChange={(e) => setFormData({ ...formData, emergency_contact_phone: e.target.value })} />
            </div>
            <div>
              <label className="ob-label">Hubungan Kontak Darurat</label>
              <select className="ob-select" disabled={formMode === "detail"}
                value={formData.emergency_contact_relation} onChange={(e) => setFormData({ ...formData, emergency_contact_relation: e.target.value })}>
                <option value="ayah">Ayah</option>
                <option value="ibu">Ibu</option>
                <option value="kakak">Kakak</option>
                <option value="adik">Adik</option>
                <option value="saudara">Saudara</option>
                <option value="pasangan">Suami/Istri</option>
              </select>
            </div>
          </div>

          <SectionHeader title="G. Ukuran Seragam & Perlengkapan" />
          <div className="ob-form-grid">
            <div>
              <label className="ob-label">Ukuran Baju / Kaos</label>
              <select className="ob-select" disabled={formMode === "detail"}
                value={formData.shirt_size} onChange={(e) => setFormData({ ...formData, shirt_size: e.target.value })}>
                <option value="S">S</option><option value="M">M</option>
                <option value="L">L</option><option value="XL">XL</option>
                <option value="XXL">XXL</option><option value="XXXL">XXXL</option>
              </select>
            </div>
            <div>
              <label className="ob-label">Ukuran Celana (Angka)</label>
              <input type="number" className="ob-input" disabled={formMode === "detail"}
                value={formData.pants_size || ""} onChange={(e) => setFormData({ ...formData, pants_size: e.target.value })} />
            </div>
            <div>
              <label className="ob-label">Ukuran Sepatu (Angka)</label>
              <input type="number" className="ob-input" disabled={formMode === "detail"}
                value={formData.shoes_size || ""} onChange={(e) => setFormData({ ...formData, shoes_size: e.target.value })} />
            </div>
          </div>

          {/* TOMBOL AKSI BAWAH */}
          <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "30px" }}>
            {formMode === "detail" ? (
              <>
                {!loadingPermissions && hasAccess("EmployeeUpdate") && (
                  <button type="button" onClick={() => setFormMode("edit")} className="ob-btn ob-btn-primary">
                    ✏️ Edit Karyawan
                  </button>
                )}
                {!loadingPermissions && hasAccess("EmployeeDelete") && (
                  <button type="button" onClick={() => handleDelete(selectedId)} className="ob-btn ob-btn-danger">
                    🗑️ Hapus
                  </button>
                )}
              </>
            ) : (
              <>
                <button type="button" className="ob-btn ob-btn-cancel" onClick={() => {
                    if (formMode === "edit") setFormMode("detail");
                    else setCurrentView("list");
                  }}>
                  Batal
                </button>
                <button type="submit" disabled={loading} className="ob-btn ob-btn-primary">
                  {loading ? "Menyimpan..." : formMode === "edit" ? "Perbarui Data Karyawan" : "Simpan Karyawan Baru"}
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
    <div className="ob-container">
      <div className="ob-header">
        <div>
          <h2 className="ob-header-title">Master Data Employee</h2>
          <p className="ob-header-subtitle">Kelola data demografi dan pemetaan biometrik mesin absensi</p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button onClick={fetchEmployees} className="ob-btn ob-btn-refresh">
            🔄 Refresh Data
          </button>
          {!loadingPermissions && hasAccess("EmployeeCreate") && (
            <button onClick={handleOpenCreate} className="ob-btn ob-btn-primary">
              + Tambah Karyawan Baru
            </button>
          )}
        </div>
      </div>

      <div className="ob-stats-container">
        <StatCard title="Total Karyawan" count={employees.length} isActive={filterDepartment === "ALL" && filterStatus === "ALL"} onClick={() => { setFilterDepartment("ALL"); setFilterStatus("ALL"); }} />
        <StatCard title="Draft" count={totaldraft} color="#2563eb" isActive={filterStatus === "draft"} onClick={() => setFilterStatus("draft")} />
        <StatCard title="Progress" count={totalprogress} color="#ec4899" isActive={filterStatus === "progress"} onClick={() => setFilterStatus("progress")} />
        <StatCard title="Approved" count={totalapproved} color="#16a34a" bgColor="#f0fdf4" borderColor="#bbf7d0" isActive={filterStatus === "approved"} onClick={() => setFilterStatus("approved")} />
      </div>

      <FilterBar
        searchQuery={searchQuery} onSearchChange={setSearchQuery}
        placeholder="Cari NIK, Nama, atau ZKTeco ID..."
        filterValue={filterDepartment} onFilterChange={setFilterDepartment}
        filterOptions={deptOptions} onReset={() => setFilterDepartment("ALL")}
      />

      {error && <div className="ob-error-banner">{error}</div>}

      <div className="ob-table-wrapper">
        <table className="ob-table">
          <thead>
            <tr>
              <th>NIK Karyawan</th>
              <th>Nama Karyawan</th>
              <th>Department</th>
              <th>Jabatan</th>
              <th>Status Form</th>
              <th style={{ textAlign: "center" }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" style={{ textAlign: "center", padding: "30px", color: "#94a3b8" }}>Memuat data karyawan...</td></tr>
            ) : filteredData.length === 0 ? (
              <tr><td colSpan="6" style={{ textAlign: "center", padding: "30px", color: "#94a3b8" }}>Tidak ada data karyawan ditemukan.</td></tr>
            ) : (
              filteredData.map((row) => (
                <tr key={row.id}>
                  <td><strong style={{ color: "#2563eb" }}>{row.nik_karyawan}</strong></td>
                  <td><strong>{row.nama_lengkap}</strong></td>
                  <td>{row.department_name || row.department?.name || "-"}</td>
                  <td>{row.position_name || row.position?.name || "-"}</td>
                  <td>
                    <span className="ob-badge" style={{
                      backgroundColor: row.form_status === 'approved' ? '#dcfce7' : '#f1f5f9',
                      color: row.form_status === 'approved' ? '#15803d' : '#475569'
                    }}>
                      {row.form_status || "-"}
                    </span>
                  </td>
                  <td style={{ textAlign: "center", display: "flex", gap: "6px", justifyContent: "center" }}>
                    {!loadingPermissions && hasAccess("OnboardingRead") && (
                      <button onClick={() => handleOpenDetail(row.id)} className="ob-btn ob-btn-action">Buka</button>
                    )}
                    {!loadingPermissions && hasAccess("OnboardingDelete") && (
                      <button onClick={() => handleDelete(row.id)} className="ob-btn ob-btn-action-danger">Hapus</button>
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

const SectionHeader = ({ title }) => (
  <div className="ob-section-header">
    <h4>{title}</h4>
  </div>
);

export default OnboardingPage1;