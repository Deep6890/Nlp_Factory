import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Mic, Square, Pause, Play, Upload, X, FileAudio, Loader2,
  CheckCircle2, AlertCircle, Clock, Trash2, Eye, Pencil,
  RefreshCw, Zap, Cpu, RotateCcw, Gauge, Lock, Sparkles, Globe,
} from 'lucide-react';
import { uploadRecording, listRecordings, getRecordingTranscript, deleteRecording, retryRecording, getFastLimitStatus } from '../api/recordings';

/* ── Design tokens — CSS vars for light/dark ── */
const C = {
  green:   'var(--green)',
  greendk: 'var(--green-dk)',
  text:    'var(--text-primary)',
  textmid: 'var(--text-secondary)',
  textdim: 'var(--text-muted)',
  neg:     'var(--accent-red)',
  amber:   'var(--accent-amber)',
  purple:  'var(--accent-purple)',
};

const card = {
  background: 'var(--bg-card)',
  border: '1px solid var(--border)',
  borderRadius: 20,
  padding: '24px 26px',
  boxShadow: 'var(--shadow-md)',
  transition: 'background-color 0.25s ease, border-color 0.25s ease',
};

const fmt     = s => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;
const fmtSize = b => b < 1048576 ? (b/1024).toFixed(1)+' KB' : (b/1048576).toFixed(1)+' MB';
const fmtDate = d => d ? new Date(d).toLocaleString('en-IN',{dateStyle:'medium',timeStyle:'short'}) : '—';

/* ── Sub-components ─────────────────────────────────────────────────────────── */
const ConfBar = ({ value }) => {
  const pct   = value != null ? Math.round(value * 100) : null;
  const color = pct == null ? 'var(--text-muted)' : pct >= 80 ? 'var(--green)' : pct >= 50 ? 'var(--accent-amber)' : 'var(--accent-red)';
  return (
    <div style={{ display:'flex', alignItems:'center', gap:6 }}>
      <div style={{ flex:1, height:3, background:'var(--bg-subtle)', borderRadius:4, overflow:'hidden' }}>
        {pct != null && <div style={{ width:`${pct}%`, height:'100%', background:color, borderRadius:4, transition:'width 0.6s ease' }} />}
      </div>
      <span style={{ fontSize:11, fontWeight:700, color, minWidth:28 }}>{pct != null ? `${pct}%` : '—'}</span>
    </div>
  );
};

const StatusBadge = ({ status }) => {
  const map = {
    done:       { bg:'rgba(5,150,105,0.1)',  color:'var(--accent-green)', border:'rgba(5,150,105,0.25)',  label:'Done' },
    processing: { bg:'rgba(217,119,6,0.1)',  color:'var(--accent-amber)', border:'rgba(217,119,6,0.25)',  label:'Processing' },
    pending:    { bg:'var(--bg-subtle)',     color:'var(--text-muted)',   border:'var(--border)',          label:'Pending' },
    failed:     { bg:'rgba(220,38,38,0.1)', color:'var(--accent-red)',   border:'rgba(220,38,38,0.25)',  label:'Failed' },
  };
  const s = map[status] || map.pending;
  return (
    <span style={{ fontSize:10, fontWeight:800, background:s.bg, color:s.color, border:`1px solid ${s.border}`, borderRadius:8, padding:'3px 10px', display:'inline-flex', alignItems:'center', gap:4, letterSpacing:'0.3px' }}>
      {status === 'processing' && <Loader2 size={9} style={{ animation:'spin 1s linear infinite' }} />}
      {s.label}
    </span>
  );
};

const RiskBadge = ({ level }) => {
  const l = (level || 'low').toLowerCase();
  const map = {
    high:   ['rgba(220,38,38,0.1)',  'var(--accent-red)',   'rgba(220,38,38,0.25)'],
    medium: ['rgba(217,119,6,0.1)',  'var(--accent-amber)', 'rgba(217,119,6,0.25)'],
    low:    ['var(--green-bg)',      'var(--green)',        'var(--green-border)'],
  };
  const [bg, color, border] = map[l] || map.low;
  return <span style={{ fontSize:10, fontWeight:800, background:bg, color, border:`1px solid ${border}`, borderRadius:8, padding:'3px 10px', textTransform:'uppercase', letterSpacing:'0.5px' }}>{l}</span>;
};

