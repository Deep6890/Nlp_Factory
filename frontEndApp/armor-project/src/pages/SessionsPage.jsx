import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, ChevronRight, ChevronLeft, Mic, Clock, Globe,
  TrendingUp, TrendingDown, Minus, Loader2, RefreshCw, Filter,
  Info,
} from 'lucide-react';
import { listRecordings, getRecordingTranscript } from '../api/recordings';

/* ── Shared card style using CSS vars ── */
const cardStyle = {
  background: 'var(--bg-card)',
  border: '1px solid var(--border)',
  borderRadius: 16,
  boxShadow: 'var(--shadow-sm)',
};

const RISK_MAP = {
  high:   { bg: 'rgba(220,38,38,0.08)',  color: 'var(--accent-red)',    border: 'rgba(220,38,38,0.2)',  label: 'HIGH' },
  medium: { bg: 'rgba(217,119,6,0.08)',  color: 'var(--accent-amber)',  border: 'rgba(217,119,6,0.2)',  label: 'MED' },
  low:    { bg: 'rgba(90,158,47,0.08)',  color: 'var(--green)',         border: 'var(--green-border)',  label: 'LOW' },
};

const STATUS_MAP = {
  done:       { bg: 'rgba(5,150,105,0.08)',  color: 'var(--accent-green)', border: 'rgba(5,150,105,0.2)',  label: 'Done' },
  processing: { bg: 'rgba(217,119,6,0.08)',  color: 'var(--accent-amber)', border: 'rgba(217,119,6,0.2)',  label: 'Processing' },
  pending:    { bg: 'var(--bg-subtle)',       color: 'var(--text-muted)',   border: 'var(--border)',         label: 'Pending' },
  failed:     { bg: 'rgba(220,38,38,0.08)',  color: 'var(--accent-red)',   border: 'rgba(220,38,38,0.2)',  label: 'Failed' },
};

const SentIcon = ({ label }) => {
  if (label === 'positive') return <TrendingUp size={13} color="var(--accent-green)" />;
  if (label === 'negative') return <TrendingDown size={13} color="var(--accent-red)" />;
  return <Minus size={13} color="var(--text-muted)" />;
};

const RiskBadge = ({ level }) => {
  const r = RISK_MAP[(level || 'low').toLowerCase()] || RISK_MAP.low;
  return (
    <span style={{ fontSize: 10, fontWeight: 800, background: r.bg, color: r.color, border: `1px solid ${r.border}`, borderRadius: 7, padding: '3px 9px', letterSpacing: '0.4px' }}>
      {r.label}
    </span>
  );
};

