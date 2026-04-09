import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, Shield, Sparkles, FileText, Leaf } from 'lucide-react';
import { getDashboardStats } from '../api/users';

const Counter = ({ target }) => {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!target) return;
    let n = 0;
    const step = Math.ceil(target / 40);
    const id = setInterval(() => {
      n += step;
      if (n >= target) { setVal(target); clearInterval(id); }
      else setVal(n);
    }, 30);
    return () => clearInterval(id);
  }, [target]);
  return <>{val.toLocaleString()}</>;
};

export default function DashboardHome() {
  const navigate = useNavigate();
  const [micPulse, setMicPulse]       = useState(false);
  const [micActive, setMicActive]     = useState(false);  // click animation state
  const [bars, setBars]               = useState(Array(18).fill(4));
  const [stats, setStats]             = useState(null);

  useEffect(() => {
    getDashboardStats().then(d => setStats(d.stats ?? d)).catch(() => {});
  }, []);

  // Animate waveform bars while micActive
  useEffect(() => {
    if (!micActive) { setBars(Array(18).fill(4)); return; }
    const id = setInterval(() => {
      setBars(Array(18).fill(0).map(() => Math.floor(Math.random() * 44) + 8));
    }, 80);
    return () => clearInterval(id);
  }, [micActive]);

  const handleMicClick = (e) => {
    e.stopPropagation();
    setMicActive(true);
    // Navigate after short animation
    setTimeout(() => navigate('/dashboard/live'), 900);
  };

  const totalRecordings = stats?.totalRecordings ?? 0;
  const highRiskCount   = stats?.highRiskCount   ?? 0;
  const financeCount    = stats?.financeCount     ?? 0;

  return (
    <div className="max-w-7xl mx-auto">
      <style>{`
        @keyframes orbRingSpin{0%{transform:translate(-50%,-50%) rotate(0deg)}100%{transform:translate(-50%,-50%) rotate(360deg)}}
        @keyframes orbGlowPulse{0%,100%{opacity:.7;transform:scale(1)}50%{opacity:1;transform:scale(1.03)}}
        @keyframes orbDotFloat{0%,100%{opacity:.4;transform:translateY(0)}50%{opacity:1;transform:translateY(-6px)}}
        @keyframes orbPulseRing{0%{transform:scale(1);opacity:1}100%{transform:scale(1.6);opacity:0}}
        @keyframes micActivePulse{0%{transform:translate(-50%,-50%) scale(1);box-shadow:0 0 60px rgba(160,200,120,0.14)}50%{transform:translate(-50%,-50%) scale(1.08);box-shadow:0 0 100px rgba(160,200,120,0.5),inset 0 0 60px rgba(160,200,120,0.2)}100%{transform:translate(-50%,-50%) scale(1);box-shadow:0 0 60px rgba(160,200,120,0.14)}}
        @keyframes micActiveRing{0%{transform:scale(1);opacity:0.8}100%{transform:scale(2.2);opacity:0}}
        @keyframes micActiveGlow{0%,100%{opacity:0.4}50%{opacity:1}}
      `}</style>

      <div className="grid gap-3" style={{ gridTemplateColumns:'1.5fr 1.8fr 1.8fr 1.5fr', gridTemplateRows:'1fr 1fr auto' }}>

        {/* A — Tagline */}
        <div className="rounded-[22px] p-5 flex flex-col justify-between transition-all duration-300 cursor-default"
          style={{ gridColumn:1, gridRow:'1/3', background:'var(--bg-card)', border:'1px solid var(--border)', boxShadow:'var(--shadow-md)', minHeight:300 }}>
          <div className="w-9 h-9 rounded-[10px] flex items-center justify-center mb-1"
            style={{ background:'var(--green-bg)', border:'1px solid var(--green-border)', color:'var(--green)' }}>
            <Shield size={18} />
          </div>
          <h2 className="font-black leading-tight my-4" style={{ fontSize:'clamp(26px,2.6vw,34px)', letterSpacing:'-1.2px', color:'var(--text-primary)' }}>
            Smart<br />Finance,<br />Instantly
          </h2>
          <div className="flex flex-col gap-2 my-3">
            <p className="text-sm leading-relaxed font-medium m-0" style={{ color:'var(--text-muted)' }}>
              Continuous AI monitoring intercepts hidden fees, EMI risks, and bad investments before they happen.
            </p>
            <div className="flex items-center gap-1.5 mt-2">
              <span className="w-2 h-2 rounded-full" style={{ background:'var(--green)', boxShadow:'0 0 8px rgba(90,158,47,0.5)' }} />
              <span className="text-[11px] font-black uppercase tracking-wide" style={{ color:'var(--green)' }}>System Active</span>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-1.5 rounded-full w-fit"
              style={{ background:'var(--green-bg)', color:'var(--green)', border:'1px solid var(--green-border)' }}>
              🌿 AI-Powered
            </span>
            <span className="text-xs font-medium pl-1" style={{ color:'var(--text-muted)' }}>Real-time protection</span>
          </div>
        </div>

        {/* B — Hero orb */}
        <div className="rounded-[22px] flex flex-col items-center text-center cursor-pointer transition-all duration-300 relative overflow-hidden"
          style={{ gridColumn:'2/4', gridRow:'1/3', background:'#0f1a0a', border:'1px solid rgba(160,200,120,0.18)', boxShadow:'0 8px 48px rgba(0,0,0,0.4)', minHeight:420, padding:'28px 28px 24px' }}
          onClick={() => navigate('/dashboard/live')}>
          <div className="absolute pointer-events-none" style={{ top:-80, right:-60, width:280, height:280, borderRadius:'50%', background:'radial-gradient(circle,rgba(160,200,120,0.15),transparent 70%)' }} />
          <div className="absolute pointer-events-none" style={{ bottom:-60, left:-40, width:200, height:200, borderRadius:'50%', background:'radial-gradient(circle,rgba(221,235,157,0.08),transparent 70%)' }} />
          <div className="absolute inset-0 pointer-events-none opacity-60" style={{ backgroundImage:'radial-gradient(circle,rgba(160,200,120,0.05) 1px,transparent 1px)', backgroundSize:'24px 24px' }} />

          <div className="relative z-10 mb-2">
            <span className="text-sm font-bold" style={{ color:'rgba(160,200,120,0.45)' }}>🌿 Armor.ai</span>
          </div>
          <h2 className="relative z-10 font-black leading-tight mb-5" style={{ fontSize:'clamp(22px,2.8vw,32px)', letterSpacing:'-1px', color:'#e8f0d8' }}>
            AI-Powered<br />Finance Guard.
          </h2>

          {/* Orb */}
          <div className="relative z-30 flex flex-col items-center gap-4 flex-1 justify-center">
            <div className="relative cursor-pointer" style={{ width:240, height:240 }}
              onMouseEnter={() => setMicPulse(true)} onMouseLeave={() => setMicPulse(false)}
              onClick={handleMicClick}>

              {/* Spinning dashed ring */}
              <div className="absolute rounded-full pointer-events-none" style={{ inset:-6, border:'1.5px dashed rgba(160,200,120,0.2)', animation:'orbRingSpin 20s linear infinite reverse' }} />

              {/* Binary text ring */}
              <svg className="absolute pointer-events-none" style={{ width:260, height:260, top:'50%', left:'50%', transform:'translate(-50%,-50%)', animation:'orbRingSpin 30s linear infinite' }} viewBox="0 0 300 300">
                <defs><path id="dp" d="M 150,150 m -120,0 a 120,120 0 1,1 240,0 a 120,120 0 1,1 -240,0" fill="none" /></defs>
                <text style={{ fill:'rgba(160,200,120,0.22)', fontSize:10, fontFamily:'monospace', fontWeight:700, letterSpacing:3 }}>
                  <textPath href="#dp" startOffset="0%">0100 1001 1010 1000 0010 1010 0010 1111 1010 0100 1001 1010 1000 0010 1010 0010 1111 1010 0100</textPath>
                </text>
              </svg>

              {/* Inner ring */}
              <div className="absolute rounded-full pointer-events-none" style={{ inset:24, border:'1px solid rgba(160,200,120,0.14)', boxShadow:'0 0 30px rgba(160,200,120,0.07),inset 0 0 30px rgba(160,200,120,0.04)' }} />

              {/* Core orb button */}
              <div className="absolute flex items-center justify-center rounded-full z-10"
                style={{
                  width:140, height:140, top:'50%', left:'50%',
                  transform:'translate(-50%,-50%)',
                  background: micActive
                    ? 'linear-gradient(145deg,#3a5a1c 0%,#2a3d10 40%,#1a2a0a 100%)'
                    : 'linear-gradient(145deg,#2a3d1c 0%,#1a2810 40%,#0f1a0a 100%)',
                  border: micActive ? '2px solid rgba(160,200,120,0.6)' : '2px solid rgba(160,200,120,0.22)',
                  boxShadow: micActive
                    ? '0 0 100px rgba(160,200,120,0.5),inset 0 0 60px rgba(160,200,120,0.2),0 8px 32px rgba(0,0,0,0.5)'
                    : '0 0 60px rgba(160,200,120,0.14),inset 0 0 40px rgba(160,200,120,0.07),0 8px 32px rgba(0,0,0,0.5)',
                  animation: micActive ? 'micActivePulse 0.6s ease-in-out infinite' : 'none',
                  transition: 'border 0.3s, box-shadow 0.3s',
                }}>
                <div className="absolute inset-0 rounded-full pointer-events-none" style={{ background:'radial-gradient(circle at 40% 35%,rgba(160,200,120,0.28) 0%,rgba(160,200,120,0.08) 30%,transparent 65%)', animation:'orbGlowPulse 3s ease-in-out infinite' }} />

                {/* Waveform bars — visible when micActive */}
                {micActive ? (
                  <div style={{ display:'flex', alignItems:'center', gap:3, height:44, position:'relative', zIndex:3 }}>
                    {bars.map((h, i) => (
                      <div key={i} style={{
                        width: 3, height: h,
                        borderRadius: 3,
                        background: i % 3 === 0 ? '#DDEB9D' : '#A0C878',
                        boxShadow: '0 0 6px rgba(160,200,120,0.6)',
                        transition: 'height 0.08s ease',
                      }} />
                    ))}
                  </div>
                ) : (
                  <Mic size={36} style={{ position:'relative', zIndex:3, color:'#A0C878', filter:'drop-shadow(0 0 12px rgba(160,200,120,0.4))' }} />
                )}
              </div>

              {/* Expanding rings on click */}
              {micActive && <>
                <div className="absolute rounded-full pointer-events-none" style={{ inset:'calc(50% - 70px)', border:'2px solid rgba(160,200,120,0.5)', animation:'micActiveRing 0.8s ease-out infinite' }} />
                <div className="absolute rounded-full pointer-events-none" style={{ inset:'calc(50% - 70px)', border:'1.5px solid rgba(160,200,120,0.3)', animation:'micActiveRing 0.8s ease-out 0.25s infinite' }} />
                <div className="absolute rounded-full pointer-events-none" style={{ inset:'calc(50% - 70px)', border:'1px solid rgba(160,200,120,0.15)', animation:'micActiveRing 0.8s ease-out 0.5s infinite' }} />
              </>}

              {/* Hover pulse rings */}
              {(micPulse && !micActive) && <>
                <div className="absolute rounded-full pointer-events-none" style={{ inset:'calc(50% - 82px)', border:'2px solid rgba(160,200,120,0.3)', animation:'orbPulseRing 1.8s ease-out infinite' }} />
                <div className="absolute rounded-full pointer-events-none" style={{ inset:'calc(50% - 94px)', border:'1.5px solid rgba(160,200,120,0.15)', animation:'orbPulseRing 1.8s ease-out 0.4s infinite' }} />
              </>}

              {/* Floating dots */}
              {[{t:'8%',r:'15%',s:6},{b:'12%',l:'10%',s:4,d:'1s'},{t:'50%',r:'2%',s:5,d:'2s',c:'#DDEB9D'},{b:'5%',r:'30%',s:3,d:'0.5s'}].map((dot,i) => (
                <div key={i} className="absolute rounded-full pointer-events-none" style={{ width:dot.s, height:dot.s, top:dot.t, right:dot.r, bottom:dot.b, left:dot.l, background:dot.c||'#A0C878', boxShadow:'0 0 8px rgba(160,200,120,0.5)', animation:`orbDotFloat 4s ease-in-out ${dot.d||'0s'} infinite` }} />
              ))}
            </div>

            <p className="text-xs font-semibold" style={{ color: micActive ? 'rgba(160,200,120,0.7)' : 'rgba(160,200,120,0.38)', letterSpacing:'0.3px', transition:'color 0.3s' }}>
              {micActive ? 'Starting session…' : 'Tap to start live session'}
            </p>
          </div>
        </div>

        {/* C — Toggle */}
        <div className="rounded-[22px] p-5 flex flex-col items-center justify-center gap-3.5 cursor-pointer transition-all duration-300 hover:-translate-y-1"
          style={{ gridColumn:4, gridRow:1, background:'var(--bg-card)', border:'1px solid var(--border)', boxShadow:'var(--shadow-md)', minHeight:120 }}
          onClick={() => navigate('/dashboard/settings')}>
          <div className="w-[60px] h-8 rounded-full flex items-center p-[3px] justify-end" style={{ background:'var(--green)', boxShadow:'inset 0 2px 4px rgba(0,0,0,0.2)' }}>
            <div className="w-[26px] h-[26px] rounded-full flex items-center justify-center" style={{ background:'var(--bg-card)', color:'var(--green)' }}>
              <Sparkles size={14} />
            </div>
          </div>
          <span className="text-[11px] font-black uppercase tracking-wide" style={{ color:'var(--text-muted)' }}>AI Shield Active</span>
          <p className="text-xs font-medium text-center leading-snug m-0 px-2" style={{ color:'var(--text-muted)' }}>
            All data streams secured and encrypted.
          </p>
        </div>

        {/* D — Stats */}
        <div className="rounded-[22px] p-5 flex flex-col cursor-pointer transition-all duration-300 hover:-translate-y-1"
          style={{ gridColumn:4, gridRow:2, background:'var(--bg-card)', border:'1px solid var(--border)', boxShadow:'var(--shadow-md)', minHeight:140 }}
          onClick={() => navigate('/dashboard/insights')}>
          <div className="font-black leading-none" style={{ fontSize:'clamp(36px,4vw,48px)', letterSpacing:'-2px', color:'var(--text-primary)' }}>
            <Counter target={totalRecordings} />
          </div>
          <div className="inline-flex items-center gap-1 text-xs font-bold px-3.5 py-1.5 rounded-full w-fit mt-2"
            style={{ color:'var(--green)', background:'var(--green-bg)', border:'1px solid var(--green-border)' }}>
            sessions analyzed
          </div>
          {(financeCount > 0 || highRiskCount > 0) && (
            <div className="flex gap-2 mt-2.5 flex-wrap">
              {financeCount > 0 && <span className="text-[10px] font-black px-2 py-0.5 rounded-[7px]" style={{ background:'var(--green-bg)', color:'var(--green)', border:'1px solid var(--green-border)' }}>💰 {financeCount} finance</span>}
              {highRiskCount > 0 && <span className="text-[10px] font-black px-2 py-0.5 rounded-[7px]" style={{ background:'rgba(220,38,38,0.08)', color:'var(--accent-red)', border:'1px solid rgba(220,38,38,0.2)' }}>⚠ {highRiskCount} high risk</span>}
            </div>
          )}
          <div className="flex-1 flex items-end w-full mt-7 min-h-[45px]">
            <div className="w-full h-full relative" style={{ borderBottom:'1.5px solid var(--border)' }}>
              {[[4,'4%','40%'],[23,'23%','60%'],[42,'42%','35%'],[61,'61%','80%',true],[80,'80%','95%',true,true]].map(([_,l,h,solid,glow],i) => (
                <div key={i} className="absolute bottom-0 rounded-t-[4px]" style={{ left:l, width:'14%', height:h, background: solid ? 'var(--green)' : 'var(--green-bg)', opacity: solid && !glow ? 0.7 : 1, boxShadow: glow ? '0 -2px 12px rgba(90,158,47,0.3)' : 'none' }} />
              ))}
            </div>
          </div>
        </div>

        {/* H — Reports */}
        <div className="rounded-[22px] flex flex-row items-center flex-wrap gap-2.5 cursor-pointer transition-all duration-300 hover:-translate-y-1"
          style={{ gridColumn:'2/4', gridRow:3, background:'var(--bg-card)', border:'1px solid var(--border)', boxShadow:'var(--shadow-md)', padding:'14px 24px', marginTop:6 }}
          onClick={() => navigate('/dashboard/reports')}>
          <h3 className="text-[15px] font-black m-0 mr-1" style={{ color:'var(--text-primary)' }}>Report templates</h3>
          <p className="text-xs m-0" style={{ color:'var(--text-muted)' }}>Generate PDF, DOCX &amp; more.</p>
          <div className="flex gap-1.5 flex-wrap mt-1.5">
            {['PDF','DOCX','CSV'].map(f => (
              <span key={f} className="text-[10px] font-black px-3 py-1 rounded-[8px] tracking-wide" style={{ color:'var(--green)', background:'var(--green-bg)', border:'1px solid var(--green-border)' }}>{f}</span>
            ))}
          </div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-1.5 rounded-[10px] mt-1" style={{ background:'var(--bg-subtle)', border:'1px solid var(--border)', color:'var(--text-secondary)' }}>
            <FileText size={13} /> Rewrite <Sparkles size={11} />
          </div>
          <div className="inline-flex items-center text-[11px] font-bold px-3.5 py-1.5 rounded-full mt-auto" style={{ color:'var(--text-inverse)', background:'var(--green)', border:'1px solid var(--green-dk,#3D7A1A)' }}>
            Free trial
          </div>
        </div>

      </div>
    </div>
  );
}


