import React, { useState, useEffect } from 'react';
import {
  AlertTriangle, TrendingDown, Activity, Bell, Clock,
  Eye, Shield, Zap, CreditCard, ChevronDown, Loader2, Info,
} from 'lucide-react';
import { listTranscripts } from '../api/transcripts';
import { useNavigate } from 'react-router-dom';

const cs = { background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:16, boxShadow:'var(--shadow-sm)' };

const LEVEL = {
  HIGH: { bg:'rgba(220,38,38,0.08)',  color:'var(--accent-red)',   border:'rgba(220,38,38,0.2)',  label:'HIGH' },
  MED:  { bg:'rgba(217,119,6,0.08)',  color:'var(--accent-amber)', border:'rgba(217,119,6,0.2)',  label:'MED' },
  LOW:  { bg:'var(--green-bg)',       color:'var(--green)',        border:'var(--green-border)',  label:'LOW' },
};

const buildAlerts = (transcripts) => {
  const alerts = [];
  transcripts.forEach(t => {
    const ins = t.insights;
    if (!ins) return;
    const date = new Date(t.createdAt).toLocaleDateString('en-IN', { day:'numeric', month:'short' });
    const name = t.recordingId?.slice(0,8) || 'Session';

    if (ins.risk_level === 'high' || ins.urgency === 'high') {
      alerts.push({
        id:`${t._id}_h`, title: ins.summary || 'High risk detected',
        body: ins.english_text?.slice(0,180) || '',
        level:'HIGH', from:name, date,
        domain:ins.domain, sentiment:ins.sentiment_label, emotion:ins.emotion,
        amount:ins.amount, keywords:ins.keywords||[], recordingId:t.recordingId,
        Icon: ins.domain?.includes('loan') ? CreditCard : ins.domain?.includes('invest') ? TrendingDown : AlertTriangle,
        tip: 'High risk: urgent financial concern detected — hidden fees, bad investment, or EMI risk.',
      });
    } else if (ins.risk_level === 'medium' || ins.urgency === 'medium') {
      alerts.push({
        id:`${t._id}_m`, title: ins.summary || 'Medium risk detected',
        body: ins.english_text?.slice(0,180) || '',
        level:'MED', from:name, date,
        domain:ins.domain, sentiment:ins.sentiment_label, emotion:ins.emotion,
        amount:ins.amount, keywords:ins.keywords||[], recordingId:t.recordingId,
        Icon: Activity,
        tip: 'Medium risk: some financial concerns detected — review recommended.',
      });
    }
  });
  return alerts.sort((a,b) => a.level==='HIGH' ? -1 : 1);
};

