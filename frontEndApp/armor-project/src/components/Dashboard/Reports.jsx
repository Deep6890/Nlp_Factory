<<<<<<< HEAD

import React, { useState } from 'react';
import { ChevronDown, CheckSquare, Square, FileText, Download, Loader2 } from 'lucide-react';


const C = { cream2: '#FAF6E9', limelt: '#DDEB9D', green: '#A0C878', greendk: '#7aaa52', text: '#1a2010', textmid: '#4a5a30', textdim: '#8a9a70' };

const inputCls = 'w-full appearance-none outline-none block font-bold rounded-xl px-4 py-3 transition-all cursor-pointer';
const inputStyle = { background: '#FAF6E9', border: '1px solid rgba(160,200,120,0.28)', color: '#1a2010', fontSize: 14 };

const Reports = () => {
  const [fromDate, setFromDate] = useState('2026-01-01');
  const [toDate, setToDate] = useState('2026-01-31');
  const [language, setLanguage] = useState('English');
  const [sections, setSections] = useState({ allSessions: true, emiSummary: true, decisions: true, riskAlerts: false, reminders: false });
  const [generating, setGenerating] = useState(false);
  const [reports, setReports] = useState([]);
=======
import React, { useState } from 'react';
import { ChevronDown, CheckSquare, Square, FileText, Download, Loader2 } from 'lucide-react';

const C = { cream2:'#FAF6E9', limelt:'#DDEB9D', green:'#A0C878', greendk:'#7aaa52', text:'#1a2010', textmid:'#4a5a30', textdim:'#8a9a70' };

const inputCls = 'w-full appearance-none outline-none block font-bold rounded-xl px-4 py-3 transition-all cursor-pointer';
const inputStyle = { background:'rgba(255,255,255,0.22)', backdropFilter:'blur(12px)', WebkitBackdropFilter:'blur(12px)', border:'1px solid rgba(255,255,255,0.5)', color:'#1a2010', fontSize:14, boxShadow:'inset 0 1px 0 rgba(255,255,255,0.7)' };

const Reports = () => {
  const [fromDate, setFromDate] = useState('2026-01-01');
  const [toDate,   setToDate]   = useState('2026-01-31');
  const [language, setLanguage] = useState('English');
  const [sections, setSections] = useState({ allSessions:true, emiSummary:true, decisions:true, riskAlerts:false, reminders:false });
  const [generating, setGenerating] = useState(false);
  const [reports, setReports] = useState([
    { id:1, title:'January 2026 — Full Summary',    meta:'Generated Jan 31 · 24 sessions · English', accent:true  },
    { id:2, title:'EMI & Loan Report — Jan 2026',   meta:'Generated Jan 28 · 8 sessions · Hindi',    accent:false },
  ]);
>>>>>>> dd881948122f09248bf8bacc155ba9069e739fe3

  const toggle = (k) => setSections(p => ({ ...p, [k]: !p[k] }));

  const generate = () => {
    setGenerating(true);
    setTimeout(() => {
<<<<<<< HEAD
      setGenerating(false);
      setReports(p => [{
        id: Date.now(),
        title: `Financial Summary (${fromDate} to ${toDate})`,
        meta: `Languages: ${language} • Sections: ${Object.keys(sections).filter(k => sections[k]).map(k => k.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())).join(', ')}`,
        accent: true
      }, ...p]);
    }, 1500);
  };

  const SECTIONS = [
    ['allSessions', 'All Sessions'], ['emiSummary', 'EMI Summary'],
    ['decisions', 'Decisions'], ['riskAlerts', 'Risk Alerts'], ['reminders', 'Reminders'],
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22, fontFamily: 'Inter,sans-serif', color: C.text }}>

      <div>
        <h1 style={{ fontSize: 'clamp(22px,3vw,32px)', fontWeight: 900, letterSpacing: -1 }}>Reports</h1>
        <p style={{ fontSize: 14, color: C.textdim, marginTop: 6 }}>Download structured financial summaries</p>
      </div>

      {/* Generate card */}
      <div style={{ background: '#fff', border: '1px solid rgba(160,200,120,0.22)', borderRadius: 20, padding: '28px 28px 24px', boxShadow: '0 2px 16px rgba(100,140,60,0.08)' }}>
        <h3 style={{ fontSize: 16, fontWeight: 800, color: C.text, marginBottom: 22 }}>Generate New Report</h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 16, marginBottom: 24 }}>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: C.textdim, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>From Date</label>
            <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className={inputCls} style={inputStyle} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: C.textdim, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>To Date</label>
            <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className={inputCls} style={inputStyle} />
          </div>
          <div style={{ position: 'relative' }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: C.textdim, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Language</label>
            <select value={language} onChange={e => setLanguage(e.target.value)} className={inputCls} style={{ ...inputStyle, paddingRight: 36 }}>
              {['English', 'Hinglish', 'Hindi', 'Gujarati', 'Kannada', 'Bengali', 'Marathi', 'Telugu', 'Tamil'].map(l => <option key={l}>{l}</option>)}
            </select>
            <ChevronDown size={15} style={{ position: 'absolute', right: 12, bottom: 14, color: C.textdim, pointerEvents: 'none' }} />
          </div>
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: C.textdim, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 14 }}>Include Sections</label>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            {SECTIONS.map(([k, label]) => (
              <div key={k} onClick={() => toggle(k)} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                {sections[k]
                  ? <CheckSquare size={17} style={{ color: C.greendk }} />
                  : <Square size={17} style={{ color: 'rgba(160,200,120,0.4)' }} />}
                <span style={{ fontSize: 13, fontWeight: 600, color: sections[k] ? C.text : C.textdim }}>{label}</span>
=======
      const d = new Date().toLocaleDateString('en-US', { month:'short', day:'numeric' });
      setReports(prev => [{ id:Date.now(), title:`Custom Report — ${d}`, meta:`Generated ${d} · Custom · ${language}`, accent:true }, ...prev]);
      setGenerating(false);
      const blob = new Blob(['Armor.ai Report'], { type:'text/plain' });
      window.open(URL.createObjectURL(blob), '_blank');
    }, 2500);
  };

  const SECTIONS = [
    ['allSessions','All Sessions'], ['emiSummary','EMI Summary'],
    ['decisions','Decisions'], ['riskAlerts','Risk Alerts'], ['reminders','Reminders'],
  ];

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:22, fontFamily:'Inter,sans-serif', color:C.text }}>

      <div>
        <h1 style={{ fontSize:'clamp(22px,3vw,32px)', fontWeight:900, letterSpacing:-1 }}>Reports</h1>
        <p style={{ fontSize:14, color:C.textdim, marginTop:6 }}>Download structured financial summaries</p>
      </div>

      {/* Generate card */}
      <div style={{ background:'rgba(255,255,255,0.18)', backdropFilter:'blur(20px)', WebkitBackdropFilter:'blur(20px)', border:'1px solid rgba(255,255,255,0.55)', borderRadius:20, padding:'28px 28px 24px', boxShadow:'0 8px 32px rgba(100,140,60,0.10), inset 0 1.5px 0 rgba(255,255,255,0.85)' }}>
        <h3 style={{ fontSize:16, fontWeight:800, color:C.text, marginBottom:22 }}>Generate New Report</h3>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:16, marginBottom:24 }}>
          <div>
            <label style={{ display:'block', fontSize:11, fontWeight:700, color:C.textdim, textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:8 }}>From Date</label>
            <input type="date" value={fromDate} onChange={e=>setFromDate(e.target.value)} className={inputCls} style={inputStyle} />
          </div>
          <div>
            <label style={{ display:'block', fontSize:11, fontWeight:700, color:C.textdim, textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:8 }}>To Date</label>
            <input type="date" value={toDate} onChange={e=>setToDate(e.target.value)} className={inputCls} style={inputStyle} />
          </div>
          <div style={{ position:'relative' }}>
            <label style={{ display:'block', fontSize:11, fontWeight:700, color:C.textdim, textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:8 }}>Language</label>
            <select value={language} onChange={e=>setLanguage(e.target.value)} className={inputCls} style={{ ...inputStyle, paddingRight:36 }}>
              {['English','Hinglish','Hindi','Gujarati','Kannada','Bengali','Marathi','Telugu','Tamil'].map(l=><option key={l}>{l}</option>)}
            </select>
            <ChevronDown size={15} style={{ position:'absolute', right:12, bottom:14, color:C.textdim, pointerEvents:'none' }} />
          </div>
        </div>

        <div style={{ marginBottom:24 }}>
          <label style={{ display:'block', fontSize:11, fontWeight:700, color:C.textdim, textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:14 }}>Include Sections</label>
          <div style={{ display:'flex', gap:16, flexWrap:'wrap' }}>
            {SECTIONS.map(([k, label]) => (
              <div key={k} onClick={() => toggle(k)} style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer' }}>
                {sections[k]
                  ? <CheckSquare size={17} style={{ color:C.greendk }} />
                  : <Square     size={17} style={{ color:'rgba(160,200,120,0.4)' }} />}
                <span style={{ fontSize:13, fontWeight:600, color: sections[k] ? C.text : C.textdim }}>{label}</span>
>>>>>>> dd881948122f09248bf8bacc155ba9069e739fe3
              </div>
            ))}
          </div>
        </div>

        <button onClick={generate} disabled={generating} style={{
<<<<<<< HEAD
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '11px 28px', borderRadius: 12, fontWeight: 700, fontSize: 14, cursor: generating ? 'not-allowed' : 'pointer',
          background: generating ? '#FAF6E9' : '#DDEB9D',
          color: generating ? C.textdim : C.text,
          border: `1px solid ${generating ? 'rgba(160,200,120,0.2)' : '#A0C878'}`,
          transition: 'all 0.2s',
=======
          display:'inline-flex', alignItems:'center', gap:8,
          padding:'11px 28px', borderRadius:12, fontWeight:700, fontSize:14, cursor: generating ? 'not-allowed' : 'pointer',
          background: generating ? '#FAF6E9' : '#DDEB9D',
          color: generating ? C.textdim : C.text,
          border: `1px solid ${generating ? 'rgba(160,200,120,0.2)' : '#A0C878'}`,
          transition:'all 0.2s',
>>>>>>> dd881948122f09248bf8bacc155ba9069e739fe3
        }}>
          {generating ? <><Loader2 size={16} className="animate-spin" /> Generating…</> : <><FileText size={16} /> Generate Report</>}
        </button>
      </div>

      {/* Recent reports */}
      <div>
