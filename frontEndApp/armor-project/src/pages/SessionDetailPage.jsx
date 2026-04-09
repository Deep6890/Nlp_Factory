import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Clock, Globe, Activity, CheckCircle2,
  TrendingUp, FileText, Loader, Trash2, Edit3, Mic,
  AlertTriangle, Brain, DollarSign, Zap,
} from 'lucide-react';
import { getRecording, getRecordingTranscript, deleteRecording } from '../api/recordings';

const cs = { background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:18, padding:'22px 24px', boxShadow:'var(--shadow-sm)', transition:'all 0.2s ease' };

const RISK_BADGE = {
  high:   { bg:'rgba(220,38,38,0.1)',  color:'var(--accent-red)',   border:'rgba(220,38,38,0.25)',  label:'HIGH RISK' },
  medium: { bg:'rgba(217,119,6,0.1)',  color:'var(--accent-amber)', border:'rgba(217,119,6,0.25)',  label:'MED RISK' },
  low:    { bg:'var(--green-bg)',      color:'var(--green)',        border:'var(--green-border)',   label:'LOW RISK' },
};

const InfoChip = ({ icon: Icon, label, value }) => (
  <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
    <div style={{ fontSize:10, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.5px', display:'flex', alignItems:'center', gap:4 }}>
      <Icon size={10} /> {label}
    </div>
    <div style={{ fontSize:13, fontWeight:700, color:'var(--text-primary)' }}>{value || '—'}</div>
  </div>
);

const InsightBadge = ({ label, value, level }) => {
  const r = RISK_BADGE[(level||'low').toLowerCase()] || RISK_BADGE.low;
  return (
    <div style={{ background:'var(--bg-subtle)', border:'1px solid var(--border)', borderRadius:12, padding:'10px 14px' }}>
      <div style={{ fontSize:10, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.4px', marginBottom:5 }}>{label}</div>
      {level ? (
        <span style={{ fontSize:12, fontWeight:800, background:r.bg, color:r.color, border:`1px solid ${r.border}`, borderRadius:7, padding:'2px 9px' }}>{value}</span>
      ) : (
        <div style={{ fontSize:13, fontWeight:700, color:'var(--text-primary)', textTransform:'capitalize' }}>{value}</div>
      )}
    </div>
  );
};

const SessionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [recording,  setRecording]  = useState(null);
  const [transcript, setTranscript] = useState(null);
  const [loadingRec, setLoadingRec] = useState(true);
  const [loadingTr,  setLoadingTr]  = useState(true);
  const [error,      setError]      = useState('');
  const [deleting,   setDeleting]   = useState(false);

  useEffect(() => {
    setLoadingRec(true);
    getRecording(id)
      .then(data => setRecording(data.recording ?? data))
      .catch(err  => setError(err.message || 'Could not load recording.'))
      .finally(() => setLoadingRec(false));
  }, [id]);

  useEffect(() => {
    let interval;
    const load = () => {
      setLoadingTr(true);
      getRecordingTranscript(id)
        .then(data => {
          const t = data.transcript ?? data;
          setTranscript(t);
          if (t.status === 'done' || t.status === 'failed') clearInterval(interval);
        })
        .catch(() => setTranscript(null))
        .finally(() => setLoadingTr(false));
    };
    load();
    interval = setInterval(() => {
      getRecordingTranscript(id)
        .then(data => {
          const t = data.transcript ?? data;
          setTranscript(t);
          if (t.status === 'done' || t.status === 'failed') clearInterval(interval);
        })
        .catch(() => {});
    }, 8000);
    return () => clearInterval(interval);
  }, [id]);

  const handleDelete = async () => {
    if (!window.confirm('Delete this recording? This cannot be undone.')) return;
    setDeleting(true);
    try { await deleteRecording(id); navigate('/dashboard/sessions'); }
    catch (err) { alert(err.message || 'Delete failed.'); setDeleting(false); }
  };

  if (loadingRec) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:80, gap:12, color:'var(--text-muted)', flexDirection:'column' }}>
      <Loader size={20} style={{ animation:'spin 1s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <span style={{ fontSize:13, fontWeight:600 }}>Loading recording…</span>
    </div>
  );

  if (error) return (
    <div style={{ display:'flex', flexDirection:'column', gap:16, color:'var(--text-primary)' }}>
      <button onClick={() => navigate('/dashboard/sessions')}
        style={{ display:'flex', alignItems:'center', gap:7, fontSize:13, fontWeight:700, color:'var(--text-muted)', background:'none', border:'none', cursor:'pointer', width:'fit-content' }}>
        <ArrowLeft size={15} /> Back to Sessions
      </button>
      <div style={{ background:'rgba(220,38,38,0.08)', border:'1px solid rgba(220,38,38,0.2)', color:'var(--accent-red)', borderRadius:14, padding:'16px 20px', fontSize:13, fontWeight:600 }}>{error}</div>
    </div>
  );

  if (!recording) return null;

  const name  = recording.filename || 'Recording';
  const date  = recording.createdAt ? new Date(recording.createdAt).toLocaleString('en-IN', { dateStyle:'medium', timeStyle:'short' }) : '—';
  const dur   = recording.duration ? `${Math.floor(recording.duration/60)}m ${recording.duration%60}s` : '—';
  const ins   = transcript?.insights || null;
  const risk  = (ins?.risk_level || 'low').toLowerCase();
  const rb    = RISK_BADGE[risk] || RISK_BADGE.low;

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:18, color:'var(--text-primary)' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* Nav row */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:10 }}>
        <button onClick={() => navigate('/dashboard/sessions')}
          style={{ display:'flex', alignItems:'center', gap:7, fontSize:13, fontWeight:700, color:'var(--text-muted)', background:'none', border:'none', cursor:'pointer' }}
          onMouseEnter={e => e.currentTarget.style.color='var(--text-primary)'}
          onMouseLeave={e => e.currentTarget.style.color='var(--text-muted)'}>
          <ArrowLeft size={15} /> Back to Sessions
        </button>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={() => navigate(`/dashboard/sessions/${id}/edit-insights`)}
            style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, fontWeight:700, color:'var(--green)', background:'var(--green-bg)', border:'1px solid var(--green-border)', borderRadius:10, padding:'7px 14px', cursor:'pointer' }}>
            <Edit3 size={13} /> Edit Insights
          </button>
          <button onClick={handleDelete} disabled={deleting}
            style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, fontWeight:700, color:'var(--accent-red)', background:'rgba(220,38,38,0.08)', border:'1px solid rgba(220,38,38,0.2)', borderRadius:10, padding:'7px 14px', cursor: deleting ? 'not-allowed' : 'pointer', opacity: deleting ? 0.6 : 1 }}>
            <Trash2 size={13} /> {deleting ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>

      {/* Header card */}
      <div style={{ ...cs, display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:16 }}>
        <div style={{ flex:1, minWidth:220 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
            <div style={{ width:40, height:40, borderRadius:12, background:'var(--green-bg)', border:'1px solid var(--green-border)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <Mic size={18} color="var(--green)" />
            </div>
            <h1 style={{ fontSize:'clamp(18px,2.5vw,24px)', fontWeight:900, color:'var(--text-primary)', letterSpacing:-0.8, margin:0 }}>{name}</h1>
          </div>
          <div style={{ display:'flex', gap:20, flexWrap:'wrap' }}>
            <InfoChip icon={Clock}  label="Recorded" value={date} />
            <InfoChip icon={Globe}  label="Language" value={(transcript?.language || '—').toUpperCase()} />
            <InfoChip icon={Activity} label="Duration" value={dur} />
          </div>
        </div>
        <span style={{ fontSize:11, fontWeight:800, letterSpacing:'0.5px', textTransform:'uppercase', padding:'8px 18px', borderRadius:12, background:rb.bg, color:rb.color, border:`1px solid ${rb.border}`, flexShrink:0 }}>
          {rb.label}
        </span>
      </div>

      {/* Main grid */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>

        {/* Transcript */}
        <div style={cs}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
            <div style={{ width:32, height:32, borderRadius:9, background:'var(--bg-subtle)', border:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <FileText size={15} color="var(--text-secondary)" />
            </div>
            <span style={{ fontSize:14, fontWeight:800 }}>Transcript</span>
            {transcript?.status === 'processing' && (
              <span style={{ fontSize:10, fontWeight:800, background:'rgba(217,119,6,0.1)', color:'var(--accent-amber)', border:'1px solid rgba(217,119,6,0.25)', borderRadius:7, padding:'2px 8px', display:'flex', alignItems:'center', gap:4 }}>
                <Loader size={9} style={{ animation:'spin 1s linear infinite' }} /> Processing
              </span>
            )}
          </div>
          {loadingTr ? (
            <div style={{ display:'flex', alignItems:'center', gap:8, color:'var(--text-muted)' }}>
              <Loader size={14} style={{ animation:'spin 1s linear infinite' }} />
              <span style={{ fontSize:12 }}>Loading transcript…</span>
            </div>
          ) : transcript?.status === 'processing' || !transcript ? (
            <div style={{ background:'var(--bg-subtle)', border:'1px solid var(--border)', borderRadius:10, padding:'12px 16px', fontSize:13, color:'var(--text-secondary)', fontWeight:600 }}>
              ⚙ Transcript is being generated — check back shortly.
            </div>
          ) : (
            <>
              {transcript.summary && <p style={{ fontSize:13, color:'var(--text-secondary)', lineHeight:1.7, marginBottom:12 }}>{transcript.summary}</p>}
              {transcript.text && (
                <div style={{ fontSize:12, color:'var(--text-secondary)', lineHeight:1.8, maxHeight:220, overflowY:'auto', whiteSpace:'pre-wrap', background:'var(--bg-subtle)', borderRadius:10, padding:'12px 14px' }}>
                  {transcript.text}
                </div>
              )}
              {!transcript.summary && !transcript.text && (
                <p style={{ fontSize:13, color:'var(--text-muted)' }}>No transcript content available.</p>
              )}
            </>
          )}
        </div>

        {/* Keywords */}
        <div style={cs}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
            <div style={{ width:32, height:32, borderRadius:9, background:'var(--green-bg)', border:'1px solid var(--green-border)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <TrendingUp size={15} color="var(--green)" />
            </div>
            <span style={{ fontSize:14, fontWeight:800 }}>Key Points</span>
          </div>
          {(transcript?.keywords || []).length > 0 ? (
            <ul style={{ display:'flex', flexDirection:'column', gap:8, listStyle:'none' }}>
              {(transcript.keywords || []).map((kw, i) => (
                <li key={i} style={{ display:'flex', alignItems:'flex-start', gap:9 }}>
                  <span style={{ width:6, height:6, borderRadius:'50%', background:'var(--green)', flexShrink:0, marginTop:5 }} />
                  <span style={{ fontSize:12, fontWeight:600, color:'var(--text-secondary)' }}>
                    {typeof kw === 'string' ? kw : kw.word || kw.text || JSON.stringify(kw)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p style={{ fontSize:13, color:'var(--text-muted)' }}>
              {loadingTr ? 'Loading…' : 'Keywords will appear once transcript is ready.'}
            </p>
          )}
        </div>
      </div>

      {/* AI Insights */}
      {ins && (
        <div style={cs}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16, flexWrap:'wrap' }}>
            <div style={{ width:32, height:32, borderRadius:9, background:'var(--green-bg)', border:'1px solid var(--green-border)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Brain size={15} color="var(--green)" />
            </div>
            <span style={{ fontSize:14, fontWeight:800 }}>AI Insights</span>
            {ins.finance_detected && (
              <span style={{ fontSize:10, fontWeight:800, background:'var(--green-bg)', color:'var(--green)', border:'1px solid var(--green-border)', borderRadius:8, padding:'2px 9px', letterSpacing:'0.4px' }}>
                <DollarSign size={9} style={{ display:'inline', marginRight:3 }} />FINANCE DETECTED
              </span>
            )}
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(140px,1fr))', gap:10 }}>
            <InsightBadge label="Sentiment"  value={ins.sentiment_label || '—'} />
            <InsightBadge label="Emotion"    value={ins.emotion || '—'} />
            <InsightBadge label="Intent"     value={ins.intent || '—'} />
            <InsightBadge label="Domain"     value={ins.domain || '—'} />
            <InsightBadge label="Urgency"    value={ins.urgency || '—'}    level={ins.urgency} />
            <InsightBadge label="Risk Level" value={ins.risk_level || '—'} level={ins.risk_level} />
            {ins.amount != null && <InsightBadge label="Amount" value={String(ins.amount)} />}
            {ins.sentiment_score != null && (
              <InsightBadge label="Sent. Score" value={`${ins.sentiment_score > 0 ? '+' : ''}${Number(ins.sentiment_score).toFixed(2)}`} />
            )}
          </div>
          {ins.entities?.length > 0 && (
            <div style={{ marginTop:14 }}>
              <div style={{ fontSize:10, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.4px', marginBottom:8 }}>Entities</div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                {ins.entities.map((e, i) => (
                  <span key={i} style={{ fontSize:11, fontWeight:700, background:'var(--bg-subtle)', border:'1px solid var(--border)', borderRadius:8, padding:'3px 10px', color:'var(--text-secondary)' }}>
                    {typeof e === 'string' ? e : e.text || e.value || JSON.stringify(e)}
                  </span>
                ))}
              </div>
            </div>
          )}
          {ins.summary && (
            <div style={{ marginTop:14, background:'var(--bg-subtle)', borderRadius:12, padding:'12px 16px', fontSize:13, color:'var(--text-secondary)', lineHeight:1.7, borderLeft:'3px solid var(--green)' }}>
              <div style={{ fontSize:10, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.4px', marginBottom:6 }}>Summary</div>
              {ins.summary}
            </div>
          )}
        </div>
      )}

      {/* Recording metadata */}
      <div style={{ ...cs, display:'flex', gap:24, flexWrap:'wrap', alignItems:'center' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:32, height:32, borderRadius:9, background:'var(--bg-subtle)', border:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Activity size={15} color="var(--text-secondary)" />
          </div>
          <span style={{ fontSize:14, fontWeight:800 }}>Recording Info</span>
        </div>
        <div style={{ display:'flex', gap:24, flexWrap:'wrap', flex:1 }}>
          {[
            { label:'File',     value: recording.filename || '—' },
            { label:'Size',     value: recording.size ? `${(recording.size/1024/1024).toFixed(2)} MB` : '—' },
            { label:'Uploaded', value: date },
          ].map(({ label, value }) => (
            <div key={label}>
              <div style={{ fontSize:10, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.4px', marginBottom:4 }}>{label}</div>
              <div style={{ fontSize:13, fontWeight:600, color:'var(--text-primary)' }}>{value}</div>
            </div>
          ))}
        </div>
        {recording.storageUrl && (
          <a href={recording.storageUrl} target="_blank" rel="noopener noreferrer"
            style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, fontWeight:700, color:'var(--green)', textDecoration:'none', background:'var(--green-bg)', border:'1px solid var(--green-border)', borderRadius:10, padding:'7px 14px' }}>
            ▶ Play Audio
          </a>
        )}
      </div>
    </div>
  );
};

export default SessionDetail;


