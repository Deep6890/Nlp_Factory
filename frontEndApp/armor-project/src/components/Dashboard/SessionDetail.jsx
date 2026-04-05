import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, Globe, Activity, AlertTriangle, CheckCircle2, TrendingUp, FileText } from 'lucide-react';

const C = { cream2:'#FAF6E9', limelt:'#DDEB9D', green:'#A0C878', greendk:'#7aaa52', text:'#1a2010', textmid:'#4a5a30', textdim:'#8a9a70', shadow:'rgba(100,140,60,0.11)' };
const card = { background:'#fff', border:'1px solid rgba(160,200,120,0.22)', borderRadius:20, padding:'22px 24px', boxShadow:`0 2px 16px ${C.shadow}`, transition:'all 0.25s' };
const hov = { onMouseEnter: e => { e.currentTarget.style.borderColor=C.green; e.currentTarget.style.transform='translateY(-2px)'; }, onMouseLeave: e => { e.currentTarget.style.borderColor='rgba(160,200,120,0.22)'; e.currentTarget.style.transform=''; } };

const SESSIONS = [
  { name:'Home Loan Discussion', date:'Jan 31, 2026 · 2:30 PM', lang:'Hinglish', duration:'4m 23s', risk:'HIGH',
    summary:'Discussed home loan of ₹50 Lakh with SBI. Explored interest rates (8.5%–9.2%), tenure options, and EMI projections. Key concern: EMI of ₹48,000 exceeds 53% of salary.',
    keyPoints:['Loan Amount: ₹50,00,000','Interest Rate: 8.5%–9.2%','Proposed Tenure: 25 years','Monthly EMI: ₹48,000','Income-to-EMI Ratio: 53% (above 40% safe limit)'],
    decisions:[{text:'Researching loan options',status:'completed'},{text:'Considering SBI home loan',status:'completed'},{text:'Final commitment',status:'flagged'}],
    emotionData:{Stress:60,Confidence:35,Uncertainty:75} },
  { name:'SIP Planning Call', date:'Jan 30, 2026 · 11:15 AM', lang:'English', duration:'2m 10s', risk:'LOW',
    summary:'Planned a SIP of ₹5,000/month in a diversified equity mutual fund. Low risk profile with consistent monthly contributions.',
    keyPoints:['Monthly SIP: ₹5,000','Fund Type: Diversified Equity','Risk Profile: Low-Moderate','Expected Returns: 12–14% CAGR','Investment Horizon: 5+ years'],
    decisions:[{text:'SIP amount decided',status:'completed'},{text:'Fund selection finalized',status:'completed'}],
    emotionData:{Stress:15,Confidence:80,Uncertainty:10} },
  { name:'Car EMI Conversation', date:'Jan 29, 2026 · 6:45 PM', lang:'Gujarati', duration:'3m 58s', risk:'MED',
    summary:'Reconsidering a car loan of ₹8 Lakh after previously cancelling. Evaluating financial impact alongside existing home loan.',
    keyPoints:['Car Loan: ₹8,00,000','Interest Rate: 9.5%','Tenure: 5 years','Monthly EMI: ₹16,800','Decision reversed twice'],
    decisions:[{text:'Initially planned car purchase',status:'completed'},{text:'Cancelled car loan plan',status:'completed'},{text:'Reconsidering purchase',status:'pending'}],
    emotionData:{Stress:45,Confidence:50,Uncertainty:55} },
  { name:'Investment Strategy', date:'Jan 27, 2026 · 9:00 AM', lang:'English', duration:'6m 12s', risk:'LOW',
    summary:'Explored ₹2 Lakh lumpsum investment in mutual funds. Discussed market timing, fund types, and risk assessment.',
    keyPoints:['Lumpsum: ₹2,00,000','Fund Type: Large Cap','Risk Level: Moderate','Tax Saving: Section 80C','Market Timing Advisory Provided'],
    decisions:[{text:'Lumpsum investment planned',status:'pending'}],
    emotionData:{Stress:20,Confidence:70,Uncertainty:30} },
  { name:'Budget Review', date:'Jan 25, 2026 · 3:20 PM', lang:'Hinglish', duration:'5m 44s', risk:'MED',
    summary:'Comprehensive budget review covering monthly expenses, savings rate, and discretionary spending.',
    keyPoints:['Monthly Income: ₹90,000','Fixed Expenses: ₹35,000','Discretionary: ₹25,000','Savings Rate: 33%','Optimization potential in dining'],
    decisions:[{text:'Budget tracking initiated',status:'completed'},{text:'Spending optimization recommended',status:'pending'}],
    emotionData:{Stress:35,Confidence:60,Uncertainty:40} },
];

