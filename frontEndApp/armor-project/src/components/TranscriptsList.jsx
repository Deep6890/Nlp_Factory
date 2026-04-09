import React, { useState } from 'react';
import { Search, ChevronRight, Plus, X, Clock, Users, Bell } from 'lucide-react';
import { useData } from '../context/DataContext';

const SENT_STYLE = {
  positive: { bg:'rgba(90,158,47,0.1)',  color:'var(--green)',        border:'var(--green-border)' },
  negative: { bg:'rgba(220,38,38,0.08)', color:'var(--accent-red)',   border:'rgba(220,38,38,0.2)' },
  neutral:  { bg:'var(--bg-subtle)',     color:'var(--text-muted)',   border:'var(--border)' },
  mixed:    { bg:'rgba(124,58,237,0.08)',color:'var(--accent-purple)',border:'rgba(124,58,237,0.2)' },
};
const RISK_STYLE = {
  low:    { bg:'rgba(90,158,47,0.08)',  color:'var(--green)',        border:'var(--green-border)' },
  medium: { bg:'rgba(217,119,6,0.08)', color:'var(--accent-amber)', border:'rgba(217,119,6,0.2)' },
  high:   { bg:'rgba(220,38,38,0.08)', color:'var(--accent-red)',   border:'rgba(220,38,38,0.2)' },
};

const getRiskLevel = score => score > 60 ? 'high' : score > 35 ? 'medium' : 'low';

