import React, { useState, useEffect } from 'react';
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
  const [activeFilter, setActiveFilter] = useState('All');
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [animateIn, setAnimateIn] = useState(false);
  const [riskScore, setRiskScore] = useState(0);

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

  useEffect(() => {
    const t = setTimeout(() => setAnimateIn(true), 100);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    setAnimateIn(false);
    const t = setTimeout(() => setAnimateIn(true), 50);
    return () => clearTimeout(t);
  }, [activeFilter]);

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
          </button>
        ))}
      </div>

      {/* Alert Cards */}
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
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Detail Modal */}
      {selectedAlert && (
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
          </div>
        </div>
      )}

      <style>{`
        @keyframes dotPulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.4;transform:scale(0.7)} }
        @keyframes modalPop { from{opacity:0;transform:scale(0.92) translateY(20px)} to{opacity:1;transform:scale(1) translateY(0)} }
        @media(max-width:768px){ .ra-stats-row{grid-template-columns:1fr 1fr} }
      `}</style>
    </div>
  );
};

export default Alerts;
