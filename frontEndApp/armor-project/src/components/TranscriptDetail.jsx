import React, { useState, useMemo } from 'react';
import { ArrowLeft, Clock, Bell, BellOff, Search, Edit3, Save, X, Plus, Trash2, RefreshCw } from 'lucide-react';
import { useData } from '../context/DataContext';

const cs = { background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:14, padding:'16px 18px', boxShadow:'var(--shadow-sm)' };

const SENT_STYLE = {
  positive: { bg:'rgba(90,158,47,0.1)',  color:'var(--green)',        border:'var(--green-border)' },
  negative: { bg:'rgba(220,38,38,0.08)', color:'var(--accent-red)',   border:'rgba(220,38,38,0.2)' },
  neutral:  { bg:'var(--bg-subtle)',     color:'var(--text-muted)',   border:'var(--border)' },
  mixed:    { bg:'rgba(124,58,237,0.08)',color:'var(--accent-purple)',border:'rgba(124,58,237,0.2)' },
};
const ROLE_COLOR = { agent:'#5A9E2F', customer:'#D97706', analyst:'#7C3AED' };
const TAG_COLOR  = {
  URGENCY:'#DC2626', COMMITMENT:'#5A9E2F', OBJECTION:'#D97706',
  QUESTION:'#7C3AED', AGREEMENT:'#0891B2', RISK_MENTION:'#DC2626',
  REMINDER_REQUEST:'#D97706', CLARIFICATION:'#6B7280', PRICING_TALK:'#5A9E2F',
  REGULATORY:'#D97706', FOLLOW_UP:'#7C3AED',
};

const TranscriptDetail = ({ transcriptId, onBack }) => {
  const { transcripts, resolveReminder } = useData();
  const transcript = useMemo(() => transcripts.find(t => t._id === transcriptId), [transcripts, transcriptId]);

  const [search, setSearch]           = useState('');
  const [editMode, setEditMode]       = useState(false);
  const [editForm, setEditForm]       = useState(null);
  const [localReminders, setLocalReminders] = useState({});

  if (!transcript) return (
    <div style={{ padding:40, textAlign:'center', color:'var(--text-muted)' }}>
      <div style={{ fontSize:13, fontWeight:600 }}>Transcript not found.</div>
      <button onClick={onBack} style={{ marginTop:16, fontSize:13, fontWeight:700, color:'var(--green)', background:'var(--green-bg)', border:'1px solid var(--green-border)', borderRadius:10, padding:'8px 18px', cursor:'pointer' }}>← Back</button>
    </div>
  );

  const startEdit = () => {
    setEditForm({
      sessionId: transcript.sessionId,
      participants: transcript.participants.map(p => ({ ...p })),
      overallSentiment: transcript.summary.overallSentiment,
      dominantEmotion: transcript.summary.dominantEmotion,
      financialRiskScore: transcript.summary.financialRiskScore,
      keyTopics: transcript.summary.keyTopics.join(', '),
      source: transcript.metadata?.source,
      language: transcript.metadata?.language,
    });
    setEditMode(true);
  };

  const filteredSentences = transcript.transcript.filter(s =>
    !search || s.text.toLowerCase().includes(search.toLowerCase())
  );

  const toggleLocalReminder = id => {
    setLocalReminders(prev => ({ ...prev, [id]: !prev[id] }));
    resolveReminder(id);
  };

  const getRiskLevel = score => score > 60 ? 'high' : score > 35 ? 'medium' : 'low';
  const rl = getRiskLevel(transcript.summary.financialRiskScore);
  const RISK_STYLE = {
    low:    { bg:'rgba(90,158,47,0.08)',  color:'var(--green)',        border:'var(--green-border)' },
    medium: { bg:'rgba(217,119,6,0.08)', color:'var(--accent-amber)', border:'rgba(217,119,6,0.2)' },
    high:   { bg:'rgba(220,38,38,0.08)', color:'var(--accent-red)',   border:'rgba(220,38,38,0.2)' },
  };
  const rs = RISK_STYLE[rl];
  const ss = SENT_STYLE[transcript.summary.overallSentiment] || SENT_STYLE.neutral;

  const inputStyle = { width:'100%', background:'var(--bg-input)', border:'1px solid var(--border)', borderRadius:10, padding:'8px 12px', fontSize:13, fontWeight:600, color:'var(--text-primary)', outline:'none', fontFamily:'inherit', boxSizing:'border-box' };

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:18, color:'var(--text-primary)' }}>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}`}</style>

      {/* Back + Actions */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:10 }}>
        <button onClick={onBack} style={{ display:'flex', alignItems:'center', gap:7, fontSize:13, fontWeight:700, color:'var(--text-muted)', background:'none', border:'none', cursor:'pointer' }}
          onMouseEnter={e => e.currentTarget.style.color='var(--text-primary)'}
          onMouseLeave={e => e.currentTarget.style.color='var(--text-muted)'}>
          <ArrowLeft size={15} /> Back to Transcripts
        </button>
        <div style={{ display:'flex', gap:8 }}>
          {!editMode ? (
            <button onClick={startEdit} style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, fontWeight:700, color:'var(--text-secondary)', background:'var(--bg-subtle)', border:'1px solid var(--border)', borderRadius:10, padding:'7px 14px', cursor:'pointer' }}>
              <Edit3 size={13} /> Edit
            </button>
          ) : (
            <>
              <button onClick={() => setEditMode(false)} style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, fontWeight:700, color:'var(--green)', background:'var(--green-bg)', border:'1px solid var(--green-border)', borderRadius:10, padding:'7px 14px', cursor:'pointer' }}>
                <Save size={13} /> Save
              </button>
              <button onClick={() => setEditMode(false)} style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, fontWeight:700, color:'var(--accent-red)', background:'rgba(220,38,38,0.08)', border:'1px solid rgba(220,38,38,0.2)', borderRadius:10, padding:'7px 14px', cursor:'pointer' }}>
                <X size={13} /> Cancel
              </button>
            </>
          )}
        </div>
      </div>

      {/* Session Header */}
      <div style={{ ...cs, display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:14 }}>
        <div>
          <div style={{ fontSize:18, fontWeight:900, color:'var(--text-primary)', letterSpacing:-0.5, marginBottom:6 }}>{transcript.sessionId}</div>
          <div style={{ display:'flex', gap:14, flexWrap:'wrap' }}>
            <span style={{ fontSize:11, color:'var(--text-muted)', display:'flex', alignItems:'center', gap:4 }}><Clock size={11} />{new Date(transcript.createdAt).toLocaleString('en-IN',{dateStyle:'medium',timeStyle:'short'})}</span>
            <span style={{ fontSize:11, color:'var(--text-muted)' }}>{transcript.metadata?.language?.toUpperCase()} · {transcript.metadata?.source}</span>
            <span style={{ fontSize:11, color:'var(--text-muted)' }}>{transcript.summary.wordCount} words · {transcript.summary.totalDuration}s</span>
          </div>
          <div style={{ display:'flex', gap:8, marginTop:10, flexWrap:'wrap' }}>
            {transcript.participants.map(p => (
              <span key={p.speakerId} style={{ fontSize:11, fontWeight:700, background:`${ROLE_COLOR[p.role]}18`, color:ROLE_COLOR[p.role], border:`1px solid ${ROLE_COLOR[p.role]}30`, borderRadius:8, padding:'3px 10px' }}>
                {p.name} · {p.role}
              </span>
            ))}
          </div>
        </div>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          <span style={{ fontSize:10, fontWeight:800, background:ss.bg, color:ss.color, border:`1px solid ${ss.border}`, borderRadius:8, padding:'5px 12px', textTransform:'capitalize' }}>{transcript.summary.overallSentiment}</span>
          <span style={{ fontSize:10, fontWeight:800, background:rs.bg, color:rs.color, border:`1px solid ${rs.border}`, borderRadius:8, padding:'5px 12px', textTransform:'uppercase' }}>{rl} RISK · {transcript.summary.financialRiskScore}</span>
          {transcript.summary.reminderCount > 0 && (
            <span style={{ fontSize:10, fontWeight:800, background:'rgba(217,119,6,0.08)', color:'var(--accent-amber)', border:'1px solid rgba(217,119,6,0.2)', borderRadius:8, padding:'5px 12px' }}>
              🔔 {transcript.summary.reminderCount} Reminders
            </span>
          )}
        </div>
      </div>

      {/* Two-panel layout */}
      <div style={{ display:'grid', gridTemplateColumns:'1.5fr 1fr', gap:16, alignItems:'start' }}>

        {/* LEFT: Sentences */}
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:12, padding:'7px 14px' }}>
            <Search size={13} color="var(--text-muted)" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search sentences…"
              style={{ border:'none', outline:'none', background:'transparent', fontSize:13, fontWeight:600, color:'var(--text-primary)', width:'100%' }} />
          </div>

          {filteredSentences.map((s,i) => {
            const participant = transcript.participants.find(p => p.speakerId===s.speakerId);
            const sentStyle = SENT_STYLE[s.sentiment.label] || SENT_STYLE.neutral;
            const isReminded = localReminders[s.id]!==undefined ? localReminders[s.id] : s.isFlaggedReminder;
            const highlight = search && s.text.toLowerCase().includes(search.toLowerCase());

            return (
              <div key={s.id} style={{ ...cs, animation:`fadeUp 0.3s ease-out ${i*0.05}s both`, borderColor: highlight ? 'var(--green)' : isReminded ? 'rgba(217,119,6,0.4)' : 'var(--border)', background: highlight ? 'var(--green-bg)' : 'var(--bg-card)' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8, gap:8 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                    <span style={{ fontSize:10, fontWeight:800, background:`${ROLE_COLOR[participant?.role]||'#6B7280'}18`, color:ROLE_COLOR[participant?.role]||'var(--text-muted)', border:`1px solid ${ROLE_COLOR[participant?.role]||'#6B7280'}30`, borderRadius:7, padding:'2px 8px' }}>
                      {participant?.name||s.speakerId}
                    </span>
                    <span style={{ fontSize:10, color:'var(--text-muted)', display:'flex', alignItems:'center', gap:3 }}><Clock size={9} />{s.timestamp}s</span>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                    <span style={{ fontSize:10, fontWeight:800, background:sentStyle.bg, color:sentStyle.color, border:`1px solid ${sentStyle.border}`, borderRadius:7, padding:'2px 8px', textTransform:'capitalize' }}>
                      {s.sentiment.label} {(s.sentiment.score*100).toFixed(0)}%
                    </span>
                    <button onClick={() => toggleLocalReminder(s.id)} title={isReminded?'Remove reminder':'Flag as reminder'}
                      style={{ background:'none', border:'none', cursor:'pointer', color:isReminded?'var(--accent-amber)':'var(--text-muted)', padding:2 }}>
                      {isReminded ? <Bell size={14} /> : <BellOff size={14} />}
                    </button>
                  </div>
                </div>

                <p style={{ fontSize:13, color:'var(--text-primary)', lineHeight:1.65, margin:'0 0 10px' }}>{s.text}</p>

                {s.financialEntities?.length > 0 && (
                  <div style={{ display:'flex', flexWrap:'wrap', gap:5, marginBottom:8 }}>
                    {s.financialEntities.map((e,ei) => (
                      <span key={ei} style={{ fontSize:10, fontWeight:700, background:'var(--green-bg)', color:'var(--green)', border:'1px solid var(--green-border)', borderRadius:7, padding:'2px 8px' }}>
                        💰 {e.value}
                      </span>
                    ))}
                  </div>
                )}

                {s.nlpTags?.length > 0 && (
                  <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
                    {s.nlpTags.map(tag => (
                      <span key={tag} style={{ fontSize:9, fontWeight:800, background:`${TAG_COLOR[tag]||'#6B7280'}18`, color:TAG_COLOR[tag]||'var(--text-muted)', border:`1px solid ${TAG_COLOR[tag]||'#6B7280'}30`, borderRadius:6, padding:'2px 7px', letterSpacing:'0.3px' }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {isReminded && s.reminderText && (
                  <div style={{ marginTop:8, background:'rgba(217,119,6,0.08)', border:'1px solid rgba(217,119,6,0.2)', borderRadius:8, padding:'7px 10px', fontSize:11, fontWeight:600, color:'var(--accent-amber)', display:'flex', alignItems:'center', gap:6 }}>
                    <Bell size={11} /> {s.reminderText}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* RIGHT: Summary / Edit */}
        <div style={{ display:'flex', flexDirection:'column', gap:14, position:'sticky', top:20 }}>
          {editMode ? (
            <div style={cs}>
              <div style={{ fontSize:14, fontWeight:800, color:'var(--text-primary)', marginBottom:16 }}>Edit Session</div>
              {[
                { label:'Session ID', key:'sessionId' },
                { label:'Language', key:'language' },
                { label:'Source', key:'source' },
                { label:'Overall Sentiment', key:'overallSentiment' },
                { label:'Dominant Emotion', key:'dominantEmotion' },
                { label:'Key Topics (comma-separated)', key:'keyTopics' },
              ].map(({ label, key }) => (
                <div key={key} style={{ marginBottom:12 }}>
                  <label style={{ fontSize:10, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.4px', display:'block', marginBottom:5 }}>{label}</label>
                  <input value={editForm?.[key]||''} onChange={e => setEditForm(f => ({ ...f, [key]:e.target.value }))} style={inputStyle} />
                </div>
              ))}
              <div style={{ marginBottom:12 }}>
                <label style={{ fontSize:10, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.4px', display:'block', marginBottom:5 }}>Risk Score (0–100)</label>
                <input type="number" min={0} max={100} value={editForm?.financialRiskScore||0} onChange={e => setEditForm(f => ({ ...f, financialRiskScore:Number(e.target.value) }))} style={inputStyle} />
              </div>
              <div style={{ marginBottom:16 }}>
                <div style={{ fontSize:10, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.4px', marginBottom:8 }}>Participants</div>
                {editForm?.participants.map((p,i) => (
                  <div key={i} style={{ display:'flex', gap:6, marginBottom:6 }}>
                    <input value={p.name} onChange={e => setEditForm(f => ({ ...f, participants:f.participants.map((pp,ii) => ii===i?{...pp,name:e.target.value}:pp) }))}
                      placeholder="Name" style={{ ...inputStyle, flex:1 }} />
                    <select value={p.role} onChange={e => setEditForm(f => ({ ...f, participants:f.participants.map((pp,ii) => ii===i?{...pp,role:e.target.value}:pp) }))}
                      style={{ background:'var(--bg-input)', border:'1px solid var(--border)', borderRadius:8, padding:'6px 8px', fontSize:12, color:'var(--text-primary)', outline:'none' }}>
                      <option value="agent">Agent</option>
                      <option value="customer">Customer</option>
                      <option value="analyst">Analyst</option>
                    </select>
                    <button onClick={() => setEditForm(f => ({ ...f, participants:f.participants.filter((_,ii) => ii!==i) }))}
                      style={{ background:'rgba(220,38,38,0.08)', border:'1px solid rgba(220,38,38,0.2)', borderRadius:8, padding:'6px 8px', cursor:'pointer', color:'var(--accent-red)' }}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
                <button onClick={() => setEditForm(f => ({ ...f, participants:[...f.participants,{speakerId:`sp_new_${Date.now()}`,name:'',role:'customer'}] }))}
                  style={{ display:'flex', alignItems:'center', gap:5, fontSize:11, fontWeight:700, color:'var(--green)', background:'var(--green-bg)', border:'1px solid var(--green-border)', borderRadius:8, padding:'5px 12px', cursor:'pointer', marginTop:4 }}>
                  <Plus size={11} /> Add Participant
                </button>
              </div>
              <button onClick={() => { alert('PUT /api/transcripts/:id — backend integration ready!'); setEditMode(false); }}
                style={{ width:'100%', padding:'11px', background:'var(--green)', color:'var(--text-inverse)', border:'none', borderRadius:12, fontWeight:700, fontSize:13, cursor:'pointer' }}>
                <Save size={14} style={{ marginRight:6, verticalAlign:'middle' }} /> Save Changes
              </button>
            </div>
          ) : (
            <>
              <div style={cs}>
                <div style={{ fontSize:13, fontWeight:800, color:'var(--text-primary)', marginBottom:14 }}>Session Summary</div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                  {[
                    { label:'Sentiment', value:transcript.summary.overallSentiment },
                    { label:'Emotion',   value:transcript.summary.dominantEmotion },
                    { label:'Risk Score',value:transcript.summary.financialRiskScore },
                    { label:'Words',     value:transcript.summary.wordCount },
                    { label:'Duration',  value:`${transcript.summary.totalDuration}s` },
                    { label:'Reminders', value:transcript.summary.reminderCount },
                  ].map(({ label, value }) => (
                    <div key={label} style={{ background:'var(--bg-subtle)', borderRadius:10, padding:'9px 12px' }}>
                      <div style={{ fontSize:9, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.4px', marginBottom:3 }}>{label}</div>
                      <div style={{ fontSize:14, fontWeight:800, color:'var(--text-primary)', textTransform:'capitalize' }}>{value}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={cs}>
                <div style={{ fontSize:13, fontWeight:800, color:'var(--text-primary)', marginBottom:12 }}>Key Topics</div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                  {transcript.summary.keyTopics.map(topic => (
                    <span key={topic} style={{ fontSize:11, fontWeight:700, background:'var(--green-bg)', color:'var(--green)', border:'1px solid var(--green-border)', borderRadius:8, padding:'4px 10px' }}>{topic}</span>
                  ))}
                </div>
              </div>

              <button style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:7, padding:'11px', background:'var(--bg-card)', color:'var(--text-secondary)', border:'1px solid var(--border)', borderRadius:14, fontWeight:700, fontSize:13, cursor:'pointer', transition:'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.background='var(--green-bg)'; e.currentTarget.style.color='var(--green)'; e.currentTarget.style.borderColor='var(--green-border)'; }}
                onMouseLeave={e => { e.currentTarget.style.background='var(--bg-card)'; e.currentTarget.style.color='var(--text-secondary)'; e.currentTarget.style.borderColor='var(--border)'; }}
                onClick={() => alert('NLP re-processing pipeline — backend integration ready!')}>
                <RefreshCw size={14} /> Re-run NLP Pipeline
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default TranscriptDetail;