<<<<<<< HEAD
        <h3 style={{ fontSize: 15, fontWeight: 800, color: C.text, marginBottom: 14 }}>Recent Reports</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {reports.map(r => (
            <div key={r.id} style={{ background: '#fff', border: '1px solid rgba(160,200,120,0.22)', borderRadius: 18, padding: '18px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, boxShadow: '0 2px 12px rgba(100,140,60,0.07)', transition: 'all 0.2s', flexWrap: 'wrap' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.borderColor = '#A0C878'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.borderColor = 'rgba(160,200,120,0.22)'; }}>
              <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                <div style={{ width: 44, height: 44, borderRadius: 14, background: r.accent ? '#DDEB9D' : '#FAF6E9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.text, flexShrink: 0 }}>
                  <FileText size={19} />
                </div>
                <div>
                  <h4 style={{ fontSize: 14, fontWeight: 800, color: C.text, marginBottom: 3 }}>{r.title}</h4>
                  <p style={{ fontSize: 11, color: C.textdim, fontWeight: 500 }}>{r.meta}</p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 11, fontWeight: 800, background: '#FAF6E9', color: C.textmid, border: '1px solid rgba(160,200,120,0.2)', padding: '3px 10px', borderRadius: 8 }}>PDF</span>
                <button onClick={() => alert(`Downloading ${r.title}`)} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  background: '#FAF6E9', border: '1px solid rgba(160,200,120,0.28)',
                  color: C.textmid, padding: '8px 16px', borderRadius: 10,
                  fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s',
                }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#DDEB9D'; e.currentTarget.style.color = C.text; }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#FAF6E9'; e.currentTarget.style.color = C.textmid; }}>
=======
        <h3 style={{ fontSize:15, fontWeight:800, color:C.text, marginBottom:14 }}>Recent Reports</h3>
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {reports.map(r => (
            <div key={r.id} style={{ background:'rgba(255,255,255,0.18)', backdropFilter:'blur(20px)', WebkitBackdropFilter:'blur(20px)', border:'1px solid rgba(255,255,255,0.55)', borderRadius:18, padding:'18px 22px', display:'flex', justifyContent:'space-between', alignItems:'center', gap:16, boxShadow:'0 8px 32px rgba(100,140,60,0.08), inset 0 1.5px 0 rgba(255,255,255,0.85)', transition:'all 0.35s cubic-bezier(0.22,1,0.36,1)', flexWrap:'wrap' }}
              onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.borderColor='#A0C878'; }}
              onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.borderColor='rgba(160,200,120,0.22)'; }}>
              <div style={{ display:'flex', gap:14, alignItems:'center' }}>
                <div style={{ width:44, height:44, borderRadius:14, background: r.accent ? 'rgba(221,235,157,0.55)' : 'rgba(255,255,255,0.30)', backdropFilter:'blur(8px)', WebkitBackdropFilter:'blur(8px)', border:'1px solid rgba(255,255,255,0.6)', boxShadow:'inset 0 1px 0 rgba(255,255,255,0.8)', display:'flex', alignItems:'center', justifyContent:'center', color:C.text, flexShrink:0 }}>
                  <FileText size={19} />
                </div>
                <div>
                  <h4 style={{ fontSize:14, fontWeight:800, color:C.text, marginBottom:3 }}>{r.title}</h4>
                  <p style={{ fontSize:11, color:C.textdim, fontWeight:500 }}>{r.meta}</p>
                </div>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <span style={{ fontSize:11, fontWeight:800, background:'rgba(255,255,255,0.30)', backdropFilter:'blur(8px)', WebkitBackdropFilter:'blur(8px)', border:'1px solid rgba(255,255,255,0.5)', color:C.textmid, padding:'3px 10px', borderRadius:8, boxShadow:'inset 0 1px 0 rgba(255,255,255,0.7)' }}>PDF</span>
                <button onClick={() => alert(`Downloading ${r.title}`)} style={{
                  display:'inline-flex', alignItems:'center', gap:6,
                  background:'rgba(255,255,255,0.22)', backdropFilter:'blur(12px)', WebkitBackdropFilter:'blur(12px)',
                  border:'1px solid rgba(255,255,255,0.5)',
                  color:C.textmid, padding:'8px 16px', borderRadius:10,
                  fontSize:13, fontWeight:700, cursor:'pointer', transition:'all 0.25s cubic-bezier(0.22,1,0.36,1)',
                  boxShadow:'inset 0 1px 0 rgba(255,255,255,0.7)',
                }}
                  onMouseEnter={e => { e.currentTarget.style.background='#DDEB9D'; e.currentTarget.style.color=C.text; }}
                  onMouseLeave={e => { e.currentTarget.style.background='#FAF6E9'; e.currentTarget.style.color=C.textmid; }}>
>>>>>>> dd881948122f09248bf8bacc155ba9069e739fe3
                  <Download size={14} /> Download
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Reports;
