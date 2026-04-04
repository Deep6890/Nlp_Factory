import React, { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { User, Menu, X, Bell, LogOut } from 'lucide-react';
import LogoutModal from './LogoutModal';
import './Navbar.css';

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showLogout, setShowLogout] = useState(false);

  const navItems = [
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'History', path: '/dashboard/history' },
    { name: 'Live Detection', path: '/dashboard/live' },
    { name: 'Insights', path: '/dashboard/insights' },
    { name: 'Decisions', path: '/dashboard/decisions' },
    { name: 'Risk Alerts', path: '/dashboard/alerts' },
    { name: 'Reports', path: '/dashboard/reports' },
  ];

  return (
    <>
      <nav className="global-navbar">
        {/* Logo */}
        <Link to="/dashboard" className="nav-logo-link">
          <span className="logo-leaf">🌿</span>
          <span className="nav-logo-text">Armor.ai</span>
        </Link>

        {/* Center Navigation Links — Desktop */}
        <div className="nav-center-links">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/dashboard'}
              className={({ isActive }) =>
                `nav-item-link ${isActive ? 'nav-item-active' : ''}`
              }
            >
              {item.name}
            </NavLink>
          ))}
        </div>

        {/* Right Side — Reminders + Profile */}
        <div className="nav-right">
          <NavLink
            to="/dashboard/reminders"
            className={({ isActive }) =>
              `nav-reminder-btn ${isActive ? 'nav-reminder-active' : ''}`
            }
            title="Reminders"
          >
            <Bell size={16} />
            <span className="nav-reminder-badge">3</span>
          </NavLink>
          <Link to="/dashboard/profile" className="nav-profile" style={{ textDecoration: 'none' }}>
            <div className="nav-avatar"><User size={14} /></div>
            <span>Profile</span>
          </Link>
        </div>

        {/* Mobile Hamburger */}
        <button className="nav-hamburger" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>

        {/* Mobile Menu Overlay */}
        {mobileOpen && (
          <div className="nav-mobile-overlay" onClick={() => setMobileOpen(false)}>
            <div className="nav-mobile-menu" onClick={(e) => e.stopPropagation()}>
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/dashboard'}
                  className={({ isActive }) =>
                    `nav-mobile-link ${isActive ? 'nav-mobile-active' : ''}`
                  }
                  onClick={() => setMobileOpen(false)}
                >
                  {item.name}
                </NavLink>
              ))}
              <div className="nav-mobile-divider" />
              <NavLink
                to="/dashboard/reminders"
                className={({ isActive }) =>
                  `nav-mobile-link ${isActive ? 'nav-mobile-active' : ''}`
                }
                onClick={() => setMobileOpen(false)}
              >
                Reminders
              </NavLink>
              <NavLink
                to="/dashboard/profile"
                className="nav-mobile-link"
                onClick={() => setMobileOpen(false)}
              >
                Profile
              </NavLink>
              <div className="nav-mobile-divider" />
              <button
                className="nav-mobile-link nav-mobile-logout"
                onClick={() => { setMobileOpen(false); setShowLogout(true); }}
              >
                <LogOut size={16} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                Sign Out
              </button>
            </div>
          </div>
        )}
      </nav>

      <LogoutModal isOpen={showLogout} onClose={() => setShowLogout(false)} />
    </>
  );
};

export default Navbar;

