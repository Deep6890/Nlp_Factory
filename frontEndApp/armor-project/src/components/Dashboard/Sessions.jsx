import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ChevronRight, ChevronLeft, Activity, Loader, Mic, Globe, Clock } from 'lucide-react';
import { listRecordings } from '../../api/recordings';
import { DUMMY_SESSIONS } from '../../data/dummyData';

const C = { cream2: '#FAF6E9', limelt: '#DDEB9D', green: '#A0C878', greendk: '#7aaa52', text: '#1a2010', textmid: '#4a5a30', textdim: '#8a9a70' };

const RISK_STYLE = {
  high:   { bg: '#fef2f2', color: '#dc2626', border: '#fecaca', label: 'HIGH' },
  medium: { bg: '#fefce8', color: '#92400e', border: '#fde68a', label: 'MED' },
  low:    { bg: '#DDEB9D', color: '#4a5a30', border: '#A0C878', label: 'LOW' },
};

const LANG_FLAG = { hi: '🇮🇳', en: '🇬🇧', gu: '🇮🇳', mr: '🇮🇳', ta: '🇮🇳', te: '🇮🇳', Unknown: '🌐' };

const mapReal = (rec) => ({
  _id: rec._id,
  name: rec.filename || 'Recording',
  date: rec.createdAt ? new Date(rec.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '—',
  lang: rec.language || 'Unknown',
  topic: rec.mode || 'General',
  duration: rec.duration ? `${Math.floor(rec.duration / 60)}m ${Math.round(rec.duration % 60)}s` : '—',
  risk: 'low',
  summary: '',
  isDummy: false,
});

const mapDummy = (s) => ({
  _id: s._id,
  name: s.filename,
  date: new Date(s.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }),
  lang: s.transcript?.language || 'hi',
  topic: s.transcript?.insights?.domain || 'General',
  duration: `${Math.floor(s.duration / 60)}m ${Math.round(s.duration % 60)}s`,
  risk: s.transcript?.insights?.risk_level || 'low',
  summary: s.transcript?.summary || '',
  isDummy: true,
});

