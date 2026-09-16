import React, { useState, useEffect } from "react";
import api from '../api';

const ExcelManagerModal = ({ isOpen, onClose, targetModel }) => {
  // --- STATE UNTUK TEMPLATE EXPORT ---
  const [templates, setTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [templateName, setTemplateName] = useState("");
  
  // --- STATE UNTUK FIELD CONFIG ---
  const [allDbFields, setAllDbFields] = useState([]); // Menyimpan struktur asli DB
  const [fieldsConfig, setFieldsConfig] = useState([]); // Yang ditampilkan di UI
  
  // --- STATE UNTUK IMPORT ---
  const [importFile, setImportFile] = useState(null);
  const [importErrors, setImportErrors] = useState([]);
  const [loading, setLoading] = useState(false);

  const BASE_URL = "/api/v2/access"; // Sesuaikan dengan routing Anda

  useEffect(() => {
    if (isOpen) {
      setImportFile(null);
      setImportErrors([]);
      setSelectedTemplateId("");
      setTemplateName("");
      fetchModelFieldsAndTemplates();
    }
  }, [isOpen, targetModel]);

  // 1. Fetch Kolom Database & Fetch Template Export yang Tersimpan
  const fetchModelFieldsAndTemplates = async () => {
    try {
      // Get Field dari DB
      const resFields = await api.get(`${BASE_URL}/model-fields/?target_model=${targetModel}`);
      const dbFields = resFields.data.map((f) => ({
        field: f.field,
        label: f.label,
        required: f.required,
        enabled: true,
      }));
      setAllDbFields(dbFields);
      setFieldsConfig(dbFields);

      // Get Saved Templates
      const resTemplates = await api.get(`${BASE_URL}/excel-templates/?target_model=${targetModel}`);
      setTemplates(resTemplates.data.results || resTemplates.data || []);
    } catch (err) {
      console.error(err);
      alert("Gagal memuat struktur field atau template.");
    }
  };

  // 2. Event: Saat user memilih template dari dropdown
  const handleSelectTemplate = (e) => {
    const tId = e.target.value;
    setSelectedTemplateId(tId);
    
    if (!tId) {
      // Jika pilih "Pilih Template / Baru", reset ke default semua field dicentang
      setFieldsConfig([...allDbFields]);
      setTemplateName("");
      return;
    }

    const t = templates.find((item) => String(item.id) === String(tId));
    if (t) {
      setTemplateName(t.name);
      
      // Susun ulang order berdasarkan field yang disave di template
      const savedFields = t.selected_fields;
      const newConfig = savedFields.map((s) => ({ field: s.field, label: s.label, enabled: true }));

      // Masukkan field DB yang tidak ada di template ke posisi paling bawah (Unchecked)
      allDbFields.forEach((af) => {
        if (!newConfig.some((nc) => nc.field === af.field)) {
          newConfig.push({ ...af, enabled: false });
        }
      });
      
      setFieldsConfig(newConfig);
    }
  };

  // 3. Simpan konfigurasi centang saat ini menjadi Template Baru / Update Template
  const handleSaveTemplate = async () => {
    if (!templateName.trim()) return alert("Nama template wajib diisi!");

    const activeFields = fieldsConfig
      .filter((f) => f.enabled)
      .map((f) => ({ field: f.field, label: f.label }));

    const payload = {
      name: templateName,
      target_model: targetModel,
      selected_fields: activeFields,
    };

    try {
      setLoading(true);
      if (selectedTemplateId) {
        await api.put(`${BASE_URL}/excel-templates/${selectedTemplateId}/`, payload);
        alert("Template berhasil diperbarui!");
      } else {
        await api.post(`${BASE_URL}/excel-templates/`, payload);
        alert("Template baru berhasil disimpan!");
      }
      fetchModelFieldsAndTemplates(); // Refresh List Template
    } catch (err) {
      alert("Gagal menyimpan template.");
    } finally {
      setLoading(false);
    }
  };

  // Toggle Centang
  const handleToggleField = (index) => {
    const updated = [...fieldsConfig];
    updated[index].enabled = !updated[index].enabled;
    setFieldsConfig(updated);
  };

  // Geser Posisi (Naik/Turun)
  const moveField = (index, direction) => {
    const updated = [...fieldsConfig];
    const targetIndex = direction === "UP" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= updated.length) return;

    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    setFieldsConfig(updated);
  };

  // ===============================================
  // ACTION: EXPORT (Pakai Konfigurasi UI saat ini)
  // ===============================================
  const handleExport = async () => {
    const activeFields = fieldsConfig
      .filter((f) => f.enabled)
      .map((f) => ({ field: f.field, label: f.label }));

    if (activeFields.length === 0) return alert("Pilih minimal 1 kolom untuk di-export!");

    try {
      setLoading(true);
      const res = await api.post(
        `${BASE_URL}/global-export/`,
        { target_model: targetModel, selected_fields: activeFields },
        { responseType: "blob" }
      );

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `Export_${targetModel}_${new Date().getTime()}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert("Gagal mengunduh Excel.");
    } finally {
      setLoading(false);
    }
  };

  // ===============================================
  // ACTION: DOWNLOAD TEMPLATE IMPORT (Manual Mapping)
  // ===============================================
  const handleDownloadTemplate = async () => {
    try {
      setLoading(true);
      const res = await api.get(`${BASE_URL}/global-template/?target_model=${targetModel}`, {
        responseType: "blob"
      });

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `Template_Import_${targetModel}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert("Gagal mengunduh template Import.");
    } finally {
      setLoading(false);
    }
  };

  // ===============================================
  // ACTION: IMPORT (Manual Mapping dari Backend)
  // ===============================================
  const handleImport = async () => {
    if (!importFile) return alert("Pilih file Excel terlebih dahulu!");

    const formData = new FormData();
    formData.append("file", importFile);
    formData.append("target_model", targetModel);

    try {
      setLoading(true);
      setImportErrors([]);
      const res = await api.post(`${BASE_URL}/global-import/`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      
      alert(res.data.message);
      
      if (res.data.errors && res.data.errors.length > 0) {
        setImportErrors(res.data.errors);
      } else {
        onClose(); 
      }
    } catch (err) {
      alert(err.response?.data?.detail || "Gagal menghubungi server untuk import data.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        
        {/* Header Modal */}
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px" }}>
          <h3 style={{ margin: 0 }}>Import & Export - {targetModel}</h3>
          <button onClick={onClose} style={{ border: "none", background: "none", cursor: "pointer", fontSize: "16px" }}>✕</button>
        </div>

        {/* ============================================================== */}
        {/* BAGIAN ATAS: PENGATURAN EXPORT & SIMPAN TEMPLATE               */}
        {/* ============================================================== */}
        <div style={{ padding: "12px", backgroundColor: "#F9FAFB", borderRadius: "6px", marginBottom: "15px", border: "1px solid #E5E7EB" }}>
          <h4 style={{ margin: "0 0 10px 0", fontSize: "14px", color: "#374151" }}>⚙️ Konfigurasi Kolom (Khusus Export)</h4>
          
          <div style={{ display: "flex", gap: "10px", marginBottom: "12px" }}>
            <select value={selectedTemplateId} onChange={handleSelectTemplate} style={inputStyle}>
              <option value="">-- Buat Custom / Pilih Template --</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Simpan dengan nama..."
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              style={inputStyle}
            />
            <button onClick={handleSaveTemplate} disabled={loading} style={btnSaveStyle}>
              Simpan Template
            </button>
          </div>

          <div style={{ maxHeight: "200px", overflowY: "auto", border: "1px solid #D1D5DB", padding: "10px", borderRadius: "6px", backgroundColor: "#FFF" }}>
            {fieldsConfig.map((item, idx) => (
              <div key={item.field} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px solid #F3F4F6" }}>
                <label style={{ cursor: "pointer", fontSize: "13px" }}>
                  <input
                    type="checkbox"
                    checked={item.enabled}
                    onChange={() => handleToggleField(idx)}
                  />{" "}
                  <strong>{item.label}</strong> <small style={{ color: "#9CA3AF" }}>({item.field})</small>
                </label>
                <div>
                  <button disabled={idx === 0} onClick={() => moveField(idx, "UP")} style={btnArrowStyle}>▲</button>
                  <button disabled={idx === fieldsConfig.length - 1} onClick={() => moveField(idx, "DOWN")} style={btnArrowStyle}>▼</button>
                </div>
              </div>
            ))}
          </div>

          <div style={{ textAlign: "right", marginTop: "10px" }}>
             <button onClick={handleExport} disabled={loading} style={btnExportStyle}>
              ⬆️ {loading ? "Mengekspor..." : "Export dengan Konfigurasi Ini"}
            </button>
          </div>
        </div>

        {/* ============================================================== */}
        {/* BAGIAN BAWAH: IMPORT (Berbasis Manual Mapping Backend)         */}
        {/* ============================================================== */}
        <div style={{ padding: "12px", border: "1px solid #E5E7EB", borderRadius: "6px" }}>
           <h4 style={{ margin: "0 0 10px 0", fontSize: "14px", color: "#374151" }}>📥 Import Data Baru</h4>
           <p style={{ margin: "0 0 10px 0", fontSize: "12px", color: "#6B7280" }}>
              * Import hanya mendukung format kolom baku dari sistem. Silakan unduh template sebelum melakukan import.
           </p>

           <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <button onClick={handleDownloadTemplate} disabled={loading} style={btnTemplateStyle}>
                📄 Unduh Template Import Baku
              </button>

              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                <input type="file" accept=".xlsx, .xls" onChange={(e) => setImportFile(e.target.files[0])} style={{ maxWidth: "200px", fontSize: "12px" }}/>
                <button onClick={handleImport} disabled={loading || !importFile} style={btnImportStyle}>
                  ⬇️ {loading ? "Proses..." : "Mulai Import"}
                </button>
              </div>
           </div>

           {/* Laporan Error Import */}
           {importErrors.length > 0 && (
            <div style={{ marginTop: "15px", padding: "10px", background: "#FEF2F2", border: "1px solid #FCA5A5", borderRadius: "6px", maxHeight: "150px", overflowY: "auto" }}>
              <h5 style={{ margin: "0 0 5px 0", color: "#991B1B" }}>⚠️ Laporan Baris yang Gagal Diimpor:</h5>
              <ul style={{ margin: 0, paddingLeft: "20px", fontSize: "12px", color: "#B91C1C" }}>
                {importErrors.map((err, i) => (
                  <li key={i} style={{ marginBottom: "4px" }}>{err}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

// --- STYLING ---
const overlayStyle = { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1100 };
const modalStyle = { backgroundColor: "#fff", padding: "20px", borderRadius: "8px", width: "100%", maxWidth: "700px" };
const inputStyle = { flex: 1, padding: "8px", borderRadius: "4px", border: "1px solid #D1D5DB", fontSize: "13px" };
const btnSaveStyle = { backgroundColor: "#4F46E5", color: "#fff", border: "none", padding: "8px 12px", borderRadius: "4px", cursor: "pointer", fontSize: "13px" };
const btnExportStyle = { backgroundColor: "#059669", color: "#fff", border: "none", padding: "8px 16px", borderRadius: "6px", fontWeight: "bold", cursor: "pointer" };
const btnTemplateStyle = { backgroundColor: "#F59E0B", color: "#fff", border: "none", padding: "8px 16px", borderRadius: "6px", fontWeight: "bold", cursor: "pointer", fontSize: "13px" };
const btnImportStyle = { backgroundColor: "#2563EB", color: "#fff", border: "none", padding: "8px 16px", borderRadius: "6px", fontWeight: "bold", cursor: "pointer" };
const btnArrowStyle = { background: "#E5E7EB", border: "none", borderRadius: "4px", padding: "2px 6px", margin: "0 2px", cursor: "pointer", fontSize: "10px" };

export default ExcelManagerModal;