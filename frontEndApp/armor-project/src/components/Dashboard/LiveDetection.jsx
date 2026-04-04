import React, { useState, useEffect, useRef } from 'react';
import { Square, Pause, Play, Mic, CheckCircle2, Clock, Zap } from 'lucide-react';

const C = {
  cream: '#FFFDF6', cream2: '#FAF6E9', limelt: '#DDEB9D',
  green: '#A0C878', greendk: '#7aaa52', text: '#1a2010',
  textmid: '#4a5a30', textdim: '#8a9a70', shadow: 'rgba(100,140,60,0.11)',
};

const TRANSCRIPT_LINES = [
  { speaker: 'User', text: 'Yaar kitna EMI banega agar 30 lakh ka loan loon?', keywords: ['EMI', 'loan'] },
  { speaker: 'Friend', text: 'Depends on tenure bhai, kitne saal ke liye?' },
  { speaker: 'User', text: '7 saal ke liye calculate kar, SIP bhi chal raha hai mera.' , keywords: ['SIP'] },
  { speaker: 'Friend', text: 'Toh roughly ₹46,000 per month hoga EMI...', keywords: ['EMI'] },
  { speaker: 'User', text: 'Itna afford kar sakta hoon kya? Budget tight hai.', keywords: ['Budget'] },
  { speaker: 'Friend', text: 'Salary kitni hai teri? 40% rule follow karna chahiye.' },
];

const KEYWORDS_POOL = [
  { word: 'EMI', color: '#fef2f2', border: '#fecaca', text: '#dc2626' },
  { word: 'Loan', color: '#ecfdf5', border: '#a7f3d0', text: '#059669' },
  { word: 'SIP', color: '#DDEB9D', border: '#A0C878', text: '#4a5a30' },
  { word: 'Budget', color: '#fefce8', border: '#fde68a', text: '#92400e' },
  { word: 'Investment', color: '#FAF6E9', border: '#A0C878', text: '#7aaa52' },
];

