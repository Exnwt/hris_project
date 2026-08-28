import React, { useState, useEffect } from 'react';
import api from '../api';

export default function StagingListView({ onSelectVerification }) {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL'); // 'ALL' | 'PENDING' | 'PROCESSED'
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('ID_DESC'); // 'ID_DESC' | 'ID_ASC' | 'DATE_DESC' | 'DATE_ASC' | 'NAME_ASC' | 'NAME_DESC'

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await api.get('/api/v1/onboarding/staging-submissions/');
      const dataList = res.data.results || res.data || [];
      setSubmissions(dataList);
    } catch (err) {
      setErrorMsg('Gagal memuat daftar staging submission: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const getCandidateName = (item) => {
    const payload = item.raw_payload || item.data || {};
    return payload.nama_lengkap || payload.nama || payload.Nama || 'Kandidat Tanpa Nama';
  };

  const getCandidateNik = (item) => {
    const payload = item.raw_payload || item.data || {};
    return payload.nik_karyawan || payload.nik_ktp || payload.nik || '-';
  };

  // FILTER & SORTING LOGIC
  const processedData = submissions
    .filter((item) => {
      const matchesStatus =
        filterStatus === 'ALL'
          ? true
          : filterStatus === 'PENDING'
          ? !item.is_processed
          : item.is_processed;

      const candidateName = getCandidateName(item).toLowerCase();
      const candidateNik = getCandidateNik(item).toLowerCase();
      const query = searchQuery.toLowerCase();

      const matchesSearch =
        String(item.id).includes(query) ||
        candidateName.includes(query) ||
        candidateNik.includes(query);

      return matchesStatus && matchesSearch;
    })
    .sort((a, b) => {
      if (sortBy === 'ID_DESC') return b.id - a.id;
      if (sortBy === 'ID_ASC') return a.id - b.id;
      if (sortBy === 'DATE_DESC') return new Date(b.created_at || 0) - new Date(a.created_at || 0);
      if (sortBy === 'DATE_ASC') return new Date(a.created_at || 0) - new Date(b.created_at || 0);
      if (sortBy === 'NAME_ASC') return getCandidateName(a).localeCompare(getCandidateName(b));
      if (sortBy === 'NAME_DESC') return getCandidateName(b).localeCompare(getCandidateName(a));
      return 0;
    });

  return (
    <div style={cardStyle}>
      {/* HEADER PAGE */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h3 style={{ margin: 0, color: '#0f172a' }}>Daftar Staging Submission Karyawan</h3>
          <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '14px' }}>
            Tinjau seluruh data masuk dari Google Form / Form Input sebelum diverifikasi ke Database HR Utama.
          </p>
        </div>
        <button onClick={fetchSubmissions} disabled={loading} style={btnRefreshStyle}>
          🔄 {loading ? 'Memuat...' : 'Refresh List'}
        </button>
      </div>

      {/* FILTER TABS, SEARCH BAR & SORT BY */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        {/* Filter Status Tabs */}
        <div style={{ display: 'flex', gap: '6px', background: '#f1f5f9', padding: '4px', borderRadius: '6px' }}>
          <button
            onClick={() => setFilterStatus('ALL')}
            style={filterStatus === 'ALL' ? filterBtnActive : filterBtnInactive}
          >
            Semua ({submissions.length})
          </button>
          <button
            onClick={() => setFilterStatus('PENDING')}
            style={filterStatus === 'PENDING' ? filterBtnActive : filterBtnInactive}
          >
            ⏳ Pending ({submissions.filter((s) => !s.is_processed).length})
          </button>
          <button
            onClick={() => setFilterStatus('PROCESSED')}
            style={filterStatus === 'PROCESSED' ? filterBtnActive : filterBtnInactive}
          >
            ✓ Processed ({submissions.filter((s) => s.is_processed).length})
          </button>
        </div>

        {/* Search Bar & Sort Dropdown */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="🔍 Cari ID / Nama / NIK..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={inputSearchStyle}
          />

          {/* DROPDOWN SORT BY */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={selectSortStyle}
          >
            <option value="ID_DESC">Sort: ID Terbaru (Descending)</option>
            <option value="ID_ASC">Sort: ID Terlama (Ascending)</option>
            <option value="DATE_DESC">Sort: Tanggal Terbaru</option>
            <option value="DATE_ASC">Sort: Tanggal Terlama</option>
            <option value="NAME_ASC">Sort: Nama A-Z</option>
            <option value="NAME_DESC">Sort: Nama Z-A</option>
          </select>
        </div>
      </div>

      {errorMsg && <div style={alertErrorStyle}>{errorMsg}</div>}

      {/* DATA TABLE */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
          Sedang mengambil data dari backend...
        </div>
      ) : processedData.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8', border: '2px dashed #e2e8f0', borderRadius: '8px' }}>
          Tidak ada data staging submission yang sesuai dengan kriteria filter.
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={tableStyle}>
            <thead>
              <tr style={tableHeaderStyle}>
                <th style={thStyle}>ID Staging</th>
                <th style={thStyle}>Nama Kandidat</th>
                <th style={thStyle}>NIK / Identitas</th>
                <th style={thStyle}>Waktu Ingest</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Diverifikasi Oleh</th>
                <th style={{ ...thStyle, textAlign: 'center' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {processedData.map((item) => (
                <tr key={item.id} style={tableRowStyle}>
                  <td style={{ ...tdStyle, fontWeight: 'bold', color: '#2563eb' }}>#{item.id}</td>
                  <td style={tdStyle}>
                    <div style={{ fontWeight: '600', color: '#0f172a' }}>{getCandidateName(item)}</div>
                  </td>
                  <td style={{ ...tdStyle, color: '#64748b' }}>{getCandidateNik(item)}</td>
                  <td style={{ ...tdStyle, fontSize: '12px', color: '#64748b' }}>
                    {item.created_at ? new Date(item.created_at).toLocaleString('id-ID') : '-'}
                  </td>
                  <td style={tdStyle}>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '4px 10px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '600',
                        backgroundColor: item.is_processed ? '#dcfce7' : '#fef3c7',
                        color: item.is_processed ? '#15803d' : '#b45309',
                      }}
                    >
                      {item.is_processed ? '✓ Diverifikasi' : '⏳ Pending Review'}
                    </span>
                  </td>
                  <td style={{ ...tdStyle, fontSize: '13px', color: '#475569' }}>
                    {item.processed_by ? (
                      <span style={{ fontWeight: '500' }}>👤 {item.processed_by}</span>
                    ) : (
                      <span style={{ color: '#94a3b8' }}>-</span>
                    )}
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'center' }}>
                    <button
                      onClick={() => onSelectVerification(item.id)}
                      style={{
                        ...btnActionStyle,
                        backgroundColor: item.is_processed ? '#64748b' : '#2563eb',
                      }}
                    >
                      {item.is_processed ? 'Lihat Detail' : 'Review & Verifikasi'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// STYLES
const cardStyle = { padding: '24px', border: '1px solid #e2e8f0', borderRadius: '10px', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' };
const inputSearchStyle = { width: '220px', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' };
const selectSortStyle = { padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', backgroundColor: '#fff', color: '#334155', cursor: 'pointer' };
const btnRefreshStyle = { padding: '8px 16px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff', color: '#334155', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' };
const filterBtnActive = { padding: '6px 12px', border: 'none', background: '#fff', color: '#2563eb', fontWeight: 'bold', borderRadius: '4px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', cursor: 'pointer', fontSize: '13px' };
const filterBtnInactive = { padding: '6px 12px', border: 'none', background: 'transparent', color: '#64748b', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' };
const alertErrorStyle = { padding: '10px', background: '#fee2e2', color: '#991b1b', borderRadius: '6px', marginBottom: '15px', fontSize: '13px' };
const tableStyle = { width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' };
const tableHeaderStyle = { background: '#f8fafc', borderBottom: '2px solid #e2e8f0' };
const thStyle = { padding: '12px', color: '#475569', fontWeight: 'bold' };
const tableRowStyle = { borderBottom: '1px solid #f1f5f9' };
const tdStyle = { padding: '12px', verticalAlign: 'middle' };
const btnActionStyle = { padding: '6px 14px', borderRadius: '6px', color: '#fff', border: 'none', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' };