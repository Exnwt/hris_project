import React, { useState } from 'react';
import api from '../api';

const cardStyle = { padding: '20px', border: '1px solid #e5e7eb', borderRadius: '8px', background: '#fff' };
const gridStyle = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' };
const inputStyle = { width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' };
const sectionTitle = { borderBottom: '1px solid #eee', paddingBottom: '5px', color: '#1e293b' };
const btnStyle = { padding: '8px 16px', borderRadius: '4px', color: '#fff', backgroundColor: '#2563eb', border: 'none', cursor: 'pointer' };
const alertSuccess = { padding: '10px', background: '#dcfce7', color: '#15803d', borderRadius: '4px', marginBottom: '15px' };
const alertError = { padding: '10px', background: '#fee2e2', color: '#991b1b', borderRadius: '4px', marginBottom: '15px' };

// PERBAIKAN: Tambahkan 'export default' langsung di sini
export default function SubmissionCreateView({ onSuccess }) {
  const [formData, setFormData] = useState({
    nama_lengkap: '',
    nik_ktp: '',
    jenis_kelamin: 'L',
    tempat_lahir: '',
    tanggal_lahir: '',
    agama: 'ISLAM',
    pendidikan: 'S1',
    nationality: 'WNI',
    alamat: '',
    contact_person: '',
    emergency_contact_name: '',
    emergency_contact_relation: '',
    emergency_contact_phone: '',
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      await api.post('/api/v1/onboarding/submission/create/', {
        raw_payload: formData,
      });

      setMessage({ type: 'success', text: 'Data onboarding berhasil dikirim!' });

      setFormData({
        nama_lengkap: '', nik_ktp: '', jenis_kelamin: 'L', tempat_lahir: '',
        tanggal_lahir: '', agama: 'ISLAM', pendidikan: 'S1', nationality: 'WNI',
        alamat: '', contact_person: '', emergency_contact_name: '',
        emergency_contact_relation: '', emergency_contact_phone: '',
      });

      if (onSuccess) onSuccess();
    } catch (err) {
      setMessage({
        type: 'error',
        text: 'Gagal mengirim data: ' + (err.response?.data?.message || err.message),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={cardStyle}>
      <h3>Form Input Data Karyawan Baru</h3>
      {message.text && (
        <div style={message.type === 'success' ? alertSuccess : alertError}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={gridStyle}>
          <div style={{ gridColumn: 'span 2' }}>
            <h4 style={sectionTitle}>1. Informasi Pribadi</h4>
          </div>

          <div>
            <label>Nama Lengkap *</label>
            <input type="text" name="nama_lengkap" value={formData.nama_lengkap} onChange={handleChange} required style={inputStyle} />
          </div>

          <div>
            <label>NIK KTP *</label>
            <input type="text" name="nik_ktp" maxLength="16" value={formData.nik_ktp} onChange={handleChange} required style={inputStyle} />
          </div>

          <div>
            <label>Jenis Kelamin</label>
            <select name="jenis_kelamin" value={formData.jenis_kelamin} onChange={handleChange} style={inputStyle}>
              <option value="L">Laki-laki</option>
              <option value="P">Perempuan</option>
            </select>
          </div>

          <div>
            <label>Kewarganegaraan</label>
            <select name="nationality" value={formData.nationality} onChange={handleChange} style={inputStyle}>
              <option value="WNI">WNI</option>
              <option value="WNA">WNA</option>
            </select>
          </div>

          <div>
            <label>Tempat Lahir</label>
            <input type="text" name="tempat_lahir" value={formData.tempat_lahir} onChange={handleChange} style={inputStyle} />
          </div>

          <div>
            <label>Tanggal Lahir</label>
            <input type="date" name="tanggal_lahir" value={formData.tanggal_lahir} onChange={handleChange} style={inputStyle} />
          </div>

          <div>
            <label>Agama</label>
            <select name="agama" value={formData.agama} onChange={handleChange} style={inputStyle}>
              <option value="ISLAM">Islam</option>
              <option value="KRISTEN">Kristen</option>
              <option value="KATOLIK">Katolik</option>
              <option value="HINDU">Hindu</option>
              <option value="BUDDHA">Buddha</option>
              <option value="KONGHUCU">Konghucu</option>
            </select>
          </div>

          <div>
            <label>Pendidikan Terakhir</label>
            <select name="pendidikan" value={formData.pendidikan} onChange={handleChange} style={inputStyle}>
              <option value="SMA">SMA/Sederajat</option>
              <option value="D3">D3</option>
              <option value="S1">S1</option>
              <option value="S2">S2</option>
              <option value="S3">S3</option>
            </select>
          </div>

          <div style={{ gridColumn: 'span 2' }}>
            <h4 style={sectionTitle}>2. Alamat & Kontak</h4>
          </div>

          <div style={{ gridColumn: 'span 2' }}>
            <label>Alamat Lengkap</label>
            <textarea name="alamat" rows="2" value={formData.alamat} onChange={handleChange} style={inputStyle} />
          </div>

          <div>
            <label>No. HP Karyawan</label>
            <input type="text" name="contact_person" value={formData.contact_person} onChange={handleChange} style={inputStyle} />
          </div>

          <div>
            <label>Nama Kontak Darurat</label>
            <input type="text" name="emergency_contact_name" value={formData.emergency_contact_name} onChange={handleChange} style={inputStyle} />
          </div>

          <div>
            <label>Hubungan Kontak Darurat</label>
            <input type="text" name="emergency_contact_relation" value={formData.emergency_contact_relation} onChange={handleChange} style={inputStyle} />
          </div>

          <div>
            <label>No. HP Kontak Darurat</label>
            <input type="text" name="emergency_contact_phone" value={formData.emergency_contact_phone} onChange={handleChange} style={inputStyle} />
          </div>
        </div>

        <button type="submit" disabled={loading} style={{ ...btnStyle, marginTop: '20px', backgroundColor: '#2563eb' }}>
          {loading ? 'Mengirim Data...' : 'Kirim Submission Onboarding'}
        </button>
      </form>
    </div>
  );
}