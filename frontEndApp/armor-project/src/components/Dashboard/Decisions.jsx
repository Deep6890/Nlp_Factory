import React, { useState } from 'react';
import { Home, LineChart, Car, Landmark, Search, ArrowRight, AlertCircle, CheckCircle2, History } from 'lucide-react';

const C = { cream2:'#FAF6E9', limelt:'#DDEB9D', green:'#A0C878', greendk:'#7aaa52', text:'#1a2010', textmid:'#4a5a30', textdim:'#8a9a70', shadow:'rgba(100,140,60,0.11)' };
const card = { background:'#fff', border:'1px solid rgba(160,200,120,0.22)', borderRadius:20, padding:'20px 22px', boxShadow:`0 2px 16px ${C.shadow}`, transition:'all 0.25s', display:'flex', flexDirection:'column' };
const hov = e => { e.currentTarget.style.transform='translateY(-3px)'; e.currentTarget.style.borderColor=C.green; };
const unHov = e => { e.currentTarget.style.transform=''; e.currentTarget.style.borderColor='rgba(160,200,120,0.22)'; };
const btnStyle = (active) => ({ padding:'7px 18px', borderRadius:12, fontSize:13, fontWeight:700, cursor:'pointer', transition:'all 0.2s', background:active?C.limelt:'#fff', color:active?C.text:C.textmid, border:`1px solid ${active?C.green:'rgba(160,200,120,0.28)'}` });

const DATA = [];

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
        <div style={{ display:'flex', alignItems:'center', gap:8, background:'#fff', border:'1px solid rgba(160,200,120,0.28)', borderRadius:12, padding:'8px 14px', minWidth:200 }}>
          <Search size={14} color={C.textdim}/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search decisions…"
            style={{ border:'none', outline:'none', background:'transparent', fontSize:13, fontWeight:600, color:C.text, width:'100%' }}/>
        </div>
      </div>

      {/* BENTO GRID — 4 cols */}
      <div style={{ display:'grid', gridTemplateColumns:'1.8fr 2.2fr 2.2fr 1.8fr', gap:14 }}>
        {filtered.length===0 && (
          <div style={{ gridColumn:'1/-1', padding:'48px 0', textAlign:'center', color:C.textdim, fontWeight:600, background:'#fff', borderRadius:20, border:'1px dashed rgba(160,200,120,0.3)' }}>
            No decisions matched your filter.
          </div>
        )}
        {filtered.map((item, i) => {
          /* alternate: first 2 items span 2 cols each, rest span 2 cols each */
          const col = i%2===0 ? '1/3' : '3/-1';
          return (
            <div key={i} style={{ ...card, gridColumn:col, gap:14 }} onMouseEnter={hov} onMouseLeave={unHov}>
              <div style={{ display:'flex', alignItems:'flex-start', gap:12 }}>
                <div style={{ width:42, height:42, borderRadius:13, background:C.cream2, border:'1px solid rgba(160,200,120,0.2)', display:'flex', alignItems:'center', justifyContent:'center', color:C.text, flexShrink:0 }}>
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
              <div style={{ background:C.cream2, border:'1px solid rgba(160,200,120,0.2)', borderRadius:12, padding:'11px 14px', display:'flex', alignItems:'flex-start', gap:9 }}>
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
