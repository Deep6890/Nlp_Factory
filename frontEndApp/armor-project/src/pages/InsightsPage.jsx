import React, { useState, useEffect } from 'react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  RadialBarChart, RadialBar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import {
  Activity, AlertTriangle, Zap, Brain, DollarSign, TrendingUp,
  CheckCircle, RefreshCw, Loader2, Info, Shield, Target, Layers,
} from 'lucide-react';
import { getInsightsSummary } from '../api/recordings';

/* ─── palette ────────────────────────────────────────────────────── */
const PALETTE = ['#5A9E2F','#0891B2','#D97706','#7C3AED','#DC2626','#059669','#EA580C','#6366F1'];
const HEX = { green:'#5A9E2F', amber:'#D97706', red:'#DC2626', blue:'#0891B2', purple:'#7C3AED' };

const pct = (a, b) => (b > 0 ? Math.round((a / b) * 100) : 0);

/* ─── shared card style ──────────────────────────────────────────── */
const cs = {
  background: 'var(--bg-card)', borderRadius: 18,
  border: '1px solid var(--border)', padding: '22px 24px',
  boxShadow: 'var(--shadow-sm)',
  transition: 'background-color 0.25s ease, border-color 0.25s ease',
};
const tickStyle  = { fontSize: 11, fill: 'var(--chart-tick)' };
const gridStyle  = { strokeDasharray: '3 3', stroke: 'var(--chart-grid)' };

/* ─── MetricCard — matches AnalyticsDashboard style ─────────────── */
const MetricCard = ({ icon: Icon, label, value, sub, color = 'var(--green)', accent }) => (
  <div style={{ ...cs, display:'flex', flexDirection:'column', gap:6, position:'relative', overflow:'hidden', transition:'all 0.2s', cursor:'default' }}
    onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='var(--shadow-md)'; e.currentTarget.style.borderColor='var(--border-hover)'; }}
    onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow='var(--shadow-sm)'; e.currentTarget.style.borderColor='var(--border)'; }}>
    {accent && <div style={{ position:'absolute', top:0, right:0, width:80, height:80, background:`radial-gradient(circle, ${color}22 0%, transparent 70%)`, pointerEvents:'none' }} />}
    <div style={{ width:36, height:36, borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', background:`${color}18`, border:`1px solid ${color}30`, color, marginBottom:4 }}>
      <Icon size={16} />
    </div>
    <div style={{ fontSize:28, fontWeight:900, color, letterSpacing:-1, fontVariantNumeric:'tabular-nums' }}>{value}</div>
    <div style={{ fontSize:13, fontWeight:700, color:'var(--text-secondary)' }}>{label}</div>
    {sub && <div style={{ fontSize:11, color:'var(--text-muted)', fontWeight:500 }}>{sub}</div>}
  </div>
);

/* ─── SectionTitle — icon + title + tooltip ──────────────────────── */
const SectionTitle = ({ icon: Icon, title, sub, color = 'var(--green)', tip }) => (
  <div style={{ display:'flex', alignItems:'flex-start', gap:10, marginBottom:18 }}>
    <div style={{ width:32, height:32, borderRadius:9, background:`${color}18`, border:`1px solid ${color}30`, display:'flex', alignItems:'center', justifyContent:'center', color, flexShrink:0, marginTop:1 }}>
      <Icon size={15} />
    </div>
    <div>
      <div style={{ fontSize:14, fontWeight:800, color:'var(--text-primary)', display:'flex', alignItems:'center', gap:6 }}>
        {title}
        {tip && <span title={tip} style={{ cursor:'help', opacity:0.45 }}><Info size={12} /></span>}
      </div>
      {sub && <div style={{ fontSize:11, color:'var(--text-muted)', fontWeight:500, marginTop:2 }}>{sub}</div>}
    </div>
  </div>
);

/* ─── ChartTip ───────────────────────────────────────────────────── */
const ChartTip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:'var(--chart-tooltip-bg)', border:'1px solid var(--chart-tooltip-border)', borderRadius:12, padding:'10px 14px', fontSize:12, fontWeight:600, color:'var(--text-primary)', boxShadow:'var(--shadow-lg)' }}>
      {label && <div style={{ color:'var(--text-muted)', marginBottom:5, fontSize:11 }}>{label}</div>}
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color || 'var(--text-primary)', display:'flex', alignItems:'center', gap:6, marginBottom:2 }}>
          <span style={{ width:8, height:8, borderRadius:'50%', background:p.color, display:'inline-block', flexShrink:0 }} />
          {p.name}: <strong>{typeof p.value === 'number' ? p.value.toLocaleString() : p.value}</strong>
        </div>
      ))}
    </div>
  );
};