const AlertCard = ({ alert, onView }) => {
  const [expanded, setExpanded] = useState(false);
  const lv = LEVEL[alert.level] || LEVEL.LOW;

  return (
    <div style={{ ...cs, overflow:'hidden', transition:'border-color 0.2s, box-shadow 0.2s' }}
      onMouseEnter={e => { e.currentTarget.style.borderColor='var(--border-hover)'; e.currentTarget.style.boxShadow='var(--shadow-md)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.boxShadow='var(--shadow-sm)'; }}>

      <div style={{ padding:'16px 20px', display:'flex', alignItems:'flex-start', gap:14 }}>
        <div style={{ width:40, height:40, borderRadius:11, background:lv.bg, border:`1px solid ${lv.border}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
          <alert.Icon size={17} color={lv.color} />
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:5, flexWrap:'wrap' }}>
            <span style={{ fontSize:13, fontWeight:700, color:'var(--text-primary)' }}>{alert.title}</span>
            <span style={{ fontSize:10, fontWeight:800, background:lv.bg, color:lv.color, border:`1px solid ${lv.border}`, borderRadius:6, padding:'2px 8px' }}>{lv.label}</span>
            {alert.tip && <span title={alert.tip} style={{ cursor:'help', opacity:0.4 }}><Info size={11} /></span>}
          </div>
          <div style={{ fontSize:11, color:'var(--text-muted)', display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
            <span style={{ display:'flex', alignItems:'center', gap:4 }}><Clock size={10} /> {alert.date}</span>
            {alert.domain && (
              <span style={{ background:'var(--bg-subtle)', border:'1px solid var(--border)', borderRadius:6, padding:'1px 7px', fontWeight:600, textTransform:'capitalize' }}>
                {alert.domain.replace(/_/g,' ')}
              </span>
            )}
            {alert.sentiment && (
              <span style={{ fontWeight:600, color: alert.sentiment==='positive' ? 'var(--green)' : alert.sentiment==='negative' ? 'var(--accent-red)' : 'var(--text-muted)' }}>
                {alert.sentiment}
              </span>
            )}
            {alert.amount && <span style={{ fontWeight:700, color:'var(--green)' }}>₹{alert.amount}</span>}
          </div>
        </div>
        <div style={{ display:'flex', gap:6, flexShrink:0 }}>
          {alert.recordingId && (
            <button onClick={() => onView(alert.recordingId)} title="View session"
              style={{ width:30, height:30, borderRadius:8, border:'1px solid var(--border)', background:'var(--bg-subtle)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--text-secondary)' }}>
              <Eye size={13} />
            </button>
          )}
          <button onClick={() => setExpanded(e => !e)}
            style={{ width:30, height:30, borderRadius:8, border:'1px solid var(--border)', background:'var(--bg-subtle)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--text-secondary)', transition:'transform 0.2s', transform: expanded ? 'rotate(180deg)' : '' }}>
            <ChevronDown size={13} />
          </button>
        </div>
      </div>

      {expanded && (
        <div style={{ padding:'0 20px 16px', borderTop:'1px solid var(--border)', paddingTop:14 }}>
          {alert.body && <p style={{ fontSize:12, color:'var(--text-secondary)', lineHeight:1.7, margin:'0 0 10px' }}>{alert.body}</p>}
          {alert.keywords?.length > 0 && (
            <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
              {alert.keywords.slice(0,8).map(k => (
                <span key={k} style={{ fontSize:11, fontWeight:600, background:'var(--green-bg)', color:'var(--green)', border:'1px solid var(--green-border)', borderRadius:6, padding:'2px 8px' }}>{k}</span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const Alerts = () => {
  const navigate = useNavigate();
  const [alerts, setAlerts]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState('All');

  useEffect(() => {
    listTranscripts({ limit:100 })
      .then(res => setAlerts(buildAlerts(res.transcripts || [])))
      .catch(() => setAlerts([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered   = filter==='All' ? alerts : alerts.filter(a => a.level===filter);
  const highCount  = alerts.filter(a => a.level==='HIGH').length;
  const medCount   = alerts.filter(a => a.level==='MED').length;

  const tabBtn = (f, label) => (
    <button key={f} onClick={() => setFilter(f)}
      style={{ padding:'7px 14px', borderRadius:9, fontSize:12, fontWeight:700, cursor:'pointer', border:'1px solid', transition:'all 0.15s',
        background: filter===f ? 'var(--green-bg)' : 'var(--bg-subtle)',
        color:      filter===f ? 'var(--green)'    : 'var(--text-muted)',
        borderColor:filter===f ? 'var(--green-border)' : 'var(--border)',
      }}>{label}</button>
  );

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20, color:'var(--text-primary)' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      <div>
        <h1 style={{ fontSize:'clamp(20px,3vw,26px)', fontWeight:900, letterSpacing:-0.8, margin:0 }}>Risk Alerts</h1>
        <p style={{ fontSize:13, color:'var(--text-muted)', margin:'4px 0 0' }}>
          AI-detected financial risks — click any alert to expand details, or view the full session
        </p>
      </div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 }}>
        {[
          { icon:Bell,          label:'Total Alerts', value:alerts.length, color:'var(--text-primary)' },
          { icon:AlertTriangle, label:'High Risk',    value:highCount,     color:'var(--accent-red)' },
          { icon:Zap,           label:'Medium Risk',  value:medCount,      color:'var(--accent-amber)' },
        ].map((s,i) => (
          <div key={i} style={{ ...cs, padding:'16px 20px', display:'flex', alignItems:'center', gap:14 }}>
            <div style={{ width:36, height:36, borderRadius:10, background:`${s.color}18`, border:`1px solid ${s.color}30`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <s.icon size={16} color={s.color} />
            </div>
            <div>
              <div style={{ fontSize:24, fontWeight:900, color:s.color, letterSpacing:-1 }}>{s.value}</div>
              <div style={{ fontSize:11, color:'var(--text-muted)', fontWeight:600 }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* What do these mean? */}
      <div style={{ background:'var(--bg-subtle)', border:'1px solid var(--border)', borderRadius:12, padding:'12px 18px', display:'flex', flexWrap:'wrap', gap:16 }}>
        <span style={{ fontSize:11, fontWeight:700, color:'var(--text-muted)', display:'flex', alignItems:'center', gap:5 }}>
          <Info size={12} color="var(--green)" /> Alert guide:
        </span>
        {[
          ['HIGH', 'Urgent — hidden fees, bad investment, or EMI risk detected'],
          ['MED',  'Moderate — some financial concerns, review recommended'],
        ].map(([k,v]) => (
          <span key={k} style={{ fontSize:11, color:'var(--text-muted)' }}>
            <strong style={{ color:'var(--text-secondary)' }}>{k}</strong> — {v}
          </span>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display:'flex', gap:8 }}>
        {tabBtn('All',  `All Alerts (${alerts.length})`)}
        {tabBtn('HIGH', `High Risk (${highCount})`)}
        {tabBtn('MED',  `Medium Risk (${medCount})`)}
      </div>

      {/* List */}
      {loading ? (
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:48, gap:10, color:'var(--text-muted)' }}>
          <Loader2 size={18} style={{ animation:'spin 1s linear infinite' }} />
          <span style={{ fontSize:13, fontWeight:600 }}>Loading alerts...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ ...cs, padding:'48px 20px', textAlign:'center' }}>
          <Shield size={32} color="var(--green)" style={{ marginBottom:12 }} />
          <div style={{ fontSize:15, fontWeight:700, color:'var(--text-primary)', marginBottom:6 }}>No alerts</div>
          <div style={{ fontSize:13, color:'var(--text-muted)' }}>No {filter!=='All' ? filter.toLowerCase()+' risk' : ''} alerts detected in your sessions</div>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {filtered.map(a => <AlertCard key={a.id} alert={a} onView={id => navigate(`/dashboard/sessions/${id}`)} />)}
        </div>
      )}
    </div>
  );
};

export default Alerts;


