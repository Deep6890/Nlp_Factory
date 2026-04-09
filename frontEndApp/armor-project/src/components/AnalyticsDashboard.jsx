import React, { useState } from 'react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  RadialBarChart, RadialBar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import {
  Activity, AlertTriangle, Bell, RefreshCw, Users, Brain,
  DollarSign, CheckCircle, Clock, ChevronRight, BarChart3, Layers, Info,
} from 'lucide-react';
import { useData } from '../context/DataContext';

/* ── Palette — works on both light and dark backgrounds ── */
const CHART_PALETTE = ['#5A9E2F','#A0C878','#D97706','#7C3AED','#0891B2','#DC2626','#059669','#EA580C','#6366F1','#0D9488'];
const SENT_COLORS   = { positive:'#5A9E2F', negative:'#DC2626', neutral:'#D97706', mixed:'#7C3AED' };

const cardStyle = {
  background: 'var(--bg-card)',
  border: '1px solid var(--border)',
  borderRadius: 18,
  padding: '22px 24px',
  boxShadow: 'var(--shadow-sm)',
  transition: 'background-color 0.25s ease, border-color 0.25s ease',
};

/* ── Skeleton loader ── */
const Skeleton = () => (
  <div style={{ ...cardStyle, display: 'flex', flexDirection: 'column', gap: 12 }}>
    {[80, 60, 100, 40].map((w, i) => (
      <div key={i} style={{ height: 14, width: `${w}%`, background: 'var(--bg-subtle)', borderRadius: 8, animation: 'pulse 1.5s ease-in-out infinite' }} />
    ))}
    <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
  </div>
);

/* ── KPI metric card ── */
const MetricCard = ({ icon: Icon, label, value, sub, color, accent }) => (
  <div style={{ ...cardStyle, display: 'flex', flexDirection: 'column', gap: 6, position: 'relative', overflow: 'hidden', transition: 'all 0.2s' }}
    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.borderColor = 'var(--border-hover)'; }}
    onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; e.currentTarget.style.borderColor = 'var(--border)'; }}>
    {accent && <div style={{ position: 'absolute', top: 0, right: 0, width: 80, height: 80, background: `radial-gradient(circle, ${color || 'var(--green)'}22 0%, transparent 70%)`, pointerEvents: 'none' }} />}
    <div style={{ width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `${color || 'var(--green)'}18`, border: `1px solid ${color || 'var(--green)'}30`, color: color || 'var(--green)', marginBottom: 4 }}>
      <Icon size={16} />
    </div>
    <div style={{ fontSize: 28, fontWeight: 900, color: color || 'var(--text-primary)', letterSpacing: -1, fontVariantNumeric: 'tabular-nums' }}>{value}</div>
    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)' }}>{label}</div>
    {sub && <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>{sub}</div>}
  </div>
);

