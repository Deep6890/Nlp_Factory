import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, Globe, Activity, CheckCircle2, TrendingUp, FileText, Loader, Trash2 } from 'lucide-react';
import { getRecording, getRecordingTranscript, deleteRecording } from '../../api/recordings';

const C = { cream2:'#FAF6E9', limelt:'#DDEB9D', green:'#A0C878', greendk:'#7aaa52', text:'#1a2010', textmid:'#4a5a30', textdim:'#8a9a70', shadow:'rgba(100,140,60,0.11)' };
const card = { background:'#fff', border:'1px solid rgba(160,200,120,0.22)', borderRadius:20, padding:'22px 24px', boxShadow:`0 2px 16px ${C.shadow}`, transition:'all 0.25s' };
const hov = { onMouseEnter: e => { e.currentTarget.style.borderColor=C.green; e.currentTarget.style.transform='translateY(-2px)'; }, onMouseLeave: e => { e.currentTarget.style.borderColor='rgba(160,200,120,0.22)'; e.currentTarget.style.transform=''; } };

const RISK_STYLE = {
  HIGH:{ bg:C.text,    color:'#fff',    border:C.text  },
  LOW: { bg:C.limelt,  color:C.greendk, border:C.green },
  MED: { bg:'#fefce8', color:'#92400e', border:'#fde68a' },
};

const SessionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [recording,   setRecording]   = useState(null);
  const [transcript,  setTranscript]  = useState(null);
  const [loadingRec,  setLoadingRec]  = useState(true);
  const [loadingTr,   setLoadingTr]   = useState(true);
  const [error,       setError]       = useState('');
  const [deleting,    setDeleting]    = useState(false);

  // Fetch recording
  useEffect(() => {
    setLoadingRec(true);
    getRecording(id)
      .then(data => setRecording(data.recording ?? data))
      .catch(err  => setError(err.message || 'Could not load recording.'))
      .finally(() => setLoadingRec(false));
  }, [id]);

  // Fetch transcript (non-blocking — may still be processing)
  useEffect(() => {
    setLoadingTr(true);
    getRecordingTranscript(id)
      .then(data => setTranscript(data.transcript ?? data))
      .catch(() => setTranscript(null))   // 404 / processing — just show null
      .finally(() => setLoadingTr(false));
  }, [id]);

  const handleDelete = async () => {
    if (!window.confirm('Delete this recording? This cannot be undone.')) return;
    setDeleting(true);
    try {
      await deleteRecording(id);
      navigate('/dashboard/sessions');
    } catch (err) {
      alert(err.message || 'Delete failed.');
      setDeleting(false);
    }
  };

  const ib = (accent) => ({ width:34, height:34, borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', background:accent?C.limelt:C.cream2, border:`1px solid ${accent?C.green:'rgba(160,200,120,0.2)'}`, color:C.text, flexShrink:0 });

  // ── Loading state ─────────────────────────────────────────────────────────
  if (loadingRec) {
    return (
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:80, gap:12, color:C.textdim, flexDirection:'column' }}>
        <Loader size={20} style={{ animation:'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { to { transform:rotate(360deg); } }`}</style>
        <span style={{ fontSize:13, fontWeight:600 }}>Loading recording…</span>
      </div>
    );
  }

  // ── Error state ───────────────────────────────────────────────────────────
  if (error) {
    return (
      <div style={{ fontFamily:'Inter,sans-serif', display:'flex', flexDirection:'column', gap:16 }}>
        <button onClick={() => navigate('/dashboard/sessions')} style={{ display:'flex', alignItems:'center', gap:7, fontSize:13, fontWeight:700, color:C.textdim, background:'none', border:'none', cursor:'pointer', width:'fit-content' }}
          onMouseEnter={e => e.currentTarget.style.color=C.text} onMouseLeave={e => e.currentTarget.style.color=C.textdim}>
          <ArrowLeft size={15} /> Back to Sessions
        </button>
        <div style={{ background:'#fef2f2', border:'1px solid #fecaca', color:'#dc2626', borderRadius:14, padding:'16px 20px', fontSize:13, fontWeight:600 }}>{error}</div>
      </div>
    );
  }

  if (!recording) return null;

  // Map backend fields to display values
  const name     = recording.filename || recording.originalname || 'Recording';
  const date     = recording.createdAt
    ? new Date(recording.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
    : '—';
  const lang     = recording.language || 'Unknown';
  const dur      = recording.duration
    ? `${Math.floor(recording.duration / 60)}m ${recording.duration % 60}s`
    : '—';
  const riskKey  = recording.riskLevel || 'LOW';
  const rs       = RISK_STYLE[riskKey] || RISK_STYLE.LOW;

  // Transcript display
  const trStatus  = transcript?.status;
  const trText    = transcript?.text || transcript?.content || '';
  const trKeywords = transcript?.keywords || [];
  const trSummary  = transcript?.summary || '';
  const trInsights = transcript?.insights || null;

  // Insight badge helpers
  const riskBadge = (level) => {
    const map = { high: { bg:'#fef2f2', color:'#dc2626', border:'#fecaca' }, medium: { bg:'#fefce8', color:'#92400e', border:'#fde68a' }, low: { bg:C.limelt, color:C.greendk, border:C.green } };
    return map[(level||'low').toLowerCase()] || map.low;
  };

  return (
    <div style={{ fontFamily:'Inter,sans-serif', display:'flex', flexDirection:'column', gap:18, color:C.text }}>

      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <button onClick={() => navigate('/dashboard/sessions')}
          style={{ display:'flex', alignItems:'center', gap:7, fontSize:13, fontWeight:700, color:C.textdim, background:'none', border:'none', cursor:'pointer' }}
          onMouseEnter={e => e.currentTarget.style.color=C.text} onMouseLeave={e => e.currentTarget.style.color=C.textdim}>
          <ArrowLeft size={15} /> Back to Sessions
        </button>
        <button onClick={handleDelete} disabled={deleting}
          style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, fontWeight:700, color:'#dc2626', background:'#fef2f2', border:'1px solid #fecaca', borderRadius:10, padding:'7px 14px', cursor: deleting ? 'not-allowed' : 'pointer', opacity: deleting ? 0.6 : 1 }}>
          <Trash2 size={13} /> {deleting ? 'Deleting…' : 'Delete'}
        </button>
      </div>

      {/* BENTO — 4 cols */}
      <div style={{ display:'grid', gridTemplateColumns:'1.8fr 2.2fr 2.2fr 1.8fr', gap:14 }}>

        {/* Header — full width */}
        <div style={{ ...card, gridColumn:'1/-1', display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:16 }} {...hov}>
          <div style={{ flex:1, minWidth:220 }}>
            <h1 style={{ fontSize:'clamp(18px,2.5vw,26px)', fontWeight:900, color:C.text, letterSpacing:-1, marginBottom:10 }}>{name}</h1>
            <div style={{ display:'flex', gap:18, flexWrap:'wrap' }}>
              {[{Icon:Clock,v:date},{Icon:Globe,v:lang},{Icon:Activity,v:dur}].map(({Icon,v})=>(
                <span key={v} style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, fontWeight:600, color:C.textdim }}><Icon size={13}/>{v}</span>
              ))}
            </div>
          </div>
          <span style={{ fontSize:11, fontWeight:800, letterSpacing:'0.5px', textTransform:'uppercase', padding:'8px 18px', borderRadius:12, background:rs.bg, color:rs.color, border:`1px solid ${rs.border}` }}>
            {riskKey} RISK
          </span>
        </div>

        {/* Summary / Transcript — 2 cols */}
        <div style={{ ...card, gridColumn:'1/3' }} {...hov}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
            <div style={ib(false)}><FileText size={15}/></div>
            <span style={{ fontSize:13, fontWeight:800 }}>Transcript</span>
          </div>

          {loadingTr ? (
            <div style={{ display:'flex', alignItems:'center', gap:8, color:C.textdim }}>
              <Loader size={14} style={{ animation:'spin 1s linear infinite' }} />
              <span style={{ fontSize:12 }}>Loading transcript…</span>
            </div>
          ) : trStatus === 'processing' || !transcript ? (
            <div style={{ background:C.cream2, border:'1px solid rgba(160,200,120,0.3)', borderRadius:10, padding:'12px 16px', fontSize:13, color:C.textmid, fontWeight:600 }}>
              ⚙ Transcript is being generated — check back shortly.
            </div>
          ) : (
            <>
              {trSummary && <p style={{ fontSize:13, color:C.textmid, lineHeight:1.7, marginBottom:12 }}>{trSummary}</p>}
              {trText && (
                <div style={{ fontSize:12, color:C.textmid, lineHeight:1.8, maxHeight:200, overflowY:'auto', whiteSpace:'pre-wrap' }}>
                  {trText}
                </div>
              )}
              {!trSummary && !trText && (
                <p style={{ fontSize:13, color:C.textdim }}>No transcript content available.</p>
              )}
            </>
          )}
        </div>

        {/* Key Points / Keywords — 2 cols */}
        <div style={{ ...card, gridColumn:'3/-1' }} {...hov}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
            <div style={ib(true)}><TrendingUp size={15}/></div>
            <span style={{ fontSize:13, fontWeight:800 }}>Key Points</span>
          </div>
          {trKeywords.length > 0 ? (
            <ul style={{ display:'flex', flexDirection:'column', gap:8, listStyle:'none' }}>
              {trKeywords.map((kw, i) => (
                <li key={i} style={{ display:'flex', alignItems:'flex-start', gap:9 }}>
                  <span style={{ width:6, height:6, borderRadius:'50%', background:C.green, flexShrink:0, marginTop:5 }}/>
                  <span style={{ fontSize:12, fontWeight:600, color:C.textmid }}>{typeof kw === 'string' ? kw : kw.word || kw.text || JSON.stringify(kw)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p style={{ fontSize:13, color:C.textdim }}>
              {loadingTr ? 'Loading…' : 'Keywords will appear once transcript is ready.'}
            </p>
          )}
        </div>

        {/* AI Insights panel — full width, only when insights exist */}
        {trInsights && (
          <div style={{ ...card, gridColumn:'1/-1' }} {...hov}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
              <div style={ib(true)}><CheckCircle2 size={15}/></div>
              <span style={{ fontSize:13, fontWeight:800 }}>AI Insights</span>
              {trInsights.finance_detected && (
                <span style={{ fontSize:10, fontWeight:800, background:C.limelt, color:C.greendk, border:`1px solid ${C.green}`, borderRadius:8, padding:'2px 8px', letterSpacing:'0.4px' }}>FINANCE DETECTED</span>
              )}
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(140px,1fr))', gap:12 }}>
              {[
                { label:'Sentiment', value: trInsights.sentiment_label || '—', score: trInsights.sentiment_score != null ? `(${trInsights.sentiment_score > 0 ? '+' : ''}${Number(trInsights.sentiment_score).toFixed(2)})` : '' },
                { label:'Emotion',   value: trInsights.emotion   || '—' },
                { label:'Intent',    value: trInsights.intent    || '—' },
                { label:'Domain',    value: trInsights.domain    || '—' },
                { label:'Urgency',   value: trInsights.urgency   || '—', badge: riskBadge(trInsights.urgency) },
                { label:'Risk Level',value: trInsights.risk_level|| '—', badge: riskBadge(trInsights.risk_level) },
                { label:'Language',  value: trInsights.source_language || '—' },
                ...(trInsights.amount != null ? [{ label:'Amount', value: String(trInsights.amount) }] : []),
              ].map(({ label, value, score, badge }) => (
                <div key={label} style={{ background:C.cream2, border:'1px solid rgba(160,200,120,0.2)', borderRadius:12, padding:'10px 14px' }}>
                  <div style={{ fontSize:10, fontWeight:700, color:C.textdim, textTransform:'uppercase', letterSpacing:'0.4px', marginBottom:5 }}>{label}</div>
                  {badge ? (
                    <span style={{ fontSize:12, fontWeight:800, background:badge.bg, color:badge.color, border:`1px solid ${badge.border}`, borderRadius:7, padding:'2px 8px' }}>{value}</span>
                  ) : (
                    <div style={{ fontSize:13, fontWeight:700, color:C.text }}>{value} {score && <span style={{ fontSize:11, color:C.textdim }}>{score}</span>}</div>
                  )}
                </div>
              ))}
            </div>
            {trInsights.entities?.length > 0 && (
              <div style={{ marginTop:14 }}>
                <div style={{ fontSize:10, fontWeight:700, color:C.textdim, textTransform:'uppercase', letterSpacing:'0.4px', marginBottom:8 }}>Entities</div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                  {trInsights.entities.map((e, i) => (
                    <span key={i} style={{ fontSize:11, fontWeight:700, background:'#fff', border:`1px solid rgba(160,200,120,0.3)`, borderRadius:8, padding:'3px 10px', color:C.textmid }}>
                      {typeof e === 'string' ? e : e.text || e.value || JSON.stringify(e)}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Recording metadata — full width */}
        <div style={{ ...card, gridColumn:'1/-1', display:'flex', gap:24, flexWrap:'wrap' }} {...hov}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={ib(false)}><Activity size={15}/></div>
            <span style={{ fontSize:13, fontWeight:800 }}>Recording Info</span>
          </div>
          <div style={{ display:'flex', gap:24, flexWrap:'wrap', flex:1 }}>
            {[
              { label:'File', value: recording.filename || '—' },
              { label:'Size', value: recording.size ? `${(recording.size / 1024 / 1024).toFixed(2)} MB` : '—' },
              { label:'Mode', value: recording.mode || '—' },
              { label:'Uploaded', value: date },
            ].map(({ label, value }) => (
              <div key={label}>
                <div style={{ fontSize:10, fontWeight:700, color:C.textdim, textTransform:'uppercase', letterSpacing:'0.4px', marginBottom:4 }}>{label}</div>
                <div style={{ fontSize:13, fontWeight:600, color:C.text }}>{value}</div>
              </div>
            ))}
          </div>
          {recording.cloudUrl && (
            <a href={recording.cloudUrl} target="_blank" rel="noopener noreferrer"
              style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, fontWeight:700, color:C.greendk, textDecoration:'none', background:C.limelt, border:`1px solid ${C.green}`, borderRadius:10, padding:'7px 14px' }}>
              ▶ Play Audio
            </a>
          )}
        </div>

      </div>
    </div>
  );
};

export default SessionDetail;
