import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
<<<<<<< HEAD
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
=======
import { Search, ChevronRight, ChevronLeft, Activity, Clock, Globe, TrendingUp, Mic, Filter } from 'lucide-react';
import { useApp } from '../../context/AppContext';

const C = { cream2:'#FAF6E9', limelt:'#DDEB9D', green:'#A0C878', greendk:'#7aaa52', text:'#1a2010', textmid:'#4a5a30', textdim:'#8a9a70' };

const RISK_STYLE = {
  HIGH: { bg:'#fef2f2', color:'#dc2626', border:'#fecaca', dot:'#dc2626' },
  MED:  { bg:'#fefce8', color:'#92400e', border:'#fde68a', dot:'#e0a020' },
  LOW:  { bg:'#DDEB9D', color:'#4a5a30', border:'#A0C878', dot:'#7aaa52' },
};

const TOPIC_COLORS = {
  'Home Loan': { bg:'rgba(220,38,38,0.08)',   color:'#dc2626' },
  'SIP':       { bg:'rgba(122,170,82,0.12)',   color:'#7aaa52' },
  'EMI':       { bg:'rgba(224,160,32,0.10)',   color:'#92400e' },
  'Investment':{ bg:'rgba(160,200,120,0.15)',  color:'#4a5a30' },
  'Budget':    { bg:'rgba(100,140,60,0.10)',   color:'#4a5a30' },
};

/* Animated counter */
const Counter = ({ target }) => {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let n = 0;
    const step = Math.ceil(target / 30);
    const id = setInterval(() => {
      n += step;
      if (n >= target) { setVal(target); clearInterval(id); }
      else setVal(n);
    }, 40);
    return () => clearInterval(id);
  }, [target]);
  return <>{val}</>;
};

