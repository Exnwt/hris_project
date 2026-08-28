import React, { useState } from 'react';
import api from '../api';

function OnboardingDetail() {
  const [id, setId] = useState('1');
  const [hasilData, setHasilData] = useState(null);
  const [pesanServer, setPesanServer] = useState('');

  function ambilDetail() {
    if (!id) return;

    // PERBAIKAN: Ditambahkan '/' di awal endpoint
    api.get(`/api/v1/onboarding/submission/${id}/`)
      .then((response) => {
        setHasilData(response.data.data);
        setPesanServer(response.data.message);
      })
      .catch((error) => {
        setPesanServer('Data tidak ditemukan / Error: ' + error.message);
        setHasilData(null);
      });
  }

  return (
    <div style={{ padding: '15px', border: '1px solid #ccc' }}>
      <h3>2. Cek Detail Submission (GET)</h3>
      <label>Masukkan ID (PK): </label>
      <input 
        type="number" 
        value={id} 
        onChange={(e) => setId(e.target.value)} 
        style={{ width: '60px' }}
      />
      <button onClick={ambilDetail} style={{ marginLeft: '10px' }}>
        Cari Data
      </button>

      <p><i>{pesanServer}</i></p>

      {hasilData && (
        <div style={{ background: '#f4f4f4', padding: '10px' }}>
          <b>Hasil Raw Payload:</b>
          <pre>{JSON.stringify(hasilData, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}

export default OnboardingDetail;