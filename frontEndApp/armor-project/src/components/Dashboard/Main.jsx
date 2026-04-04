import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Folder, AlertTriangle, TrendingUp, ShieldCheck,
  BarChart2, Activity, Zap, ChevronRight, Mic,
} from 'lucide-react';

const C = {
  cream2:'#FAF6E9', limelt:'#DDEB9D', green:'#A0C878',
  greendk:'#7aaa52', text:'#1a2010', textmid:'#4a5a30',
  textdim:'#8a9a70', shadow:'rgba(100,140,60,0.12)',
};

const Counter = ({ target, suffix = '' }) => {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let n = 0; const step = Math.ceil(target / 40);
    const id = setInterval(() => { n += step; if (n >= target) { setVal(target); clearInterval(id); } else setVal(n); }, 30);
    return () => clearInterval(id);
  }, [target]);
  return <>{val.toLocaleString()}{suffix}</>;
};

const RiskBadge = ({ risk }) => {
  const m = { 'High Risk':{ bg:'#fef2f2',c:'#dc2626',b:'#fecaca' }, 'Low Risk':{ bg:C.limelt,c:C.greendk,b:C.green }, 'Med Risk':{ bg:'#fefce8',c:'#92400e',b:'#fde68a' } };
  const s = m[risk] || m['Med Risk'];
  return <span style={{ fontSize:10, fontWeight:800, background:s.bg, color:s.c, border:`1px solid ${s.b}`, padding:'3px 10px', borderRadius:8 }}>{risk}</span>;
};

const SESSIONS = [
  { Icon:Folder,      title:'Home Loan ₹50L', sub:'Today · Hinglish',    risk:'High Risk' },
  { Icon:TrendingUp,  title:'SIP ₹5,000/mo',  sub:'Yesterday · English', risk:'Low Risk'  },
  { Icon:ShieldCheck, title:'Car Loan EMI',    sub:'Jan 29 · Gujarati',   risk:'Med Risk'  },
  { Icon:BarChart2,   title:'Mutual Fund SIP', sub:'Jan 27 · Hindi',      risk:'Low Risk'  },
];

