import React, { useState } from 'react';
import StagingListView from '../components/StagingListView';
import SubmissionCreateView from '../components/SubmissionCreateView';
import SubmissionVerifyView from '../components/SubmissionVerifyView';

function OnboardingPage({ onNavigateToDashboard, pemicuKeluar }) {
  const [activeTab, setActiveTab] = useState('list'); // 'list' | 'create' | 'verify'
  const [selectedSubmissionId, setSelectedSubmissionId] = useState(null);

  const handleSelectVerification = (id) => {
    setSelectedSubmissionId(id);
    setActiveTab('verify');
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '20px auto', fontFamily: 'Arial, sans-serif', padding: '0 15px' }}>
      
      {/* NAVBAR HEADER TOP BAR */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', background: '#f8fafc', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '20px', color: '#0f172a' }}>Sistem Onboarding Staging & Verifikasi HR</h2>
        </div>
        
        <div style={{ display: 'flex', gap: '10px' }}>
          {onNavigateToDashboard && (
            <button
              onClick={onNavigateToDashboard}
              style={{
                padding: '8px 14px',
                backgroundColor: '#2563eb',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '13px',
              }}
            >
              ⬅️ Kembali ke Dashboard HR
            </button>
          )}

          {pemicuKeluar && (
            <button
              onClick={pemicuKeluar}
              style={{
                padding: '8px 14px',
                backgroundColor: '#ef4444',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '13px',
              }}
            >
              🚪 Logout
            </button>
          )}
        </div>
      </div>

      {/* Tab Header Navigation */}
      <div style={{ display: 'flex', gap: '10px', borderBottom: '2px solid #e5e7eb', marginBottom: '20px' }}>
        <button
          onClick={() => setActiveTab('list')}
          style={activeTab === 'list' ? tabActiveStyle : tabInactiveStyle}
        >
          1. List View (Staging Status)
        </button>
        <button
          onClick={() => setActiveTab('create')}
          style={activeTab === 'create' ? tabActiveStyle : tabInactiveStyle}
        >
          2. Create View (Form Karyawan)
        </button>
        <button
          onClick={() => setActiveTab('verify')}
          style={activeTab === 'verify' ? tabActiveStyle : tabInactiveStyle}
        >
          3. Verification View (HR Review)
        </button>
      </div>

      {/* Render Component Sesuai Tab Terpilih */}
      {activeTab === 'list' && (
        <StagingListView onSelectVerification={handleSelectVerification} />
      )}

      {activeTab === 'create' && (
        <SubmissionCreateView onSuccess={() => setActiveTab('list')} />
      )}

      {activeTab === 'verify' && (
        <SubmissionVerifyView 
          submissionId={selectedSubmissionId} 
          onBack={() => setActiveTab('list')}
        />
      )}
    </div>
  );
}

const tabActiveStyle = { padding: '10px 20px', border: 'none', borderBottom: '3px solid #2563eb', background: 'none', fontWeight: 'bold', cursor: 'pointer', color: '#2563eb' };
const tabInactiveStyle = { padding: '10px 20px', border: 'none', background: 'none', cursor: 'pointer', color: '#6b7280' };

export default OnboardingPage;