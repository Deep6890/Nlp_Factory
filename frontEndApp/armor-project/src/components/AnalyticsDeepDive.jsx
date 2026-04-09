import React, { useMemo } from 'react';
import {
  ScatterChart, Scatter, BarChart, Bar, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ComposedChart, Line,
} from 'recharts';
import { TrendingUp, Activity, BarChart2, Globe } from 'lucide-react';
import { useData } from '../context/DataContext';

const PALETTE = ['#5A9E2F','#A0C878','#D97706','#7C3AED','#0891B2','#DC2626','#059669','#EA580C','#6366F1','#0D9488'];

const cs = {
  background:'var(--bg-card)', border:'1px solid var(--border)',
  borderRadius:18, padding:'22px 24px', boxShadow:'var(--shadow-sm)',
};

const SectionTitle = ({ icon: Icon, title, sub }) => (
  <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:18 }}>
    <div style={{ width:32, height:32, borderRadius:9, background:'var(--green-bg)', border:'1px solid var(--green-border)', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--green)' }}>
      <Icon size={15} />
    </div>
    <div>
      <div style={{ fontSize:14, fontWeight:800, color:'var(--text-primary)' }}>{title}</div>
      {sub && <div style={{ fontSize:11, color:'var(--text-muted)', fontWeight:500 }}>{sub}</div>}
    </div>
  </div>
);

const ChartTip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:'var(--chart-tooltip-bg)', border:'1px solid var(--chart-tooltip-border)', borderRadius:12, padding:'10px 14px', fontSize:12, fontWeight:600, color:'var(--text-primary)', boxShadow:'var(--shadow-lg)' }}>
      {label && <div style={{ color:'var(--text-muted)', marginBottom:4, fontSize:11 }}>{label}</div>}
      {payload.map((p,i) => (
        <div key={i} style={{ color:p.color||'var(--text-primary)' }}>{p.name}: <strong>{typeof p.value==='number' ? p.value.toFixed(2) : p.value}</strong></div>
      ))}
    </div>
  );
};

/* ── Risk Heatmap ── */
const SentimentHeatmap = ({ transcripts }) => {
  const DAYS  = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const HOURS = Array.from({ length:24 }, (_,i) => i);

  const grid = useMemo(() => {
    const map = {};
    transcripts.forEach(t => {
      const d = new Date(t.createdAt);
      const key = `${d.getDay()}_${d.getHours()}`;
      if (!map[key]) map[key] = { sum:0, count:0 };
      const risk = t.insights?.risk_level === 'high' ? 80 : t.insights?.risk_level === 'medium' ? 50 : 20;
      map[key].sum += risk;
      map[key].count++;
    });
    return map;
  }, [transcripts]);

  const maxVal = Math.max(...Object.values(grid).map(v => v.sum/v.count), 1);

  return (
    <div style={{ overflowX:'auto' }}>
      <div style={{ display:'grid', gridTemplateColumns:`40px repeat(24,1fr)`, gap:3, minWidth:600 }}>
        <div />
        {HOURS.map(h => (
          <div key={h} style={{ fontSize:9, fontWeight:700, color:'var(--text-muted)', textAlign:'center', paddingBottom:4 }}>{h}</div>
        ))}
        {DAYS.map((day,di) => (
          <React.Fragment key={day}>
            <div style={{ fontSize:10, fontWeight:700, color:'var(--text-muted)', display:'flex', alignItems:'center' }}>{day}</div>
            {HOURS.map(h => {
              const key = `${di}_${h}`;
              const val = grid[key] ? grid[key].sum/grid[key].count : 0;
              const intensity = val/maxVal;
              const bg = val===0 ? 'var(--bg-subtle)' :
                intensity > 0.7 ? `rgba(220,38,38,${0.3+intensity*0.5})` :
                intensity > 0.4 ? `rgba(217,119,6,${0.3+intensity*0.4})` :
                `rgba(90,158,47,${0.2+intensity*0.6})`;
              return (
                <div key={h} title={val>0 ? `Risk: ${val.toFixed(0)}` : 'No data'}
                  style={{ height:22, borderRadius:4, background:bg, transition:'all 0.2s', cursor:val>0?'pointer':'default' }}
                  onMouseEnter={e => { if(val>0) e.currentTarget.style.transform='scale(1.2)'; }}
                  onMouseLeave={e => e.currentTarget.style.transform=''} />
              );
            })}
          </React.Fragment>
        ))}
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:12, fontSize:10, fontWeight:700, color:'var(--text-muted)' }}>
        <span>Low risk</span>
        {['rgba(90,158,47,0.4)','rgba(217,119,6,0.5)','rgba(220,38,38,0.6)','rgba(220,38,38,0.9)'].map((bg,i) => (
          <div key={i} style={{ width:16, height:16, borderRadius:3, background:bg }} />
        ))}
        <span>High risk</span>
      </div>
    </div>
  );
};

