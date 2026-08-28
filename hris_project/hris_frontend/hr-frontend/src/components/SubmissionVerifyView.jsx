import React, { useState, useEffect } from 'react';
import api from '../api';

// ==========================================
// COMPONENT: SEARCHABLE DROPDOWN WITH RAW BADGE
// ==========================================
function SearchableSelect({ label, options, value, onChange, onAddNew, placeholder, disabled, rawPayloadText }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const filteredOptions = options.filter((opt) =>
    (opt.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedItem = options.find((opt) => String(opt.id) === String(value));

  return (
    <div style={{ position: 'relative', marginBottom: '12px' }}>
      {label && <label style={labelStyle}>{label}</label>}
      <div style={{ display: 'flex', gap: '6px' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <input
            type="text"
            value={isOpen ? searchTerm : selectedItem ? selectedItem.name : ''}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              if (!isOpen) setIsOpen(true);
            }}
            onFocus={() => {
              setSearchTerm('');
              setIsOpen(true);
            }}
            placeholder={placeholder || 'Cari & Pilih...'}
            disabled={disabled}
            style={inputStyle}
          />
          {isOpen && (
            <div style={dropdownListStyle}>
              {filteredOptions.length > 0 ? (
                filteredOptions.map((opt) => (
                  <div
                    key={opt.id}
                    onClick={() => {
                      onChange(opt.id);
                      setIsOpen(false);
                      setSearchTerm('');
                    }}
                    style={{
                      ...dropdownItemStyle,
                      backgroundColor: String(opt.id) === String(value) ? '#eff6ff' : '#fff',
                    }}
                  >
                    {opt.name}
                  </div>
                ))
              ) : (
                <div style={{ padding: '8px 12px', color: '#94a3b8', fontSize: '13px' }}>
                  Data tidak ditemukan
                </div>
              )}
            </div>
          )}
        </div>
        {onAddNew && (
          <button
            type="button"
            onClick={onAddNew}
            style={btnSmall}
            title="Tambah Master Data Baru"
          >
            +
          </button>
        )}
      </div>

      {!value && rawPayloadText && (
        <div style={warningBadgeStyle}>
          ⚠️ Payload Raw: "<b>{rawPayloadText}</b>" (Belum ada di Master Data)
        </div>
      )}

      {isOpen && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 10 }}
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}

// ==========================================
// MAIN COMPONENT: SUBMISSION VERIFY VIEW
// ==========================================
export default function SubmissionVerifyView({ submissionId, onBack }) {
  const [currentId, setCurrentId] = useState(submissionId || '');
  const [submissionRaw, setSubmissionRaw] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Master Data Lists
  const [companies, setCompanies] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [sections, setSections] = useState([]);
  const [positions, setPositions] = useState([]);

  // Raw Teks dari Payload Staging
  const [rawRelational, setRawRelational] = useState({
    company: '',
    department: '',
    section: '',
    position: '',
  });

  // Form Demografi & Kontak Karyawan
  const [employeeForm, setEmployeeForm] = useState({
    nik_karyawan: '',
    nama_lengkap: '',
    nationality: 'WNI',
    nik_ktp: '',
    passport_number: '',
    jenis_kelamin: 'L',
    tempat_lahir: '',
    tanggal_lahir: '',
    agama: 'ISLAM',
    pendidikan: 'S1',
    alamat: '',
    contact_person: '',
    emergency_contact_name: '',
    emergency_contact_relation: '',
    emergency_contact_phone: '',
  });

  // Form Penugasan HR (IDs)
  const [hrAssigned, setHrAssigned] = useState({
    company_id: '',
    department_id: '',
    section_id: '',
    position_id: '',
    status: 'PKWTT',
    status_start_date: new Date().toISOString().split('T')[0],
    status_end_date: '',
  });

  // Modals
  const [companyModal, setCompanyModal] = useState({ open: false, name: '', code: '', phone: '-' });
  const [positionModal, setPositionModal] = useState({ open: false, name: '' });
  const [deptSectionModal, setDeptSectionModal] = useState({
    open: false,
    mode: 'NEW_DEPT',
    selectedDeptId: '',
    newDeptName: '',
    newSectionName: '',
  });

  useEffect(() => {
    initView();
  }, [submissionId]);

  const initView = async () => {
    const masterData = await fetchAllMasterData();
    if (submissionId) {
      setCurrentId(submissionId);
      loadSubmissionDetail(submissionId, masterData);
    }
  };

  const fetchAllMasterData = async () => {
    try {
      const [resComp, resDept, resSec, resPos] = await Promise.all([
        api.get('/api/v1/onboarding/companies/'),
        api.get('/api/v1/onboarding/departments/'),
        api.get('/api/v1/onboarding/sections/'),
        api.get('/api/v1/onboarding/positions/'),
      ]);

      const compList = resComp.data.results || resComp.data || [];
      const deptList = resDept.data.results || resDept.data || [];
      const secList = resSec.data.results || resSec.data || [];
      const posList = resPos.data.results || resPos.data || [];

      setCompanies(compList);
      setDepartments(deptList);
      setSections(secList);
      setPositions(posList);

      return { compList, deptList, secList, posList };
    } catch (err) {
      console.error('Gagal memuat Master Data:', err);
      return {};
    }
  };

  const findMatchingId = (masterList, rawValue) => {
    if (!rawValue) return '';
    const byId = masterList.find((item) => String(item.id) === String(rawValue));
    if (byId) return byId.id;
    const byName = masterList.find(
      (item) => String(item.name).trim().toLowerCase() === String(rawValue).trim().toLowerCase()
    );
    if (byName) return byName.id;
    return '';
  };

  const loadSubmissionDetail = async (idToFetch, loadedMaster) => {
    const targetId = idToFetch || currentId;
    if (!targetId) return;

    setLoading(true);
    setMessage({ type: '', text: '' });
    setSubmissionRaw(null);

    try {
      const res = await api.get(`/api/v1/onboarding/staging-submissions/${targetId}/`);
      setSubmissionRaw(res.data);

      const payload = res.data.raw_payload || res.data.data || {};

      const compList = loadedMaster?.compList || companies;
      const deptList = loadedMaster?.deptList || departments;
      const secList = loadedMaster?.secList || sections;
      const posList = loadedMaster?.posList || positions;

      const rawComp = payload.company_id || payload.company || '';
      const rawDept = payload.department_id || payload.department || '';
      const rawSec = payload.section_id || payload.section || '';
      const rawPos = payload.position_id || payload.position || '';

      setRawRelational({ company: rawComp, department: rawDept, section: rawSec, position: rawPos });

      setEmployeeForm({
        nik_karyawan: payload.nik_karyawan || payload.nik || '',
        nama_lengkap: payload.nama_lengkap || payload.nama || '',
        nationality: payload.nationality || 'WNI',
        nik_ktp: payload.nik_ktp || '',
        passport_number: payload.passport_number || '',
        jenis_kelamin: payload.jenis_kelamin || 'L',
        tempat_lahir: payload.tempat_lahir || '',
        tanggal_lahir: payload.tanggal_lahir || '',
        agama: (payload.agama || 'ISLAM').toUpperCase(),
        pendidikan: (payload.pendidikan || 'S1').toUpperCase(),
        alamat: payload.alamat || '',
        contact_person: payload.contact_person || payload.no_hp || '',
        emergency_contact_name: payload.emergency_contact_name || '',
        emergency_contact_relation: payload.emergency_contact_relation || '',
        emergency_contact_phone: payload.emergency_contact_phone || '',
      });

      setHrAssigned({
        company_id: findMatchingId(compList, rawComp),
        department_id: findMatchingId(deptList, rawDept),
        section_id: findMatchingId(secList, rawSec),
        position_id: findMatchingId(posList, rawPos),
        status: payload.employment_status || payload.status || 'PKWTT',
        status_start_date: payload.status_start_date || payload.join_date || new Date().toISOString().split('T')[0],
        status_end_date: payload.status_end_date || '',
      });
    } catch (err) {
      setMessage({ type: 'error', text: 'Detail submission ID ' + targetId + ' tidak ditemukan.' });
    } finally {
      setLoading(false);
    }
  };

  // OPEN MODAL HANDLERS
  const handleOpenCompanyModal = () => {
    const defaultName = !hrAssigned.company_id ? rawRelational.company : '';
    setCompanyModal({
      open: true,
      name: defaultName,
      code: defaultName ? defaultName.replace(/\s+/g, '').toUpperCase().slice(0, 10) : '',
      phone: '-',
    });
  };

  const handleOpenPositionModal = () => {
    setPositionModal({
      open: true,
      name: !hrAssigned.position_id ? rawRelational.position : '',
    });
  };

  const handleOpenDeptSectionModal = () => {
    const isDeptMatched = Boolean(hrAssigned.department_id);
    setDeptSectionModal({
      open: true,
      mode: isDeptMatched ? 'EXISTING_DEPT' : 'NEW_DEPT',
      selectedDeptId: hrAssigned.department_id || '',
      newDeptName: !isDeptMatched ? rawRelational.department : '',
      newSectionName: rawRelational.section || '',
    });
  };

  // SAVE MASTER HANDLERS
  const handleSaveCompany = async () => {
    if (!companyModal.name.trim()) {
      alert('Nama Company wajib diisi!');
      return;
    }
    try {
      const res = await api.post('/api/v1/onboarding/companies/', {
        name: companyModal.name.trim(),
        company_code: companyModal.code.trim() || companyModal.name.replace(/\s+/g, '').toUpperCase().slice(0, 10),
        phone_number: companyModal.phone.trim() || '-',
      });

      await fetchAllMasterData();
      setHrAssigned((prev) => ({ ...prev, company_id: res.data.id }));
      setCompanyModal({ open: false, name: '', code: '', phone: '-' });
      alert(`Company "${res.data.name}" berhasil dibuat!`);
    } catch (err) {
      alert('Gagal membuat Company: ' + JSON.stringify(err.response?.data || err.message));
    }
  };

  const handleSavePosition = async () => {
    const positionName = positionModal.name.trim();
    if (!positionName) {
      alert('Nama Position wajib diisi!');
      return;
    }
    try {
      const res = await api.post('/api/v1/onboarding/positions/', { name: positionName });
      await fetchAllMasterData();
      setHrAssigned((prev) => ({ ...prev, position_id: res.data.id }));
      setPositionModal({ open: false, name: '' });
      alert(`Position "${res.data.name || positionName}" berhasil dibuat!`);
    } catch (err) {
      if (err.response && err.response.data) {
        const errorMsg = Object.entries(err.response.data)
          .map(([field, errList]) => `${field}: ${Array.isArray(errList) ? errList.join(', ') : errList}`)
          .join('\n');
        alert(`Gagal membuat Position (400 Bad Request):\n${errorMsg}`);
      } else {
        alert('Gagal membuat Position: ' + err.message);
      }
    }
  };

  const handleSaveDeptAndSectionPackage = async () => {
    try {
      let deptId = deptSectionModal.selectedDeptId;

      if (deptSectionModal.mode === 'NEW_DEPT') {
        if (!deptSectionModal.newDeptName.trim()) {
          alert('Nama Department Baru wajib diisi!');
          return;
        }
        const resDept = await api.post('/api/v1/onboarding/departments/', {
          name: deptSectionModal.newDeptName.trim(),
        });
        deptId = resDept.data.id;
      }

      if (!deptId) {
        alert('Harap pilih Department terlebih dahulu!');
        return;
      }

      let newSecId = null;
      if (deptSectionModal.newSectionName.trim()) {
        const resSec = await api.post('/api/v1/onboarding/sections/', {
          name: deptSectionModal.newSectionName.trim(),
          department: deptId,
        });
        newSecId = resSec.data.id;
      }

      alert('Berhasil menyimpan Struktur Departemen & Seksi!');
      await fetchAllMasterData();

      setHrAssigned((prev) => ({
        ...prev,
        department_id: deptId,
        section_id: newSecId || prev.section_id,
      }));

      setDeptSectionModal({
        open: false,
        mode: 'NEW_DEPT',
        selectedDeptId: '',
        newDeptName: '',
        newSectionName: '',
      });
    } catch (err) {
      alert('Gagal membuat Dept/Section: ' + JSON.stringify(err.response?.data || err.message));
    }
  };

  // MAIN COMMIT HANDLER (HR APPROVE)
  const handleApproveAndCommit = async (e) => {
    e.preventDefault();
    if (!employeeForm.nik_karyawan.trim()) {
      alert('NIK Karyawan wajib diisi!');
      return;
    }
    if (!hrAssigned.company_id || !hrAssigned.department_id || !hrAssigned.position_id) {
      alert('Harap lengkapi penugasan Company, Department, dan Position!');
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    // Sanitasi String Kosong menjadi Null untuk Date & Optional Unique Fields
    const employeePayload = {
      nik_karyawan: employeeForm.nik_karyawan.trim(),
      nama_lengkap: employeeForm.nama_lengkap.trim(),
      nationality: employeeForm.nationality || 'WNI',
      nik_ktp: employeeForm.nik_ktp.trim() ? employeeForm.nik_ktp.trim() : null,
      passport_number: employeeForm.passport_number.trim() ? employeeForm.passport_number.trim() : null,
      company: Number(hrAssigned.company_id),
      department: Number(hrAssigned.department_id),
      section: hrAssigned.section_id ? Number(hrAssigned.section_id) : null,
      position: Number(hrAssigned.position_id),
      join_date: hrAssigned.status_start_date || null,
      jenis_kelamin: employeeForm.jenis_kelamin || 'L',
      tempat_lahir: employeeForm.tempat_lahir.trim() || '-',
      tanggal_lahir: employeeForm.tanggal_lahir || null,
      agama: employeeForm.agama || 'ISLAM',
      pendidikan: employeeForm.pendidikan || 'S1',
    };

    try {
      // 1. Commit Employee
      await api.post('/api/v1/onboarding/employees/', employeePayload);

      // 2. Commit Status History
      await api.post('/api/v1/onboarding/employee-status-histories/', {
        employee: employeeForm.nik_karyawan.trim(),
        status: hrAssigned.status,
        start_date: hrAssigned.status_start_date,
        end_date: hrAssigned.status_end_date || null,
        is_active: true,
      });

      // 3. Commit Contact History
      await api.post('/api/v1/onboarding/employee-contact-histories/', {
        employee: employeeForm.nik_karyawan.trim(),
        alamat: employeeForm.alamat || '-',
        contact_person: employeeForm.contact_person || '-',
        emergency_contact_name: employeeForm.emergency_contact_name || '-',
        emergency_contact_relation: employeeForm.emergency_contact_relation || '-',
        emergency_contact_phone: employeeForm.emergency_contact_phone || '-',
        is_active: true,
      });

      // 4. Update Staging Status (is_processed = true)
      await api.patch(`/api/v1/onboarding/staging-submissions/${currentId}/`, {
        is_processed: true,
        processed_by: 'HR Admin',
      });

      // Refresh State Lokal UI
      setSubmissionRaw((prev) => ({
        ...prev,
        is_processed: true,
        processed_by: 'HR Admin',
      }));

      setMessage({
        type: 'success',
        text: `Data Karyawan ${employeeForm.nama_lengkap} (${employeeForm.nik_karyawan}) berhasil diverifikasi dan disimpan!`,
      });

      setTimeout(() => {
        if (onBack) onBack();
      }, 2000);
    } catch (err) {
      if (err.response && err.response.data) {
        const errorText = Object.entries(err.response.data)
          .map(([field, errList]) => `${field}: ${Array.isArray(errList) ? errList.join(', ') : errList}`)
          .join(' | ');

        setMessage({
          type: 'error',
          text: `Gagal Validasi Django (400): [${errorText}]`,
        });
      } else {
        setMessage({
          type: 'error',
          text: 'Gagal memverifikasi data: ' + err.message,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const filteredSections = sections.filter(
    (sec) => String(sec.department) === String(hrAssigned.department_id)
  );

  if (!submissionRaw) {
    return (
      <div style={cardStyle}>
        <h3 style={{ marginTop: 0 }}>Verification View (HR Admin Review)</h3>
        <p style={{ color: '#64748b', fontSize: '14px' }}>
          Masukkan <b>ID Submission Staging</b> untuk memuat payload mentah:
        </p>

        <div style={{ display: 'flex', gap: '10px', maxWidth: '400px', marginBottom: '15px' }}>
          <input
            type="number"
            placeholder="Contoh ID Staging: 1"
            value={currentId}
            onChange={(e) => setCurrentId(e.target.value)}
            style={inputStyle}
          />
          <button onClick={() => loadSubmissionDetail(currentId)} disabled={loading} style={btnStyle}>
            {loading ? 'Memuat...' : 'Muat Staging ID'}
          </button>
        </div>

        {message.text && <p style={{ color: '#ef4444', fontWeight: 'bold' }}>{message.text}</p>}
      </div>
    );
  }

  return (
    <div style={cardStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <div>
          <h3 style={{ margin: 0 }}>Review Verifikasi Submission #{currentId}</h3>
          <span
            style={{
              fontSize: '12px',
              padding: '2px 8px',
              borderRadius: '10px',
              backgroundColor: submissionRaw.is_processed ? '#dcfce7' : '#fef3c7',
              color: submissionRaw.is_processed ? '#15803d' : '#b45309',
            }}
          >
            {submissionRaw.is_processed ? '✓ Diverifikasi' : '⏳ Menunggu Verifikasi'}
          </span>
        </div>
        {onBack && (
          <button onClick={onBack} style={{ ...btnStyle, backgroundColor: '#64748b' }}>
            ⬅️ Kembali ke List
          </button>
        )}
      </div>

      {message.text && (
        <div style={message.type === 'success' ? alertSuccess : alertError}>{message.text}</div>
      )}

      <form onSubmit={handleApproveAndCommit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          
          {/* SISI KIRI: RAW STAGING PAYLOAD */}
          <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <h4 style={{ marginTop: 0, color: '#334155' }}>1. Raw Ingested Payload</h4>
            <pre
              style={{
                background: '#0f172a',
                color: '#38bdf8',
                padding: '12px',
                borderRadius: '6px',
                fontSize: '12px',
                maxHeight: '680px',
                overflow: 'auto',
              }}
            >
              {JSON.stringify(submissionRaw.raw_payload || submissionRaw.data, null, 2)}
            </pre>
          </div>

          {/* SISI KANAN: HR FORM */}
          <div>
            <h4 style={{ marginTop: 0, color: '#334155' }}>2. Data Matang & Penugasan HR</h4>

            {/* A. Demografi & Identitas */}
            <div style={boxSectionStyle}>
              <h5 style={{ margin: '0 0 10px 0', color: '#1e293b' }}>A. Demografi & Identitas</h5>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={labelStyle}>NIK Karyawan *</label>
                  <input
                    type="text"
                    required
                    placeholder="EMP-2026-640"
                    value={employeeForm.nik_karyawan}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, nik_karyawan: e.target.value })}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Nama Lengkap *</label>
                  <input
                    type="text"
                    required
                    value={employeeForm.nama_lengkap}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, nama_lengkap: e.target.value })}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Kewarganegaraan</label>
                  <select
                    value={employeeForm.nationality}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, nationality: e.target.value })}
                    style={inputStyle}
                  >
                    <option value="WNI">WNI</option>
                    <option value="WNA">WNA</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>NIK KTP</label>
                  <input
                    type="text"
                    maxLength="16"
                    value={employeeForm.nik_ktp}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, nik_ktp: e.target.value })}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Nomor Passport</label>
                  <input
                    type="text"
                    placeholder="Kosongkan jika WNI"
                    value={employeeForm.passport_number}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, passport_number: e.target.value })}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Jenis Kelamin</label>
                  <select
                    value={employeeForm.jenis_kelamin}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, jenis_kelamin: e.target.value })}
                    style={inputStyle}
                  >
                    <option value="L">Laki-laki</option>
                    <option value="P">Perempuan</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Tempat Lahir</label>
                  <input
                    type="text"
                    value={employeeForm.tempat_lahir}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, tempat_lahir: e.target.value })}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Tanggal Lahir</label>
                  <input
                    type="date"
                    value={employeeForm.tanggal_lahir}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, tanggal_lahir: e.target.value })}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Agama</label>
                  <select
                    value={employeeForm.agama}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, agama: e.target.value })}
                    style={inputStyle}
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
                  <label style={labelStyle}>Pendidikan</label>
                  <select
                    value={employeeForm.pendidikan}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, pendidikan: e.target.value })}
                    style={inputStyle}
                  >
                    <option value="SMA">SMA/Sederajat</option>
                    <option value="D3">D3</option>
                    <option value="S1">S1</option>
                    <option value="S2">S2</option>
                    <option value="S3">S3</option>
                  </select>
                </div>
              </div>
            </div>

            {/* B. Alamat & Kontak */}
            <div style={{ ...boxSectionStyle, marginTop: '12px' }}>
              <h5 style={{ margin: '0 0 10px 0', color: '#1e293b' }}>B. Alamat & Kontak</h5>
              
              <div style={{ marginBottom: '8px' }}>
                <label style={labelStyle}>Alamat Lengkap</label>
                <textarea
                  rows="2"
                  value={employeeForm.alamat}
                  onChange={(e) => setEmployeeForm({ ...employeeForm, alamat: e.target.value })}
                  style={inputStyle}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={labelStyle}>No. HP Karyawan</label>
                  <input
                    type="text"
                    value={employeeForm.contact_person}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, contact_person: e.target.value })}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Kontak Darurat (Nama)</label>
                  <input
                    type="text"
                    value={employeeForm.emergency_contact_name}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, emergency_contact_name: e.target.value })}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Hubungan Kontak Darurat</label>
                  <input
                    type="text"
                    value={employeeForm.emergency_contact_relation}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, emergency_contact_relation: e.target.value })}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>No. HP Kontak Darurat</label>
                  <input
                    type="text"
                    value={employeeForm.emergency_contact_phone}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, emergency_contact_phone: e.target.value })}
                    style={inputStyle}
                  />
                </div>
              </div>
            </div>

            {/* C. Penugasan Relasi Organisasi */}
            <div style={{ ...boxSectionStyle, marginTop: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <h5 style={{ margin: 0, color: '#1e293b' }}>C. Struktur Organisasi</h5>
                <button
                  type="button"
                  onClick={handleOpenDeptSectionModal}
                  style={{ ...btnSmall, backgroundColor: '#0284c7', fontSize: '11px' }}
                >
                  + Add Dept / Sec
                </button>
              </div>

              <SearchableSelect
                label="Company *"
                options={companies}
                value={hrAssigned.company_id}
                onChange={(val) => setHrAssigned({ ...hrAssigned, company_id: val })}
                onAddNew={handleOpenCompanyModal}
                rawPayloadText={rawRelational.company}
                placeholder="Cari Company..."
              />

              <SearchableSelect
                label="Department *"
                options={departments}
                value={hrAssigned.department_id}
                onChange={(val) => setHrAssigned({ ...hrAssigned, department_id: val, section_id: '' })}
                rawPayloadText={rawRelational.department}
                placeholder="Cari Department..."
              />

              <SearchableSelect
                label="Section (Seksi)"
                options={filteredSections}
                value={hrAssigned.section_id}
                onChange={(val) => setHrAssigned({ ...hrAssigned, section_id: val })}
                rawPayloadText={rawRelational.section}
                placeholder={hrAssigned.department_id ? "Cari Seksi..." : "Pilih Department dahulu"}
                disabled={!hrAssigned.department_id}
              />

              <SearchableSelect
                label="Position (Jabatan) *"
                options={positions}
                value={hrAssigned.position_id}
                onChange={(val) => setHrAssigned({ ...hrAssigned, position_id: val })}
                onAddNew={handleOpenPositionModal}
                rawPayloadText={rawRelational.position}
                placeholder="Cari Position..."
              />
            </div>

            {/* D. Status Kepegawaian */}
            <div style={{ ...boxSectionStyle, marginTop: '12px' }}>
              <h5 style={{ margin: '0 0 10px 0', color: '#1e293b' }}>D. Status Kepegawaian</h5>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                <div>
                  <label style={labelStyle}>Status</label>
                  <select
                    value={hrAssigned.status}
                    onChange={(e) => setHrAssigned({ ...hrAssigned, status: e.target.value })}
                    style={inputStyle}
                  >
                    <option value="PKWT">PKWT</option>
                    <option value="PKWTT">PKWTT</option>
                    <option value="PROBATION">Probation</option>
                    <option value="INTERN">Internship</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Start Date *</label>
                  <input
                    type="date"
                    required
                    value={hrAssigned.status_start_date}
                    onChange={(e) => setHrAssigned({ ...hrAssigned, status_start_date: e.target.value })}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>End Date</label>
                  <input
                    type="date"
                    value={hrAssigned.status_end_date}
                    onChange={(e) => setHrAssigned({ ...hrAssigned, status_end_date: e.target.value })}
                    style={inputStyle}
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{ ...btnStyle, width: '100%', marginTop: '15px', backgroundColor: '#059669', padding: '12px' }}
            >
              {loading ? 'Memproses Commit...' : '✓ Approve & Commit ke Database Utama'}
            </button>
          </div>
        </div>
      </form>

      {/* MODAL 1: CREATE COMPANY */}
      {companyModal.open && (
        <div style={modalOverlay}>
          <div style={modalBox}>
            <h4 style={{ marginTop: 0 }}>Tambah Company Baru</h4>
            <div style={{ marginBottom: '10px' }}>
              <label style={labelStyle}>Nama Company *</label>
              <input
                type="text"
                placeholder="PT KAI"
                value={companyModal.name}
                onChange={(e) => setCompanyModal({ ...companyModal, name: e.target.value })}
                style={inputStyle}
              />
            </div>
            <div style={{ marginBottom: '10px' }}>
              <label style={labelStyle}>Company Code *</label>
              <input
                type="text"
                placeholder="PTKAI"
                value={companyModal.code}
                onChange={(e) => setCompanyModal({ ...companyModal, code: e.target.value })}
                style={inputStyle}
              />
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label style={labelStyle}>Phone Number</label>
              <input
                type="text"
                value={companyModal.phone}
                onChange={(e) => setCompanyModal({ ...companyModal, phone: e.target.value })}
                style={inputStyle}
              />
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setCompanyModal({ ...companyModal, open: false })}
                style={{ ...btnStyle, backgroundColor: '#64748b' }}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveCompany}
                style={{ ...btnStyle, backgroundColor: '#059669' }}
              >
                Simpan Company
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: CREATE POSITION */}
      {positionModal.open && (
        <div style={modalOverlay}>
          <div style={modalBox}>
            <h4 style={{ marginTop: 0 }}>Tambah Position Baru</h4>
            <div style={{ marginBottom: '15px' }}>
              <label style={labelStyle}>Nama Position / Jabatan *</label>
              <input
                type="text"
                placeholder="Misal: Senior HR Manager"
                value={positionModal.name}
                onChange={(e) => setPositionModal({ ...positionModal, name: e.target.value })}
                style={inputStyle}
              />
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setPositionModal({ open: false, name: '' })}
                style={{ ...btnStyle, backgroundColor: '#64748b' }}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSavePosition}
                style={{ ...btnStyle, backgroundColor: '#059669' }}
              >
                Simpan Position
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: CREATE DEPT & SECTION */}
      {deptSectionModal.open && (
        <div style={modalOverlay}>
          <div style={{ ...modalBox, width: '420px' }}>
            <h4 style={{ marginTop: 0 }}>Tambah Department / Section</h4>

            <div style={{ display: 'flex', gap: '15px', marginBottom: '15px', fontSize: '13px' }}>
              <label style={{ cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="deptMode"
                  checked={deptSectionModal.mode === 'NEW_DEPT'}
                  onChange={() => setDeptSectionModal({ ...deptSectionModal, mode: 'NEW_DEPT' })}
                />
                {' '}Buat Dept Baru
              </label>
              <label style={{ cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="deptMode"
                  checked={deptSectionModal.mode === 'EXISTING_DEPT'}
                  onChange={() => setDeptSectionModal({ ...deptSectionModal, mode: 'EXISTING_DEPT' })}
                />
                {' '}Gunakan Dept Existing
              </label>
            </div>

            {deptSectionModal.mode === 'NEW_DEPT' && (
              <div style={{ marginBottom: '10px' }}>
                <label style={labelStyle}>Nama Department Baru *</label>
                <input
                  type="text"
                  placeholder="Misal: Information Technology"
                  value={deptSectionModal.newDeptName}
                  onChange={(e) => setDeptSectionModal({ ...deptSectionModal, newDeptName: e.target.value })}
                  style={inputStyle}
                />
              </div>
            )}

            {deptSectionModal.mode === 'EXISTING_DEPT' && (
              <div style={{ marginBottom: '10px' }}>
                <label style={labelStyle}>Pilih Department Existing *</label>
                <select
                  value={deptSectionModal.selectedDeptId}
                  onChange={(e) => setDeptSectionModal({ ...deptSectionModal, selectedDeptId: e.target.value })}
                  style={inputStyle}
                >
                  <option value="">-- Pilih Department --</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div style={{ marginBottom: '15px' }}>
              <label style={labelStyle}>Nama Section Baru (Opsional)</label>
              <input
                type="text"
                placeholder="Misal: Software Engineering"
                value={deptSectionModal.newSectionName}
                onChange={(e) => setDeptSectionModal({ ...deptSectionModal, newSectionName: e.target.value })}
                style={inputStyle}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setDeptSectionModal({ ...deptSectionModal, open: false })}
                style={{ ...btnStyle, backgroundColor: '#64748b' }}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveDeptAndSectionPackage}
                style={{ ...btnStyle, backgroundColor: '#0284c7' }}
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// STYLES
const cardStyle = { padding: '20px', border: '1px solid #e2e8f0', borderRadius: '8px', background: '#fff', color: '#1e293b' };
const boxSectionStyle = { background: '#f8fafc', padding: '12px', borderRadius: '6px', border: '1px solid #e2e8f0' };
const labelStyle = { display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#475569', marginBottom: '4px' };
const inputStyle = { width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1', boxSizing: 'border-box', fontSize: '13px' };
const btnStyle = { padding: '8px 16px', borderRadius: '4px', color: '#fff', backgroundColor: '#2563eb', border: 'none', cursor: 'pointer', fontWeight: 'bold' };
const btnSmall = { padding: '6px 12px', background: '#059669', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' };
const alertSuccess = { padding: '10px', background: '#dcfce7', color: '#15803d', borderRadius: '4px', marginBottom: '15px', fontSize: '13px' };
const alertError = { padding: '10px', background: '#fee2e2', color: '#991b1b', borderRadius: '4px', marginBottom: '15px', fontSize: '13px' };
const warningBadgeStyle = { marginTop: '4px', fontSize: '11px', color: '#b45309', backgroundColor: '#fef3c7', padding: '3px 8px', borderRadius: '4px', border: '1px solid #fde68a' };
const dropdownListStyle = { position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: '#fff', border: '1px solid #cbd5e1', borderRadius: '4px', maxHeight: '180px', overflowY: 'auto', zIndex: 20, boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' };
const dropdownItemStyle = { padding: '8px 12px', cursor: 'pointer', fontSize: '13px', borderBottom: '1px solid #f1f5f9' };
const modalOverlay = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 50 };
const modalBox = { background: '#fff', padding: '20px', borderRadius: '8px', width: '380px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' };