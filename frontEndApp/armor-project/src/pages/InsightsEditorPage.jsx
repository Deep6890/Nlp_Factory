import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, RotateCcw, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { getRecordingTranscript } from '../api/recordings';
import { updateInsights } from '../api/transcripts';

const cs = { background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:14, padding:'24px 26px', boxShadow:'var(--shadow-sm)' };
const ib = { width:'100%', padding:'9px 13px', borderRadius:10, border:'1px solid var(--border)', fontSize:13, fontFamily:'inherit', color:'var(--text-primary)', background:'var(--bg-input)', outline:'none', boxSizing:'border-box', transition:'border-color 0.2s' };

const FIELDS = [
  { key:'intent',           label:'Intent',           type:'text',     tip:'What the user was trying to accomplish' },
  { key:'domain',           label:'Domain',           type:'text',     tip:'Topic category (finance, health, legal…)' },
  { key:'summary',          label:'Summary',          type:'textarea', tip:'AI-generated summary of the conversation' },
  { key:'emotion',          label:'Emotion',          type:'text',     tip:'Primary emotion detected' },
  { key:'urgency',          label:'Urgency',          type:'select',   options:['low','medium','high'], tip:'How urgent the topic is' },
  { key:'risk_level',       label:'Risk Level',       type:'select',   options:['low','medium','high'], tip:'Financial risk level detected' },
  { key:'sentiment_label',  label:'Sentiment',        type:'select',   options:['positive','neutral','negative'], tip:'Overall emotional tone' },
  { key:'sentiment_score',  label:'Sentiment Score',  type:'number',   tip:'Score from -1 (very negative) to +1 (very positive)' },
  { key:'amount',           label:'Amount',           type:'text',     tip:'Monetary amount mentioned (if any)' },
  { key:'english_text',     label:'English Text',     type:'textarea', tip:'Translated English version' },
  { key:'original_text',    label:'Original Text',    type:'textarea', tip:'Original transcript in source language' },
  { key:'finance_detected', label:'Finance Detected', type:'boolean',  tip:'Whether financial content was detected' },
];

const InsightsEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [transcript, setTranscript] = useState(null);
  const [fields, setFields]         = useState({});
  const [rawJson, setRawJson]       = useState('');
  const [mode, setMode]             = useState('form');
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [result, setResult]         = useState(null);
  const [jsonError, setJsonError]   = useState('');

  useEffect(() => {
    setLoading(true);
    getRecordingTranscript(id)
      .then(data => {
        const tr = data.transcript ?? data;
        setTranscript(tr);
        const ins = tr.insights || {};
        setFields(ins);
        setRawJson(JSON.stringify(ins, null, 2));
      })
      .catch(err => setResult({ success: false, message: err.message }))
      .finally(() => setLoading(false));
  }, [id]);

  const handleFieldChange = (key, value) => {
    setFields(prev => {
      const updated = { ...prev, [key]: value };
      setRawJson(JSON.stringify(updated, null, 2));
      return updated;
    });
  };

  const handleRawChange = (val) => {
    setRawJson(val);
    setJsonError('');
    try { setFields(JSON.parse(val)); } catch { setJsonError('Invalid JSON — fix before saving'); }
  };

  const handleReset = () => {
    const ins = transcript?.insights || {};
    setFields(ins);
    setRawJson(JSON.stringify(ins, null, 2));
    setJsonError('');
    setResult(null);
  };

  const handleSave = async () => {
    if (jsonError) return;
    setSaving(true); setResult(null);
    try {
      await updateInsights(transcript._id, fields);
      setResult({ success: true, message: 'Insights saved successfully.' });
    } catch (err) {
      setResult({ success: false, message: err.message || 'Save failed.' });
    } finally { setSaving(false); }
  };

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:80, gap:12, color:'var(--text-muted)', flexDirection:'column' }}>
      <Loader size={20} style={{ animation:'spin 1s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <span style={{ fontSize:13, fontWeight:600 }}>Loading transcript…</span>
    </div>
  );

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:18, color:'var(--text-primary)' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:12 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <button onClick={() => navigate(`/dashboard/sessions/${id}`)}
            style={{ display:'flex', alignItems:'center', gap:7, fontSize:13, fontWeight:700, color:'var(--text-muted)', background:'none', border:'none', cursor:'pointer' }}
            onMouseEnter={e => e.currentTarget.style.color='var(--text-primary)'}
            onMouseLeave={e => e.currentTarget.style.color='var(--text-muted)'}>
            <ArrowLeft size={15} /> Back to Session
          </button>
          <h1 style={{ fontSize:'clamp(18px,2.5vw,24px)', fontWeight:900, letterSpacing:-0.8, margin:0 }}>Edit Insights</h1>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <div style={{ display:'flex', background:'var(--bg-subtle)', border:'1px solid var(--border)', borderRadius:12, overflow:'hidden' }}>
            {['form','raw'].map(m => (
              <button key={m} onClick={() => setMode(m)}
                style={{ padding:'8px 16px', fontSize:12, fontWeight:700, border: mode===m ? '1px solid var(--green-border)' : '1px solid transparent', cursor:'pointer', background: mode===m ? 'var(--green-bg)' : 'transparent', color: mode===m ? 'var(--green)' : 'var(--text-muted)', borderRadius:9, transition:'all 0.15s' }}>
                {m === 'form' ? 'Form' : 'Raw JSON'}
              </button>
            ))}
          </div>
          <button onClick={handleReset}
            style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, fontWeight:700, color:'var(--text-secondary)', background:'var(--bg-subtle)', border:'1px solid var(--border)', borderRadius:12, padding:'8px 14px', cursor:'pointer' }}>
            <RotateCcw size={13} /> Reset
          </button>
          <button onClick={handleSave} disabled={saving || !!jsonError}
            style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, fontWeight:700, color:'var(--text-inverse)', background: saving||jsonError ? 'var(--text-faint)' : 'var(--green)', border:'none', borderRadius:12, padding:'8px 18px', cursor: saving||jsonError ? 'not-allowed' : 'pointer' }}>
            {saving ? <Loader size={13} style={{ animation:'spin 1s linear infinite' }} /> : <Save size={13} />}
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>

      {result && (
        <div style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 18px', borderRadius:12, fontSize:13, fontWeight:600, background: result.success ? 'rgba(5,150,105,0.08)' : 'rgba(220,38,38,0.08)', border:`1px solid ${result.success ? 'rgba(5,150,105,0.2)' : 'rgba(220,38,38,0.2)'}`, color: result.success ? 'var(--accent-green)' : 'var(--accent-red)' }}>
          {result.success ? <CheckCircle size={15} /> : <AlertCircle size={15} />}
          {result.message}
        </div>
      )}

      {mode === 'form' && (
        <div style={cs}>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:16 }}>
            {FIELDS.map(({ key, label, type, options, tip }) => (
              <div key={key}>
                <label style={{ display:'block', fontSize:11, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:6 }}>
                  {label} {tip && <span title={tip} style={{ cursor:'help', opacity:0.5 }}>ⓘ</span>}
                </label>
                {type === 'textarea' ? (
                  <textarea value={fields[key]||''} onChange={e => handleFieldChange(key, e.target.value)} rows={3} style={{ ...ib, resize:'vertical' }} />
                ) : type === 'select' ? (
                  <select value={fields[key]||''} onChange={e => handleFieldChange(key, e.target.value)} style={ib}>
                    <option value="">— select —</option>
                    {options.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                ) : type === 'boolean' ? (
                  <select value={String(fields[key]??'')} onChange={e => handleFieldChange(key, e.target.value==='true')} style={ib}>
                    <option value="">— select —</option>
                    <option value="true">true</option>
                    <option value="false">false</option>
                  </select>
                ) : (
                  <input type={type==='number'?'number':'text'} value={fields[key]??''}
                    onChange={e => handleFieldChange(key, type==='number' ? Number(e.target.value) : e.target.value)}
                    style={ib} />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {mode === 'raw' && (
        <div style={cs}>
          {jsonError && (
            <div style={{ fontSize:12, fontWeight:700, color:'var(--accent-red)', marginBottom:10, display:'flex', alignItems:'center', gap:6 }}>
              <AlertCircle size={13} /> {jsonError}
            </div>
          )}
          <textarea value={rawJson} onChange={e => handleRawChange(e.target.value)} spellCheck={false}
            style={{ ...ib, minHeight:480, fontFamily:'monospace', resize:'vertical', lineHeight:1.6, borderColor: jsonError ? 'var(--accent-red)' : 'var(--border)' }} />
          <p style={{ fontSize:11, color:'var(--text-muted)', marginTop:8 }}>Edit raw JSON. Changes sync to form view automatically.</p>
        </div>
      )}
    </div>
  );
};

export default InsightsEditor;


