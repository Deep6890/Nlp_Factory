import React, { useState } from 'react';
import { Home, LineChart, Car, Landmark, Search, ArrowRight, AlertCircle, CheckCircle2, History } from 'lucide-react';

const C = { cream2:'#FAF6E9', limelt:'#DDEB9D', green:'#A0C878', greendk:'#7aaa52', text:'#1a2010', textmid:'#4a5a30', textdim:'#8a9a70', shadow:'rgba(100,140,60,0.11)' };
<<<<<<< HEAD
const card = { background:'#fff', border:'1px solid rgba(160,200,120,0.22)', borderRadius:20, padding:'20px 22px', boxShadow:`0 2px 16px ${C.shadow}`, transition:'all 0.25s', display:'flex', flexDirection:'column' };
const hov = e => { e.currentTarget.style.transform='translateY(-3px)'; e.currentTarget.style.borderColor=C.green; };
const unHov = e => { e.currentTarget.style.transform=''; e.currentTarget.style.borderColor='rgba(160,200,120,0.22)'; };
const btnStyle = (active) => ({ padding:'7px 18px', borderRadius:12, fontSize:13, fontWeight:700, cursor:'pointer', transition:'all 0.2s', background:active?C.limelt:'#fff', color:active?C.text:C.textmid, border:`1px solid ${active?C.green:'rgba(160,200,120,0.28)'}` });

const DATA = [];
=======
const liqGlass = { background:'rgba(255,255,255,0.18)', backdropFilter:'blur(20px)', WebkitBackdropFilter:'blur(20px)', border:'1px solid rgba(255,255,255,0.55)', boxShadow:'0 8px 32px rgba(100,140,60,0.10), inset 0 1.5px 0 rgba(255,255,255,0.85), inset 0 -1px 0 rgba(160,200,120,0.08)' };
const card = { ...liqGlass, borderRadius:20, padding:'20px 22px', transition:'all 0.35s cubic-bezier(0.22,1,0.36,1)', display:'flex', flexDirection:'column', position:'relative', overflow:'hidden' };
const hov = e => { e.currentTarget.style.transform='translateY(-4px)'; e.currentTarget.style.background='rgba(255,255,255,0.30)'; e.currentTarget.style.boxShadow='0 16px 48px rgba(100,140,60,0.14), inset 0 1.5px 0 rgba(255,255,255,0.9)'; e.currentTarget.style.borderColor='rgba(160,200,120,0.5)'; };
const unHov = e => { e.currentTarget.style.transform=''; e.currentTarget.style.background='rgba(255,255,255,0.18)'; e.currentTarget.style.boxShadow='0 8px 32px rgba(100,140,60,0.10), inset 0 1.5px 0 rgba(255,255,255,0.85), inset 0 -1px 0 rgba(160,200,120,0.08)'; e.currentTarget.style.borderColor='rgba(255,255,255,0.55)'; };
const btnStyle = (active) => ({ padding:'7px 18px', borderRadius:12, fontSize:13, fontWeight:700, cursor:'pointer', transition:'all 0.25s cubic-bezier(0.22,1,0.36,1)', background:active?'rgba(221,235,157,0.65)':'rgba(255,255,255,0.22)', backdropFilter:'blur(12px)', WebkitBackdropFilter:'blur(12px)', color:active?C.text:C.textmid, border:`1px solid ${active?'rgba(160,200,120,0.55)':'rgba(255,255,255,0.45)'}`, boxShadow:active?'0 4px 16px rgba(160,200,120,0.18), inset 0 1px 0 rgba(255,255,255,0.8)':'inset 0 1px 0 rgba(255,255,255,0.6)' });

