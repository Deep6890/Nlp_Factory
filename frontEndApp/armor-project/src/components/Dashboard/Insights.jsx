import React, { useState } from 'react';
import { Activity, ShieldAlert, PiggyBank, Briefcase, AlertCircle, TrendingUp } from 'lucide-react';

const C = { cream2:'#FAF6E9', limelt:'#DDEB9D', green:'#A0C878', greendk:'#7aaa52', text:'#1a2010', textmid:'#4a5a30', textdim:'#8a9a70', shadow:'rgba(100,140,60,0.11)' };
const liqGlass = { background:'rgba(255,255,255,0.18)', backdropFilter:'blur(20px)', WebkitBackdropFilter:'blur(20px)', border:'1px solid rgba(255,255,255,0.55)', boxShadow:'0 8px 32px rgba(100,140,60,0.10), inset 0 1.5px 0 rgba(255,255,255,0.85), inset 0 -1px 0 rgba(160,200,120,0.08)' };
const card = { ...liqGlass, borderRadius:20, padding:'22px 24px', transition:'all 0.35s cubic-bezier(0.22,1,0.36,1)', display:'flex', flexDirection:'column', position:'relative', overflow:'hidden' };
const hov = e => { e.currentTarget.style.transform='translateY(-4px)'; e.currentTarget.style.background='rgba(255,255,255,0.30)'; e.currentTarget.style.boxShadow='0 16px 48px rgba(100,140,60,0.14), inset 0 1.5px 0 rgba(255,255,255,0.9)'; e.currentTarget.style.borderColor='rgba(160,200,120,0.5)'; };
const unHov = e => { e.currentTarget.style.transform=''; e.currentTarget.style.background='rgba(255,255,255,0.18)'; e.currentTarget.style.boxShadow='0 8px 32px rgba(100,140,60,0.10), inset 0 1.5px 0 rgba(255,255,255,0.85), inset 0 -1px 0 rgba(160,200,120,0.08)'; e.currentTarget.style.borderColor='rgba(255,255,255,0.55)'; };
const ib = (a) => ({ width:38, height:38, borderRadius:11, display:'flex', alignItems:'center', justifyContent:'center', background:a?'rgba(221,235,157,0.55)':'rgba(255,255,255,0.30)', backdropFilter:'blur(8px)', WebkitBackdropFilter:'blur(8px)', border:`1px solid ${a?'rgba(160,200,120,0.5)':'rgba(255,255,255,0.6)'}`, boxShadow:'inset 0 1px 0 rgba(255,255,255,0.8)', color:C.text, marginBottom:14, flexShrink:0 });
const btnStyle = (active) => ({ padding:'7px 18px', borderRadius:12, fontSize:13, fontWeight:700, cursor:'pointer', transition:'all 0.25s cubic-bezier(0.22,1,0.36,1)', background:active?'rgba(221,235,157,0.65)':'rgba(255,255,255,0.22)', backdropFilter:'blur(12px)', WebkitBackdropFilter:'blur(12px)', color:active?C.text:C.textmid, border:`1px solid ${active?'rgba(160,200,120,0.55)':'rgba(255,255,255,0.45)'}`, boxShadow:active?'0 4px 16px rgba(160,200,120,0.18), inset 0 1px 0 rgba(255,255,255,0.8)':'inset 0 1px 0 rgba(255,255,255,0.6)' });

