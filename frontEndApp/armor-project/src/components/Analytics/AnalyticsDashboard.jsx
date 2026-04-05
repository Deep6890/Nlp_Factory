import React, { useState } from 'react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  RadialBarChart, RadialBar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import {
  Activity, TrendingUp, AlertTriangle, Bell, RefreshCw,
  Users, Brain, DollarSign, CheckCircle, Clock, ChevronRight,
} from 'lucide-react';
import { useData } from '../../context/DataContext';

const C = {
  cream2: '#FAF6E9', limelt: '#DDEB9D', green: '#A0C878', greendk: '#7aaa52',
  text: '#1a2010', textmid: '#4a5a30', textdim: '#8a9a70', shadow: 'rgba(100,140,60,0.11)',
  neg: '#dc2626', med: '#f59e0b', pos: '#A0C878',
};
const card = { background: '#fff', border: '1px solid rgba(160,200,120,0.22)', borderRadius: 20, padding: '22px 24px', boxShadow: `0 2px 16px ${C.shadow}` };
const SENT_COLORS = { positive: C.pos, negative: C.neg, neutral: C.med, mixed: '#8b5cf6' };
const PALETTE = ['#A0C878', '#7aaa52', '#DDEB9D', '#4a5a30', '#c8e6a0', '#5a8a3a', '#f59e0b', '#dc2626', '#8b5cf6', '#06b6d4'];

const Skeleton = () => (
  <div style={{ ...card, display: 'flex', flexDirection: 'column', gap: 12 }}>
    {[80, 60, 100, 40].map((w, i) => (
      <div key={i} style={{ height: 14, width: `${w}%`, background: 'rgba(160,200,120,0.15)', borderRadius: 8, animation: 'pulse 1.5s ease-in-out infinite' }} />
    ))}
    <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
  </div>
);

const MetricCard = ({ icon: Icon, label, value, sub, accent, color, onClick }) => (
  <div style={{ ...card, display: 'flex', flexDirection: 'column', gap: 6, cursor: onClick ? 'pointer' : 'default', transition: 'all 0.2s' }}
    onClick={onClick}
    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.borderColor = C.green; }}
    onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.borderColor = 'rgba(160,200,120,0.22)'; }}>
    <div style={{ width: 38, height: 38, borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', background: accent ? C.limelt : C.cream2, border: `1px solid ${accent ? C.green : 'rgba(160,200,120,0.2)'}`, color: color || C.text, marginBottom: 4 }}>
      <Icon size={17} />
    </div>
    <div style={{ fontSize: 28, fontWeight: 900, color: color || C.text, letterSpacing: -1, fontVariantNumeric: 'tabular-nums' }}>{value}</div>
    <div style={{ fontSize: 13, fontWeight: 700, color: C.textmid }}>{label}</div>
    {sub && <div style={{ fontSize: 11, color: C.textdim, fontWeight: 500 }}>{sub}</div>}
  </div>
);

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
      {label && <div style={{ color: C.textdim, marginBottom: 5, fontSize: 11 }}>{label}</div>}
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color || C.text, display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.color, display: 'inline-block' }} />
          {p.name}: <strong>{typeof p.value === 'number' ? p.value.toLocaleString() : p.value}</strong>
        </div>
      ))}
    </div>
  );
};