const DATA = [
  { type:'Loan', Icon:Home, title:'Home Loan · ₹50 Lakh', update:'Jan 31, 2026', sessions:'3 sessions',
    steps:[{t:'RESEARCHING',bg:C.cream2,c:C.textmid},{t:'CONSIDERING',bg:C.limelt,c:C.text},{t:'FLAGGED',bg:C.text,c:'#fff'}],
    alert:'EMI would exceed 40% of salary — review before committing', alertType:'warning' },
  { type:'SIP', Icon:LineChart, title:'SIP Investment · ₹5,000/mo', update:'Jan 30, 2026', sessions:'2 sessions',
    steps:[{t:'PLANNED',bg:C.cream2,c:C.textmid},{t:'ACTIVE',bg:C.limelt,c:C.text}],
    alert:'SIP started — consistent contribution detected', alertType:'success' },
  { type:'Loan', Icon:Car, title:'Car Loan · ₹8 Lakh', update:'Jan 29, 2026', sessions:'2 sessions',
    steps:[{t:'PLANNED',bg:C.cream2,c:C.textmid},{t:'CANCELLED',bg:'#fef2f2',c:'#dc2626'},{t:'RECONSIDERING',bg:'#fefce8',c:'#92400e'}],
    alert:'Contradiction detected — decision reversed twice', alertType:'warning' },
  { type:'Investment', Icon:Landmark, title:'Mutual Fund · ₹2L lumpsum', update:'Jan 27, 2026', sessions:'1 session',
    steps:[{t:'PLANNED',bg:C.cream2,c:C.textmid}],
    alert:'Initial plan captured — no action yet', alertType:'info' },
];
>>>>>>> dd881948122f09248bf8bacc155ba9069e739fe3

const Decisions = () => {
  const [tab, setTab] = useState('All');
  const [search, setSearch] = useState('');

  const filtered = DATA.filter(d =>
    d.title.toLowerCase().includes(search.toLowerCase()) &&
    (tab==='All' || d.type===tab)
  );

  return (
    <div style={{ fontFamily:'Inter,sans-serif', display:'flex', flexDirection:'column', gap:20, color:C.text }}>

      <div>
        <h1 style={{ fontSize:'clamp(22px,3vw,30px)', fontWeight:900, letterSpacing:-1 }}>Decision Tracker</h1>
        <p style={{ fontSize:13, color:C.textdim, marginTop:5 }}>Track how your financial decisions evolve over time</p>
      </div>

      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:12 }}>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          {['All','Loan','SIP','Investment'].map(t=><button key={t} onClick={()=>setTab(t)} style={btnStyle(tab===t)}>{t}</button>)}
        </div>
<<<<<<< HEAD
        <div style={{ display:'flex', alignItems:'center', gap:8, background:'#fff', border:'1px solid rgba(160,200,120,0.28)', borderRadius:12, padding:'8px 14px', minWidth:200 }}>
=======
        <div style={{ display:'flex', alignItems:'center', gap:8, background:'rgba(255,255,255,0.22)', backdropFilter:'blur(16px)', WebkitBackdropFilter:'blur(16px)', border:'1px solid rgba(255,255,255,0.5)', borderRadius:12, padding:'8px 14px', minWidth:200, boxShadow:'inset 0 1px 0 rgba(255,255,255,0.8)' }}>
