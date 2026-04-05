import React, { useState, useEffect } from 'react';
import { AlertTriangle, Lightbulb, Wallet, ArrowRight, BrainCircuit, TrendingDown, Activity, Filter, Bell, X, Clock, Eye } from 'lucide-react';
import { useApp } from '../../context/AppContext';

const C = {
  cream: '#FFFDF6', cream2: '#FAF6E9', limelt: '#DDEB9D',
  green: '#A0C878', greendk: '#7aaa52', text: '#1a2010',
  textmid: '#4a5a30', textdim: '#8a9a70', shadow: 'rgba(100,140,60,0.11)',
};

const CATEGORIES = ['All', 'EMI Risk', 'Savings Risk', 'Emotion Risk'];

const ALERT_ICONS = [AlertTriangle, Lightbulb, BrainCircuit, Wallet, TrendingDown, Activity];

const LEVEL_STYLE = {
  HIGH: { iconBg: '#1a2010', iconColor: '#fff',    levelBg: '#fef2f2', levelColor: '#dc2626', levelBorder: '#fecaca' },
  MED:  { iconBg: '#FAF6E9', iconColor: '#4a5a30', levelBg: '#fefce8', levelColor: '#92400e', levelBorder: '#fde68a' },
  LOW:  { iconBg: '#FAF6E9', iconColor: '#4a5a30', levelBg: '#DDEB9D', levelColor: '#7aaa52', levelBorder: '#A0C878' },
};

