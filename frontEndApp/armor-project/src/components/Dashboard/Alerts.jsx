import React, { useState, useEffect } from 'react';
<<<<<<< HEAD
import { AlertTriangle, Wallet, TrendingDown, Activity, Filter, Bell, X, Clock, Eye, ArrowRight, Shield, Zap, CreditCard } from 'lucide-react';
import { listTranscripts } from '../../api/transcripts';
import { DUMMY_SESSIONS } from '../../data/dummyData';

const C = { cream2: '#FAF6E9', limelt: '#DDEB9D', green: '#A0C878', greendk: '#7aaa52', text: '#1a2010', textmid: '#4a5a30', textdim: '#8a9a70', shadow: 'rgba(100,140,60,0.11)' };

// Build alerts from pipeline insights
const buildAlerts = (sessions) => {
  const alerts = [];
  sessions.forEach(s => {
    const ins = s.transcript?.insights;
    if (!ins) return;
    const date = new Date(s.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    const name = s.filename || s.name || 'Session';

    if (ins.risk_level === 'high' || ins.urgency === 'high') {
      alerts.push({
        id: `${s._id}_risk`,
        title: ins.summary || 'High risk detected',
        body: ins.english_text?.slice(0, 120) + '…' || '',
        level: 'HIGH',
        category: ins.domain?.includes('loan') ? 'Loan Risk' : ins.domain?.includes('invest') ? 'Investment Risk' : 'Finance Risk',
        from: name,
        date,
        impact: ins.risk_level === 'high' ? 82 : 65,
        Icon: ins.domain?.includes('loan') ? CreditCard : ins.domain?.includes('invest') ? TrendingDown : AlertTriangle,
        iconBg: '#fef2f2', iconColor: '#dc2626',
        levelBg: '#fef2f2', levelColor: '#dc2626', levelBorder: '#fecaca',
        domain: ins.domain,
        sentiment: ins.sentiment_label,
        emotion: ins.emotion,
        amount: ins.amount,
        keywords: ins.keywords || [],
      });
    } else if (ins.risk_level === 'medium' || ins.urgency === 'medium') {
      alerts.push({
        id: `${s._id}_med`,
        title: ins.summary || 'Medium risk detected',
        body: ins.english_text?.slice(0, 120) + '…' || '',
        level: 'MED',
        category: ins.domain?.includes('invest') ? 'Investment Risk' : 'Savings Risk',
        from: name,
        date,
        impact: 45,
        Icon: ins.domain?.includes('invest') ? Wallet : Activity,
        iconBg: '#fefce8', iconColor: '#92400e',
        levelBg: '#fefce8', levelColor: '#92400e', levelBorder: '#fde68a',
        domain: ins.domain,
        sentiment: ins.sentiment_label,
        emotion: ins.emotion,
        amount: ins.amount,
        keywords: ins.keywords || [],
      });
    }
  });
  return alerts;
};

const DUMMY_ALERTS = buildAlerts(DUMMY_SESSIONS);
const CATEGORIES = ['All', 'Loan Risk', 'Investment Risk', 'Finance Risk', 'Savings Risk'];

const Alerts = () => {
  const [alerts, setAlerts] = useState(DUMMY_ALERTS);
=======
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
>>>>>>> dd881948122f09248bf8bacc155ba9069e739fe3
  const [activeFilter, setActiveFilter] = useState('All');
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [animateIn, setAnimateIn] = useState(false);
  const [riskScore, setRiskScore] = useState(0);
<<<<<<< HEAD

  useEffect(() => {
    listTranscripts({ limit: 50 })
      .then(res => {
        const transcripts = res.transcripts || res.data?.transcripts || [];
        if (transcripts.length > 0) {
          const built = buildAlerts(transcripts.map(t => ({ _id: t._id, filename: t.recordingId, createdAt: t.createdAt, transcript: t })));
          if (built.length > 0) setAlerts(built);
        }
      })
      .catch(() => {});
  }, []);

=======
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
>>>>>>> dd881948122f09248bf8bacc155ba9069e739fe3
  useEffect(() => {
    const t = setTimeout(() => setAnimateIn(true), 100);
    return () => clearTimeout(t);
  }, []);

<<<<<<< HEAD
=======
  // Re-trigger animation on filter change
>>>>>>> dd881948122f09248bf8bacc155ba9069e739fe3
  useEffect(() => {
    setAnimateIn(false);
    const t = setTimeout(() => setAnimateIn(true), 50);
    return () => clearTimeout(t);
  }, [activeFilter]);

<<<<<<< HEAD
  useEffect(() => {
    const high = alerts.filter(a => a.level === 'HIGH').length;
    const med  = alerts.filter(a => a.level === 'MED').length;
    const target = Math.min(100, high * 25 + med * 12);
    if (target === 0) { setRiskScore(0); return; }
    let cur = 0;
    const id = setInterval(() => {
      cur += Math.max(target / 40, 1);
      if (cur >= target) { setRiskScore(target); clearInterval(id); }
      else setRiskScore(Math.round(cur));
    }, 30);
    return () => clearInterval(id);
  }, [alerts]);

  const filtered = activeFilter === 'All' ? alerts : alerts.filter(a => a.category === activeFilter);
  const getLevelCount = (l) => alerts.filter(a => a.level === l).length;
  const getCatCount = (c) => c === 'All' ? alerts.length : alerts.filter(a => a.category === c).length;

  return (
    <div style={{ fontFamily: 'Inter,sans-serif', display: 'flex', flexDirection: 'column', gap: 20, color: C.text }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 'clamp(22px,3vw,30px)', fontWeight: 900, letterSpacing: -1, margin: 0 }}>Risk Alerts</h1>
          <p style={{ fontSize: 13, color: C.textdim, marginTop: 4, margin: 0 }}>Financial warnings detected from your conversations</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', padding: '7px 16px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
          <Bell size={14} /> {alerts.length} Active
        </div>
      </div>

      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 12 }}>
        {/* Risk Score Ring */}
        <div style={{ background: '#fff', border: '1px solid rgba(160,200,120,0.22)', borderRadius: 18, padding: '18px 22px', display: 'flex', alignItems: 'center', gap: 20, boxShadow: `0 2px 12px ${C.shadow}` }}>
          <div style={{ position: 'relative', width: 68, height: 68, flexShrink: 0 }}>
            <svg viewBox="0 0 80 80" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
              <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(160,200,120,0.12)" strokeWidth="5" />
              <circle cx="40" cy="40" r="34" fill="none"
                stroke={riskScore > 60 ? '#dc2626' : riskScore > 35 ? '#f59e0b' : C.greendk}
                strokeWidth="5"
                strokeDasharray={`${(riskScore / 100) * 213.6} 213.6`}
                strokeLinecap="round"
                style={{ transition: 'stroke-dasharray 1.2s cubic-bezier(0.22,1,0.36,1)' }}
              />
            </svg>
            <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 900, color: C.text }}>{riskScore}</span>
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: C.text }}>Risk Score</div>
            <div style={{ fontSize: 12, color: C.textdim, marginTop: 2 }}>Overall financial risk level</div>
          </div>
        </div>
        {[
          { dot: '#dc2626', count: getLevelCount('HIGH'), label: 'High Priority', pulse: true },
          { dot: '#f59e0b', count: getLevelCount('MED'),  label: 'Medium Priority' },
          { dot: C.greendk, count: alerts.filter(a => a.level === 'LOW').length, label: 'Low Priority' },
        ].map(({ dot, count, label, pulse }) => (
          <div key={label} style={{ background: '#fff', border: '1px solid rgba(160,200,120,0.22)', borderRadius: 18, padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 14, boxShadow: `0 2px 12px ${C.shadow}` }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: dot, flexShrink: 0, boxShadow: `0 0 0 3px ${dot}22`, animation: pulse ? 'dotPulse 2s ease-in-out infinite' : 'none' }} />
            <div>
              <div style={{ fontSize: 22, fontWeight: 900, color: C.text }}>{count}</div>
              <div style={{ fontSize: 11, color: C.textdim, fontWeight: 600 }}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <Filter size={14} color={C.textdim} />
        {CATEGORIES.map(cat => (
          <button key={cat} onClick={() => setActiveFilter(cat)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 16px', borderRadius: 12, fontSize: 12, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', transition: 'all 0.2s', background: activeFilter === cat ? C.limelt : '#fff', color: activeFilter === cat ? C.text : C.textdim, border: `1px solid ${activeFilter === cat ? C.green : 'rgba(160,200,120,0.22)'}` }}>
            {cat}
            <span style={{ fontSize: 10, fontWeight: 800, background: 'rgba(0,0,0,0.06)', padding: '1px 6px', borderRadius: 6 }}>{getCatCount(cat)}</span>
=======
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
>>>>>>> dd881948122f09248bf8bacc155ba9069e739fe3
          </button>
        ))}
      </div>

      {/* Alert Cards */}
<<<<<<< HEAD
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filtered.length === 0 && (
          <div style={{ padding: '40px 0', textAlign: 'center', color: C.textdim, fontWeight: 600, background: '#fff', borderRadius: 20, border: '1px dashed rgba(160,200,120,0.3)' }}>
            No alerts in this category.
          </div>
        )}
        {filtered.map((alert, i) => (
          <div key={alert.id}
            onClick={() => setSelectedAlert(alert)}
            style={{ background: '#fff', border: '1px solid rgba(160,200,120,0.18)', borderRadius: 18, overflow: 'hidden', display: 'flex', cursor: 'pointer', opacity: animateIn ? 1 : 0, transform: animateIn ? 'translateY(0)' : 'translateY(16px)', transition: `all 0.4s cubic-bezier(0.22,1,0.36,1) ${i * 0.07}s`, boxShadow: '0 2px 12px rgba(100,140,60,0.05)' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 12px 36px rgba(100,140,60,0.1)'; e.currentTarget.style.borderColor = 'rgba(160,200,120,0.35)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 2px 12px rgba(100,140,60,0.05)'; e.currentTarget.style.borderColor = 'rgba(160,200,120,0.18)'; }}>
            {/* Stripe */}
            <div style={{ width: 4, flexShrink: 0, background: alert.level === 'HIGH' ? 'linear-gradient(180deg,#dc2626,#f87171)' : alert.level === 'MED' ? 'linear-gradient(180deg,#f59e0b,#fbbf24)' : `linear-gradient(180deg,${C.greendk},${C.green})` }} />
            <div style={{ flex: 1, display: 'flex', gap: 14, padding: '16px 20px', alignItems: 'flex-start' }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: alert.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <alert.Icon size={17} color={alert.iconColor} />
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 7 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                  <h4 style={{ fontSize: 14, fontWeight: 800, color: C.text, lineHeight: 1.3, margin: 0 }}>{alert.title}</h4>
                  <span style={{ fontSize: 10, fontWeight: 800, padding: '3px 10px', borderRadius: 8, border: '1px solid', background: alert.levelBg, color: alert.levelColor, borderColor: alert.levelBorder, whiteSpace: 'nowrap', flexShrink: 0 }}>
                    {alert.level === 'HIGH' && <span style={{ width: 6, height: 6, borderRadius: '50%', background: alert.levelColor, display: 'inline-block', marginRight: 4, animation: 'dotPulse 1.5s ease-in-out infinite' }} />}
                    {alert.level}
                  </span>
                </div>
                <p style={{ fontSize: 12, color: C.textmid, lineHeight: 1.6, margin: 0 }}>{alert.body}</p>
                {/* Impact bar */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: C.textdim, textTransform: 'uppercase', width: 42 }}>Impact</span>
                  <div style={{ flex: 1, height: 5, background: '#FAF6E9', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: 4, width: `${alert.impact}%`, background: alert.impact > 60 ? '#dc2626' : alert.impact > 35 ? '#f59e0b' : C.greendk, transition: 'width 0.8s cubic-bezier(0.22,1,0.36,1)' }} />
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: C.textmid, width: 30, textAlign: 'right' }}>{alert.impact}%</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 11, color: C.textdim, display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={10} />{alert.from} · {alert.date}</span>
                  <button style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', color: C.textdim, fontSize: 12, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', padding: '3px 8px', borderRadius: 8 }}
                    onMouseEnter={e => { e.currentTarget.style.color = C.text; e.currentTarget.style.background = 'rgba(160,200,120,0.1)'; }}
                    onMouseLeave={e => { e.currentTarget.style.color = C.textdim; e.currentTarget.style.background = 'none'; }}>
                    <Eye size={12} /> View Details <ArrowRight size={12} />
=======
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
>>>>>>> dd881948122f09248bf8bacc155ba9069e739fe3
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Detail Modal */}
      {selectedAlert && (
<<<<<<< HEAD
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(26,32,16,0.45)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          onClick={() => setSelectedAlert(null)}>
          <div style={{ background: '#fff', borderRadius: 22, padding: 32, maxWidth: 540, width: '90%', boxShadow: '0 24px 80px rgba(26,32,16,0.2)', position: 'relative', animation: 'modalPop 0.3s cubic-bezier(0.22,1,0.36,1)' }}
            onClick={e => e.stopPropagation()}>
            <button onClick={() => setSelectedAlert(null)} style={{ position: 'absolute', top: 16, right: 16, width: 34, height: 34, borderRadius: '50%', border: '1px solid rgba(160,200,120,0.2)', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.textdim, cursor: 'pointer' }}>
              <X size={17} />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 18 }}>
              <div style={{ width: 52, height: 52, borderRadius: 14, background: selectedAlert.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <selectedAlert.Icon size={22} color={selectedAlert.iconColor} />
              </div>
              <div>
                <span style={{ fontSize: 10, fontWeight: 800, padding: '3px 10px', borderRadius: 8, border: '1px solid', background: selectedAlert.levelBg, color: selectedAlert.levelColor, borderColor: selectedAlert.levelBorder }}>{selectedAlert.level} PRIORITY</span>
                <h2 style={{ fontSize: 18, fontWeight: 900, color: C.text, marginTop: 6, letterSpacing: -0.3 }}>{selectedAlert.title}</h2>
              </div>
            </div>
            <p style={{ fontSize: 13, color: C.textmid, lineHeight: 1.7, marginBottom: 20 }}>{selectedAlert.body}</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
              {[
                { label: 'Source', value: selectedAlert.from },
                { label: 'Date', value: selectedAlert.date },
                { label: 'Domain', value: selectedAlert.domain || '—' },
                { label: 'Impact Score', value: `${selectedAlert.impact}%`, highlight: true },
                { label: 'Sentiment', value: selectedAlert.sentiment || '—' },
                { label: 'Emotion', value: selectedAlert.emotion || '—' },
                ...(selectedAlert.amount ? [{ label: 'Amount', value: `₹${Number(selectedAlert.amount).toLocaleString('en-IN')}` }] : []),
              ].map(({ label, value, highlight }) => (
                <div key={label} style={{ background: C.cream2, padding: '11px 14px', borderRadius: 12 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: C.textdim, textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 4 }}>{label}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: highlight ? '#dc2626' : C.text }}>{value}</div>
                </div>
              ))}
            </div>
            {selectedAlert.keywords?.length > 0 && (
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: C.textdim, textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 8 }}>Keywords</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {selectedAlert.keywords.map(k => (
                    <span key={k} style={{ fontSize: 11, fontWeight: 700, background: '#fff', border: '1px solid rgba(160,200,120,0.3)', borderRadius: 8, padding: '3px 10px', color: C.textmid }}>{k}</span>
                  ))}
                </div>
              </div>
            )}
=======
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
>>>>>>> dd881948122f09248bf8bacc155ba9069e739fe3
          </div>
        </div>
      )}

      <style>{`
<<<<<<< HEAD
        @keyframes dotPulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.4;transform:scale(0.7)} }
        @keyframes modalPop { from{opacity:0;transform:scale(0.92) translateY(20px)} to{opacity:1;transform:scale(1) translateY(0)} }
        @media(max-width:768px){ .ra-stats-row{grid-template-columns:1fr 1fr} }
=======
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
>>>>>>> dd881948122f09248bf8bacc155ba9069e739fe3
      `}</style>
    </div>
  );
};

export default Alerts;
