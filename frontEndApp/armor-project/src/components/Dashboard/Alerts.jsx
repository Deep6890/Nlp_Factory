import React, { useState } from 'react';
import { AlertTriangle, Lightbulb, Wallet, ArrowRight, BrainCircuit } from 'lucide-react';

const C = { cream2:'#FAF6E9', limelt:'#DDEB9D', green:'#A0C878', greendk:'#7aaa52', text:'#1a2010', textmid:'#4a5a30', textdim:'#8a9a70', shadow:'rgba(100,140,60,0.11)' };
const card = { background:'#fff', border:'1px solid rgba(160,200,120,0.22)', borderRadius:20, padding:'20px 22px', boxShadow:`0 2px 16px ${C.shadow}`, transition:'all 0.25s' };
const hov = e => { e.currentTarget.style.transform='translateY(-3px)'; e.currentTarget.style.borderColor=C.green; };
const unHov = e => { e.currentTarget.style.transform=''; e.currentTarget.style.borderColor='rgba(160,200,120,0.22)'; };
const btnStyle = (active) => ({ padding:'7px 18px', borderRadius:12, fontSize:13, fontWeight:700, cursor:'pointer', transition:'all 0.2s', background:active?C.limelt:'#fff', color:active?C.text:C.textmid, border:`1px solid ${active?C.green:'rgba(160,200,120,0.28)'}` });

const ALERTS = [
  { section:'EMI Risk', col:'1/3', items:[
    { Icon:AlertTriangle, iconBg:C.text, iconColor:'#fff', title:'EMI Exceeds 40% Salary Threshold', level:'HIGH', lBg:'#fef2f2', lC:'#dc2626', lB:'#fecaca', body:'Your projected EMI of ₹48,000 is 53% of your ₹90,000 salary. This exceeds the safe limit of 40%.', from:'Home Loan Discussion · Jan 31' },
    { Icon:Lightbulb, iconBg:C.cream2, iconColor:C.textmid, title:'Car EMI Added on Top of Home Loan', level:'MED', lBg:'#fefce8', lC:'#92400e', lB:'#fde68a', body:'A car loan is being reconsidered while home loan EMI is already at risk. Combined EMI would reach 65%+.', from:'Car EMI Conversation · Jan 29' },
  ]},
  { section:'Emotion Risk', col:'3/-1', items:[
    { Icon:BrainCircuit, iconBg:C.cream2, iconColor:C.textmid, title:'Emotion-Driven Decision Detected', level:'MED', lBg:'#fefce8', lC:'#92400e', lB:'#fde68a', body:'High stress (60%) and uncertainty (75%) detected during Home Loan discussion. Decisions under stress may be suboptimal.', from:'Home Loan Discussion · Jan 31' },
  ]},
  { section:'Savings Risk', col:'1/-1', items:[
    { Icon:Wallet, iconBg:C.cream2, iconColor:C.textmid, title:'SIP May Be Discontinued', level:'LOW', lBg:C.limelt, lC:C.greendk, lB:C.green, body:'Conversation indicates SIP might be stopped if home loan is approved. This would eliminate your only active savings instrument.', from:'Home Loan Discussion · Jan 31' },
  ]},
];

const FILTERS = ['All Alerts (4)','EMI Risk (2)','Savings Risk (1)','Emotion Risk (1)'];

const Alerts = () => {
  const [active, setActive] = useState('All Alerts (4)');

  return (
    <div style={{ fontFamily:'Inter,sans-serif', display:'flex', flexDirection:'column', gap:20, color:C.text }}>

      <div>
        <h1 style={{ fontSize:'clamp(22px,3vw,30px)', fontWeight:900, letterSpacing:-1 }}>Risk Alerts</h1>
        <p style={{ fontSize:13, color:C.textdim, marginTop:5 }}>Financial warnings detected from your conversations</p>
      </div>

      <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
        {FILTERS.map(f=><button key={f} onClick={()=>setActive(f)} style={btnStyle(active===f)}>{f}</button>)}
      </div>

      {/* BENTO GRID */}
      <div style={{ display:'grid', gridTemplateColumns:'1.8fr 2.2fr 2.2fr 1.8fr', gap:14 }}>
        {ALERTS.map(({ section, col, items }) => (
          <div key={section} style={{ gridColumn:col, display:'flex', flexDirection:'column', gap:12 }}>
            <div style={{ fontSize:11, fontWeight:800, color:C.textdim, textTransform:'uppercase', letterSpacing:'1px' }}>{section}</div>
            {items.map(({ Icon, iconBg, iconColor, title, level, lBg, lC, lB, body, from }) => (
              <div key={title} style={{ ...card, display:'flex', gap:14, alignItems:'flex-start' }} onMouseEnter={hov} onMouseLeave={unHov}>
                <div style={{ width:38, height:38, borderRadius:'50%', background:iconBg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <Icon size={17} color={iconColor}/>
                </div>
                <div style={{ flex:1 }}>
                  <h4 style={{ fontSize:13, fontWeight:800, color:C.text, marginBottom:7 }}>{title}</h4>
                  <p style={{ fontSize:12, color:C.textmid, lineHeight:1.65, marginBottom:10 }}>{body}</p>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <span style={{ fontSize:10, fontWeight:800, background:lBg, color:lC, border:`1px solid ${lB}`, padding:'3px 10px', borderRadius:8 }}>{level}</span>
                    <span style={{ fontSize:11, color:C.textdim }}>From: {from}</span>
                  </div>
                </div>
                <button style={{ background:'none', border:'none', color:C.textdim, fontSize:12, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', gap:4, flexShrink:0 }}
                  onMouseEnter={e=>e.currentTarget.style.color=C.text} onMouseLeave={e=>e.currentTarget.style.color=C.textdim}>
                  View <ArrowRight size={12}/>
                </button>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Alerts;
