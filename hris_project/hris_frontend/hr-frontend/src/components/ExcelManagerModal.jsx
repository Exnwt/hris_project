import React, { useState, useEffect } from "react";
import api from '../api';

const ExcelManagerModal = ({ isOpen, onClose, targetModel, availableFields }) => {
  const [templates, setTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [templateName, setTemplateName] = useState("");
  
  // State untuk mengontrol daftar kolom & urutannya
  const [fieldsConfig, setFieldsConfig] = useState([]); 
  const [importFile, setImportFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const BASE_URL = "/api/v2/access";

  useEffect(() => {
    if (isOpen) {
      fetchTemplates();
      // Set default fields dari prop availableFields
      setFieldsConfig(availableFields.map((f) => ({ ...f, enabled: true })));
    }
  }, [isOpen]);

  const fetchTemplates = async () => {
    try {
      const res = await api.get(`${BASE_URL}/excel-templates/?target_model=${targetModel}`);
      setTemplates(res.data.results || res.data || []);
    } catch (err) {
      console.error("Gagal memuat template:", err);
    }
  };

  // Switch saat pilih template dari dropdown
  const handleSelectTemplate = (e) => {
    const tId = e.target.value;
    setSelectedTemplateId(tId);
    if (!tId) return;

    const t = templates.find((item) => String(item.id) === String(tId));
    if (t) {
      setTemplateName(t.name);
      // Map urutan dan field sesuai yang tersimpan di template
      const savedFields = t.selected_fields;
      const newConfig = savedFields.map((s) => ({ field: s.field, label: s.label, enabled: true }));

      // Tambahkan sisa field yang belum diaktifkan di paling bawah
      availableFields.forEach((af) => {
        if (!newConfig.some((nc) => nc.field === af.field)) {
          newConfig.push({ ...af, enabled: false });
        }
      });
      setFieldsConfig(newConfig);
    }
  };

  // Toggle Checkbox Aktif/Nonaktif
  const handleToggleField = (index) => {
    const updated = [...fieldsConfig];
    updated[index].enabled = !updated[index].enabled;
    setFieldsConfig(updated);
  };

  // Mengubah urutan Kolom (Naik / Turun)
  const moveField = (index, direction) => {
    const updated = [...fieldsConfig];
    const targetIndex = direction === "UP" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= updated.length) return;

    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    setFieldsConfig(updated);
  };

  // Simpan / Update Template
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
      if (selectedTemplateId) {
        await api.put(`${BASE_URL}/excel-templates/${selectedTemplateId}/`, payload);
        alert("Template berhasil diperbarui!");
      } else {
        await api.post(`${BASE_URL}/excel-templates/`, payload);
        alert("Template baru berhasil disimpan!");
      }
      fetchTemplates();
    } catch (err) {
      alert("Gagal menyimpan template.");
    }
  };

  // Execute Export Excel
  const handleExport = async () => {
    const activeFields = fieldsConfig
      .filter((f) => f.enabled)
      .map((f) => ({ field: f.field, label: f.label }));

    if (activeFields.length === 0) return alert("Pilih minimal 1 kolom!");

    try {
      setLoading(true);
      const res = await api.post(
        `${BASE_URL}/global-export/`,
        { target_model: targetModel, selected_fields: activeFields },
        { responseType: "blob" }
      );

      // Download file blob
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `Export_${targetModel}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert("Gagal mengunduh Excel.");
    } finally {
      setLoading(false);
    }
  };

  // Execute Import Excel
  const handleImport = async () => {
    if (!importFile) return alert("Pilih file Excel terlebih dahulu!");
    if (!selectedTemplateId) return alert("Pilih template pendukung untuk mapping import!");

    const formData = new FormData();
    formData.append("file", importFile);
    formData.append("target_model", targetModel);
    formData.append("template_id", selectedTemplateId);

    try {
      setLoading(true);
      const res = await api.post(`${BASE_URL}/global-import/`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      alert(res.data.message);
      onClose();
    } catch (err) {
      alert(err.response?.data?.detail || "Gagal mengimpor data.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px" }}>
          <h3 style={{ margin: 0 }}>Smart Excel Import & Export ({targetModel})</h3>
          <button onClick={onClose} style={{ border: "none", background: "none", cursor: "pointer" }}>✕</button>
        </div>

        {/* SECTION 1: PILIH TEMPLATE & NAME */}
        <div style={{ display: "flex", gap: "10px", marginBottom: "16px" }}>
          <select value={selectedTemplateId} onChange={handleSelectTemplate} style={inputStyle}>
            <option value="">-- Buat Template Baru --</option>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Nama Template..."
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            style={inputStyle}
          />
          <button onClick={handleSaveTemplate} style={btnSaveStyle}>Simpan Template</button>
        </div>

        {/* SECTION 2: ADAPTIF LIST FIELD & URUTAN */}
        <div style={{ maxHeight: "300px", overflowY: "auto", border: "1px solid #E5E7EB", padding: "10px", borderRadius: "6px" }}>
          <p style={{ margin: "0 0 10px 0", fontSize: "12px", color: "#6B7280" }}>
            Centang kolom yang ingin diekspor/diimpor dan gunakan tombol panah untuk mengatur urutan posisi kolom di Excel:
          </p>
          {fieldsConfig.map((item, idx) => (
            <div key={item.field} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #F3F4F6" }}>
              <label style={{ cursor: "pointer", fontSize: "14px" }}>
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

        {/* SECTION 3: EKSSEKUSI EXPORT / IMPORT */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "20px" }}>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <input type="file" accept=".xlsx, .xls" onChange={(e) => setImportFile(e.target.files[0])} />
            <button onClick={handleImport} disabled={loading} style={btnImportStyle}>Import Excel</button>
          </div>

          <button onClick={handleExport} disabled={loading} style={btnExportStyle}>
            {loading ? "Processing..." : "Export Excel"}
          </button>
        </div>
      </div>
    </div>
  );
};

// Styles Component
const overlayStyle = { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1100 };
const modalStyle = { backgroundColor: "#fff", padding: "20px", borderRadius: "8px", width: "100%", maxWidth: "600px" };
const inputStyle = { flex: 1, padding: "8px", borderRadius: "4px", border: "1px solid #D1D5DB" };
const btnSaveStyle = { backgroundColor: "#2563EB", color: "#fff", border: "none", padding: "8px 12px", borderRadius: "4px", cursor: "pointer" };
const btnExportStyle = { backgroundColor: "#059669", color: "#fff", border: "none", padding: "10px 18px", borderRadius: "6px", fontWeight: "bold", cursor: "pointer" };
const btnImportStyle = { backgroundColor: "#D97706", color: "#fff", border: "none", padding: "8px 14px", borderRadius: "4px", cursor: "pointer" };
const btnArrowStyle = { background: "#E5E7EB", border: "none", borderRadius: "4px", padding: "2px 6px", margin: "0 2px", cursor: "pointer" };

export default ExcelManagerModal;