const Alerts = () => {
  const [activeFilter, setActiveFilter] = useState('All');
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [animateIn, setAnimateIn] = useState(false);
  const [riskScore, setRiskScore] = useState(0);
  const { alerts: rawAlerts } = useApp();

  const ALERTS = rawAlerts.map((a, i) => ({
    ...a,
    Icon: ALERT_ICONS[i % ALERT_ICONS.length],
    ...LEVEL_STYLE[a.level],
  }));

  const getCategoryCount = (cat) => cat === 'All' ? ALERTS.length : ALERTS.filter(a => a.category === cat).length;
  const getLevelCount = (level) => ALERTS.filter(a => a.level === level).length;

  const filtered = activeFilter === 'All' ? ALERTS : ALERTS.filter(a => a.category === activeFilter);

  // Animate in on mount
  useEffect(() => {
    const t = setTimeout(() => setAnimateIn(true), 100);
    return () => clearTimeout(t);
  }, []);

  // Re-trigger animation on filter change
  useEffect(() => {
    setAnimateIn(false);
    const t = setTimeout(() => setAnimateIn(true), 50);
    return () => clearTimeout(t);
  }, [activeFilter]);

  // Animate risk score counter
  useEffect(() => {
    const target = 72;
    let current = 0;
    const step = target / 40;
    const id = setInterval(() => {
      current += step;
      if (current >= target) { setRiskScore(target); clearInterval(id); }
      else setRiskScore(Math.round(current));
    }, 30);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="ra-page">

      {/* Header */}
      <div className="ra-header">
        <div>
          <h1 className="ra-title">Risk Alerts</h1>
          <p className="ra-subtitle">Financial warnings detected from your conversations</p>
        </div>
        <div className="ra-header-badge">
          <Bell size={14} />
          <span>{rawAlerts.length} Active</span>
        </div>
      </div>

      {/* Summary Stats Row */}
      <div className="ra-stats-row">
        {/* Risk Score */}
        <div className="ra-stat-card ra-score-card">
          <div className="ra-score-ring">
            <svg viewBox="0 0 80 80" className="ra-ring-svg">
              <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(160,200,120,0.12)" strokeWidth="5" />
              <circle
                cx="40" cy="40" r="34" fill="none"
                stroke={riskScore > 60 ? '#dc2626' : riskScore > 35 ? '#e0a020' : C.greendk}
                strokeWidth="5"
                strokeDasharray={`${(riskScore / 100) * 213.6} 213.6`}
                strokeLinecap="round"
                className="ra-ring-progress"
              />
            </svg>
            <span className="ra-score-num">{riskScore}</span>
          </div>
          <div className="ra-score-info">
            <span className="ra-score-label">Risk Score</span>
            <span className="ra-score-desc">Overall financial risk level</span>
          </div>
        </div>

        {/* Severity breakdown */}
        <div className="ra-stat-card">
          <div className="ra-severity-dot ra-dot-high" />
          <div className="ra-stat-info">
            <span className="ra-stat-num">{getLevelCount('HIGH')}</span>
            <span className="ra-stat-label">High Priority</span>
          </div>
        </div>
        <div className="ra-stat-card">
          <div className="ra-severity-dot ra-dot-med" />
          <div className="ra-stat-info">
            <span className="ra-stat-num">{getLevelCount('MED')}</span>
            <span className="ra-stat-label">Medium Priority</span>
          </div>
        </div>
        <div className="ra-stat-card">
          <div className="ra-severity-dot ra-dot-low" />
          <div className="ra-stat-info">
            <span className="ra-stat-num">{getLevelCount('LOW')}</span>
            <span className="ra-stat-label">Low Priority</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="ra-filters">
        <Filter size={14} className="ra-filter-icon" />
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            className={`ra-filter-btn ${activeFilter === cat ? 'is-active' : ''}`}
            onClick={() => setActiveFilter(cat)}
          >
            {cat}
            <span className="ra-filter-count">{getCategoryCount(cat)}</span>
          </button>
        ))}
      </div>

      {/* Alert Cards */}
      <div className="ra-alerts-grid">
        {filtered.map((alert, i) => (
          <div
            key={alert.id}
            className={`ra-alert-card ${animateIn ? 'is-visible' : ''}`}
            style={{ animationDelay: `${i * 0.08}s` }}
            onClick={() => setSelectedAlert(alert)}
          >
            <div className="ra-alert-content">
              {/* Icon */}
              <div className="ra-alert-icon" style={{ background: alert.iconBg }}>
                <alert.Icon size={17} color={alert.iconColor} />
              </div>

              {/* Body */}
              <div className="ra-alert-body">
                <div className="ra-alert-top">
                  <h4 className="ra-alert-title">{alert.title}</h4>
                  <span
                    className="ra-level-badge"
                    style={{ background: alert.levelBg, color: alert.levelColor, borderColor: alert.levelBorder }}
                  >
                    {alert.level === 'HIGH' && <span className="ra-pulse-dot" style={{ background: alert.levelColor }} />}
                    {alert.level}
                  </span>
                </div>

                <p className="ra-alert-desc">{alert.body}</p>

                {/* Footer */}
                <div className="ra-alert-footer">
                  <div className="ra-alert-meta">
                    <Clock size={11} />
                    <span>{alert.from} · {alert.date}</span>
                  </div>
                  <button className="ra-view-btn">
                    <Eye size={12} />
                    View Details
                    <ArrowRight size={12} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Detail Modal */}
      {selectedAlert && (
        <div className="ra-modal-overlay" onClick={() => setSelectedAlert(null)}>
          <div className="ra-modal" onClick={(e) => e.stopPropagation()}>
            <button className="ra-modal-close" onClick={() => setSelectedAlert(null)}>
              <X size={18} />
            </button>
            <div className="ra-modal-header">
              <div className="ra-alert-icon ra-modal-icon" style={{ background: selectedAlert.iconBg }}>
                <selectedAlert.Icon size={22} color={selectedAlert.iconColor} />
              </div>
              <div>
                <span
                  className="ra-level-badge"
                  style={{ background: selectedAlert.levelBg, color: selectedAlert.levelColor, borderColor: selectedAlert.levelBorder }}
                >
                  {selectedAlert.level === 'HIGH' && <span className="ra-pulse-dot" style={{ background: selectedAlert.levelColor }} />}
                  {selectedAlert.level} PRIORITY
                </span>
                <h2 className="ra-modal-title">{selectedAlert.title}</h2>
              </div>
            </div>
            <p className="ra-modal-body">{selectedAlert.body}</p>
            <div className="ra-modal-meta-row">
              <div className="ra-modal-meta-item">
                <span className="ra-modal-meta-label">Source</span>
                <span className="ra-modal-meta-val">{selectedAlert.from}</span>
              </div>
              <div className="ra-modal-meta-item">
                <span className="ra-modal-meta-label">Date</span>
                <span className="ra-modal-meta-val">{selectedAlert.date}, {selectedAlert.time}</span>
              </div>
              <div className="ra-modal-meta-item">
                <span className="ra-modal-meta-label">Category</span>
                <span className="ra-modal-meta-val">{selectedAlert.category}</span>
              </div>
              <div className="ra-modal-meta-item">
                <span className="ra-modal-meta-label">Impact Score</span>
                <span className="ra-modal-meta-val" style={{ color: selectedAlert.impact > 60 ? '#dc2626' : selectedAlert.impact > 35 ? '#e0a020' : C.greendk, fontWeight: 800 }}>
                  {selectedAlert.impact}%
                </span>
              </div>
            </div>
            <div className="ra-modal-impact-bar">
              <div className="ra-impact-track" style={{ height: 8 }}>
                <div
                  className="ra-impact-fill"
                  style={{
                    width: `${selectedAlert.impact}%`,
                    background: selectedAlert.impact > 60 ? '#dc2626' : selectedAlert.impact > 35 ? '#e0a020' : C.greendk,
                    transition: 'width 0.8s cubic-bezier(0.22,1,0.36,1)',
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        /* ══════════════════════════════════════
           RISK ALERTS PAGE — Dynamic & Animated
           ══════════════════════════════════════ */

        .ra-page {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          display: flex;
          flex-direction: column;
          gap: 20px;
          color: #1a2010;
        }

        /* ── Header ── */
        .ra-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          animation: raFadeDown 0.5s ease-out both;
        }
        .ra-title {
          font-size: clamp(22px, 3vw, 30px);
          font-weight: 900;
          letter-spacing: -1px;
          color: #1a2010;
        }
        .ra-subtitle {
          font-size: 13px;
          color: #8a9a70;
          margin-top: 5px;
        }
        .ra-header-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          background: #fef2f2;
          color: #dc2626;
          border: 1px solid #fecaca;
          padding: 6px 14px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 700;
          animation: raFadeDown 0.5s ease-out 0.1s both;
        }

        @keyframes raFadeDown {
          from { opacity: 0; transform: translateY(-10px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* ── Stats Row ── */
        .ra-stats-row {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr;
          gap: 12px;
          animation: raFadeDown 0.5s ease-out 0.15s both;
        }
        .ra-stat-card {
          background: rgba(255,255,255,0.18);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.55);
          border-radius: 18px;
          padding: 18px 20px;
          display: flex;
          align-items: center;
          gap: 14px;
          box-shadow: 0 8px 32px rgba(100,140,60,0.10), inset 0 1.5px 0 rgba(255,255,255,0.85), inset 0 -1px 0 rgba(160,200,120,0.06);
          transition: all 0.35s cubic-bezier(0.22,1,0.36,1);
          position: relative;
          overflow: hidden;
        }
        .ra-stat-card::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0) 55%);
          border-radius: inherit;
          pointer-events: none;
        }
        .ra-stat-card:hover {
          transform: translateY(-4px);
          background: rgba(255,255,255,0.30);
          box-shadow: 0 16px 48px rgba(100,140,60,0.14), inset 0 1.5px 0 rgba(255,255,255,0.9);
          border-color: rgba(160,200,120,0.45);
        }

        /* Risk Score Ring */
        .ra-score-card { gap: 18px; }
        .ra-score-ring {
          position: relative;
          width: 64px;
          height: 64px;
          flex-shrink: 0;
        }
        .ra-ring-svg {
          width: 100%;
          height: 100%;
          transform: rotate(-90deg);
        }
        .ra-ring-progress {
          transition: stroke-dasharray 1.2s cubic-bezier(0.22,1,0.36,1);
        }
        .ra-score-num {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          font-weight: 900;
          color: #1a2010;
        }
        .ra-score-info { display: flex; flex-direction: column; gap: 3px; }
        .ra-score-label { font-size: 14px; font-weight: 800; color: #1a2010; }
        .ra-score-desc { font-size: 12px; color: #8a9a70; }

        /* Severity dots */
        .ra-severity-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .ra-dot-high {
          background: #dc2626;
          box-shadow: 0 0 0 3px rgba(220,38,38,0.15);
          animation: raDotPulse 2s ease-in-out infinite;
        }
        .ra-dot-med {
          background: #e0a020;
          box-shadow: 0 0 0 3px rgba(224,160,32,0.15);
        }
        .ra-dot-low {
          background: #7aaa52;
          box-shadow: 0 0 0 3px rgba(122,170,82,0.15);
        }
        @keyframes raDotPulse {
          0%, 100% { box-shadow: 0 0 0 3px rgba(220,38,38,0.15); }
          50%      { box-shadow: 0 0 0 6px rgba(220,38,38,0.08); }
        }
        .ra-stat-info { display: flex; flex-direction: column; gap: 2px; }
        .ra-stat-num { font-size: 22px; font-weight: 900; color: #1a2010; }
        .ra-stat-label { font-size: 11px; color: #8a9a70; font-weight: 600; }

        /* ── Filters ── */
        .ra-filters {
          display: flex;
          align-items: center;
          gap: 8px;
          animation: raFadeDown 0.5s ease-out 0.25s both;
          background: rgba(255,255,255,0.18);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.55);
          border-radius: 16px;
          padding: 8px 12px;
          box-shadow: 0 8px 32px rgba(100,140,60,0.08), inset 0 1.5px 0 rgba(255,255,255,0.85);
        }
        .ra-filter-icon {
          color: #8a9a70;
          margin-right: 4px;
        }
        .ra-filter-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 18px;
          border-radius: 12px;
          font-size: 13px;
          font-weight: 700;
          font-family: inherit;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.22,1,0.36,1);
          background: rgba(255,255,255,0.22);
          color: #8a9a70;
          border: 1px solid rgba(255,255,255,0.45);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.7);
        }
        .ra-filter-btn:hover {
          background: rgba(255,255,255,0.35);
          border-color: rgba(160,200,120,0.40);
          color: #4a5a30;
          box-shadow: 0 4px 16px rgba(100,140,60,0.08), inset 0 1px 0 rgba(255,255,255,0.8);
        }
        .ra-filter-btn.is-active {
          background: rgba(221,235,157,0.65);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          color: #1a2010;
          border-color: rgba(160,200,120,0.55);
          box-shadow: 0 4px 16px rgba(160,200,120,0.18), inset 0 1px 0 rgba(255,255,255,0.8);
        }
        .ra-filter-count {
          font-size: 10px;
          font-weight: 800;
          background: rgba(0,0,0,0.06);
          padding: 2px 7px;
          border-radius: 8px;
        }
        .ra-filter-btn.is-active .ra-filter-count {
          background: rgba(26,32,16,0.1);
        }

        /* ── Alerts Grid ── */
        .ra-alerts-grid {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .ra-alert-card {
          background: rgba(255,255,255,0.18);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.55);
          border-radius: 18px;
          box-shadow: 0 8px 32px rgba(100,140,60,0.09), inset 0 1.5px 0 rgba(255,255,255,0.85), inset 0 -1px 0 rgba(160,200,120,0.06);
          overflow: hidden;
          display: flex;
          cursor: pointer;
          opacity: 0;
          transform: translateY(16px);
          transition: all 0.35s cubic-bezier(0.22,1,0.36,1);
          position: relative;
        }
        .ra-alert-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.95), transparent);
          pointer-events: none;
        }
        .ra-alert-card.is-visible {
          animation: raSlideUp 0.5s cubic-bezier(0.22,1,0.36,1) forwards;
          animation-delay: inherit;
        }
        .ra-alert-card:hover {
          transform: translateY(-4px) !important;
          background: rgba(255,255,255,0.30);
          box-shadow: 0 20px 56px rgba(100,140,60,0.14), inset 0 1.5px 0 rgba(255,255,255,0.9);
          border-color: rgba(160,200,120,0.45);
        }

        @keyframes raSlideUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .ra-alert-content {
          flex: 1;
          display: flex;
          gap: 14px;
          padding: 18px 20px;
          align-items: flex-start;
        }

        .ra-alert-icon {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: transform 0.3s ease;
        }
        .ra-alert-card:hover .ra-alert-icon {
          transform: scale(1.08) rotate(-3deg);
        }

        .ra-alert-body { flex: 1; display: flex; flex-direction: column; gap: 8px; }
        .ra-alert-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
        .ra-alert-title {
          font-size: 14px;
          font-weight: 800;
          color: #1a2010;
          line-height: 1.3;
        }
        .ra-alert-desc {
          font-size: 12.5px;
          color: #4a5a30;
          line-height: 1.65;
          margin: 0;
        }

        .ra-level-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 10px;
          font-weight: 800;
          padding: 4px 11px;
          border-radius: 8px;
          border: 1px solid;
          white-space: nowrap;
          flex-shrink: 0;
        }
        .ra-pulse-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          display: inline-block;
          animation: raPulseDot 1.5s ease-in-out infinite;
        }
        @keyframes raPulseDot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%      { opacity: 0.4; transform: scale(0.7); }
        }

        /* Impact bar */
        .ra-impact-row {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-top: 2px;
        }
        .ra-impact-label {
          font-size: 10px;
          font-weight: 700;
          color: #8a9a70;
          text-transform: uppercase;
          letter-spacing: 0.3px;
          width: 42px;
          flex-shrink: 0;
        }
        .ra-impact-track {
          flex: 1;
          height: 5px;
          background: #FAF6E9;
          border-radius: 4px;
          overflow: hidden;
        }
        .ra-impact-fill {
          height: 100%;
          border-radius: 4px;
          transition: width 0.8s cubic-bezier(0.22,1,0.36,1);
        }
        .ra-impact-val {
          font-size: 11px;
          font-weight: 700;
          color: #4a5a30;
          width: 30px;
          text-align: right;
          flex-shrink: 0;
        }

        /* Footer */
        .ra-alert-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 4px;
        }
        .ra-alert-meta {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 11px;
          color: #8a9a70;
          font-weight: 500;
        }
        .ra-view-btn {
          display: flex;
          align-items: center;
          gap: 5px;
          background: none;
          border: none;
          color: #8a9a70;
          font-size: 12px;
          font-weight: 700;
          font-family: inherit;
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 8px;
          transition: all 0.2s ease;
        }
        .ra-view-btn:hover {
          color: #1a2010;
          background: rgba(160,200,120,0.1);
        }

        /* ── Detail Modal ── */
        .ra-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(26,32,16,0.4);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          animation: raFadeIn 0.25s ease-out;
        }
        @keyframes raFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }

        .ra-modal {
          background: rgba(255,255,255,0.30);
          backdrop-filter: blur(28px);
          -webkit-backdrop-filter: blur(28px);
          border: 1px solid rgba(255,255,255,0.60);
          border-radius: 22px;
          padding: 32px;
          max-width: 520px;
          width: 90%;
          box-shadow: 0 24px 80px rgba(26,32,16,0.15), inset 0 1.5px 0 rgba(255,255,255,0.9), inset 0 -1px 0 rgba(160,200,120,0.08);
          position: relative;
          animation: raModalPop 0.35s cubic-bezier(0.22,1,0.36,1);
        }
        @keyframes raModalPop {
          from { opacity: 0; transform: scale(0.92) translateY(20px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }

        .ra-modal-close {
          position: absolute;
          top: 16px;
          right: 16px;
          width: 34px;
          height: 34px;
          border-radius: 50%;
          border: 1px solid rgba(160,200,120,0.2);
          background: transparent;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #8a9a70;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .ra-modal-close:hover {
          background: #fef2f2;
          border-color: #fecaca;
          color: #dc2626;
        }

        .ra-modal-header {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 18px;
        }
        .ra-modal-icon {
          width: 52px !important;
          height: 52px !important;
          border-radius: 14px !important;
        }
        .ra-modal-title {
          font-size: 18px;
          font-weight: 900;
          color: #1a2010;
          margin-top: 8px;
          line-height: 1.3;
          letter-spacing: -0.3px;
        }
        .ra-modal-body {
          font-size: 14px;
          color: #4a5a30;
          line-height: 1.7;
          margin-bottom: 20px;
        }
        .ra-modal-meta-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
          margin-bottom: 20px;
        }
        .ra-modal-meta-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
          background: rgba(255,255,255,0.22);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255,255,255,0.55);
          box-shadow: inset 0 1.5px 0 rgba(255,255,255,0.85);
          padding: 12px 16px;
          border-radius: 12px;
        }
        .ra-modal-meta-label {
          font-size: 10px;
          font-weight: 700;
          color: #8a9a70;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .ra-modal-meta-val {
          font-size: 14px;
          font-weight: 700;
          color: #1a2010;
        }
        .ra-modal-impact-bar {
          margin-top: 4px;
        }

        /* ── Responsive ── */
        @media (max-width: 768px) {
          .ra-stats-row {
            grid-template-columns: 1fr 1fr;
          }
          .ra-filters {
            flex-wrap: wrap;
          }
          .ra-alert-content {
            flex-direction: column;
          }
          .ra-modal-meta-row {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default Alerts;