const Sessions = () => {
  const navigate = useNavigate();
  const { sessions: ALL_SESSIONS } = useApp();
  const [search, setSearch]   = useState('');
  const [lang, setLang]       = useState('All');
  const [topic, setTopic]     = useState('All');
  const [risk, setRisk]       = useState('All');
  const [visible, setVisible] = useState(false);
  const [hovered, setHovered] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  /* re-animate on filter change */
  useEffect(() => {
    setVisible(false);
    const t = setTimeout(() => setVisible(true), 60);
    return () => clearTimeout(t);
  }, [search, lang, topic, risk]);

  const filtered = ALL_SESSIONS.filter(s =>
    (s.name.toLowerCase().includes(search.toLowerCase()) || s.topic.toLowerCase().includes(search.toLowerCase())) &&
    (lang  === 'All' || s.lang  === lang)  &&
    (topic === 'All' || s.topic === topic) &&
    (risk  === 'All' || s.risk  === risk)
  );

  const high = ALL_SESSIONS.filter(s => s.risk === 'HIGH').length;
  const low  = ALL_SESSIONS.filter(s => s.risk === 'LOW').length;

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:24, fontFamily:'Inter,sans-serif', color:C.text }}>

      {/* ── Header ── */}
      <div className="sh-header">
        <div>
          <h1 className="sh-title">Session History</h1>
          <p className="sh-subtitle">All recorded financial conversations</p>
        </div>
        <div className="sh-stats-row">
          <div className="sh-stat-pill sh-stat-total">
            <Mic size={13} />
            <span><Counter target={ALL_SESSIONS.length} /> Sessions</span>
          </div>
          <div className="sh-stat-pill sh-stat-high">
            <span className="sh-dot sh-dot-high" />
            <span><Counter target={high} /> High Risk</span>
          </div>
          <div className="sh-stat-pill sh-stat-low">
            <span className="sh-dot sh-dot-low" />
            <span><Counter target={low} /> Low Risk</span>
          </div>
        </div>
      </div>

      {/* ── Filter bar ── */}
      <div className="sh-filter-bar">
        <div className="sh-search-wrap">
          <Search size={15} color={C.textdim} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search sessions…"
            className="sh-search-input"
          />
        </div>
        <div className="sh-selects">
          <Filter size={13} color={C.textdim} />
          {[
            { val:lang,  set:setLang,  opts:['All','English','Hinglish','Gujarati'], prefix:'Lang' },
            { val:topic, set:setTopic, opts:['All','Loan','SIP','EMI','Investment'], prefix:'Topic' },
            { val:risk,  set:setRisk,  opts:['All','HIGH','MED','LOW'],              prefix:'Risk' },
          ].map(({ val, set, opts, prefix }) => (
            <select key={prefix} value={val} onChange={e => set(e.target.value)} className="sh-select">
              {opts.map(o => <option key={o} value={o}>{o === 'All' ? `${prefix}: All` : o}</option>)}
            </select>
          ))}
        </div>
      </div>

      {/* ── Session Cards ── */}
      <div className="sh-cards-grid">
        {filtered.length === 0 && (
          <div className="sh-empty">
            <TrendingUp size={32} color={C.textdim} style={{ opacity:0.4 }} />
            <p>No sessions matched your filters.</p>
          </div>
        )}
        {filtered.map((s, i) => {
          const rs = RISK_STYLE[s.risk];
          const tc = TOPIC_COLORS[s.topic] || { bg:'rgba(160,200,120,0.12)', color:C.textmid };
          const isHov = hovered === i;
          return (
            <div
              key={i}
              className={`sh-card ${visible ? 'sh-card-in' : ''}`}
              style={{ animationDelay:`${i * 0.07}s` }}
              onClick={() => navigate(`/dashboard/sessions/${i}`)}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            >
              {/* Left accent bar */}
              <div className="sh-card-accent" style={{ background: rs.dot }} />

              {/* Card body */}
              <div className="sh-card-body">

                {/* Top row */}
                <div className="sh-card-top">
                  <div className="sh-card-icon" style={{ background: tc.bg, border:`1px solid ${tc.color}22` }}>
                    <Mic size={16} color={tc.color} />
                  </div>
                  <div style={{ flex:1 }}>
                    <div className="sh-card-name">{s.name}</div>
                    <div className="sh-card-date">
                      <Clock size={11} color={C.textdim} /> {s.date}
                    </div>
                  </div>
                  {/* Risk badge */}
                  <span className="sh-risk-badge" style={{ background:rs.bg, color:rs.color, border:`1px solid ${rs.border}` }}>
                    {s.risk === 'HIGH' && <span className="sh-risk-dot" style={{ background:rs.dot }} />}
                    {s.risk}
                  </span>
                </div>

                {/* Tags row */}
                <div className="sh-card-tags">
                  <span className="sh-tag" style={{ background:tc.bg, color:tc.color, border:`1px solid ${tc.color}33` }}>
                    {s.topic}
                  </span>
                  <span className="sh-tag sh-tag-lang">
                    <Globe size={10} /> {s.lang}
                  </span>
                  <span className="sh-tag sh-tag-dur">
                    <Activity size={10} /> {s.duration}
                  </span>
                  <button className="sh-view-btn" style={{ color: isHov ? C.text : C.textdim, marginLeft:'auto' }}>
                    View <ChevronRight size={13} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Pagination ── */}
      <div className="sh-pagination">
        <span className="sh-page-info">Showing <strong>{filtered.length}</strong> of <strong>{ALL_SESSIONS.length}</strong> sessions</span>
        <div className="sh-page-btns">
          <button className="sh-page-btn"><ChevronLeft size={14} /> Prev</button>
          {[1,2,3].map(n => (
            <button key={n} className={`sh-page-num ${n===1?'sh-page-active':''}`}>{n}</button>
          ))}
          <button className="sh-page-btn">Next <ChevronRight size={14} /></button>
        </div>
      </div>

      <style>{`
        /* ── Header ── */
        .sh-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          flex-wrap: wrap;
          gap: 14px;
          animation: shFadeDown 0.5s ease-out both;
        }
        .sh-title {
          font-size: clamp(24px,3vw,34px);
          font-weight: 900;
          letter-spacing: -1.2px;
          color: ${C.text};
          margin: 0;
        }
        .sh-subtitle {
          font-size: 13px;
          color: ${C.textdim};
          margin-top: 5px;
        }
        .sh-stats-row {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          animation: shFadeDown 0.5s ease-out 0.1s both;
        }
        .sh-stat-pill {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 700;
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
        }
        .sh-stat-total {
          background: rgba(255,255,255,0.30);
          border: 1px solid rgba(160,200,120,0.30);
          color: ${C.textmid};
        }
        .sh-stat-high {
          background: rgba(254,242,242,0.70);
          border: 1px solid #fecaca;
          color: #dc2626;
        }
        .sh-stat-low {
          background: rgba(221,235,157,0.55);
          border: 1px solid ${C.green};
          color: ${C.greendk};
        }
        .sh-dot {
          width: 7px; height: 7px;
          border-radius: 50%;
          display: inline-block;
        }
        .sh-dot-high { background:#dc2626; animation: shDotPulse 1.8s ease-in-out infinite; }
        .sh-dot-low  { background:${C.greendk}; }
        @keyframes shDotPulse {
          0%,100% { box-shadow: 0 0 0 0 rgba(220,38,38,0.4); }
          50%     { box-shadow: 0 0 0 5px rgba(220,38,38,0); }
        }

        /* ── Filter bar ── */
        .sh-filter-bar {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          align-items: center;
          background: rgba(255,255,255,0.22);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255,255,255,0.50);
          border-radius: 16px;
          padding: 10px 16px;
          box-shadow: 0 4px 20px rgba(100,140,60,0.07), inset 0 1px 0 rgba(255,255,255,0.8);
          animation: shFadeDown 0.5s ease-out 0.15s both;
        }
        .sh-search-wrap {
          display: flex;
          align-items: center;
          gap: 8px;
          flex: 1 1 180px;
          min-width: 160px;
        }
        .sh-search-input {
          border: none;
          outline: none;
          background: transparent;
          font-size: 13px;
          font-weight: 600;
          color: ${C.text};
          width: 100%;
          font-family: inherit;
        }
        .sh-search-input::placeholder { color: ${C.textdim}; }
        .sh-selects {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }
        .sh-select {
          background: rgba(255,255,255,0.30);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          border: 1px solid rgba(160,200,120,0.28);
          border-radius: 10px;
          padding: 6px 12px;
          font-size: 12px;
          font-weight: 700;
          color: ${C.text};
          outline: none;
          cursor: pointer;
          font-family: inherit;
          transition: all 0.2s ease;
        }
        .sh-select:hover {
          background: rgba(221,235,157,0.40);
          border-color: ${C.green};
        }

        /* ── Cards grid ── */
        .sh-cards-grid {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .sh-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          padding: 60px 0;
          color: ${C.textdim};
          font-size: 14px;
          font-weight: 600;
          background: rgba(255,255,255,0.18);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px dashed rgba(160,200,120,0.30);
          border-radius: 20px;
        }

        /* ── Session card ── */
        .sh-card {
          display: flex;
          background: rgba(255,255,255,0.22);
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
          border: 1px solid rgba(255,255,255,0.50);
          border-radius: 18px;
          overflow: hidden;
          cursor: pointer;
          opacity: 0;
          transform: translateY(18px);
          box-shadow: 0 4px 20px rgba(100,140,60,0.07), inset 0 1px 0 rgba(255,255,255,0.80);
          transition: transform 0.32s cubic-bezier(0.22,1,0.36,1),
                      box-shadow 0.32s cubic-bezier(0.22,1,0.36,1),
                      background 0.25s ease,
                      border-color 0.25s ease;
        }
        .sh-card-in {
          animation: shSlideUp 0.5s cubic-bezier(0.22,1,0.36,1) forwards;
        }
        .sh-card:hover {
          transform: translateY(-4px) !important;
          box-shadow: 0 16px 44px rgba(100,140,60,0.13), inset 0 1px 0 rgba(255,255,255,0.90);
          background: rgba(255,255,255,0.36);
          border-color: rgba(160,200,120,0.38);
        }
        @keyframes shSlideUp {
          from { opacity:0; transform:translateY(18px); }
          to   { opacity:1; transform:translateY(0); }
        }

        /* Left accent bar */
        .sh-card-accent {
          width: 4px;
          flex-shrink: 0;
          transition: width 0.25s ease;
        }
        .sh-card:hover .sh-card-accent { width: 6px; }

        .sh-card-body {
          flex: 1;
          padding: 16px 20px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          justify-content: center;
        }

        /* Top row */
        .sh-card-top {
          display: flex;
          align-items: flex-start;
          gap: 12px;
        }
        .sh-card-icon {
          width: 38px; height: 38px;
          border-radius: 11px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: transform 0.3s ease;
        }
        .sh-card:hover .sh-card-icon { transform: scale(1.1) rotate(-4deg); }
        .sh-card-name {
          font-size: 14px;
          font-weight: 800;
          color: ${C.text};
          line-height: 1.3;
        }
        .sh-card-date {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 11px;
          color: ${C.textdim};
          margin-top: 3px;
          font-weight: 500;
        }
        .sh-risk-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 10px;
          font-weight: 800;
          padding: 4px 11px;
          border-radius: 8px;
          white-space: nowrap;
          flex-shrink: 0;
          letter-spacing: 0.3px;
        }
        .sh-risk-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          display: inline-block;
          animation: shRiskPulse 1.5s ease-in-out infinite;
        }
        @keyframes shRiskPulse {
          0%,100% { opacity:1; transform:scale(1); }
          50%     { opacity:0.4; transform:scale(0.7); }
        }

        /* Tags */
        .sh-card-tags {
          display: flex;
          gap: 7px;
          flex-wrap: wrap;
          align-items: center;
        }
        .sh-tag {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 11px;
          font-weight: 700;
          padding: 3px 10px;
          border-radius: 8px;
          letter-spacing: 0.2px;
        }
        .sh-tag-lang {
          background: rgba(255,255,255,0.35);
          border: 1px solid rgba(160,200,120,0.25);
          color: ${C.textmid};
        }
        .sh-tag-dur {
          background: rgba(160,200,120,0.10);
          border: 1px solid rgba(160,200,120,0.22);
          color: ${C.textmid};
        }

        /* Footer */
        .sh-card-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }
        .sh-card-progress {
          display: flex;
          align-items: center;
          gap: 8px;
          flex: 1;
        }
        .sh-progress-track {
          flex: 1;
          height: 4px;
          background: rgba(160,200,120,0.15);
          border-radius: 4px;
          overflow: hidden;
          max-width: 120px;
        }
        .sh-progress-fill {
          height: 100%;
          border-radius: 4px;
          transition: width 0.9s cubic-bezier(0.22,1,0.36,1);
        }
        .sh-progress-label {
          font-size: 10px;
          font-weight: 700;
          white-space: nowrap;
        }
        .sh-view-btn {
          display: flex;
          align-items: center;
          gap: 4px;
          background: none;
          border: none;
          font-size: 12px;
          font-weight: 700;
          font-family: inherit;
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 8px;
          transition: all 0.2s ease;
        }
        .sh-view-btn:hover {
          background: rgba(160,200,120,0.12);
        }

        /* ── Pagination ── */
        .sh-pagination {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: rgba(255,255,255,0.20);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255,255,255,0.50);
          border-radius: 14px;
          padding: 12px 20px;
          box-shadow: 0 4px 20px rgba(100,140,60,0.06), inset 0 1px 0 rgba(255,255,255,0.80);
          animation: shFadeDown 0.5s ease-out 0.4s both;
        }
        .sh-page-info {
          font-size: 13px;
          color: ${C.textdim};
          font-weight: 500;
        }
        .sh-page-info strong { color: ${C.textmid}; }
        .sh-page-btns {
          display: flex;
          gap: 6px;
          align-items: center;
        }
        .sh-page-btn {
          display: flex;
          align-items: center;
          gap: 4px;
          background: rgba(255,255,255,0.28);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          border: 1px solid rgba(160,200,120,0.25);
          border-radius: 10px;
          padding: 7px 14px;
          font-size: 12px;
          font-weight: 700;
          color: ${C.textmid};
          cursor: pointer;
          font-family: inherit;
          transition: all 0.2s ease;
        }
        .sh-page-btn:hover {
          background: rgba(221,235,157,0.45);
          border-color: ${C.green};
          color: ${C.text};
        }
        .sh-page-num {
          width: 32px; height: 32px;
          border-radius: 8px;
          border: 1px solid rgba(160,200,120,0.22);
          background: rgba(255,255,255,0.25);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          color: ${C.textmid};
          font-weight: 700;
          font-size: 13px;
          cursor: pointer;
          font-family: inherit;
          transition: all 0.2s ease;
        }
        .sh-page-active {
          background: rgba(221,235,157,0.65) !important;
          border-color: ${C.green} !important;
          color: ${C.text} !important;
          box-shadow: 0 3px 10px rgba(160,200,120,0.20);
        }

        /* ── Keyframes ── */
        @keyframes shFadeDown {
          from { opacity:0; transform:translateY(-10px); }
          to   { opacity:1; transform:translateY(0); }
        }

        /* ── Responsive ── */
        @media (max-width: 640px) {
          .sh-header { flex-direction: column; }
          .sh-filter-bar { flex-direction: column; align-items: stretch; }
          .sh-selects { flex-wrap: wrap; }
        }
      `}</style>
>>>>>>> dd881948122f09248bf8bacc155ba9069e739fe3
    </div>
  );
};

export default Sessions;
