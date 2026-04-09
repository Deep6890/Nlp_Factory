import React, { useState } from 'react';
import {
  FileText, Download, Loader2, Calendar, CheckSquare, Square,
  Sparkles, AlertCircle, BarChart3, TrendingUp, Shield, Tag, Brain,
  Star, Clock, RefreshCw, Info, ChevronRight, FileDown,
} from 'lucide-react';
import { generateReport } from '../api/transcripts';

/* ─── shared styles ──────────────────────────────────────────────── */
const cs = {
  background: 'var(--bg-card)', border: '1px solid var(--border)',
  borderRadius: 18, padding: '22px 24px', boxShadow: 'var(--shadow-sm)',
  transition: 'background-color 0.25s ease, border-color 0.25s ease',
};
const ib = {
  background: 'var(--bg-input)', border: '1px solid var(--border)',
  borderRadius: 10, padding: '9px 13px', fontSize: 13,
  fontFamily: 'inherit', color: 'var(--text-primary)',
  outline: 'none', width: '100%', boxSizing: 'border-box',
  transition: 'border-color 0.2s',
};

const SECTIONS = [
  { key: 'overview',        label: 'Overview & Summary',  icon: BarChart3,  tip: 'High-level summary of all conversations' },
  { key: 'risk',            label: 'Risk Analysis',        icon: Shield,     tip: 'Detailed breakdown of financial risks detected' },
  { key: 'sentiment',       label: 'Sentiment Trends',     icon: TrendingUp, tip: 'How emotional tone changed over time' },
  { key: 'intent',          label: 'Intent Breakdown',     icon: Brain,      tip: 'What users were trying to accomplish' },
  { key: 'keywords',        label: 'Key Financial Terms',  icon: Tag,        tip: 'Most mentioned financial entities and keywords' },
  { key: 'recommendations', label: 'Recommendations',      icon: Star,       tip: 'AI-generated action items and suggestions' },
];

/* ─── markdown renderer (simple) ────────────────────────────────── */
const MdPreview = ({ text }) => {
  const lines = text.split('\n');
  return (
    <div style={{ fontFamily: 'inherit', fontSize: 13, lineHeight: 1.85, color: 'var(--text-primary)' }}>
      {lines.map((line, i) => {
        if (line.startsWith('# '))  return <div key={i} style={{ fontSize: 20, fontWeight: 900, color: 'var(--text-primary)', margin: '18px 0 8px', letterSpacing: -0.5 }}>{line.slice(2)}</div>;
        if (line.startsWith('## ')) return <div key={i} style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', margin: '14px 0 6px', borderBottom: '1px solid var(--border)', paddingBottom: 6 }}>{line.slice(3)}</div>;
        if (line.startsWith('### ')) return <div key={i} style={{ fontSize: 13, fontWeight: 700, color: 'var(--green)', margin: '10px 0 4px' }}>{line.slice(4)}</div>;
        if (line.startsWith('- ') || line.startsWith('* ')) return (
          <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 4, paddingLeft: 8 }}>
            <span style={{ color: 'var(--green)', flexShrink: 0, marginTop: 2 }}>•</span>
            <span style={{ color: 'var(--text-secondary)' }}>{line.slice(2)}</span>
          </div>
        );
        if (/^\d+\./.test(line)) return (
          <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 4, paddingLeft: 8 }}>
            <span style={{ color: 'var(--green)', flexShrink: 0, fontWeight: 700, minWidth: 18 }}>{line.match(/^\d+/)[0]}.</span>
            <span style={{ color: 'var(--text-secondary)' }}>{line.replace(/^\d+\.\s*/, '')}</span>
          </div>
        );
        if (line.startsWith('---') || line.startsWith('===')) return <hr key={i} style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '12px 0' }} />;
        if (line.trim() === '') return <div key={i} style={{ height: 8 }} />;
        // inline bold
        const parts = line.split(/(\*\*[^*]+\*\*)/g);
        return (
          <div key={i} style={{ color: 'var(--text-secondary)', marginBottom: 2 }}>
            {parts.map((p, j) => p.startsWith('**') ? <strong key={j} style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{p.slice(2, -2)}</strong> : p)}
          </div>
        );
      })}
    </div>
  );
};

