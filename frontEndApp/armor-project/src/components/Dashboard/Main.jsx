import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Mic, Shield, Sparkles, FileText,
} from 'lucide-react';
import './Main.css';

/* ── Animated counter ── */
const Counter = ({ target, suffix = '' }) => {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let n = 0; const step = Math.ceil(target / 40);
    const id = setInterval(() => { n += step; if (n >= target) { setVal(target); clearInterval(id); } else setVal(n); }, 30);
    return () => clearInterval(id);
  }, [target]);
  return <>{val.toLocaleString()}{suffix}</>;
};

const Main = () => {
  const navigate = useNavigate();
  const [micPulse, setMicPulse] = useState(false);

  const handleMicEnter = () => setMicPulse(true);
  const handleMicLeave = () => setMicPulse(false);

  return (
    <div className="bento-dashboard">

      {/* ═══════════ BENTO GRID ═══════════ */}
      <div className="bento-grid">

        {/* ─── A: Tagline Card (top-left, tall) ─── */}
        <div className="bento-card bento-a" onClick={() => navigate('/dashboard/live')}>
          <div className="bento-card-icon-sm bento-icon-accent">
            <Shield size={18} />
          </div>
          <h2 className="bento-tagline">
            Smart<br />Finance,<br />Instantly
          </h2>
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
              onMouseEnter={handleMicEnter}
              onMouseLeave={handleMicLeave}
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
        <div className="bento-card bento-c" onClick={() => navigate('/dashboard/settings')}>
          <div className="bento-toggle-track">
            <div className="bento-toggle-thumb">
              <Sparkles size={14} />
            </div>
          </div>
          <span className="bento-c-label">AI Shield Active</span>
        </div>

        {/* ─── D: Big Stat — Sessions Analyzed ─── */}
        <div className="bento-card bento-d" onClick={() => navigate('/dashboard/insights')}>
          <div className="bento-big-num"><Counter target={17} suffix="K+" /></div>
          <div className="bento-stat-pill">
            <span>sessions analyzed</span>
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
