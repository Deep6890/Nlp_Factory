import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, History, CircleDot, BarChart2, Hexagon, Bell, AlertTriangle, FileText, ShieldCheck, LogOut } from 'lucide-react';
import './Layout.css';

const Sidebar = ({ isOpen = true }) => {
  const navigate = useNavigate();
  
  const mainItems = [
    { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={20} /> },
    { name: 'History', path: '/dashboard/history', icon: <History size={20} /> },
    { name: 'Live Detection', path: '/dashboard/live', icon: <CircleDot size={20} />, badge: 'LIVE', badgeColor: '#c7f284', badgeTextColor: '#000' },
  ];

  const analyticsItems = [
    { name: 'Insights', path: '/dashboard/insights', icon: <BarChart2 size={20} /> },
    { name: 'Decisions', path: '/dashboard/decisions', icon: <Hexagon size={20} /> },
  ];

  const actionsItems = [
    { name: 'Reminders', path: '/dashboard/reminders', icon: <Bell size={20} />, counter: 3 },
    { name: 'Risk Alerts', path: '/dashboard/alerts', icon: <AlertTriangle size={20} />, counter: 2 },
    { name: 'Reports', path: '/dashboard/reports', icon: <FileText size={20} /> },
  ];

  const SectionHeading = ({ title }) => (
    <div style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-muted)', marginTop: '24px', marginBottom: '12px', paddingLeft: '20px', letterSpacing: '1px' }}>
      {title.toUpperCase()}
    </div>
  );

  const renderNavLink = (item) => (
    <NavLink
      key={item.path}
      to={item.path}
      end={true}
      className={({ isActive }) => isActive ? 'nav-active' : 'nav-link'}
      style={{ display: 'flex', alignItems: 'center', width: '100%', boxSizing: 'border-box' }}
    >
      <span style={{display: 'flex', alignItems: 'center'}}>{item.icon}</span> 
      <span className="nav-text" style={{ flex: 1, marginLeft: '12px' }}>{item.name}</span>
      {item.badge && (
        <span style={{
          backgroundColor: item.badgeColor,
          color: item.badgeTextColor,
          fontSize: '11px',
          fontWeight: 'bold',
          padding: '2px 8px',
          borderRadius: '12px',
          marginLeft: 'auto'
        }}>
          {item.badge}
        </span>
      )}
      {item.counter !== undefined && (
        <span style={{
          backgroundColor: '#ff6b6b',
          color: 'white',
          fontSize: '11px',
          fontWeight: 'bold',
          width: '20px',
          height: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '50%',
          marginLeft: 'auto'
        }}>
          {item.counter}
        </span>
      )}
    </NavLink>
  );

  return (
    <div className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
      <div className="logo-container">
        <div className="logo-icon">
          <ShieldCheck size={22} color="white" strokeWidth={2.5} />
        </div>
        <h2>Armor<span style={{ fontWeight: 300, opacity: 0.8 }}>AI</span></h2>
      </div>
      <nav style={{ overflowY: 'auto' }}>
        {mainItems.map(renderNavLink)}
        
        <SectionHeading title="Analytics" />
        {analyticsItems.map(renderNavLink)}

        <SectionHeading title="Actions" />
        {actionsItems.map(renderNavLink)}

        <button 
          onClick={() => {
            if (window.confirm("Are you sure you want to log out?")) {
              navigate('/');
            }
          }}
          className="nav-link" 
          style={{ width: '100%', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', fontSize: '16px', marginTop: '20px' }}
        >
          <span style={{display: 'flex', alignItems: 'center'}}><LogOut size={20} color="#ef4444" /></span> 
          <span className="nav-text" style={{ color: '#ef4444', fontWeight: '700', marginLeft: '12px' }}>Logout</span>
        </button>
      </nav>
    </div>
  );
};

export default Sidebar;