/* ── Mode Selector ──────────────────────────────────────────────────────────── */
const ModeSelector = ({ mode, setMode, fastLimit }) => {
  const canFast = fastLimit?.canUse !== false;
  const used    = fastLimit?.used ?? 0;
  const limit   = fastLimit?.limit ?? 5;

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
      <div style={{ fontSize:11, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'1px', marginBottom:2 }}>
        Transcription Mode
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>

        {/* Fast — Sarvam */}
        <button onClick={() => canFast && setMode('fast')} style={{
          borderRadius:14, padding:'16px 18px', textAlign:'left',
          transition:'all 0.2s', position:'relative', overflow:'hidden',
          opacity: canFast ? 1 : 0.4,
          cursor: canFast ? 'pointer' : 'not-allowed',
          /* SELECTED: solid amber border + tinted bg. UNSELECTED: flat card, no border pop */
          background: mode === 'fast' ? 'var(--bg-card)' : 'var(--bg-card)',
          border: mode === 'fast'
            ? '2px solid #D97706'
            : '2px solid var(--border)',
          boxShadow: mode === 'fast'
            ? '0 0 0 3px rgba(217,119,6,0.12), 0 4px 16px rgba(217,119,6,0.12)'
            : 'none',
        }}>
          {/* selected top bar */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <div style={{
                width:32, height:32, borderRadius:9, display:'flex', alignItems:'center', justifyContent:'center',
                background: mode === 'fast' ? 'rgba(217,119,6,0.15)' : 'var(--bg-subtle)',
                border: mode === 'fast' ? '1px solid rgba(217,119,6,0.35)' : '1px solid var(--border)',
              }}>
                <Zap size={15} color={mode === 'fast' ? '#D97706' : 'var(--text-muted)'} />
              </div>
              <span style={{ fontSize:14, fontWeight:800, color: mode === 'fast' ? '#D97706' : 'var(--text-muted)' }}>Fast</span>
            </div>
            {!canFast
              ? <Lock size={12} color="var(--text-muted)" />
              : mode === 'fast'
                ? <span style={{ fontSize:9, fontWeight:800, background:'rgba(217,119,6,0.15)', color:'#D97706', border:'1px solid rgba(217,119,6,0.3)', borderRadius:6, padding:'2px 7px' }}>SELECTED</span>
                : null
            }
          </div>
          <div style={{ fontSize:11, color: mode === 'fast' ? 'var(--text-secondary)' : 'var(--text-muted)', lineHeight:1.6, marginBottom:10 }}>
            Sarvam AI cloud · ~5 sec<br />11 Indian languages
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <div style={{ flex:1, height:3, background:'var(--border)', borderRadius:3, overflow:'hidden' }}>
              <div style={{ width:`${(used/limit)*100}%`, height:'100%', background: canFast ? '#D97706' : 'var(--accent-red)', borderRadius:3 }} />
            </div>
            <span style={{ fontSize:10, fontWeight:700, color: canFast ? '#D97706' : 'var(--accent-red)', whiteSpace:'nowrap' }}>
              {used}/{limit} today
            </span>
          </div>
        </button>

        {/* Accurate — Local Whisper */}
        <button onClick={() => setMode('slow')} style={{
          borderRadius:14, padding:'16px 18px', textAlign:'left',
          transition:'all 0.2s', position:'relative', overflow:'hidden',
          cursor:'pointer',
          background: 'var(--bg-card)',
          border: mode === 'slow'
            ? '2px solid var(--green)'
            : '2px solid var(--border)',
          boxShadow: mode === 'slow'
            ? '0 0 0 3px rgba(90,158,47,0.1), 0 4px 16px rgba(90,158,47,0.1)'
            : 'none',
        }}>
          {mode === 'slow' && null}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <div style={{
                width:32, height:32, borderRadius:9, display:'flex', alignItems:'center', justifyContent:'center',
                background: mode === 'slow' ? 'var(--green-bg)' : 'var(--bg-subtle)',
                border: mode === 'slow' ? '1px solid var(--green-border)' : '1px solid var(--border)',
              }}>
                <Cpu size={15} color={mode === 'slow' ? 'var(--green)' : 'var(--text-muted)'} />
              </div>
              <span style={{ fontSize:14, fontWeight:800, color: mode === 'slow' ? 'var(--green)' : 'var(--text-muted)' }}>Accurate</span>
            </div>
            {mode === 'slow'
              ? <span style={{ fontSize:9, fontWeight:800, background:'var(--green-bg)', color:'var(--green)', border:'1px solid var(--green-border)', borderRadius:6, padding:'2px 7px' }}>SELECTED</span>
              : <span style={{ fontSize:9, fontWeight:700, background:'var(--bg-subtle)', color:'var(--text-muted)', border:'1px solid var(--border)', borderRadius:6, padding:'2px 7px' }}>UNLIMITED</span>
            }
          </div>
          <div style={{ fontSize:11, color: mode === 'slow' ? 'var(--text-secondary)' : 'var(--text-muted)', lineHeight:1.6, marginBottom:10 }}>
            Local Whisper · 1–5 min<br />Deep analysis · GPU accelerated
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
            <Cpu size={10} color={mode === 'slow' ? 'var(--green)' : 'var(--text-muted)'} />
            <span style={{ fontSize:10, fontWeight:700, color: mode === 'slow' ? 'var(--green)' : 'var(--text-muted)' }}>No daily limit</span>
          </div>
        </button>

      </div>
    </div>
  );
};

