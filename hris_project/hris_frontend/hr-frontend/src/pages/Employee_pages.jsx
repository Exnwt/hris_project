import React, { useState, useEffect } from "react";
import api from "../api";
import { StatCard, FilterBar } from "../components/StatisticCard_component";
import ExcelManagerModal from "../components/ExcelManagerModal";

const EmployeePage = () => {
  const [showExcelModal, setShowExcelModal] = useState(false);
  const employeeFields = [
    { field: "nik_karyawan", label: "NIK Karyawan" },
    { field: "nama_lengkap", label: "Nama Lengkap" },
    { field: "nik_ktp", label: "NIK KTP" },
    { field: "phone_number", label: "No WhatsApp" },
    { field: "email", label: "Email" },
    { field: "jenis_kelamin", label: "Jenis Kelamin" },
    { field: "join_date", label: "Tanggal Masuk" },
    { field: "shirt_size", label: "Ukuran Baju" },
  ];

  // State Modal Deaktivasi Karyawan
  const [showInactiveModal, setShowInactiveModal] = useState(false);
  const [inactiveReason, setInactiveReason] = useState("");
  const [targetInactiveEmp, setTargetInactiveEmp] = useState(null);

  const [userPermissions, setUserPermissions] = useState({
    isSuperuser: false,
    allowedCodenames: [],
  });
  const [loadingPermissions, setLoadingPermissions] = useState(true);

  const [currentView, setCurrentView] = useState("list");
  const [formMode, setFormMode] = useState("create");

  const [employees, setEmployees] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedId, setSelectedId] = useState(null);

  // State Modal Edit Reason
  const [showEditReasonModal, setShowEditReasonModal] = useState(false);
  const [editReason, setEditReason] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("ALL");

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
    tanggal_lahir: null,
    agama: "ISLAM",
    blood_type: "A",
    pendidikan: "S1",
    passport_number: "",
    join_date: null,
    Employee_status: "TK/0",
    status: "draft",
    form_status: "draft",

    company: null,
    department: null,
    section: null,
    position: null,

    address: "",
    kelurahan: "",
    kecamatan: "",
    city: "",
    province: "",
    pos_code: "",

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

    shirt_size: "M",
    pants_size: 30,
    shoes_size: 40,

    tangal_induksi: null,
    poin_of_hire: "",
    is_local: false,
    is_staff: false,
    is_onboarding: false,
    onboarding_id: "",
    is_edited: false,
  };

  const [formData, setFormData] = useState(initialFormState);
  const BASE_URL = "/api/v1/master-data";

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

      const successMessage = syncResponse.data?.message || "Berhasil sinkronisasi ke ZKTeco BioTime!";
      const zkId = syncResponse.data?.zk_id;
      alert(`✅ SINKRONISASI BERHASIL!\n\n${successMessage}\nID BioTime: ${zkId || "-"}`);

      fetchEmployees();
    } catch (err) {
      console.error("Gagal Push ZKTeco:", err.response?.data || err.message);
      alert(`❌ GAGAL SYNC ZKTECO:\n\n${err.response?.data?.detail || err.message}`);
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
      console.error("Gagal mengambil permission:", error);
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

    if (formMode === "edit") {
      setEditReason("");
      setShowEditReasonModal(true);
      return;
    }

    executeSubmit();
  };

  const executeSubmit = async (reasonText = "") => {
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
          edit_reason: reasonText,
        };
        await api.post(`${BASE_URL}/employee-stagging/submit/`, staggingPayload);
        alert("Data Perubahan karyawan berhasil Direquest ke Staging!");
      }
      setShowEditReasonModal(false);
      setCurrentView("list");
      fetchEmployees();
    } catch (err) {
      console.error("SAVE ERROR:", err.response?.data || err);
      alert(err.response?.data?.detail || "Gagal menyimpan data karyawan.");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmEditSubmit = () => {
    if (!editReason.trim()) {
      alert("Harap isi alasan perubahan data terlebih dahulu!");
      return;
    }
    executeSubmit(editReason);
  };

  const handleOpenInactiveModal = (emp) => {
    setTargetInactiveEmp(emp);
    setInactiveReason("");
    setShowInactiveModal(true);
  };

  const handleConfirmInactive = async () => {
    if (!inactiveReason.trim()) {
      alert("Harap masukkan alasan penonaktifan karyawan!");
      return;
    }

    setLoading(true);
    try {
      const staggingPayload = {
        employee_id: targetInactiveEmp.id,
        changes: {
          status: {
            old: targetInactiveEmp.status || "active",
            new: "inactive",
          },
        },
        edit_reason: `[REQUEST DEAKTIVASI]: ${inactiveReason}`,
      };

      await api.post(`${BASE_URL}/employee-stagging/submit/`, staggingPayload);
      alert("Request penonaktifan karyawan berhasil dikirim ke Staging!");

      setShowInactiveModal(false);
      setTargetInactiveEmp(null);
      fetchEmployees();
    } catch (err) {
      console.error("INACTIVE ERROR:", err.response?.data || err);
      alert(err.response?.data?.detail || "Gagal mengajukan penonaktifan.");
    } finally {
      setLoading(false);
    }
  };

  const deptOptions = [
    { value: "ALL", label: "Semua Departemen" },
    ...departments.map((d) => ({ value: String(d.id), label: d.name || d.nama_department })),
  ];

  if (currentView === "form") {
    return (
      <div className="page-container">
        <div className="page-header" style={{ borderBottom: "1px solid #e2e8f0", paddingBottom: "15px" }}>
          <div>
            <h3>
              {formMode === "create"
                ? "Tambah Karyawan Baru"
                : formMode === "edit"
                ? `Edit Karyawan: ${formData.nama_lengkap}`
                : `Detail Karyawan: ${formData.nama_lengkap}`}
            </h3>
            <p style={{ color: "#64748b", fontSize: "13px", marginTop: "4px" }}>
              Isi data demografi, organisasi, alamat, keluarga, serta atribut seragam.
            </p>
          </div>
          <div className="page-header-actions">
            <button onClick={() => setCurrentView("list")} className="btn btn-cancel">
              ← Kembali ke List
            </button>
            {formMode === "detail" && (
              <button onClick={PushZKTeco} className="btn btn-primary">
                Sync to ZKTeco
              </button>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ marginTop: "20px" }}>
          {/* SECTION A */}
          <h4 className="section-header">A. Data Diri & Biometrik</h4>
          <div className="form-grid">
            <div>
              <label className="form-label">Nama Lengkap *</label>
              <input
                type="text"
                disabled={formMode === "detail"}
                value={formData.nama_lengkap}
                onChange={(e) => setFormData({ ...formData, nama_lengkap: e.target.value })}
                className="input-control"
                required
              />
            </div>
            <div>
              <label className="form-label">NIK Karyawan</label>
              <input
                type="text"
                disabled={formMode === "detail"}
                value={formData.nik_karyawan}
                onChange={(e) => setFormData({ ...formData, nik_karyawan: e.target.value })}
                className="input-control"
              />
            </div>
            <div>
              <label className="form-label">ID Biometrik ZKTeco (PIN Mesin)</label>
              <input
                type="text"
                disabled={formMode === "detail"}
                value={formData.biometric_user_id}
                onChange={(e) => setFormData({ ...formData, biometric_user_id: e.target.value })}
                className="input-control"
              />
            </div>
            <div>
              <label className="form-label">ZK Employee Code</label>
              <input
                type="text"
                disabled={formMode === "detail"}
                value={formData.zk_code}
                onChange={(e) => setFormData({ ...formData, zk_code: e.target.value })}
                className="input-control"
              />
            </div>
            <div>
              <label className="form-label">NIK KTP</label>
              <input
                type="text"
                maxLength={16}
                disabled={formMode === "detail"}
                value={formData.nik_ktp}
                onChange={(e) => setFormData({ ...formData, nik_ktp: e.target.value })}
                className="input-control"
              />
            </div>
            <div>
              <label className="form-label">Nomor Passport</label>
              <input
                type="text"
                disabled={formMode === "detail"}
                value={formData.passport_number}
                onChange={(e) => setFormData({ ...formData, passport_number: e.target.value })}
                className="input-control"
              />
            </div>
            <div>
              <label className="form-label">Kewarganegaraan</label>
              <select
                disabled={formMode === "detail"}
                value={formData.nationality}
                onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                className="select-control"
              >
                <option value="WNI">Warga Negara Indonesia (WNI)</option>
                <option value="WNA">Warga Negara Asing (Expat)</option>
              </select>
            </div>
            <div>
              <label className="form-label">No. WhatsApp / HP</label>
              <input
                type="text"
                disabled={formMode === "detail"}
                value={formData.phone_number}
                onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                className="input-control"
              />
            </div>
            <div>
              <label className="form-label">Email</label>
              <input
                type="email"
                disabled={formMode === "detail"}
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="input-control"
              />
            </div>
            <div>
              <label className="form-label">Jenis Kelamin</label>
              <select
                disabled={formMode === "detail"}
                value={formData.jenis_kelamin}
                onChange={(e) => setFormData({ ...formData, jenis_kelamin: e.target.value })}
                className="select-control"
              >
                <option value="L">Laki-laki</option>
                <option value="P">Perempuan</option>
              </select>
            </div>
            <div>
              <label className="form-label">Tempat Lahir</label>
              <input
                type="text"
                disabled={formMode === "detail"}
                value={formData.tempat_lahir}
                onChange={(e) => setFormData({ ...formData, tempat_lahir: e.target.value })}
                className="input-control"
              />
            </div>
            <div>
              <label className="form-label">Tanggal Lahir</label>
              <input
                type="date"
                disabled={formMode === "detail"}
                value={formData.tanggal_lahir}
                onChange={(e) => setFormData({ ...formData, tanggal_lahir: e.target.value })}
                className="input-control"
              />
            </div>
            <div>
              <label className="form-label">Agama</label>
              <select
                disabled={formMode === "detail"}
                value={formData.agama}
                onChange={(e) => setFormData({ ...formData, agama: e.target.value })}
                className="select-control"
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
              <label className="form-label">Golongan Darah</label>
              <select
                disabled={formMode === "detail"}
                value={formData.blood_type}
                onChange={(e) => setFormData({ ...formData, blood_type: e.target.value })}
                className="select-control"
              >
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="AB">AB</option>
                <option value="O">O</option>
              </select>
            </div>
            <div>
              <label className="form-label">Pendidikan Terakhir</label>
              <select
                disabled={formMode === "detail"}
                value={formData.pendidikan}
                onChange={(e) => setFormData({ ...formData, pendidikan: e.target.value })}
                className="select-control"
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
              <label className="form-label">Status Pernikahan / PTKP</label>
              <select
                disabled={formMode === "detail"}
                value={formData.Employee_status}
                onChange={(e) => setFormData({ ...formData, Employee_status: e.target.value })}
                className="select-control"
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

          {/* SECTION B */}
          <h4 className="section-header">B. Pekerjaan & Organisasi</h4>
          <div className="form-grid">
            <div>
              <label className="form-label">Company</label>
              <select
                disabled={formMode === "detail"}
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                className="select-control"
              >
                <option value="">-- Pilih Company --</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>{c.name || c.nama_company}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">Department</label>
              <select
                disabled={formMode === "detail"}
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="select-control"
              >
                <option value="">-- Pilih Department --</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name || d.nama_department}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">Position (Jabatan)</label>
              <select
                disabled={formMode === "detail"}
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                className="select-control"
              >
                <option value="">-- Pilih Position --</option>
                {positions.map((p) => (
                  <option key={p.id} value={p.id}>{p.name || p.nama_jabatan}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">Join Date (Tanggal Masuk)</label>
              <input
                type="date"
                disabled={formMode === "detail"}
                value={formData.join_date}
                onChange={(e) => setFormData({ ...formData, join_date: e.target.value })}
                className="input-control"
              />
            </div>
            <div>
              <label className="form-label">Tanggal Induksi</label>
              <input
                type="date"
                disabled={formMode === "detail"}
                value={formData.tangal_induksi}
                onChange={(e) => setFormData({ ...formData, tangal_induksi: e.target.value })}
                className="input-control"
              />
            </div>
            <div>
              <label className="form-label">Point Of Hire</label>
              <input
                type="text"
                disabled={formMode === "detail"}
                value={formData.poin_of_hire}
                onChange={(e) => setFormData({ ...formData, poin_of_hire: e.target.value })}
                className="input-control"
              />
            </div>
            <div>
              <label className="form-label">Status Sistem</label>
              <select
                disabled={formMode === "detail"}
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="select-control"
              >
                <option value="draft">Draft</option>
                <option value="progress">In Progress</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div>
              <label className="form-label">Form Status</label>
              <select
                disabled={formMode === "detail"}
                value={formData.form_status}
                onChange={(e) => setFormData({ ...formData, form_status: e.target.value })}
                className="select-control"
              >
                <option value="draft">Draft</option>
                <option value="progress">In Progress</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            <div style={{ display: "flex", gap: "20px", alignItems: "center", marginTop: "15px" }}>
              <label style={{ cursor: "pointer", fontSize: "13px" }}>
                <input
                  type="checkbox"
                  disabled={formMode === "detail"}
                  checked={formData.is_local}
                  onChange={(e) => setFormData({ ...formData, is_local: e.target.checked })}
                />{" "}
                Is Local (Pekerja Lokal)
              </label>

              <label style={{ cursor: "pointer", fontSize: "13px" }}>
                <input
                  type="checkbox"
                  disabled={formMode === "detail"}
                  checked={formData.is_staff}
                  onChange={(e) => setFormData({ ...formData, is_staff: e.target.checked })}
                />{" "}
                Is Staff (Grade Staff)
              </label>
            </div>
          </div>

          {/* SECTION C */}
          <h4 className="section-header">C. Alamat Domisili / KTP</h4>
          <div className="form-grid">
            <div className="form-group-full">
              <label className="form-label">Alamat Lengkap</label>
              <textarea
                disabled={formMode === "detail"}
                rows={2}
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="input-control"
              />
            </div>
            <div>
              <label className="form-label">Kelurahan</label>
              <input
                type="text"
                disabled={formMode === "detail"}
                value={formData.kelurahan}
                onChange={(e) => setFormData({ ...formData, kelurahan: e.target.value })}
                className="input-control"
              />
            </div>
            <div>
              <label className="form-label">Kecamatan</label>
              <input
                type="text"
                disabled={formMode === "detail"}
                value={formData.kecamatan}
                onChange={(e) => setFormData({ ...formData, kecamatan: e.target.value })}
                className="input-control"
              />
            </div>
            <div>
              <label className="form-label">Kota / Kabupaten</label>
              <input
                type="text"
                disabled={formMode === "detail"}
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="input-control"
              />
            </div>
            <div>
              <label className="form-label">Provinsi</label>
              <input
                type="text"
                disabled={formMode === "detail"}
                value={formData.province}
                onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                className="input-control"
              />
            </div>
            <div>
              <label className="form-label">Kode Pos</label>
              <input
                type="text"
                disabled={formMode === "detail"}
                value={formData.pos_code}
                onChange={(e) => setFormData({ ...formData, pos_code: e.target.value })}
                className="input-control"
              />
            </div>
          </div>

          {/* SECTION D */}
          <h4 className="section-header">D. Data Keluarga & Kontak Darurat</h4>
          <div className="form-grid">
            <div>
              <label className="form-label">Nama Suami/Istri</label>
              <input
                type="text"
                disabled={formMode === "detail"}
                value={formData.couple_name}
                onChange={(e) => setFormData({ ...formData, couple_name: e.target.value })}
                className="input-control"
              />
            </div>
            <div>
              <label className="form-label">Tanggal Lahir Suami/Istri</label>
              <input
                type="date"
                disabled={formMode === "detail"}
                value={formData.couple_date_birth}
                onChange={(e) => setFormData({ ...formData, couple_date_birth: e.target.value })}
                className="input-control"
              />
            </div>

            <div>
              <label className="form-label">Nama Anak Pertama</label>
              <input
                type="text"
                disabled={formMode === "detail"}
                value={formData.first_child_name}
                onChange={(e) => setFormData({ ...formData, first_child_name: e.target.value })}
                className="input-control"
              />
            </div>
            <div>
              <label className="form-label">Tanggal Lahir Anak Pertama</label>
              <input
                type="date"
                disabled={formMode === "detail"}
                value={formData.first_child_date_birth}
                onChange={(e) => setFormData({ ...formData, first_child_date_birth: e.target.value })}
                className="input-control"
              />
            </div>

            <div>
              <label className="form-label">Nama Anak Kedua</label>
              <input
                type="text"
                disabled={formMode === "detail"}
                value={formData.second_child_name}
                onChange={(e) => setFormData({ ...formData, second_child_name: e.target.value })}
                className="input-control"
              />
            </div>
            <div>
              <label className="form-label">Tanggal Lahir Anak Kedua</label>
              <input
                type="date"
                disabled={formMode === "detail"}
                value={formData.second_child_date_birth}
                onChange={(e) => setFormData({ ...formData, second_child_date_birth: e.target.value })}
                className="input-control"
              />
            </div>

            <div>
              <label className="form-label">Nama Anak Ketiga</label>
              <input
                type="text"
                disabled={formMode === "detail"}
                value={formData.third_child_name}
                onChange={(e) => setFormData({ ...formData, third_child_name: e.target.value })}
                className="input-control"
              />
            </div>
            <div>
              <label className="form-label">Tanggal Lahir Anak Ketiga</label>
              <input
                type="date"
                disabled={formMode === "detail"}
                value={formData.third_child_date_birth}
                onChange={(e) => setFormData({ ...formData, third_child_date_birth: e.target.value })}
                className="input-control"
              />
            </div>

            <div>
              <label className="form-label">Nama Kontak Darurat</label>
              <input
                type="text"
                disabled={formMode === "detail"}
                value={formData.emergency_contact_name}
                onChange={(e) => setFormData({ ...formData, emergency_contact_name: e.target.value })}
                className="input-control"
              />
            </div>
            <div>
              <label className="form-label">No. HP Kontak Darurat</label>
              <input
                type="text"
                disabled={formMode === "detail"}
                value={formData.emergency_contact_phone}
                onChange={(e) => setFormData({ ...formData, emergency_contact_phone: e.target.value })}
                className="input-control"
              />
            </div>
            <div>
              <label className="form-label">Hubungan Kontak Darurat</label>
              <select
                disabled={formMode === "detail"}
                value={formData.emergency_contact_relation}
                onChange={(e) => setFormData({ ...formData, emergency_contact_relation: e.target.value })}
                className="select-control"
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

          {/* SECTION E */}
          <h4 className="section-header">E. Ukuran Seragam & Perlengkapan</h4>
          <div className="form-grid">
            <div>
              <label className="form-label">Ukuran Baju</label>
              <select
                disabled={formMode === "detail"}
                value={formData.shirt_size}
                onChange={(e) => setFormData({ ...formData, shirt_size: e.target.value })}
                className="select-control"
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
              <label className="form-label">Ukuran Celana</label>
              <input
                type="number"
                disabled={formMode === "detail"}
                value={formData.pants_size}
                onChange={(e) => setFormData({ ...formData, pants_size: e.target.value })}
                className="input-control"
              />
            </div>
            <div>
              <label className="form-label">Ukuran Sepatu</label>
              <input
                type="number"
                disabled={formMode === "detail"}
                value={formData.shoes_size}
                onChange={(e) => setFormData({ ...formData, shoes_size: e.target.value })}
                className="input-control"
              />
            </div>
          </div>

          {/* BUTTON ACTIONS FORM */}
          <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "30px" }}>
            {formMode === "detail" ? (
              <>
                {!loadingPermissions && hasAccess("EmployeeUpdate") && formData.is_edited === false && (
                  <button type="button" onClick={() => setFormMode("edit")} className="btn btn-primary">
                    ✏️ Edit Karyawan
                  </button>
                )}

                {!loadingPermissions && hasAccess("EmployeeDelete") && formData.status !== "inactive" && (
                  <button
                    type="button"
                    onClick={() => handleOpenInactiveModal({ id: selectedId, nama_lengkap: formData.nama_lengkap, status: formData.status })}
                    className="btn btn-action-delete"
                  >
                    🚫 Nonaktifkan
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
                  className="btn btn-cancel"
                >
                  Batal
                </button>

                <button type="submit" disabled={loading} className="btn btn-primary">
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

        {/* MODAL EDIT REASON */}
        {showEditReasonModal && (
          <div className="modal-overlay">
            <div className="modal-card">
              <h4 style={{ marginBottom: "12px", color: "#111827" }}>Alasan Perubahan Data (Edit Reason)</h4>
              <p style={{ fontSize: "13px", color: "#6B7280", marginBottom: "12px" }}>
                Jelaskan alasan mengapa Anda mengajukan perubahan data karyawan ini untuk di-review oleh HR.
              </p>
              <textarea
                rows={4}
                value={editReason}
                onChange={(e) => setEditReason(e.target.value)}
                placeholder="Contoh: Karyawan melampirkan KTP baru, perubahan nomor HP aktif, dll..."
                className="input-control"
              />
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "12px" }}>
                <button onClick={() => setShowEditReasonModal(false)} className="btn btn-cancel">Batal</button>
                <button onClick={handleConfirmEditSubmit} disabled={loading} className="btn btn-primary">
                  {loading ? "Mengirim..." : "Kirim Pengajuan Edit"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // LIST VIEW
  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h2>Master Data Employee</h2>
          <p style={{ color: "#64748b", fontSize: "14px", marginTop: "4px" }}>
            Kelola data demografi dan pemetaan biometrik mesin absensi
          </p>
        </div>
        <div className="page-header-actions">
          <button onClick={() => setShowExcelModal(true)} className="btn btn-secondary">
            📊 Import / Export Excel
          </button>
          <ExcelManagerModal
            isOpen={showExcelModal}
            onClose={() => setShowExcelModal(false)}
            targetModel="Employee"
            availableFields={employeeFields}
          />
          <button onClick={fetchEmployees} className="btn btn-secondary">
            🔄 Refresh Data
          </button>
          {!loadingPermissions && hasAccess("EmployeeCreate") && (
            <button onClick={handleOpenCreate} className="btn btn-primary">
              + Tambah Karyawan Baru
            </button>
          )}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "15px", marginBottom: "20px", width: "100%" }}>
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

      <FilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        placeholder="Cari NIK, KTP, Nama, atau ZKTeco ID..."
        filterValue={filterDepartment}
        onFilterChange={setFilterDepartment}
        filterOptions={deptOptions}
        onReset={() => setFilterDepartment("ALL")}
      />

      {error && <div className="error-banner">{error}</div>}

      <div className="table-wrapper">
        <table className="custom-table">
          <thead>
            <tr>
              <th>NIK Karyawan</th>
              <th>Nama Karyawan</th>
              <th>ID ZKTeco</th>
              <th>Department</th>
              <th>Jabatan</th>
              <th>Join Date</th>
              <th>Status</th>
              <th style={{ textAlign: "center" }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8" style={{ textAlign: "center", padding: "30px", color: "#94a3b8" }}>Memuat data karyawan...</td>
              </tr>
            ) : filteredData.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: "center", padding: "30px", color: "#94a3b8" }}>Tidak ada data karyawan ditemukan.</td>
              </tr>
            ) : (
              filteredData.map((row, index) => (
                <tr key={row.id || index}>
                  <td>
                    <strong style={{ color: "#2563eb" }}>{row.nik_karyawan || "-"}</strong>
                  </td>
                  <td>
                    <strong>{row.nama_lengkap}</strong>
                    {row.is_edited && (
                      <span style={{ marginLeft: "6px", color: "#d97706", fontSize: "11px", fontWeight: "bold" }}>
                        [Editing Staging]
                      </span>
                    )}
                  </td>
                  <td>
                    {row.biometric_user_id ? (
                      <span className="badge badge-success">
                        ID: {row.biometric_user_id}
                      </span>
                    ) : (
                      <span style={{ color: "#94a3b8", fontSize: "12px" }}>Unmapped</span>
                    )}
                  </td>
                  <td>{row.department_name || row.department?.name || "-"}</td>
                  <td>{row.position_name || row.position?.name || "-"}</td>
                  <td>{row.join_date || "-"}</td>
                  <td>
                    <span className={`badge ${row.status === 'active' ? 'badge-success' : 'badge-default'}`}>
                      {row.status}
                    </span>
                  </td>
                  <td style={{ textAlign: "center" }}>
                    {!loadingPermissions && (
                      <div className="action-group">
                        {hasAccess("EmployeeRequestEdit") && (
                          <button onClick={() => handleOpenDetail(row.id)} className="btn btn-action-view">
                            Buka
                          </button>
                        )}
                        {hasAccess("EmployeeDelete") && row.status !== "inactive" && (
                          <button onClick={() => handleOpenInactiveModal(row)} className="btn btn-action-delete">
                            🚫 Nonaktifkan
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL DEAKTIVASI */}
      {showInactiveModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h4 style={{ color: "#DC2626", marginBottom: "12px" }}>
              Nonaktifkan Karyawan: {targetInactiveEmp?.nama_lengkap}
            </h4>
            <p style={{ fontSize: "13px", color: "#6B7280", marginBottom: "12px" }}>
              Pengajuan penonaktifan ini akan masuk ke <strong>Employee Staging</strong> untuk disetujui oleh HR/Manager.
            </p>
            <textarea
              rows={4}
              value={inactiveReason}
              onChange={(e) => setInactiveReason(e.target.value)}
              placeholder="Masukkan alasan penonaktifan (Contoh: Resign, Pemutusan Kontrak, dll)..."
              className="input-control"
            />
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "12px" }}>
              <button onClick={() => setShowInactiveModal(false)} className="btn btn-cancel">
                Batal
              </button>
              <button onClick={handleConfirmInactive} disabled={loading} className="btn btn-danger">
                {loading ? "Mengirim..." : "Kirim Request Deaktivasi"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeePage;