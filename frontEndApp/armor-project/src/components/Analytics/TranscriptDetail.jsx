import React, { useState, useMemo } from 'react';
import { ArrowLeft, Clock, Tag, Bell, BellOff, Search, Edit3, Save, X, Plus, Trash2, RefreshCw } from 'lucide-react';
import { useData } from '../../context/DataContext';

const C = {
  cream2: '#FAF6E9', limelt: '#DDEB9D', green: '#A0C878', greendk: '#7aaa52',
  text: '#1a2010', textmid: '#4a5a30', textdim: '#8a9a70', shadow: 'rgba(100,140,60,0.11)',
  neg: '#dc2626', med: '#f59e0b',
};
const card = { background: '#fff', border: '1px solid rgba(160,200,120,0.22)', borderRadius: 16, padding: '16px 18px', boxShadow: `0 2px 12px ${C.shadow}` };

const SENT_STYLE = {
  positive: { bg: '#DDEB9D', color: '#4a5a30', border: '#A0C878' },
  negative: { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' },
  neutral:  { bg: '#FAF6E9', color: '#8a9a70', border: 'rgba(160,200,120,0.3)' },
  mixed:    { bg: '#f5f3ff', color: '#7c3aed', border: '#ddd6fe' },
};
const ROLE_COLOR = { agent: '#7aaa52', customer: '#f59e0b', analyst: '#8b5cf6' };
const TAG_COLOR = {
  URGENCY: '#dc2626', COMMITMENT: '#7aaa52', OBJECTION: '#f59e0b',
  QUESTION: '#8b5cf6', AGREEMENT: '#06b6d4', RISK_MENTION: '#dc2626',
  REMINDER_REQUEST: '#f59e0b', CLARIFICATION: '#8a9a70', PRICING_TALK: '#7aaa52',
  REGULATORY: '#f59e0b', FOLLOW_UP: '#8b5cf6',
};

const TranscriptDetail = ({ transcriptId, onBack }) => {
  const { transcripts, resolveReminder } = useData();
  const transcript = useMemo(() => transcripts.find(t => t._id === transcriptId), [transcripts, transcriptId]);

  const [search, setSearch] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState(null);
  const [localReminders, setLocalReminders] = useState({});

  if (!transcript) return (
    <div style={{ padding: 40, textAlign: 'center', color: C.textdim, fontFamily: 'Inter,sans-serif' }}>
      <div style={{ fontSize: 13, fontWeight: 600 }}>Transcript not found.</div>
      <button onClick={onBack} style={{ marginTop: 16, fontSize: 13, fontWeight: 700, color: C.greendk, background: C.limelt, border: `1px solid ${C.green}`, borderRadius: 10, padding: '8px 18px', cursor: 'pointer' }}>← Back</button>
    </div>
  );

  const startEdit = () => {
    setEditForm({
      sessionId: transcript.sessionId,
      participants: transcript.participants.map(p => ({ ...p })),
      sentences: transcript.transcript.map(s => ({ ...s })),
      overallSentiment: transcript.summary.overallSentiment,
      dominantEmotion: transcript.summary.dominantEmotion,
      financialRiskScore: transcript.summary.financialRiskScore,
      keyTopics: transcript.summary.keyTopics.join(', '),
      source: transcript.metadata.source,
      language: transcript.metadata.language,
    });
    setEditMode(true);
  };

  const filteredSentences = transcript.transcript.filter(s =>
    !search || s.text.toLowerCase().includes(search.toLowerCase())
  );

  const toggleLocalReminder = (id) => {
    setLocalReminders(prev => ({ ...prev, [id]: !prev[id] }));
    resolveReminder(id);
  };

  const getRiskLevel = (score) => score > 60 ? 'high' : score > 35 ? 'medium' : 'low';
  const rl = getRiskLevel(transcript.summary.financialRiskScore);
  const RISK_STYLE = {
    low:    { bg: C.limelt, color: C.greendk, border: C.green },
    medium: { bg: '#fefce8', color: '#92400e', border: '#fde68a' },
    high:   { bg: '#fef2f2', color: C.neg, border: '#fecaca' },
  };
  const rs = RISK_STYLE[rl];
  const ss = SENT_STYLE[transcript.summary.overallSentiment] || SENT_STYLE.neutral;

  return (
    <div style={{ fontFamily: 'Inter,sans-serif', display: 'flex', flexDirection: 'column', gap: 18, color: C.text }}>

      {/* Back + Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, fontWeight: 700, color: C.textdim, background: 'none', border: 'none', cursor: 'pointer' }}
          onMouseEnter={e => e.currentTarget.style.color = C.text}
          onMouseLeave={e => e.currentTarget.style.color = C.textdim}>
          <ArrowLeft size={15} /> Back to Transcripts
        </button>
        <div style={{ display: 'flex', gap: 8 }}>
          {!editMode ? (
            <button onClick={startEdit} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: C.textmid, background: C.cream2, border: '1px solid rgba(160,200,120,0.28)', borderRadius: 10, padding: '7px 14px', cursor: 'pointer' }}>
              <Edit3 size={13} /> Edit
            </button>
          ) : (
            <>
              <button onClick={() => setEditMode(false)} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: C.greendk, background: C.limelt, border: `1px solid ${C.green}`, borderRadius: 10, padding: '7px 14px', cursor: 'pointer' }}>
                <Save size={13} /> Save
              </button>
              <button onClick={() => setEditMode(false)} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: C.neg, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '7px 14px', cursor: 'pointer' }}>
                <X size={13} /> Cancel
              </button>
            </>
          )}
        </div>
      </div>

      {/* Session Header */}
      <div style={{ ...card, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 14 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 900, color: C.text, letterSpacing: -0.5, marginBottom: 6 }}>{transcript.sessionId}</div>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, color: C.textdim, display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={11} />{new Date(transcript.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>
            <span style={{ fontSize: 11, color: C.textdim }}>{transcript.metadata?.language?.toUpperCase()} · {transcript.metadata?.source}</span>
            <span style={{ fontSize: 11, color: C.textdim }}>{transcript.summary.wordCount} words · {transcript.summary.totalDuration}s</span>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
            {transcript.participants.map(p => (
              <span key={p.speakerId} style={{ fontSize: 11, fontWeight: 700, background: `${ROLE_COLOR[p.role]}22`, color: ROLE_COLOR[p.role], border: `1px solid ${ROLE_COLOR[p.role]}44`, borderRadius: 8, padding: '3px 10px' }}>
                {p.name} · {p.role}
              </span>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 10, fontWeight: 800, background: ss.bg, color: ss.color, border: `1px solid ${ss.border}`, borderRadius: 8, padding: '5px 12px', textTransform: 'capitalize' }}>{transcript.summary.overallSentiment}</span>
          <span style={{ fontSize: 10, fontWeight: 800, background: rs.bg, color: rs.color, border: `1px solid ${rs.border}`, borderRadius: 8, padding: '5px 12px', textTransform: 'uppercase' }}>{rl} RISK · {transcript.summary.financialRiskScore}</span>
          {transcript.summary.reminderCount > 0 && (
            <span style={{ fontSize: 10, fontWeight: 800, background: '#fefce8', color: '#92400e', border: '1px solid #fde68a', borderRadius: 8, padding: '5px 12px' }}>
              🔔 {transcript.summary.reminderCount} Reminders
            </span>
          )}
        </div>
      </div>

      {/* Two-panel layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 16, alignItems: 'start' }}>

        {/* LEFT: Sentence viewer */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fff', border: '1px solid rgba(160,200,120,0.28)', borderRadius: 12, padding: '7px 14px' }}>
            <Search size={13} color={C.textdim} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search sentences…"
              style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: 13, fontWeight: 600, color: C.text, width: '100%' }} />
          </div>

          {filteredSentences.map((s, i) => {
            const participant = transcript.participants.find(p => p.speakerId === s.speakerId);
            const sentStyle = SENT_STYLE[s.sentiment.label] || SENT_STYLE.neutral;
            const isReminded = localReminders[s.id] !== undefined ? localReminders[s.id] : s.isFlaggedReminder;
            const highlight = search && s.text.toLowerCase().includes(search.toLowerCase());

            return (
              <div key={s.id} style={{ ...card, animation: `fadeUp 0.3s ease-out ${i * 0.05}s both`, border: `1px solid ${highlight ? C.green : isReminded ? '#fde68a' : 'rgba(160,200,120,0.22)'}`, background: highlight ? 'rgba(160,200,120,0.04)' : '#fff' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8, gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 10, fontWeight: 800, background: `${ROLE_COLOR[participant?.role]}22`, color: ROLE_COLOR[participant?.role] || C.textdim, border: `1px solid ${ROLE_COLOR[participant?.role]}44`, borderRadius: 7, padding: '2px 8px' }}>
                      {participant?.name || s.speakerId}
                    </span>
                    <span style={{ fontSize: 10, color: C.textdim, display: 'flex', alignItems: 'center', gap: 3 }}><Clock size={9} />{s.timestamp}s</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 10, fontWeight: 800, background: sentStyle.bg, color: sentStyle.color, border: `1px solid ${sentStyle.border}`, borderRadius: 7, padding: '2px 8px', textTransform: 'capitalize' }}>
                      {s.sentiment.label} {(s.sentiment.score * 100).toFixed(0)}%
                    </span>
                    <button onClick={() => toggleLocalReminder(s.id)} title={isReminded ? 'Remove reminder' : 'Flag as reminder'}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: isReminded ? C.med : C.textdim, padding: 2 }}>
                      {isReminded ? <Bell size={14} /> : <BellOff size={14} />}
                    </button>
                  </div>
                </div>

                <p style={{ fontSize: 13, color: C.text, lineHeight: 1.65, margin: '0 0 10px' }}>{s.text}</p>

                {/* Financial entities */}
                {s.financialEntities.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 8 }}>
                    {s.financialEntities.map((e, ei) => (
                      <span key={ei} style={{ fontSize: 10, fontWeight: 700, background: '#DDEB9D', color: '#4a5a30', border: '1px solid #A0C878', borderRadius: 7, padding: '2px 8px' }}>
                        💰 {e.value}
                      </span>
                    ))}
                  </div>
                )}

                {/* NLP tags */}
                {s.nlpTags.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {s.nlpTags.map(tag => (
                      <span key={tag} style={{ fontSize: 9, fontWeight: 800, background: `${TAG_COLOR[tag] || '#8a9a70'}18`, color: TAG_COLOR[tag] || '#8a9a70', border: `1px solid ${TAG_COLOR[tag] || '#8a9a70'}33`, borderRadius: 6, padding: '2px 7px', letterSpacing: '0.3px' }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Reminder text */}
                {isReminded && s.reminderText && (
                  <div style={{ marginTop: 8, background: '#fefce8', border: '1px solid #fde68a', borderRadius: 8, padding: '7px 10px', fontSize: 11, fontWeight: 600, color: '#92400e', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Bell size={11} /> {s.reminderText}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* RIGHT: Edit form / Summary */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, position: 'sticky', top: 20 }}>
          {editMode ? (
            <div style={card}>
              <div style={{ fontSize: 14, fontWeight: 800, color: C.text, marginBottom: 16 }}>Edit Session</div>
              {[
                { label: 'Session ID', key: 'sessionId' },
                { label: 'Language', key: 'language' },
                { label: 'Source', key: 'source' },
                { label: 'Overall Sentiment', key: 'overallSentiment' },
                { label: 'Dominant Emotion', key: 'dominantEmotion' },
                { label: 'Key Topics (comma-separated)', key: 'keyTopics' },
              ].map(({ label, key }) => (
                <div key={key} style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 10, fontWeight: 700, color: C.textdim, textTransform: 'uppercase', letterSpacing: '0.4px', display: 'block', marginBottom: 5 }}>{label}</label>
                  <input value={editForm?.[key] || ''} onChange={e => setEditForm(f => ({ ...f, [key]: e.target.value }))}
                    style={{ width: '100%', background: C.cream2, border: '1px solid rgba(160,200,120,0.28)', borderRadius: 10, padding: '8px 12px', fontSize: 13, fontWeight: 600, color: C.text, outline: 'none' }} />
                </div>
              ))}
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 10, fontWeight: 700, color: C.textdim, textTransform: 'uppercase', letterSpacing: '0.4px', display: 'block', marginBottom: 5 }}>Risk Score (0–100)</label>
                <input type="number" min={0} max={100} value={editForm?.financialRiskScore || 0} onChange={e => setEditForm(f => ({ ...f, financialRiskScore: Number(e.target.value) }))}
                  style={{ width: '100%', background: C.cream2, border: '1px solid rgba(160,200,120,0.28)', borderRadius: 10, padding: '8px 12px', fontSize: 13, fontWeight: 600, color: C.text, outline: 'none' }} />
              </div>
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: C.textdim, textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 8 }}>Participants</div>
                {editForm?.participants.map((p, i) => (
                  <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                    <input value={p.name} onChange={e => setEditForm(f => ({ ...f, participants: f.participants.map((pp, ii) => ii === i ? { ...pp, name: e.target.value } : pp) }))}
                      placeholder="Name" style={{ flex: 1, background: C.cream2, border: '1px solid rgba(160,200,120,0.28)', borderRadius: 8, padding: '6px 10px', fontSize: 12, color: C.text, outline: 'none' }} />
                    <select value={p.role} onChange={e => setEditForm(f => ({ ...f, participants: f.participants.map((pp, ii) => ii === i ? { ...pp, role: e.target.value } : pp) }))}
                      style={{ background: C.cream2, border: '1px solid rgba(160,200,120,0.28)', borderRadius: 8, padding: '6px 8px', fontSize: 12, color: C.text, outline: 'none' }}>
                      <option value="agent">Agent</option>
                      <option value="customer">Customer</option>
                      <option value="analyst">Analyst</option>
                    </select>
                    <button onClick={() => setEditForm(f => ({ ...f, participants: f.participants.filter((_, ii) => ii !== i) }))}
                      style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '6px 8px', cursor: 'pointer', color: C.neg }}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
                <button onClick={() => setEditForm(f => ({ ...f, participants: [...f.participants, { speakerId: `sp_new_${Date.now()}`, name: '', role: 'customer' }] }))}
                  style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, color: C.greendk, background: C.limelt, border: `1px solid ${C.green}`, borderRadius: 8, padding: '5px 12px', cursor: 'pointer', marginTop: 4 }}>
                  <Plus size={11} /> Add Participant
                </button>
              </div>
              <button onClick={() => { alert('PUT /api/transcripts/:id — backend integration ready!'); setEditMode(false); }}
                style={{ width: '100%', padding: '11px', background: C.limelt, color: C.text, border: `1px solid ${C.green}`, borderRadius: 12, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                <Save size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} /> Save Changes
              </button>
            </div>
          ) : (
            <>
              {/* Summary card */}
              <div style={card}>
                <div style={{ fontSize: 13, fontWeight: 800, color: C.text, marginBottom: 14 }}>Session Summary</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {[
                    { label: 'Sentiment', value: transcript.summary.overallSentiment },
                    { label: 'Emotion', value: transcript.summary.dominantEmotion },
                    { label: 'Risk Score', value: transcript.summary.financialRiskScore },
                    { label: 'Word Count', value: transcript.summary.wordCount },
                    { label: 'Duration', value: `${transcript.summary.totalDuration}s` },
                    { label: 'Reminders', value: transcript.summary.reminderCount },
                  ].map(({ label, value }) => (
                    <div key={label} style={{ background: C.cream2, borderRadius: 10, padding: '9px 12px' }}>
                      <div style={{ fontSize: 9, fontWeight: 700, color: C.textdim, textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 3 }}>{label}</div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: C.text, textTransform: 'capitalize' }}>{value}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Key topics */}
              <div style={card}>
                <div style={{ fontSize: 13, fontWeight: 800, color: C.text, marginBottom: 12 }}>Key Topics</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {transcript.summary.keyTopics.map(topic => (
                    <span key={topic} style={{ fontSize: 11, fontWeight: 700, background: C.limelt, color: C.greendk, border: `1px solid ${C.green}`, borderRadius: 8, padding: '4px 10px' }}>{topic}</span>
                  ))}
                </div>
              </div>

              {/* Rerun NLP button */}
              <button style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '11px', background: '#1a2010', color: C.limelt, border: 'none', borderRadius: 14, fontWeight: 700, fontSize: 13, cursor: 'pointer', transition: 'all 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.background = '#2a3a20'}
                onMouseLeave={e => e.currentTarget.style.background = '#1a2010'}
                onClick={() => alert('NLP re-processing pipeline — backend integration ready!')}>
                <RefreshCw size={14} /> Re-run NLP Pipeline
              </button>
            </>
          )}
        </div>
      </div>

      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  );
};

export default TranscriptDetail;