>>>>>>> dd881948122f09248bf8bacc155ba9069e739fe3
          <Search size={14} color={C.textdim}/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search decisions…"
            style={{ border:'none', outline:'none', background:'transparent', fontSize:13, fontWeight:600, color:C.text, width:'100%' }}/>
        </div>
      </div>

      {/* BENTO GRID — 4 cols */}
      <div style={{ display:'grid', gridTemplateColumns:'1.8fr 2.2fr 2.2fr 1.8fr', gap:14 }}>
        {filtered.length===0 && (
<<<<<<< HEAD
          <div style={{ gridColumn:'1/-1', padding:'48px 0', textAlign:'center', color:C.textdim, fontWeight:600, background:'#fff', borderRadius:20, border:'1px dashed rgba(160,200,120,0.3)' }}>
=======
          <div style={{ gridColumn:'1/-1', padding:'48px 0', textAlign:'center', color:C.textdim, fontWeight:600, background:'rgba(255,255,255,0.18)', backdropFilter:'blur(16px)', WebkitBackdropFilter:'blur(16px)', borderRadius:20, border:'1px dashed rgba(160,200,120,0.3)', boxShadow:'inset 0 1px 0 rgba(255,255,255,0.7)' }}>
>>>>>>> dd881948122f09248bf8bacc155ba9069e739fe3
            No decisions matched your filter.
          </div>
        )}
        {filtered.map((item, i) => {
          /* alternate: first 2 items span 2 cols each, rest span 2 cols each */
          const col = i%2===0 ? '1/3' : '3/-1';
          return (
            <div key={i} style={{ ...card, gridColumn:col, gap:14 }} onMouseEnter={hov} onMouseLeave={unHov}>
              <div style={{ display:'flex', alignItems:'flex-start', gap:12 }}>
<<<<<<< HEAD
                <div style={{ width:42, height:42, borderRadius:13, background:C.cream2, border:'1px solid rgba(160,200,120,0.2)', display:'flex', alignItems:'center', justifyContent:'center', color:C.text, flexShrink:0 }}>
=======
                <div style={{ width:42, height:42, borderRadius:13, background:'rgba(255,255,255,0.30)', backdropFilter:'blur(8px)', WebkitBackdropFilter:'blur(8px)', border:'1px solid rgba(255,255,255,0.6)', boxShadow:'inset 0 1px 0 rgba(255,255,255,0.8)', display:'flex', alignItems:'center', justifyContent:'center', color:C.text, flexShrink:0 }}>
>>>>>>> dd881948122f09248bf8bacc155ba9069e739fe3
                  <item.Icon size={19}/>
                </div>
                <div>
                  <h3 style={{ fontSize:14, fontWeight:800, color:C.text, marginBottom:4 }}>{item.title}</h3>
                  <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:11, color:C.textdim, fontWeight:600 }}>
                    <History size={11}/> {item.update} · {item.sessions}
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div style={{ display:'flex', alignItems:'center', flexWrap:'wrap', gap:6, paddingLeft:12, borderLeft:`2px solid rgba(160,200,120,0.2)` }}>
                {item.steps.map((s,si)=>(
                  <React.Fragment key={si}>
                    <span style={{ fontSize:10, fontWeight:800, letterSpacing:'0.5px', background:s.bg, color:s.c, padding:'4px 10px', borderRadius:8 }}>{s.t}</span>
                    {si<item.steps.length-1 && <ArrowRight size={11} color={C.textdim}/>}
                  </React.Fragment>
                ))}
              </div>

              {/* Alert */}
<<<<<<< HEAD
              <div style={{ background:C.cream2, border:'1px solid rgba(160,200,120,0.2)', borderRadius:12, padding:'11px 14px', display:'flex', alignItems:'flex-start', gap:9 }}>
=======
              <div style={{ background:'rgba(255,255,255,0.22)', backdropFilter:'blur(12px)', WebkitBackdropFilter:'blur(12px)', border:'1px solid rgba(255,255,255,0.5)', borderRadius:12, padding:'11px 14px', display:'flex', alignItems:'flex-start', gap:9, boxShadow:'inset 0 1px 0 rgba(255,255,255,0.8)' }}>
>>>>>>> dd881948122f09248bf8bacc155ba9069e739fe3
                {item.alertType==='success'
                  ? <CheckCircle2 size={14} color={C.greendk} style={{ flexShrink:0, marginTop:1 }}/>
                  : <AlertCircle  size={14} color={C.textdim}  style={{ flexShrink:0, marginTop:1 }}/>}
                <p style={{ fontSize:12, fontWeight:600, color:C.textmid, lineHeight:1.5 }}>{item.alert}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Decisions;