const StatusBadge = ({ status }) => {
  const s = STATUS_MAP[status] || STATUS_MAP.pending;
  return (
    <span style={{ fontSize: 10, fontWeight: 800, background: s.bg, color: s.color, border: `1px solid ${s.border}`, borderRadius: 7, padding: '3px 9px', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      {status === 'processing' && <Loader2 size={9} style={{ animation: 'spin 1s linear infinite' }} />}
      {s.label}
    </span>
  );
};

/* ── Tooltip for column headers ── */
const ColTip = ({ text }) => (
  <span title={text} style={{ marginLeft: 4, cursor: 'help', opacity: 0.5 }}>
    <Info size={10} />
  </span>
);

const SessionRow = ({ rec }) => {
  const navigate = useNavigate();
  const [tr, setTr] = useState(null);

  useEffect(() => {
    let iv;
    const load = async () => {
      try {
        const d = await getRecordingTranscript(rec._id);
        const t = d.transcript ?? d;
        setTr(t);
        if (t.status === 'done' || t.status === 'failed') clearInterval(iv);
      } catch { setTr(null); }
    };
    load();
    iv = setInterval(load, 10000);
    return () => clearInterval(iv);
  }, [rec._id]);

  const ins  = tr?.insights || {};
  const risk = (ins.risk_level || 'low').toLowerCase();
  const date = rec.createdAt
    ? new Date(rec.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
    : '—';
  const conf = tr?.confidence != null ? Math.round(tr.confidence * 100) + '%' : '—';
  const confNum = tr?.confidence != null ? Math.round(tr.confidence * 100) : null;
  const confColor = confNum == null ? 'var(--text-muted)' : confNum >= 80 ? 'var(--green)' : confNum >= 50 ? 'var(--accent-amber)' : 'var(--accent-red)';

  return (
    <tr
      onClick={() => navigate(`/dashboard/sessions/${rec._id}`)}
      style={{ cursor: 'pointer', borderBottom: '1px solid var(--border)', transition: 'background 0.12s' }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-subtle)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>

      {/* Session name + date */}
      <td style={{ padding: '13px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: 'var(--green-bg)', border: '1px solid var(--green-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Mic size={13} color="var(--green)" />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{rec.filename || 'Recording'}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
              <Clock size={10} /> {date}
            </div>
          </div>
        </div>
      </td>

      {/* Language */}
      <td style={{ padding: '13px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>
          <Globe size={12} color="var(--text-muted)" />
          {(tr?.language || '—').toUpperCase()}
        </div>
      </td>

      {/* Domain */}
      <td style={{ padding: '13px 18px' }}>
        <span style={{ fontSize: 11, fontWeight: 700, background: 'var(--bg-subtle)', border: '1px solid var(--border)', color: 'var(--text-secondary)', padding: '3px 10px', borderRadius: 8, textTransform: 'capitalize' }}>
          {ins.domain?.replace(/_/g, ' ') || '—'}
        </span>
      </td>

      {/* Sentiment */}
      <td style={{ padding: '13px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>
          <SentIcon label={ins.sentiment_label} />
          <span style={{ textTransform: 'capitalize' }}>{ins.sentiment_label || '—'}</span>
        </div>
      </td>

      {/* Confidence */}
      <td style={{ padding: '13px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 48, height: 3, background: 'var(--bg-subtle)', borderRadius: 2, overflow: 'hidden' }}>
            {confNum != null && <div style={{ width: `${confNum}%`, height: '100%', background: confColor, borderRadius: 2 }} />}
          </div>
          <span style={{ fontSize: 12, fontWeight: 700, color: confColor }}>{conf}</span>
        </div>
      </td>

      {/* Risk */}
      <td style={{ padding: '13px 18px' }}>
        <RiskBadge level={ins.risk_level} />
      </td>

      {/* Status */}
      <td style={{ padding: '13px 18px' }}>
        <StatusBadge status={tr?.status || 'pending'} />
      </td>

      {/* Summary */}
      <td style={{ padding: '13px 18px' }}>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {ins.summary || tr?.summary || '—'}
        </div>
      </td>

      <td style={{ padding: '13px 18px' }}>
        <ChevronRight size={14} color="var(--text-faint)" />
      </td>
    </tr>
  );
};

/* ── Main Sessions page ── */
const Sessions = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [riskFilter, setRisk]   = useState('All');
  const [page, setPage]         = useState(1);
  const [total, setTotal]       = useState(0);
  const LIMIT = 20;

  const load = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const d = await listRecordings({ page: p, limit: LIMIT });
      setSessions(d.audios || []);
      setTotal(d.total || 0);
      setPage(d.page || p);
    } catch { setSessions([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(1); }, [load]);

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  const filtered = sessions.filter(s => {
    const matchSearch = !search || (s.filename || '').toLowerCase().includes(search.toLowerCase());
    return matchSearch;
  });

  const COLS = [
    { key: 'session',    label: 'Session',    tip: 'Recording name and date' },
    { key: 'language',   label: 'Language',   tip: 'Detected spoken language' },
    { key: 'domain',     label: 'Domain',     tip: 'Conversation topic category (e.g. finance, health)' },
    { key: 'sentiment',  label: 'Sentiment',  tip: 'Overall emotional tone — positive, negative, or neutral' },
    { key: 'confidence', label: 'Confidence', tip: 'AI transcription accuracy score (higher = more reliable)' },
    { key: 'risk',       label: 'Risk',       tip: 'Financial risk level detected in the conversation' },
    { key: 'status',     label: 'Status',     tip: 'Current processing state of the AI pipeline' },
    { key: 'summary',    label: 'Summary',    tip: 'Brief AI-generated summary of the conversation' },
    { key: '',           label: '',           tip: '' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22, color: 'var(--text-primary)' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 'clamp(20px,3vw,26px)', fontWeight: 900, letterSpacing: -0.8, margin: 0, color: 'var(--text-primary)' }}>
            Session History
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '4px 0 0' }}>
            All recorded financial conversations — click any row to view full analysis
          </p>
        </div>
        <button
          onClick={() => load(1)}
          style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', background: 'var(--bg-subtle)', border: '1px solid var(--border)', borderRadius: 10, padding: '8px 14px', cursor: 'pointer' }}>
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {/* Legend / explanation bar */}
      <div style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)', borderRadius: 12, padding: '12px 18px', display: 'flex', flexWrap: 'wrap', gap: 16 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 5 }}>
          <Info size={12} color="var(--green)" /> Column guide:
        </span>
        {[
          ['Confidence', 'How accurate the AI transcription is'],
          ['Risk', 'Financial risk level in the conversation'],
          ['Domain', 'Topic category detected by AI'],
          ['Sentiment', 'Emotional tone of the conversation'],
        ].map(([k, v]) => (
          <span key={k} style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            <strong style={{ color: 'var(--text-secondary)' }}>{k}</strong> — {v}
          </span>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '9px 14px', flex: '1 1 200px' }}>
          <Search size={14} color="var(--text-muted)" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search sessions by name..."
            style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', width: '100%' }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Filter size={13} color="var(--text-muted)" />
          <select
            value={riskFilter}
            onChange={e => setRisk(e.target.value)}
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: '9px 12px', fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', outline: 'none', cursor: 'pointer' }}>
            <option value="All">All Risk Levels</option>
            <option value="high">High Risk</option>
            <option value="medium">Medium Risk</option>
            <option value="low">Low Risk</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div style={{ ...cardStyle, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 48, gap: 10, color: 'var(--text-muted)' }}>
            <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
            <span style={{ fontSize: 13, fontWeight: 600 }}>Loading sessions...</span>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
              <thead>
                <tr style={{ background: 'var(--bg-subtle)', borderBottom: '1px solid var(--border)' }}>
                  {COLS.map(col => (
                    <th key={col.key} style={{ padding: '11px 18px', fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px', textAlign: 'left', whiteSpace: 'nowrap' }}>
                      {col.label}
                      {col.tip && <ColTip text={col.tip} />}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ padding: '48px 20px', textAlign: 'center', fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>
                      No sessions yet — upload audio in Live Detection to get started
                    </td>
                  </tr>
                ) : filtered.map(s => <SessionRow key={s._id} rec={s} />)}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {!loading && total > LIMIT && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', ...cardStyle, padding: '12px 20px' }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{total} total sessions</span>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <button
              disabled={page <= 1}
              onClick={() => load(page - 1)}
              style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'var(--bg-subtle)', border: '1px solid var(--border)', borderRadius: 9, padding: '6px 12px', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', cursor: page <= 1 ? 'not-allowed' : 'pointer', opacity: page <= 1 ? 0.4 : 1 }}>
              <ChevronLeft size={13} /> Prev
            </button>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', padding: '0 8px' }}>{page} / {totalPages}</span>
            <button
              disabled={page >= totalPages}
              onClick={() => load(page + 1)}
              style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'var(--bg-subtle)', border: '1px solid var(--border)', borderRadius: 9, padding: '6px 12px', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', cursor: page >= totalPages ? 'not-allowed' : 'pointer', opacity: page >= totalPages ? 0.4 : 1 }}>
              Next <ChevronRight size={13} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sessions;


