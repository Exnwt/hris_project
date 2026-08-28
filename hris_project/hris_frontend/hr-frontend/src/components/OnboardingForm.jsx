import React, { useState } from 'react';
import api from '../api';

function OnboardingForm() {
  const [payload, setPayload] = useState('');
  const [pesan, setPesan] = useState('');

  function simpanData(e) {
    e.preventDefault();

    // PERBAIKAN: Ditambahkan '/' di awal endpoint
    api.post('/api/v1/onboarding/submission/create/', { raw_payload: payload })
      .then((response) => {
        setPesan('Berhasil disimpan!');
        setPayload('');
      })
      .catch((error) => {
        setPesan('Gagal kirim data: ' + error.message);
      });
  }

  return (
    <div style={{ padding: '15px', border: '1px solid #ccc', marginBottom: '20px' }}>
      <h3>1. Form Tambah Submission (POST)</h3>
      <form onSubmit={simpanData}>
        <label>Isi Raw Payload / Data Input:</label><br />
        <textarea 
          rows="3" 
          cols="40"
          value={payload}
          onChange={(e) => setPayload(e.target.value)}
          placeholder="Isi teks/data..."
        />
        <br />
        <button type="submit">Kirim ke Django</button>
      </form>
      {pesan && <p><b>Status:</b> {pesan}</p>}
    </div>
  );
}

export default OnboardingForm;