/* ─── RiskGauge ──────────────────────────────────────────────────── */
const RiskGauge = ({ highCount, total }) => {
  const score = total > 0 ? Math.round((highCount / total) * 100) : 0;
  const color  = score > 40 ? 'var(--accent-red)' : score > 20 ? 'var(--accent-amber)' : 'var(--green)';
  const hexC   = score > 40 ? HEX.red : score > 20 ? HEX.amber : HEX.green;
  const data   = [{ name:'Risk', value: score, fill: hexC }];
  return (
    <div style={{ position:'relative', display:'flex', flexDirection:'column', alignItems:'center' }}>
      <ResponsiveContainer width="100%" height={170}>
        <RadialBarChart cx="50%" cy="80%" innerRadius="60%" outerRadius="90%" startAngle={180} endAngle={0} data={data}>
          <RadialBar dataKey="value" cornerRadius={8} background={{ fill:'var(--bg-subtle)' }} />
        </RadialBarChart>
      </ResponsiveContainer>
      <div style={{ position:'absolute', bottom:8, textAlign:'center' }}>
        <div style={{ fontSize:32, fontWeight:900, color, letterSpacing:-2, fontVariantNumeric:'tabular-nums' }}>{score}%</div>
        <div style={{ fontSize:10, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.5px' }}>High-Risk Rate</div>
      </div>
    </div>
  );
};

/* ─── ProgressRow ────────────────────────────────────────────────── */
const ProgressRow = ({ label, val, max, color = HEX.green, showCount = true }) => (
  <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:10 }}>
    <span style={{ fontSize:12, color:'var(--text-primary)', minWidth:110, fontWeight:600, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{label}</span>
    <div style={{ flex:1, height:7, background:'var(--bg-subtle)', borderRadius:10, overflow:'hidden' }}>
      <div style={{ height:'100%', width:`${Math.round((val/max)*100)}%`, background:color, borderRadius:10, transition:'width 0.9s ease' }} />
    </div>
    {showCount && <span style={{ fontSize:11, color:'var(--text-muted)', minWidth:24, textAlign:'right', fontWeight:700 }}>{val}</span>}
  </div>
);

/* ─── main ───────────────────────────────────────────────────────── */
const Insights = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const load = async () => {
    setLoading(true); setError(null);
    try {
      const d = await getInsightsSummary();
      setSummary(d.summary ?? d);
    } catch (e) {
      setError(e.message || 'Failed to load insights');
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  /* ── loading ── */
  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:80, gap:12, color:'var(--text-muted)', flexDirection:'column' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <Loader2 size={24} style={{ animation:'spin 1s linear infinite', color:'var(--green)' }} />
      <span style={{ fontSize:13, fontWeight:600 }}>Analysing sessions…</span>
    </div>
  );

  /* ── error ── */
  if (error) return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:80, gap:14 }}>
      <AlertTriangle size={36} color="var(--accent-red)" />
      <div style={{ fontSize:15, fontWeight:700, color:'var(--text-primary)' }}>Could not load insights</div>
      <p style={{ fontSize:13, color:'var(--text-muted)', textAlign:'center' }}>{error}</p>
      <button onClick={load} style={{ display:'flex', alignItems:'center', gap:6, fontSize:13, fontWeight:700, color:'var(--text-inverse)', background:'var(--green)', border:'none', borderRadius:10, padding:'9px 20px', cursor:'pointer' }}>
        <RefreshCw size={13} /> Retry
      </button>
    </div>
  );

  /* ── empty ── */
  if (!summary || summary.totalTranscripts === 0) return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:80, gap:14, color:'var(--text-muted)' }}>
      <Brain size={40} color="var(--green)" />
      <div style={{ fontSize:18, fontWeight:700, color:'var(--text-primary)' }}>No sessions yet</div>
      <p style={{ fontSize:13, textAlign:'center', maxWidth:340 }}>Upload and process audio recordings to see AI-generated financial insights here.</p>
    </div>
  );

  const s = summary;

  /* ── derived ── */
  const coveragePct = pct(s.totalWithInsights, s.totalTranscripts);
  const financePct  = pct(s.financeCount, s.totalTranscripts);
  const totalRisk   = (s.riskCounts?.low||0) + (s.riskCounts?.medium||0) + (s.riskCounts?.high||0);

  /* sentiment timeline for area chart */
  const trendData = (s.sentimentTimeline || []).map(d => ({
    date: d.date,
    Positive: d.positive || 0,
    Neutral:  d.neutral  || 0,
    Negative: d.negative || 0,
  }));

  /* risk pie */
  const riskPie = [
    { name:'Low',    value: s.riskCounts?.low    || 0, color: HEX.green },
    { name:'Medium', value: s.riskCounts?.medium || 0, color: HEX.amber },
    { name:'High',   value: s.riskCounts?.high   || 0, color: HEX.red },
  ].filter(d => d.value > 0);

  /* domain horizontal bar */
  const domainData = (s.domainData || []).slice(0,8).map((d,i) => ({
    name: d.name, value: d.value, fill: PALETTE[i % PALETTE.length],
  }));

  /* intent horizontal bar */
  const intentData = (s.intentData || []).slice(0,8).map((d,i) => ({
    name: d.name, value: d.value, fill: PALETTE[i % PALETTE.length],
  }));

  /* emotion pie */
  const emotionPie = (s.emotionData || []).slice(0,6).map((e,i) => ({
    name: e.name, value: e.value, color: PALETTE[i % PALETTE.length],
  }));

  /* keyword bar */
  const keywordData = (s.topKeywords || []).slice(0,12).map(k => ({ name: k.word, count: k.count }));

  /* urgency bar */
  const urgencyData = [
    { name:'Low',    value: s.urgencyCounts?.low    || 0, fill: HEX.green },
    { name:'Medium', value: s.urgencyCounts?.medium || 0, fill: HEX.amber },
    { name:'High',   value: s.urgencyCounts?.high   || 0, fill: HEX.red },
  ].filter(d => d.value > 0);

  /* ai summary */
  const topKw      = s.topKeywords?.[0]?.word || 'finance';
  const highRisk   = s.riskCounts?.high || 0;
  const topEmotion = s.emotionData?.[0]?.name || 'neutral';
  const aiSummary  = `${s.totalTranscripts} sessions analysed — ${financePct}% contain financial content, with "${topKw}" as the top detected term. ${highRisk > 0 ? `${highRisk} high-risk session${highRisk > 1 ? 's were' : ' was'} flagged and warrant immediate follow-up.` : 'No high-risk sessions detected — portfolio looks healthy.'} Dominant client emotion: ${topEmotion.toLowerCase()}.`;

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:22, color:'var(--text-primary)' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes gPulse{0%,100%{opacity:1}50%{opacity:0.5}}`}</style>

      {/* ── HERO ── */}
      <div style={{ background:'#0f1a0a', borderRadius:18, padding:'28px 28px 24px', position:'relative', overflow:'hidden', border:'1px solid rgba(160,200,120,0.18)', boxShadow:'0 8px 48px rgba(0,0,0,0.4)' }}>
        {/* dot grid */}
        <div style={{ position:'absolute', inset:0, pointerEvents:'none', opacity:0.6, backgroundImage:'radial-gradient(circle,rgba(160,200,120,0.06) 1px,transparent 1px)', backgroundSize:'24px 24px' }} />
        {/* glow blobs */}
        <div style={{ position:'absolute', top:-80, right:-60, width:280, height:280, borderRadius:'50%', background:'radial-gradient(circle,rgba(160,200,120,0.13),transparent 70%)', pointerEvents:'none' }} />
        <div style={{ position:'absolute', bottom:-60, left:-40, width:200, height:200, borderRadius:'50%', background:'radial-gradient(circle,rgba(221,235,157,0.07),transparent 70%)', pointerEvents:'none' }} />
        <div style={{ position:'relative', zIndex:1 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6 }}>
            <span style={{ fontSize:18, lineHeight:1 }}>🌿</span>
            <span style={{ fontSize:22, fontWeight:900, letterSpacing:-0.5, color:'#e8f0d8' }}>FinSentiq</span>
            <span style={{ fontSize:10, fontWeight:800, background:'rgba(160,200,120,0.15)', color:'#A0C878', border:'1px solid rgba(160,200,120,0.3)', borderRadius:8, padding:'3px 9px', letterSpacing:'0.5px' }}>INSIGHTS</span>
            <span style={{ display:'flex', alignItems:'center', gap:5, fontSize:11, fontWeight:700, color:'rgba(160,200,120,0.7)' }}>
              <span style={{ width:7, height:7, borderRadius:'50%', background:'#a0e878', animation:'gPulse 2s ease-in-out infinite', display:'inline-block' }} />
              Live
            </span>
          </div>
          <p style={{ fontSize:13, color:'rgba(160,200,120,0.5)', margin:'0 0 20px' }}>AI-powered financial conversation intelligence across all recorded sessions</p>
          <div style={{ display:'flex', gap:28, flexWrap:'wrap' }}>
            {[
              { val: s.totalTranscripts,     label:'Sessions analysed' },
              { val: `${coveragePct}%`,       label:'AI coverage' },
              { val: `${financePct}%`,        label:'Finance detected', highlight: financePct > 50 },
              { val: highRisk,                label:'High-risk flags', warn: highRisk > 0 },
            ].map((stat, i, arr) => (
              <React.Fragment key={i}>
                <div style={{ display:'flex', flexDirection:'column', gap:3 }}>
                  <span style={{ fontSize:24, fontWeight:900, letterSpacing:-1, color: stat.warn ? '#f5c97a' : stat.highlight ? '#d4f5a0' : '#e8f0d8' }}>{stat.val}</span>
                  <span style={{ fontSize:11, color:'rgba(160,200,120,0.45)', fontWeight:600 }}>{stat.label}</span>
                </div>
                {i < arr.length-1 && <div style={{ width:1, background:'rgba(160,200,120,0.15)', alignSelf:'stretch', margin:'4px 0' }} />}
              </React.Fragment>
            ))}
          </div>
        </div>
        <button onClick={load} style={{ position:'absolute', top:18, right:18, background:'rgba(160,200,120,0.1)', border:'1px solid rgba(160,200,120,0.25)', borderRadius:10, color:'rgba(160,200,120,0.85)', cursor:'pointer', display:'flex', alignItems:'center', gap:5, fontSize:11, fontWeight:700, padding:'7px 13px' }}>
          <RefreshCw size={12} /> Refresh
        </button>
      </div>

      {/* ── AI SUMMARY BANNER ── */}
      <div style={{ background:'var(--green-bg)', border:'1px solid var(--green-border)', borderRadius:14, padding:'16px 20px', display:'flex', gap:14, alignItems:'flex-start' }}>
        <div style={{ width:34, height:34, borderRadius:10, background:'var(--green-bg)', border:'1px solid var(--green-border)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
          <Brain size={16} color="var(--green)" />
        </div>
        <div>
          <div style={{ fontSize:11, fontWeight:800, color:'var(--green)', textTransform:'uppercase', letterSpacing:'1px', marginBottom:5 }}>AI Summary</div>
          <div style={{ fontSize:13, color:'var(--text-secondary)', lineHeight:1.7 }}>{aiSummary}</div>
        </div>
      </div>

      {/* ── KPI ROW ── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(148px,1fr))', gap:12 }}>
        <MetricCard icon={Activity}      label="Total Sessions"   value={s.totalTranscripts}         color="var(--green)"         sub={`${coveragePct}% AI coverage`} accent />
        <MetricCard icon={Brain}         label="AI Analysed"      value={s.totalWithInsights}         color="var(--green-dk, #3d7a1a)" sub="with full insights" />
        <MetricCard icon={DollarSign}    label="Finance Detected" value={s.financeCount}              color="var(--accent-cyan)"   sub={`${financePct}% of sessions`} accent />
        <MetricCard icon={Zap}           label="High Urgency"     value={s.urgencyCounts?.high || 0}  color="var(--accent-amber)"  sub="needs review" />
        <MetricCard icon={AlertTriangle} label="High Risk"        value={s.riskCounts?.high   || 0}   color="var(--accent-red)"    sub="act now" accent />
        <MetricCard icon={CheckCircle}   label="Low Risk"         value={s.riskCounts?.low    || 0}   color="var(--accent-green)"  sub="all clear" />
      </div>

      {/* ── ROW 1: Sentiment Trend (2fr) + Risk Gauge (1fr) ── */}
      <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:14 }}>
        <div style={cs}>
          <SectionTitle icon={Activity} title="Sentiment Trend Over Time" sub="Daily positive / neutral / negative breakdown" tip="How emotional tone shifts across sessions day by day." />
          {trendData.length === 0 ? (
            <div style={{ padding:'30px 0', textAlign:'center', color:'var(--text-muted)', fontSize:13 }}>No timeline data yet.</div>
          ) : (
            <ResponsiveContainer width="100%" height={230}>
              <AreaChart data={trendData} margin={{ top:4, right:16, left:-10, bottom:0 }}>
                <defs>
                  {[['gPos',HEX.green],['gNeu',HEX.amber],['gNeg',HEX.red]].map(([id,c]) => (
                    <linearGradient key={id} id={id} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={c} stopOpacity={0.22} />
                      <stop offset="95%" stopColor={c} stopOpacity={0} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid {...gridStyle} />
                <XAxis dataKey="date" tick={tickStyle} />
                <YAxis tick={tickStyle} allowDecimals={false} />
                <Tooltip content={<ChartTip />} />
                <Legend wrapperStyle={{ fontSize:12, fontWeight:700 }} />
                <Area type="monotone" dataKey="Positive" stroke={HEX.green} strokeWidth={2.5} fill="url(#gPos)" dot={{ r:4, fill:HEX.green }} />
                <Area type="monotone" dataKey="Neutral"  stroke={HEX.amber} strokeWidth={2}   fill="url(#gNeu)" dot={{ r:3 }} strokeDasharray="5 3" />
                <Area type="monotone" dataKey="Negative" stroke={HEX.red}   strokeWidth={2.5} fill="url(#gNeg)" dot={{ r:4, fill:HEX.red }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        <div style={cs}>
          <SectionTitle icon={Shield} title="Risk Score" sub="High-risk session rate" color="var(--accent-red)" tip="Percentage of sessions flagged as high-risk out of total." />
          <RiskGauge highCount={s.riskCounts?.high || 0} total={s.totalTranscripts} />
          <div style={{ display:'flex', justifyContent:'center', gap:14, marginTop:8 }}>
            {[['Low',HEX.green,'0–20%'],['Med',HEX.amber,'21–40%'],['High',HEX.red,'41%+']].map(([label,color,range]) => (
              <div key={label} style={{ display:'flex', alignItems:'center', gap:4, fontSize:10, fontWeight:700, color:'var(--text-muted)' }}>
                <span style={{ width:8, height:8, borderRadius:'50%', background:color, display:'inline-block' }} />
                {label} <span style={{ fontWeight:500 }}>({range})</span>
              </div>
            ))}
          </div>
          {/* risk breakdown tiles */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginTop:16 }}>
            {[
              { label:'Low',    val: s.riskCounts?.low    || 0, color: HEX.green },
              { label:'Medium', val: s.riskCounts?.medium || 0, color: HEX.amber },
              { label:'High',   val: s.riskCounts?.high   || 0, color: HEX.red },
            ].map(r => (
              <div key={r.label} style={{ background:'var(--bg-subtle)', border:`1px solid ${r.color}22`, borderRadius:12, padding:'10px 12px', textAlign:'center' }}>
                <div style={{ fontSize:20, fontWeight:900, color:r.color, letterSpacing:-0.5 }}>{r.val}</div>
                <div style={{ fontSize:10, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.4px', marginTop:2 }}>{r.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── ROW 2: Finance Keywords (2fr) + Emotion Pie (1fr) ── */}
      <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:14 }}>
        <div style={cs}>
          <SectionTitle icon={DollarSign} title="Top Financial Keywords" sub="Most mentioned financial terms across all sessions" color="var(--accent-cyan)" tip="Financial entities detected by AI — higher bars = more mentions across sessions." />
          {keywordData.length === 0 ? (
            <div style={{ padding:'30px 0', textAlign:'center', color:'var(--text-muted)', fontSize:13 }}>No financial keywords detected yet.</div>
          ) : (
            <ResponsiveContainer width="100%" height={230}>
              <BarChart data={keywordData} margin={{ top:4, right:16, left:-10, bottom:0 }}>
                <CartesianGrid {...gridStyle} />
                <XAxis dataKey="name" tick={tickStyle} angle={-20} textAnchor="end" height={44} />
                <YAxis tick={tickStyle} allowDecimals={false} />
                <Tooltip content={<ChartTip />} />
                <Bar dataKey="count" name="Mentions" radius={[6,6,0,0]}>
                  {keywordData.map((_,i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div style={cs}>
          <SectionTitle icon={Brain} title="Emotion Breakdown" sub="Primary emotion per session" color="var(--accent-amber)" tip="AI-detected emotional state across all conversations." />
          {emotionPie.length === 0 ? (
            <div style={{ padding:'30px 0', textAlign:'center', color:'var(--text-muted)', fontSize:13 }}>No emotion data yet.</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={emotionPie} cx="50%" cy="50%" outerRadius={78} paddingAngle={3} dataKey="value"
                  label={({ name, percent }) => percent > 0.1 ? name : ''} labelLine={false}>
                  {emotionPie.map((d,i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <Tooltip content={<ChartTip />} />
                <Legend wrapperStyle={{ fontSize:11, fontWeight:700 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ── ROW 3: Domain (1fr) + Intent (1fr) ── */}
      {(domainData.length > 0 || intentData.length > 0) && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
          {domainData.length > 0 && (
            <div style={cs}>
              <SectionTitle icon={Layers} title="Domain Distribution" sub="What topics are being discussed?" color="var(--accent-purple)" tip="AI categorises each conversation into a domain. Shows which subjects appear most." />
              <ResponsiveContainer width="100%" height={Math.max(180, domainData.length * 34 + 40)}>
                <BarChart data={domainData} layout="vertical" margin={{ top:4, right:16, left:10, bottom:0 }}>
                  <CartesianGrid {...gridStyle} horizontal={false} />
                  <XAxis type="number" tick={tickStyle} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" tick={{ ...tickStyle, fill:'var(--text-secondary)' }} width={80} />
                  <Tooltip content={<ChartTip />} />
                  <Bar dataKey="value" name="Sessions" radius={[0,6,6,0]}>
                    {domainData.map((d,i) => <Cell key={i} fill={d.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
          {intentData.length > 0 && (
            <div style={cs}>
              <SectionTitle icon={Target} title="User Intent" sub="What clients are trying to accomplish" color="var(--accent-cyan)" tip="AI-detected intent behind each conversation — what the client was seeking." />
              <ResponsiveContainer width="100%" height={Math.max(180, intentData.length * 34 + 40)}>
                <BarChart data={intentData} layout="vertical" margin={{ top:4, right:16, left:10, bottom:0 }}>
                  <CartesianGrid {...gridStyle} horizontal={false} />
                  <XAxis type="number" tick={tickStyle} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" tick={{ ...tickStyle, fill:'var(--text-secondary)' }} width={80} />
                  <Tooltip content={<ChartTip />} />
                  <Bar dataKey="value" name="Sessions" radius={[0,6,6,0]}>
                    {intentData.map((d,i) => <Cell key={i} fill={d.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* ── ROW 4: Urgency + Risk Pie side by side ── */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
        {urgencyData.length > 0 && (
          <div style={cs}>
            <SectionTitle icon={Zap} title="Urgency Distribution" sub="How quickly each session needs a response" color="var(--accent-amber)" tip="Low = can wait, Medium = follow up soon, High = immediate action needed." />
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={urgencyData} margin={{ top:4, right:16, left:-10, bottom:0 }}>
                <CartesianGrid {...gridStyle} />
                <XAxis dataKey="name" tick={tickStyle} />
                <YAxis tick={tickStyle} allowDecimals={false} />
                <Tooltip content={<ChartTip />} />
                <Bar dataKey="value" name="Sessions" radius={[6,6,0,0]}>
                  {urgencyData.map((d,i) => <Cell key={i} fill={d.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
        {riskPie.length > 0 && (
          <div style={cs}>
            <SectionTitle icon={TrendingUp} title="Risk Split" sub={`${pct(s.riskCounts?.low||0, totalRisk)}% low · ${pct(s.riskCounts?.medium||0, totalRisk)}% medium · ${pct(s.riskCounts?.high||0, totalRisk)}% high`} color="var(--accent-red)" tip="Proportion of sessions in each risk category." />
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={riskPie} cx="50%" cy="50%" innerRadius={50} outerRadius={78} paddingAngle={5} dataKey="value"
                  label={({ name, percent }) => percent > 0.08 ? `${(percent*100).toFixed(0)}%` : ''} labelLine={false}>
                  {riskPie.map((d,i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <Tooltip content={<ChartTip />} />
                <Legend wrapperStyle={{ fontSize:11, fontWeight:700 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* ── FINANCE COVERAGE CALLOUT ── */}
      {financePct > 0 && (
        <div style={{ ...cs, background:'linear-gradient(135deg, rgba(8,145,178,0.06) 0%, rgba(90,158,47,0.06) 100%)', border:'1px solid rgba(8,145,178,0.2)' }}>
          <SectionTitle icon={DollarSign} title="Financial Content Coverage" sub="Breakdown of finance-related session detection" color="var(--accent-cyan)" />
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))', gap:12 }}>
            {[
              { label:'Finance Detected',    val: s.financeCount,                                  total: s.totalTranscripts, color: HEX.blue },
              { label:'Non-Finance',         val: s.totalTranscripts - s.financeCount,              total: s.totalTranscripts, color: HEX.green },
              { label:'With Full Insights',  val: s.totalWithInsights,                              total: s.totalTranscripts, color: HEX.purple },
              { label:'Missing Insights',    val: s.totalTranscripts - s.totalWithInsights,         total: s.totalTranscripts, color: HEX.amber },
            ].map(item => (
              <div key={item.label} style={{ background:'var(--bg-subtle)', border:'1px solid var(--border)', borderRadius:14, padding:'14px 16px' }}>
                <div style={{ fontSize:22, fontWeight:900, color:item.color, letterSpacing:-0.5, fontVariantNumeric:'tabular-nums' }}>{item.val}</div>
                <div style={{ fontSize:11, fontWeight:700, color:'var(--text-muted)', marginTop:2, marginBottom:8 }}>{item.label}</div>
                <div style={{ height:4, background:'var(--border)', borderRadius:4, overflow:'hidden' }}>
                  <div style={{ width:`${pct(item.val, item.total)}%`, height:'100%', background:item.color, borderRadius:4, transition:'width 0.9s ease' }} />
                </div>
                <div style={{ fontSize:10, color:'var(--text-muted)', marginTop:4 }}>{pct(item.val, item.total)}% of total</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Insights;