const Insights = () => {
  const [tab, setTab] = useState('All');

  return (
    <div style={{ fontFamily:'Inter,sans-serif', display:'flex', flexDirection:'column', gap:20, color:C.text }}>

      <div>
        <h1 style={{ fontSize:'clamp(22px,3vw,30px)', fontWeight:900, letterSpacing:-1 }}>Financial Insights</h1>
        <p style={{ fontSize:13, color:C.textdim, marginTop:5 }}>Aggregated view from all your conversations</p>
      </div>

      {/* Snapshot banner — full width */}
      <div style={{ ...card, flexDirection:'row', alignItems:'flex-start', gap:14, background:'rgba(125,200,66,0.10)', border:'1px solid rgba(125,200,66,0.30)', boxShadow:'0 8px 32px rgba(100,140,60,0.10), inset 0 1.5px 0 rgba(255,255,255,0.85)' }}
        onMouseEnter={hov} onMouseLeave={unHov}>
        <div style={ib(true)}><Activity size={17}/></div>
        <p style={{ fontSize:13, color:C.textmid, lineHeight:1.7 }}>
          Your snapshot shows <strong style={{ color:C.text }}>₹48,000/mo</strong> in EMI,{' '}
          <strong style={{ color:C.text }}>₹5,000/mo</strong> SIP, and 1 active loan. Risk score:{' '}
          <span style={{ fontWeight:900, background:C.limelt, color:C.text, padding:'2px 10px', borderRadius:8, fontSize:12 }}>HIGH</span>
          {' '}— EMI-to-income ratio is 53%.
        </p>
      </div>

      {/* Filters */}
      <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
        {['All','EMI','SIP','Loans','Investments'].map(t=>(
          <button key={t} onClick={()=>setTab(t)} style={btnStyle(tab===t)}>{t}</button>
        ))}
      </div>

      {/* BENTO GRID — asymmetric */}
      <div style={{ display:'grid', gridTemplateColumns:'1.8fr 2.2fr 2.2fr 1.8fr', gridAutoRows:'auto', gap:14 }}>

        {/* EMI — spans 2 cols */}
        {(tab==='All'||tab==='EMI') && (
          <div style={{ ...card, gridColumn:'1/3' }} onMouseEnter={hov} onMouseLeave={unHov}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:16 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <div style={ib(false)}><ShieldAlert size={17}/></div>
                <span style={{ fontSize:12, fontWeight:700, color:C.textdim, textTransform:'uppercase', letterSpacing:'0.5px' }}>EMI Tracker</span>
              </div>
              <span style={{ fontSize:10, fontWeight:800, background:'#fef2f2', color:'#dc2626', border:'1px solid #fecaca', padding:'4px 12px', borderRadius:20 }}>High Risk</span>
            </div>
            <div style={{ fontSize:40, fontWeight:900, color:C.text, letterSpacing:-2, marginBottom:4 }}>₹48,000</div>
            <div style={{ fontSize:13, color:C.textdim, marginBottom:16 }}>per month committed</div>
            <div style={{ marginTop:'auto', paddingTop:16, borderTop:'1px solid rgba(160,200,120,0.15)' }}>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, marginBottom:8 }}>
                <span style={{ fontWeight:700, color:C.text }}>53% of salary</span>
                <span style={{ color:C.textdim }}>Safe: 40%</span>
              </div>
              <div style={{ height:7, background:C.cream2, borderRadius:4, overflow:'hidden' }}>
                <div style={{ width:'53%', height:'100%', background:C.green, borderRadius:4 }}/>
              </div>
            </div>
          </div>
        )}

        {/* SIP — spans 2 cols */}
        {(tab==='All'||tab==='SIP'||tab==='Investments') && (
          <div style={{ ...card, gridColumn:'3/-1' }} onMouseEnter={hov} onMouseLeave={unHov}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:16 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <div style={ib(true)}><PiggyBank size={17}/></div>
                <span style={{ fontSize:12, fontWeight:700, color:C.textdim, textTransform:'uppercase', letterSpacing:'0.5px' }}>SIP Tracker</span>
              </div>
              <span style={{ fontSize:10, fontWeight:800, background:C.limelt, color:C.greendk, border:`1px solid ${C.green}`, padding:'4px 12px', borderRadius:20 }}>Active</span>
            </div>
            <div style={{ fontSize:40, fontWeight:900, color:C.text, letterSpacing:-2, marginBottom:4 }}>₹5,000</div>
            <div style={{ fontSize:13, color:C.textdim, marginBottom:16 }}>per month · 3 funds</div>
            <div style={{ marginTop:'auto', paddingTop:14, borderTop:'1px solid rgba(160,200,120,0.15)' }}>
              <div style={{ fontSize:11, fontWeight:700, color:C.textdim, marginBottom:10 }}>Started: Jan 2025</div>
              <div style={{ display:'flex', alignItems:'flex-end', gap:4, height:44 }}>
                {[20,25,30,30,35,60].map((h,i)=>(
                  <div key={i} style={{ flex:1, borderRadius:4, background:C.limelt, height:`${h}%`, transition:`height 0.5s ease ${i*50}ms` }}/>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Loan — spans full width */}
        {(tab==='All'||tab==='Loans') && (
          <div style={{ ...card, gridColumn:'1/-1', flexDirection:'row', alignItems:'center', gap:24, flexWrap:'wrap' }} onMouseEnter={hov} onMouseLeave={unHov}>
            <div style={{ display:'flex', alignItems:'center', gap:12, flex:'0 0 auto' }}>
              <div style={ib(false)}><Briefcase size={17}/></div>
              <div>
                <div style={{ fontSize:12, fontWeight:700, color:C.textdim, textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:4 }}>Loan Tracker</div>
                <div style={{ fontSize:36, fontWeight:900, color:C.text, letterSpacing:-2, lineHeight:1 }}>₹50L</div>
                <div style={{ fontSize:12, color:C.textdim, marginTop:4 }}>Home loan under evaluation</div>
              </div>
            </div>
            <div style={{ flex:1, minWidth:200, background:'rgba(255,255,255,0.22)', backdropFilter:'blur(12px)', WebkitBackdropFilter:'blur(12px)', border:'1px solid rgba(255,255,255,0.55)', borderRadius:14, padding:'14px 18px', boxShadow:'inset 0 1px 0 rgba(255,255,255,0.8)' }}>
              <div style={{ fontSize:12, fontWeight:700, color:C.textmid, marginBottom:8 }}>Tenor: 15 yrs &nbsp;|&nbsp; Rate: 8.5%</div>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <AlertCircle size={13} color={C.textdim}/>
                <span style={{ fontSize:12, color:C.textdim }}>Decision: <strong style={{ color:C.text }}>Pending Review</strong></span>
              </div>
            </div>
            <span style={{ fontSize:10, fontWeight:800, background:'#fefce8', color:'#92400e', border:'1px solid #fde68a', padding:'6px 16px', borderRadius:20 }}>Pending</span>
          </div>
        )}

        {/* Summary stats row */}
        {tab==='All' && (
          <>
            <div style={{ ...card, gridColumn:'1/3', flexDirection:'row', alignItems:'center', gap:16 }} onMouseEnter={hov} onMouseLeave={unHov}>
              <div style={ib(true)}><TrendingUp size={17}/></div>
              <div>
                <div style={{ fontSize:11, fontWeight:700, color:C.textdim, textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:4 }}>Total EMI Exposure</div>
                <div style={{ fontSize:28, fontWeight:900, color:C.text, letterSpacing:-1 }}>53%</div>
                <div style={{ fontSize:12, color:'#dc2626', fontWeight:600 }}>Above safe threshold</div>
              </div>
            </div>
            <div style={{ ...card, gridColumn:'3/-1', flexDirection:'row', alignItems:'center', gap:16 }} onMouseEnter={hov} onMouseLeave={unHov}>
              <div style={ib(false)}><Activity size={17}/></div>
              <div>
                <div style={{ fontSize:11, fontWeight:700, color:C.textdim, textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:4 }}>Monthly Savings</div>
                <div style={{ fontSize:28, fontWeight:900, color:C.text, letterSpacing:-1 }}>₹37K</div>
                <div style={{ fontSize:12, color:C.greendk, fontWeight:600 }}>After all commitments</div>
              </div>
            </div>
          </>
        )}

      </div>
    </div>
  );
};

export default Insights;