/* ── Recording Row ──────────────────────────────────────────────────────────── */
const RecordingRow = ({ rec, onDelete, onView, onEdit, onRetry }) => {
  const [tr, setTr] = useState(null);

  useEffect(() => {
    let interval;
    const load = async () => {
      try {
        const d = await getRecordingTranscript(rec._id);
        const t = d.transcript ?? d;
        setTr(t);
        if (t.status === 'done' || t.status === 'failed') clearInterval(interval);
      } catch { setTr(null); }
    };
    load();
    interval = setInterval(load, 8000);
    return () => clearInterval(interval);
  }, [rec._id]);

  const pipelineMode = tr?.insights?.pipeline_mode || tr?.pipeline_mode;

  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 110px 100px 70px 80px auto', alignItems:'center', gap:12, padding:'13px 18px', borderBottom:'1px solid var(--border)', transition:'background 0.15s' }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-subtle)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>

      <div style={{ minWidth:0 }}>
        <div style={{ fontSize:13, fontWeight:700, color:'var(--text-primary)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{rec.filename || 'Recording'}</div>
        <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:2, display:'flex', alignItems:'center', gap:6 }}>
          <Clock size={10} /> {fmtDate(rec.createdAt)}
          {rec.size && <span>· {fmtSize(rec.size)}</span>}
          {pipelineMode && (
            <span style={{ fontSize:9, fontWeight:800, background: pipelineMode === 'fast' ? 'rgba(217,119,6,0.1)' : 'var(--green-bg)', color: pipelineMode === 'fast' ? 'var(--accent-amber)' : 'var(--green)', border:`1px solid ${pipelineMode === 'fast' ? 'rgba(217,119,6,0.25)' : 'var(--green-border)'}`, borderRadius:5, padding:'1px 6px', textTransform:'uppercase' }}>
              {pipelineMode === 'fast' ? '⚡ Fast' : '🔬 Accurate'}
            </span>
          )}
        </div>
      </div>

      <ConfBar value={tr?.confidence} />
      <StatusBadge status={tr?.status || 'pending'} />
      <RiskBadge level={tr?.insights?.risk_level} />

      <div style={{ fontSize:11, color:C.textdim, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
        {tr?.status === 'done' && tr?.language
          ? tr.language.toUpperCase()
          : tr?.status === 'processing' || tr?.status === 'pending'
            ? <span style={{ color:'var(--text-faint)', fontStyle:'italic' }}>processing…</span>
            : '—'}
      </div>

      <div style={{ display:'flex', gap:5 }}>
        <button onClick={() => onView(rec._id)} title="View"
          style={{ width:28, height:28, borderRadius:8, border:'1px solid var(--border)', background:'var(--bg-subtle)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--text-secondary)' }}>
          <Eye size={12} />
        </button>
        {tr?.status === 'done' && (
          <button onClick={() => onEdit(rec._id)} title="Edit insights"
            style={{ width:28, height:28, borderRadius:8, border:'1px solid var(--green-border)', background:'var(--green-bg)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--green)' }}>
            <Pencil size={12} />
          </button>
        )}
        {(tr?.status === 'failed' || tr?.status === 'pending') && (
          <button onClick={() => onRetry(rec._id)} title="Retry"
            style={{ width:28, height:28, borderRadius:8, border:'1px solid rgba(217,119,6,0.3)', background:'rgba(217,119,6,0.08)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--accent-amber)' }}>
            <RotateCcw size={12} />
          </button>
        )}
        <button onClick={() => onDelete(rec._id)} title="Delete"
          style={{ width:28, height:28, borderRadius:8, border:'1px solid rgba(220,38,38,0.25)', background:'rgba(220,38,38,0.06)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--accent-red)' }}>
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  );
};

/* ── Main Component ─────────────────────────────────────────────────────────── */
const LiveDetection = () => {
  const navigate = useNavigate();

  const [recStatus, setRecStatus] = useState('idle');
  const [elapsed, setElapsed]     = useState(0);
  const [bars, setBars]           = useState(Array(22).fill(4));
  const mrRef     = useRef(null);
  const chunksRef = useRef([]);
  const timerRef  = useRef(null);

  const [file, setFile]           = useState(null);
  const [dragOver, setDragOver]   = useState(false);
  const [uploading, setUploading] = useState(false);
  const [result, setResult]       = useState(null);
  const fileRef = useRef(null);

  const [mode, setMode]           = useState('slow');
  const [language, setLanguage]   = useState('');        // '' = auto-detect
  const [fastLimit, setFastLimit] = useState(null);

  const [recordings, setRecordings]   = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [aiLogs, setAiLogs]           = useState([]);

  // Load fast limit status
  useEffect(() => {
    getFastLimitStatus()
      .then(d => setFastLimit(d.status ?? d))
      .catch(() => setFastLimit({ used: 0, limit: 5, remaining: 5, canUse: true }));
  }, []);

  // Auto-switch to slow if fast limit exhausted
  useEffect(() => {
    if (fastLimit && !fastLimit.canUse && mode === 'fast') setMode('slow');
  }, [fastLimit, mode]);

  useEffect(() => {
    if (recStatus === 'recording') timerRef.current = setInterval(() => setElapsed(e => e+1), 1000);
    else clearInterval(timerRef.current);
    return () => clearInterval(timerRef.current);
  }, [recStatus]);

  useEffect(() => {
    if (recStatus !== 'recording') { setBars(Array(22).fill(4)); return; }
    const id = setInterval(() => setBars(Array(22).fill(0).map(() => Math.floor(Math.random()*48)+6)), 100);
    return () => clearInterval(id);
  }, [recStatus]);

  const loadList = useCallback(async () => {
    setLoadingList(true);
    try {
      const d = await listRecordings({ limit: 50 });
      setRecordings(d.audios || []);
    } catch { setRecordings([]); }
    finally { setLoadingList(false); }
  }, []);

  useEffect(() => { loadList(); }, [loadList]);

  const startRec = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      mrRef.current = mr; chunksRef.current = [];
      mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setFile(new File([blob], `live-${Date.now()}.webm`, { type: 'audio/webm' }));
        setRecStatus('idle');
        stream.getTracks().forEach(t => t.stop());
      };
      mr.start(200);
      setRecStatus('recording'); setElapsed(0);
    } catch { alert('Microphone access required.'); }
  };
  const pauseRec  = () => { mrRef.current?.pause();  setRecStatus('paused'); };
  const resumeRec = () => { mrRef.current?.resume(); setRecStatus('recording'); };
  const stopRec   = () => { mrRef.current?.state !== 'inactive' ? mrRef.current.stop() : setRecStatus('idle'); };

  const onFileSelect = e => { const f = e.target.files?.[0]; if (f?.type.startsWith('audio/')) setFile(f); };
  const onDrop = e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files?.[0]; if (f?.type.startsWith('audio/')) setFile(f); };
  const removeFile = () => { setFile(null); setResult(null); if (fileRef.current) fileRef.current.value = ''; };

  const analyze = async () => {
    if (!file || uploading) return;
    setUploading(true); setResult(null);
    const modeLabel = mode === 'fast' ? '⚡ Sarvam AI (Fast)' : '🔬 Local Whisper (Accurate)';
    setAiLogs([{ time: new Date().toLocaleTimeString(), msg: `Uploading audio · Mode: ${modeLabel}` }]);
    try {
      await uploadRecording(file, { mode, language: language || undefined, recordedAt: new Date().toISOString() });
      setResult({ ok: true, msg: `Stored in Supabase. AI pipeline (${mode}) is processing.` });
      setAiLogs(prev => [...prev,
        { time: new Date().toLocaleTimeString(), msg: '✓ Audio stored in Supabase Storage' },
        { time: new Date().toLocaleTimeString(), msg: `⚙ ${modeLabel} pipeline spawned — processing...` },
        { time: new Date().toLocaleTimeString(), msg: mode === 'fast' ? 'Expected: ~5–10 seconds' : 'Expected: 1–5 minutes (local model)' },
      ]);
      if (mode === 'fast') {
        setFastLimit(prev => prev ? { ...prev, used: prev.used + 1, remaining: Math.max(0, prev.remaining - 1), canUse: false } : prev);
      }
      setFile(null); if (fileRef.current) fileRef.current.value = '';
      await loadList();
    } catch (err) {
      const isFastLimit = err.message?.includes('FAST_LIMIT');
      setResult({ ok: false, msg: isFastLimit ? 'Fast mode limit reached for today. Switched to Accurate mode.' : (err.message || 'Upload failed.') });
      if (isFastLimit) setMode('slow');
      setAiLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), msg: `Error: ${err.message}`, error: true }]);
    } finally { setUploading(false); }
  };

  const onDelete = async id => {
    if (!window.confirm('Delete this recording?')) return;
    try { await deleteRecording(id); await loadList(); }
    catch (err) { alert(err.message || 'Delete failed.'); }
  };

  const onRetry = async id => {
    try {
      setAiLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), msg: `Retrying AI for ${id.slice(0,8)}... (mode: ${mode})` }]);
      await retryRecording(id);
      await loadList();
    } catch (err) {
      setAiLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), msg: `Error: ${err.message}`, error: true }]);
    }
  };

  const doneCount = recordings.filter(r => r.status === 'done').length;
  const procCount = recordings.filter(r => r.status === 'processing' || r.status === 'pending').length;

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:22, color:'var(--text-primary)' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}} @keyframes gPulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>

      {/* ── Header ── */}
      <div style={{ background:'#0f1a0a', borderRadius:18, padding:'26px 28px 22px', position:'relative', overflow:'hidden', border:'1px solid rgba(160,200,120,0.18)', boxShadow:'0 8px 48px rgba(0,0,0,0.4)' }}>
        <div style={{ position:'absolute', inset:0, pointerEvents:'none', opacity:0.6, backgroundImage:'radial-gradient(circle,rgba(160,200,120,0.06) 1px,transparent 1px)', backgroundSize:'24px 24px' }} />
        <div style={{ position:'absolute', top:-80, right:-60, width:280, height:280, borderRadius:'50%', background:'radial-gradient(circle,rgba(160,200,120,0.13),transparent 70%)', pointerEvents:'none' }} />
        <div style={{ position:'absolute', bottom:-60, left:-40, width:200, height:200, borderRadius:'50%', background:'radial-gradient(circle,rgba(221,235,157,0.07),transparent 70%)', pointerEvents:'none' }} />
        <div style={{ position:'relative', zIndex:1, display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:12 }}>
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6 }}>
              <span style={{ fontSize:18, lineHeight:1 }}>🌿</span>
              <span style={{ fontSize:22, fontWeight:900, letterSpacing:-0.5, color:'#e8f0d8' }}>Live Detection</span>
              <span style={{ fontSize:10, fontWeight:800, background:'rgba(160,200,120,0.15)', color:'#A0C878', border:'1px solid rgba(160,200,120,0.3)', borderRadius:8, padding:'3px 9px', letterSpacing:'0.5px' }}>STUDIO</span>
              <span style={{ display:'flex', alignItems:'center', gap:5, fontSize:11, fontWeight:700, color:'rgba(160,200,120,0.7)' }}>
                <span style={{ width:7, height:7, borderRadius:'50%', background:'#a0e878', animation:'gPulse 2s ease-in-out infinite', display:'inline-block' }} />
                Live
              </span>
            </div>
            <p style={{ fontSize:13, color:'rgba(160,200,120,0.5)', margin:0 }}>Record or upload audio — AI transcription with financial insights</p>
          </div>
          <button onClick={loadList} style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, fontWeight:700, background:'rgba(160,200,120,0.1)', border:'1px solid rgba(160,200,120,0.25)', borderRadius:10, color:'rgba(160,200,120,0.85)', padding:'8px 14px', cursor:'pointer' }}>
            <RefreshCw size={13} /> Refresh
          </button>
        </div>
      </div>

      {/* ── Stats Row ── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12 }}>
        {[
          { icon: Mic,         label:'Total Recordings', value: recordings.length,  sub:'uploaded',          color:'var(--green)',         accent: true },
          { icon: Cpu,         label:'Processing',       value: procCount,           sub:'in pipeline',       color:'var(--accent-amber)',  accent: false },
          { icon: CheckCircle2,label:'Completed',        value: doneCount,           sub:'with insights',     color:'var(--accent-green)',  accent: true },
          { icon: Gauge,       label:'Fast Used Today',  value: `${fastLimit?.used ?? 0}/${fastLimit?.limit ?? 1}`, sub: fastLimit?.canUse ? 'quota available' : 'limit reached', color: fastLimit?.canUse ? 'var(--accent-amber)' : 'var(--accent-red)', accent: false },
        ].map((s, i) => (
          <div key={i} style={{ ...card, padding:'18px 20px', display:'flex', flexDirection:'column', gap:6, position:'relative', overflow:'hidden', transition:'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='var(--shadow-md)'; e.currentTarget.style.borderColor='var(--border-hover)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow='var(--shadow-md)'; e.currentTarget.style.borderColor='var(--border)'; }}>
            {s.accent && <div style={{ position:'absolute', top:0, right:0, width:70, height:70, background:`radial-gradient(circle, ${s.color}22 0%, transparent 70%)`, pointerEvents:'none' }} />}
            <div style={{ width:34, height:34, borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', background:`${s.color}18`, border:`1px solid ${s.color}30`, color:s.color, marginBottom:2 }}>
              <s.icon size={16} />
            </div>
            <div style={{ fontSize:26, fontWeight:900, color:s.color, letterSpacing:-1, fontVariantNumeric:'tabular-nums' }}>{s.value}</div>
            <div style={{ fontSize:13, fontWeight:700, color:'var(--text-secondary)' }}>{s.label}</div>
            <div style={{ fontSize:11, color:'var(--text-muted)', fontWeight:500 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* ── Capture Panel ── */}
      <div style={card}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:22 }}>
          <div style={{ width:36, height:36, borderRadius:10, background:'rgba(160,200,120,0.1)', border:'1px solid rgba(160,200,120,0.25)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Sparkles size={16} color={C.green} />
          </div>
          <div>
            <div style={{ fontSize:15, fontWeight:800, color:'var(--text-primary)' }}>Capture &amp; Analyze</div>
            <div style={{ fontSize:11, color:'var(--text-muted)' }}>Choose mode, then record or upload</div>
          </div>
        </div>

        <div style={{ marginBottom:22 }}>
          <ModeSelector mode={mode} setMode={setMode} fastLimit={fastLimit} />
        </div>

        {/* Language selector */}
        <div style={{ marginBottom:22 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
            <div style={{ width:28, height:28, borderRadius:8, background:'var(--bg-subtle)', border:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Globe size={13} color="var(--text-muted)" />
            </div>
            <div>
              <div style={{ fontSize:12, fontWeight:700, color:'var(--text-primary)' }}>Language</div>
              <div style={{ fontSize:10, color:'var(--text-muted)' }}>Leave on Auto to let AI detect — or pick your language for better accuracy</div>
            </div>
          </div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
            {[
              { code:'',   label:'Auto',     sub:'Detect' },
              { code:'hi', label:'Hindi',    sub:'हि' },
              { code:'gu', label:'Gujarati', sub:'ગુ' },
              { code:'ta', label:'Tamil',    sub:'த' },
              { code:'te', label:'Telugu',   sub:'తె' },
              { code:'bn', label:'Bengali',  sub:'বা' },
              { code:'mr', label:'Marathi',  sub:'म' },
              { code:'kn', label:'Kannada',  sub:'ಕ' },
              { code:'ml', label:'Malayalam',sub:'മ' },
              { code:'pa', label:'Punjabi',  sub:'ਪ' },
              { code:'ur', label:'Urdu',     sub:'اردو' },
              { code:'en', label:'English',  sub:'EN' },
            ].map(({ code, label, sub }) => {
              const active = language === code;
              return (
                <button key={code} onClick={() => setLanguage(code)} style={{
                  display:'flex', alignItems:'center', gap:5,
                  fontSize:11, fontWeight: active ? 800 : 600,
                  padding:'6px 13px', borderRadius:10, cursor:'pointer',
                  background: active ? 'var(--bg-card)' : 'transparent',
                  border: active ? '1.5px solid var(--green)' : '1.5px solid var(--border)',
                  color: active ? 'var(--green)' : 'var(--text-muted)',
                  boxShadow: active ? '0 0 0 2px rgba(90,158,47,0.1)' : 'none',
                  transition:'all 0.15s',
                }}>
                  <span style={{ fontSize:10, opacity: active ? 1 : 0.4, fontWeight:700 }}>{sub}</span>
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:18 }}>
          {/* Live Recording */}
          <div style={{ background:'var(--bg-subtle)', borderRadius:16, padding:18, border:'1px solid var(--border)' }}>
            <div style={{ fontSize:11, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:16 }}>Live Recording</div>
            <div style={{ display:'flex', alignItems:'center', gap:2, height:52, justifyContent:'center', marginBottom:14 }}>
              {bars.map((h,i) => (
                <div key={i} style={{ width:3, height:h, borderRadius:3, background: recStatus==='recording' ? 'var(--green)' : recStatus==='paused' ? 'var(--accent-amber)' : 'var(--border-strong)', transition:'height 0.08s ease' }} />
              ))}
            </div>
            {recStatus !== 'idle' && (
              <div style={{ textAlign:'center', fontSize:24, fontWeight:900, letterSpacing:-1, marginBottom:12, color:'var(--text-primary)', fontVariantNumeric:'tabular-nums' }}>{fmt(elapsed)}</div>
            )}
            <div style={{ textAlign:'center', marginBottom:16 }}>
              <span style={{ fontSize:11, fontWeight:700, padding:'4px 14px', borderRadius:20,
                background: recStatus==='recording' ? 'rgba(5,150,105,0.1)' : recStatus==='paused' ? 'rgba(217,119,6,0.1)' : 'var(--bg-subtle)',
                color: recStatus==='recording' ? 'var(--accent-green)' : recStatus==='paused' ? 'var(--accent-amber)' : 'var(--text-muted)',
                border: `1px solid ${recStatus==='recording' ? 'rgba(5,150,105,0.25)' : recStatus==='paused' ? 'rgba(217,119,6,0.25)' : 'var(--border)'}`,
                animation: recStatus==='recording' ? 'pulse 2s ease-in-out infinite' : 'none',
              }}>
                {recStatus==='recording' ? '● Recording' : recStatus==='paused' ? '⏸ Paused' : '○ Ready'}
              </span>
            </div>
            <div style={{ display:'flex', gap:8, justifyContent:'center' }}>
              {recStatus==='idle' && (
                <button onClick={startRec} style={{ display:'flex', alignItems:'center', gap:6, background:'var(--green)', color:'var(--text-inverse)', border:'none', borderRadius:12, padding:'10px 22px', fontSize:13, fontWeight:700, cursor:'pointer', boxShadow:'0 4px 16px rgba(90,158,47,0.3)' }}>
                  <Mic size={14} /> Start
                </button>
              )}
              {recStatus==='recording' && (<>
                <button onClick={pauseRec} style={{ display:'flex', alignItems:'center', gap:6, background:'var(--bg-subtle)', border:'1px solid var(--border)', borderRadius:12, padding:'9px 16px', fontSize:13, fontWeight:600, cursor:'pointer', color:'var(--text-primary)' }}>
                  <Pause size={13} fill="currentColor" /> Pause
                </button>
                <button onClick={stopRec} style={{ display:'flex', alignItems:'center', gap:6, background:'rgba(220,38,38,0.08)', border:'1px solid rgba(220,38,38,0.25)', borderRadius:12, padding:'9px 16px', fontSize:13, fontWeight:600, cursor:'pointer', color:'var(--accent-red)' }}>
                  <Square size={13} fill="currentColor" /> Stop
                </button>
              </>)}
              {recStatus==='paused' && (<>
                <button onClick={resumeRec} style={{ display:'flex', alignItems:'center', gap:6, background:'var(--green-bg)', border:'1px solid var(--green-border)', borderRadius:12, padding:'9px 16px', fontSize:13, fontWeight:700, cursor:'pointer', color:'var(--green)' }}>
                  <Play size={13} fill="currentColor" /> Resume
                </button>
                <button onClick={stopRec} style={{ display:'flex', alignItems:'center', gap:6, background:'rgba(220,38,38,0.08)', border:'1px solid rgba(220,38,38,0.25)', borderRadius:12, padding:'9px 16px', fontSize:13, fontWeight:600, cursor:'pointer', color:'var(--accent-red)' }}>
                  <Square size={13} fill="currentColor" /> Stop
                </button>
              </>)}
            </div>
          </div>

          {/* File Upload */}
          <div style={{ background:'var(--bg-subtle)', borderRadius:16, padding:18, border:'1px solid var(--border)' }}>
            <div style={{ fontSize:11, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:16 }}>Upload File</div>
            <input ref={fileRef} type="file" accept="audio/*" onChange={onFileSelect} style={{ display:'none' }} />
            {!file ? (
              <div onClick={() => fileRef.current?.click()}
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
                style={{ border:`2px dashed ${dragOver ? 'var(--green)' : 'var(--border-strong)'}`, borderRadius:12, padding:'32px 16px', textAlign:'center', cursor:'pointer', background: dragOver ? 'var(--green-bg)' : 'transparent', transition:'all 0.2s' }}>
                <Upload size={22} color="var(--text-muted)" style={{ marginBottom:10 }} />
                <div style={{ fontSize:13, fontWeight:600, color:'var(--text-secondary)' }}>Drop audio here</div>
                <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:4 }}>MP3 · WAV · M4A · WebM · FLAC</div>
              </div>
            ) : (
              <div style={{ background:'var(--green-bg)', border:'1px solid var(--green-border)', borderRadius:12, padding:'14px 16px' }}>
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
                  <FileAudio size={18} color="var(--green)" />
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:13, fontWeight:700, color:'var(--text-primary)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{file.name}</div>
                    <div style={{ fontSize:11, color:'var(--text-muted)' }}>{fmtSize(file.size)}</div>
                  </div>
                  <button onClick={removeFile} disabled={uploading} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', padding:2 }}><X size={14} /></button>
                </div>

                {/* Inline mode picker */}
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:12 }}>
                  <button onClick={() => fastLimit?.canUse !== false && setMode('fast')}
                    style={{ borderRadius:10, padding:'10px 12px', textAlign:'left', cursor: fastLimit?.canUse !== false ? 'pointer' : 'not-allowed', opacity: fastLimit?.canUse !== false ? 1 : 0.4, background:'var(--bg-page)', border: mode === 'fast' ? '2px solid #D97706' : '2px solid var(--border)', transition:'all 0.15s' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4 }}>
                      <Zap size={13} color={mode === 'fast' ? '#D97706' : 'var(--text-muted)'} />
                      <span style={{ fontSize:12, fontWeight:800, color: mode === 'fast' ? '#D97706' : 'var(--text-muted)' }}>Fast</span>
                      {fastLimit?.canUse === false && <Lock size={10} color="var(--text-muted)" />}
                    </div>
                    <div style={{ fontSize:10, color:'var(--text-muted)', lineHeight:1.5 }}>Sarvam AI · ~5s<br />{fastLimit?.used ?? 0}/{fastLimit?.limit ?? 5} used today</div>
                  </button>
                  <button onClick={() => setMode('slow')}
                    style={{ borderRadius:10, padding:'10px 12px', textAlign:'left', cursor:'pointer', background:'var(--bg-page)', border: mode === 'slow' ? '2px solid var(--green)' : '2px solid var(--border)', transition:'all 0.15s' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4 }}>
                      <Cpu size={13} color={mode === 'slow' ? 'var(--green)' : 'var(--text-muted)'} />
                      <span style={{ fontSize:12, fontWeight:800, color: mode === 'slow' ? 'var(--green)' : 'var(--text-muted)' }}>Accurate</span>
                    </div>
                    <div style={{ fontSize:10, color:'var(--text-muted)', lineHeight:1.5 }}>Local Whisper · 1–5 min<br />No daily limit</div>
                  </button>
                </div>

                <button onClick={analyze} disabled={uploading} style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:8, background: uploading ? 'var(--bg-subtle)' : mode === 'fast' ? 'rgba(217,119,6,0.1)' : 'var(--green)', color: uploading ? 'var(--text-muted)' : mode === 'fast' ? 'var(--accent-amber)' : 'var(--text-inverse)', border: mode === 'fast' ? '1px solid rgba(217,119,6,0.3)' : 'none', borderRadius:11, padding:'11px', fontSize:13, fontWeight:700, cursor: uploading ? 'not-allowed' : 'pointer', transition:'all 0.2s' }}>
                  {uploading ? <><Loader2 size={13} style={{ animation:'spin 1s linear infinite' }} /> Processing…</> : mode === 'fast' ? <><Zap size={13} /> Analyze with Fast</> : <><Cpu size={13} /> Analyze with Accurate</>}
                </button>
              </div>
            )}
            {result && (
              <div style={{ marginTop:10, padding:'10px 14px', borderRadius:10, fontSize:12, fontWeight:600, background: result.ok ? 'rgba(5,150,105,0.08)' : 'rgba(220,38,38,0.08)', border:`1px solid ${result.ok ? 'rgba(5,150,105,0.2)' : 'rgba(220,38,38,0.2)'}`, color: result.ok ? 'var(--accent-green)' : 'var(--accent-red)', display:'flex', alignItems:'flex-start', gap:7 }}>
                {result.ok ? <CheckCircle2 size={14} style={{ flexShrink:0, marginTop:1 }} /> : <AlertCircle size={14} style={{ flexShrink:0, marginTop:1 }} />}
                {result.msg}
              </div>
            )}
          </div>
        </div>

        {file && file.name.startsWith('live-') && (
          <div style={{ marginTop:14, padding:'14px 16px', background:'rgba(5,150,105,0.08)', border:'1px solid rgba(5,150,105,0.2)', borderRadius:12, fontSize:13, fontWeight:600, color:'var(--accent-green)', display:'flex', alignItems:'center', gap:10 }}>
            <CheckCircle2 size={15} /> Recording ready — select mode above and click Analyze
          </div>
        )}
      </div>

      {/* ── Recordings List ── */}
      <div style={card}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:32, height:32, borderRadius:9, background:'var(--green-bg)', border:'1px solid var(--green-border)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Mic size={15} color="var(--green)" />
            </div>
            <div>
              <div style={{ fontSize:15, fontWeight:800, color:'var(--text-primary)' }}>Recordings</div>
              <div style={{ fontSize:11, color:'var(--text-muted)' }}>{recordings.length} total · {doneCount} completed · {procCount} in pipeline</div>
            </div>
          </div>
          <button onClick={loadList} style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, fontWeight:700, color:'var(--text-secondary)', background:'var(--bg-subtle)', border:'1px solid var(--border)', borderRadius:10, padding:'6px 14px', cursor:'pointer' }}>
            <RefreshCw size={13} /> Refresh
          </button>
        </div>
        {loadingList ? (
          <div style={{ display:'flex', alignItems:'center', gap:10, padding:'32px 0', justifyContent:'center', color:'var(--text-muted)' }}>
            <Loader2 size={16} style={{ animation:'spin 1s linear infinite' }} />
            <span style={{ fontSize:13, fontWeight:600 }}>Loading…</span>
          </div>
        ) : recordings.length === 0 ? (
          <div style={{ textAlign:'center', padding:'40px 0', color:'var(--text-muted)', fontSize:13, fontWeight:600 }}>
            No recordings yet — record or upload audio above
          </div>
        ) : (
          <div style={{ borderRadius:14, overflow:'hidden', border:'1px solid var(--border)' }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 110px 100px 70px 80px auto', gap:12, padding:'10px 18px', background:'var(--bg-subtle)', borderBottom:'1px solid var(--border)' }}>
              {['Recording','Confidence','Status','Risk','Language','Actions'].map(h => (
                <div key={h} style={{ fontSize:10, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.5px' }}>{h}</div>
              ))}
            </div>
            {recordings.map(rec => (
              <RecordingRow key={rec._id} rec={rec} onDelete={onDelete}
                onView={id => navigate(`/dashboard/sessions/${id}`)}
                onEdit={id => navigate(`/dashboard/sessions/${id}/edit-insights`)}
                onRetry={onRetry} />
            ))}
          </div>
        )}
      </div>

      {/* ── AI Pipeline Tracker ── */}
      {aiLogs.length > 0 && (
        <div style={card}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <Cpu size={15} color="var(--green)" />
              <span style={{ fontSize:14, fontWeight:800, color:'var(--text-primary)' }}>Pipeline Tracker</span>
            </div>
            <button onClick={() => setAiLogs([])} style={{ fontSize:11, fontWeight:700, color:'var(--text-muted)', background:'none', border:'none', cursor:'pointer' }}>Clear</button>
          </div>
          <div style={{ background:'#080a06', borderRadius:12, padding:'14px 16px', fontFamily:'monospace', fontSize:12, maxHeight:180, overflowY:'auto', display:'flex', flexDirection:'column', gap:5, border:'1px solid rgba(160,200,120,0.15)' }}>
            {aiLogs.map((log, i) => (
              <div key={i} style={{ display:'flex', gap:10, color: log.error ? '#f87171' : '#86efac' }}>
                <span style={{ color:'#4b5563', flexShrink:0 }}>{log.time}</span>
                <span>{log.msg}</span>
              </div>
            ))}
            <div style={{ color:'#374151', fontSize:11, marginTop:4 }}>Full logs in backend terminal · Status auto-updates every 8s</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveDetection;


