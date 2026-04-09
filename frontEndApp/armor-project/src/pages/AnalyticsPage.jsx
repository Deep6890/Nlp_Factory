import React, { useState } from 'react';
import { BarChart2, FileText, Microscope } from 'lucide-react';
import { DataProvider } from '../context/DataContext';
import AnalyticsDashboard from '../components/AnalyticsDashboard';
import TranscriptsList from '../components/TranscriptsList';
import AnalyticsDeepDive from '../components/AnalyticsDeepDive';

const TABS = [
  { id:'dashboard',   label:'Dashboard',  icon:BarChart2 },
  { id:'transcripts', label:'Transcripts', icon:FileText },
  { id:'deep-dive',   label:'Deep Dive',   icon:Microscope },
];

export default function AnalyticsPage() {
  const [tab, setTab] = useState('dashboard');

  return (
    <DataProvider>
      <div className="flex flex-col gap-5" style={{ color:'var(--text-primary)' }}>
        <div>
          <h1 className="text-2xl font-black tracking-tight mb-1">Analytics</h1>
          <p className="text-sm" style={{ color:'var(--text-muted)' }}>Deep analysis of your financial conversation data</p>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 p-1 rounded-[14px] w-fit" style={{ background:'var(--bg-subtle)', border:'1px solid var(--border)' }}>
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setTab(id)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-[10px] text-sm font-bold transition-all"
              style={{ background: tab===id ? 'var(--green-bg)' : 'transparent', color: tab===id ? 'var(--green)' : 'var(--text-muted)', border: tab===id ? '1px solid var(--green-border)' : '1px solid transparent', cursor:'pointer' }}>
              <Icon size={14} /> {label}
            </button>
          ))}
        </div>

        {tab === 'dashboard'   && <AnalyticsDashboard />}
        {tab === 'transcripts' && <TranscriptsList onSelect={() => {}} />}
        {tab === 'deep-dive'   && <AnalyticsDeepDive />}
      </div>
    </DataProvider>
  );
}