const Reports = () => {
  const [days, setDays]             = useState(10);
  const [sections, setSections]     = useState(Object.fromEntries(SECTIONS.map(s => [s.key, true])));
  const [generating, setGenerating] = useState(false);
  const [markdown, setMarkdown]     = useState('');
  const [error, setError]           = useState('');
  const [reports, setReports]       = useState([]);
  const [activeReport, setActiveReport] = useState(null);

  const toggle = k => setSections(p => ({ ...p, [k]: !p[k] }));

  const generate = async () => {
    setGenerating(true); setError(''); setMarkdown('');
    try {
      const data = await generateReport(days);
      const md = data.markdown || '';
      setMarkdown(md);
      const newReport = {
        id: Date.now(),
        title: `Financial Summary — Last ${days} Days`,
        date: new Date().toLocaleDateString('en-IN', { dateStyle: 'medium' }),
        time: new Date().toLocaleTimeString('en-IN', { timeStyle: 'short' }),
        days,
        markdown: md,
      };
      setReports(prev => [newReport, ...prev]);
      setActiveReport(newReport.id);
    } catch (err) {
      setError(err.message || 'Report generation failed. Check NVIDIA_API_KEY in .env');
    } finally { setGenerating(false); }
  };

  const downloadMd = (md, title) => {
    const blob = new Blob([md], { type: 'text/markdown' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `${title.replace(/\s+/g, '-')}.md`; a.click();
    URL.revokeObjectURL(url);
  };

  const displayMd = activeReport ? reports.find(r => r.id === activeReport)?.markdown : markdown;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22, color: 'var(--text-primary)' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}`}</style>

      {/* ── HERO ── */}
      <div style={{ background: '#0f1a0a', borderRadius: 18, padding: '26px 28px 22px', position: 'relative', overflow: 'hidden', border: '1px solid rgba(160,200,120,0.18)', boxShadow: '0 8px 48px rgba(0,0,0,0.4)' }}>
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.6, backgroundImage: 'radial-gradient(circle,rgba(160,200,120,0.06) 1px,transparent 1px)', backgroundSize: '24px 24px' }} />
        <div style={{ position: 'absolute', top: -80, right: -60, width: 280, height: 280, borderRadius: '50%', background: 'radial-gradient(circle,rgba(160,200,120,0.13),transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -60, left: -40, width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle,rgba(221,235,157,0.07),transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <span style={{ fontSize: 18, lineHeight: 1 }}>🌿</span>
            <span style={{ fontSize: 22, fontWeight: 900, letterSpacing: -0.5, color: '#e8f0d8' }}>AI Reports</span>
            <span style={{ fontSize: 10, fontWeight: 800, background: 'rgba(160,200,120,0.15)', color: '#A0C878', border: '1px solid rgba(160,200,120,0.3)', borderRadius: 8, padding: '3px 9px', letterSpacing: '0.5px' }}>NVIDIA NIM</span>
          </div>
          <p style={{ fontSize: 13, color: 'rgba(160,200,120,0.55)', margin: 0 }}>
            Generate professional financial conversation reports powered by NVIDIA NIM LLM
          </p>
          <div style={{ display: 'flex', gap: 24, marginTop: 16, flexWrap: 'wrap' }}>
            {[
              { val: reports.length,                    label: 'Reports generated' },
              { val: `${days}d`,                        label: 'Current range' },
              { val: Object.values(sections).filter(Boolean).length, label: 'Sections selected' },
            ].map((stat, i, arr) => (
              <React.Fragment key={i}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span style={{ fontSize: 22, fontWeight: 900, color: '#e8f0d8', letterSpacing: -1 }}>{stat.val}</span>
                  <span style={{ fontSize: 11, color: 'rgba(160,200,120,0.45)', fontWeight: 600 }}>{stat.label}</span>
                </div>
                {i < arr.length - 1 && <div style={{ width: 1, background: 'rgba(160,200,120,0.15)', alignSelf: 'stretch', margin: '4px 0' }} />}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 16, alignItems: 'start' }}>

        {/* ── LEFT: Config ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={cs}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <div style={{ width: 32, height: 32, borderRadius: 9, background: 'var(--green-bg)', border: '1px solid var(--green-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Calendar size={15} color="var(--green)" />
              </div>
              <span style={{ fontSize: 14, fontWeight: 800 }}>Report Settings</span>
            </div>

            {/* Time range */}
            <div style={{ marginBottom: 18 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 8 }}>Time Range</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                {[7, 10, 14, 30].map(d => (
                  <button key={d} onClick={() => setDays(d)}
                    style={{ padding: '8px', fontSize: 12, fontWeight: 700, borderRadius: 10, cursor: 'pointer', transition: 'all 0.15s', border: `1px solid ${days === d ? 'var(--green-border)' : 'var(--border)'}`, background: days === d ? 'var(--green-bg)' : 'var(--bg-subtle)', color: days === d ? 'var(--green)' : 'var(--text-muted)' }}>
                    Last {d}d
                  </button>
                ))}
              </div>
            </div>

            {/* Sections */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Sections</label>
                <button onClick={() => setSections(Object.fromEntries(SECTIONS.map(s => [s.key, true])))}
                  style={{ fontSize: 10, fontWeight: 700, color: 'var(--green)', background: 'none', border: 'none', cursor: 'pointer' }}>Select all</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {SECTIONS.map(({ key, label, icon: Icon, tip }) => (
                  <button key={key} onClick={() => toggle(key)} title={tip}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = sections[key] ? 'var(--green)' : 'var(--border-hover)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = sections[key] ? 'var(--green-border)' : 'var(--border)'; }}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, background: sections[key] ? 'var(--green-bg)' : 'var(--bg-subtle)', border: `1px solid ${sections[key] ? 'var(--green-border)' : 'var(--border)'}`, borderRadius: 10, cursor: 'pointer', padding: '9px 12px', textAlign: 'left', transition: 'all 0.15s' }}>
                    {sections[key] ? <CheckSquare size={14} color="var(--green)" /> : <Square size={14} color="var(--text-muted)" />}
                    <Icon size={13} color={sections[key] ? 'var(--green)' : 'var(--text-muted)'} />
                    <span style={{ fontSize: 12, fontWeight: 600, color: sections[key] ? 'var(--text-primary)' : 'var(--text-muted)', flex: 1 }}>{label}</span>
                    <Info size={11} color="var(--text-muted)" style={{ opacity: 0.4 }} title={tip} />
                  </button>
                ))}
              </div>
            </div>

            <button onClick={generate} disabled={generating}
              onMouseEnter={e => { if (!generating) { e.currentTarget.style.transform='translateY(-1px)'; e.currentTarget.style.boxShadow='0 6px 20px rgba(90,158,47,0.4)'; }}}
              onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow=generating?'none':'0 4px 16px rgba(90,158,47,0.3)'; }}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: generating ? 'var(--text-faint)' : 'var(--green)', color: 'var(--text-inverse)', border: 'none', borderRadius: 12, padding: '13px', fontSize: 13, fontWeight: 700, cursor: generating ? 'not-allowed' : 'pointer', boxShadow: generating ? 'none' : '0 4px 16px rgba(90,158,47,0.3)', transition: 'all 0.2s' }}>
              {generating
                ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Generating…</>
                : <><Sparkles size={14} /> Generate Report</>}
            </button>

            {error && (
              <div style={{ marginTop: 12, padding: '10px 14px', background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.2)', borderRadius: 10, fontSize: 12, fontWeight: 600, color: 'var(--accent-red)', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} /> {error}
              </div>
            )}
          </div>

          {/* Past reports list */}
          {reports.length > 0 && (
            <div style={cs}>
              <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Clock size={14} color="var(--green)" /> History
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {reports.map(r => (
                  <button key={r.id} onClick={() => setActiveReport(r.id)}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: activeReport === r.id ? 'var(--green-bg)' : 'var(--bg-subtle)', borderRadius: 10, border: `1px solid ${activeReport === r.id ? 'var(--green-border)' : 'var(--border)'}`, cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s', width: '100%' }}>
                    <FileText size={14} color={activeReport === r.id ? 'var(--green)' : 'var(--text-muted)'} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: activeReport === r.id ? 'var(--green)' : 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.title}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 1 }}>{r.date} · {r.time}</div>
                    </div>
                    <ChevronRight size={12} color="var(--text-muted)" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT: Preview ── */}
        <div style={cs}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: 'var(--green-bg)', border: '1px solid var(--green-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FileText size={15} color="var(--green)" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 800 }}>
                {activeReport ? reports.find(r => r.id === activeReport)?.title : 'Report Preview'}
              </div>
              {activeReport && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>{reports.find(r => r.id === activeReport)?.date}</div>}
            </div>
            {displayMd && (
              <button onClick={() => downloadMd(displayMd, activeReport ? reports.find(r => r.id === activeReport)?.title : `report-${days}days`)}
                onMouseEnter={e => { e.currentTarget.style.background='var(--green)'; e.currentTarget.style.color='var(--text-inverse)'; }}
                onMouseLeave={e => { e.currentTarget.style.background='var(--green-bg)'; e.currentTarget.style.color='var(--green)'; }}
                style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: 'var(--green)', background: 'var(--green-bg)', border: '1px solid var(--green-border)', borderRadius: 9, padding: '7px 14px', cursor: 'pointer', transition: 'all 0.2s' }}>
                <FileDown size={13} /> Download .md
              </button>
            )}
          </div>

          {generating && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0', gap: 16 }}>
              <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'var(--green-bg)', border: '1px solid var(--green-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Loader2 size={22} color="var(--green)" style={{ animation: 'spin 1s linear infinite' }} />
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Generating report…</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', maxWidth: 300 }}>
                NVIDIA NIM is analysing your last {days} days of conversations. This usually takes 10–30 seconds.
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--green)', animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite` }} />
                ))}
              </div>
            </div>
          )}

          {!generating && !displayMd && (
            <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--green-bg)', border: '1px solid var(--green-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
                <Sparkles size={26} color="var(--green)" />
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>Ready to generate</div>
              <div style={{ fontSize: 13, maxWidth: 340, margin: '0 auto', lineHeight: 1.7, color: 'var(--text-muted)' }}>
                Select a time range and sections on the left, then click <strong style={{ color: 'var(--green)' }}>Generate Report</strong>. NVIDIA NIM will create a professional markdown summary of your financial conversations.
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 24, flexWrap: 'wrap' }}>
                {SECTIONS.map(({ label, icon: Icon }) => (
                  <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', background: 'var(--bg-subtle)', border: '1px solid var(--border)', borderRadius: 20, padding: '4px 10px' }}>
                    <Icon size={11} /> {label}
                  </span>
                ))}
              </div>
            </div>
          )}

          {!generating && displayMd && (
            <div style={{ background: 'var(--bg-subtle)', borderRadius: 14, padding: '22px 24px', maxHeight: 620, overflowY: 'auto', border: '1px solid var(--border)' }}>
              <MdPreview text={displayMd} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Reports;
