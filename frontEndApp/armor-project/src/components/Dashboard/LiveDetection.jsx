import React, { useState, useEffect, useRef } from 'react';
import { uploadRecording } from '../../api/recordings';
import { Square, Pause, Play, Mic, CheckCircle2, Clock, Zap, Upload, FileAudio, X, Music } from 'lucide-react';

const C = {
  cream: '#FFFDF6', cream2: '#FAF6E9', limelt: '#DDEB9D',
  green: '#A0C878', greendk: '#7aaa52', text: '#1a2010',
  textmid: '#4a5a30', textdim: '#8a9a70', shadow: 'rgba(100,140,60,0.11)',
};

// Removed hardcoded keywords pool and transcript lines (Backend integration incoming)
const KEYWORDS_POOL = [];
const TRANSCRIPT_LINES = [];

/* ── Idle Visualizer Bars — ambient pulsing ── */
const IdleBars = () => {
  const COUNT = 32;
  return (
    <div className="ld-idle-bars">
      {Array.from({ length: COUNT }).map((_, i) => {
        const angle = (i / COUNT) * 360;
        const delay = (i / COUNT) * 2;
        return (
          <div
            key={i}
            className="ld-idle-bar"
            style={{
              transform: `rotate(${angle}deg) translateY(-90px)`,
              animationDelay: `${delay}s`,
            }}
          />
        );
      })}
    </div>
  );
};

/* â”€â”€ Floating Particles â”€â”€ */
const Particles = () => (
  <div className="ld-particles">
    {Array.from({ length: 12 }).map((_, i) => (
      <div
        key={i}
        className="ld-particle"
        style={{
          '--angle': `${(i / 12) * 360}deg`,
          '--delay': `${(i / 12) * 6}s`,
          '--dist': `${110 + Math.random() * 60}px`,
          '--size': `${3 + Math.random() * 4}px`,
        }}
      />
    ))}
  </div>
);

