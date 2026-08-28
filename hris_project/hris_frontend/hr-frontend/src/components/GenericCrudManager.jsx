import React, { useState, useEffect } from 'react';
import api from '../api';

export default function GenericCrudManager({ title, endpoint, fields, primaryKey = 'id' }) {
  const [dataList, setDataList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [formData, setFormData] = useState({});
  const [alert, setAlert] = useState({ type: '', msg: '' });

  useEffect(() => {
    fetchData();
  }, [endpoint]);

  const fetchData = async () => {
    setLoading(true);
    setAlert({ type: '', msg: '' });
    try {
      const res = await api.get(endpoint);
      setDataList(res.data.results || res.data || []);
    } catch (err) {
      setAlert({ type: 'error', msg: `Gagal memuat data: ${err.message}` });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (item = null) => {
    setEditItem(item);
    if (item) {
      setFormData(item);
    } else {
      const initialForm = {};
      fields.forEach((f) => (initialForm[f.key] = f.defaultValue || ''));
      setFormData(initialForm);
    }
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editItem) {
        const itemId = editItem[primaryKey];
        await api.patch(`${endpoint}${itemId}/`, formData);
        setAlert({ type: 'success', msg: `Data ${title} berhasil diperbarui!` });
      } else {
        await api.post(endpoint, formData);
        setAlert({ type: 'success', msg: `Data ${title} baru berhasil ditambahkan!` });
      }
      setModalOpen(false);
      fetchData();
    } catch (err) {
      const errDetail = err.response?.data ? JSON.stringify(err.response.data) : err.message;
      alert(`Gagal menyimpan data (400 Bad Request):\n${errDetail}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus data dengan ID #${id}?`)) return;
    setLoading(true);
    try {
      await api.delete(`${endpoint}${id}/`);
      setAlert({ type: 'success', msg: `Data #${id} berhasil dihapus!` });
      fetchData();
    } catch (err) {
      setAlert({ type: 'error', msg: `Gagal menghapus: ${err.message}` });
    } finally {
      setLoading(false);
    }
  };

  const filteredData = dataList.filter((item) =>
    Object.values(item).some((val) =>
      String(val || '').toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  return (
    <div style={cardStyle}>
      <div style={headerStyle}>
        <div>
          <h3 style={{ margin: 0 }}>Management {title}</h3>
          <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '13px' }}>
            Kelola data master {title.toLowerCase()} sistem onboarding
          </p>
        </div>
        <button onClick={() => handleOpenModal()} style={btnPrimary}>
          + Tambah {title} Baru
        </button>
      </div>

      {alert.msg && (
        <div style={alert.type === 'success' ? alertSuccess : alertError}>{alert.msg}</div>
      )}

      <div style={{ marginBottom: '15px' }}>
        <input
          type="text"
          placeholder={`🔍 Cari di ${title}...`}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={inputStyle}
        />
      </div>

      {loading ? (
        <p style={{ color: '#64748b' }}>Memuat data...</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={tableStyle}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                <th style={thStyle}>PK / ID</th>
                {fields.map((f) => (
                  <th key={f.key} style={thStyle}>{f.label}</th>
                ))}
                <th style={{ ...thStyle, textAlign: 'center' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((item) => (
                <tr key={item[primaryKey]} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ ...tdStyle, fontWeight: 'bold' }}>#{item[primaryKey]}</td>
                  {fields.map((f) => (
                    <td style={tdStyle} key={f.key}>
                      {String(item[f.key] ?? '-')}
                    </td>
                  ))}
                  <td style={{ ...tdStyle, textAlign: 'center' }}>
                    <button onClick={() => handleOpenModal(item)} style={btnEdit}>Edit</button>
                    {' '}
                    <button onClick={() => handleDelete(item[primaryKey])} style={btnDelete}>Hapus</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL FORM CREATE / EDIT */}
      {modalOpen && (
        <div style={modalOverlay}>
          <div style={modalBox}>
            <h4>{editItem ? `Edit ${title} #${editItem[primaryKey]}` : `Tambah ${title} Baru`}</h4>
            <form onSubmit={handleSave}>
              {fields.map((f) => (
                <div key={f.key} style={{ marginBottom: '12px' }}>
                  <label style={labelStyle}>{f.label} {f.required && '*'}</label>
                  {f.type === 'select' ? (
                    <select
                      value={formData[f.key] || ''}
                      onChange={(e) => setFormData({ ...formData, [f.key]: e.target.value })}
                      style={inputStyle}
                      required={f.required}
                    >
                      <option value="">-- Pilih {f.label} --</option>
                      {f.options?.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={f.type || 'text'}
                      value={formData[f.key] || ''}
                      onChange={(e) => setFormData({ ...formData, [f.key]: e.target.value })}
                      style={inputStyle}
                      required={f.required}
                    />
                  )}
                </div>
              ))}
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '15px' }}>
                <button type="button" onClick={() => setModalOpen(false)} style={btnCancel}>Batal</button>
                <button type="submit" style={btnPrimary}>Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// STYLES
const cardStyle = { padding: '20px', border: '1px solid #e2e8f0', borderRadius: '8px', background: '#fff' };
const headerStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' };
const tableStyle = { width: '100%', borderCollapse: 'collapse', fontSize: '13px' };
const thStyle = { padding: '10px', textAlign: 'left', color: '#475569' };
const tdStyle = { padding: '10px' };
const inputStyle = { width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' };
const labelStyle = { display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#475569', marginBottom: '4px' };
const btnPrimary = { padding: '8px 14px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' };
const btnEdit = { padding: '4px 8px', background: '#0284c7', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' };
const btnDelete = { padding: '4px 8px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' };
const btnCancel = { padding: '8px 14px', background: '#64748b', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' };
const alertSuccess = { padding: '10px', background: '#dcfce7', color: '#15803d', borderRadius: '4px', marginBottom: '15px', fontSize: '13px' };
const alertError = { padding: '10px', background: '#fee2e2', color: '#991b1b', borderRadius: '4px', marginBottom: '15px', fontSize: '13px' };
const modalOverlay = { position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 50 };
const modalBox = { background: '#fff', padding: '20px', borderRadius: '8px', width: '400px' };