const Sessions = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState('All');
  const [langFilter, setLangFilter] = useState('All');

  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [usingDummy, setUsingDummy] = useState(false);
  const LIMIT = 20;

  const fetchSessions = async (p = 1) => {
    setLoading(true);
    setError('');
    try {
      const data = await listRecordings({ page: p, limit: LIMIT });
      const audios = data.audios ?? [];
      if (audios.length === 0) {
        setSessions(DUMMY_SESSIONS.map(mapDummy));
        setTotal(DUMMY_SESSIONS.length);
        setUsingDummy(true);
      } else {
        setSessions(audios.map(mapReal));
        setTotal(data.total ?? audios.length);
        setUsingDummy(false);
      }
      setPage(data.page ?? p);
    } catch {
      setSessions(DUMMY_SESSIONS.map(mapDummy));
      setTotal(DUMMY_SESSIONS.length);
      setUsingDummy(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSessions(1); }, []);

  const filtered = sessions.filter(s => {
    const q = search.toLowerCase();
    const matchQ = s.name.toLowerCase().includes(q) || s.topic.toLowerCase().includes(q) || s.summary.toLowerCase().includes(q);
    const matchR = riskFilter === 'All' || s.risk === riskFilter.toLowerCase();
    const matchL = langFilter === 'All' || s.lang === langFilter;
    return matchQ && matchR && matchL;
  });

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));
  const selStyle = { background: '#FAF6E9', border: '1px solid rgba(160,200,120,0.28)', borderRadius: 12, padding: '8px 14px', fontSize: 13, fontWeight: 700, color: C.text, outline: 'none', cursor: 'pointer' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, fontFamily: 'Inter,sans-serif', color: C.text }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 'clamp(22px,3vw,32px)', fontWeight: 900, letterSpacing: -1, margin: 0 }}>Session History</h1>
          <p style={{ fontSize: 13, color: C.textdim, marginTop: 4, margin: 0 }}>All recorded financial conversations</p>
        </div>
        {usingDummy && (
          <span style={{ fontSize: 11, fontWeight: 700, background: C.limelt, color: C.greendk, border: `1px solid ${C.green}`, borderRadius: 8, padding: '5px 12px' }}>
            📋 Sample Sessions
          </span>
        )}
      </div>

      {/* Filter bar */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fff', border: '1px solid rgba(160,200,120,0.28)', borderRadius: 14, padding: '7px 14px', flex: '1 1 200px', minWidth: 180 }}>
          <Search size={14} color={C.textdim} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search sessions, topics…"
            style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: 13, fontWeight: 600, color: C.text, width: '100%' }} />
        </div>
        <select value={langFilter} onChange={e => setLangFilter(e.target.value)} style={selStyle}>
          <option value="All">Language: All</option>
          <option value="hi">Hindi</option>
          <option value="en">English</option>
          <option value="gu">Gujarati</option>
        </select>
        <select value={riskFilter} onChange={e => setRiskFilter(e.target.value)} style={selStyle}>
          <option value="All">Risk: All</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      {loading && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40, gap: 10, color: C.textdim }}>
          <Loader size={18} style={{ animation: 'spin 1s linear infinite' }} />
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          <span style={{ fontSize: 13, fontWeight: 600 }}>Loading sessions…</span>
        </div>
      )}

      {!loading && error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: 14, padding: '14px 20px', fontSize: 13, fontWeight: 600 }}>{error}</div>
      )}

      {/* Table */}
      {!loading && (
        <div style={{ background: '#fff', border: '1px solid rgba(160,200,120,0.22)', borderRadius: 20, overflow: 'hidden', boxShadow: '0 2px 16px rgba(100,140,60,0.08)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#FAF6E9', borderBottom: '1px solid rgba(160,200,120,0.18)' }}>
                {['Session', 'Language', 'Domain', 'Duration', 'Risk', 'Summary', ''].map(h => (
                  <th key={h} style={{ padding: '13px 18px', fontSize: 10, fontWeight: 700, color: C.textdim, textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'left', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '40px 20px', textAlign: 'center', fontSize: 13, color: C.textdim, fontWeight: 600 }}>
                    No sessions match your filters.
                  </td>
                </tr>
              ) : filtered.map((s) => {
                const rs = RISK_STYLE[s.risk] || RISK_STYLE.low;
                const flag = LANG_FLAG[s.lang] || '🌐';
                return (
                  <tr key={s._id}
                    onClick={() => navigate(s.isDummy ? `/dashboard/sessions/demo_${s._id}` : `/dashboard/sessions/${s._id}`)}
                    style={{ borderBottom: '1px solid rgba(160,200,120,0.1)', cursor: 'pointer', transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#FAF6E9'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '13px 18px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 9, background: C.limelt, border: `1px solid ${C.green}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Mic size={13} color={C.greendk} />
                        </div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{s.name}</div>
                          <div style={{ fontSize: 11, color: C.textdim, marginTop: 1, display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={10} />{s.date}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '13px 18px' }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: C.textmid }}>{flag} {s.lang.toUpperCase()}</span>
                    </td>
                    <td style={{ padding: '13px 18px' }}>
                      <span style={{ background: C.cream2, border: '1px solid rgba(160,200,120,0.2)', color: C.textmid, padding: '3px 10px', borderRadius: 8, fontSize: 11, fontWeight: 700, textTransform: 'capitalize' }}>{s.topic.replace('_', ' ')}</span>
                    </td>
                    <td style={{ padding: '13px 18px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600, color: C.textmid }}><Activity size={12} color={C.textdim} />{s.duration}</span>
                    </td>
                    <td style={{ padding: '13px 18px' }}>
                      <span style={{ fontSize: 10, fontWeight: 800, background: rs.bg, color: rs.color, border: `1px solid ${rs.border}`, padding: '3px 10px', borderRadius: 8, textTransform: 'uppercase' }}>{rs.label}</span>
                    </td>
                    <td style={{ padding: '13px 18px', maxWidth: 220 }}>
                      <span style={{ fontSize: 11, color: C.textdim, fontWeight: 500, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{s.summary || '—'}</span>
                    </td>
                    <td style={{ padding: '13px 18px', textAlign: 'right' }}>
                      <ChevronRight size={15} color={C.textdim} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {!loading && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', border: '1px solid rgba(160,200,120,0.22)', borderRadius: 16, padding: '11px 18px', boxShadow: '0 2px 12px rgba(100,140,60,0.06)' }}>
          <span style={{ fontSize: 12, color: C.textdim, fontWeight: 500 }}>Showing {filtered.length} of {total} sessions</span>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <button disabled={page <= 1} onClick={() => fetchSessions(page - 1)}
              style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#FAF6E9', border: '1px solid rgba(160,200,120,0.28)', borderRadius: 10, padding: '6px 13px', fontSize: 12, fontWeight: 700, color: C.textmid, cursor: page <= 1 ? 'not-allowed' : 'pointer', opacity: page <= 1 ? 0.5 : 1 }}>
              <ChevronLeft size={13} /> Prev
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(n => (
              <button key={n} onClick={() => fetchSessions(n)}
                style={{ width: 30, height: 30, borderRadius: 8, border: 'none', background: n === page ? '#DDEB9D' : '#FAF6E9', color: n === page ? C.text : C.textmid, fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>{n}</button>
            ))}
            <button disabled={page >= totalPages} onClick={() => fetchSessions(page + 1)}
              style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#FAF6E9', border: '1px solid rgba(160,200,120,0.28)', borderRadius: 10, padding: '6px 13px', fontSize: 12, fontWeight: 700, color: C.textmid, cursor: page >= totalPages ? 'not-allowed' : 'pointer', opacity: page >= totalPages ? 0.5 : 1 }}>
              Next <ChevronRight size={13} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sessions;
