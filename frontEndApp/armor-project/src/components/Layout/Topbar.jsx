import React from 'react';
import { useApp } from '../../context/AppContext';
import './Layout.css';

const TopBar = () => {
  const { profile } = useApp();
  return (
  <div className="topbar">
    <div className="greeting">
       <p style={{color: '#64748b', fontSize: '12px'}}>Welcome back,</p>
       <h3 style={{fontSize: '18px'}}>{profile.name.split(' ')[0]}</h3>
    </div>
    <div className="user-area">
      <div className="user-pill">
        <div style={{width: '32px', height: '32px', background: '#cbd5e1', borderRadius: '50%'}}></div>
        <span style={{fontWeight: '600', fontSize: '14px'}}>Premium User</span>
      </div>
    </div>
  </div>
  );
};
export default TopBar;