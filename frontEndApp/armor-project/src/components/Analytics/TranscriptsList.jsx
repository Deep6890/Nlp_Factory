import React, { useState } from 'react';
import { Search, ChevronRight, Plus, X, Clock, Users, AlertTriangle, Bell } from 'lucide-react';
import { useData } from '../../context/DataContext';

const C = {
  cream2: '#FAF6E9', limelt: '#DDEB9D', green: '#A0C878', greendk: '#7aaa52',
  text: '#1a2010', textmid: '#4a5a30', textdim: '#8a9a70', shadow: 'rgba(100,140,60,0.11)',
  neg: '#dc2626', med: '#f59e0b',
};
const card = { background: '#fff', border: '1px solid rgba(160,200,120,0.22)', borderRadius: 20, padding: '22px 24px', boxShadow: `0 2px 16px ${C.shadow}` };
const SENT_STYLE = {
  positive: { bg: '#DDEB9D', color: '#4a5a30', border: '#A0C878' },
  negative: { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' },
  neutral:  { bg: '#FAF6E9', color: '#8a9a70', border: 'rgba(160,200,120,0.3)' },
  mixed:    { bg: '#f5f3ff', color: '#7c3aed', border: '#ddd6fe' },
};
const RISK_STYLE = {
  low:    { bg: '#DDEB9D', color: '#4a5a30', border: '#A0C878' },
  medium: { bg: '#fefce8', color: '#92400e', border: '#fde68a' },
  high:   { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' },
};

const getRiskLevel = (score) => score > 60 ? 'high' : score > 35 ? 'medium' : 'low';

const TranscriptsList = ({ onSelect }) => {
  const { transcripts, isLoading } = useData();
  const [search, setSearch] = useState('');
  const [sentFilter, setSentFilter] = useState('All');
  const [riskFilter, setRiskFilter] = useState('All');
  const [reminderFilter, setReminderFilter] = useState(false);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newText, setNewText] = useState('');

  const filtered = transcripts.filter(t => {
    const q = search.toLowerCase();
    const matchQ = !q || t.sessionId.toLowerCase().includes(q) ||
      t.participants.some(p => p.name.toLowerCase().includes(q)) ||
      t.transcript.some(s => s.text.toLowerCase().includes(q));
    const matchS = sentFilter === 'All' || t.summary.overallSentiment === sentFilter.toLowerCase();
    const matchR = riskFilter === 'All' || getRiskLevel(t.summary.financialRiskScore) === riskFilter.toLowerCase();
    const matchRem = !reminderFilter || t.summary.reminderCount > 0;
    return matchQ && matchS && matchR && matchRem;
  });

  const chipStyle = (active) => ({
    padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700, cursor: 'pointer',
    background: active ? C.limelt : '#fff', color: active ? C.text : C.textdim,
    border: `1px solid ${active ? C.green : 'rgba(160,200,120,0.25)'}`, transition: 'all 0.2s',
  });

  return (
    <div style={{ fontFamily: 'Inter,sans-serif', display: 'flex', flexDirection: 'column', gap: 20, color: C.text }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 'clamp(22px,3vw,30px)', fontWeight: 900, letterSpacing: -1, margin: 0 }}>Transcripts</h1>
          <p style={{ fontSize: 13, color: C.textdim, marginTop: 4, margin: 0 }}>All analysed conversation sessions</p>
        </div>
        <button onClick={() => setShowNewForm(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: C.text, background: C.limelt, border: `1px solid ${C.green}`, borderRadius: 12, padding: '9px 18px', cursor: 'pointer', transition: 'all 0.2s' }}
          onMouseEnter={e => e.currentTarget.style.background = C.green}
          onMouseLeave={e => e.currentTarget.style.background = C.limelt}>
          <Plus size={15} /> New Transcript
        </button>
      </div>

      {/* New Transcript Slide-over */}
      {showNewForm && (
        <div style={{ ...card, background: '#1a2010', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -40, right: -40, width: 160, height: 160, background: C.limelt, borderRadius: '50%', opacity: 0.08 }} />
          <button onClick={() => setShowNewForm(false)} style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', cursor: 'pointer' }}>
            <X size={15} />
          </button>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#fff', marginBottom: 14 }}>New Transcript</div>
          <textarea value={newText} onChange={e => setNewText(e.target.value)}
            placeholder="Paste raw conversation transcript here… Speaker: text format preferred."
            style={{ width: '100%', minHeight: 120, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 12, padding: '12px 16px', color: '#fff', fontSize: 13, fontFamily: 'Inter,sans-serif', resize: 'vertical', outline: 'none' }} />
          <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
            <button style={{ flex: 1, padding: '10px', background: C.limelt, color: C.text, border: `1px solid ${C.green}`, borderRadius: 12, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
              onClick={() => { alert('NLP pipeline integration coming soon!'); setShowNewForm(false); }}>
              Run NLP Pipeline
            </button>
            <button onClick={() => setShowNewForm(false)} style={{ padding: '10px 20px', background: 'rgba(255,255,255,0.08)', color: '#fff', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 12, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Search + Filters */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fff', border: '1px solid rgba(160,200,120,0.28)', borderRadius: 14, padding: '7px 14px', flex: '1 1 200px', minWidth: 180 }}>
          <Search size={14} color={C.textdim} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search sessions, speakers, text…"
            style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: 13, fontWeight: 600, color: C.text, width: '100%' }} />
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {['All', 'Positive', 'Negative', 'Neutral'].map(s => (
            <button key={s} onClick={() => setSentFilter(s)} style={chipStyle(sentFilter === s)}>{s}</button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {['All', 'Low', 'Medium', 'High'].map(r => (
            <button key={r} onClick={() => setRiskFilter(r)} style={chipStyle(riskFilter === r)}>Risk: {r}</button>
          ))}
        </div>
        <button onClick={() => setReminderFilter(f => !f)} style={{ ...chipStyle(reminderFilter), display: 'flex', alignItems: 'center', gap: 5 }}>
          <Bell size={12} /> Has Reminders
        </button>
      </div>

      {/* Table */}
      {isLoading ? (
        <div style={{ ...card, padding: '40px', textAlign: 'center', color: C.textdim }}>Loading transcripts…</div>
      ) : (
        <div style={{ background: '#fff', border: '1px solid rgba(160,200,120,0.22)', borderRadius: 20, overflow: 'hidden', boxShadow: `0 2px 16px ${C.shadow}` }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: C.cream2, borderBottom: '1px solid rgba(160,200,120,0.18)' }}>
                {['Session ID', 'Date', 'Participants', 'Sentiment', 'Risk', 'Reminders', ''].map(h => (
                  <th key={h} style={{ padding: '12px 16px', fontSize: 10, fontWeight: 700, color: C.textdim, textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'left', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: C.textdim, fontSize: 13, fontWeight: 600 }}>No transcripts match your filters.</td></tr>
              ) : filtered.map(t => {
                const ss = SENT_STYLE[t.summary.overallSentiment] || SENT_STYLE.neutral;
                const rl = getRiskLevel(t.summary.financialRiskScore);
                const rs = RISK_STYLE[rl];
                return (
                  <tr key={t._id} onClick={() => onSelect && onSelect(t._id)}
                    style={{ borderBottom: '1px solid rgba(160,200,120,0.1)', cursor: 'pointer', transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = C.cream2}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{t.sessionId}</div>
                      <div style={{ fontSize: 10, color: C.textdim, marginTop: 2 }}>{t.metadata?.language?.toUpperCase()} · v{t.metadata?.version}</div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: C.textmid, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Clock size={11} color={C.textdim} />
                        {new Date(t.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: C.textmid }}>
                        <Users size={11} color={C.textdim} />
                        {t.participants.map(p => p.name.split(' ')[0]).join(', ')}
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ fontSize: 10, fontWeight: 800, background: ss.bg, color: ss.color, border: `1px solid ${ss.border}`, borderRadius: 8, padding: '3px 9px', textTransform: 'capitalize' }}>{t.summary.overallSentiment}</span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 10, fontWeight: 800, background: rs.bg, color: rs.color, border: `1px solid ${rs.border}`, borderRadius: 8, padding: '3px 9px', textTransform: 'uppercase' }}>{rl}</span>
                        <span style={{ fontSize: 11, fontWeight: 700, color: C.textdim }}>{t.summary.financialRiskScore}</span>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      {t.summary.reminderCount > 0 ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, color: C.med }}>
                          <Bell size={11} /> {t.summary.reminderCount}
                        </span>
                      ) : <span style={{ fontSize: 11, color: C.textdim }}>—</span>}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <ChevronRight size={15} color={C.textdim} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default TranscriptsList;
