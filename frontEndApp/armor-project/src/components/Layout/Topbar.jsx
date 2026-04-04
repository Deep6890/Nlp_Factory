import React from 'react';
import './Layout.css';

const TopBar = () => (
  <div className="topbar">
    <div className="greeting">
       <p style={{color: '#64748b', fontSize: '12px'}}>Welcome back,</p>
       <h3 style={{fontSize: '18px'}}>Armor</h3>
    </div>
    <div className="user-area">
      <div className="user-pill">
        <div style={{width: '32px', height: '32px', background: '#cbd5e1', borderRadius: '50%'}}></div>
        <span style={{fontWeight: '600', fontSize: '14px'}}>Premium User</span>
      </div>
    </div>
  </div>
);
export default TopBar;