const Main = () => {
  const navigate = useNavigate();

  const base = { borderRadius:24, padding:'22px 24px', display:'flex', flexDirection:'column', transition:'all 0.28s ease', boxShadow:`0 2px 16px ${C.shadow}`, position:'relative' };
  const white = { ...base, background:'#fff', border:'1px solid rgba(160,200,120,0.22)' };
  const dark  = { ...base, background:C.text, border:'none', boxShadow:'0 8px 32px rgba(26,32,16,0.18)' };
  const lime  = { ...base, background:`linear-gradient(145deg,${C.limelt} 0%,${C.green} 100%)`, border:'none', boxShadow:`0 8px 32px rgba(100,160,60,0.22)` };

  const ib = (accent) => ({ width:38, height:38, borderRadius:11, marginBottom:12, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', background:accent?C.limelt:C.cream2, border:`1px solid ${accent?C.green:'rgba(160,200,120,0.2)'}`, color:C.text });
  const lbl = { fontSize:11, fontWeight:700, color:C.textdim, textTransform:'uppercase', letterSpacing:'0.6px', marginBottom:4 };
  const big = { fontSize:44, fontWeight:900, color:C.text, lineHeight:1, letterSpacing:-2 };
  const tag = (bg,color,border) => ({ display:'inline-flex', alignItems:'center', gap:5, fontSize:11, fontWeight:700, background:bg, color, border:`1px solid ${border}`, padding:'4px 12px', borderRadius:30, width:'fit-content' });

  const lift = e => { e.currentTarget.style.transform='translateY(-4px)'; e.currentTarget.style.boxShadow=`0 16px 48px ${C.shadow}`; };
  const drop = e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow=`0 2px 16px ${C.shadow}`; };
  const liftD = e => { e.currentTarget.style.transform='translateY(-4px)'; e.currentTarget.style.boxShadow='0 16px 48px rgba(26,32,16,0.28)'; };
  const dropD = e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow='0 8px 32px rgba(26,32,16,0.18)'; };

  return (
    <div style={{ fontFamily:'Inter,sans-serif', display:'flex', flexDirection:'column', gap:20 }}>

      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={{ fontSize:'clamp(22px,3vw,30px)', fontWeight:900, color:C.text, letterSpacing:-1, lineHeight:1.1 }}>Financial Intelligence</h1>
          <p style={{ fontSize:13, color:C.textdim, marginTop:5 }}>Here's your live summary for today</p>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8, background:'#fef2f2', border:'1px solid #fecaca', borderRadius:12, padding:'8px 16px', flexWrap:'wrap' }}>
          <span style={{ width:7, height:7, borderRadius:'50%', background:'#dc2626', flexShrink:0, boxShadow:'0 0 0 3px rgba(220,38,38,0.15)', display:'inline-block' }} />
          <span style={{ fontSize:12, color:'#dc2626', fontWeight:700 }}>Risk Alert: EMI exceeds 40% of salary</span>
          <button onClick={() => navigate('/dashboard/alerts')} style={{ background:'#dc2626', color:'#fff', border:'none', padding:'5px 14px', borderRadius:8, fontSize:11, fontWeight:800, cursor:'pointer', whiteSpace:'nowrap' }}>
            Review →
          </button>
        </div>
      </div>

      {/* BENTO GRID — 4 cols, rows auto-size */}
      <div style={{ display:'grid', gridTemplateColumns:'1.8fr 2.2fr 2.2fr 1.8fr', gridTemplateRows:'repeat(3, minmax(0,auto))', gap:14 }}>

        {/* A — Sessions */}
        <div style={{ ...white, gridColumn:'1', gridRow:'1', minHeight:160 }} onMouseEnter={lift} onMouseLeave={drop}>
          <div style={ib(false)}><Folder size={18} /></div>
          <div style={lbl}>Total Sessions</div>
          <div style={big}><Counter target={24} /></div>
          <div style={{ ...tag(C.limelt,C.greendk,C.green), marginTop:10 }}>↑ +3 this week</div>
        </div>

        {/* B — HERO dark card 2×2 */}
        <div style={{ ...dark, gridColumn:'2/4', gridRow:'1/3', justifyContent:'space-between', padding:'28px 28px 24px', overflow:'hidden' }} onMouseEnter={liftD} onMouseLeave={dropD}>
          <div style={{ position:'absolute', top:-60, right:-60, width:260, height:260, borderRadius:'50%', background:`radial-gradient(circle,${C.limelt}55,transparent 70%)`, pointerEvents:'none' }} />
          <div style={{ position:'absolute', bottom:-40, left:-40, width:180, height:180, borderRadius:'50%', background:`radial-gradient(circle,${C.green}33,transparent 70%)`, pointerEvents:'none' }} />
          <div style={{ position:'relative', zIndex:1 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20 }}>
              <div style={{ width:36, height:36, borderRadius:10, background:C.limelt, display:'flex', alignItems:'center', justifyContent:'center', color:C.text }}><Zap size={17} /></div>
              <span style={{ fontSize:13, fontWeight:700, color:'rgba(255,255,255,0.55)' }}>Armor.ai</span>
            </div>
            <h2 style={{ fontSize:'clamp(26px,3.2vw,40px)', fontWeight:900, color:'#fff', lineHeight:1.1, letterSpacing:-1.5, marginBottom:12 }}>AI-Powered<br />Finance Guard.</h2>
            <p style={{ fontSize:13, color:'rgba(255,255,255,0.5)', lineHeight:1.65, maxWidth:340 }}>Real-time risk detection, smart decisions, and live financial monitoring — all in one place.</p>
          </div>
          <div style={{ position:'relative', zIndex:1, display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
            <div>
              <div style={{ fontSize:11, fontWeight:700, color:'rgba(255,255,255,0.4)', textTransform:'uppercase', letterSpacing:'0.6px', marginBottom:4 }}>Sessions this month</div>
              <div style={{ fontSize:32, fontWeight:900, color:'#fff', letterSpacing:-1 }}><Counter target={24} /></div>
            </div>
            <button onClick={() => navigate('/dashboard/live')} style={{ background:C.limelt, color:C.text, border:'none', padding:'12px 26px', borderRadius:40, fontSize:14, fontWeight:800, cursor:'pointer', display:'inline-flex', alignItems:'center', gap:9, boxShadow:`0 6px 24px rgba(221,235,157,0.35)`, transition:'all 0.22s' }}
              onMouseEnter={e => { e.currentTarget.style.background=C.green; e.currentTarget.style.transform='translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.background=C.limelt; e.currentTarget.style.transform=''; }}>
              <Mic size={15} /> Start Session
            </button>
          </div>
        </div>

        {/* C — AI Accuracy */}
        <div style={{ ...white, gridColumn:'4', gridRow:'1', justifyContent:'space-between', minHeight:160 }} onMouseEnter={lift} onMouseLeave={drop}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
            <div style={ib(true)}><Activity size={18} /></div>
            <span style={{ ...tag(C.limelt,C.greendk,C.green) }}>Live</span>
          </div>
          <div>
            <div style={lbl}>AI Accuracy</div>
            <div style={{ ...big, fontSize:40 }}><Counter target={98} suffix="%" /></div>
          </div>
        </div>

        {/* D — Risk Alerts */}
        <div style={{ ...white, gridColumn:'1', gridRow:'2', borderColor:'rgba(220,100,100,0.18)', minHeight:160 }}
          onMouseEnter={e => { e.currentTarget.style.transform='translateY(-4px)'; e.currentTarget.style.borderColor='#fecaca'; }}
          onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.borderColor='rgba(220,100,100,0.18)'; }}>
          <div style={{ ...ib(false), background:'#fef2f2', border:'1px solid #fecaca', color:'#dc2626' }}><AlertTriangle size={18} /></div>
          <div style={{ ...lbl, color:'#dc2626' }}>Risk Alerts</div>
          <div style={{ ...big, color:'#dc2626' }}><Counter target={2} /></div>
          <div style={{ ...tag('#fef2f2','#dc2626','#fecaca'), marginTop:10 }}>Needs attention</div>
        </div>

        {/* E — Live Detection CTA */}
        <div style={{ ...lime, gridColumn:'4', gridRow:'2', justifyContent:'space-between', minHeight:160, overflow:'hidden' }}
          onMouseEnter={e => { e.currentTarget.style.transform='translateY(-4px)'; e.currentTarget.style.boxShadow=`0 16px 48px rgba(100,160,60,0.3)`; }}
          onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow=`0 8px 32px rgba(100,160,60,0.22)`; }}>
          <div>
            <div style={{ ...ib(false), background:'rgba(255,255,255,0.45)', border:'1px solid rgba(255,255,255,0.3)', color:C.text }}><Mic size={18} /></div>
            <div style={{ ...lbl, color:C.textmid }}>Live Detection</div>
            <div style={{ fontSize:17, fontWeight:800, color:C.text, lineHeight:1.2 }}>Monitor Now</div>
          </div>
          <button onClick={() => navigate('/dashboard/live')} style={{ background:C.text, color:'#fff', border:'none', padding:'9px 20px', borderRadius:30, fontSize:13, fontWeight:700, cursor:'pointer', display:'inline-flex', alignItems:'center', gap:7, width:'fit-content', transition:'all 0.2s', boxShadow:'0 4px 14px rgba(26,32,16,0.22)' }}
            onMouseEnter={e => e.currentTarget.style.transform='translateY(-1px)'}
            onMouseLeave={e => e.currentTarget.style.transform=''}>
            Go Live →
          </button>
        </div>

        {/* F — Recent Sessions (spans 2 cols) */}
        <div style={{ ...white, gridColumn:'1/3', gridRow:'3', padding:'20px 24px', minHeight:150 }} onMouseEnter={lift} onMouseLeave={drop}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
            <span style={{ fontSize:14, fontWeight:800, color:C.text }}>Recent Sessions</span>
            <button onClick={() => navigate('/dashboard/history')} style={{ background:'none', border:'none', color:C.greendk, fontSize:12, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', gap:3 }}>
              View all <ChevronRight size={13} />
            </button>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
            {SESSIONS.slice(0,2).map(({ Icon, title, sub, risk }) => (
              <div key={title} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 10px', borderRadius:12, cursor:'pointer', transition:'background 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.background=C.cream2}
                onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <div style={{ width:32, height:32, borderRadius:'50%', background:C.cream2, border:'1px solid rgba(160,200,120,0.2)', display:'flex', alignItems:'center', justifyContent:'center', color:C.greendk }}><Icon size={13} /></div>
                  <div>
                    <div style={{ fontSize:12, fontWeight:700, color:C.text }}>{title}</div>
                    <div style={{ fontSize:10, color:C.textdim }}>{sub}</div>
                  </div>
                </div>
                <RiskBadge risk={risk} />
              </div>
            ))}
          </div>
        </div>

        {/* G — Insights CTA */}
        <div style={{ ...white, gridColumn:'3', gridRow:'3', justifyContent:'space-between', minHeight:150 }} onMouseEnter={lift} onMouseLeave={drop}>
          <div style={ib(true)}><BarChart2 size={18} /></div>
          <div>
            <div style={lbl}>Insights</div>
            <div style={{ fontSize:15, fontWeight:800, color:C.text, lineHeight:1.3 }}>View Financial<br />Breakdown</div>
          </div>
          <button onClick={() => navigate('/dashboard/insights')} style={{ ...tag(C.text,'#fff',C.text), padding:'8px 16px', borderRadius:30, cursor:'pointer', fontSize:12, fontWeight:700, border:'none', marginTop:8 }}>
            Explore →
          </button>
        </div>

        {/* H — Alerts CTA */}
        <div style={{ ...white, gridColumn:'4', gridRow:'3', justifyContent:'space-between', borderColor:'rgba(220,100,100,0.18)', minHeight:150 }}
          onMouseEnter={e => { e.currentTarget.style.transform='translateY(-4px)'; e.currentTarget.style.borderColor='#fecaca'; }}
          onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.borderColor='rgba(220,100,100,0.18)'; }}>
          <div style={{ ...ib(false), background:'#fef2f2', border:'1px solid #fecaca', color:'#dc2626' }}><AlertTriangle size={18} /></div>
          <div>
            <div style={{ ...lbl, color:'#dc2626' }}>Risk Alerts</div>
            <div style={{ fontSize:15, fontWeight:800, color:C.text, lineHeight:1.3 }}>Review All<br />Warnings</div>
          </div>
          <button onClick={() => navigate('/dashboard/alerts')} style={{ ...tag('#fef2f2','#dc2626','#fecaca'), padding:'8px 16px', borderRadius:30, cursor:'pointer', fontSize:12, fontWeight:700, border:'1px solid #fecaca', marginTop:8 }}>
            View →
          </button>
        </div>

      </div>
    </div>
  );
};

export default Main;