/* ── Sentiment Waterfall ── */
const SentimentWaterfall = ({ transcripts }) => {
  const data = transcripts.slice(0,12).map((t,i) => ({
    name: `S${i+1}`,
    score: t.insights?.sentiment_score != null
      ? parseFloat((t.insights.sentiment_score * (t.insights.sentiment_label==='negative' ? -1 : 1)).toFixed(2))
      : 0,
    label: t.insights?.sentiment_label || 'neutral',
    text: (t.text||'').slice(0,40)+'…',
  }));

  return (
    <ResponsiveContainer width="100%" height={220} aria-label="Sentiment waterfall" role="img">
      <ComposedChart data={data} margin={{ top:4, right:16, left:-10, bottom:0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
        <XAxis dataKey="name" tick={{ fontSize:11, fill:'var(--chart-tick)' }} />
        <YAxis tick={{ fontSize:11, fill:'var(--chart-tick)' }} domain={[-1,1]} />
        <Tooltip content={({ active, payload }) => {
          if (!active||!payload?.length) return null;
          const d = payload[0]?.payload;
          return (
            <div style={{ background:'var(--chart-tooltip-bg)', border:'1px solid var(--chart-tooltip-border)', borderRadius:12, padding:'10px 14px', fontSize:11, maxWidth:200, boxShadow:'var(--shadow-lg)' }}>
              <div style={{ fontWeight:700, color:'var(--text-primary)', marginBottom:4 }}>{d?.text}</div>
              <div style={{ color:'var(--text-muted)' }}>Score: <strong style={{ color:d?.score>=0?'var(--green)':'var(--accent-red)' }}>{d?.score}</strong></div>
              <div style={{ color:'var(--text-muted)', textTransform:'capitalize' }}>Label: {d?.label}</div>
            </div>
          );
        }} />
        <Bar dataKey="score" name="Sentiment" radius={[4,4,0,0]}>
          {data.map((d,i) => <Cell key={i} fill={d.score>=0 ? '#5A9E2F' : '#DC2626'} />)}
        </Bar>
        <Line type="monotone" dataKey="score" stroke="#D97706" strokeWidth={2} dot={false} strokeDasharray="4 2" />
      </ComposedChart>
    </ResponsiveContainer>
  );
};

/* ── Keyword Network ── */
const KeywordNetwork = ({ keywords }) => {
  const nodes = keywords.slice(0,8);
  const center = { x:50, y:50 };
  const radius = 35;

  return (
    <div style={{ position:'relative', height:260, background:'var(--bg-subtle)', borderRadius:14, overflow:'hidden' }}>
      <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
        {nodes.map((kw,i) => {
          const angle = (i/nodes.length)*2*Math.PI - Math.PI/2;
          const x = center.x + radius*Math.cos(angle);
          const y = center.y + radius*Math.sin(angle);
          return <line key={`l${i}`} x1={center.x} y1={center.y} x2={x} y2={y} stroke="rgba(90,158,47,0.35)" strokeWidth="0.5" strokeDasharray="2 1" />;
        })}
        <circle cx={center.x} cy={center.y} r="8" fill="#5A9E2F" />
        <text x={center.x} y={center.y+1} textAnchor="middle" dominantBaseline="middle" fontSize="3" fontWeight="bold" fill="#fff">Finance</text>
        {nodes.map((kw,i) => {
          const angle = (i/nodes.length)*2*Math.PI - Math.PI/2;
          const x = center.x + radius*Math.cos(angle);
          const y = center.y + radius*Math.sin(angle);
          const nodeR = 3 + Math.min(kw.count*0.8, 5);
          return (
            <g key={`n${i}`}>
              <circle cx={x} cy={y} r={nodeR} fill={PALETTE[i%PALETTE.length]} opacity={0.85} />
              <text x={x} y={y+nodeR+2.5} textAnchor="middle" fontSize="2.5" fill="var(--chart-tick)" fontWeight="600">{kw.name.slice(0,10)}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

/* ── Main ── */
const AnalyticsDeepDive = () => {
  const { transcripts, financialKeywords, isLoading } = useData();

  if (isLoading) return (
    <div style={{ padding:60, textAlign:'center', color:'var(--text-muted)' }}>
      <div style={{ fontSize:13, fontWeight:600 }}>Loading deep dive analytics…</div>
    </div>
  );

  const scatterData = transcripts.map(t => ({
    x: t.insights?.audio_duration_sec || 0,
    y: t.insights?.risk_level==='high' ? 80 : t.insights?.risk_level==='medium' ? 50 : 20,
    name: t._id?.slice(0,8) || 'Session',
    sentiment: t.insights?.sentiment_label || 'neutral',
  }));

  const tagFreq = {};
  transcripts.forEach(t => {
    (t.keywords||[]).forEach(kw => { tagFreq[kw] = (tagFreq[kw]||0)+1; });
  });
  const tagData = Object.entries(tagFreq).sort(([,a],[,b]) => b-a).slice(0,10).map(([name,count]) => ({ name, count }));

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:22, color:'var(--text-primary)' }}>
      <div>
        <h1 style={{ fontSize:'clamp(22px,3vw,28px)', fontWeight:900, letterSpacing:-0.8, margin:0 }}>Analytics Deep Dive</h1>
        <p style={{ fontSize:13, color:'var(--text-muted)', marginTop:4, margin:0 }}>Advanced visualizations — heatmaps, scatter plots, waterfall &amp; keyword network</p>
      </div>

      {/* Heatmap */}
      <div style={cs}>
        <SectionTitle icon={Activity} title="Risk Heatmap" sub="Day of week × hour of day — color intensity = avg risk level" />
        <SentimentHeatmap transcripts={transcripts} />
      </div>

      {/* Scatter + Tags */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
        <div style={cs}>
          <SectionTitle icon={TrendingUp} title="Risk vs Session Length" sub="Each dot = one session" />
          {scatterData.length === 0 ? (
            <div style={{ padding:'30px 0', textAlign:'center', color:'var(--text-muted)', fontSize:13 }}>No data available.</div>
          ) : (
            <ResponsiveContainer width="100%" height={260} aria-label="Risk vs session length" role="img">
              <ScatterChart margin={{ top:4, right:16, left:-10, bottom:0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
                <XAxis dataKey="x" name="Duration (s)" tick={{ fontSize:11, fill:'var(--chart-tick)' }} />
                <YAxis dataKey="y" name="Risk Score" tick={{ fontSize:11, fill:'var(--chart-tick)' }} />
                <Tooltip content={({ active, payload }) => {
                  if (!active||!payload?.length) return null;
                  const d = payload[0]?.payload;
                  return (
                    <div style={{ background:'var(--chart-tooltip-bg)', border:'1px solid var(--chart-tooltip-border)', borderRadius:12, padding:'10px 14px', fontSize:11, boxShadow:'var(--shadow-lg)' }}>
                      <div style={{ fontWeight:700, color:'var(--text-primary)', marginBottom:4 }}>{d?.name}</div>
                      <div style={{ color:'var(--text-muted)' }}>Duration: <strong>{d?.x}s</strong></div>
                      <div style={{ color:'var(--text-muted)' }}>Risk: <strong style={{ color:d?.y>60?'var(--accent-red)':d?.y>35?'var(--accent-amber)':'var(--green)' }}>{d?.y}</strong></div>
                      <div style={{ color:'var(--text-muted)', textTransform:'capitalize' }}>Sentiment: {d?.sentiment}</div>
                    </div>
                  );
                }} />
                <Scatter data={scatterData}>
                  {scatterData.map((d,i) => <Cell key={i} fill={d.y>60?'#DC2626':d.y>35?'#D97706':'#5A9E2F'} opacity={0.8} />)}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          )}
        </div>

        <div style={cs}>
          <SectionTitle icon={BarChart2} title="Top Keywords" sub="Most common financial terms" />
          {tagData.length === 0 ? (
            <div style={{ padding:'30px 0', textAlign:'center', color:'var(--text-muted)', fontSize:13 }}>No keywords found.</div>
          ) : (
            <ResponsiveContainer width="100%" height={260} aria-label="Keyword frequency" role="img">
              <BarChart data={tagData} layout="vertical" margin={{ top:4, right:20, left:10, bottom:0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" horizontal={false} />
                <XAxis type="number" tick={{ fontSize:11, fill:'var(--chart-tick)' }} allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize:10, fill:'var(--chart-tick)' }} width={100} />
                <Tooltip content={<ChartTip />} />
                <Bar dataKey="count" name="Count" radius={[0,8,8,0]}>
                  {tagData.map((_,i) => <Cell key={i} fill={PALETTE[i%PALETTE.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Waterfall */}
      {transcripts.length > 0 && (
        <div style={cs}>
          <SectionTitle icon={Activity} title="Sentiment Waterfall" sub="Sentence-by-sentence sentiment shift across recent sessions" />
          <SentimentWaterfall transcripts={transcripts} />
        </div>
      )}

      {/* Keyword Network */}
      {financialKeywords.length > 0 && (
        <div style={cs}>
          <SectionTitle icon={Globe} title="Financial Keyword Network" sub="Node size = frequency — connected to Finance hub" />
          <KeywordNetwork keywords={financialKeywords} />
        </div>
      )}
    </div>
  );
};

export default AnalyticsDeepDive;
