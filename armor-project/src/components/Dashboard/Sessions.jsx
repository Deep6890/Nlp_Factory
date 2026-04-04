import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ChevronRight, ChevronLeft, Activity } from 'lucide-react';

const C = { cream2:'#FAF6E9', limelt:'#DDEB9D', green:'#A0C878', greendk:'#7aaa52', text:'#1a2010', textmid:'#4a5a30', textdim:'#8a9a70' };

const RISK_STYLE = {
  HIGH: { bg:'#fef2f2', color:'#dc2626', border:'#fecaca' },
  MED:  { bg:'#fefce8', color:'#92400e', border:'#fde68a' },
  LOW:  { bg:'#DDEB9D', color:'#4a5a30', border:'#A0C878' },
};

const Sessions = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [lang, setLang]   = useState('All');
  const [topic, setTopic] = useState('All');
  const [risk, setRisk]   = useState('All');

  const sessions = [
    { name:'Home Loan Discussion',  date:'Jan 31, 2026 · 2:30 PM', lang:'Hinglish', topic:'Home Loan',  duration:'4m 23s', risk:'HIGH' },
    { name:'SIP Planning Call',     date:'Jan 30, 2026 · 11:15 AM',lang:'English',  topic:'SIP',        duration:'2m 10s', risk:'LOW'  },
    { name:'Car EMI Conversation',  date:'Jan 29, 2026 · 6:45 PM', lang:'Gujarati', topic:'EMI',        duration:'3m 58s', risk:'MED'  },
    { name:'Investment Strategy',   date:'Jan 27, 2026 · 9:00 AM', lang:'English',  topic:'Investment', duration:'6m 12s', risk:'LOW'  },
    { name:'Budget Review',         date:'Jan 25, 2026 · 3:20 PM', lang:'Hinglish', topic:'Budget',     duration:'5m 44s', risk:'MED'  },
  ];

  const filtered = sessions.filter(s =>
    (s.name.toLowerCase().includes(search.toLowerCase()) || s.topic.toLowerCase().includes(search.toLowerCase())) &&
    (lang  === 'All' || s.lang  === lang)  &&
    (topic === 'All' || s.topic === topic) &&
    (risk  === 'All' || s.risk  === risk)
  );

  const selStyle = { background:'#FAF6E9', border:'1px solid rgba(160,200,120,0.28)', borderRadius:12, padding:'8px 14px', fontSize:13, fontWeight:700, color:C.text, outline:'none', cursor:'pointer' };

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:22, fontFamily:'Inter,sans-serif', color:C.text }}>

      <div>
        <h1 style={{ fontSize:'clamp(22px,3vw,32px)', fontWeight:900, letterSpacing:-1 }}>Session History</h1>
        <p style={{ fontSize:14, color:C.textdim, marginTop:6 }}>All recorded financial conversations</p>
      </div>

      {/* Filter bar */}
      <div style={{ display:'flex', gap:10, flexWrap:'wrap', alignItems:'center' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, background:'#fff', border:'1px solid rgba(160,200,120,0.28)', borderRadius:14, padding:'6px 14px', flex:'1 1 200px', minWidth:180 }}>
          <Search size={15} color={C.textdim} />
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search sessions…"
            style={{ border:'none', outline:'none', background:'transparent', fontSize:13, fontWeight:600, color:C.text, width:'100%' }} />
        </div>
        <select value={lang}  onChange={e=>setLang(e.target.value)}  style={selStyle}>
          <option value="All">Language: All</option>
          <option>English</option><option>Hinglish</option><option>Gujarati</option>
        </select>
        <select value={topic} onChange={e=>setTopic(e.target.value)} style={selStyle}>
          <option value="All">Topic: All</option>
          <option>Loan</option><option>SIP</option><option>EMI</option><option>Investment</option>
        </select>
        <select value={risk}  onChange={e=>setRisk(e.target.value)}  style={selStyle}>
          <option value="All">Risk: All</option>
          <option value="HIGH">High</option><option value="MED">Medium</option><option value="LOW">Low</option>
        </select>
      </div>

      {/* Table */}
      <div style={{ background:'#fff', border:'1px solid rgba(160,200,120,0.22)', borderRadius:20, overflow:'hidden', boxShadow:'0 2px 16px rgba(100,140,60,0.10)' }}>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead>
            <tr style={{ background:'#FAF6E9', borderBottom:'1px solid rgba(160,200,120,0.18)' }}>
              {['Session','Language','Topic','Duration','Risk',''].map(h => (
                <th key={h} style={{ padding:'14px 20px', fontSize:11, fontWeight:700, color:C.textdim, textTransform:'uppercase', letterSpacing:'0.5px', textAlign:'left' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((s, i) => {
              const rs = RISK_STYLE[s.risk];
              return (
                <tr key={i} onClick={() => navigate(`/dashboard/sessions/${i}`)}
                  style={{ borderBottom:'1px solid rgba(160,200,120,0.12)', cursor:'pointer', transition:'background 0.18s' }}
                  onMouseEnter={e => e.currentTarget.style.background='#FAF6E9'}
                  onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                  <td style={{ padding:'14px 20px' }}>
                    <div style={{ fontSize:13, fontWeight:700, color:C.text }}>{s.name}</div>
                    <div style={{ fontSize:11, color:C.textdim, marginTop:2 }}>{s.date}</div>
                  </td>
                  <td style={{ padding:'14px 20px', fontSize:13, fontWeight:600, color:C.textmid }}>{s.lang}</td>
                  <td style={{ padding:'14px 20px' }}>
                    <span style={{ background:'#FAF6E9', border:'1px solid rgba(160,200,120,0.2)', color:C.textmid, padding:'3px 10px', borderRadius:8, fontSize:12, fontWeight:700 }}>{s.topic}</span>
                  </td>
                  <td style={{ padding:'14px 20px', fontSize:13, fontWeight:600, color:C.textmid, display:'flex', alignItems:'center', gap:6 }}>
                    <Activity size={13} color={C.textdim} /> {s.duration}
                  </td>
                  <td style={{ padding:'14px 20px' }}>
                    <span style={{ fontSize:10, fontWeight:800, background:rs.bg, color:rs.color, border:`1px solid ${rs.border}`, padding:'3px 10px', borderRadius:8 }}>{s.risk}</span>
                  </td>
                  <td style={{ padding:'14px 20px', textAlign:'right' }}>
                    <ChevronRight size={16} color={C.textdim} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', background:'#fff', border:'1px solid rgba(160,200,120,0.22)', borderRadius:16, padding:'12px 20px', boxShadow:'0 2px 12px rgba(100,140,60,0.08)' }}>
        <span style={{ fontSize:13, color:C.textdim, fontWeight:500 }}>Showing {filtered.length} of {sessions.length} sessions</span>
        <div style={{ display:'flex', gap:6, alignItems:'center' }}>
          <button style={{ display:'flex', alignItems:'center', gap:4, background:'#FAF6E9', border:'1px solid rgba(160,200,120,0.28)', borderRadius:10, padding:'7px 14px', fontSize:13, fontWeight:700, color:C.textmid, cursor:'pointer' }}>
            <ChevronLeft size={14} /> Prev
          </button>
          {[1,2,3].map(n => (
            <button key={n} style={{ width:32, height:32, borderRadius:8, border:'none', background: n===1 ? '#DDEB9D' : '#FAF6E9', color: n===1 ? C.text : C.textmid, fontWeight:700, fontSize:13, cursor:'pointer' }}>{n}</button>
          ))}
          <button style={{ display:'flex', alignItems:'center', gap:4, background:'#FAF6E9', border:'1px solid rgba(160,200,120,0.28)', borderRadius:10, padding:'7px 14px', fontSize:13, fontWeight:700, color:C.textmid, cursor:'pointer' }}>
            Next <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sessions;