const LiveDetection = () => {
  const [status, setStatus] = useState('idle'); // idle | recording | paused | stopped
  const [elapsed, setElapsed] = useState(0);
  const [transcriptIdx, setTranscriptIdx] = useState(0);
  const [detectedKeywords, setDetectedKeywords] = useState([]);
  const [emotions, setEmotions] = useState({ Hesitant: 20, Stressed: 15, Confident: 65 });
  const [bars, setBars] = useState(Array(14).fill(4));
  const [micHover, setMicHover] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null); // { success, message }
  const timerRef = useRef(null);
  const transcriptRef = useRef(null);
  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  /* â”€â”€ timer â”€â”€ */
  useEffect(() => {
    if (status === 'recording') {
      timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [status]);

  /* â”€â”€ waveform animation â”€â”€ */
  useEffect(() => {
    if (status !== 'recording') return;
    const id = setInterval(() => {
      setBars(Array(14).fill(0).map(() => Math.floor(Math.random() * 44) + 6));
    }, 120);
    return () => clearInterval(id);
  }, [status]);

  /* â”€â”€ transcript feed â”€â”€ */
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

  /* â”€â”€ emotion drift â”€â”€ */
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

  const handleStart = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const file = new File([audioBlob], `live-session-${Date.now()}.webm`, { type: 'audio/webm' });
        setUploadedFile(file);
        setStatus('idle'); 
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start(200);
      setStatus('recording');
      setElapsed(0);
      setTranscriptIdx(0);
      setDetectedKeywords([]);
      setEmotions({ Hesitant: 20, Stressed: 15, Confident: 65 });
      setBars(Array(14).fill(4));
    } catch (err) {
      alert("Microphone access is required for live detection.");
      console.error(err);
    }
  };

  const handlePause = () => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.pause();
    }
    setStatus('paused');
  };

  const handleResume = () => {
    if (mediaRecorderRef.current?.state === 'paused') {
      mediaRecorderRef.current.resume();
    }
    setStatus('recording');
  };

  const handleStop = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    } else {
      setStatus('idle');
    }
  };

  /* ── File upload handlers ── */
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('audio/')) {
      setUploadedFile(file);
    } else if (file) {
      alert('Please upload an audio file (MP3, WAV, M4A, etc.)');
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('audio/')) {
      setUploadedFile(file);
    } else if (file) {
      alert('Please upload an audio file (MP3, WAV, M4A, etc.)');
    }
  };

  const handleRemoveFile = () => {
    setUploadedFile(null);
    setUploadResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  /* ── Upload to backend ── */
  const handleAnalyzeUpload = async () => {
    if (!uploadedFile || uploading) return;
    setUploading(true);
    setUploadResult(null);
    try {
      await uploadRecording(uploadedFile, {
        mode: 'adaptive',
        recordedAt: new Date().toISOString(),
      });
      setUploadResult({ success: true, message: '✓ Uploaded — transcript is being generated.' });
      setUploadedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      setUploadResult({ success: false, message: err.message || 'Upload failed. Please try again.' });
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const fmt = s => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const card = { background: '#fff', border: `1px solid rgba(160,200,120,0.22)`, borderRadius: 20, padding: 24, boxShadow: `0 2px 16px ${C.shadow}` };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, fontFamily: 'Inter,sans-serif' }}>

      {/* Header */}
      <div>
        <h1 style={{ fontSize: 'clamp(22px,3vw,32px)', fontWeight: 900, color: C.text, letterSpacing: -1 }}>Live Detection</h1>
        <p style={{ fontSize: 14, color: C.textdim, marginTop: 6 }}>Real-time financial conversation monitoring</p>
      </div>

      {/* â”€â”€ IDLE STATE â€” Dynamic Animated Orb â”€â”€ */}
      {status === 'idle' && (
        <div className="ld-idle-container">
          {/* Background gradient blobs */}
          <div className="ld-bg-blob ld-bg-blob-1" />
          <div className="ld-bg-blob ld-bg-blob-2" />
          <div className="ld-bg-grid-dots" />

          {/* The orb assembly */}
          <div className="ld-orb-wrapper">

            {/* Outermost dashed ring */}
            <div className="ld-ring ld-ring-outer" />

            {/* Rotating binary data ring */}
            <svg className="ld-data-ring" viewBox="0 0 320 320">
              <defs>
                <path id="ldPath1" d="M 160,160 m -140,0 a 140,140 0 1,1 280,0 a 140,140 0 1,1 -280,0" fill="none" />
                <path id="ldPath2" d="M 160,160 m -118,0 a 118,118 0 1,0 236,0 a 118,118 0 1,0 -236,0" fill="none" />
              </defs>
              <text className="ld-data-text">
                <textPath href="#ldPath1" startOffset="0%">
                  â—ˆ DETECT â—ˆ ANALYZE â—ˆ PROTECT â—ˆ MONITOR â—ˆ DETECT â—ˆ ANALYZE â—ˆ PROTECT â—ˆ MONITOR â—ˆ
                </textPath>
              </text>
              <text className="ld-data-text ld-data-text-inner">
                <textPath href="#ldPath2" startOffset="0%">
                  0100 1001 1010 EMI 0010 SIP 0010 LOAN 1010 0100 1001 1010 RISK 0010 1010 0010 1111
                </textPath>
              </text>
            </svg>

            {/* Middle subtle ring */}
            <div className="ld-ring ld-ring-mid" />

            {/* Audio visualizer bars in a circle */}
            <IdleBars />

            {/* Floating particles */}
            <Particles />

            {/* The inner glowing mic orb */}
            <div
              className={`ld-mic-orb ${micHover ? 'is-hover' : ''}`}
              onMouseEnter={() => setMicHover(true)}
              onMouseLeave={() => setMicHover(false)}
              onClick={handleStart}
            >
              <div className="ld-mic-glow" />
              <div className="ld-mic-icon">
                <Mic size={38} />
              </div>
              {/* Pulse rings */}
              <div className="ld-mic-pulse ld-mic-pulse-1" />
              <div className="ld-mic-pulse ld-mic-pulse-2" />
              <div className="ld-mic-pulse ld-mic-pulse-3" />
            </div>
          </div>

          {/* Text content */}
          <div className="ld-idle-text">
            <h2 className="ld-idle-title">Ready to Listen</h2>
            <p className="ld-idle-desc">
              Start a session to detect financial keywords, emotions, and build a live transcript.
            </p>
          </div>

          {/* Action buttons row */}
          <div className="ld-action-row">
            <button onClick={handleStart} className="ld-start-btn">
              <Mic size={16} />
              <span>Start Session</span>
              <span className="ld-btn-shimmer" />
            </button>

            <div className="ld-divider-or">
              <span className="ld-divider-line" />
              <span className="ld-divider-text">or</span>
              <span className="ld-divider-line" />
            </div>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
              id="audio-upload"
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              className="ld-upload-btn"
            >
              <Upload size={16} />
              <span>Upload Audio</span>
            </button>
          </div>

          {/* Uploaded file info */}
          {uploadedFile && (
            <div className="ld-file-card">
              <div className="ld-file-icon">
                <Music size={20} />
              </div>
              <div className="ld-file-info">
                <span className="ld-file-name">{uploadedFile.name}</span>
                <span className="ld-file-meta">
                  {formatFileSize(uploadedFile.size)} · {uploadedFile.type.split('/')[1]?.toUpperCase()}
                </span>
              </div>
              <button className="ld-file-remove" onClick={handleRemoveFile} disabled={uploading}>
                <X size={14} />
              </button>
              <button className="ld-file-analyze" onClick={handleAnalyzeUpload} disabled={uploading}>
                <FileAudio size={14} />
                {uploading ? 'Uploading…' : 'Analyze'}
              </button>
            </div>
          )}

          {/* Upload result feedback */}
          {uploadResult && (
            <div style={{
              padding: '10px 18px', borderRadius: 12, fontSize: 13, fontWeight: 600,
              background: uploadResult.success ? '#ecfdf5' : '#fef2f2',
              border: `1px solid ${uploadResult.success ? '#a7f3d0' : '#fecaca'}`,
              color: uploadResult.success ? '#059669' : '#dc2626',
            }}>
              {uploadResult.message}
            </div>
          )}

          {/* Drop zone hint */}
          {!uploadedFile && (
            <div
              className={`ld-drop-zone ${dragOver ? 'is-drag-over' : ''}`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload size={16} className="ld-drop-icon" />
              <span>Drag & drop audio file here</span>
            </div>
          )}
        </div>
      )}

      {/* â”€â”€ ACTIVE / PAUSED / STOPPED â”€â”€ */}
      {status !== 'idle' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px,1fr) 1.5fr', gap: 20 }}>

          {/* LEFT â€” Listening Panel */}
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
              Monitoring: SIP Â· EMI Â· Loan Â· Investment Â· Budget
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

          {/* RIGHT â€” Keywords + Emotions */}
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

      {/* â”€â”€ TRANSCRIPT â”€â”€ */}
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
                âœ“ Session complete â€” {transcriptIdx} lines captured
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

        /* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
           LIVE DETECTION â€” IDLE STATE ANIMATIONS
           â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

        .ld-idle-container {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 24px 50px;
          background: #fff;
          border: 1px solid rgba(160,200,120,0.22);
          border-radius: 24px;
          box-shadow: 0 2px 16px rgba(100,140,60,0.11);
          overflow: hidden;
          min-height: 480px;
          gap: 28px;
        }

        /* â”€â”€ Background blobs â”€â”€ */
        .ld-bg-blob {
          position: absolute;
          border-radius: 50%;
          pointer-events: none;
          filter: blur(80px);
          opacity: 0.4;
        }
        .ld-bg-blob-1 {
          width: 350px; height: 350px;
          top: -100px; right: -80px;
          background: radial-gradient(circle, #DDEB9D, transparent 70%);
          animation: ldBlobDrift 8s ease-in-out infinite alternate;
        }
        .ld-bg-blob-2 {
          width: 280px; height: 280px;
          bottom: -80px; left: -60px;
          background: radial-gradient(circle, #A0C878, transparent 70%);
          animation: ldBlobDrift 10s ease-in-out 2s infinite alternate-reverse;
        }
        @keyframes ldBlobDrift {
          0%   { transform: translate(0, 0) scale(1); }
          100% { transform: translate(20px, -15px) scale(1.08); }
        }

        .ld-bg-grid-dots {
          position: absolute;
          inset: 0;
          pointer-events: none;
          background-image: radial-gradient(circle, rgba(160,200,120,0.06) 1px, transparent 1px);
          background-size: 28px 28px;
          opacity: 0.6;
        }

        /* â”€â”€ Orb wrapper â”€â”€ */
        .ld-orb-wrapper {
          position: relative;
          width: 280px;
          height: 280px;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2;
        }

        /* â”€â”€ Rings â”€â”€ */
        .ld-ring {
          position: absolute;
          border-radius: 50%;
          pointer-events: none;
        }
        .ld-ring-outer {
          inset: -10px;
          border: 1.5px dashed rgba(160,200,120,0.18);
          animation: ldRingSpin 25s linear infinite reverse;
        }
        .ld-ring-mid {
          inset: 28px;
          border: 1px solid rgba(160,200,120,0.12);
          box-shadow:
            0 0 40px rgba(160,200,120,0.06),
            inset 0 0 40px rgba(160,200,120,0.03);
          animation: ldRingBreath 4s ease-in-out infinite;
        }

        @keyframes ldRingSpin {
          to { transform: rotate(360deg); }
        }
        @keyframes ldRingBreath {
          0%, 100% { transform: scale(1); opacity: 0.7; }
          50%      { transform: scale(1.02); opacity: 1; }
        }

        /* â”€â”€ Data ring SVG text â”€â”€ */
        .ld-data-ring {
          position: absolute;
          width: 310px; height: 310px;
          top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          animation: ldDataSpin 40s linear infinite;
          pointer-events: none;
        }
        @keyframes ldDataSpin {
          to { transform: translate(-50%, -50%) rotate(360deg); }
        }
        .ld-data-text {
          fill: rgba(160,200,120,0.2);
          font-size: 8px;
          font-family: 'Inter', monospace;
          font-weight: 700;
          letter-spacing: 3px;
        }
        .ld-data-text-inner {
          fill: rgba(160,200,120,0.12);
          font-size: 7px;
          letter-spacing: 2.5px;
          animation: ldDataSpin 35s linear infinite reverse;
        }

        /* â”€â”€ Idle visualizer bars (circular) â”€â”€ */
        .ld-idle-bars {
          position: absolute;
          inset: 0;
          pointer-events: none;
        }
        .ld-idle-bar {
          position: absolute;
          top: 50%; left: 50%;
          width: 2.5px;
          height: 14px;
          border-radius: 2px;
          background: rgba(160,200,120,0.3);
          transform-origin: center bottom;
          animation: ldBarPulse 2s ease-in-out infinite;
          margin-left: -1.25px;
          margin-top: -7px;
        }
        @keyframes ldBarPulse {
          0%, 100% { height: 8px; opacity: 0.25; }
          50%      { height: 22px; opacity: 0.6; }
        }

        /* â”€â”€ Particles â”€â”€ */
        .ld-particles {
          position: absolute;
          inset: 0;
          pointer-events: none;
        }
        .ld-particle {
          position: absolute;
          top: 50%; left: 50%;
          width: var(--size, 4px);
          height: var(--size, 4px);
          border-radius: 50%;
          background: #A0C878;
          box-shadow: 0 0 6px rgba(160,200,120,0.4);
          animation: ldParticleOrbit 6s linear infinite;
          animation-delay: var(--delay);
        }
        @keyframes ldParticleOrbit {
          0% {
            transform: rotate(var(--angle)) translateX(var(--dist)) scale(0.5);
            opacity: 0;
          }
          20% { opacity: 0.8; transform: rotate(calc(var(--angle) + 72deg)) translateX(var(--dist)) scale(1); }
          80% { opacity: 0.6; transform: rotate(calc(var(--angle) + 288deg)) translateX(var(--dist)) scale(0.8); }
          100% {
            transform: rotate(calc(var(--angle) + 360deg)) translateX(var(--dist)) scale(0.5);
            opacity: 0;
          }
        }

        /* â”€â”€ Inner mic orb â”€â”€ */
        .ld-mic-orb {
          position: relative;
          width: 130px; height: 130px;
          border-radius: 50%;
          background: linear-gradient(145deg, #3a5428, #2a3d1c 50%, #1a2810);
          border: 2px solid rgba(160,200,120,0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          z-index: 5;
          box-shadow:
            0 0 60px rgba(160,200,120,0.12),
            0 0 120px rgba(160,200,120,0.05),
            inset 0 0 40px rgba(160,200,120,0.06),
            0 10px 40px rgba(0,0,0,0.25);
          transition: all 0.4s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .ld-mic-orb.is-hover {
          transform: scale(1.08);
          box-shadow:
            0 0 90px rgba(160,200,120,0.22),
            0 0 180px rgba(160,200,120,0.08),
            inset 0 0 50px rgba(160,200,120,0.1),
            0 14px 50px rgba(0,0,0,0.3);
          border-color: rgba(160,200,120,0.35);
        }

        .ld-mic-glow {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          background: radial-gradient(
            circle at 38% 32%,
            rgba(200,230,140,0.3) 0%,
            rgba(160,200,120,0.1) 35%,
            transparent 70%
          );
          animation: ldGlowPulse 3s ease-in-out infinite;
          pointer-events: none;
        }
        @keyframes ldGlowPulse {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50%      { opacity: 1; transform: scale(1.05); }
        }

        .ld-mic-icon {
          position: relative;
          z-index: 3;
          color: #DDEB9D;
          filter: drop-shadow(0 0 14px rgba(160,200,120,0.4));
          transition: all 0.3s ease;
          animation: ldMicFloat 3s ease-in-out infinite;
        }
        .ld-mic-orb.is-hover .ld-mic-icon {
          color: #fff;
          filter: drop-shadow(0 0 24px rgba(160,200,120,0.7));
          transform: scale(1.12);
        }
        @keyframes ldMicFloat {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(-3px); }
        }

        /* â”€â”€ Pulse rings â”€â”€ */
        .ld-mic-pulse {
          position: absolute;
          inset: -10px;
          border-radius: 50%;
          border: 2px solid rgba(160,200,120,0.2);
          animation: ldPulseExpand 3s ease-out infinite;
          pointer-events: none;
        }
        .ld-mic-pulse-2 {
          animation-delay: 1s;
          border-width: 1.5px;
        }
        .ld-mic-pulse-3 {
          animation-delay: 2s;
          border-width: 1px;
        }
        @keyframes ldPulseExpand {
          0%   { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(2.2); opacity: 0; }
        }

        /* â”€â”€ Idle text â”€â”€ */
        .ld-idle-text {
          position: relative;
          z-index: 3;
          text-align: center;
        }
        .ld-idle-title {
          font-size: 24px;
          font-weight: 900;
          color: #1a2010;
          margin-bottom: 8px;
          letter-spacing: -0.5px;
          animation: ldFadeUp 0.8s ease-out both;
        }
        .ld-idle-desc {
          font-size: 14px;
          color: #8a9a70;
          max-width: 380px;
          margin: 0 auto;
          line-height: 1.6;
          animation: ldFadeUp 0.8s ease-out 0.15s both;
        }
        @keyframes ldFadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* â”€â”€ Start button â”€â”€ */
        .ld-start-btn {
          position: relative;
          z-index: 3;
          display: flex;
          align-items: center;
          gap: 10px;
          background: #1a2010;
          color: #FFFDF6;
          border: none;
          padding: 14px 38px;
          border-radius: 40px;
          font-weight: 700;
          font-size: 15px;
          font-family: inherit;
          cursor: pointer;
          box-shadow: 0 6px 22px rgba(26,32,16,0.18);
          transition: all 0.3s cubic-bezier(0.22, 1, 0.36, 1);
          overflow: hidden;
          animation: ldFadeUp 0.8s ease-out 0.3s both;
        }
        .ld-start-btn:hover {
          transform: translateY(-3px) scale(1.03);
          box-shadow: 0 12px 36px rgba(26,32,16,0.25);
        }
        .ld-btn-shimmer {
          position: absolute;
          top: 0; left: -100%;
          width: 60%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent);
          animation: ldShimmer 3s ease-in-out infinite;
        }
        @keyframes ldShimmer {
          0%   { left: -100%; }
          50%  { left: 150%; }
          100% { left: 150%; }
        }

        /* ── Action row ── */
        .ld-action-row {
          position: relative;
          z-index: 3;
          display: flex;
          align-items: center;
          gap: 16px;
          animation: ldFadeUp 0.8s ease-out 0.3s both;
        }

        .ld-divider-or {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .ld-divider-line {
          width: 24px;
          height: 1px;
          background: rgba(160,200,120,0.3);
        }
        .ld-divider-text {
          font-size: 12px;
          font-weight: 600;
          color: #8a9a70;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        /* ── Upload button ── */
        .ld-upload-btn {
          position: relative;
          display: flex;
          align-items: center;
          gap: 10px;
          background: transparent;
          color: #4A7C3F;
          border: 2px solid rgba(160,200,120,0.35);
          padding: 12px 30px;
          border-radius: 40px;
          font-weight: 700;
          font-size: 15px;
          font-family: inherit;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .ld-upload-btn:hover {
          background: rgba(160,200,120,0.1);
          border-color: #A0C878;
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(100,140,60,0.12);
        }

        /* ── Drop zone ── */
        .ld-drop-zone {
          position: relative;
          z-index: 3;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 14px 24px;
          border: 1.5px dashed rgba(160,200,120,0.25);
          border-radius: 16px;
          color: #8a9a70;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s ease;
          animation: ldFadeUp 0.8s ease-out 0.45s both;
        }
        .ld-drop-zone:hover, .ld-drop-zone.is-drag-over {
          border-color: #A0C878;
          background: rgba(160,200,120,0.06);
          color: #4A7C3F;
        }
        .ld-drop-zone.is-drag-over {
          border-style: solid;
          background: rgba(160,200,120,0.12);
          transform: scale(1.02);
        }
        .ld-drop-icon {
          opacity: 0.6;
        }

        /* ── Uploaded file card ── */
        .ld-file-card {
          position: relative;
          z-index: 3;
          display: flex;
          align-items: center;
          gap: 14px;
          background: rgba(255,253,246,0.95);
          border: 1px solid rgba(160,200,120,0.3);
          border-radius: 16px;
          padding: 14px 18px;
          box-shadow: 0 4px 20px rgba(100,140,60,0.08);
          animation: ldFadeUp 0.4s ease-out both;
          max-width: 480px;
          width: 100%;
        }
        .ld-file-icon {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background: linear-gradient(135deg, #DDEB9D, #A0C878);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #1a2010;
          flex-shrink: 0;
        }
        .ld-file-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 3px;
          min-width: 0;
        }
        .ld-file-name {
          font-size: 14px;
          font-weight: 700;
          color: #1a2010;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .ld-file-meta {
          font-size: 12px;
          color: #8a9a70;
          font-weight: 500;
        }
        .ld-file-remove {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          border: 1px solid rgba(160,200,120,0.2);
          background: transparent;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #8a9a70;
          cursor: pointer;
          transition: all 0.2s ease;
          flex-shrink: 0;
        }
        .ld-file-remove:hover {
          background: #fef2f2;
          border-color: #fecaca;
          color: #dc2626;
        }
        .ld-file-analyze {
          display: flex;
          align-items: center;
          gap: 6px;
          background: #A0C878;
          color: #fff;
          border: none;
          padding: 8px 18px;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 700;
          font-family: inherit;
          cursor: pointer;
          transition: all 0.25s ease;
          flex-shrink: 0;
        }
        .ld-file-analyze:hover {
          background: #7aaa52;
          transform: translateY(-1px);
          box-shadow: 0 4px 14px rgba(100,140,60,0.2);
        }
      `}</style>
    </div>
  );
};

export default LiveDetection;