// Risk gauge using RadialBarChart
const RiskGauge = ({ score }) => {
  const color = score > 60 ? C.neg : score > 35 ? C.med : C.pos;
  const data = [{ name: 'Risk', value: score, fill: color }];
  return (
    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <ResponsiveContainer width="100%" height={180} aria-label="Risk score gauge" role="img">
        <RadialBarChart cx="50%" cy="80%" innerRadius="60%" outerRadius="90%" startAngle={180} endAngle={0} data={data}>
          <RadialBar dataKey="value" cornerRadius={8} background={{ fill: 'rgba(160,200,120,0.1)' }} />
        </RadialBarChart>
      </ResponsiveContainer>
      <div style={{ position: 'absolute', bottom: 10, textAlign: 'center' }}>
        <div style={{ fontSize: 32, fontWeight: 900, color, letterSpacing: -1, fontVariantNumeric: 'tabular-nums' }}>{score}</div>
        <div style={{ fontSize: 10, fontWeight: 700, color: C.textdim, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Risk Index</div>
      </div>
    </div>
  );
};

const ROLE_COLOR = { agent: '#7aaa52', customer: '#f59e0b', analyst: '#8b5cf6' };

const AnalyticsDashboard = ({ onNavigate }) => {
  const { sentimentStats, trendData, financialKeywords, speakerMetrics, reminderFlags, transcripts, isLoading, refetch, resolveReminder } = useData();
  const [sortCol, setSortCol] = useState('words');
  const [sortDir, setSortDir] = useState('desc');

  if (isLoading) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {[1, 2, 3].map(i => <Skeleton key={i} />)}
    </div>
  );

  // Sentiment donut data
  const sentimentDist = ['positive', 'negative', 'neutral', 'mixed'].map(label => ({
    name: label,
    value: transcripts.filter(t => t.summary.overallSentiment === label).length,
  })).filter(d => d.value > 0);

  const dominantSentiment = sentimentDist.sort((a, b) => b.value - a.value)[0]?.name || 'neutral';

  // Sort speaker table
  const sortedSpeakers = [...speakerMetrics].sort((a, b) => {
    const av = parseFloat(a[sortCol]) || 0;
    const bv = parseFloat(b[sortCol]) || 0;
    return sortDir === 'desc' ? bv - av : av - bv;
  });

  const toggleSort = (col) => {
    if (sortCol === col) setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    else { setSortCol(col); setSortDir('desc'); }
  };

  const thStyle = (col) => ({
    padding: '12px 16px', fontSize: 10, fontWeight: 700, color: sortCol === col ? C.greendk : C.textdim,
    textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'left', cursor: 'pointer', whiteSpace: 'nowrap',
    background: sortCol === col ? 'rgba(160,200,120,0.08)' : 'transparent',
  });

  const activeReminders = reminderFlags.filter(r => !r.resolved);

  return (
    <div style={{ fontFamily: 'Inter,sans-serif', display: 'flex', flexDirection: 'column', gap: 22, color: C.text }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <span style={{ fontSize: 22, fontWeight: 900, letterSpacing: -1 }}>FinSentiq</span>
            <span style={{ fontSize: 11, fontWeight: 700, background: C.limelt, color: C.greendk, border: `1px solid ${C.green}`, borderRadius: 8, padding: '3px 9px' }}>Analytics</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, color: C.greendk }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: C.green, boxShadow: '0 0 0 3px rgba(160,200,120,0.3)', animation: 'gPulse 2s ease-in-out infinite', display: 'inline-block' }} />
              Live
            </span>
          </div>
          <p style={{ fontSize: 13, color: C.textdim, margin: 0 }}>Sentence-level sentiment & financial conversation analysis</p>
        </div>
        <button onClick={refetch} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: C.textmid, background: C.cream2, border: `1px solid rgba(160,200,120,0.28)`, borderRadius: 12, padding: '9px 18px', cursor: 'pointer', transition: 'all 0.2s' }}
          onMouseEnter={e => { e.currentTarget.style.background = C.limelt; e.currentTarget.style.color = C.text; }}
          onMouseLeave={e => { e.currentTarget.style.background = C.cream2; e.currentTarget.style.color = C.textmid; }}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* ── KPI Row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(155px,1fr))', gap: 12 }}>
        <MetricCard icon={Activity}      label="Total Sessions"     value={sentimentStats.total}           accent />
        <MetricCard icon={Brain}         label="Sentiment Score"    value={`${sentimentStats.sentimentScore}%`} sub="positive ratio" color={C.greendk} />
        <MetricCard icon={AlertTriangle} label="Risk Index"         value={sentimentStats.avgRisk}         sub="avg across sessions" color={sentimentStats.avgRisk > 60 ? C.neg : sentimentStats.avgRisk > 35 ? C.med : C.greendk} />
        <MetricCard icon={Bell}          label="Active Reminders"   value={activeReminders.length}         sub="pending action items" color={activeReminders.length > 0 ? C.med : C.greendk} />
        <MetricCard icon={Users}         label="Speakers Tracked"   value={speakerMetrics.length}          sub="across all sessions" />
        <MetricCard icon={DollarSign}    label="Financial Entities" value={financialKeywords.reduce((a, k) => a + k.count, 0)} sub="total mentions" accent />
      </div>

      {/* ── Charts Row 1: Sentiment Trend + Donut ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 14 }}>
        <div style={card}>
          <SectionTitle icon={Activity} title="Sentiment Trend" sub="Daily positive / negative / neutral breakdown" />
          <ResponsiveContainer width="100%" height={220} aria-label="Sentiment trend over time" role="img">
            <AreaChart data={trendData} margin={{ top: 4, right: 16, left: -10, bottom: 0 }} animationDuration={800}>
              <defs>
                {[['gPos', C.pos], ['gNeg', C.neg], ['gNeu', C.med]].map(([id, color]) => (
                  <linearGradient key={id} id={id} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={color} stopOpacity={0} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(160,200,120,0.12)" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: C.textdim }} />
              <YAxis tick={{ fontSize: 11, fill: C.textdim }} allowDecimals={false} />
              <Tooltip content={<Tip />} />
              <Legend wrapperStyle={{ fontSize: 12, fontWeight: 700 }} />
              <Area type="monotone" dataKey="positive" stroke={C.pos} strokeWidth={2.5} fill="url(#gPos)" name="Positive" dot={{ r: 4 }} animationDuration={800} />
              <Area type="monotone" dataKey="negative" stroke={C.neg} strokeWidth={2.5} fill="url(#gNeg)" name="Negative" dot={{ r: 4 }} animationDuration={800} />
              <Area type="monotone" dataKey="neutral"  stroke={C.med} strokeWidth={2}   fill="url(#gNeu)" name="Neutral"  dot={{ r: 3 }} strokeDasharray="5 3" animationDuration={800} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div style={card}>
          <SectionTitle icon={Brain} title="Sentiment Distribution" sub={`Dominant: ${dominantSentiment}`} />
          <ResponsiveContainer width="100%" height={220} aria-label="Sentiment distribution donut" role="img">
            <PieChart>
              <Pie data={sentimentDist} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={4} dataKey="value" animationDuration={800}
                label={({ name, percent }) => percent > 0.08 ? `${(percent * 100).toFixed(0)}%` : ''}
                labelLine={false}>
                {sentimentDist.map((e, i) => <Cell key={i} fill={SENT_COLORS[e.name] || PALETTE[i]} />)}
              </Pie>
              <Tooltip content={<Tip />} />
              <Legend wrapperStyle={{ fontSize: 11, fontWeight: 700 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Charts Row 2: Financial Bar + Risk Gauge ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 14 }}>
        <div style={card}>
          <SectionTitle icon={DollarSign} title="Top Financial Keywords" sub="Most mentioned entities across all sessions" />
          {financialKeywords.length === 0 ? (
            <div style={{ padding: '30px 0', textAlign: 'center', color: C.textdim, fontSize: 13 }}>No financial entities detected yet.</div>
          ) : (
            <ResponsiveContainer width="100%" height={220} aria-label="Financial keyword frequency" role="img">
              <BarChart data={financialKeywords} margin={{ top: 4, right: 16, left: -10, bottom: 0 }} animationDuration={800}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(160,200,120,0.12)" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: C.textdim }} angle={-20} textAnchor="end" height={40} />
                <YAxis tick={{ fontSize: 11, fill: C.textdim }} allowDecimals={false} />
                <Tooltip content={<Tip />} />
                <Bar dataKey="count" name="Mentions" radius={[8, 8, 0, 0]} animationDuration={800}>
                  {financialKeywords.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div style={card}>
          <SectionTitle icon={AlertTriangle} title="Risk Score Gauge" sub="Average across all sessions" />
          <RiskGauge score={sentimentStats.avgRisk} />
          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 8 }}>
            {[['Low', C.pos, '0–35'], ['Med', C.med, '36–60'], ['High', C.neg, '61–100']].map(([label, color, range]) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 700, color: C.textdim }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, display: 'inline-block' }} />
                {label} <span style={{ color: C.textdim, fontWeight: 500 }}>({range})</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Speaker Breakdown Table ── */}
      <div style={card}>
        <SectionTitle icon={Users} title="Speaker Breakdown" sub="Sortable — click column headers" />
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: C.cream2, borderBottom: '1px solid rgba(160,200,120,0.18)' }}>
                {[['name', 'Speaker'], ['role', 'Role'], ['words', 'Words'], ['avgSentiment', 'Avg Sentiment'], ['riskContributions', 'Risk Mentions'], ['reminders', 'Reminders']].map(([col, label]) => (
                  <th key={col} style={thStyle(col)} onClick={() => toggleSort(col)}>
                    {label} {sortCol === col ? (sortDir === 'desc' ? '↓' : '↑') : ''}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedSpeakers.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: '30px', textAlign: 'center', color: C.textdim, fontSize: 13 }}>No speaker data available.</td></tr>
              ) : sortedSpeakers.map((sp, i) => (
                <tr key={i} style={{ borderBottom: '1px solid rgba(160,200,120,0.1)', transition: 'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = C.cream2}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 700, color: C.text }}>{sp.name}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ fontSize: 10, fontWeight: 800, background: `${ROLE_COLOR[sp.role]}22`, color: ROLE_COLOR[sp.role], border: `1px solid ${ROLE_COLOR[sp.role]}44`, borderRadius: 7, padding: '3px 9px', textTransform: 'uppercase' }}>{sp.role}</span>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: C.textmid, fontVariantNumeric: 'tabular-nums' }}>{sp.words}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: parseFloat(sp.avgSentiment) > 0.6 ? C.greendk : parseFloat(sp.avgSentiment) < 0.4 ? C.neg : C.med }}>
                      {sp.avgSentiment}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: sp.riskContributions > 0 ? C.neg : C.textmid }}>{sp.riskContributions}</td>
                  <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: sp.reminders > 0 ? C.med : C.textmid }}>{sp.reminders}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Reminders Panel ── */}
      <div style={card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <SectionTitle icon={Bell} title="Active Reminders" sub={`${activeReminders.length} pending action items`} />
          {onNavigate && (
            <button onClick={() => onNavigate('transcripts')} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700, color: C.textmid, background: 'none', border: 'none', cursor: 'pointer' }}>
              View All <ChevronRight size={13} />
            </button>
          )}
        </div>
        {activeReminders.length === 0 ? (
          <div style={{ padding: '24px 0', textAlign: 'center', color: C.textdim, fontSize: 13, fontWeight: 600 }}>
            <CheckCircle size={28} color={C.green} style={{ marginBottom: 8 }} />
            <div>All reminders resolved!</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {activeReminders.slice(0, 5).map(r => (
              <div key={r.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, background: C.cream2, border: '1px solid rgba(160,200,120,0.18)', borderRadius: 14, padding: '12px 16px' }}>
                <span style={{ fontSize: 10, fontWeight: 800, background: `${ROLE_COLOR[r.speakerRole]}22`, color: ROLE_COLOR[r.speakerRole], border: `1px solid ${ROLE_COLOR[r.speakerRole]}44`, borderRadius: 7, padding: '3px 8px', textTransform: 'uppercase', flexShrink: 0, marginTop: 1 }}>{r.speakerName}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: C.text, marginBottom: 3 }}>{r.reminderText}</div>
                  <div style={{ fontSize: 11, color: C.textdim, display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={10} />{r.timestamp}s · {r.sessionId}</div>
                </div>
                <button onClick={() => resolveReminder(r.id)} style={{ fontSize: 11, fontWeight: 700, color: C.greendk, background: C.limelt, border: `1px solid ${C.green}`, borderRadius: 8, padding: '4px 10px', cursor: 'pointer', flexShrink: 0, transition: 'all 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = C.green; e.currentTarget.style.color = '#fff'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = C.limelt; e.currentTarget.style.color = C.greendk; }}>
                  Resolve
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`@keyframes gPulse{0%,100%{box-shadow:0 0 0 3px rgba(160,200,120,0.3)}50%{box-shadow:0 0 0 6px rgba(160,200,120,0.1)}}`}</style>
    </div>
  );
};

export default AnalyticsDashboard;