const RISK_STYLE = {
  HIGH:{ bg:C.text,    color:'#fff',      border:C.text  },
  LOW: { bg:C.limelt,  color:C.greendk,   border:C.green },
  MED: { bg:'#fefce8', color:'#92400e',   border:'#fde68a' },
};

const EMOTION_COLORS = {
  Stress:      { bar:'#dc2626', light:'rgba(220,38,38,0.12)',  label:'#dc2626' },
  Confidence:  { bar:C.greendk, light:'rgba(122,170,82,0.15)', label:C.greendk },
  Uncertainty: { bar:'#e0a020', light:'rgba(224,160,32,0.12)', label:'#e0a020' },
};

const EmotionBarChart = ({ data }) => {
  const [animated, setAnimated] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 120);
    return () => clearTimeout(t);
  }, []);

  const CHART_H = 150;
  const entries = Object.entries(data);

  return (
    <div ref={ref}>
      {/* Y-axis grid lines */}
      <div style={{ position:'relative', height: CHART_H, display:'flex', alignItems:'flex-end', gap:3, padding:'0 4px' }}>

        {/* Grid lines at 25 / 50 / 75 / 100% */}
        {[25,50,75,100].map(pct => (
          <div key={pct} style={{
            position:'absolute',
            left:0, right:0,
            bottom: `${pct}%`,
            height:1,
            background:'rgba(160,200,120,0.12)',
            pointerEvents:'none',
            zIndex:0,
          }}>
            <span style={{ position:'absolute', right:'calc(100% + 4px)', top:-7, fontSize:9, fontWeight:600, color:C.textdim, whiteSpace:'nowrap' }}>{pct}</span>
          </div>
        ))}

        {/* Bars */}
        {entries.map(([key, val], i) => {
          const colors = EMOTION_COLORS[key] || { bar:C.green, light:'rgba(160,200,120,0.15)', label:C.greendk };
          const barH = animated ? (val / 100) * CHART_H : 0;

          return (
            <div key={key} style={{ flex:1, height:'100%', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'flex-end', position:'relative', zIndex:1 }}>

              {/* Value label — floats above bar */}
              <span style={{
                position:'absolute',
                bottom: barH + 6,
                fontSize:11, fontWeight:800, color:colors.label,
                opacity: animated ? 1 : 0,
                transition:`bottom 0.8s cubic-bezier(0.22,1,0.36,1) ${i*0.12}s, opacity 0.4s ease ${i*0.12+0.4}s`,
                whiteSpace:'nowrap',
              }}>{val}%</span>

              {/* Bar fill — thin, grows from bottom */}
              <div style={{
                width: 28,
                height: barH,
                background:`linear-gradient(180deg, ${colors.bar}bb 0%, ${colors.bar} 100%)`,
                borderRadius:'5px 5px 3px 3px',
                transition:`height 0.85s cubic-bezier(0.22,1,0.36,1) ${i*0.12}s`,
                position:'relative',
                overflow:'hidden',
                boxShadow:`0 -3px 14px ${colors.bar}44`,
              }}>
                {/* Inner shimmer */}
                <div style={{
                  position:'absolute', top:0, left:0, right:0, height:'40%',
                  background:'linear-gradient(180deg,rgba(255,255,255,0.30) 0%,transparent 100%)',
                  borderRadius:'inherit',
                  pointerEvents:'none',
                }}/>
              </div>

              {/* Track background — thin, behind bar */}
              <div style={{
                position:'absolute', bottom:0,
                width: 28,
                height:'100%',
                background:colors.light,
                borderRadius:'5px 5px 3px 3px',
                zIndex:-1,
              }}/>

            </div>
          );
        })}
      </div>

      {/* Baseline */}
      <div style={{ height:2, background:'rgba(160,200,120,0.25)', borderRadius:2, margin:'0 4px' }} />

      {/* X-axis labels */}
      <div style={{ display:'flex', gap:3, padding:'8px 4px 0', marginBottom:10 }}>
        {entries.map(([key]) => {
          const colors = EMOTION_COLORS[key] || { label:C.greendk };
          return (
            <div key={key} style={{ flex:1, textAlign:'center' }}>
              <span style={{ fontSize:11, fontWeight:700, color:colors.label }}>{key}</span>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div style={{ display:'flex', gap:16, flexWrap:'wrap' }}>
        {entries.map(([key, val]) => {
          const colors = EMOTION_COLORS[key] || { bar:C.green, label:C.greendk };
          return (
            <div key={key} style={{ display:'flex', alignItems:'center', gap:5 }}>
              <div style={{ width:8, height:8, borderRadius:'50%', background:colors.bar, boxShadow:`0 0 5px ${colors.bar}88` }} />
              <span style={{ fontSize:11, fontWeight:600, color:C.textmid }}>{key}: <strong style={{ color:colors.label }}>{val}%</strong></span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const SessionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const session = SESSIONS[parseInt(id, 10)] || SESSIONS[0];
  const rs = RISK_STYLE[session.risk];

  const ib = (accent) => ({ width:34, height:34, borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', background:accent?C.limelt:C.cream2, border:`1px solid ${accent?C.green:'rgba(160,200,120,0.2)'}`, color:C.text, flexShrink:0 });

  return (
    <div style={{ fontFamily:'Inter,sans-serif', display:'flex', flexDirection:'column', gap:18, color:C.text }}>

      <button onClick={() => navigate('/dashboard/history')} style={{ display:'flex', alignItems:'center', gap:7, fontSize:13, fontWeight:700, color:C.textdim, background:'none', border:'none', cursor:'pointer', width:'fit-content' }}
        onMouseEnter={e => e.currentTarget.style.color=C.text} onMouseLeave={e => e.currentTarget.style.color=C.textdim}>
        <ArrowLeft size={15} /> Back to Sessions
      </button>

      {/* BENTO — 4 cols */}
      <div style={{ display:'grid', gridTemplateColumns:'1.8fr 2.2fr 2.2fr 1.8fr', gap:14 }}>

        {/* Header — full width */}
        <div style={{ ...card, gridColumn:'1/-1', display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:16 }} {...hov}>
          <div style={{ flex:1, minWidth:220 }}>
            <h1 style={{ fontSize:'clamp(18px,2.5vw,26px)', fontWeight:900, color:C.text, letterSpacing:-1, marginBottom:10 }}>{session.name}</h1>
            <div style={{ display:'flex', gap:18, flexWrap:'wrap' }}>
              {[{Icon:Clock,v:session.date},{Icon:Globe,v:session.lang},{Icon:Activity,v:session.duration}].map(({Icon,v})=>(
                <span key={v} style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, fontWeight:600, color:C.textdim }}><Icon size={13}/>{v}</span>
              ))}
            </div>
          </div>
          <span style={{ fontSize:11, fontWeight:800, letterSpacing:'0.5px', textTransform:'uppercase', padding:'8px 18px', borderRadius:12, background:rs.bg, color:rs.color, border:`1px solid ${rs.border}` }}>
            {session.risk} RISK
          </span>
        </div>

        {/* Summary — 2 cols */}
        <div style={{ ...card, gridColumn:'1/3' }} {...hov}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
            <div style={ib(false)}><FileText size={15}/></div>
            <span style={{ fontSize:13, fontWeight:800 }}>Session Summary</span>
          </div>
          <p style={{ fontSize:13, color:C.textmid, lineHeight:1.7 }}>{session.summary}</p>
        </div>

        {/* Key Points — 2 cols */}
        <div style={{ ...card, gridColumn:'3/-1' }} {...hov}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
            <div style={ib(true)}><TrendingUp size={15}/></div>
            <span style={{ fontSize:13, fontWeight:800 }}>Key Points</span>
          </div>
          <ul style={{ display:'flex', flexDirection:'column', gap:8, listStyle:'none' }}>
            {session.keyPoints.map((p,i)=>(
              <li key={i} style={{ display:'flex', alignItems:'flex-start', gap:9 }}>
                <span style={{ width:6, height:6, borderRadius:'50%', background:C.green, flexShrink:0, marginTop:5 }}/>
                <span style={{ fontSize:12, fontWeight:600, color:C.textmid }}>{p}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Emotion Analysis — 2 cols */}
        <div style={{ ...card, gridColumn:'1/3' }} {...hov}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:18 }}>
            <div style={ib(false)}><Activity size={15}/></div>
            <span style={{ fontSize:13, fontWeight:800 }}>Emotion Analysis</span>
          </div>
          <EmotionBarChart data={session.emotionData} />
        </div>

        {/* Decision Timeline — 2 cols */}
        <div style={{ ...card, gridColumn:'3/-1' }} {...hov}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:18 }}>
            <div style={ib(false)}><CheckCircle2 size={15}/></div>
            <span style={{ fontSize:13, fontWeight:800 }}>Decision Timeline</span>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {session.decisions.map((d,i)=>(
              <div key={i} style={{ display:'flex', alignItems:'center', gap:10 }}>
                <div style={{ width:28, height:28, borderRadius:'50%', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center',
                  background:d.status==='completed'?C.limelt:d.status==='flagged'?C.text:C.cream2,
                  color:d.status==='completed'?C.text:d.status==='flagged'?'#fff':C.textdim }}>
                  {d.status==='completed'?<CheckCircle2 size={13}/>:d.status==='flagged'?<AlertTriangle size={13}/>:<Clock size={13}/>}
                </div>
                <span style={{ fontSize:12, fontWeight:600, color:d.status==='flagged'?'#dc2626':C.textmid }}>{d.text}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default SessionDetail;