/* ── Section title with icon ── */
const SectionTitle = ({ icon: Icon, title, sub, color, tip }) => (
  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 18 }}>
    <div style={{ width: 32, height: 32, borderRadius: 9, background: `${color || 'var(--green)'}18`, border: `1px solid ${color || 'var(--green)'}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: color || 'var(--green)', flexShrink: 0, marginTop: 1 }}>
      <Icon size={15} />
    </div>
    <div>
      <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
        {title}
        {tip && <span title={tip} style={{ cursor: 'help', opacity: 0.5 }}><Info size={12} /></span>}
      </div>
      {sub && <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500, marginTop: 2 }}>{sub}</div>}
    </div>
  </div>
);

/* ── Chart tooltip ── */
const ChartTip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--chart-tooltip-bg)', border: '1px solid var(--chart-tooltip-border)', borderRadius: 12, padding: '10px 14px', fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', boxShadow: 'var(--shadow-lg)' }}>
      {label && <div style={{ color: 'var(--text-muted)', marginBottom: 5, fontSize: 11 }}>{label}</div>}
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color || 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.color, display: 'inline-block', flexShrink: 0 }} />
          {p.name}: <strong>{typeof p.value === 'number' ? p.value.toLocaleString() : p.value}</strong>
        </div>
      ))}
    </div>
  );
};

/* ── Risk gauge ── */
const RiskGauge = ({ score }) => {
  const color = score > 60 ? 'var(--accent-red)' : score > 35 ? 'var(--accent-amber)' : 'var(--green)';
  const hexColor = score > 60 ? '#DC2626' : score > 35 ? '#D97706' : '#5A9E2F';
  const data = [{ name: 'Risk', value: score, fill: hexColor }];
  return (
    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <ResponsiveContainer width="100%" height={180} aria-label="Risk score gauge" role="img">
        <RadialBarChart cx="50%" cy="80%" innerRadius="60%" outerRadius="90%" startAngle={180} endAngle={0} data={data}>
          <RadialBar dataKey="value" cornerRadius={8} background={{ fill: 'var(--bg-subtle)' }} />
        </RadialBarChart>
      </ResponsiveContainer>
      <div style={{ position: 'absolute', bottom: 10, textAlign: 'center' }}>
        <div style={{ fontSize: 34, fontWeight: 900, color, letterSpacing: -2, fontVariantNumeric: 'tabular-nums' }}>{score}</div>
        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Risk Index</div>
      </div>
    </div>
  );
};

/* ── Main component ── */
const AnalyticsDashboard = ({ onNavigate }) => {
  const { sentimentStats, trendData, financialKeywords, speakerMetrics, reminderFlags, transcripts, isLoading, refetch, resolveReminder } = useData();
  const [sortCol, setSortCol] = useState('words');
  const [sortDir, setSortDir] = useState('desc');

  if (isLoading) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {[1, 2, 3].map(i => <Skeleton key={i} />)}
    </div>
  );

  /* Derived data */
  const sentimentDist = ['positive', 'negative', 'neutral'].map(label => ({
    name: label.charAt(0).toUpperCase() + label.slice(1),
    value: transcripts.filter(t => (t.insights?.sentiment_label || 'neutral') === label).length,
  })).filter(d => d.value > 0);

  const dominantSentiment = [...sentimentDist].sort((a, b) => b.value - a.value)[0]?.name || 'Neutral';

  const domainDist = Object.entries(
    transcripts.reduce((acc, t) => { const d = t.insights?.domain || 'general'; acc[d] = (acc[d] || 0) + 1; return acc; }, {})
  ).sort(([, a], [, b]) => b - a).slice(0, 6).map(([name, value]) => ({ name, value }));

  const emotionDist = Object.entries(
    transcripts.reduce((acc, t) => { const e = t.insights?.emotion || 'neutral'; acc[e] = (acc[e] || 0) + 1; return acc; }, {})
  ).sort(([, a], [, b]) => b - a).slice(0, 6).map(([name, value]) => ({ name, value }));

  const riskDist = [
    { name: 'Low',    value: transcripts.filter(t => (t.insights?.risk_level || 'low').toLowerCase() === 'low').length,    color: '#5A9E2F' },
    { name: 'Medium', value: transcripts.filter(t => (t.insights?.risk_level || '').toLowerCase() === 'medium').length,    color: '#D97706' },
    { name: 'High',   value: transcripts.filter(t => (t.insights?.risk_level || '').toLowerCase() === 'high').length,      color: '#DC2626' },
  ];

  const sortedSpeakers = [...speakerMetrics].sort((a, b) => {
    const av = parseFloat(a[sortCol]) || 0, bv = parseFloat(b[sortCol]) || 0;
    return sortDir === 'desc' ? bv - av : av - bv;
  });
  const toggleSort = col => { if (sortCol === col) setSortDir(d => d === 'desc' ? 'asc' : 'desc'); else { setSortCol(col); setSortDir('desc'); } };

  const activeReminders = reminderFlags.filter(r => !r.resolved);
  const ROLE_COLOR = { agent: '#5A9E2F', customer: '#D97706', analyst: '#7C3AED' };

  const tickStyle = { fontSize: 11, fill: 'var(--chart-tick)' };
  const gridStyle = { strokeDasharray: '3 3', stroke: 'var(--chart-grid)' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22, color: 'var(--text-primary)' }}>
      <style>{`@keyframes gPulse{0%,100%{opacity:1}50%{opacity:0.5}}`}</style>

      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <span style={{ fontSize: 24, fontWeight: 900, letterSpacing: -1, color: 'var(--text-primary)' }}>FinSentiq</span>
            <span style={{ fontSize: 10, fontWeight: 800, background: 'var(--green-bg)', color: 'var(--green)', border: '1px solid var(--green-border)', borderRadius: 8, padding: '3px 9px', letterSpacing: '0.5px' }}>ANALYTICS</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, color: 'var(--green)' }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--green)', animation: 'gPulse 2s ease-in-out infinite', display: 'inline-block' }} />
              Live
            </span>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
            Sentiment, risk &amp; financial conversation intelligence — all charts update in real time
          </p>
        </div>
        <button onClick={refetch}
          style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', background: 'var(--bg-subtle)', border: '1px solid var(--border)', borderRadius: 12, padding: '9px 18px', cursor: 'pointer', transition: 'all 0.2s' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-hover)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* ── KPI Row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(148px,1fr))', gap: 12 }}>
        <MetricCard icon={Activity}      label="Total Sessions"    value={sentimentStats.total}                    color="var(--green)"         accent />
        <MetricCard icon={Brain}         label="Sentiment Score"   value={`${sentimentStats.sentimentScore}%`}     color="var(--green-dk)"      sub="positive ratio" />
        <MetricCard icon={AlertTriangle} label="Risk Index"        value={sentimentStats.avgRisk}                  color={sentimentStats.avgRisk > 60 ? 'var(--accent-red)' : sentimentStats.avgRisk > 35 ? 'var(--accent-amber)' : 'var(--green)'} sub="avg across sessions" />
        <MetricCard icon={Bell}          label="Reminders"         value={activeReminders.length}                  color={activeReminders.length > 0 ? 'var(--accent-amber)' : 'var(--green)'} sub="pending items" />
        <MetricCard icon={Users}         label="Speakers"          value={speakerMetrics.length}                   color="var(--accent-purple)" sub="tracked" />
        <MetricCard icon={DollarSign}    label="Finance Entities"  value={financialKeywords.reduce((a, k) => a + k.count, 0)} color="var(--accent-cyan)" sub="total mentions" accent />
      </div>

      {/* ── Row 1: Sentiment Trend + Donut ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 14 }}>
        <div style={cardStyle}>
          <SectionTitle icon={Activity} title="Sentiment Trend Over Time" sub="Daily positive / negative / neutral breakdown" tip="Shows how the emotional tone of conversations changes day by day. Positive = good outcomes, Negative = concerns detected." />
          <ResponsiveContainer width="100%" height={230} aria-label="Sentiment trend over time" role="img">
            <AreaChart data={trendData} margin={{ top: 4, right: 16, left: -10, bottom: 0 }}>
              <defs>
                {[['gPos','#5A9E2F'],['gNeg','#DC2626'],['gNeu','#D97706']].map(([id, color]) => (
                  <linearGradient key={id} id={id} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={color} stopOpacity={0.2} />
                    <stop offset="95%" stopColor={color} stopOpacity={0} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid {...gridStyle} />
              <XAxis dataKey="date" tick={tickStyle} />
              <YAxis tick={tickStyle} allowDecimals={false} />
              <Tooltip content={<ChartTip />} />
              <Legend wrapperStyle={{ fontSize: 12, fontWeight: 700 }} />
              <Area type="monotone" dataKey="positive" stroke="#5A9E2F" strokeWidth={2.5} fill="url(#gPos)" name="Positive" dot={{ r: 4, fill: '#5A9E2F' }} />
              <Area type="monotone" dataKey="negative" stroke="#DC2626" strokeWidth={2.5} fill="url(#gNeg)" name="Negative" dot={{ r: 4, fill: '#DC2626' }} />
              <Area type="monotone" dataKey="neutral"  stroke="#D97706" strokeWidth={2}   fill="url(#gNeu)" name="Neutral"  dot={{ r: 3 }} strokeDasharray="5 3" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div style={cardStyle}>
          <SectionTitle icon={Brain} title="Sentiment Split" sub={`Dominant: ${dominantSentiment}`} tip="Proportion of positive, negative, and neutral conversations. A healthy portfolio shows mostly positive or neutral." />
          <ResponsiveContainer width="100%" height={230} aria-label="Sentiment distribution donut" role="img">
            <PieChart>
              <Pie data={sentimentDist} cx="50%" cy="50%" innerRadius={58} outerRadius={88} paddingAngle={5} dataKey="value"
                label={({ name, percent }) => percent > 0.08 ? `${(percent * 100).toFixed(0)}%` : ''} labelLine={false}>
                {sentimentDist.map((e, i) => <Cell key={i} fill={SENT_COLORS[e.name.toLowerCase()] || CHART_PALETTE[i]} />)}
              </Pie>
              <Tooltip content={<ChartTip />} />
              <Legend wrapperStyle={{ fontSize: 11, fontWeight: 700 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Row 2: Financial Keywords + Risk Gauge ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 14 }}>
        <div style={cardStyle}>
          <SectionTitle icon={DollarSign} title="Top Financial Keywords" sub="Most mentioned financial entities across all sessions" color="var(--accent-cyan)" tip="These are the financial terms, products, or entities most frequently detected by AI. Higher bars = more mentions." />
          {financialKeywords.length === 0 ? (
            <div style={{ padding: '30px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>No financial entities detected yet.</div>
          ) : (
            <ResponsiveContainer width="100%" height={230} aria-label="Financial keyword frequency bar chart" role="img">
              <BarChart data={financialKeywords} margin={{ top: 4, right: 16, left: -10, bottom: 0 }}>
                <CartesianGrid {...gridStyle} />
                <XAxis dataKey="name" tick={tickStyle} angle={-20} textAnchor="end" height={40} />
                <YAxis tick={tickStyle} allowDecimals={false} />
                <Tooltip content={<ChartTip />} />
                <Bar dataKey="count" name="Mentions" radius={[6, 6, 0, 0]}>
                  {financialKeywords.map((_, i) => <Cell key={i} fill={CHART_PALETTE[i % CHART_PALETTE.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div style={cardStyle}>
          <SectionTitle icon={AlertTriangle} title="Risk Score Gauge" sub="Average risk across all sessions" color="var(--accent-red)" tip="0–35 = Low risk (green), 36–60 = Medium risk (amber), 61–100 = High risk (red). Based on financial risk signals detected in conversations." />
          <RiskGauge score={sentimentStats.avgRisk} />
          <div style={{ display: 'flex', justifyContent: 'center', gap: 14, marginTop: 8 }}>
            {[['Low', '#5A9E2F', '0–35'], ['Med', '#D97706', '36–60'], ['High', '#DC2626', '61–100']].map(([label, color, range]) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 700, color: 'var(--text-muted)' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, display: 'inline-block' }} />
                {label} <span style={{ fontWeight: 500 }}>({range})</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Row 3: Domain + Emotion ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div style={cardStyle}>
          <SectionTitle icon={Layers} title="Domain Distribution" sub="What topics are being discussed?" color="var(--accent-purple)" tip="AI categorises each conversation into a domain (finance, health, legal, etc.). This shows which topics appear most in your recordings." />
          {domainDist.length === 0 ? (
            <div style={{ padding: '30px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>No domain data yet.</div>
          ) : (
            <ResponsiveContainer width="100%" height={200} aria-label="Domain distribution horizontal bar" role="img">
              <BarChart data={domainDist} layout="vertical" margin={{ top: 4, right: 16, left: 10, bottom: 0 }}>
                <CartesianGrid {...gridStyle} horizontal={false} />
                <XAxis type="number" tick={tickStyle} allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={{ ...tickStyle, fill: 'var(--text-secondary)' }} width={72} />
                <Tooltip content={<ChartTip />} />
                <Bar dataKey="value" name="Sessions" radius={[0, 6, 6, 0]}>
                  {domainDist.map((_, i) => <Cell key={i} fill={CHART_PALETTE[i % CHART_PALETTE.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div style={cardStyle}>
          <SectionTitle icon={Brain} title="Emotion Breakdown" sub="Emotional states detected across sessions" color="var(--accent-amber)" tip="AI detects the primary emotion in each conversation (neutral, happy, anxious, angry, etc.). Useful for understanding customer or agent emotional state." />
          {emotionDist.length === 0 ? (
            <div style={{ padding: '30px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>No emotion data yet.</div>
          ) : (
            <ResponsiveContainer width="100%" height={200} aria-label="Emotion breakdown pie chart" role="img">
              <PieChart>
                <Pie data={emotionDist} cx="50%" cy="50%" outerRadius={80} paddingAngle={3} dataKey="value"
                  label={({ name, percent }) => percent > 0.1 ? name : ''} labelLine={false}>
                  {emotionDist.map((_, i) => <Cell key={i} fill={CHART_PALETTE[i % CHART_PALETTE.length]} />)}
                </Pie>
                <Tooltip content={<ChartTip />} />
                <Legend wrapperStyle={{ fontSize: 11, fontWeight: 700 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ── Row 4: Risk Distribution ── */}
      <div style={cardStyle}>
        <SectionTitle icon={BarChart3} title="Risk Distribution" sub="How many sessions fall into each risk category?" color="var(--accent-red)" tip="Low risk = safe conversations. Medium = some financial concerns. High = urgent issues detected (hidden fees, bad investments, EMI risks)." />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
          {riskDist.map(r => (
            <div key={r.name} style={{ background: 'var(--bg-subtle)', border: `1px solid ${r.color}22`, borderRadius: 14, padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{r.name} Risk</div>
              <div style={{ fontSize: 32, fontWeight: 900, color: r.color, letterSpacing: -1 }}>{r.value}</div>
              <div style={{ height: 4, background: 'var(--border)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ width: transcripts.length > 0 ? `${(r.value / transcripts.length) * 100}%` : '0%', height: '100%', background: r.color, borderRadius: 4, transition: 'width 0.8s ease' }} />
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                {transcripts.length > 0 ? `${((r.value / transcripts.length) * 100).toFixed(0)}% of total` : '—'}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Speaker Breakdown ── */}
      <div style={cardStyle}>
        <SectionTitle icon={Users} title="Speaker Breakdown" sub="Click column headers to sort — hover for explanations" tip="Tracks each speaker's contribution: word count, average sentiment score (0=negative, 1=positive), risk mentions, and pending reminders." />
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg-subtle)', borderBottom: '1px solid var(--border)' }}>
                {[
                  ['name',              'Speaker',        'Speaker name'],
                  ['role',              'Role',           'Agent, customer, or analyst'],
                  ['words',             'Words',          'Total words spoken — higher = more talkative'],
                  ['avgSentiment',      'Avg Sentiment',  '0.0 = very negative, 1.0 = very positive'],
                  ['riskContributions', 'Risk Mentions',  'Number of high-risk statements made'],
                  ['reminders',         'Reminders',      'Action items flagged for this speaker'],
                ].map(([col, label, tip]) => (
                  <th key={col} onClick={() => toggleSort(col)}
                    title={tip}
                    style={{ padding: '12px 16px', fontSize: 10, fontWeight: 700, color: sortCol === col ? 'var(--green)' : 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'left', cursor: 'pointer', whiteSpace: 'nowrap', background: sortCol === col ? 'var(--green-bg)' : 'transparent' }}>
                    {label} {sortCol === col ? (sortDir === 'desc' ? '↓' : '↑') : ''}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedSpeakers.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>No speaker data available.</td></tr>
              ) : sortedSpeakers.map((sp, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-subtle)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{sp.name}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ fontSize: 10, fontWeight: 800, background: `${ROLE_COLOR[sp.role] || 'var(--green)'}18`, color: ROLE_COLOR[sp.role] || 'var(--green)', border: `1px solid ${ROLE_COLOR[sp.role] || 'var(--green)'}30`, borderRadius: 7, padding: '3px 9px', textTransform: 'uppercase' }}>{sp.role}</span>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', fontVariantNumeric: 'tabular-nums' }}>{sp.words}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: parseFloat(sp.avgSentiment) > 0.6 ? 'var(--green)' : parseFloat(sp.avgSentiment) < 0.4 ? 'var(--accent-red)' : 'var(--accent-amber)' }}>
                      {sp.avgSentiment}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: sp.riskContributions > 0 ? 'var(--accent-red)' : 'var(--text-muted)' }}>{sp.riskContributions}</td>
                  <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: sp.reminders > 0 ? 'var(--accent-amber)' : 'var(--text-muted)' }}>{sp.reminders}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Reminders Panel ── */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <SectionTitle icon={Bell} title="Active Reminders" sub={`${activeReminders.length} pending action items`} color="var(--accent-amber)" tip="Action items flagged by AI during conversations — things that need follow-up." />
          {onNavigate && (
            <button onClick={() => onNavigate('transcripts')} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>
              View All <ChevronRight size={13} />
            </button>
          )}
        </div>
        {activeReminders.length === 0 ? (
          <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, fontWeight: 600 }}>
            <CheckCircle size={28} color="var(--green)" style={{ marginBottom: 8 }} />
            <div>All reminders resolved!</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {activeReminders.slice(0, 5).map(r => (
              <div key={r.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, background: 'var(--bg-subtle)', border: '1px solid var(--border)', borderRadius: 14, padding: '12px 16px' }}>
                <span style={{ fontSize: 10, fontWeight: 800, background: `${ROLE_COLOR[r.speakerRole] || 'var(--green)'}18`, color: ROLE_COLOR[r.speakerRole] || 'var(--green)', border: `1px solid ${ROLE_COLOR[r.speakerRole] || 'var(--green)'}30`, borderRadius: 7, padding: '3px 8px', textTransform: 'uppercase', flexShrink: 0, marginTop: 1 }}>{r.speakerName}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 3 }}>{r.reminderText}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={10} />{r.timestamp}s · {r.sessionId}</div>
                </div>
                <button onClick={() => resolveReminder(r.id)}
                  style={{ fontSize: 11, fontWeight: 700, color: 'var(--green)', background: 'var(--green-bg)', border: '1px solid var(--green-border)', borderRadius: 8, padding: '4px 10px', cursor: 'pointer', flexShrink: 0, transition: 'all 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--green)'; e.currentTarget.style.color = 'var(--text-inverse)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'var(--green-bg)'; e.currentTarget.style.color = 'var(--green)'; }}>
                  Resolve
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalyticsDashboard;