const TranscriptsList = ({ onSelect }) => {
  const { transcripts, isLoading } = useData();
  const [search, setSearch]           = useState('');
  const [sentFilter, setSentFilter]   = useState('All');
  const [riskFilter, setRiskFilter]   = useState('All');
  const [reminderFilter, setReminderFilter] = useState(false);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newText, setNewText]         = useState('');

  const filtered = transcripts.filter(t => {
    const q = search.toLowerCase();
    const matchQ = !q || (t._id||'').toLowerCase().includes(q) ||
      (t.text||'').toLowerCase().includes(q);
    const matchS = sentFilter==='All' || (t.insights?.sentiment_label||'neutral')===sentFilter.toLowerCase();
    const matchR = riskFilter==='All' || getRiskLevel(t.insights?.risk_level==='high'?80:t.insights?.risk_level==='medium'?50:20)===riskFilter.toLowerCase();
    const matchRem = !reminderFilter;
    return matchQ && matchS && matchR && matchRem;
  });

  const chipStyle = active => ({
    padding:'6px 14px', borderRadius:20, fontSize:12, fontWeight:700, cursor:'pointer',
    background: active ? 'var(--green-bg)' : 'var(--bg-subtle)',
    color:      active ? 'var(--green)'    : 'var(--text-muted)',
    border:`1px solid ${active ? 'var(--green-border)' : 'var(--border)'}`,
    transition:'all 0.18s',
  });

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20, color:'var(--text-primary)' }}>

      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={{ fontSize:'clamp(22px,3vw,28px)', fontWeight:900, letterSpacing:-0.8, margin:0 }}>Transcripts</h1>
          <p style={{ fontSize:13, color:'var(--text-muted)', marginTop:4, margin:0 }}>All analysed conversation sessions</p>
        </div>
        <button onClick={() => setShowNewForm(true)}
          style={{ display:'flex', alignItems:'center', gap:6, fontSize:13, fontWeight:700, color:'var(--text-inverse)', background:'var(--green)', border:'none', borderRadius:12, padding:'9px 18px', cursor:'pointer' }}>
          <Plus size={15} /> New Transcript
        </button>
      </div>

      {/* New Transcript form */}
      {showNewForm && (
        <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:18, padding:'22px 24px', position:'relative' }}>
          <button onClick={() => setShowNewForm(false)}
            style={{ position:'absolute', top:16, right:16, background:'var(--bg-subtle)', border:'1px solid var(--border)', borderRadius:'50%', width:30, height:30, display:'flex', alignItems:'center', justifyContent:'center', color:'var(--text-muted)', cursor:'pointer' }}>
            <X size={15} />
          </button>
          <div style={{ fontSize:14, fontWeight:800, color:'var(--text-primary)', marginBottom:14 }}>New Transcript</div>
          <textarea value={newText} onChange={e => setNewText(e.target.value)}
            placeholder="Paste raw conversation transcript here… Speaker: text format preferred."
            style={{ width:'100%', minHeight:120, background:'var(--bg-input)', border:'1px solid var(--border)', borderRadius:12, padding:'12px 16px', color:'var(--text-primary)', fontSize:13, fontFamily:'inherit', resize:'vertical', outline:'none', boxSizing:'border-box' }} />
          <div style={{ display:'flex', gap:10, marginTop:14 }}>
            <button style={{ flex:1, padding:'10px', background:'var(--green)', color:'var(--text-inverse)', border:'none', borderRadius:12, fontWeight:700, fontSize:13, cursor:'pointer' }}
              onClick={() => { alert('NLP pipeline integration coming soon!'); setShowNewForm(false); }}>
              Run NLP Pipeline
            </button>
            <button onClick={() => setShowNewForm(false)}
              style={{ padding:'10px 20px', background:'var(--bg-subtle)', color:'var(--text-secondary)', border:'1px solid var(--border)', borderRadius:12, fontWeight:700, fontSize:13, cursor:'pointer' }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div style={{ display:'flex', gap:8, flexWrap:'wrap', alignItems:'center' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:14, padding:'7px 14px', flex:'1 1 200px', minWidth:180 }}>
          <Search size={14} color="var(--text-muted)" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search sessions, text…"
            style={{ border:'none', outline:'none', background:'transparent', fontSize:13, fontWeight:600, color:'var(--text-primary)', width:'100%' }} />
        </div>
        <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
          {['All','Positive','Negative','Neutral'].map(s => (
            <button key={s} onClick={() => setSentFilter(s)} style={chipStyle(sentFilter===s)}>{s}</button>
          ))}
        </div>
        <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
          {['All','Low','Medium','High'].map(r => (
            <button key={r} onClick={() => setRiskFilter(r)} style={chipStyle(riskFilter===r)}>Risk: {r}</button>
          ))}
        </div>
        <button onClick={() => setReminderFilter(f => !f)} style={{ ...chipStyle(reminderFilter), display:'flex', alignItems:'center', gap:5 }}>
          <Bell size={12} /> Has Reminders
        </button>
      </div>

      {/* Table */}
      {isLoading ? (
        <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:18, padding:'40px', textAlign:'center', color:'var(--text-muted)' }}>
          Loading transcripts…
        </div>
      ) : (
        <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:18, overflow:'hidden', boxShadow:'var(--shadow-sm)' }}>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', minWidth:700 }}>
              <thead>
                <tr style={{ background:'var(--bg-subtle)', borderBottom:'1px solid var(--border)' }}>
                  {['Session','Date','Language','Sentiment','Risk','Summary',''].map(h => (
                    <th key={h} style={{ padding:'12px 16px', fontSize:10, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.5px', textAlign:'left', whiteSpace:'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} style={{ padding:'40px', textAlign:'center', color:'var(--text-muted)', fontSize:13, fontWeight:600 }}>No transcripts match your filters.</td></tr>
                ) : filtered.map(t => {
                  const sl = (t.insights?.sentiment_label||'neutral').toLowerCase();
                  const rl = (t.insights?.risk_level||'low').toLowerCase();
                  const ss = SENT_STYLE[sl] || SENT_STYLE.neutral;
                  const rs = RISK_STYLE[rl] || RISK_STYLE.low;
                  return (
                    <tr key={t._id} onClick={() => onSelect && onSelect(t._id)}
                      style={{ borderBottom:'1px solid var(--border)', cursor:'pointer', transition:'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background='var(--bg-subtle)'}
                      onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                      <td style={{ padding:'12px 16px' }}>
                        <div style={{ fontSize:12, fontWeight:700, color:'var(--text-primary)' }}>{t._id?.slice(0,12)||'—'}</div>
                        <div style={{ fontSize:10, color:'var(--text-muted)', marginTop:2 }}>{t.recordingId?.slice(0,8)||'—'}</div>
                      </td>
                      <td style={{ padding:'12px 16px' }}>
                        <div style={{ fontSize:12, fontWeight:600, color:'var(--text-secondary)', display:'flex', alignItems:'center', gap:4 }}>
                          <Clock size={11} color="var(--text-muted)" />
                          {t.createdAt ? new Date(t.createdAt).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'2-digit'}) : '—'}
                        </div>
                      </td>
                      <td style={{ padding:'12px 16px' }}>
                        <div style={{ fontSize:12, fontWeight:600, color:'var(--text-secondary)', display:'flex', alignItems:'center', gap:4 }}>
                          <Users size={11} color="var(--text-muted)" />
                          {(t.language||'—').toUpperCase()}
                        </div>
                      </td>
                      <td style={{ padding:'12px 16px' }}>
                        <span style={{ fontSize:10, fontWeight:800, background:ss.bg, color:ss.color, border:`1px solid ${ss.border}`, borderRadius:8, padding:'3px 9px', textTransform:'capitalize' }}>{sl}</span>
                      </td>
                      <td style={{ padding:'12px 16px' }}>
                        <span style={{ fontSize:10, fontWeight:800, background:rs.bg, color:rs.color, border:`1px solid ${rs.border}`, borderRadius:8, padding:'3px 9px', textTransform:'uppercase' }}>{rl}</span>
                      </td>
                      <td style={{ padding:'12px 16px' }}>
                        <div style={{ fontSize:11, color:'var(--text-muted)', maxWidth:180, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                          {t.insights?.summary || t.summary || '—'}
                        </div>
                      </td>
                      <td style={{ padding:'12px 16px', textAlign:'right' }}>
                        <ChevronRight size={15} color="var(--text-muted)" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default TranscriptsList;
