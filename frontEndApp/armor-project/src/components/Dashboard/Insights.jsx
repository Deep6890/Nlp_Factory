import React, { useState, useEffect } from 'react';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import {
  Activity, TrendingUp, AlertTriangle, Zap, Globe, Tag,
  Loader, RefreshCw, BarChart2, Brain, Shield, DollarSign,
  TrendingDown, CheckCircle, Clock,
} from 'lucide-react';
import { getInsightsSummary } from '../../api/recordings';
import { DUMMY_INSIGHTS_SUMMARY } from '../../data/dummyData';

const C = {
  cream2: '#FAF6E9', limelt: '#DDEB9D', green: '#A0C878', greendk: '#7aaa52',
  text: '#1a2010', textmid: '#4a5a30', textdim: '#8a9a70', shadow: 'rgba(100,140,60,0.11)',
};
const card = { background: '#fff', border: '1px solid rgba(160,200,120,0.22)', borderRadius: 20, padding: '22px 24px', boxShadow: `0 2px 16px ${C.shadow}` };
const PALETTE = ['#A0C878', '#7aaa52', '#DDEB9D', '#4a5a30', '#c8e6a0', '#5a8a3a', '#f59e0b', '#dc2626'];
const RISK_COLOR = { Low: '#A0C878', Medium: '#f59e0b', High: '#dc2626' };
const URGENCY_COLOR = { Low: '#A0C878', Medium: '#f59e0b', High: '#dc2626' };

