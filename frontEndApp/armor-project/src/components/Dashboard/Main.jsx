import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, Shield, Sparkles, FileText } from 'lucide-react';
import { getDashboardStats } from '../../api/users';
import './Main.css';

/* ── Animated counter ── */
const Counter = ({ target, suffix = '' }) => {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!target) return;
    let n = 0;
    const step = Math.ceil(target / 40);
    const id = setInterval(() => {
      n += step;
      if (n >= target) { setVal(target); clearInterval(id); }
      else setVal(n);
    }, 30);
    return () => clearInterval(id);
  }, [target]);
  return <>{val.toLocaleString()}{suffix}</>;
};

const Main = () => {
  const navigate = useNavigate();
  const [micPulse, setMicPulse] = useState(false);
  const [stats, setStats]       = useState(null);

  useEffect(() => {
    getDashboardStats()
      .then((data) => setStats(data.stats ?? data))
      .catch(() => setStats(null)); // silently fallback — UI still renders
  }, []);

  // Use real stat if available, otherwise fallback to 0
  const totalRecordings = stats?.totalRecordings ?? 0;
  const highRiskCount   = stats?.highRiskCount   ?? 0;
  const financeCount    = stats?.financeCount     ?? 0;

  return (
    <div className="bento-dashboard">

      {/* ═══════════ BENTO GRID ═══════════ */}
      <div className="bento-grid">

        {/* ─── A: Tagline Card (top-left, tall) ─── */}
        <div className="bento-card bento-a">
          <div className="bento-card-icon-sm bento-icon-accent">
            <Shield size={18} />
          </div>
          <h2 className="bento-tagline">
            Smart<br />Finance,<br />Instantly
          </h2>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8, justifyContent: 'center', margin: '14px 0' }}>
            <p style={{ fontSize: 13, color: '#8a9a70', lineHeight: 1.5, fontWeight: 500, margin: 0 }}>
              Continuous AI monitoring intercepts hidden fees, EMI risks, and bad investments before they happen.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10 }}>
               <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#A0C878', boxShadow: '0 0 8px rgba(160,200,120,0.6)' }}></span>
               <span style={{ fontSize: 11, fontWeight: 800, color: '#4A7C3F', letterSpacing: 0.5, textTransform: 'uppercase' }}>System Active</span>
            </div>
          </div>

          <div className="bento-tag-row">
            <span className="bento-tag-pill">🌿 AI-Powered</span>
            <span className="bento-tag-sub">Real-time protection</span>
          </div>
        </div>

        {/* ─── B: HERO — Center card (2 col × 2 row) with MIC ─── */}
        <div className="bento-card bento-b" onClick={() => navigate('/dashboard/live')}>
          <div className="bento-b-glow1" />
          <div className="bento-b-glow2" />
          <div className="bento-b-grid-dots" />

          <div className="bento-b-header">
            <span className="bento-b-brand">🌿 Armor.ai</span>
          </div>

          <h2 className="bento-b-title">
            AI-Powered<br />Finance Guard.
          </h2>

          {/* ── Central Orb ── */}
          <div className="bento-orb-area">
            <div
              className={`bento-orb ${micPulse ? 'is-pulsing' : ''}`}
              onMouseEnter={() => setMicPulse(true)}
              onMouseLeave={() => setMicPulse(false)}
              onClick={(e) => { e.stopPropagation(); navigate('/dashboard/live'); }}
            >
              <div className="bento-orb-ring bento-orb-ring-outer" />
              <svg className="bento-orb-data-ring" viewBox="0 0 300 300">
                <defs>
                  <path id="dataPath" d="M 150,150 m -120,0 a 120,120 0 1,1 240,0 a 120,120 0 1,1 -240,0" fill="none" />
                </defs>
                <text className="bento-orb-data-text">
                  <textPath href="#dataPath" startOffset="0%">
                    0100 1001 1010 1000 0010 1010 0010 1111 1010 0100 1001 1010 1000 0010 1010 0010 1111 1010 0100
                  </textPath>
                </text>
              </svg>
              <div className="bento-orb-ring bento-orb-ring-mid" />
              <div className="bento-orb-inner">
                <div className="bento-orb-glow" />
                <div className="bento-orb-mic">
                  <Mic size={36} />
                </div>
              </div>
              <div className="bento-orb-dot bento-orb-dot-1" />
              <div className="bento-orb-dot bento-orb-dot-2" />
              <div className="bento-orb-dot bento-orb-dot-3" />
              <div className="bento-orb-dot bento-orb-dot-4" />
            </div>
            <p className="bento-mic-label">Tap to start live session</p>
          </div>
        </div>

        {/* ─── C: Toggle/Action card (top-right small) ─── */}
        <div className="bento-card bento-c" onClick={() => navigate('/dashboard/settings')} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
            <div className="bento-toggle-track">
              <div className="bento-toggle-thumb">
                <Sparkles size={14} />
              </div>
            </div>
            <span className="bento-c-label">AI Shield Active</span>
          </div>
          <div style={{ marginTop: 20, textAlign: 'center', padding: '0 8px' }}>
            <p style={{ fontSize: 12, color: '#8a9a70', lineHeight: 1.45, margin: 0, fontWeight: 500 }}>
              All incoming data streams are secured and encrypted.
            </p>
          </div>
        </div>

        {/* ─── D: Big Stat — Sessions Analyzed ─── */}
        <div className="bento-card bento-d" onClick={() => navigate('/dashboard/insights')} style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="bento-big-num">
            <Counter target={totalRecordings || 0} suffix={totalRecordings >= 1000 ? 'K+' : ''} />
          </div>
          <div className="bento-stat-pill">
            <span>sessions analyzed</span>
          </div>

          {/* Mini insight stats */}
          {(financeCount > 0 || highRiskCount > 0) && (
            <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
              {financeCount > 0 && (
                <span style={{ fontSize: 10, fontWeight: 800, background: '#DDEB9D', color: '#4a5a30', border: '1px solid #A0C878', borderRadius: 7, padding: '2px 8px' }}>
                  💰 {financeCount} finance
                </span>
              )}
              {highRiskCount > 0 && (
                <span style={{ fontSize: 10, fontWeight: 800, background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 7, padding: '2px 8px' }}>
                  ⚠ {highRiskCount} high risk
                </span>
              )}
            </div>
          )}

          {/* Filler Mini-Chart */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', width: '100%', marginTop: 28, minHeight: 45 }}>
            <div style={{ width: '100%', height: '100%', position: 'relative', borderBottom: '1.5px solid rgba(160,200,120,0.2)' }}>
              <div style={{ position: 'absolute', bottom: 0, left: '4%', width: '14%', height: '40%', background: 'rgba(160,200,120,0.3)', borderRadius: '4px 4px 0 0' }} />
              <div style={{ position: 'absolute', bottom: 0, left: '23%', width: '14%', height: '60%', background: 'rgba(160,200,120,0.4)', borderRadius: '4px 4px 0 0' }} />
              <div style={{ position: 'absolute', bottom: 0, left: '42%', width: '14%', height: '35%', background: 'rgba(160,200,120,0.35)', borderRadius: '4px 4px 0 0' }} />
              <div style={{ position: 'absolute', bottom: 0, left: '61%', width: '14%', height: '80%', background: '#A0C878', borderRadius: '4px 4px 0 0' }} />
              <div style={{ position: 'absolute', bottom: 0, left: '80%', width: '14%', height: '95%', background: '#DDEB9D', borderRadius: '4px 4px 0 0', boxShadow: '0 -2px 12px rgba(160,200,120,0.4)' }} />
            </div>
          </div>
        </div>

        {/* ─── H: Reports/Templates card ─── */}
        <div className="bento-card bento-h" onClick={() => navigate('/dashboard/reports')}>
          <h3 className="bento-card-title" style={{ marginBottom: 6 }}>Report templates</h3>
          <p className="bento-card-desc">Generate PDF, DOCX &amp; more.</p>

          <div className="bento-format-chips">
            <span className="bento-chip">PDF</span>
            <span className="bento-chip">DOCX</span>
            <span className="bento-chip">CSV</span>
          </div>

          <div className="bento-rewrite-badge">
            <FileText size={13} />
            <span>Rewrite</span>
            <Sparkles size={11} />
          </div>

          <div className="bento-trial-pill">
            <span>Free trial</span>
          </div>
        </div>

      </div>

    </div>
  );
};

export default Main;
