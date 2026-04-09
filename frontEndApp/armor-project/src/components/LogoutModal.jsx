import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, X, ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './LogoutModal.css';

const LogoutModal = ({ isOpen, onClose }) => {
  const navigate    = useNavigate();
  const { logout }  = useAuth();

  // Lock body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleEsc = (e) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  const handleLogout = () => {
    logout();      // clears token + user from context & localStorage
    onClose();
    navigate('/');
  };

  if (!isOpen) return null;

  return (
    <div className="logout-modal-overlay" onClick={onClose}>
      <div className="logout-modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button className="logout-modal-close" onClick={onClose} aria-label="Close">
          <X size={18} />
        </button>

        {/* Icon */}
        <div className="logout-modal-icon-wrapper">
          <div className="logout-modal-icon-ring" />
          <div className="logout-modal-icon">
            <ShieldAlert size={28} />
          </div>
        </div>

        {/* Title & Description */}
        <h3 className="logout-modal-title">Sign Out?</h3>
        <p className="logout-modal-desc">
          You're about to sign out of <strong>Armor.ai</strong>. You'll need to log in again to access your dashboard and insights.
        </p>

        {/* Action Buttons */}
        <div className="logout-modal-actions">
          <button className="logout-modal-btn-cancel" onClick={onClose}>
            Stay Signed In
          </button>
          <button className="logout-modal-btn-confirm" onClick={handleLogout}>
            <LogOut size={16} />
            Yes, Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};

export default LogoutModal;