const StatCard = ({ icon: Icon, label, value, sub, accent, color }) => (
  <div style={{ ...card, display: 'flex', flexDirection: 'column', gap: 6 }}
    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.borderColor = C.green; }}
    onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.borderColor = 'rgba(160,200,120,0.22)'; }}
  >
    <div style={{ width: 38, height: 38, borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', background: accent ? C.limelt : C.cream2, border: `1px solid ${accent ? C.green : 'rgba(160,200,120,0.2)'}`, color: color || C.text, marginBottom: 4, transition: 'all 0.2s' }}>
      <Icon size={17} />
    </div>
    <div style={{ fontSize: 28, fontWeight: 900, color: color || C.text, letterSpacing: -1 }}>{value}</div>
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

const RENDER_LABEL = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }) => {
  if (percent < 0.08) return null;
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.6;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="#fff" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={800}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

const Insights = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [usingDummy, setUsingDummy] = useState(false);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getInsightsSummary();
      const s = data.summary ?? data;
      if (!s || s.totalTranscripts === 0) {
        setSummary(DUMMY_INSIGHTS_SUMMARY);
        setUsingDummy(true);
      } else {
        setSummary(s);
        setUsingDummy(false);
      }
    } catch {
      setSummary(DUMMY_INSIGHTS_SUMMARY);
      setUsingDummy(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 80, gap: 12, color: C.textdim, flexDirection: 'column', fontFamily: 'Inter,sans-serif' }}>
      <Loader size={22} style={{ animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <span style={{ fontSize: 13, fontWeight: 600 }}>Analysing your sessions…</span>
    </div>
  );

  const s = summary;
  const riskPie = [
    { name: 'Low', value: s.riskCounts?.low || 0 },
    { name: 'Medium', value: s.riskCounts?.medium || 0 },
    { name: 'High', value: s.riskCounts?.high || 0 },
  ].filter(d => d.value > 0);

  const urgencyPie = [
    { name: 'Low', value: s.urgencyCounts?.low || 0 },
    { name: 'Medium', value: s.urgencyCounts?.medium || 0 },
    { name: 'High', value: s.urgencyCounts?.high || 0 },
  ].filter(d => d.value > 0);

  const coveragePct = s.totalTranscripts > 0 ? Math.round(s.totalWithInsights / s.totalTranscripts * 100) : 0;
  const financePct  = s.totalTranscripts > 0 ? Math.round(s.financeCount / s.totalTranscripts * 100) : 0;

  // Radar data from domain
  const radarData = (s.domainData || []).slice(0, 6).map(d => ({ subject: d.name.replace('_', ' '), value: d.value }));

  return (
    <div style={{ fontFamily: 'Inter,sans-serif', display: 'flex', flexDirection: 'column', gap: 22, color: C.text }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 'clamp(22px,3vw,30px)', fontWeight: 900, letterSpacing: -1, margin: 0 }}>Financial Insights</h1>
          <p style={{ fontSize: 13, color: C.textdim, marginTop: 4, margin: 0 }}>AI-powered analysis across all your conversations</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {usingDummy && (
            <span style={{ fontSize: 11, fontWeight: 700, background: C.limelt, color: C.greendk, border: `1px solid ${C.green}`, borderRadius: 8, padding: '4px 10px' }}>
              📊 Sample Data
            </span>
          )}
          <button onClick={load} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: C.textmid, background: C.cream2, border: `1px solid rgba(160,200,120,0.28)`, borderRadius: 12, padding: '9px 18px', cursor: 'pointer', transition: 'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.background = C.limelt; e.currentTarget.style.color = C.text; }}
            onMouseLeave={e => { e.currentTarget.style.background = C.cream2; e.currentTarget.style.color = C.textmid; }}>
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(155px,1fr))', gap: 12 }}>
        <StatCard icon={Activity}      label="Total Sessions"    value={s.totalTranscripts}  accent />
        <StatCard icon={Brain}         label="AI Analysed"       value={s.totalWithInsights} sub={`${coveragePct}% coverage`} />
        <StatCard icon={DollarSign}    label="Finance Detected"  value={s.financeCount}      sub={`${financePct}% of sessions`} accent />
        <StatCard icon={AlertTriangle} label="High Risk"         value={s.riskCounts?.high || 0}     sub="sessions flagged" color="#dc2626" />
        <StatCard icon={Zap}           label="High Urgency"      value={s.urgencyCounts?.high || 0}  sub="need attention"   color="#f59e0b" />
        <StatCard icon={CheckCircle}   label="Low Risk"          value={s.riskCounts?.low || 0}      sub="sessions safe"    color={C.greendk} />
      </div>

      {/* ── Sentiment Timeline ── */}
      {s.sentimentTimeline?.length > 0 && (
        <div style={card}>
          <SectionTitle icon={Activity} title="Sentiment Over Time" sub="Daily emotional tone across all conversations" />
          <ResponsiveContainer width="100%" height={230}>
            <AreaChart data={s.sentimentTimeline} margin={{ top: 4, right: 16, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="gPos" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#A0C878" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#A0C878" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gNeg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#dc2626" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#dc2626" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gNeu" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(160,200,120,0.12)" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: C.textdim }} />
              <YAxis tick={{ fontSize: 11, fill: C.textdim }} allowDecimals={false} />
              <Tooltip content={<Tip />} />
              <Legend wrapperStyle={{ fontSize: 12, fontWeight: 700 }} />
              <Area type="monotone" dataKey="positive" stroke="#A0C878" strokeWidth={2.5} fill="url(#gPos)" name="Positive" dot={{ r: 4, fill: '#A0C878' }} />
              <Area type="monotone" dataKey="negative" stroke="#dc2626" strokeWidth={2.5} fill="url(#gNeg)" name="Negative" dot={{ r: 4, fill: '#dc2626' }} />
              <Area type="monotone" dataKey="neutral"  stroke="#f59e0b" strokeWidth={2}   fill="url(#gNeu)" name="Neutral"  dot={{ r: 3, fill: '#f59e0b' }} strokeDasharray="5 3" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ── Risk + Urgency Pies ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 14 }}>
        {riskPie.length > 0 && (
          <div style={card}>
            <SectionTitle icon={Shield} title="Risk Distribution" sub="Across all sessions" />
            <ResponsiveContainer width="100%" height={210}>
              <PieChart>
                <Pie data={riskPie} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={4} dataKey="value" labelContent={RENDER_LABEL}>
                  {riskPie.map((e, i) => <Cell key={i} fill={RISK_COLOR[e.name] || PALETTE[i]} />)}
                </Pie>
                <Tooltip content={<Tip />} />
                <Legend wrapperStyle={{ fontSize: 12, fontWeight: 700 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {urgencyPie.length > 0 && (
          <div style={card}>
            <SectionTitle icon={Zap} title="Urgency Distribution" sub="How time-sensitive are sessions" />
            <ResponsiveContainer width="100%" height={210}>
              <PieChart>
                <Pie data={urgencyPie} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={4} dataKey="value" labelContent={RENDER_LABEL}>
                  {urgencyPie.map((e, i) => <Cell key={i} fill={URGENCY_COLOR[e.name] || PALETTE[i]} />)}
                </Pie>
                <Tooltip content={<Tip />} />
                <Legend wrapperStyle={{ fontSize: 12, fontWeight: 700 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Domain Radar */}
        {radarData.length > 2 && (
          <div style={card}>
            <SectionTitle icon={Globe} title="Domain Radar" sub="Financial topic coverage" />
            <ResponsiveContainer width="100%" height={210}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="rgba(160,200,120,0.2)" />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: C.textdim, fontWeight: 700 }} />
                <Radar name="Sessions" dataKey="value" stroke={C.greendk} fill={C.green} fillOpacity={0.35} strokeWidth={2} />
                <Tooltip content={<Tip />} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* ── Domain Bar ── */}
      {s.domainData?.length > 0 && (
        <div style={card}>
          <SectionTitle icon={Globe} title="Domain Breakdown" sub="Which financial topics come up most in your conversations" />
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={s.domainData} margin={{ top: 4, right: 16, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(160,200,120,0.12)" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: C.textdim }} />
              <YAxis tick={{ fontSize: 11, fill: C.textdim }} allowDecimals={false} />
              <Tooltip content={<Tip />} />
              <Bar dataKey="value" name="Sessions" radius={[8, 8, 0, 0]}>
                {s.domainData.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ── Emotion + Intent ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 14 }}>
        {s.emotionData?.length > 0 && (
          <div style={card}>
            <SectionTitle icon={Activity} title="Emotion Breakdown" sub="Detected emotions across sessions" />
            <ResponsiveContainer width="100%" height={210}>
              <BarChart data={s.emotionData} layout="vertical" margin={{ top: 4, right: 20, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(160,200,120,0.12)" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: C.textdim }} allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: C.textdim }} width={72} />
                <Tooltip content={<Tip />} />
                <Bar dataKey="value" name="Count" radius={[0, 8, 8, 0]}>
                  {s.emotionData.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {s.intentData?.length > 0 && (
          <div style={card}>
            <SectionTitle icon={BarChart2} title="Intent Breakdown" sub="What users are trying to accomplish" />
            <ResponsiveContainer width="100%" height={210}>
              <BarChart data={s.intentData} layout="vertical" margin={{ top: 4, right: 20, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(160,200,120,0.12)" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: C.textdim }} allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: C.textdim }} width={120} />
                <Tooltip content={<Tip />} />
                <Bar dataKey="value" name="Count" radius={[0, 8, 8, 0]}>
                  {s.intentData.map((_, i) => <Cell key={i} fill={PALETTE[(i + 2) % PALETTE.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* ── Top Keywords ── */}
      {s.topKeywords?.length > 0 && (
        <div style={card}>
          <SectionTitle icon={Tag} title="Top Keywords" sub="Most frequent financial terms across all sessions" />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {s.topKeywords.map(({ word, count }, i) => {
              const size = i === 0 ? 15 : i < 3 ? 13 : 12;
              return (
                <div key={word} style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  background: i < 3 ? C.limelt : C.cream2,
                  border: `1px solid ${i < 3 ? C.green : 'rgba(160,200,120,0.25)'}`,
                  borderRadius: 10, padding: `${i < 3 ? 6 : 4}px ${i < 3 ? 14 : 11}px`,
                  fontSize: size, fontWeight: 700, color: C.text,
                  transition: 'all 0.2s', cursor: 'default',
                }}
                  onMouseEnter={e => { e.currentTarget.style.background = C.limelt; e.currentTarget.style.borderColor = C.green; }}
                  onMouseLeave={e => { e.currentTarget.style.background = i < 3 ? C.limelt : C.cream2; e.currentTarget.style.borderColor = i < 3 ? C.green : 'rgba(160,200,120,0.25)'; }}>
                  {word}
                  <span style={{ fontSize: 10, fontWeight: 800, color: C.textdim, background: '#fff', borderRadius: 6, padding: '1px 6px', border: '1px solid rgba(160,200,120,0.2)' }}>{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Recent Alerts from insights ── */}
      <div style={card}>
        <SectionTitle icon={AlertTriangle} title="Recent Flags" sub="Sessions that need your attention" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            { label: 'High EMI burden detected', sub: 'EMI Discussion · Apr 4', level: 'HIGH', color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
            { label: 'Loan rejected — low CIBIL score', sub: 'Loan Rejection · Mar 29', level: 'HIGH', color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
            { label: 'Investment problem before SIP', sub: 'SIP Planning · Apr 5', level: 'MED', color: '#92400e', bg: '#fefce8', border: '#fde68a' },
            { label: 'Stock exit decision pending', sub: 'Stock Market · Mar 31', level: 'MED', color: '#92400e', bg: '#fefce8', border: '#fde68a' },
          ].map((a, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, background: C.cream2, border: '1px solid rgba(160,200,120,0.18)', borderRadius: 14, padding: '12px 16px' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: a.color, flexShrink: 0, boxShadow: `0 0 0 3px ${a.bg}` }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{a.label}</div>
                <div style={{ fontSize: 11, color: C.textdim, marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={10} />{a.sub}</div>
              </div>
              <span style={{ fontSize: 10, fontWeight: 800, background: a.bg, color: a.color, border: `1px solid ${a.border}`, borderRadius: 7, padding: '3px 9px' }}>{a.level}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Insights;