const LiveDetection = () => {
  const [status, setStatus] = useState('idle'); // idle | recording | paused | stopped
  const [elapsed, setElapsed] = useState(0);
  const [transcriptIdx, setTranscriptIdx] = useState(0);
  const [detectedKeywords, setDetectedKeywords] = useState([]);
  const [emotions, setEmotions] = useState({ Hesitant: 20, Stressed: 15, Confident: 65 });
  const [bars, setBars] = useState(Array(14).fill(4));
  const timerRef = useRef(null);
  const transcriptRef = useRef(null);

  /* ── timer ── */
  useEffect(() => {
    if (status === 'recording') {
      timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [status]);

  /* ── waveform animation ── */
  useEffect(() => {
    if (status !== 'recording') return;
    const id = setInterval(() => {
      setBars(Array(14).fill(0).map(() => Math.floor(Math.random() * 44) + 6));
    }, 120);
    return () => clearInterval(id);
  }, [status]);

  /* ── transcript feed ── */
  useEffect(() => {
    if (status !== 'recording') return;
    if (transcriptIdx >= TRANSCRIPT_LINES.length) return;
    const delay = transcriptIdx === 0 ? 1200 : 2200;
    const t = setTimeout(() => {
      const line = TRANSCRIPT_LINES[transcriptIdx];
      if (line.keywords) {
        line.keywords.forEach(kw => {
          const found = KEYWORDS_POOL.find(k => k.word === kw);
          if (found) setDetectedKeywords(prev => prev.find(p => p.word === kw) ? prev : [...prev, found]);
        });
      }
      setTranscriptIdx(i => i + 1);
      if (transcriptRef.current) transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
    }, delay);
    return () => clearTimeout(t);
  }, [status, transcriptIdx]);

  /* ── emotion drift ── */
  useEffect(() => {
    if (status !== 'recording') return;
    const id = setInterval(() => {
      setEmotions(prev => ({
        Hesitant:  Math.min(95, Math.max(10, prev.Hesitant  + (Math.random() - 0.45) * 6)),
        Stressed:  Math.min(95, Math.max(10, prev.Stressed   + (Math.random() - 0.48) * 5)),
        Confident: Math.min(95, Math.max(10, prev.Confident  + (Math.random() - 0.52) * 5)),
      }));
    }, 1400);
    return () => clearInterval(id);
  }, [status]);

  const handleStart = () => {
    setStatus('recording');
    setElapsed(0);
    setTranscriptIdx(0);
    setDetectedKeywords([]);
    setEmotions({ Hesitant: 20, Stressed: 15, Confident: 65 });
    setBars(Array(14).fill(4));
  };
  const handlePause  = () => setStatus('paused');
  const handleResume = () => setStatus('recording');
  const handleStop   = () => setStatus('stopped');

  const fmt = s => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const card = { background: '#fff', border: `1px solid rgba(160,200,120,0.22)`, borderRadius: 20, padding: 24, boxShadow: `0 2px 16px ${C.shadow}` };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, fontFamily: 'Inter,sans-serif' }}>

      {/* Header */}
      <div>
        <h1 style={{ fontSize: 'clamp(22px,3vw,32px)', fontWeight: 900, color: C.text, letterSpacing: -1 }}>Live Detection</h1>
        <p style={{ fontSize: 14, color: C.textdim, marginTop: 6 }}>Real-time financial conversation monitoring</p>
      </div>

      {/* ── IDLE STATE ── */}
      {status === 'idle' && (
        <div style={{ ...card, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 24px', gap: 20 }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: C.limelt, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Mic size={32} color={C.text} />
          </div>
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: C.text, marginBottom: 8 }}>Ready to Listen</h2>
            <p style={{ fontSize: 14, color: C.textdim, maxWidth: 340 }}>Start a session to detect financial keywords, emotions, and build a live transcript.</p>
          </div>
          <button onClick={handleStart} style={{
            background: C.text, color: C.cream, border: 'none', padding: '13px 36px',
            borderRadius: 40, fontWeight: 700, fontSize: 15, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 10,
            boxShadow: `0 6px 22px rgba(26,32,16,0.18)`,
          }}>
            <Mic size={16} /> Start Session
          </button>
        </div>
      )}

      {/* ── ACTIVE / PAUSED / STOPPED ── */}
      {status !== 'idle' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px,1fr) 1.5fr', gap: 20 }}>

          {/* LEFT — Listening Panel */}
          <div style={{ ...card, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>

            {/* Status badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{
                width: 9, height: 9, borderRadius: '50%',
                background: status === 'recording' ? '#2e8b2e' : status === 'paused' ? '#e0a020' : '#dc2626',
                boxShadow: status === 'recording' ? '0 0 0 3px rgba(46,139,46,0.2)' : 'none',
                animation: status === 'recording' ? 'livePulse 1.6s ease-out infinite' : 'none',
                display: 'inline-block',
              }} />
              <span style={{ fontSize: 14, fontWeight: 700, color: status === 'recording' ? '#2e8b2e' : status === 'paused' ? '#e0a020' : '#dc2626' }}>
                {status === 'recording' ? 'Actively Listening' : status === 'paused' ? 'Paused' : 'Session Ended'}
              </span>
            </div>

            {/* Timer */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: C.textmid, fontSize: 13, fontWeight: 600 }}>
              <Clock size={14} /> {fmt(elapsed)}
            </div>

            {/* Waveform */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 3, height: 56 }}>
              {bars.map((h, i) => (
                <div key={i} style={{
                  width: 4, height: h, borderRadius: 3,
                  background: status === 'recording' ? C.greendk : status === 'paused' ? C.limelt : '#d1d5db',
                  transition: 'height 0.1s ease',
                }} />
              ))}
            </div>

            <p style={{ fontSize: 12, color: C.textdim, textAlign: 'center' }}>
              Monitoring: SIP · EMI · Loan · Investment · Budget
            </p>

            {/* Controls */}
            <div style={{ display: 'flex', gap: 12 }}>
              {status === 'recording' && (
                <>
                  <button onClick={handlePause} style={{
                    background: C.cream2, border: `1px solid rgba(160,200,120,0.3)`,
                    color: C.text, padding: '10px 22px', borderRadius: 12,
                    display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, fontSize: 14, cursor: 'pointer',
                  }}>
                    <Pause size={14} fill="currentColor" /> Pause
                  </button>
                  <button onClick={handleStop} style={{
                    background: '#fef2f2', border: '1px solid #fecaca',
                    color: '#dc2626', padding: '10px 22px', borderRadius: 12,
                    display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, fontSize: 14, cursor: 'pointer',
                  }}>
                    <Square size={14} fill="currentColor" /> Stop
                  </button>
                </>
              )}
              {status === 'paused' && (
                <>
                  <button onClick={handleResume} style={{
                    background: C.limelt, border: `1px solid ${C.green}`,
                    color: C.text, padding: '10px 22px', borderRadius: 12,
                    display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 14, cursor: 'pointer',
                  }}>
                    <Play size={14} fill="currentColor" /> Resume
                  </button>
                  <button onClick={handleStop} style={{
                    background: '#fef2f2', border: '1px solid #fecaca',
                    color: '#dc2626', padding: '10px 22px', borderRadius: 12,
                    display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, fontSize: 14, cursor: 'pointer',
                  }}>
                    <Square size={14} fill="currentColor" /> Stop
                  </button>
                </>
              )}
              {status === 'stopped' && (
                <button onClick={handleStart} style={{
                  background: C.text, color: C.cream, border: 'none',
                  padding: '10px 28px', borderRadius: 12,
                  display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 14, cursor: 'pointer',
                }}>
                  <Mic size={14} /> New Session
                </button>
              )}
            </div>
          </div>

          {/* RIGHT — Keywords + Emotions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Keywords */}
            <div style={card}>
              <h3 style={{ fontSize: 11, fontWeight: 700, color: C.textdim, textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 14 }}>
                Detected Keywords
              </h3>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', minHeight: 36 }}>
                {KEYWORDS_POOL.map(k => {
                  const found = detectedKeywords.find(d => d.word === k.word);
                  return (
                    <div key={k.word} style={{
                      background: found ? k.color : C.cream2,
                      border: `1px solid ${found ? k.border : 'rgba(160,200,120,0.2)'}`,
                      color: found ? k.text : C.textdim,
                      padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: 600,
                      display: 'flex', alignItems: 'center', gap: 6,
                      transition: 'all 0.4s ease',
                      opacity: found ? 1 : 0.5,
                    }}>
                      {found && <CheckCircle2 size={13} />} {k.word}
                      {!found && <span style={{ fontSize: 10, opacity: 0.6 }}>waiting</span>}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Emotions */}
            <div style={{ ...card, flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                <Zap size={14} color={C.greendk} />
                <h3 style={{ fontSize: 11, fontWeight: 700, color: C.textdim, textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                  Live Emotion Analysis
                </h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                {[
                  { label: 'Hesitant',  val: emotions.Hesitant,  color: '#e0a020' },
                  { label: 'Stressed',  val: emotions.Stressed,  color: '#dc2626' },
                  { label: 'Confident', val: emotions.Confident, color: C.greendk },
                ].map(({ label, val, color }) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 76, fontSize: 13, fontWeight: 600, color: C.text }}>{label}</div>
                    <div style={{ flex: 1, background: C.cream2, height: 7, borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{
                        width: `${Math.round(val)}%`, background: color,
                        height: '100%', borderRadius: 4,
                        transition: 'width 0.6s ease',
                      }} />
                    </div>
                    <div style={{ width: 36, fontSize: 12, fontWeight: 700, color: C.textmid, textAlign: 'right' }}>
                      {Math.round(val)}%
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TRANSCRIPT ── */}
      {status !== 'idle' && (
        <div style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 style={{ fontSize: 15, fontWeight: 800, color: C.text }}>Live Transcript Feed</h3>
            {status === 'recording' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, background: '#ecfdf5', padding: '4px 12px', borderRadius: 20, border: '1px solid #a7f3d0', color: '#059669', fontSize: 12, fontWeight: 700 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#059669', display: 'inline-block' }} />
                Recording
              </div>
            )}
          </div>
          <div ref={transcriptRef} style={{ display: 'flex', flexDirection: 'column', gap: 14, maxHeight: 220, overflowY: 'auto' }}>
            {TRANSCRIPT_LINES.slice(0, transcriptIdx).map((line, i) => (
              <div key={i} style={{ fontSize: 14, color: line.speaker === 'User' ? C.text : C.textmid, lineHeight: 1.6 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: C.textdim, marginRight: 8 }}>{line.speaker}:</span>
                {line.text.split(' ').map((word, wi) => {
                  const kw = KEYWORDS_POOL.find(k => word.toLowerCase().includes(k.word.toLowerCase()));
                  return kw
                    ? <span key={wi} style={{ color: kw.text, fontWeight: 700 }}>{word} </span>
                    : <span key={wi}>{word} </span>;
                })}
              </div>
            ))}
            {status === 'recording' && transcriptIdx < TRANSCRIPT_LINES.length && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: C.green, opacity: 0.7, display: 'inline-block' }} />
                <span style={{ fontSize: 13, color: C.textdim, fontStyle: 'italic' }}>Listening...</span>
              </div>
            )}
            {status === 'stopped' && (
              <div style={{ fontSize: 13, color: C.greendk, fontWeight: 600, marginTop: 8 }}>
                ✓ Session complete — {transcriptIdx} lines captured
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes livePulse {
          0%   { box-shadow: 0 0 0 0 rgba(46,139,46,0.5); }
          70%  { box-shadow: 0 0 0 8px rgba(46,139,46,0); }
          100% { box-shadow: 0 0 0 0 rgba(46,139,46,0); }
        }
      `}</style>
    </div>
  );
};

export default LiveDetection;
