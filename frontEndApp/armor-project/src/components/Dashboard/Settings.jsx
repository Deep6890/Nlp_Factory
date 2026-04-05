import React from 'react';

const Settings = () => {
  return (
    <div style={{ padding: '40px', background: '#f5f7f0', minHeight: '80vh', borderRadius: '35px' }}>
      <h1 style={{ fontSize: '32px', fontWeight: '800', marginBottom: '20px', letterSpacing: '-1px' }}>Account Settings</h1>
      <div style={{ background: 'white', padding: '30px', borderRadius: '20px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
        <p style={{ color: '#666' }}>Your application settings and preferences will appear here.</p>
        <button style={{ background: '#c7f284', border: 'none', padding: '12px 24px', borderRadius: '14px', fontWeight: '700', cursor: 'pointer', marginTop: '20px' }}>
          Save Configuration
        </button>
      </div>
    </div>
  );
};

export default Settings;
