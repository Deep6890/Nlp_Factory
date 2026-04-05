import React, { useMemo } from 'react';
import {
  ScatterChart, Scatter, BarChart, Bar, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ComposedChart, Line, Area,
} from 'recharts';
import { TrendingUp, Activity, BarChart2, Globe } from 'lucide-react';
import { useData } from '../../context/DataContext';

const C = {
  cream2: '#FAF6E9', limelt: '#DDEB9D', green: '#A0C878', greendk: '#7aaa52',
  text: '#1a2010', textmid: '#4a5a30', textdim: '#8a9a70', shadow: 'rgba(100,140,60,0.11)',
  neg: '#dc2626', med: '#f59e0b',
};
const card = { background: '#fff', border: '1px solid rgba(160,200,120,0.22)', borderRadius: 20, padding: '22px 24px', boxShadow: `0 2px 16px ${C.shadow}` };
const PALETTE = ['#A0C878', '#7aaa52', '#DDEB9D', '#4a5a30', '#c8e6a0', '#5a8a3a', '#f59e0b', '#dc2626', '#8b5cf6', '#06b6d4'];

const SectionTitle = ({ icon: Icon, title, sub }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
    <div style={{ width: 34, height: 34, borderRadius: 10, background: C.limelt, border: `1px solid ${C.green}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.text }}>
      <Icon size={16} />
    </div>
    <div>
      <div style={{ fontSize: 15, fontWeight: 800, color: C.text }}>{title}</div>
      {sub && <div style={{ fontSize: 11, color: C.textdim, fontWeight: 500 }}>{sub}</div>}
    </div>
  </div>
);

const Tip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#fff', border: `1px solid ${C.green}`, borderRadius: 12, padding: '10px 14px', fontSize: 12, fontWeight: 600, color: C.text, boxShadow: '0 4px 20px rgba(100,140,60,0.18)' }}>
      {label && <div style={{ color: C.textdim, marginBottom: 4, fontSize: 11 }}>{label}</div>}
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color || C.text }}>{p.name}: <strong>{typeof p.value === 'number' ? p.value.toFixed(2) : p.value}</strong></div>
      ))}
    </div>
  );
};

// Heatmap: day-of-week × hour sentiment
const SentimentHeatmap = ({ transcripts }) => {
  const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const HOURS = Array.from({ length: 24 }, (_, i) => i);

  const grid = useMemo(() => {
    const map = {};
    transcripts.forEach(t => {
      const d = new Date(t.createdAt);
      const key = `${d.getDay()}_${d.getHours()}`;
      if (!map[key]) map[key] = { sum: 0, count: 0 };
      map[key].sum += t.summary.financialRiskScore;
      map[key].count++;
    });
    return map;
  }, [transcripts]);

  const maxVal = Math.max(...Object.values(grid).map(v => v.sum / v.count), 1);

  return (
    <div style={{ overflowX: 'auto' }}>
      <div style={{ display: 'grid', gridTemplateColumns: `40px repeat(24, 1fr)`, gap: 3, minWidth: 600 }}>
        <div />
        {HOURS.map(h => (
          <div key={h} style={{ fontSize: 9, fontWeight: 700, color: C.textdim, textAlign: 'center', paddingBottom: 4 }}>{h}</div>
        ))}
        {DAYS.map((day, di) => (
          <React.Fragment key={day}>
            <div style={{ fontSize: 10, fontWeight: 700, color: C.textdim, display: 'flex', alignItems: 'center' }}>{day}</div>
            {HOURS.map(h => {
              const key = `${di}_${h}`;
              const val = grid[key] ? grid[key].sum / grid[key].count : 0;
              const intensity = val / maxVal;
              const bg = val === 0 ? 'rgba(160,200,120,0.06)' :
                intensity > 0.7 ? `rgba(220,38,38,${0.3 + intensity * 0.5})` :
                intensity > 0.4 ? `rgba(245,158,11,${0.3 + intensity * 0.4})` :
                `rgba(160,200,120,${0.2 + intensity * 0.6})`;
              return (
                <div key={h} title={val > 0 ? `Risk: ${val.toFixed(0)}` : 'No data'}
                  style={{ height: 22, borderRadius: 4, background: bg, transition: 'all 0.2s', cursor: val > 0 ? 'pointer' : 'default' }}
                  onMouseEnter={e => { if (val > 0) e.currentTarget.style.transform = 'scale(1.2)'; }}
                  onMouseLeave={e => e.currentTarget.style.transform = ''} />
              );
            })}
          </React.Fragment>
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, fontSize: 10, fontWeight: 700, color: C.textdim }}>
        <span>Low risk</span>
        {['rgba(160,200,120,0.4)', 'rgba(245,158,11,0.5)', 'rgba(220,38,38,0.6)', 'rgba(220,38,38,0.9)'].map((bg, i) => (
          <div key={i} style={{ width: 16, height: 16, borderRadius: 3, background: bg }} />
        ))}
        <span>High risk</span>
      </div>
    </div>
  );
};

// Waterfall: sentiment shift across a single transcript
const SentimentWaterfall = ({ sentences }) => {
  const data = sentences.map((s, i) => ({
    name: `S${i + 1}`,
    score: parseFloat((s.sentiment.score * (s.sentiment.label === 'negative' ? -1 : 1)).toFixed(2)),
    label: s.sentiment.label,
    text: s.text.slice(0, 40) + '…',
  }));

  return (
    <ResponsiveContainer width="100%" height={220} aria-label="Sentiment waterfall chart" role="img">
      <ComposedChart data={data} margin={{ top: 4, right: 16, left: -10, bottom: 0 }} animationDuration={800}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(160,200,120,0.12)" />
        <XAxis dataKey="name" tick={{ fontSize: 11, fill: C.textdim }} />
        <YAxis tick={{ fontSize: 11, fill: C.textdim }} domain={[-1, 1]} />
        <Tooltip content={({ active, payload }) => {
          if (!active || !payload?.length) return null;
          const d = payload[0]?.payload;
          return (
            <div style={{ background: '#fff', border: `1px solid ${C.green}`, borderRadius: 12, padding: '10px 14px', fontSize: 11, maxWidth: 200, boxShadow: '0 4px 20px rgba(100,140,60,0.18)' }}>
              <div style={{ fontWeight: 700, color: C.text, marginBottom: 4 }}>{d?.text}</div>
              <div style={{ color: C.textdim }}>Score: <strong style={{ color: d?.score >= 0 ? C.greendk : C.neg }}>{d?.score}</strong></div>
              <div style={{ color: C.textdim, textTransform: 'capitalize' }}>Label: {d?.label}</div>
            </div>
          );
        }} />
        <Bar dataKey="score" name="Sentiment" radius={[4, 4, 0, 0]} animationDuration={800}>
          {data.map((d, i) => <Cell key={i} fill={d.score >= 0 ? C.green : C.neg} />)}
        </Bar>
        <Line type="monotone" dataKey="score" stroke={C.med} strokeWidth={2} dot={false} strokeDasharray="4 2" animationDuration={800} />
      </ComposedChart>
    </ResponsiveContainer>
  );
};

// Keyword network — force-directed simulation (CSS-based approximation)
const KeywordNetwork = ({ keywords }) => {
  const nodes = keywords.slice(0, 8);
  const center = { x: 50, y: 50 };
  const radius = 35;

  return (
    <div style={{ position: 'relative', height: 260, background: C.cream2, borderRadius: 14, overflow: 'hidden' }}>
      <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
        {nodes.map((kw, i) => {
          const angle = (i / nodes.length) * 2 * Math.PI - Math.PI / 2;
          const x = center.x + radius * Math.cos(angle);
          const y = center.y + radius * Math.sin(angle);
          return (
            <line key={`l${i}`} x1={center.x} y1={center.y} x2={x} y2={y}
              stroke="rgba(160,200,120,0.4)" strokeWidth="0.5" strokeDasharray="2 1" />
          );
        })}
        <circle cx={center.x} cy={center.y} r="8" fill={C.green} />
        <text x={center.x} y={center.y + 1} textAnchor="middle" dominantBaseline="middle" fontSize="3" fontWeight="bold" fill="#fff">Finance</text>
        {nodes.map((kw, i) => {
          const angle = (i / nodes.length) * 2 * Math.PI - Math.PI / 2;
          const x = center.x + radius * Math.cos(angle);
          const y = center.y + radius * Math.sin(angle);
          const nodeR = 3 + Math.min(kw.count * 0.8, 5);
          return (
            <g key={`n${i}`}>
              <circle cx={x} cy={y} r={nodeR} fill={PALETTE[i % PALETTE.length]} opacity={0.85} />
              <text x={x} y={y + nodeR + 2.5} textAnchor="middle" fontSize="2.5" fill={C.textdim} fontWeight="600">{kw.name.slice(0, 10)}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

const AnalyticsDeepDive = () => {
  const { transcripts, financialKeywords, isLoading } = useData();

  if (isLoading) return (
    <div style={{ padding: 60, textAlign: 'center', color: C.textdim, fontFamily: 'Inter,sans-serif' }}>
      <div style={{ fontSize: 13, fontWeight: 600 }}>Loading deep dive analytics…</div>
    </div>
  );

  // Scatter data: risk score vs session length
  const scatterData = transcripts.map(t => ({
    x: t.summary.totalDuration,
    y: t.summary.financialRiskScore,
    name: t.sessionId,
    sentiment: t.summary.overallSentiment,
  }));

  // Pick first transcript for waterfall
  const firstTranscript = transcripts[0];

  // NLP tag frequency
  const tagFreq = {};
  transcripts.forEach(t => t.transcript.forEach(s => s.nlpTags.forEach(tag => { tagFreq[tag] = (tagFreq[tag] || 0) + 1; })));
  const tagData = Object.entries(tagFreq).sort(([, a], [, b]) => b - a).map(([name, count]) => ({ name, count }));

  return (
    <div style={{ fontFamily: 'Inter,sans-serif', display: 'flex', flexDirection: 'column', gap: 22, color: C.text }}>

      <div>
        <h1 style={{ fontSize: 'clamp(22px,3vw,30px)', fontWeight: 900, letterSpacing: -1, margin: 0 }}>Analytics Deep Dive</h1>
        <p style={{ fontSize: 13, color: C.textdim, marginTop: 4, margin: 0 }}>Advanced visualizations — heatmaps, scatter plots, waterfall & keyword network</p>
      </div>

      {/* Heatmap */}
      <div style={card}>
        <SectionTitle icon={Activity} title="Risk Heatmap" sub="Day of week × hour of day — color intensity = avg risk score" />
        <SentimentHeatmap transcripts={transcripts} />
      </div>

      {/* Scatter + NLP Tags */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div style={card}>
          <SectionTitle icon={TrendingUp} title="Risk vs Session Length" sub="Each dot = one session" />
          {scatterData.length === 0 ? (
            <div style={{ padding: '30px 0', textAlign: 'center', color: C.textdim, fontSize: 13 }}>No data available.</div>
          ) : (
            <ResponsiveContainer width="100%" height={260} aria-label="Risk score vs session length scatter" role="img">
              <ScatterChart margin={{ top: 4, right: 16, left: -10, bottom: 0 }} animationDuration={800}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(160,200,120,0.12)" />
                <XAxis dataKey="x" name="Duration (s)" tick={{ fontSize: 11, fill: C.textdim }} label={{ value: 'Duration (s)', position: 'insideBottom', offset: -2, fontSize: 10, fill: C.textdim }} />
                <YAxis dataKey="y" name="Risk Score" tick={{ fontSize: 11, fill: C.textdim }} label={{ value: 'Risk', angle: -90, position: 'insideLeft', fontSize: 10, fill: C.textdim }} />
                <Tooltip content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0]?.payload;
                  return (
                    <div style={{ background: '#fff', border: `1px solid ${C.green}`, borderRadius: 12, padding: '10px 14px', fontSize: 11, boxShadow: '0 4px 20px rgba(100,140,60,0.18)' }}>
                      <div style={{ fontWeight: 700, color: C.text, marginBottom: 4 }}>{d?.name}</div>
                      <div style={{ color: C.textdim }}>Duration: <strong>{d?.x}s</strong></div>
                      <div style={{ color: C.textdim }}>Risk: <strong style={{ color: d?.y > 60 ? C.neg : d?.y > 35 ? C.med : C.greendk }}>{d?.y}</strong></div>
                      <div style={{ color: C.textdim, textTransform: 'capitalize' }}>Sentiment: {d?.sentiment}</div>
                    </div>
                  );
                }} />
                <Scatter data={scatterData} animationDuration={800}>
                  {scatterData.map((d, i) => (
                    <Cell key={i} fill={d.y > 60 ? C.neg : d.y > 35 ? C.med : C.green} opacity={0.8} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          )}
        </div>

        <div style={card}>
          <SectionTitle icon={BarChart2} title="NLP Tag Frequency" sub="Most common conversation tags" />
          {tagData.length === 0 ? (
            <div style={{ padding: '30px 0', textAlign: 'center', color: C.textdim, fontSize: 13 }}>No NLP tags found.</div>
          ) : (
            <ResponsiveContainer width="100%" height={260} aria-label="NLP tag frequency" role="img">
              <BarChart data={tagData} layout="vertical" margin={{ top: 4, right: 20, left: 10, bottom: 0 }} animationDuration={800}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(160,200,120,0.12)" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: C.textdim }} allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: C.textdim }} width={110} />
                <Tooltip content={<Tip />} />
                <Bar dataKey="count" name="Count" radius={[0, 8, 8, 0]} animationDuration={800}>
                  {tagData.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Waterfall */}
      {firstTranscript && (
        <div style={card}>
          <SectionTitle icon={Activity} title="Sentiment Waterfall" sub={`Sentence-by-sentence shift — ${firstTranscript.sessionId}`} />
          <SentimentWaterfall sentences={firstTranscript.transcript} />
        </div>
      )}

      {/* Keyword Network */}
      {financialKeywords.length > 0 && (
        <div style={card}>
          <SectionTitle icon={Globe} title="Financial Keyword Network" sub="Force-directed graph — node size = frequency" />
          <KeywordNetwork keywords={financialKeywords} />
        </div>
      )}
    </div>
  );
};

export default AnalyticsDeepDive;
